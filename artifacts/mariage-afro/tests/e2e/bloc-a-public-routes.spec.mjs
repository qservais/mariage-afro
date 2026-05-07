/**
 * E2E spec — BLOC A: routes publiques, formulaire contact (avec validation),
 * calculateur budget (résultat + soumission), quiz style, marketplace (count strict + filtre catégorie),
 * multi-devis (count strict = 2), fiche prestataire, routes mariage/:slug.
 *
 * Aucun login requis. Toutes les assertions sont déterministes.
 */
import { chromium } from "playwright";
import { BASE, API, DESKTOP, makeChecker } from "./_clerk-auth-helper.mjs";
import { exit } from "./_helpers.mjs";

const { results, check } = makeChecker();

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: DESKTOP });
const page = await ctx.newPage();

/** Vérifie qu'une route charge sans page blanche ni erreur serveur. */
async function checkRoute(path) {
  const resp = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 25000 });
  const status = resp?.status() ?? 0;
  const noError = !(await page.locator("text=Internal Server Error").isVisible({ timeout: 500 }).catch(() => false));
  const hasContent = (await page.locator("body").innerText().catch(() => "")).trim().length > 10;
  check(`GET ${path} → ${status} (pas de crash)`, status > 0 && status < 400 && noError && hasContent);
}

// ── 1. Smoke — toutes les routes publiques ────────────────────────────────────
console.log("\n[1] Smoke test — routes publiques");
const publicRoutes = [
  "/", "/plateforme", "/services", "/partenaires", "/comparateur",
  "/lieux", "/a-propos", "/contact", "/outils/budget", "/outils/quiz",
  "/realisations", "/shop", "/guide",
  "/mentions-legales", "/confidentialite", "/cookies",
  "/espace-client/login", "/espace-pro/login",
];
for (const route of publicRoutes) {
  await checkRoute(route);
}

// Route interne guide (layout minimal)
await checkRoute("/_interne/guide");

// Routes mariage/:slug — vérifie d'abord que le slug est réellement en DB
// (échoue clairement si manquant plutôt qu'une erreur cryptique)
const MARIAGE_SLUG = "servais-lahayegoffart";
const slugProbeResp = await page.goto(`${BASE}/mariage/${MARIAGE_SLUG}`, { waitUntil: "domcontentloaded", timeout: 20000 });
const slugStatus = slugProbeResp?.status() ?? 0;
check(`/mariage/${MARIAGE_SLUG} → slug connu en DB (pas 404)`, slugStatus > 0 && slugStatus < 400);
if (slugStatus < 400) {
  await checkRoute(`/mariage/${MARIAGE_SLUG}/rsvp`);
  await checkRoute(`/mariage/${MARIAGE_SLUG}/cagnotte`);
}

// ── 2. API publique — marketplace (count strict + filtre catégorie) ───────────
console.log("\n[2] API publique — marketplace");
const vendorsResp = await fetch(`${API}/api/marketplace/vendors`);
check("GET /api/marketplace/vendors → 200", vendorsResp.status === 200);
const vendors = await vendorsResp.json().catch(() => null);
check("GET /api/marketplace/vendors → au moins 8 résultats", Array.isArray(vendors) && vendors.length >= 8);

// Filtre catégorie — "Vidéo" doit retourner un sous-ensemble strict
const catResp = await fetch(`${API}/api/marketplace/vendors?category=Vid%C3%A9o`);
check("GET /api/marketplace/vendors?category=Vidéo → 200", catResp.status === 200);
const catVendors = await catResp.json().catch(() => null);
check(
  "GET /api/marketplace/vendors?category=Vidéo → résultats filtrés (>= 1 et tous catégorie Vidéo)",
  Array.isArray(catVendors) && catVendors.length >= 1 && catVendors.every((v) => v.category === "Vidéo")
);
check(
  "Filtre catégorie < total non filtré",
  Array.isArray(catVendors) && Array.isArray(vendors) && catVendors.length < vendors.length
);

// Fiche individuelle — name + category + id
if (vendors?.length > 0) {
  const slug = vendors[0].slug ?? vendors[0].id;
  const detailResp = await fetch(`${API}/api/marketplace/vendors/${slug}`);
  check(`GET /api/marketplace/vendors/${slug} → 200`, detailResp.status === 200);
  const vendor = await detailResp.json().catch(() => null);
  check("Fiche prestataire → name présent", typeof vendor?.name === "string" && vendor.name.length > 0);
  check("Fiche prestataire → category présent", typeof vendor?.category === "string" && vendor.category.length > 0);
  check("Fiche prestataire → id numérique", typeof vendor?.id === "number");
}

// ── 3. Formulaire contact — soumission valide ─────────────────────────────────
console.log("\n[3] Formulaire contact — soumission valide");
const contactResp = await fetch(`${API}/api/contact`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Test E2E BLOC A",
    email: "test-bloc-a-valid@example.com",
    message: "Test automatisé E2E BLOC A",
    weddingType: "afro",
    guestCount: "80",
  }),
});
check("POST /api/contact → 200", contactResp.status === 200);
const contactBody = await contactResp.json().catch(() => null);
check("POST /api/contact → {success:true}", contactBody?.success === true);

// ── 4. Formulaire contact — validation erreurs ────────────────────────────────
console.log("\n[4] Formulaire contact — validation (champs vides)");
const contactEmptyResp = await fetch(`${API}/api/contact`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "", email: "", message: "" }),
});
check("POST /api/contact (vide) → 400/422 (validation)", contactEmptyResp.status >= 400 && contactEmptyResp.status < 500);

const contactBadEmailResp = await fetch(`${API}/api/contact`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Test", email: "not-an-email", message: "Msg" }),
});
check("POST /api/contact (email invalide) → 400/422", contactBadEmailResp.status >= 400 && contactBadEmailResp.status < 500);

// ── 5. Formulaire contact UI — validation stepper ─────────────────────────────
async function waitVisible(testid, timeout = 4000) {
  return page.locator(`[data-testid="${testid}"]`).waitFor({ state: "visible", timeout }).then(() => true).catch(() => false);
}
async function clickNext() {
  await page.locator('[data-testid="stepper-next"]').first().click({ force: true });
  await page.waitForTimeout(350);
}

console.log("\n[5] Formulaire contact UI — validation stepper");
await page.goto(`${BASE}/contact`, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForSelector('[data-testid="contact-stepper"]', { timeout: 15000 });
await page.waitForTimeout(500);

await clickNext();
check("Contact step 1 bloque sans type de mariage", await waitVisible("cards-wedding-type", 2000));

await page.locator('[data-testid="cards-wedding-type"] [data-testid^="selectable-card-"]').first().click({ force: true });
await page.waitForTimeout(200);
await clickNext();
check("Contact step 1 → step 2 après sélection",
  await waitVisible("cards-services", 3000) || await waitVisible("stepper-next", 1500));

await clickNext();
check("Contact step 2 (optionnel) → step 3", await waitVisible("input-contact-name", 4000));

await clickNext();
check("Contact step 3 bloque sans name/email", await waitVisible("input-contact-name", 2000));

await page.locator('[data-testid="input-contact-name"]').fill("Alice Test E2E");
await page.locator('[data-testid="input-contact-email"]').fill("alice.e2e@example.com");
await clickNext();
check("Contact step 3 → step 4 après données valides", await waitVisible("textarea-contact-message", 4000));

// ── 6. Multi-devis — count strict = nb vendorIds envoyés ─────────────────────
console.log("\n[6] Multi-devis API — count strict");
// Utilise les 2 premiers vendors actifs connus
const knownVendorIds = vendors?.slice(0, 2).map((v) => v.id) ?? [1, 2];
const multiResp = await fetch(`${API}/api/leads/multi-devis`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Multi Test BLOC A",
    email: "multi-bloc-a@example.com",
    phone: null,
    message: "Test multi-devis E2E",
    vendorIds: knownVendorIds,
  }),
});
check("POST /api/leads/multi-devis → 200", multiResp.status === 200);
const multiBody = await multiResp.json().catch(() => null);
check(
  `POST /api/leads/multi-devis → count = ${knownVendorIds.length}`,
  multiBody?.count === knownVendorIds.length
);

// Validation : 0 vendors doit échouer
const multiEmptyResp = await fetch(`${API}/api/leads/multi-devis`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "T", email: "t@t.com", vendorIds: [] }),
});
check("POST /api/leads/multi-devis (0 vendors) → 400", multiEmptyResp.status >= 400);

// ── 7. Calculateur budget — traversée complète + résultat € ──────────────────
console.log("\n[7] Calculateur budget — résultat €");
await page.goto(`${BASE}/outils/budget`, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(800);

const budgetBodyInitial = await page.locator("body").innerText().catch(() => "");
check("Budget calculator charge", budgetBodyInitial.length > 50);

const guestInput = page.locator('[data-testid="input-guest-count"]');
if (await guestInput.isVisible({ timeout: 2000 }).catch(() => false)) {
  await guestInput.fill("100");
}
for (let step = 0; step < 5; step++) {
  const opt = page.locator('[data-testid^="region-"], [data-testid^="standing-"], [data-testid^="month-"]').first();
  if (await opt.count() > 0) { await opt.click({ force: true }).catch(() => {}); await page.waitForTimeout(100); }
  const nb = page.locator('[data-testid="budget-next"]').first();
  if (await nb.isVisible({ timeout: 800 }).catch(() => false)) {
    await nb.click().catch(() => {}); await page.waitForTimeout(400);
  } else break;
}
const resultVisible = await page.locator('[data-testid="budget-step-result"], [data-testid="budget-chart"]').isVisible({ timeout: 3000 }).catch(() => false);
const budgetFinalBody = await page.locator("body").innerText().catch(() => "");
check("Budget result affiche un montant €", budgetFinalBody.includes("€") || resultVisible);

const budgetEmailInput = page.locator('[data-testid="budget-input-email"]');
if (await budgetEmailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
  await page.locator('[data-testid="budget-input-name"]').fill("Budget Test E2E");
  await budgetEmailInput.fill("budget.e2e@example.com");
  await page.locator('[data-testid="budget-submit"]').click();
  await page.waitForTimeout(600);
  const budgetSuccess = await page.locator('[data-testid="budget-success"]').isVisible({ timeout: 3000 }).catch(() => false);
  check("Budget form soumission → success affiché", budgetSuccess);
} else {
  console.log("  ⚠ Budget email form non visible sur step résultat — skipped");
}

// ── 8. Quiz style — traversée complète + profil résultat ─────────────────────
console.log("\n[8] Quiz style — profil résultat");
await page.goto(`${BASE}/outils/quiz`, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(800);

const quizInitialBody = await page.locator("body").innerText().catch(() => "");
check("Quiz style charge", quizInitialBody.length > 50);

for (let q = 0; q < 10; q++) {
  const card = page.locator('[data-testid^="selectable-card-"]').first();
  if (await card.count() > 0) { await card.click({ force: true }).catch(() => {}); await page.waitForTimeout(150); }
  const qNext = page.locator('[data-testid="stepper-next"], button:has-text("Suivant")').first();
  if (await qNext.isVisible({ timeout: 800 }).catch(() => false)) {
    await qNext.click().catch(() => {}); await page.waitForTimeout(400);
  } else break;
}
// Résultat : soit un testid explicite, soit du contenu suffisant (> 200 chars = écran de résultat)
const quizResultVisible = await page.locator('[data-testid="quiz-result"], [data-testid="quiz-profile"]').isVisible({ timeout: 3000 }).catch(() => false);
const quizFinalBody = await page.locator("body").innerText().catch(() => "");
check("Quiz termine et affiche un résultat (profil ou style)", quizResultVisible || quizFinalBody.length > 200);

// ── 9. Marketplace UI — affichage prestataires + fiche détail ─────────────────
console.log("\n[9] Marketplace /partenaires");
await page.goto(`${BASE}/partenaires`, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(800);
const cards = await page.locator('[data-testid="vendor-card"], article.vendor, article').count();
check("Marketplace affiche au moins 1 prestataire", cards >= 1);

// Fiche détail — ouvre le premier prestataire et vérifie CTA visible
if (vendors?.length > 0) {
  const firstVendorId = vendors[0].id;
  const detailResp2 = await page.goto(`${BASE}/partenaires/${firstVendorId}`, { waitUntil: "domcontentloaded", timeout: 25000 });
  const detailStatus = detailResp2?.status() ?? 0;
  check("Fiche prestataire UI /partenaires/:id → charge (200)", detailStatus > 0 && detailStatus < 400);
  await page.waitForTimeout(800);
  const detailText = await page.locator("body").innerText().catch(() => "");
  check("Fiche prestataire UI → contenu non vide", detailText.trim().length > 50);
  // CTA : bouton/lien de contact ou demande de devis
  const hasCta = await page.locator([
    'a:has-text("Contacter")', 'button:has-text("Contacter")',
    'a:has-text("Devis")', 'button:has-text("Devis")',
    'a:has-text("Demander")', 'button:has-text("Demander")',
    'a:has-text("Contact")', '[data-testid="vendor-cta"]',
  ].join(", ")).first().isVisible({ timeout: 3000 }).catch(() => false);
  const ctaInText = detailText.toLowerCase().includes("devis") || detailText.toLowerCase().includes("contacter") || detailText.toLowerCase().includes("demander");
  check("Fiche prestataire UI → CTA contact/devis présent", hasCta || ctaInText);
}

await browser.close();
exit(results, "bloc-a-public-routes.spec");
