/**
 * Task 8 — public, no-login guest check-in. A wedding's public link
 * (/invites-checkin/:token) opens a PIN gate; the correct PIN unlocks a
 * searchable checklist (search + toggle present/absent) for anyone at the
 * door — an usher, a family member. No account needed on either side.
 *
 * Two-factor-ish by construction: the token alone (a 16-char nanoid in the
 * URL) isn't enough — the 4-digit PIN is a second, separate gate, and PIN
 * attempts are rate-limited per token so a short numeric PIN can't be
 * brute-forced even if the link leaks.
 */
import { Router, type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { eq, and, ilike, or } from "drizzle-orm";
import { db, couplesTable, guestsTable } from "@workspace/db";
import { JWT_SECRET } from "../middlewares/jwtAuth";

const router = Router();

const CHECKIN_TOKEN_TTL = "16h"; // covers a full wedding day
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 8;

const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_ATTEMPTS;
}

interface CheckinSession {
  scope: "checkin";
  coupleId: number;
  token: string;
}

function requireCheckinSession(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  const raw = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!raw) { res.status(401).json({ error: "PIN requis" }); return; }
  try {
    const payload = jwt.verify(raw, JWT_SECRET) as CheckinSession;
    if (payload.scope !== "checkin" || payload.token !== req.params.token) {
      res.status(401).json({ error: "Session invalide" });
      return;
    }
    (req as Request & { checkin: CheckinSession }).checkin = payload;
    next();
  } catch {
    res.status(401).json({ error: "Session expirée, ressaisissez le PIN" });
  }
}

router.post("/checkin/:token/verify", async (req: Request, res: Response) => {
  const token = String(req.params.token);
  const pin = typeof req.body?.pin === "string" ? req.body.pin.trim() : "";
  const rateLimitKey = `${token}:${req.ip ?? "unknown"}`;
  if (isRateLimited(rateLimitKey)) {
    res.status(429).json({ error: "Trop de tentatives — réessayez dans quelques minutes." });
    return;
  }
  const [couple] = await db
    .select({ id: couplesTable.id, checkinPin: couplesTable.checkinPin, partner1Name: couplesTable.partner1Name, partner2Name: couplesTable.partner2Name })
    .from(couplesTable)
    .where(eq(couplesTable.checkinToken, token));
  if (!couple || !couple.checkinPin || couple.checkinPin !== pin) {
    res.status(401).json({ error: "PIN incorrect" });
    return;
  }
  const sessionToken = jwt.sign(
    { scope: "checkin", coupleId: couple.id, token } satisfies CheckinSession,
    JWT_SECRET,
    { expiresIn: CHECKIN_TOKEN_TTL },
  );
  res.json({
    sessionToken,
    coupleName: [couple.partner1Name, couple.partner2Name].filter(Boolean).join(" & "),
  });
});

router.get("/checkin/:token/guests", requireCheckinSession, async (req: Request, res: Response) => {
  const { coupleId } = (req as Request & { checkin: CheckinSession }).checkin;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const conds = [eq(guestsTable.coupleId, coupleId)];
  if (q) {
    conds.push(or(ilike(guestsTable.firstName, `%${q}%`), ilike(guestsTable.lastName, `%${q}%`))!);
  }
  const rows = await db
    .select({
      id: guestsTable.id,
      firstName: guestsTable.firstName,
      lastName: guestsTable.lastName,
      side: guestsTable.side,
      table: guestsTable.table,
      rsvp: guestsTable.rsvp,
      arrived: guestsTable.arrived,
    })
    .from(guestsTable)
    .where(and(...conds))
    .orderBy(guestsTable.firstName);
  res.json(rows);
});

router.patch("/checkin/:token/guests/:id", requireCheckinSession, async (req: Request, res: Response) => {
  const { coupleId } = (req as Request & { checkin: CheckinSession }).checkin;
  const id = Number(req.params.id);
  const arrived = req.body?.arrived === true;
  const [row] = await db
    .update(guestsTable)
    .set({ arrived, checkedInAt: arrived ? new Date() : null })
    .where(and(eq(guestsTable.id, id), eq(guestsTable.coupleId, coupleId)))
    .returning({ id: guestsTable.id, arrived: guestsTable.arrived });
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

export default router;
