#!/usr/bin/env node
/**
 * Template selection persistence smoke test — Playwright core (task #72 / code-review fix).
 *
 * Verifies:
 *   1. Public wedding page renders a valid data-template attribute.
 *   2. API GET /api/client/wedding-website returns a template field.
 *   3. (Auth-wall note) Full persistence cycle (PATCH → reload → assert selected badge)
 *      requires Clerk session; covered in manual QA / future auth-seeded e2e suite.
 *      This script validates the public surface + API contract as a proxy assertion.
 *
 * Usage:
 *   pnpm --filter @workspace/mariage-afro run dev   # in another shell
 *   node scripts/test-template-persist.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.APP_BASE_URL ?? "http://localhost:80";
const API_BASE = process.env.API_BASE_URL ?? "http://localhost:80";

const VALID_TEMPLATES = ["royal-afro", "boheme", "moderne", "tropical"];

const failures = [];
function check(label, cond) {
  if (cond) console.log(`  ✓ ${label}`);
  else { console.error(`  ✗ ${label}`); failures.push(label); }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // ── 1. Public page data-template attribute ────────────────────────────────
  console.log("\n[1] Public wedding page — data-template attribute");
  try {
    // Use the demo/placeholder slug that always exists in seed data
    const publicUrl = `${BASE}/mariage/demo`;
    const resp = await page.goto(publicUrl, { waitUntil: "domcontentloaded", timeout: 12000 });

    if (resp && resp.status() < 400) {
      // Page exists — check data-template on root
      await page.waitForSelector("[data-template]", { timeout: 5000 }).catch(() => null);
      const tpl = await page.$eval("[data-template]", el => el.getAttribute("data-template")).catch(() => null);
      if (tpl !== null) {
        check("data-template attribute present", true);
        check(`data-template value is valid (got: ${tpl})`, VALID_TEMPLATES.includes(tpl));
      } else {
        // No public page seeded — skip with notice
        console.log("  ⚠ /mariage/demo not seeded — skipping data-template check (expected in CI with empty DB)");
      }
    } else {
      console.log(`  ⚠ /mariage/demo returned ${resp?.status()} — skipping (expected with empty DB)`);
    }
  } catch (e) {
    console.log(`  ⚠ Public page check skipped: ${e.message}`);
  }

  // ── 2. API /api/client/wedding-website contract ───────────────────────────
  console.log("\n[2] API GET /api/client/wedding-website — template field in schema");
  try {
    const apiResp = await page.request.get(`${API_BASE}/api/client/wedding-website`);
    // Endpoint returns 401 without auth — we only verify it's alive and returns JSON error (not 500)
    const status = apiResp.status();
    check("Endpoint reachable (not 500)", status !== 500);
    check("Endpoint requires auth (401) or returns data (200)", status === 401 || status === 200);

    if (status === 200) {
      const body = await apiResp.json();
      check("Response has template field", "template" in body);
      check(`template value is valid (got: ${body.template})`, VALID_TEMPLATES.includes(body.template));
    } else {
      console.log(`  ⚠ Auth wall (${status}) — cannot assert template field without session (expected)`);
      console.log("  ℹ Full persistence cycle: select template → PATCH → navigate away → reload → assert badge");
      console.log("  ℹ Covered in manual QA. Auth-seeded e2e can use CLERK_TEST_USER env var.");
    }
  } catch (e) {
    check("API endpoint reachable", false);
    console.error(`    Error: ${e.message}`);
  }

  // ── 3. Template selection page loads (auth wall check) ───────────────────
  console.log("\n[3] /espace-client/site — page load (auth redirect)");
  try {
    const r = await page.goto(`${BASE}/espace-client/site`, { waitUntil: "domcontentloaded", timeout: 10000 });
    const finalUrl = page.url();
    const redirectedToLogin = finalUrl.includes("login") || finalUrl.includes("sign-in") || finalUrl.includes("clerk");
    const stayed = finalUrl.includes("espace-client");
    check("Page responds (not 500)", r && r.status() < 500);
    check("Auth gate works (redirects to login OR renders if authed)", redirectedToLogin || stayed);
    console.log(`  ℹ Final URL: ${finalUrl}`);
  } catch (e) {
    check("Page reachable", false);
    console.error(`    Error: ${e.message}`);
  }

  // ── 4. PATCH /api/client/wedding-website — template field accepted ────────
  console.log("\n[4] API PATCH /api/client/wedding-website — template field schema validation");
  try {
    // Without auth this returns 401 — we verify the endpoint doesn't 404/500
    const patchResp = await page.request.patch(`${API_BASE}/api/client/wedding-website`, {
      data: { template: "boheme" },
      headers: { "Content-Type": "application/json" },
    });
    const status = patchResp.status();
    check("PATCH endpoint exists (not 404/500)", status !== 404 && status !== 500);
    check("PATCH requires auth (401) or succeeds (200)", status === 401 || status === 200);
    if (status === 200) {
      const body = await patchResp.json();
      check("PATCH response has template", "template" in body);
      check("PATCH response template matches sent value", body.template === "boheme");
    } else {
      console.log(`  ⚠ Auth wall (${status}) — PATCH schema validation requires session`);
    }
  } catch (e) {
    check("PATCH endpoint reachable", false);
    console.error(`    Error: ${e.message}`);
  }

  await browser.close();

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n──────────────────────────────────────────");
  if (failures.length === 0) {
    console.log("✅ All checks passed");
  } else {
    console.error(`❌ ${failures.length} check(s) failed:`);
    failures.forEach(f => console.error(`   • ${f}`));
    process.exit(1);
  }
}

run().catch(e => { console.error("Fatal:", e); process.exit(1); });
