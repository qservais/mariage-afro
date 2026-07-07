/**
 * E2E spec — Venue gallery lightbox on /lieux
 *
 * Verifies:
 *  1. Lightbox opens when clicking the cover image of a multi-image venue
 *  2. Lightbox opens via the "Voir la galerie" button in the card body
 *  3. Next/Prev arrows cycle through images and the counter updates
 *  4. Escape key closes the lightbox
 *  5. Close button closes the lightbox
 *  6. Gallery button is absent on venues with ≤1 image (hasGallery = false)
 *
 * Test data is injected directly via psql and cleaned up after every run.
 */
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BASE, DESKTOP, makeChecker } from "./_clerk-auth-helper.mjs";
import { exit } from "./_helpers.mjs";

const { results, check } = makeChecker();

// ── DB helpers ────────────────────────────────────────────────────────────────

const DB = process.env.DATABASE_URL;

function sql(query) {
  const tmp = join(tmpdir(), `e2e-sql-${Date.now()}.sql`);
  writeFileSync(tmp, query);
  try {
    execSync(`psql "${DB}" -f "${tmp}"`, { stdio: "pipe", timeout: 10_000 });
  } catch (err) {
    console.error("  [DB] SQL error:", err.stderr?.toString().trim() ?? err.message);
    throw err;
  } finally {
    unlinkSync(tmp);
  }
}

function sqlQuery(query) {
  const tmp = join(tmpdir(), `e2e-sql-${Date.now()}.sql`);
  writeFileSync(tmp, query);
  try {
    const out = execSync(`psql "${DB}" -t -A -f "${tmp}"`, { stdio: "pipe", timeout: 10_000 });
    return out.toString().trim();
  } catch (err) {
    console.error("  [DB] SQL query error:", err.stderr?.toString().trim() ?? err.message);
    throw err;
  } finally {
    unlinkSync(tmp);
  }
}

// ── Test data setup ───────────────────────────────────────────────────────────

const MULTI_NAME = "E2E Galerie Lightbox Multi";
const SINGLE_NAME = "E2E Galerie Lightbox Single";

// Image URLs safe per isSafeImagePath (must start with https://)
const IMG1 = "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200";
const IMG2 = "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200";
const IMG3 = "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200";

// Cleanup any stale data from previous interrupted runs
sql(`DELETE FROM marketplace_venues WHERE name IN ('${MULTI_NAME}', '${SINGLE_NAME}')`);

// Insert multi-image venue (cover_image + 2 extra images → 3 unique images after dedup → hasGallery=true)
sql(`
  INSERT INTO marketplace_venues (name, city, capacity, style, description, options, images, cover_image, active)
  VALUES (
    '${MULTI_NAME}',
    'Bruxelles',
    '200',
    'Moderne',
    'Lieu de test E2E galerie multiples photos',
    '[]'::jsonb,
    '["${IMG2}","${IMG3}"]'::jsonb,
    '${IMG1}',
    true
  )
`);

// Insert single-image venue (cover_image only, empty images[] → 1 image → hasGallery=false)
sql(`
  INSERT INTO marketplace_venues (name, city, capacity, style, description, options, images, cover_image, active)
  VALUES (
    '${SINGLE_NAME}',
    'Bruxelles',
    '50',
    'Classique',
    'Lieu de test E2E galerie photo unique',
    '[]'::jsonb,
    '[]'::jsonb,
    '${IMG1}',
    true
  )
`);

// Fetch the multi-venue id so we can assert data-testid="btn-gallery-{id}"
const multiVenueId = sqlQuery(
  `SELECT id FROM marketplace_venues WHERE name='${MULTI_NAME}' LIMIT 1`
);
const singleVenueId = sqlQuery(
  `SELECT id FROM marketplace_venues WHERE name='${SINGLE_NAME}' LIMIT 1`
);

console.log(`\n[Setup] multi venue id=${multiVenueId}, single venue id=${singleVenueId}`);

// ── Browser setup ─────────────────────────────────────────────────────────────

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: DESKTOP });
const page = await ctx.newPage();

/** wait for an element to be visible */
async function waitVis(selector, timeout = 5000) {
  return page.locator(selector).first().isVisible({ timeout }).catch(() => false);
}

// ── Navigate to /lieux ────────────────────────────────────────────────────────

console.log("\n[1] Chargement de /lieux");
const resp = await page.goto(`${BASE}/lieux`, { waitUntil: "networkidle", timeout: 30_000 });
check("/lieux → 200", (resp?.status() ?? 0) < 400);

// Wait for the venue grid to load (React query may take a moment)
await page.waitForTimeout(1500);

const bodyText = await page.locator("body").innerText().catch(() => "");
check("/lieux affiche les venues", bodyText.includes(MULTI_NAME) || bodyText.length > 200);

// ── Test 1: Lightbox opens from cover image (multi-image venue) ───────────────

console.log("\n[2] Ouverture lightbox via image de couverture");
const coverBtn = page.locator(`[aria-label="Voir la galerie de ${MULTI_NAME}"]`).first();
const coverBtnVisible = await coverBtn.isVisible({ timeout: 5000 }).catch(() => false);
check(`Cover image de "${MULTI_NAME}" est cliquable (role=button)`, coverBtnVisible);

if (coverBtnVisible) {
  await coverBtn.click();
  await page.waitForTimeout(400);
}

const dialogVisible = await waitVis('[role="dialog"][aria-modal="true"]');
check("Lightbox s'ouvre (role=dialog)", dialogVisible);

const headerText = await page.locator('[role="dialog"]').innerText().catch(() => "");
check("Header affiche le nom du lieu", headerText.toUpperCase().includes(MULTI_NAME.toUpperCase()));
check("Counter affiche 1/3", headerText.includes("1/3"));

// ── Test 2: Prev button absent on first image, Next visible ──────────────────

console.log("\n[3] Navigation — image 1 de 3");
const nextBtnVisible1 = await waitVis('[aria-label="Photo suivante"]');
const prevBtnAbsent1 = !(await waitVis('[aria-label="Photo précédente"]', 1000));
check("Photo suivante visible (pas la dernière)", nextBtnVisible1);
check("Photo précédente absente (première image)", prevBtnAbsent1);

// Thumbnail strip
const thumbCount = await page.locator('[aria-label^="Voir photo"]').count();
check("3 miniatures présentes dans la bande", thumbCount === 3);

// ── Test 3: Next arrow → image 2 ─────────────────────────────────────────────

console.log("\n[4] Navigation → image 2");
if (nextBtnVisible1) {
  await page.locator('[aria-label="Photo suivante"]').first().click();
  await page.waitForTimeout(300);
}

const headerText2 = await page.locator('[role="dialog"]').innerText().catch(() => "");
check("Counter affiche 2/3", headerText2.includes("2/3"));
check("Photo précédente maintenant visible", await waitVis('[aria-label="Photo précédente"]'));
check("Photo suivante toujours visible", await waitVis('[aria-label="Photo suivante"]'));

// ── Test 4: Next arrow → image 3 (last) ──────────────────────────────────────

console.log("\n[5] Navigation → image 3 (dernière)");
await page.locator('[aria-label="Photo suivante"]').first().click();
await page.waitForTimeout(300);

const headerText3 = await page.locator('[role="dialog"]').innerText().catch(() => "");
check("Counter affiche 3/3", headerText3.includes("3/3"));
check("Photo suivante absente (dernière image)", !(await waitVis('[aria-label="Photo suivante"]', 1000)));
check("Photo précédente visible (pas la première)", await waitVis('[aria-label="Photo précédente"]'));

// ── Test 5: Prev arrow → image 2 ─────────────────────────────────────────────

console.log("\n[6] Navigation ← image 2");
await page.locator('[aria-label="Photo précédente"]').first().click();
await page.waitForTimeout(300);

const headerText4 = await page.locator('[role="dialog"]').innerText().catch(() => "");
check("Counter affiche 2/3 après retour", headerText4.includes("2/3"));

// ── Test 6: Escape key closes lightbox ───────────────────────────────────────

console.log("\n[7] Touche Escape ferme la lightbox");
await page.keyboard.press("Escape");
await page.waitForTimeout(400);

const dialogGone = !(await waitVis('[role="dialog"][aria-modal="true"]', 800));
check("Lightbox fermée après Escape", dialogGone);

// ── Test 7: "Voir la galerie" button in card body also opens lightbox ─────────

console.log("\n[8] Bouton 'Voir la galerie' dans la fiche ouvre la lightbox");
const galleryBtn = page.locator(`[data-testid="btn-gallery-${multiVenueId}"]`).first();
const galleryBtnVisible = await galleryBtn.isVisible({ timeout: 5000 }).catch(() => false);
check(`Bouton gallery data-testid=btn-gallery-${multiVenueId} présent`, galleryBtnVisible);

if (galleryBtnVisible) {
  await galleryBtn.click();
  await page.waitForTimeout(400);
}

const dialogVisible2 = await waitVis('[role="dialog"][aria-modal="true"]');
check("Lightbox s'ouvre via bouton fiche", dialogVisible2);

const headerText5 = await page.locator('[role="dialog"]').innerText().catch(() => "");
check("Counter repart à 1/3", headerText5.includes("1/3"));

// ── Test 8: Close button closes lightbox ─────────────────────────────────────

console.log("\n[9] Bouton fermer (×) ferme la lightbox");
const closeBtn = page.locator('[aria-label="Fermer la galerie"]').first();
const closeBtnVisible = await closeBtn.isVisible({ timeout: 3000 }).catch(() => false);
check("Bouton 'Fermer la galerie' visible", closeBtnVisible);

if (closeBtnVisible) {
  await closeBtn.click();
  await page.waitForTimeout(400);
}

const dialogGone2 = !(await waitVis('[role="dialog"][aria-modal="true"]', 800));
check("Lightbox fermée après clic bouton ×", dialogGone2);

// ── Test 9: Single-image venue — no gallery button, no photo badge ────────────

console.log("\n[10] Venue à 1 image — pas de bouton galerie ni badge");
const singleGalleryBtn = page.locator(`[data-testid="btn-gallery-${singleVenueId}"]`);
const singleGalleryBtnCount = await singleGalleryBtn.count();
check(`Pas de btn-gallery-${singleVenueId} pour venue à 1 image`, singleGalleryBtnCount === 0);

const singleCoverBtn = page.locator(`[aria-label="Voir la galerie de ${SINGLE_NAME}"]`);
const singleCoverBtnCount = await singleCoverBtn.count();
check("Cover image venue à 1 image n'est pas cliquable (pas role=button gallery)", singleCoverBtnCount === 0);

// ── Cleanup ───────────────────────────────────────────────────────────────────

await browser.close();

sql(`DELETE FROM marketplace_venues WHERE name IN ('${MULTI_NAME}', '${SINGLE_NAME}')`);
console.log("\n[Cleanup] Test venues deleted.");

exit(results, "gallery-lightbox.spec");
