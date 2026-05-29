import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, usersTable, couplesTable, vendorAccountsTable } from "@workspace/db";

export const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || "mariage-afro-jwt-secret-change-me";

export interface AuthedRequest extends Request {
  userId: string;
  userDbId: number;
  userRole: string;
  coupleId?: number;
  vendorAccountId?: number;
}

function extractToken(req: Request): string | null {
  const cookie = req.cookies?.ma_token;
  if (cookie) return cookie;
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function requireClientAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const raw = extractToken(req);
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

  const userDbId = Number(payload.sub);
  const [user] = await db.select({ id: usersTable.id, email: usersTable.email, role: usersTable.role })
    .from(usersTable).where(eq(usersTable.id, userDbId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Utilisateur introuvable" });
    return;
  }
  if (user.role !== "client") {
    res.status(403).json({ error: "Accès réservé aux couples" });
    return;
  }

  let [couple] = await db.select({ id: couplesTable.id })
    .from(couplesTable).where(eq(couplesTable.userId, String(userDbId))).limit(1);
  if (!couple) {
    const inserted = await db.insert(couplesTable).values({
      userId: String(userDbId),
      email: user.email,
      partner1Name: "",
      partner2Name: "",
    }).onConflictDoNothing().returning({ id: couplesTable.id });
    if (inserted.length > 0) {
      couple = inserted[0];
    } else {
      [couple] = await db.select({ id: couplesTable.id })
        .from(couplesTable).where(eq(couplesTable.userId, String(userDbId))).limit(1);
    }
  }

  const r = req as AuthedRequest;
  r.userId = String(userDbId);
  r.userDbId = userDbId;
  r.userRole = user.role;
  r.coupleId = couple?.id;
  next();
}

export async function requireVendorAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const raw = extractToken(req);
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

  const userDbId = Number(payload.sub);
  const [user] = await db.select({ id: usersTable.id, email: usersTable.email, role: usersTable.role })
    .from(usersTable).where(eq(usersTable.id, userDbId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Utilisateur introuvable" });
    return;
  }
  if (user.role !== "vendor") {
    res.status(403).json({ error: "Accès réservé aux prestataires" });
    return;
  }

  let [account] = await db.select({ id: vendorAccountsTable.id })
    .from(vendorAccountsTable).where(eq(vendorAccountsTable.userId, String(userDbId))).limit(1);
  if (!account) {
    const inserted = await db.insert(vendorAccountsTable)
      .values({ userId: String(userDbId), email: user.email })
      .onConflictDoNothing().returning({ id: vendorAccountsTable.id });
    if (inserted.length > 0) {
      account = inserted[0];
    } else {
      [account] = await db.select({ id: vendorAccountsTable.id })
        .from(vendorAccountsTable).where(eq(vendorAccountsTable.userId, String(userDbId))).limit(1);
    }
  }

  const r = req as AuthedRequest;
  r.userId = String(userDbId);
  r.userDbId = userDbId;
  r.userRole = user.role;
  r.vendorAccountId = account?.id;
  next();
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const raw = extractToken(req);
  if (!raw) { next(); return; }
  try {
    const payload = jwt.verify(raw, JWT_SECRET) as { sub: string; role: string };
    const r = req as AuthedRequest;
    r.userId = payload.sub;
    r.userDbId = Number(payload.sub);
    r.userRole = payload.role;
  } catch {
  }
  next();
}
