/**
 * E2E spec — BLOC A: routes publiques, formulaire contact, outils, marketplace.
 * Vérifie que toutes les routes publiques répondent sans page blanche ni crash,
 * et que les formulaires contact, budget, quiz et multi-devis fonctionnent.
 *
 * Smoke test: aucun login requis.
 */
import { chromium } from "playwright";
import { BASE, exit } from "./_helpers.mjs";

const API = process.env.API_BASE_URL ?? "http://localhost:8080";
const DESKTOP = { width: 1280, height: 720 };

/** Vérifie qu'une route charge sans page blanche ni Internal Server Error. */
async function checkRoute(page, check, path) {
  const resp = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 20000 });
  const ok = resp && resp.status() < 400;
  const noError = !(await page.locator("text=Internal Server Error").isVisible({ timeout: 1000 }).catch(() => false));
  const hasContent = (await page.locator("body").innerText().catch(() => "")).trim().length > 10;
  check(`GET ${path} → ${resp?.status() ?? "ERR"} (pas d'erreur serveur)`, ok && noError && hasContent);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: DESKTOP });
const page = await ctx.newPage();

const results = [];
const check = (label, cond) => {
  if (cond) console.log(`  ✓ ${label}`);
  else { console.error(`  ✗ ${label}`); results.push(label); }
};

// ── 1. Smoke test routes publiques ────────────────────────────────────────────
console.log("\n[1] Smoke test — routes publiques");
const publicRoutes = [
  "/",
  "/plateforme",
  "/services",
  "/partenaires",
  "/comparateur",
  "/lieux",
  "/a-propos",
  "/contact",
  "/outils/budget",
  "/outils/quiz",
  "/mentions-legales",
  "/espace-client/login",
  "/espace-pro/login",
];
for (const route of publicRoutes) {
  await checkRoute(page, check, route);
}

// ── 2. API public routes ───────────────────────────────────────────────────────
console.log("\n[2] API — routes publiques");
const vendorsResp = await fetch(`${API}/api/marketplace/vendors`);
check("GET /api/marketplace/vendors → 200", vendorsResp.status === 200);
const vendors = await vendorsResp.json().catch(() => null);
check("GET /api/marketplace/vendors → array non vide", Array.isArray(vendors) && vendors.length > 0);

// ── 3. Formulaire contact (API direct) ────────────────────────────────────────
console.log("\n[3] Formulaire contact");
const contactPayload = {
  name: "Test E2E Public",
  email: "test-bloc-a@example.com",
  message: "Test automatisé BLOC A",
  weddingType: "afro",
  guestCount: "100",
};
const contactResp = await fetch(`${API}/api/contact`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(contactPayload),
});
check("POST /api/contact → 200", contactResp.status === 200);
const contactBody = await contactResp.json().catch(() => null);
check("POST /api/contact → {success:true}", contactBody?.success === true);

// ── 4. Multi-devis (API direct) ───────────────────────────────────────────────
console.log("\n[4] Multi-devis API");
const multiDevisResp = await fetch(`${API}/api/leads/multi-devis`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Multi Test BLOC A",
    email: "multi-bloc-a@example.com",
    phone: null,
    message: "Test multi-devis automatisé",
    vendorIds: [1, 2],
  }),
});
check("POST /api/leads/multi-devis → 200", multiDevisResp.status === 200);
const multiBody = await multiDevisResp.json().catch(() => null);
check("POST /api/leads/multi-devis → count > 0", (multiBody?.count ?? 0) > 0 || multiBody?.success === true);

// ── 5. Calculateur budget (UI) ────────────────────────────────────────────────
// Steps: 0=guests, 1=region, 2=standing, 3=services, 4=month → result
console.log("\n[5] Calculateur budget /outils/budget");
await page.goto(`${BASE}/outils/budget`, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(1000);
const budgetBody = await page.locator("body").innerText().catch(() => "");
check("Budget calculator charge (contenu visible)", budgetBody.length > 50 && !budgetBody.includes("Internal Server Error"));

// Step 0 — guest count
const guestInput = page.locator('[data-testid="input-guest-count"]');
if (await guestInput.isVisible({ timeout: 2000 }).catch(() => false)) {
  await guestInput.fill("80");
  await page.waitForTimeout(100);
}
// Click through all steps using budget-next button
for (let step = 0; step < 5; step++) {
  // Select first available option per step type
  const firstOption = page.locator(`[data-testid^="region-"], [data-testid^="standing-"], [data-testid^="month-"]`).first();
  if (await firstOption.count() > 0) {
    await firstOption.click({ force: true }).catch(() => {});
    await page.waitForTimeout(150);
  }
  const nextBtn = page.locator('[data-testid="budget-next"]').first();
  if (await nextBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await nextBtn.click().catch(() => {});
    await page.waitForTimeout(400);
  } else break;
}
// Result step should show budget-chart with € values
const resultVisible = await page.locator('[data-testid="budget-step-result"], [data-testid="budget-chart"]').isVisible({ timeout: 3000 }).catch(() => false);
const bodyAfterBudget = await page.locator("body").innerText().catch(() => "");
const hasEuro = bodyAfterBudget.includes("€");
check("Budget calculator affiche un résultat avec €", hasEuro || resultVisible);

// ── 6. Quiz style (UI) ────────────────────────────────────────────────────────
console.log("\n[6] Quiz style /outils/quiz");
await page.goto(`${BASE}/outils/quiz`, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(1000);
const quizBody = await page.locator("body").innerText().catch(() => "");
check("Quiz style charge (contenu visible)", quizBody.length > 50 && !quizBody.includes("Internal Server Error"));

for (let i = 0; i < 10; i++) {
  const card = page.locator('[data-testid^="selectable-card-"]').first();
  if (await card.count() > 0) {
    await card.click({ force: true }).catch(() => {});
    await page.waitForTimeout(150);
  }
  const qNext = page.locator('[data-testid="stepper-next"], button:has-text("Suivant")').first();
  if (await qNext.isVisible({ timeout: 800 }).catch(() => false)) {
    await qNext.click().catch(() => {});
    await page.waitForTimeout(400);
  } else break;
}
const quizFinalBody = await page.locator("body").innerText().catch(() => "");
check("Quiz style termine sans crash (page toujours visible)", quizFinalBody.length > 30);

// ── 7. Marketplace prestataires (UI) ─────────────────────────────────────────
console.log("\n[7] Marketplace /partenaires");
await page.goto(`${BASE}/partenaires`, { waitUntil: "domcontentloaded", timeout: 20000 });
await page.waitForLoadState("networkidle").catch(() => {});
await page.waitForTimeout(500);
const vendorCards = await page.locator('[data-testid="vendor-card"], article, .vendor-card').count();
check("Marketplace affiche au moins 1 prestataire", vendorCards > 0);

// ── 8. Fiche prestataire individuelle ────────────────────────────────────────
console.log("\n[8] Fiche prestataire individuelle");
if (vendors && vendors.length > 0) {
  const slug = vendors[0].slug ?? vendors[0].id;
  const detailResp = await fetch(`${API}/api/marketplace/vendors/${slug}`);
  check(`GET /api/marketplace/vendors/${slug} → 200`, detailResp.status === 200);
  const vendor = await detailResp.json().catch(() => null);
  check("Fiche prestataire contient name + category", !!vendor?.name && !!vendor?.category);
} else {
  console.log("  ⚠ Aucun prestataire en base — fiche individuelle non testée");
}

await browser.close();
exit(results, "bloc-a-public-routes.spec");
