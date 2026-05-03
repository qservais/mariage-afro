/**
 * Tiny test helpers shared by the 5 form e2e specs.
 * Uses playwright-core (already a dep) — no @playwright/test runner required.
 */
import { chromium } from "playwright";

export const BASE = process.env.FORMS_BASE_URL ?? "http://localhost:80";
export const MOBILE_VIEWPORT = { width: 375, height: 812 }; // iPhone-ish, per spec

export async function withMobilePage(fn) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: MOBILE_VIEWPORT });
  const page = await ctx.newPage();
  const results = [];
  const check = (label, cond) => {
    if (cond) console.log(`  ✓ ${label}`);
    else { console.error(`  ✗ ${label}`); results.push(label); }
  };
  try {
    await fn({ page, check, ctx });
  } finally {
    await browser.close();
  }
  return results;
}

export async function gotoForm(page, path) {
  console.log(`→ GET ${BASE}${path} (375x812)`);
  const resp = await page.goto(`${BASE}${path}`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  if (!resp || resp.status() >= 400) throw new Error(`Failed GET ${path}: ${resp?.status()}`);
}

export function exit(failures, suite) {
  if (failures.length > 0) {
    console.error(`\n[${suite}] ${failures.length} failure(s)`);
    process.exit(1);
  }
  console.log(`\n[${suite}] all passed.`);
}
