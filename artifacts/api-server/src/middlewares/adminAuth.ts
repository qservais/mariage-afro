import type { Request, Response, NextFunction } from "express";

export const ADMIN_COOKIE = "mariage_afro_admin";

export function isAuthed(req: Request): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const value = req.signedCookies?.[ADMIN_COOKIE];
  return value === "ok";
}

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  if (!process.env.ADMIN_PASSWORD) {
    res.status(503).type("html").send(
      "<h1>Admin non configuré</h1><p>La variable d'environnement <code>ADMIN_PASSWORD</code> doit être définie.</p>"
    );
    return;
  }
  if (!isAuthed(req)) {
    res.redirect("/admin/login");
    return;
  }
  next();
}

export function adminAuthJson(req: Request, res: Response, next: NextFunction): void {
  if (!process.env.ADMIN_PASSWORD) {
    res.status(503).json({ error: "ADMIN_PASSWORD not configured" });
    return;
  }
  if (!isAuthed(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
