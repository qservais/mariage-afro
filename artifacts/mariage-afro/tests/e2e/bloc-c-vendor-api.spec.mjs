/**
 * E2E spec — BLOC C: Espace prestataire.
 *
 * Auth déterministe via Clerk embedded sign-in :
 *   email test = vendor-bloc-c+clerk_test@example.com, OTP = 424242
 *
 * Couverture :
 *   - Toutes les routes /espace-pro/* → redirect sans crash (sans auth)
 *   - Tous les API endpoints → 401 sans token
 *   - Sign-in authentifié → espace pro charge
 *   - POST /api/vendor/onboarding (création ou MAJ fiche, avec vérif defensif si vendor supprimé)
 *   - PATCH /api/vendor/profile : tagline + services[] avec vérification persistance
 *   - GET /api/vendor/leads, leads/unseen-count, conversations
 *   - POST + GET + DELETE /api/vendor/availability
 *   - Toutes les sous-routes UI: leads, messages, settings, profile, gallery, services, agenda, abonnement
 */
import { chromium } from "playwright";
import { BASE, API, DESKTOP, makeChecker, clerkSignIn, authFetch } from "./_clerk-auth-helper.mjs";
import { exit } from "./_helpers.mjs";

const { results, check } = makeChecker();

// ── 1. Routes protégées sans auth → redirect/no crash ─────────────────────────
console.log("\n[1] Routes prestataire — sans auth");
{
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: DESKTOP });
  const page = await ctx.newPage();

  const routes = [
    "/espace-pro", "/espace-pro/profile", "/espace-pro/gallery",
    "/espace-pro/services", "/espace-pro/agenda", "/espace-pro/leads",
    "/espace-pro/messages", "/espace-pro/settings", "/espace-pro/abonnement",
  ];
  for (const route of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(300);
    const url = page.url();
    const isLogin = url.includes("login") || url.includes("sign-in");
    const noServerError = !(await page.locator("text=Internal Server Error").isVisible({ timeout: 500 }).catch(() => false));
    check(`${route} → login redirect ou charge sans crash`, isLogin || noServerError);
  }
  await browser.close();
}

// ── 2. API — 401 sans token ────────────────────────────────────────────────────
console.log("\n[2] API prestataire — 401 sans token");
const protectedApis = [
  ["GET", "/api/vendor/me"],
  ["POST", "/api/vendor/onboarding"],
  ["GET", "/api/vendor/profile"],
  ["PATCH", "/api/vendor/profile"],
  ["GET", "/api/vendor/leads"],
  ["GET", "/api/vendor/leads/unseen-count"],
  ["GET", "/api/vendor/conversations"],
  ["GET", "/api/vendor/availability"],
  ["POST", "/api/vendor/availability"],
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
console.log("\n[3] BLOC C — sign-in Clerk + CRUD prestataire authentifié");
{
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: DESKTOP });
  const page = await ctx.newPage();

  const jwt = await clerkSignIn(page, {
    email: "vendor-bloc-c@example.com",
    loginPath: "/espace-pro/login",
  });

  if (!jwt) {
    console.warn("  ⚠ JWT non obtenu — BLOC C auth skipped");
    check("Clerk sign-in prestataire obtient un JWT", false);
    await browser.close();
  } else {
    check("Clerk sign-in prestataire obtient un JWT", true);

    // — Espace pro charge ─────────────────────────────────────────────────────
    await page.goto(`${BASE}/espace-pro`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForTimeout(1500);
    const proUrl = page.url();
    check("Espace pro charge (pas redirigé vers login)", !proUrl.includes("login"));

    // — GET /api/vendor/me ───────────────────────────────────────────────────
    const meResp = await authFetch("/api/vendor/me", jwt);
    check("GET /api/vendor/me → 200", meResp.status === 200);
    const me = await meResp.json().catch(() => null);
    check("GET /api/vendor/me → {account}", !!me?.account);
    check("GET /api/vendor/me → account.id numérique", typeof me?.account?.id === "number");

    // — POST /api/vendor/onboarding (création ou MAJ, défense si vendor supprimé) ──
    const onboardResp = await authFetch("/api/vendor/onboarding", jwt, {
      method: "POST",
      body: {
        businessName: "Test Pro BLOC C E2E",
        contactName: "Contact BLOC C",
        email: "vendor-bloc-c-profile@example.com",
        category: "Photographe",
        city: "Bruxelles",
        description: "Description automatisée BLOC C",
      },
    });
    check("POST /api/vendor/onboarding → 200", onboardResp.status === 200);
    const onboard = await onboardResp.json().catch(() => null);
    check("POST /api/vendor/onboarding → businessName correct",
      onboard?.account?.businessName === "Test Pro BLOC C E2E");
    check("POST /api/vendor/onboarding → vendorId présent",
      typeof onboard?.account?.vendorId === "number");

    // — PATCH /api/vendor/profile : tagline ───────────────────────────────────
    const patchProfileResp = await authFetch("/api/vendor/profile", jwt, {
      method: "PATCH",
      body: { tagline: "Tagline test E2E BLOC C" },
    });
    check("PATCH /api/vendor/profile (tagline) → 200", patchProfileResp.status === 200);

    // — GET /api/vendor/profile — vérification persistance tagline ────────────
    const profileResp = await authFetch("/api/vendor/profile", jwt);
    check("GET /api/vendor/profile → 200", profileResp.status === 200);
    const profile = await profileResp.json().catch(() => null);
    check("GET /api/vendor/profile → tagline persisté", profile?.tagline === "Tagline test E2E BLOC C");

    // — PATCH /api/vendor/profile : services[] + vérification persistance ─────
    const patchServicesResp = await authFetch("/api/vendor/profile", jwt, {
      method: "PATCH",
      body: { services: ["Reportage photo mariage", "Séance engagement", "Album personnalisé"] },
    });
    check("PATCH /api/vendor/profile (services) → 200", patchServicesResp.status === 200);

    const profileAfterServices = await (await authFetch("/api/vendor/profile", jwt)).json().catch(() => null);
    check(
      "GET /api/vendor/profile → services persistés (array de 3)",
      Array.isArray(profileAfterServices?.services) && profileAfterServices.services.length === 3
    );
    check(
      "GET /api/vendor/profile → services[0] correct",
      profileAfterServices?.services?.[0] === "Reportage photo mariage"
    );

    // — GET /api/vendor/leads ─────────────────────────────────────────────────
    const leadsResp = await authFetch("/api/vendor/leads", jwt);
    check("GET /api/vendor/leads → 200", leadsResp.status === 200);
    const leads = await leadsResp.json().catch(() => null);
    check("GET /api/vendor/leads → array", Array.isArray(leads));

    // — GET /api/vendor/leads/unseen-count ────────────────────────────────────
    const unseenResp = await authFetch("/api/vendor/leads/unseen-count", jwt);
    check("GET /api/vendor/leads/unseen-count → 200", unseenResp.status === 200);
    const unseen = await unseenResp.json().catch(() => null);
    check("GET /api/vendor/leads/unseen-count → {count} numérique", typeof unseen?.count === "number");

    // — GET /api/vendor/conversations ─────────────────────────────────────────
    const convsResp = await authFetch("/api/vendor/conversations", jwt);
    check("GET /api/vendor/conversations → 200", convsResp.status === 200);
    const convs = await convsResp.json().catch(() => null);
    check("GET /api/vendor/conversations → array", Array.isArray(convs));

    // — Disponibilités CRUD ───────────────────────────────────────────────────
    const futureDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const availCreateResp = await authFetch("/api/vendor/availability", jwt, {
      method: "POST",
      body: { date: futureDate, status: "blocked" },
    });
    check("POST /api/vendor/availability → 200/201",
      availCreateResp.status === 200 || availCreateResp.status === 201);

    const availGetResp = await authFetch(`/api/vendor/availability?from=${futureDate}&to=${futureDate}`, jwt);
    check("GET /api/vendor/availability → 200", availGetResp.status === 200);
    const avail = await availGetResp.json().catch(() => null);
    check("GET /api/vendor/availability → array", Array.isArray(avail));
    check("GET /api/vendor/availability → date bloquée présente",
      Array.isArray(avail) && avail.some((a) => a.date === futureDate));
    check("GET /api/vendor/availability → status = blocked",
      Array.isArray(avail) && avail.find((a) => a.date === futureDate)?.status === "blocked");

    const availDelResp = await authFetch(`/api/vendor/availability/${futureDate}`, jwt, { method: "DELETE" });
    check("DELETE /api/vendor/availability/:date → 204", availDelResp.status === 204);

    // Vérifier suppression disponibilité
    const availAfterDel = await (await authFetch(`/api/vendor/availability?from=${futureDate}&to=${futureDate}`, jwt)).json().catch(() => []);
    check("Disponibilité supprimée → plus dans la liste", !availAfterDel.some((a) => a.date === futureDate));

    // — Toutes les sous-routes UI authentifiées ───────────────────────────────
    const proRoutes = [
      "/espace-pro/leads",
      "/espace-pro/messages",
      "/espace-pro/settings",
      "/espace-pro/profile",
      "/espace-pro/gallery",
      "/espace-pro/services",
      "/espace-pro/agenda",
      "/espace-pro/abonnement",
    ];
    for (const route of proRoutes) {
      await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(500);
      const routeUrl = page.url();
      check(`${route} charge (authentifié)`, !routeUrl.includes("login"));
    }

    await browser.close();
  }
}

exit(results, "bloc-c-vendor-api.spec");
