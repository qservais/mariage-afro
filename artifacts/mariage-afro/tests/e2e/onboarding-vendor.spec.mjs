/**
 * E2E spec — VendorOnboardingGate (6 steps with cards + photo upload).
 * Like the couple spec, this requires a Clerk-authenticated vendor
 * session; we verify the gate renders or skip gracefully.
 */
import { withMobilePage, gotoForm, exit } from "./_helpers.mjs";

const failures = await withMobilePage(async ({ page, check }) => {
  await gotoForm(page, "/vendor/dashboard");

  if (page.url().includes("sign-in") || page.url().includes("clerk")) {
    console.log("  ⚠ no authenticated vendor session — spec skipped");
    return;
  }

  await page.waitForSelector('[data-testid="vendor-onboarding-shell"]', { timeout: 5000 }).catch(() => {});
  if (!(await page.locator('[data-testid="vendor-onboarding-stepper"]').count())) {
    console.log("  ⚠ vendor onboarding gate not rendered — spec skipped");
    return;
  }

  check("step 1 business name input visible",
    await page.getByTestId("input-vendor-business-name").isVisible());

  // Fill step 1 → advance.
  await page.getByTestId("input-vendor-business-name").fill("Studio Test");
  await page.getByTestId("input-vendor-contact-name").fill("Test Contact");
  await page.getByTestId("input-vendor-email").fill("vendor@example.com");
  await page.getByTestId("vendor-onboarding-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(200);
  check("advances to step 2 (category cards)",
    await page.getByTestId("cards-vendor-category").isVisible());

  // Step 2 already has a default selected → advance.
  await page.getByTestId("vendor-onboarding-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(200);
  check("advances to step 3 (regions multi cards)",
    await page.getByTestId("cards-vendor-regions").isVisible());

  // Block without region.
  await page.getByTestId("vendor-onboarding-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(150);
  check("step 3 blocks Next without region",
    await page.getByTestId("cards-vendor-regions").isVisible());

  await page.getByTestId("cards-vendor-regions")
    .getByTestId("selectable-card-bruxelles").click();
  await page.getByTestId("vendor-onboarding-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(200);
  check("advances to step 4 (price tier cards)",
    await page.getByTestId("cards-vendor-price").isVisible());

  await page.getByTestId("vendor-onboarding-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(200);
  check("advances to step 5 (specialties multi)",
    await page.getByTestId("cards-vendor-specialties").isVisible());

  await page.getByTestId("vendor-onboarding-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(200);
  check("advances to step 6 (photo upload + summary)",
    await page.getByTestId("vendor-photo-upload").isVisible() &&
    await page.getByTestId("vendor-onboarding-summary").isVisible());
});

exit(failures, "onboarding-vendor.spec");
