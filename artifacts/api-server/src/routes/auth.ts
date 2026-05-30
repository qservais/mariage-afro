import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, usersTable, couplesTable, vendorAccountsTable } from "@workspace/db";
import { notifyAuthEmail } from "../lib/email";
import { logger } from "../lib/logger";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || "mariage-afro-jwt-secret-change-me";
const JWT_EXPIRES = "30d";
const BCRYPT_ROUNDS = 12;
const isProd = process.env.NODE_ENV === "production";

function signToken(userId: number, role: string): string {
  return jwt.sign({ sub: String(userId), role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function setAuthCookie(res: Response, token: string): void {
  res.cookie("ma_token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function clearAuthCookie(res: Response): void {
  res.cookie("ma_token", "", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 0,
    path: "/",
  });
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  role: z.enum(["client", "vendor"]).default("client"),
});

router.post("/auth/register", async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Données invalides" });
    return;
  }
  const { email, password, role } = parsed.data;
  const emailLower = email.toLowerCase().trim();

  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, emailLower)).limit(1);
  if (existing) {
    res.status(409).json({ error: "Un compte existe déjà avec cet email" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const verifyToken = nanoid(32);
  const verifyTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [user] = await db.insert(usersTable).values({
    email: emailLower,
    passwordHash,
    role,
    emailVerified: false,
    verifyToken,
    verifyTokenExpiresAt,
  }).returning();

  void notifyAuthEmail("verify", { email: emailLower, token: verifyToken }, req.log).catch((err) =>
    logger.warn({ err }, "Failed to send verification email"),
  );

  const token = signToken(user.id, role);
  setAuthCookie(res, token);
  res.status(201).json({ id: user.id, email: user.email, role: user.role, emailVerified: user.emailVerified, token });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  expectedRole: z.enum(["client", "vendor"]).optional(),
});

router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email ou mot de passe invalide" });
    return;
  }
  const { email, password, expectedRole } = parsed.data;
  const emailLower = email.toLowerCase().trim();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, emailLower)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Email ou mot de passe incorrect" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Email ou mot de passe incorrect" });
    return;
  }

  if (expectedRole && user.role !== expectedRole) {
    const msg =
      expectedRole === "vendor"
        ? "Ce compte est un espace couple. Connectez-vous depuis l'espace marié·e."
        : "Ce compte est un espace prestataire. Connectez-vous depuis l'espace pro.";
    res.status(403).json({ error: msg });
    return;
  }

  const token = signToken(user.id, user.role);
  setAuthCookie(res, token);
  res.json({ id: user.id, email: user.email, role: user.role, emailVerified: user.emailVerified, token });
});

router.post("/auth/logout", (_req: Request, res: Response): void => {
  clearAuthCookie(res);
  res.status(204).send();
});

router.get("/auth/me", async (req: Request, res: Response): Promise<void> => {
  const raw = req.cookies?.ma_token ?? (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
  if (!raw) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }
  let payload: { sub: string; role: string };
  try {
    payload = jwt.verify(raw, JWT_SECRET) as { sub: string; role: string };
  } catch {
    res.status(401).json({ error: "Session expirée" });
    return;
  }
  const [user] = await db.select({ id: usersTable.id, email: usersTable.email, role: usersTable.role, emailVerified: usersTable.emailVerified })
    .from(usersTable).where(eq(usersTable.id, Number(payload.sub))).limit(1);
  if (!user) {
    res.status(401).json({ error: "Utilisateur introuvable" });
    return;
  }
  res.json(user);
});

router.get("/auth/verify-email", async (req: Request, res: Response): Promise<void> => {
  const token = String(req.query.token ?? "");
  if (!token) {
    res.status(400).json({ error: "Token manquant" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.verifyToken, token)).limit(1);
  if (!user || !user.verifyTokenExpiresAt || user.verifyTokenExpiresAt < new Date()) {
    res.status(400).json({ error: "Lien invalide ou expiré" });
    return;
  }
  await db.update(usersTable).set({ emailVerified: true, verifyToken: null, verifyTokenExpiresAt: null, updatedAt: new Date() }).where(eq(usersTable.id, user.id));
  const basePath = process.env.APP_BASE_URL || "";
  res.redirect(`${basePath}/espace-client?verified=1`);
});

const forgotSchema = z.object({ email: z.string().email() });

router.post("/auth/forgot-password", async (req: Request, res: Response): Promise<void> => {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) {
    res.json({ ok: true });
    return;
  }
  const emailLower = parsed.data.email.toLowerCase().trim();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, emailLower)).limit(1);
  if (user) {
    const resetToken = nanoid(32);
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await db.update(usersTable).set({ resetToken, resetTokenExpiresAt, updatedAt: new Date() }).where(eq(usersTable.id, user.id));
    void notifyAuthEmail("reset", { email: emailLower, token: resetToken }, req.log).catch((err) =>
      logger.warn({ err }, "Failed to send reset email"),
    );
  }
  res.json({ ok: true });
});

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

router.post("/auth/reset-password", async (req: Request, res: Response): Promise<void> => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Données invalides" });
    return;
  }
  const { token, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.resetToken, token)).limit(1);
  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    res.status(400).json({ error: "Lien invalide ou expiré" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await db.update(usersTable).set({ passwordHash, resetToken: null, resetTokenExpiresAt: null, updatedAt: new Date() }).where(eq(usersTable.id, user.id));
  res.json({ ok: true });
});

export { signToken, JWT_SECRET };
export default router;
