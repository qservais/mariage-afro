#!/usr/bin/env node
/**
 * Refonte forms smoke test — Playwright core (full spec, task #67).
 *
 * Drives the public Contact page in its new 4-step order (per spec):
 *   1) Projet (cards weddingType + date + guests)
 *   2) Besoins (cards services + cards budget) — optional
 *   3) Coordonnées (name + email + phone)
 *   4) Message + récap with "Modifier" buttons
 *
 * Verifies:
 *   - Validation Zod on each step
 *   - Card selection drives advancement
 *   - Summary card "Modifier" buttons jump back via goTo()
 *   - sessionStorage persistence after reload
 *   - Mobile viewport renders the stepper at 375x812
 *
 * Usage:
 *   pnpm --filter @workspace/mariage-afro run dev   # in another shell
 *   node scripts/test-forms-refonte.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.FORMS_BASE_URL ?? "http://localhost:80";
const URL = `${BASE}/contact`;

const failures = [];
function check(label, cond) {
  if (cond) console.log(`  ✓ ${label}`);
  else { console.error(`  ✗ ${label}`); failures.push(label); }
}

async function fillStep1Project(page) {
  await page
    .getByTestId("cards-wedding-type")
    .getByTestId("selectable-card-afro")
    .click();
  await page.getByTestId("input-contact-date").fill("2027-06-12");
  await page.getByTestId("input-guest-count").fill("120");
}

async function run() {
  const browser = await chromium.launch();
  // Mobile-first per spec.
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();

  console.log(`→ GET ${URL} (mobile 375x812)`);
  const resp = await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
  check("page responds 200", resp && resp.status() === 200);
  await page.waitForSelector('[data-testid="contact-stepper"]', { timeout: 15000 });

  console.log("\n[Contact stepper — new step order]");

  // 1) Step 1 (project) — Next without selecting wedding type → blocked.
  await page.getByTestId("contact-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(150);
  const stillStep1 = await page.getByTestId("cards-wedding-type").isVisible();
  check("step 1 blocks Next without wedding type card", stillStep1);

  // 2) Pick afro card + extras → step 2 (needs).
  await fillStep1Project(page);
  await page.getByTestId("contact-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(200);
  const onStep2 = await page.getByTestId("cards-services").isVisible();
  check("advances to step 2 (needs cards)", onStep2);

  // 3) Step 2 is OPTIONAL → Next without selection should advance.
  await page.getByTestId("contact-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(200);
  const onStep3 = await page.getByTestId("input-contact-name").isVisible();
  check("step 2 (optional) skips through to step 3 (coords)", onStep3);

  // 4) Step 3 — Next without name/email → blocked.
  await page.getByTestId("contact-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(150);
  const stillStep3 = await page.getByTestId("input-contact-name").isVisible();
  check("step 3 blocks Next when name/email empty", stillStep3);

  // 5) Fill coords → step 4.
  await page.getByTestId("input-contact-name").fill("Alice Test");
  await page.getByTestId("input-contact-email").fill("alice@example.com");
  await page.getByTestId("contact-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(200);
  const onStep4 = await page.getByTestId("textarea-contact-message").isVisible();
  check("advances to step 4 (message + summary)", onStep4);

  // 6) Summary card visible.
  const summaryVisible = await page.getByTestId("contact-summary").isVisible();
  check("recap card visible on step 4", summaryVisible);

  // 7) "Modifier coords" jumps back to step 3.
  await page.getByTestId("summary-edit-coords").click();
  await page.waitForTimeout(200);
  const backOnStep3 = await page.getByTestId("input-contact-name").isVisible();
  const restoredName = await page.getByTestId("input-contact-name").inputValue();
  check("Modifier→coords navigates back to step 3", backOnStep3);
  check("name persists when navigating back", restoredName === "Alice Test");

  // 8) Forward again to step 4 then "Modifier projet" → step 1.
  await page.getByTestId("contact-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(200); // step 4 again
  await page.getByTestId("summary-edit-project").click();
  await page.waitForTimeout(200);
  const backOnStep1 = await page.getByTestId("cards-wedding-type").isVisible();
  check("Modifier→projet navigates back to step 1", backOnStep1);

  // 9) Reload → sessionStorage restores name + selected wedding type card.
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="contact-stepper"]', { timeout: 15000 });
  // We're on step 1 visually — but stepIndex resets, persisted values remain.
  // Walk back to step 3 to verify name still there.
  await page
    .getByTestId("cards-wedding-type")
    .getByTestId("selectable-card-afro")
    .first()
    .click({ force: true });
  await page.getByTestId("contact-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(150);
  await page.getByTestId("contact-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(150);
  const persistedName = await page.getByTestId("input-contact-name").inputValue();
  check("sessionStorage restores name after reload", persistedName === "Alice Test");

  await browser.close();

  if (failures.length > 0) {
    console.error(`\n${failures.length} failure(s):`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log("\nAll smoke checks passed.");
}

run().catch((e) => { console.error(e); process.exit(1); });
