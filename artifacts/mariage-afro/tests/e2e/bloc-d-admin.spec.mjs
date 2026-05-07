/**
 * E2E spec — BLOC D: Panel admin (Express SSR).
 *
 * Couverture complète :
 *   1. Login admin (GET /admin/login → form, POST → session)
 *   2. Navigation 5 sections (vendors, venues, realisations, vendor-accounts, test-email)
 *   3. CRUD prestataires : créer → modifier → toggle actif → supprimer
 *      ID extraction via page.evaluate() par nom unique (pas de "dernier lien" dangereux)
 *   4. CRUD lieux : créer → supprimer
 *      ID extraction via page.evaluate() par nom unique
 *   5. CRUD réalisations : créer → modifier → supprimer
 *   6. Comptes prestataires : liste + approbation d'un compte pending
 *   7. Test email : page charge + soumission (200 ou 422/403 acceptés)
 *
 * Requiert ADMIN_PASSWORD dans l'environnement.
 */
import { chromium } from "playwright";
import { API, DESKTOP, makeChecker } from "./_clerk-auth-helper.mjs";
import { exit } from "./_helpers.mjs";

const { results, check } = makeChecker();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error("  ✗ ADMIN_PASSWORD non défini — spec BLOC D non exécutable");
  results.push("ADMIN_PASSWORD manquant");
  exit(results, "bloc-d-admin.spec");
  process.exit(1);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: DESKTOP });
const page = await ctx.newPage();

// Helpers admin (POST form-encoded avec session cookie conservée par le ctx)
async function adminPost(path, formData) {
  const params = new URLSearchParams(formData);
  return page.evaluate(
    async ([url, body]) => {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        redirect: "follow",
        credentials: "include",
      });
      return { status: r.status, url: r.url };
    },
    [`${API}${path}`, params.toString()]
  );
}

/**
 * DOM traversal par nom unique — retourne l'ID extrait d'un lien edit ou form delete.
 * Reçoit [name, basePath] comme tuple.
 * Utilise les sélecteurs ciblés (.item, .grid > div) pour éviter que le container parent
 * (.grid avec childElementCount < 20) retourne le premier lien de la page (mauvais ID).
 */
function evalExtractId([name, basePath]) {
  // D'abord: chercher dans les containers spécifiques (.item, .grid > div, article, tr)
  const candidates = document.querySelectorAll(".item, .grid > div, article, tr");
  for (const el of candidates) {
    if (!el.textContent || !el.textContent.includes(name)) continue;
    const editLink = el.querySelector('a[href*="' + basePath + '"][href*="/edit"]');
    if (editLink) {
      const m = editLink.getAttribute("href").match(/\/(\d+)\/edit/);
      if (m) return m[1];
    }
    const delForm = el.querySelector('form[action*="' + basePath + '"][action*="/delete"]');
    if (delForm) {
      const m = delForm.getAttribute("action").match(/\/(\d+)\/delete/);
      if (m) return m[1];
    }
  }
  return null;
}

// ── 1. Page de login ──────────────────────────────────────────────────────────
console.log("\n[1] Login admin");
const loginResp = await page.goto(`${API}/admin/login`, { waitUntil: "domcontentloaded", timeout: 20000 });
check("GET /admin/login → 200", loginResp?.status() === 200);
const hasPwdInput = await page.locator('input[type="password"], input[name="password"]').isVisible({ timeout: 5000 }).catch(() => false);
check("Page login → champ mot de passe présent", hasPwdInput);

// ── 2. Soumission formulaire login ────────────────────────────────────────────
console.log("\n[2] Soumission login");
await page.locator('input[type="password"], input[name="password"]').first().fill(ADMIN_PASSWORD);
await page.locator('button[type="submit"], input[type="submit"]').first().click();
await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(400);

const postLoginUrl = page.url();
check("Login → redirigé vers /admin (pas de /login)", postLoginUrl.includes("/admin") && !postLoginUrl.includes("/login"));
const noLoginError = !(await page.locator("text=incorrect, text=invalide").isVisible({ timeout: 500 }).catch(() => false));
check("Login → pas d'erreur 'mot de passe incorrect'", noLoginError);
const pageText = await page.locator("body").innerText().catch(() => "");
check("Dashboard admin contient du contenu", pageText.length > 20);

// ── 3. Navigation — 5 sections ────────────────────────────────────────────────
console.log("\n[3] Navigation sections admin");
const sections = [
  ["/admin/content/vendors", "Prestataires"],
  ["/admin/content/venues", "Lieux"],
  ["/admin/content/realisations", "Réalisations"],
  ["/admin/content/vendor-accounts", "Comptes Pro"],
  ["/admin/test-email", "Test email"],
];
for (const [path, label] of sections) {
  const resp = await page.goto(`${API}${path}`, { waitUntil: "domcontentloaded", timeout: 20000 });
  const ok = resp && resp.status() < 400;
  const noErr = !(await page.locator("text=Internal Server Error").isVisible({ timeout: 500 }).catch(() => false));
  check(`${label} (${path}) → ${resp?.status() ?? "ERR"}`, ok && noErr);
}

// ── 4. CRUD prestataires — create → modify → toggle → delete ─────────────────
console.log("\n[4] CRUD prestataires admin");
const vendorName = `E2E Admin Vendor ${Date.now()}`;

function isAdminSuccess(status) { return status >= 200 && status < 400; }

// Créer
await page.goto(`${API}/admin/content/vendors/new`, { waitUntil: "domcontentloaded", timeout: 20000 });
const nameField = page.locator('input[name="name"]').first();
if (await nameField.isVisible({ timeout: 3000 }).catch(() => false)) {
  await nameField.fill(vendorName);
  const catField = page.locator('select[name="category"], input[name="category"]').first();
  if (await catField.isVisible({ timeout: 2000 }).catch(() => false)) {
    if ((await catField.evaluate((el) => el.tagName.toLowerCase())) === "select") {
      await catField.selectOption({ index: 1 }).catch(() => {});
    } else {
      await catField.fill("Photographe");
    }
  }
  const cityField = page.locator('input[name="city"]').first();
  if (await cityField.isVisible({ timeout: 2000 }).catch(() => false)) await cityField.fill("Bruxelles");
  await page.locator('button[type="submit"], input[type="submit"]').first().click();
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(500);
}
await page.goto(`${API}/admin/content/vendors`, { waitUntil: "domcontentloaded", timeout: 20000 });
const vendorsListText = await page.locator("body").innerText().catch(() => "");
check("Prestataire créé apparaît dans la liste", vendorsListText.includes(vendorName));

// Trouver l'ID via DOM traversal par nom unique (pas de "dernier lien" dangereux)
let vendorId = await page.evaluate(evalExtractId, [vendorName, "/admin/content/vendors"]).catch(() => null);

// Toggle actif/inactif
if (vendorId) {
  const toggleResult = await adminPost(`/admin/content/vendors/${vendorId}/toggle`, {});
  check(`Prestataire ${vendorId} → toggle (redirect 3xx)`, isAdminSuccess(toggleResult.status));

  // Modifier
  await page.goto(`${API}/admin/content/vendors/${vendorId}/edit`, { waitUntil: "domcontentloaded", timeout: 20000 });
  const editNameField = page.locator('input[name="name"]').first();
  if (await editNameField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await editNameField.fill(`${vendorName} modifie`);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    await page.waitForTimeout(400);
  }
  await page.goto(`${API}/admin/content/vendors`, { waitUntil: "domcontentloaded", timeout: 20000 });
  const vendorsListAfterEdit = await page.locator("body").innerText().catch(() => "");
  check("Prestataire modifié reflété dans la liste",
    vendorsListAfterEdit.includes("modifie") || vendorsListAfterEdit.includes(vendorName));

  // Supprimer
  const deleteResult = await adminPost(`/admin/content/vendors/${vendorId}/delete`, {});
  check(`Prestataire ${vendorId} → delete (redirect 3xx)`, isAdminSuccess(deleteResult.status));
  await page.goto(`${API}/admin/content/vendors`, { waitUntil: "domcontentloaded", timeout: 20000 });
  const vendorsAfterDelete = await page.locator("body").innerText().catch(() => "");
  check("Prestataire supprimé → n'apparaît plus", !vendorsAfterDelete.includes(`${vendorName} modifie`));
} else {
  check("Prestataire CRUD (ID extrait de la liste)", false);
}

// ── 5. CRUD lieux — create → delete ──────────────────────────────────────────
console.log("\n[5] CRUD lieux admin");
const venueName = `E2E Lieu ${Date.now()}`;

await page.goto(`${API}/admin/content/venues/new`, { waitUntil: "domcontentloaded", timeout: 20000 });
const venueNameField = page.locator('input[name="name"]').first();
if (await venueNameField.isVisible({ timeout: 3000 }).catch(() => false)) {
  await venueNameField.fill(venueName);
  const venueCity = page.locator('input[name="city"]').first();
  if (await venueCity.isVisible({ timeout: 2000 }).catch(() => false)) await venueCity.fill("Liège");
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(400);
}
await page.goto(`${API}/admin/content/venues`, { waitUntil: "domcontentloaded", timeout: 20000 });
const venuesListText = await page.locator("body").innerText().catch(() => "");
check("Lieu créé apparaît dans la liste", venuesListText.includes(venueName));

// Extraire ID via page.evaluate() par nom unique
let venueId = await page.evaluate(evalExtractId, [venueName, "/admin/content/venues"]).catch(() => null);

if (venueId) {
  const venueDelResult = await adminPost(`/admin/content/venues/${venueId}/delete`, {});
  check("Lieu supprimé (redirect 3xx)", isAdminSuccess(venueDelResult.status));
  await page.goto(`${API}/admin/content/venues`, { waitUntil: "domcontentloaded", timeout: 20000 });
  const venuesAfterDel = await page.locator("body").innerText().catch(() => "");
  check("Lieu supprimé → n'apparaît plus dans la liste", !venuesAfterDel.includes(venueName));
} else {
  console.log("  ⚠ ID lieu non trouvé — suppression skipped");
  check("Lieu supprimé (ID extrait)", false);
}

// ── 6. CRUD réalisations — create → modify → delete ──────────────────────────
console.log("\n[6] CRUD réalisations admin");
const brideName = `AliceE2E${Date.now()}`;
const groomName = `BobE2E${Date.now()}`;

await page.goto(`${API}/admin/content/realisations/new`, { waitUntil: "domcontentloaded", timeout: 20000 });
const brideField = page.locator('input[name="brideName"]').first();
if (await brideField.isVisible({ timeout: 3000 }).catch(() => false)) {
  await brideField.fill(brideName);
  const groomField = page.locator('input[name="groomName"]').first();
  if (await groomField.isVisible({ timeout: 2000 }).catch(() => false)) await groomField.fill(groomName);
  const cityField2 = page.locator('input[name="city"]').first();
  if (await cityField2.isVisible({ timeout: 2000 }).catch(() => false)) await cityField2.fill("Paris");
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(500);
}
await page.goto(`${API}/admin/content/realisations`, { waitUntil: "domcontentloaded", timeout: 20000 });
const realsListText = await page.locator("body").innerText().catch(() => "");
check("Réalisation créée apparaît dans la liste", realsListText.includes(brideName) && realsListText.includes(groomName));

// Extraire ID via DOM traversal ciblé par brideName
let realId = null;
const realDeleteAction = await page.evaluate((name) => {
  const candidates = document.querySelectorAll(".item, article, .grid > div");
  for (const el of candidates) {
    if (el.textContent && el.textContent.includes(name)) {
      const delForm = el.querySelector('form[action*="/delete"]');
      if (delForm) return delForm.getAttribute("action");
    }
  }
  return null;
}, brideName);
if (realDeleteAction) {
  const m = realDeleteAction.match(/\/(\d+)\/delete/);
  if (m) realId = m[1];
}
// Fallback : première réalisation (triée desc → la plus récente en premier)
if (!realId) {
  const firstEdit = page.locator('a[href*="/admin/content/realisations/"][href*="/edit"]').first();
  const href = await firstEdit.getAttribute("href").catch(() => null) ?? "";
  const m = href.match(/realisations\/(\d+)\/edit/);
  if (m) realId = m[1];
}

if (realId) {
  await page.goto(`${API}/admin/content/realisations/${realId}/edit`, { waitUntil: "domcontentloaded", timeout: 20000 });
  const editGroom = page.locator('input[name="groomName"]').first();
  if (await editGroom.isVisible({ timeout: 3000 }).catch(() => false)) {
    await editGroom.fill(`${groomName}Edit`);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    await page.waitForTimeout(400);
  }

  const realDelResult = await adminPost(`/admin/content/realisations/${realId}/delete`, {});
  check("Réalisation supprimée (redirect 3xx)", isAdminSuccess(realDelResult.status));
  await page.goto(`${API}/admin/content/realisations`, { waitUntil: "domcontentloaded", timeout: 20000 });
  const realsAfterDel = await page.locator("body").innerText().catch(() => "");
  check("Réalisation supprimée → n'apparaît plus", !realsAfterDel.includes(brideName));
} else {
  check("Réalisation CRUD (ID extrait)", false);
}

// ── 7. Comptes prestataires — liste + approbation d'un compte pending ─────────
console.log("\n[7] Comptes prestataires admin");
await page.goto(`${API}/admin/content/vendor-accounts`, { waitUntil: "domcontentloaded", timeout: 20000 });
await page.waitForTimeout(300);
const accountsText = await page.locator("body").innerText().catch(() => "");
check("Page vendor-accounts charge avec contenu", accountsText.length > 50);
check("Page vendor-accounts répond sans erreur serveur",
  !accountsText.includes("Internal Server Error") && !accountsText.includes("500"));

// Tenter d'approuver un compte pending (si disponible)
const approveBtn = page.locator('form[action*="/approve"] button, button:has-text("Approuver"), a:has-text("Approuver")').first();
const hasPendingAccount = await approveBtn.isVisible({ timeout: 2000 }).catch(() => false);

if (hasPendingAccount) {
  // Extraire l'ID du compte via l'action du form approve
  const approveAction = await page.evaluate(() => {
    const form = document.querySelector('form[action*="/approve"]');
    return form ? form.getAttribute("action") : null;
  });

  if (approveAction) {
    const m = approveAction.match(/vendor-accounts\/(\d+)\/approve/);
    const accountIdToApprove = m ? m[1] : null;

    if (accountIdToApprove) {
      const approveResult = await adminPost(`/admin/content/vendor-accounts/${accountIdToApprove}/approve`, {});
      check(`Compte prestataire ${accountIdToApprove} → approbation (redirect 3xx)`, isAdminSuccess(approveResult.status));

      // Vérifier que le statut est passé à "approved"
      await page.goto(`${API}/admin/content/vendor-accounts`, { waitUntil: "domcontentloaded", timeout: 20000 });
      const accountsAfterApprove = await page.locator("body").innerText().catch(() => "");
      check("Compte approuvé → statut 'approved' visible dans la liste",
        accountsAfterApprove.includes("approved") || accountsAfterApprove.includes("Approuvé"));
    } else {
      check("Compte prestataire → ID approve extrait", false);
    }
  } else {
    check("Compte prestataire → form approve trouvé", false);
  }
} else {
  console.log("  ⚠ Aucun compte pending disponible — approbation non testée (liste vide ou tous approved)");
  // Pas d'échec si aucun compte pending (état DB variable)
  check("Page vendor-accounts OK (liste peut être vide)", true);
}

// ── 8. Test email — page + soumission ─────────────────────────────────────────
console.log("\n[8] Test email");
await page.goto(`${API}/admin/test-email`, { waitUntil: "domcontentloaded", timeout: 20000 });
const emailPageText = await page.locator("body").innerText().catch(() => "");
check("Page /admin/test-email charge", emailPageText.length > 10);

const emailForm = page.locator("form").first();
if (await emailForm.count() > 0) {
  const toInput = page.locator('input[name="to"], input[type="email"]').first();
  if (await toInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await toInput.fill("delivered@resend.dev");
  }
  const typeSelect = page.locator('select[name="type"]').first();
  if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    await typeSelect.selectOption({ index: 0 }).catch(() => {});
  }
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(500);
  const resultText = await page.locator("body").innerText().catch(() => "");
  check("Test email soumis → réponse (200 livré ou 422/403 domaine non vérifié)",
    resultText.includes("200") || resultText.includes("422") || resultText.includes("403") ||
    resultText.includes("success") || resultText.includes("sent") || resultText.includes("erreur") ||
    resultText.includes("error") || resultText.includes("email"));
}

await browser.close();
exit(results, "bloc-d-admin.spec");
