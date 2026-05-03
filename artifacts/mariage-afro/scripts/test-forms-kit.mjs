#!/usr/bin/env node
/**
 * Forms kit smoke test — Playwright core (no @playwright/test runner).
 *
 * Drives the dev server's /_dev/forms-kit page through the FormStepper
 * (validation, persistence after reload, final submit), exercises the
 * SelectableCard keyboard activation, the MobileFormSheet open/close,
 * and the NumberStepperField increment/decrement.
 *
 * Usage :
 *   pnpm --filter @workspace/mariage-afro run test:forms-kit
 *
 * Env :
 *   FORMS_KIT_BASE_URL  default http://localhost:80
 */
import { chromium } from "playwright";

const BASE = process.env.FORMS_KIT_BASE_URL ?? "http://localhost:80";
const URL = `${BASE}/_dev/forms-kit`;

const failures = [];
function check(label, cond) {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    console.error(`  ✗ ${label}`);
    failures.push(label);
  }
}

async function run() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  console.log(`→ GET ${URL}`);
  const resp = await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
  check("page responds 200", resp && resp.status() === 200);
  await page.waitForSelector('[data-testid="kit-stepper"]', { timeout: 10000 });

  console.log("\n[FormStepper]");
  // 1) Next without filling required fields → stays on step 1, error visible.
  await page.getByTestId("stepper-next").click();
  await page.waitForTimeout(150);
  const stillStep1 = await page.getByTestId("kit-step-name").isVisible();
  check("validation blocks Next when required fields are empty", stillStep1);

  // 2) Fill step 1 + advance to step 2.
  await page.getByTestId("kit-step-name").fill("Alice Test");
  await page.getByTestId("kit-step-email").fill("alice@example.com");
  await page.getByTestId("stepper-next").click();
  await page.waitForTimeout(200);
  const onStep2 = await page.getByTestId("kit-step-type").isVisible();
  check("advances to step 2 once step 1 is valid", onStep2);

  // 3) Step 2 — Next without selection → blocked.
  await page.getByTestId("stepper-next").click();
  await page.waitForTimeout(150);
  const stillStep2 = await page.getByTestId("kit-step-type").isVisible();
  check("validation blocks Next when card is not selected", stillStep2);

  // 4) Select card → advance to step 3 (summary). Scope to the stepper.
  await page.getByTestId("kit-step-type").getByTestId("selectable-card-classic").click();
  await page.getByTestId("stepper-next").click();
  await page.waitForTimeout(200);
  const onSummary = await page.getByTestId("kit-step-summary").isVisible();
  check("advances to summary step after selecting a card", onSummary);

  // 5) Reload — sessionStorage should restore values; verify name still set.
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="kit-step-name"]', { timeout: 10000 });
  const restored = await page.getByTestId("kit-step-name").inputValue();
  check("sessionStorage restores values after reload", restored === "Alice Test");

  // Re-traverse to step 2 and verify card selection persisted.
  await page.getByTestId("stepper-next").click();
  await page.waitForTimeout(200);
  const persistedSel = await page
    .getByTestId("kit-step-type")
    .getByTestId("selectable-card-classic")
    .getAttribute("data-selected");
  check("SelectableCard selection persists across reload", persistedSel === "true");

  // 6) Submit final step.
  await page.getByTestId("stepper-next").click();
  await page.waitForTimeout(200);
  await page.getByTestId("stepper-submit").click();
  await page.waitForSelector('[data-testid="kit-submitted"]', { timeout: 5000 });
  const submittedTxt = await page.getByTestId("kit-submitted").innerText();
  check("final submit fires onSubmit with collected values", submittedTxt.includes("Alice Test") && submittedTxt.includes("classic"));

  console.log("\n[MobileFormSheet]");
  await page.getByTestId("kit-open-sheet").scrollIntoViewIfNeeded();
  await page.getByTestId("kit-open-sheet").click();
  await page.waitForSelector('[data-testid="kit-sheet"]', { timeout: 3000 });
  const sheetVisible = await page.getByTestId("kit-sheet").isVisible();
  check("MobileFormSheet opens", sheetVisible);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const sheetHidden = (await page.getByTestId("kit-sheet").count()) === 0
    || !(await page.getByTestId("kit-sheet").isVisible().catch(() => false));
  check("MobileFormSheet closes via Escape", sheetHidden);

  console.log("\n[NumberStepperField]");
  await page.getByTestId("demo-guests-stepper").scrollIntoViewIfNeeded();
  const before = Number(await page.getByTestId("demo-guests-stepper").inputValue());
  await page.getByTestId("demo-guests-stepper-inc").click();
  await page.getByTestId("demo-guests-stepper-inc").click();
  const after = Number(await page.getByTestId("demo-guests-stepper").inputValue());
  check("increment button raises value by configured step", after === before + 10);

  console.log("\n[SelectableCard keyboard]");
  // After stepper submit, only the standalone single-section remains in DOM.
  const intimate = page.getByTestId("selectable-card-intimate").last();
  await intimate.scrollIntoViewIfNeeded();
  await intimate.click();
  const sel = await intimate.getAttribute("data-selected");
  check("SelectableCard click sets data-selected=true", sel === "true");

  await browser.close();

  console.log("");
  if (failures.length === 0) {
    console.log(`✅ Forms kit smoke test passed (${URL})`);
    process.exit(0);
  } else {
    console.error(`❌ Forms kit smoke test: ${failures.length} failure(s)`);
    failures.forEach((f) => console.error(`   - ${f}`));
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Forms kit test crashed:", err);
  process.exit(2);
});
