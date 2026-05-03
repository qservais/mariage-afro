#!/usr/bin/env node
// One-shot favicon pack generator for Mariage Afro (Task #56).
// Generates ICO (multi-size) + PNG (16/32/48/180/192/512) + safari pinned-tab
// + site.webmanifest + updated favicon.svg from the canonical logo SVG.
//
// Usage: pnpm --filter @workspace/mariage-afro exec node scripts/generate-favicons.mjs
import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "..", "public");
const LOGO_SRC = join(__dirname, "..", "..", "..", "attached_assets", "logo-mariage-affro-02.svg");
const BORDEAUX = "#68191e";
const CREAM = "#fff4e4";

const rawLogo = readFileSync(LOGO_SRC, "utf8");
const logoSvgCream = rawLogo.replace(/#efede4/gi, CREAM);

async function makeIcon(size, outName, { roundedRatio = 0.18, logoRatio = 0.7 } = {}) {
  const radius = Math.round(size * roundedRatio);
  const logoSize = Math.round(size * logoRatio);
  const pad = Math.round((size - logoSize) / 2);
  const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${BORDEAUX}"/></svg>`;
  const logoBuf = await sharp(Buffer.from(logoSvgCream))
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const buf = await sharp(Buffer.from(bgSvg))
    .composite([{ input: logoBuf, top: pad, left: pad }])
    .png()
    .toBuffer();
  writeFileSync(join(PUBLIC, outName), buf);
  return buf;
}

const sizes = {
  "favicon-16x16.png": 16,
  "favicon-32x32.png": 32,
  "favicon-48x48.png": 48,
  "apple-touch-icon.png": 180,
  "android-chrome-192x192.png": 192,
  "android-chrome-512x512.png": 512,
};
const buffers = {};
for (const [name, size] of Object.entries(sizes)) {
  buffers[size] = await makeIcon(size, name);
}

// Multi-size ICO with PNG-embedded entries (16/32/48)
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  const dirEntries = [];
  const imageData = [];
  let offset = 6 + entries.length * 16;
  for (const { size, buf } of entries) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size === 256 ? 0 : size, 0);
    e.writeUInt8(size === 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    dirEntries.push(e);
    imageData.push(buf);
    offset += buf.length;
  }
  return Buffer.concat([header, ...dirEntries, ...imageData]);
}
writeFileSync(
  join(PUBLIC, "favicon.ico"),
  buildIco([
    { size: 16, buf: buffers[16] },
    { size: 32, buf: buffers[32] },
    { size: 48, buf: buffers[48] },
  ])
);

// Safari pinned-tab: monochrome (Safari recolors via mask-icon color)
writeFileSync(join(PUBLIC, "safari-pinned-tab.svg"), rawLogo.replace(/#efede4/gi, "#000000"));

// Replace favicon.svg placeholder with rounded bordeaux + cream logo composition
const innerLogoBody = logoSvgCream.match(/<svg[^>]*>([\s\S]*?)<\/svg>/)[1];
const newFaviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" rx="32" ry="32" fill="${BORDEAUX}"/><svg x="27" y="27" width="126" height="126" viewBox="0 0 343.46 390.61" preserveAspectRatio="xMidYMid meet">${innerLogoBody}</svg></svg>`;
writeFileSync(join(PUBLIC, "favicon.svg"), newFaviconSvg);

// Web manifest
const manifest = {
  name: "Mariage Afro",
  short_name: "Mariage Afro",
  description: "Plateforme premium dédiée aux mariages afro et mixtes en Belgique.",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: CREAM,
  theme_color: BORDEAUX,
  lang: "fr-BE",
  icons: [
    { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
    { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
  ],
};
writeFileSync(join(PUBLIC, "site.webmanifest"), JSON.stringify(manifest, null, 2));

console.log("Generated favicon assets:");
for (const f of readdirSync(PUBLIC).filter((x) => /favicon|android|apple|safari|webmanifest/i.test(x))) {
  console.log(`  ${f} — ${statSync(join(PUBLIC, f)).size} bytes`);
}
