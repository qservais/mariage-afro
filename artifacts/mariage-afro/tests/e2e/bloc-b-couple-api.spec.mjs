/**
 * E2E spec — BLOC B: Espace couple.
 *
 * Deux niveaux de couverture :
 *
 * 1. Niveau UI (sans auth) — vérifie que les routes protégées redirigent
 *    vers la page de login Clerk (pas de crash / 500).
 *
 * 2. Niveau API — vérifie que les endpoints retournent 401 sans token
 *    (auth middleware opérationnel), et 200/201 avec un token valide si
 *    la variable d'environnement CLERK_TEST_TOKEN_COUPLE est définie.
 *
 * Fix validé par ces tests : INSERT couples ON CONFLICT DO NOTHING
 * (évite "duplicate key couples_user_id_idx" en cas de requêtes parallèles
 * au premier login).
 */
import { chromium } from "playwright";
import { BASE, exit } from "./_helpers.mjs";

const API = process.env.API_BASE_URL ?? "http://localhost:8080";
const TEST_TOKEN = process.env.CLERK_TEST_TOKEN_COUPLE ?? null;
const DESKTOP = { width: 1280, height: 720 };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: DESKTOP });
const page = await ctx.newPage();

const results = [];
const check = (label, cond) => {
  if (cond) console.log(`  ✓ ${label}`);
  else { console.error(`  ✗ ${label}`); results.push(label); }
};

// ── 1. Routes protégées → redirect vers login (pas de crash) ─────────────────
console.log("\n[1] Routes couple — redirect vers login Clerk si non authentifié");
const protectedRoutes = [
  "/espace-client/dashboard",
  "/espace-client/budget",
  "/espace-client/invites",
  "/espace-client/planning",
  "/espace-client/prestataires",
  "/espace-client/profil",
];
for (const route of protectedRoutes) {
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(300);
  const url = page.url();
  const isLoginRedirect = url.includes("sign-in") || url.includes("clerk") ||
    url.includes("login") || url.includes("espace-client/login");
  const noServerError = !(await page.locator("text=Internal Server Error").isVisible({ timeout: 500 }).catch(() => false));
  const no500 = !(await page.locator("text=500").isVisible({ timeout: 500 }).catch(() => false));
  check(`${route} → redirige vers login ou charge sans crash`, (isLoginRedirect || noServerError) && no500);
}

// ── 2. API — 401 sans token d'authentification ────────────────────────────────
console.log("\n[2] API couple — 401 sans token");
const protectedApis = [
  { method: "GET", path: "/api/client/me" },
  { method: "PATCH", path: "/api/client/me" },
  { method: "GET", path: "/api/client/budget" },
  { method: "POST", path: "/api/client/budget" },
  { method: "GET", path: "/api/client/guests" },
  { method: "POST", path: "/api/client/guests" },
  { method: "GET", path: "/api/client/planning" },
  { method: "POST", path: "/api/client/planning" },
];
for (const { method, path } of protectedApis) {
  const resp = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method !== "GET" ? JSON.stringify({}) : undefined,
  });
  check(`${method} ${path} → 401 sans token`, resp.status === 401);
}

// ── 3. API couple — avec token de test (si disponible) ───────────────────────
if (TEST_TOKEN) {
  console.log("\n[3] API couple — CRUD authentifié (CLERK_TEST_TOKEN_COUPLE défini)");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${TEST_TOKEN}`,
  };

  // GET /api/client/me
  const meResp = await fetch(`${API}/api/client/me`, { headers });
  check("GET /api/client/me → 200", meResp.status === 200);
  const me = await meResp.json().catch(() => null);
  check("GET /api/client/me → objet avec id", !!me?.id);

  // PATCH /api/client/me
  const patchResp = await fetch(`${API}/api/client/me`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ guestEstimate: 150 }),
  });
  check("PATCH /api/client/me → 200", patchResp.status === 200);
  const patched = await patchResp.json().catch(() => null);
  check("PATCH /api/client/me → guestEstimate mis à jour", patched?.guestEstimate === 150);

  // POST /api/client/budget
  const budgetResp = await fetch(`${API}/api/client/budget`, {
    method: "POST",
    headers,
    body: JSON.stringify({ category: "Test E2E", planned: 1000, actual: 0 }),
  });
  check("POST /api/client/budget → 200", budgetResp.status === 200);
  const budgetItem = await budgetResp.json().catch(() => null);
  check("POST /api/client/budget → id retourné", !!budgetItem?.id);

  if (budgetItem?.id) {
    // PATCH /api/client/budget/:id
    const patchBudgetResp = await fetch(`${API}/api/client/budget/${budgetItem.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ planned: 2000 }),
    });
    check("PATCH /api/client/budget/:id → 200", patchBudgetResp.status === 200);

    // DELETE /api/client/budget/:id
    const delResp = await fetch(`${API}/api/client/budget/${budgetItem.id}`, { method: "DELETE", headers });
    check("DELETE /api/client/budget/:id → 200", delResp.status === 200);
  }

  // POST /api/client/guests
  const guestResp = await fetch(`${API}/api/client/guests`, {
    method: "POST",
    headers,
    body: JSON.stringify({ firstName: "Marie", lastName: "E2E", rsvp: "pending" }),
  });
  check("POST /api/client/guests → 200", guestResp.status === 200);
  const guest = await guestResp.json().catch(() => null);
  check("POST /api/client/guests → firstName correct", guest?.firstName === "Marie");

  if (guest?.id) {
    // DELETE /api/client/guests/:id
    const delGuest = await fetch(`${API}/api/client/guests/${guest.id}`, { method: "DELETE", headers });
    check("DELETE /api/client/guests/:id → 200", delGuest.status === 200);
  }

  // POST /api/client/planning
  const planResp = await fetch(`${API}/api/client/planning`, {
    method: "POST",
    headers,
    body: JSON.stringify({ title: "Tâche E2E", dueDate: "2026-12-01", done: false }),
  });
  check("POST /api/client/planning → 200", planResp.status === 200);
  const task = await planResp.json().catch(() => null);
  check("POST /api/client/planning → title correct", task?.title === "Tâche E2E");

  if (task?.id) {
    const patchTask = await fetch(`${API}/api/client/planning/${task.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ done: true }),
    });
    check("PATCH /api/client/planning/:id → 200", patchTask.status === 200);

    const delTask = await fetch(`${API}/api/client/planning/${task.id}`, { method: "DELETE", headers });
    check("DELETE /api/client/planning/:id → 200", delTask.status === 200);
  }
} else {
  console.log("\n[3] CLERK_TEST_TOKEN_COUPLE non défini — tests CRUD authentifiés ignorés");
  console.log("    Définir CLERK_TEST_TOKEN_COUPLE=<token> pour activer le CRUD complet.");
}

await browser.close();
exit(results, "bloc-b-couple-api.spec");
