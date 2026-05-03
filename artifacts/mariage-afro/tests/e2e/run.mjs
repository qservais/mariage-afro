#!/usr/bin/env node
/** Sequential runner for all 5 form e2e specs. */
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const specs = readdirSync(here)
  .filter((f) => f.endsWith(".spec.mjs"))
  .sort();

let failed = 0;
for (const s of specs) {
  console.log(`\n=== ${s} ===`);
  const r = spawnSync(process.execPath, [join(here, s)], { stdio: "inherit", env: process.env });
  if (r.status !== 0) failed += 1;
}
if (failed > 0) {
  console.error(`\n${failed} spec(s) failed`);
  process.exit(1);
}
console.log("\nAll specs passed.");
