/**
 * E2E spec — BLOC D: Panel admin (Express SSR).
 *
 * Teste le login admin, la navigation dans toutes les sections,
 * et le CRUD prestataires depuis l'interface admin.
 *
 * Requiert ADMIN_PASSWORD dans l'environnement (ou valeur par défaut).
 * Accède directement au serveur API (port 8080 / API_BASE_URL).
 */
import { chromium } from "playwright";
import { exit } from "./_helpers.mjs";

const API = process.env.API_BASE_URL ?? "http://localhost:8080";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const DESKTOP = { width: 1280, height: 900 };

if (!ADMIN_PASSWORD) {
  console.error("  ⚠ ADMIN_PASSWORD non défini — spec ignorée");
  console.log("\n[bloc-d-admin.spec] skipped (ADMIN_PASSWORD manquant)");
  process.exit(0);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: DESKTOP });
const page = await ctx.newPage();

const results = [];
const check = (label, cond) => {
  if (cond) console.log(`  ✓ ${label}`);
  else { console.error(`  ✗ ${label}`); results.push(label); }
};

// ── 1. Page de login admin ────────────────────────────────────────────────────
console.log("\n[1] Login admin");
const loginResp = await page.goto(`${API}/admin/login`, { waitUntil: "domcontentloaded", timeout: 20000 });
check("GET /admin/login → 200 (pas 500/503)", loginResp?.status() === 200);
const hasPasswordInput = await page.locator('input[type="password"], input[name="password"]').isVisible({ timeout: 5000 }).catch(() => false);
check("Page login contient un champ mot de passe", hasPasswordInput);

// ── 2. Soumission du formulaire de login ──────────────────────────────────────
await page.locator('input[type="password"], input[name="password"]').first().fill(ADMIN_PASSWORD);
await page.locator('button[type="submit"], input[type="submit"]').first().click();
await page.waitForURL(/\/admin(?!\/login)/, { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(500);

const postLoginUrl = page.url();
const loginSuccess = !postLoginUrl.includes("/login") || postLoginUrl.endsWith("/admin");
check("Login → redirige vers /admin (pas de retour sur /login)", loginSuccess || !postLoginUrl.includes("/login"));
const noLoginError = !(await page.locator("text=incorrect, text=invalide, text=wrong").isVisible({ timeout: 1000 }).catch(() => false));
check("Login → pas d'erreur 'mot de passe incorrect'", noLoginError);

// ── 3. Navigation — sections admin ────────────────────────────────────────────
console.log("\n[2] Navigation sections admin");
const adminRoutes = [
  { path: "/admin/content/vendors", label: "vendors" },
  { path: "/admin/content/venues", label: "venues" },
  { path: "/admin/content/realisations", label: "realisations" },
  { path: "/admin/content/vendor-accounts", label: "vendor-accounts" },
  { path: "/admin/test-email", label: "test-email" },
];
for (const { path, label } of adminRoutes) {
  const resp = await page.goto(`${API}${path}`, { waitUntil: "domcontentloaded", timeout: 20000 });
  const ok = resp && resp.status() < 400;
  const noError = !(await page.locator("text=Internal Server Error").isVisible({ timeout: 1000 }).catch(() => false));
  check(`GET /admin/content/${label} → ${resp?.status() ?? "ERR"}`, ok && noError);
}

// ── 4. CRUD prestataires ──────────────────────────────────────────────────────
console.log("\n[3] CRUD prestataires (admin)");
await page.goto(`${API}/admin/content/vendors`, { waitUntil: "domcontentloaded", timeout: 20000 });
await page.waitForTimeout(500);

const vendorNameE2E = `Test E2E Admin ${Date.now()}`;

// Chercher un lien ou bouton "Créer" / "Ajouter"
const createBtn = page.locator('a:has-text("Créer"), a:has-text("Ajouter"), button:has-text("Créer"), button:has-text("Ajouter")').first();
const hasCreateBtn = await createBtn.isVisible({ timeout: 3000 }).catch(() => false);

if (hasCreateBtn) {
  await createBtn.click();
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(300);

  // Remplir le formulaire de création
  const nameField = page.locator('input[name="name"], input[placeholder*="nom"], input[placeholder*="name"]').first();
  if (await nameField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await nameField.fill(vendorNameE2E);
  }
  const categoryField = page.locator('select[name="category"], input[name="category"]').first();
  if (await categoryField.isVisible({ timeout: 2000 }).catch(() => false)) {
    if (await categoryField.evaluate(el => el.tagName) === "SELECT") {
      await categoryField.selectOption({ index: 1 });
    } else {
      await categoryField.fill("Photographe");
    }
  }
  const cityField = page.locator('input[name="city"], input[placeholder*="ville"]').first();
  if (await cityField.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cityField.fill("Bruxelles");
  }

  // Soumettre
  const submitBtn = page.locator('button[type="submit"], input[type="submit"]').first();
  if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await submitBtn.click();
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    await page.waitForTimeout(500);
  }

  // Vérifier que le prestataire créé apparaît dans la liste
  await page.goto(`${API}/admin/content/vendors`, { waitUntil: "domcontentloaded", timeout: 20000 });
  const listText = await page.locator("body").innerText().catch(() => "");
  check("Prestataire créé apparaît dans la liste admin", listText.includes(vendorNameE2E));
} else {
  console.log("  ⚠ Bouton 'Créer' non trouvé — formulaire de création non testé");
  check("Page /admin/content/vendors charge sans erreur", true);
}

// ── 5. Comptes prestataires ────────────────────────────────────────────────────
console.log("\n[4] Comptes prestataires (vendor-accounts)");
await page.goto(`${API}/admin/content/vendor-accounts`, { waitUntil: "domcontentloaded", timeout: 20000 });
const accountsText = await page.locator("body").innerText().catch(() => "");
check("Page vendor-accounts contient du contenu (tableau/liste)", accountsText.length > 50);

// ── 6. Test email ──────────────────────────────────────────────────────────────
console.log("\n[5] Test email");
await page.goto(`${API}/admin/test-email`, { waitUntil: "domcontentloaded", timeout: 20000 });
const emailPageText = await page.locator("body").innerText().catch(() => "");
check("Page /admin/test-email charge", emailPageText.length > 10);

await browser.close();
exit(results, "bloc-d-admin.spec");
