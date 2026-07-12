/**
 * CSRF protection for admin HTML forms (double-submit signed-cookie pattern).
 *
 * Defense layers:
 *  1. The admin session cookie already has sameSite:"lax", which blocks
 *     cross-site form POSTs in all modern browsers.
 *  2. This middleware adds a synchronized token as a second, defense-in-depth
 *     layer: every rendered admin page embeds the token in a <meta> tag; a
 *     JS auto-injector adds it as a hidden _csrf input before form submission;
 *     every POST route validates the token against the signed cookie.
 *
 * XHR/JSON POST routes (subscriptions activate/cancel, upload-photo) are
 * excluded via the skipCsrf() helper since they are not plain form POSTs.
 */
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

const CSRF_COOKIE = "__xcsrf";
export const CSRF_FIELD = "_csrf";

// Must match the admin session cookie's sameSite/maxAge (see ADMIN_COOKIE's
// COOKIE_OPTS in routes/admin.ts) — a shorter-lived CSRF cookie than the
// session it protects causes 403s on saves for any admin whose session
// outlives the CSRF cookie (e.g. an edit page left open past the old 4h
// expiry, or working across a login that's hours old). "strict" was also
// stricter than the session cookie's "lax" for no functional benefit here.
const COOKIE_OPTS = {
  httpOnly: true,
  signed: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/admin",
};

/**
 * Generate (or reuse) a CSRF token for the current session.
 * Call this in GET handlers that serve pages with forms, then pass the
 * returned token to layout() / contentLayout().
 */
export function generateCsrfToken(req: Request, res: Response): string {
  const existing = req.signedCookies?.[CSRF_COOKIE];
  if (typeof existing === "string" && existing.length === 36) {
    return existing;
  }
  const token = crypto.randomUUID();
  res.cookie(CSRF_COOKIE, token, COOKIE_OPTS);
  return token;
}

/**
 * Express middleware: rejects POST requests whose _csrf body field does not
 * match the signed cookie. Safe to apply globally to the admin router — it
 * skips GET requests automatically and honours the skipCsrf() exclusions.
 */
export function requireCsrf(req: Request, res: Response, next: NextFunction): void {
  if (req.method !== "POST") { next(); return; }

  // Allow JSON API endpoints (Content-Type: application/json) and the raw-body
  // upload endpoint — both are same-origin XHR, not HTML form submissions.
  if (req.is("application/json") || req.path.endsWith("/upload-photo")) {
    next();
    return;
  }

  const bodyToken = typeof req.body?.[CSRF_FIELD] === "string"
    ? (req.body[CSRF_FIELD] as string)
    : "";
  const cookieToken = typeof req.signedCookies?.[CSRF_COOKIE] === "string"
    ? (req.signedCookies[CSRF_COOKIE] as string)
    : "";

  if (
    bodyToken.length > 0 &&
    cookieToken.length > 0 &&
    bodyToken.length === cookieToken.length &&
    crypto.timingSafeEqual(Buffer.from(bodyToken, "utf8"), Buffer.from(cookieToken, "utf8"))
  ) {
    next();
    return;
  }

  res.status(403).type("html").send(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Erreur CSRF</title></head><body style="font-family:sans-serif;padding:40px"><h1>Erreur 403 — Token CSRF invalide</h1><p>La requête a été rejetée par mesure de sécurité. <a href="javascript:history.back()">Retour</a></p></body></html>`,
  );
}

/**
 * Inline JS snippet to embed in admin page heads.
 * Reads the CSRF token from <meta name="csrf-token"> and adds a hidden
 * _csrf input to every form before it is submitted.
 */
export const csrfAutoInjectorScript = `
(function(){
  var m=document.querySelector('meta[name="csrf-token"]');
  if(!m)return;
  var t=m.getAttribute('content');
  if(!t)return;
  document.addEventListener('submit',function(e){
    var f=e.target;
    if(!f||typeof f.method!=='string')return;
    if(f.method.toUpperCase()!=='POST')return;
    if(f.querySelector('[name="${CSRF_FIELD}"]'))return;
    var i=document.createElement('input');
    i.type='hidden';i.name='${CSRF_FIELD}';i.value=t;
    f.appendChild(i);
  },true);
})();
`.trim();
