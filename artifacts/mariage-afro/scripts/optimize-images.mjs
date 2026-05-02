#!/usr/bin/env node
// Image optimization pipeline for LOT 10.
// Generates AVIF + WebP siblings next to every JPG/JPEG/PNG in attached_assets/
// so the <Picture> component can serve modern formats with JPG/PNG fallback.
//
// Usage: pnpm --filter @workspace/mariage-afro run optimize-images
// Idempotent: skips files where the AVIF/WebP sibling is newer than the source.

import { readdirSync, statSync, existsSync } from "node:fs";
import { join, extname, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, "..", "..", "..", "attached_assets");
const EXTS = new Set([".jpg", ".jpeg", ".png"]);

let processed = 0;
let skipped = 0;

async function processOne(src) {
  const ext = extname(src).toLowerCase();
  if (!EXTS.has(ext)) return;
  const base = src.slice(0, -ext.length);
  const avif = `${base}.avif`;
  const webp = `${base}.webp`;
  const srcStat = statSync(src);

  const needsAvif = !existsSync(avif) || statSync(avif).mtimeMs < srcStat.mtimeMs;
  const needsWebp = !existsSync(webp) || statSync(webp).mtimeMs < srcStat.mtimeMs;

  if (!needsAvif && !needsWebp) {
    skipped++;
    return;
  }

  const pipeline = sharp(src).rotate(); // honor EXIF orientation
  if (needsAvif) {
    await pipeline.clone().avif({ quality: 55, effort: 4 }).toFile(avif);
  }
  if (needsWebp) {
    await pipeline.clone().webp({ quality: 78 }).toFile(webp);
  }
  processed++;
  console.log(`✓ ${basename(src)}`);
}

async function main() {
  if (!existsSync(ASSETS_DIR)) {
    console.error(`No attached_assets directory at ${ASSETS_DIR}`);
    process.exit(1);
  }
  const files = readdirSync(ASSETS_DIR).map((f) => join(ASSETS_DIR, f));
  for (const f of files) {
    try {
      await processOne(f);
    } catch (err) {
      console.error(`✗ ${basename(f)}: ${err.message}`);
    }
  }
  console.log(`\nOptimized ${processed}, skipped ${skipped} (up to date).`);
}

main();
