/**
 * E2E spec — public Contact form (4 steps + recap with "Modifier").
 * Mobile viewport 375x812, validates: card selection, optional skip,
 * Zod errors, summary navigation back via goTo, sessionStorage persistence.
 */
import { withMobilePage, gotoForm, exit } from "./_helpers.mjs";

const failures = await withMobilePage(async ({ page, check }) => {
  await gotoForm(page, "/contact");
  await page.waitForSelector('[data-testid="contact-stepper"]', { timeout: 15000 });

  // Step 1 (project) — block without wedding type
  await page.getByTestId("contact-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(150);
  check("step 1 blocks Next without wedding type card",
    await page.getByTestId("cards-wedding-type").isVisible());

  // Pick afro card + extras
  await page.getByTestId("cards-wedding-type")
    .getByTestId("selectable-card-afro").click();
  await page.getByTestId("input-contact-date").fill("2027-06-12");
  await page.getByTestId("input-guest-count").fill("120");
  await page.getByTestId("contact-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(200);
  check("advances to step 2 (needs cards)",
    await page.getByTestId("cards-services").isVisible());

  // Step 2 optional → can skip
  await page.getByTestId("contact-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(200);
  check("step 2 (optional) skips through",
    await page.getByTestId("input-contact-name").isVisible());

  // Step 3 — block without name/email
  await page.getByTestId("contact-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(150);
  check("step 3 blocks Next when empty",
    await page.getByTestId("input-contact-name").isVisible());

  await page.getByTestId("input-contact-name").fill("Alice Test");
  await page.getByTestId("input-contact-email").fill("alice@example.com");
  await page.getByTestId("contact-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(200);
  check("advances to step 4 (message + summary)",
    await page.getByTestId("textarea-contact-message").isVisible());
  check("recap card visible on step 4",
    await page.getByTestId("contact-summary").isVisible());

  // Modifier → coords
  await page.getByTestId("summary-edit-coords").click();
  await page.waitForTimeout(200);
  const restored = await page.getByTestId("input-contact-name").inputValue();
  check("Modifier→coords navigates back AND keeps name", restored === "Alice Test");

  // Forward to step 4 again then Modifier → projet
  await page.getByTestId("contact-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(200);
  await page.getByTestId("summary-edit-project").click();
  await page.waitForTimeout(200);
  check("Modifier→projet navigates back to step 1",
    await page.getByTestId("cards-wedding-type").isVisible());

  // Persistence — reload, navigate back to step 3, name should remain
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="contact-stepper"]', { timeout: 15000 });
  await page.getByTestId("cards-wedding-type")
    .getByTestId("selectable-card-afro").first().click({ force: true });
  await page.getByTestId("contact-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(150);
  await page.getByTestId("contact-stepper").locator('[data-testid="stepper-next"]').click();
  await page.waitForTimeout(150);
  const persistedName = await page.getByTestId("input-contact-name").inputValue();
  check("sessionStorage restores name after reload", persistedName === "Alice Test");
});

exit(failures, "contact.spec");
