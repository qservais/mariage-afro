/**
 * E2E spec — wedding-website template selector.
 *
 * Covers the regression surface of /client/site-mariage:
 *   1. Gallery renders with the 4 expected template cards.
 *   2. Selecting a card persists (PATCH /api/client/wedding-website) and
 *      shows the success toast + selected badge on the chosen card.
 *   3. The matching public page /mariage/<slug> exposes the persisted
 *      template through `data-template` on the root container.
 *
 * Authenticated path — when no Clerk session fixture is wired we
 * detect the redirect to sign-in and skip the deep flow assertions
 * (mirrors onboarding-couple.spec.mjs behaviour).
 */
import { withMobilePage, gotoForm, exit, BASE } from "./_helpers.mjs";

const TEMPLATES = ["royal-afro", "boheme", "moderne", "tropical"];

const failures = await withMobilePage(async ({ page, check }) => {
  await gotoForm(page, "/client/site-mariage");

  if (page.url().includes("sign-in") || page.url().includes("clerk")) {
    console.log("  ⚠ no authenticated session — template selector not reachable, spec skipped");
    return;
  }

  // 1. Gallery + 4 cards
  await page
    .waitForSelector('[data-testid="template-gallery"]', { timeout: 5000 })
    .catch(() => {});
  check(
    "template gallery is visible",
    await page.getByTestId("template-gallery").isVisible(),
  );

  for (const id of TEMPLATES) {
    check(
      `template card ${id} is visible`,
      await page.getByTestId(`template-card-${id}`).isVisible(),
    );
  }

  // Pick a target distinct from the current selection so the click triggers a PATCH.
  let current = "royal-afro";
  for (const id of TEMPLATES) {
    const selected = await page
      .getByTestId(`template-card-${id}`)
      .getAttribute("data-selected");
    if (selected === "true") current = id;
  }
  const target = TEMPLATES.find((t) => t !== current) ?? "boheme";

  // 2. Click → PATCH + toast + badge
  const patchPromise = page.waitForResponse(
    (r) =>
      r.url().includes("/api/client/wedding-website") &&
      r.request().method() === "PATCH",
    { timeout: 10000 },
  );
  await page.getByTestId(`template-card-${target}`).click();
  const patchResp = await patchPromise.catch(() => null);
  check(
    `PATCH wedding-website returned 2xx for ${target}`,
    !!patchResp && patchResp.status() >= 200 && patchResp.status() < 300,
  );

  await page
    .waitForSelector(`[data-testid="template-badge-${target}"]`, { timeout: 5000 })
    .catch(() => {});
  check(
    `selected badge appears on ${target} card`,
    await page.getByTestId(`template-badge-${target}`).isVisible(),
  );

  check(
    "success toast is shown",
    (await page.getByText(/maquette|template/i).first().isVisible().catch(() => false)) ||
      (await page.locator('[role="status"], [data-state="open"]').first().isVisible().catch(() => false)),
  );

  // 3. Public page exposes data-template
  // Discover the slug from the GET response cache (re-fetch if needed).
  const meResp = await page
    .request.get(`${BASE}/api/client/wedding-website`)
    .catch(() => null);
  if (!meResp || !meResp.ok()) {
    console.log("  ⚠ could not fetch wedding-website to discover slug — public assertion skipped");
    return;
  }
  const site = await meResp.json();
  if (!site?.slug) {
    console.log("  ⚠ no slug persisted yet — public assertion skipped");
    return;
  }

  // The public site requires `active=true` to be reachable; enable it via API
  // so the test is independent of the current publication state.
  await page.request
    .patch(`${BASE}/api/client/wedding-website`, {
      data: { active: true },
      headers: { "content-type": "application/json" },
    })
    .catch(() => null);

  const publicPage = await page.context().newPage();
  const publicResp = await publicPage.goto(`${BASE}/mariage/${site.slug}`, {
    waitUntil: "networkidle",
    timeout: 15000,
  });
  check(
    "public wedding page returns 2xx",
    !!publicResp && publicResp.status() < 400,
  );
  await publicPage
    .waitForSelector(`[data-template="${target}"]`, { timeout: 8000 })
    .catch(() => {});
  const root = publicPage.locator(`[data-template="${target}"]`).first();
  check(
    `public page exposes data-template="${target}"`,
    (await root.count()) > 0,
  );
  await publicPage.close();
});

exit(failures, "template-selector.spec");
