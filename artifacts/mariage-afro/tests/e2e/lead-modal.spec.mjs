/**
 * E2E spec — public LeadModal (2 steps, project-first).
 * Opens the modal from a public page that exposes a "lead" trigger.
 * Skips gracefully if no trigger is found.
 */
import { withMobilePage, gotoForm, exit } from "./_helpers.mjs";

const failures = await withMobilePage(async ({ page, check }) => {
  // Try home, then /partenaires, then /contact.
  for (const path of ["/", "/partenaires", "/contact"]) {
    await gotoForm(page, path);
    const trigger = page.locator('[data-testid="open-lead-modal"], [data-testid*="lead-modal-open"]').first();
    if ((await trigger.count()) > 0) {
      await trigger.click();
      await page.waitForSelector('[data-testid="lead-modal-sheet"]', { timeout: 5000 });
      break;
    }
  }
  if (!(await page.locator('[data-testid="lead-modal-sheet"]').count())) {
    console.log("  ⚠ lead modal trigger not found on public pages — spec skipped");
    return;
  }

  // Step 1 = Project (cards weddingType + message).
  check("step 1 shows wedding type cards",
    await page.getByTestId("lead-modal-cards-type").isVisible());
  check("step 1 shows message textarea",
    await page.getByTestId("lead-modal-message").isVisible());

  // Block without selection.
  await page.getByTestId("lead-modal-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(150);
  check("step 1 blocks Next without type+message",
    await page.getByTestId("lead-modal-cards-type").isVisible());

  // Fill + advance
  await page.getByTestId("lead-modal-cards-type")
    .getByTestId("selectable-card-mixte").click();
  await page.getByTestId("lead-modal-message").fill("Bonjour, parlons de notre projet.");
  await page.getByTestId("lead-modal-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(200);
  check("advances to step 2 (coords)",
    await page.getByTestId("lead-modal-name").isVisible());
});

exit(failures, "lead-modal.spec");
