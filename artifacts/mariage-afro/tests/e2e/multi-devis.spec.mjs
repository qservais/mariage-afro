/**
 * E2E spec — public MultiDevisForm (3 steps with vendor selection).
 * Visits /partenaires, opens the multi-devis modal, validates the
 * vendor selection step + sticky footer counter + Continue CTA.
 *
 * Skips gracefully when no comparator is available.
 */
import { withMobilePage, gotoForm, exit } from "./_helpers.mjs";

const failures = await withMobilePage(async ({ page, check }) => {
  await gotoForm(page, "/partenaires");
  await page.waitForLoadState("networkidle");

  // Find and click any element that opens the multi-devis sheet.
  const opener = page.locator('[data-testid*="multi-devis-open"], [data-testid="open-multi-devis"]').first();
  if ((await opener.count()) === 0) {
    console.log("  ⚠ multi-devis opener not present on /partenaires — spec skipped");
    return;
  }
  await opener.click();
  await page.waitForSelector('[data-testid="multi-devis-sheet"]', { timeout: 5000 });

  check("vendor selection list rendered",
    await page.getByTestId("multi-devis-vendor-list").isVisible());
  check("sticky footer counter rendered",
    await page.getByTestId("multi-devis-sticky-counter").isVisible());

  // Sticky footer "Continue" CTA
  const stickyCta = page.getByTestId("multi-devis-sticky-cta");
  check("sticky footer has Continue CTA", await stickyCta.count() === 1);

  // Deselect all vendors → Next should be blocked.
  const checkboxes = await page.locator('[data-testid^="multi-devis-vendor-"][data-state="selected"]').all();
  for (const cb of checkboxes) await cb.click();
  await page.waitForTimeout(150);
  await stickyCta.click();
  await page.waitForTimeout(150);
  check("step 1 blocks Continue with 0 vendors selected",
    await page.getByTestId("multi-devis-vendor-list").isVisible());
});

exit(failures, "multi-devis.spec");
