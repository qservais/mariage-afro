/**
 * E2E spec — BLOC B: Espace couple.
 *
 * Auth déterministe via Clerk embedded sign-in :
 *   email test = couple-bloc-b+clerk_test@example.com, OTP = 424242
 *
 * Couverture :
 *   - Routes protégées → redirect vers login (pas de crash) sans auth
 *   - API endpoints → 401 sans token
 *   - Sign-in authentifié → dashboard charge
 *   - CRUD complet: profil PATCH, budget (create/patch/delete),
 *     invités (create/patch/delete), planning (create/patch/delete)
 */
import { chromium } from "playwright";
import { BASE, API, DESKTOP, makeChecker, clerkSignIn, authFetch } from "./_clerk-auth-helper.mjs";
import { exit } from "./_helpers.mjs";

const { results, check } = makeChecker();

// ── 1. Routes protégées sans auth → redirect/no crash ─────────────────────────
console.log("\n[1] Routes couple — sans auth (redirect vers login)");
{
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: DESKTOP });
  const page = await ctx.newPage();

  const routes = [
    "/espace-client/dashboard", "/espace-client/budget", "/espace-client/invites",
    "/espace-client/planning", "/espace-client/prestataires", "/espace-client/profil",
  ];
  for (const route of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(300);
    const url = page.url();
    const isLogin = url.includes("login") || url.includes("sign-in") || url.includes("clerk");
    const noServerError = !(await page.locator("text=Internal Server Error").isVisible({ timeout: 500 }).catch(() => false));
    check(`${route} → login redirect ou charge sans crash`, (isLogin || noServerError));
  }
  await browser.close();
}

// ── 2. API — 401 sans token ────────────────────────────────────────────────────
console.log("\n[2] API couple — 401 sans token");
const protectedApis = [
  ["GET", "/api/client/me"],
  ["PATCH", "/api/client/me"],
  ["GET", "/api/client/budget"],
  ["POST", "/api/client/budget"],
  ["GET", "/api/client/guests"],
  ["POST", "/api/client/guests"],
  ["GET", "/api/client/planning"],
  ["POST", "/api/client/planning"],
];
for (const [method, path] of protectedApis) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method !== "GET" ? JSON.stringify({}) : undefined,
  });
  check(`${method} ${path} → 401 sans token`, r.status === 401);
}

// ── 3. Sign-in Clerk + CRUD complet ───────────────────────────────────────────
console.log("\n[3] BLOC B — sign-in Clerk + CRUD couple authentifié");
{
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: DESKTOP });
  const page = await ctx.newPage();

  const jwt = await clerkSignIn(page, {
    email: "couple-bloc-b@example.com",
    loginPath: "/espace-client/login",
  });

  if (!jwt) {
    console.warn("  ⚠ JWT non obtenu — BLOC B auth skipped");
    check("Clerk sign-in obtient un JWT", false);
    await browser.close();
  } else {
    check("Clerk sign-in obtient un JWT", true);

    // — Dashboard charge ─────────────────────────────────────────────────────
    await page.goto(`${BASE}/espace-client/dashboard`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForTimeout(1500);
    const dashUrl = page.url();
    check("Dashboard charge (pas redirigé vers login)", !dashUrl.includes("login"));

    // Compléter onboarding si nécessaire
    if (await page.locator('[data-testid="onboarding-stepper"]').isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log("  → Onboarding requis — complétion...");
      // Step 1: noms
      const p1 = page.locator('[data-testid="input-onboarding-partner1"]');
      if (await p1.isVisible({ timeout: 2000 }).catch(() => false)) await p1.fill("Alex");
      await page.locator('[data-testid="onboarding-stepper"] [data-testid="stepper-next"]').click();
      await page.waitForTimeout(300);
      // Step 2: date
      const dateIn = page.locator('[data-testid="input-onboarding-date"]');
      if (await dateIn.isVisible({ timeout: 2000 }).catch(() => false)) await dateIn.fill("2027-09-15");
      await page.locator('[data-testid="onboarding-stepper"] [data-testid="stepper-next"]').click();
      await page.waitForTimeout(300);
      // Steps 3-4: cards (clicker la première disponible)
      for (let s = 0; s < 3; s++) {
        const card = page.locator('[data-testid^="selectable-card-"]').first();
        if (await card.count() > 0) await card.click({ force: true }).catch(() => {});
        await page.waitForTimeout(100);
        await page.locator('[data-testid="onboarding-stepper"] [data-testid="stepper-next"]').first().click().catch(() => {});
        await page.waitForTimeout(300);
      }
      await page.waitForTimeout(1000);
    }

    // Vérifier les sous-routes du dashboard
    const clientRoutes = [
      "/espace-client/budget", "/espace-client/invites",
      "/espace-client/planning", "/espace-client/profil",
    ];
    for (const route of clientRoutes) {
      await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(500);
      const routeUrl = page.url();
      check(`${route} charge (authentifié)`, !routeUrl.includes("login"));
    }

    // — API : GET /api/client/me ──────────────────────────────────────────────
    const meResp = await authFetch("/api/client/me", jwt);
    check("GET /api/client/me → 200", meResp.status === 200);
    const me = await meResp.json().catch(() => null);
    check("GET /api/client/me → objet avec id", !!me?.id);

    // — API : PATCH /api/client/me ───────────────────────────────────────────
    const patchMeResp = await authFetch("/api/client/me", jwt, {
      method: "PATCH",
      body: { guestEstimate: 90 },
    });
    check("PATCH /api/client/me → 200", patchMeResp.status === 200);
    const patchedMe = await patchMeResp.json().catch(() => null);
    check("PATCH /api/client/me → guestEstimate = 90", patchedMe?.guestEstimate === 90);

    // — Budget CRUD ───────────────────────────────────────────────────────────
    const budgetCreateResp = await authFetch("/api/client/budget", jwt, {
      method: "POST",
      body: { category: "Lieu de réception E2E", planned: 5000, actual: 0 },
    });
    check("POST /api/client/budget → 200", budgetCreateResp.status === 200);
    const budgetItem = await budgetCreateResp.json().catch(() => null);
    check("POST /api/client/budget → id retourné", !!budgetItem?.id);

    if (budgetItem?.id) {
      const patchBudget = await authFetch(`/api/client/budget/${budgetItem.id}`, jwt, {
        method: "PATCH",
        body: { planned: 6000 },
      });
      check("PATCH /api/client/budget/:id → 200", patchBudget.status === 200);
      const patchedBudget = await patchBudget.json().catch(() => null);
      check("PATCH /api/client/budget/:id → planned mis à jour", patchedBudget?.planned === 6000);

      const delBudget = await authFetch(`/api/client/budget/${budgetItem.id}`, jwt, { method: "DELETE" });
      check("DELETE /api/client/budget/:id → 200", delBudget.status === 200);

      // Vérifier suppression
      const budgetsAfterDel = await (await authFetch("/api/client/budget", jwt)).json().catch(() => []);
      check("Budget supprimé n'apparaît plus dans la liste", !budgetsAfterDel.some((b) => b.id === budgetItem.id));
    }

    // — Invités CRUD ──────────────────────────────────────────────────────────
    const guestCreateResp = await authFetch("/api/client/guests", jwt, {
      method: "POST",
      body: { firstName: "Marie", lastName: "Dupont E2E", rsvp: "pending" },
    });
    check("POST /api/client/guests → 200", guestCreateResp.status === 200);
    const guest = await guestCreateResp.json().catch(() => null);
    check("POST /api/client/guests → firstName correct", guest?.firstName === "Marie");

    if (guest?.id) {
      const patchGuest = await authFetch(`/api/client/guests/${guest.id}`, jwt, {
        method: "PATCH",
        body: { rsvp: "confirmed" },
      });
      check("PATCH /api/client/guests/:id → 200", patchGuest.status === 200);
      const patchedGuest = await patchGuest.json().catch(() => null);
      check("PATCH /api/client/guests/:id → rsvp confirmé", patchedGuest?.rsvp === "confirmed");

      const delGuest = await authFetch(`/api/client/guests/${guest.id}`, jwt, { method: "DELETE" });
      check("DELETE /api/client/guests/:id → 200", delGuest.status === 200);
    }

    // — Planning CRUD ─────────────────────────────────────────────────────────
    const taskCreateResp = await authFetch("/api/client/planning", jwt, {
      method: "POST",
      body: { title: "Choisir le traiteur E2E", dueDate: "2026-12-01", done: false },
    });
    check("POST /api/client/planning → 200", taskCreateResp.status === 200);
    const task = await taskCreateResp.json().catch(() => null);
    check("POST /api/client/planning → title correct", task?.title === "Choisir le traiteur E2E");

    if (task?.id) {
      const patchTask = await authFetch(`/api/client/planning/${task.id}`, jwt, {
        method: "PATCH",
        body: { done: true },
      });
      check("PATCH /api/client/planning/:id → 200", patchTask.status === 200);
      const patchedTask = await patchTask.json().catch(() => null);
      check("PATCH /api/client/planning/:id → done=true", patchedTask?.done === true);

      const delTask = await authFetch(`/api/client/planning/${task.id}`, jwt, { method: "DELETE" });
      check("DELETE /api/client/planning/:id → 200", delTask.status === 200);
    }

    // — GET /api/client/planning après CRUD ───────────────────────────────────
    const planningList = await (await authFetch("/api/client/planning", jwt)).json().catch(() => null);
    check("GET /api/client/planning → array", Array.isArray(planningList));

    await browser.close();
  }
}

exit(results, "bloc-b-couple-api.spec");
