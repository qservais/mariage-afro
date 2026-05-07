/**
 * E2E spec — BLOC C: Espace prestataire.
 *
 * Deux niveaux de couverture :
 *
 * 1. Niveau UI (sans auth) — routes /espace-pro/* redirigent vers login,
 *    pas de crash serveur.
 *
 * 2. Niveau API — 401 sans token sur tous les endpoints protégés.
 *    CRUD complet si CLERK_TEST_TOKEN_VENDOR est défini.
 *
 * Fix validé : INSERT vendor_accounts ON CONFLICT DO NOTHING
 * (évite la race condition au premier login concurrent).
 */
import { chromium } from "playwright";
import { BASE, exit } from "./_helpers.mjs";

const API = process.env.API_BASE_URL ?? "http://localhost:8080";
const TEST_TOKEN = process.env.CLERK_TEST_TOKEN_VENDOR ?? null;
const DESKTOP = { width: 1280, height: 720 };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: DESKTOP });
const page = await ctx.newPage();

const results = [];
const check = (label, cond) => {
  if (cond) console.log(`  ✓ ${label}`);
  else { console.error(`  ✗ ${label}`); results.push(label); }
};

// ── 1. Routes protégées → redirect sans crash ─────────────────────────────────
console.log("\n[1] Routes prestataire — redirect vers login Clerk si non authentifié");
const protectedRoutes = [
  "/espace-pro",
  "/espace-pro/profile",
  "/espace-pro/gallery",
  "/espace-pro/services",
  "/espace-pro/agenda",
  "/espace-pro/leads",
  "/espace-pro/messages",
  "/espace-pro/settings",
];
for (const route of protectedRoutes) {
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(300);
  const url = page.url();
  const isLoginRedirect = url.includes("sign-in") || url.includes("clerk") ||
    url.includes("login") || url.includes("espace-pro/login");
  const noServerError = !(await page.locator("text=Internal Server Error").isVisible({ timeout: 500 }).catch(() => false));
  const no500 = !(await page.locator("text=500").isVisible({ timeout: 500 }).catch(() => false));
  check(`${route} → login redirect ou charge sans crash`, (isLoginRedirect || noServerError) && no500);
}

// ── 2. API — 401 sans token ────────────────────────────────────────────────────
console.log("\n[2] API prestataire — 401 sans token");
const protectedApis = [
  { method: "GET", path: "/api/vendor/me" },
  { method: "POST", path: "/api/vendor/onboarding" },
  { method: "GET", path: "/api/vendor/profile" },
  { method: "PATCH", path: "/api/vendor/profile" },
  { method: "GET", path: "/api/vendor/leads" },
  { method: "GET", path: "/api/vendor/leads/unseen-count" },
  { method: "GET", path: "/api/vendor/conversations" },
];
for (const { method, path } of protectedApis) {
  const resp = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method !== "GET" ? JSON.stringify({}) : undefined,
  });
  check(`${method} ${path} → 401 sans token`, resp.status === 401);
}

// ── 3. API prestataire — avec token de test (si disponible) ───────────────────
if (TEST_TOKEN) {
  console.log("\n[3] API prestataire — CRUD authentifié (CLERK_TEST_TOKEN_VENDOR défini)");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${TEST_TOKEN}`,
  };

  // GET /api/vendor/me
  const meResp = await fetch(`${API}/api/vendor/me`, { headers });
  check("GET /api/vendor/me → 200", meResp.status === 200);
  const me = await meResp.json().catch(() => null);
  check("GET /api/vendor/me → {account}", !!me?.account);

  // POST /api/vendor/onboarding (crée ou met à jour)
  const onboardResp = await fetch(`${API}/api/vendor/onboarding`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      businessName: "Test Pro BLOC C",
      contactName: "Contact Test",
      email: "vendor-bloc-c-token@example.com",
      category: "Photographe",
      city: "Bruxelles",
      description: "Test E2E automatisé BLOC C",
    }),
  });
  check("POST /api/vendor/onboarding → 200", onboardResp.status === 200);
  const onboard = await onboardResp.json().catch(() => null);
  check("POST /api/vendor/onboarding → account.businessName correct",
    onboard?.account?.businessName === "Test Pro BLOC C");

  // PATCH /api/vendor/profile
  const profileResp = await fetch(`${API}/api/vendor/profile`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ tagline: "Tagline test E2E" }),
  });
  check("PATCH /api/vendor/profile → 200", profileResp.status === 200);

  // GET /api/vendor/leads
  const leadsResp = await fetch(`${API}/api/vendor/leads`, { headers });
  check("GET /api/vendor/leads → 200", leadsResp.status === 200);
  const leads = await leadsResp.json().catch(() => null);
  check("GET /api/vendor/leads → array", Array.isArray(leads));

  // GET /api/vendor/leads/unseen-count
  const unseenResp = await fetch(`${API}/api/vendor/leads/unseen-count`, { headers });
  check("GET /api/vendor/leads/unseen-count → 200", unseenResp.status === 200);
  const unseen = await unseenResp.json().catch(() => null);
  check("GET /api/vendor/leads/unseen-count → {count}", typeof unseen?.count === "number");

  // GET /api/vendor/conversations
  const convsResp = await fetch(`${API}/api/vendor/conversations`, { headers });
  check("GET /api/vendor/conversations → 200", convsResp.status === 200);

  // POST /api/vendor/availability
  const today = new Date().toISOString().split("T")[0];
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const availResp = await fetch(`${API}/api/vendor/availability`, {
    method: "POST",
    headers,
    body: JSON.stringify({ date: futureDate, status: "blocked" }),
  });
  check("POST /api/vendor/availability → 200/201", availResp.status === 200 || availResp.status === 201);

  // DELETE /api/vendor/availability/:date
  const delAvailResp = await fetch(`${API}/api/vendor/availability/${futureDate}`, {
    method: "DELETE",
    headers,
  });
  check("DELETE /api/vendor/availability/:date → 204", delAvailResp.status === 204);
} else {
  console.log("\n[3] CLERK_TEST_TOKEN_VENDOR non défini — tests CRUD authentifiés ignorés");
  console.log("    Définir CLERK_TEST_TOKEN_VENDOR=<token> pour activer le CRUD complet.");
}

await browser.close();
exit(results, "bloc-c-vendor-api.spec");
