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
    // Attendre le redirect Clerk (peut prendre 1-3s au cold start lors du 1er chargement du bundle)
    await page.waitForURL(
      url => url.href.includes("/login") || url.href.includes("sign-in") || url.href.includes("accounts"),
      { timeout: 4000 }
    ).catch(() => {});
    const currentUrl = page.url();
    const redirectedToLogin = currentUrl.includes("/login") || currentUrl.includes("sign-in") || currentUrl.includes("accounts");
    const hasAuthModal = await page.locator('.cl-signIn-root, .cl-modalContent, .cl-component').isVisible({ timeout: 1000 }).catch(() => false);
    check(`${route} → redirigé vers login`, redirectedToLogin || hasAuthModal);
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
  ["PATCH", "/api/vendor/profile/images"],
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

    // — Gallery : PATCH /api/vendor/profile/images (vider la galerie) ───────────
    // images:[] est valide (aucune URL à valider) et efface toutes les images existantes
    const imagesResp = await authFetch("/api/vendor/profile/images", jwt, {
      method: "PATCH",
      body: { images: [], coverImage: null },
    });
    check("PATCH /api/vendor/profile/images { images:[] } → 200", imagesResp.status === 200);
    const imagesBody = await imagesResp.json().catch(() => null);
    check("PATCH /api/vendor/profile/images → images = [] retourné", Array.isArray(imagesBody?.images) && imagesBody.images.length === 0);

    // Vérifier via GET que la galerie est bien vide
    const profileAfterImages = await (await authFetch("/api/vendor/profile", jwt)).json().catch(() => null);
    check("GET /api/vendor/profile → images effacées ([])", Array.isArray(profileAfterImages?.images) && profileAfterImages.images.length === 0);

    // — Messages : créer conversation + envoi message prestataire ─────────────
    // Étape 1 : signer en tant que couple-bloc-b pour créer une conversation
    let convId = null;
    {
      const coupBrowser = await chromium.launch();
      const coupCtx = await coupBrowser.newContext({ viewport: DESKTOP });
      const coupPage = await coupCtx.newPage();
      const coupleJwt = await clerkSignIn(coupPage, {
        email: "couple-bloc-b@example.com",
        loginPath: "/espace-client/login",
      });
      if (coupleJwt && typeof onboard?.account?.vendorId === "number") {
        const createConvResp = await authFetch("/api/client/conversations", coupleJwt, {
          method: "POST",
          body: { vendorId: onboard.account.vendorId },
        });
        if (createConvResp.status === 200 || createConvResp.status === 201) {
          const convData = await createConvResp.json().catch(() => null);
          convId = convData?.id ?? null;
        }
      }
      await coupBrowser.close();
    }
    check("Conversation créée (couple → prestataire)", typeof convId === "number");

    if (typeof convId === "number") {
      // Étape 2 : GET messages de la conversation (en tant que prestataire)
      const msgsGetResp = await authFetch(`/api/vendor/conversations/${convId}/messages`, jwt);
      check(`GET /api/vendor/conversations/${convId}/messages → 200`, msgsGetResp.status === 200);
      const msgs = await msgsGetResp.json().catch(() => null);
      check(`GET /api/vendor/conversations/${convId}/messages → array`, Array.isArray(msgs));

      // Étape 3 : POST message (prestataire répond)
      const sendMsgResp = await authFetch(`/api/vendor/conversations/${convId}/messages`, jwt, {
        method: "POST",
        body: { content: "Réponse automatisée BLOC C E2E — prestataire" },
      });
      check(`POST /api/vendor/conversations/${convId}/messages → 201`, sendMsgResp.status === 201);
      const sentMsg = await sendMsgResp.json().catch(() => null);
      check("Message envoyé → content correct", sentMsg?.content === "Réponse automatisée BLOC C E2E — prestataire");
      check("Message envoyé → authorRole = vendor", sentMsg?.authorRole === "vendor");

      // Étape 4 : vérifier que le message apparaît dans la liste
      const msgsAfterSend = await (await authFetch(`/api/vendor/conversations/${convId}/messages`, jwt)).json().catch(() => []);
      check("Messages après envoi → au moins 1 message", Array.isArray(msgsAfterSend) && msgsAfterSend.length >= 1);
      check("Message apparaît dans la liste", Array.isArray(msgsAfterSend) && msgsAfterSend.some(m => m.authorRole === "vendor"));
    }

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
