#!/usr/bin/env node
/**
 * Refonte forms smoke test — Playwright core.
 *
 * Drives the public Contact page (refondue en 4 étapes) :
 *  - validation Zod par étape (step 1 + step 2)
 *  - navigation entre étapes (cards + champs)
 *  - persistance sessionStorage après reload
 *
 * Usage :
 *   pnpm --filter @workspace/mariage-afro run dev   # in another shell
 *   node scripts/test-forms-refonte.mjs
 *
 * Env :
 *   FORMS_BASE_URL  default http://localhost:80
 */
import { chromium } from "playwright";

const BASE = process.env.FORMS_BASE_URL ?? "http://localhost:80";
const URL = `${BASE}/contact`;

const failures = [];
function check(label, cond) {
  if (cond) console.log(`  ✓ ${label}`);
  else { console.error(`  ✗ ${label}`); failures.push(label); }
}

async function run() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  console.log(`→ GET ${URL}`);
  const resp = await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
  check("page responds 200", resp && resp.status() === 200);
  await page.waitForSelector('[data-testid="contact-stepper"]', { timeout: 15000 });

  console.log("\n[Contact stepper]");

  // 1) Next without filling required fields → blocked.
  await page.getByTestId("stepper-next").click();
  await page.waitForTimeout(150);
  const stillStep1 = await page.getByTestId("input-contact-name").isVisible();
  check("step 1 blocks Next when empty", stillStep1);

  // 2) Fill step 1 → advance to step 2 (cards).
  await page.getByTestId("input-contact-name").fill("Alice Test");
  await page.getByTestId("input-contact-email").fill("alice@example.com");
  await page.getByTestId("stepper-next").click();
  await page.waitForTimeout(200);
  const onStep2 = await page.getByTestId("cards-wedding-type").isVisible();
  check("advances to step 2", onStep2);

  // 3) Step 2 — Next without selection → blocked.
  await page.getByTestId("stepper-next").click();
  await page.waitForTimeout(150);
  const stillStep2 = await page.getByTestId("cards-wedding-type").isVisible();
  check("step 2 blocks Next without card", stillStep2);

  // 4) Select an afro card → advance.
  await page
    .getByTestId("cards-wedding-type")
    .getByTestId("selectable-card-afro")
    .click();
  await page.getByTestId("stepper-next").click();
  await page.waitForTimeout(200);
  const onStep3 = await page.getByTestId("input-guest-count").isVisible();
  check("advances to step 3", onStep3);

  // 5) Skip optional details → step 4 (message).
  await page.getByTestId("stepper-next").click();
  await page.waitForTimeout(200);
  const onStep4 = await page.getByTestId("textarea-contact-message").isVisible();
  check("advances to step 4 (message)", onStep4);

  // 6) Reload → sessionStorage restores name.
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="input-contact-name"]', { timeout: 15000 });
  const restored = await page.getByTestId("input-contact-name").inputValue();
  check("sessionStorage restores name after reload", restored === "Alice Test");

  await browser.close();

  if (failures.length) {
    console.error(`\n✗ ${failures.length} failure(s)`);
    process.exit(1);
  } else {
    console.log("\n✓ All checks passed");
  }
}

run().catch((err) => {
  console.error("Runner crashed:", err);
  process.exit(2);
});
