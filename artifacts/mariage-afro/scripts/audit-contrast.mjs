#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOT = new URL("../src/", import.meta.url).pathname;

const RISKY = [
  {
    id: "text-gold-on-light",
    pattern: /\btext-gold(?![-/\w])/g,
    why:
      "text-gold (#c9a96e) ratio insuffisant sur fond clair (cream/blanc). " +
      "Utiliser text-gold-deep si le texte est porteur d'info, sinon documenter comme décoratif.",
  },
  {
    // cream sur dark : à /40 ratio ~4:1 (limite), /30 et moins fail AA pour body.
    id: "low-opacity-cream",
    pattern: /\btext-cream\/(?:[1-3][05]|40)\b/g,
    why:
      "Opacité ≤ 40 % sur texte cream → contraste insuffisant pour body. " +
      "Bumper à /50 minimum (ou /70 pour titres importants), ou marquer décoratif.",
  },
  {
    // wine-deep #1f1416 ≈ presque noir, ratio ~15:1 sur cream à 100 %.
    // /30 ≈ 2.5:1 (fail), /40 ≈ 3.5:1 (large text seulement).
    id: "low-opacity-wine-deep",
    pattern: /\btext-wine-deep\/(?:[1-3][05]|40)\b/g,
    why:
      "Opacité ≤ 40 % sur texte wine-deep → contraste insuffisant pour body. " +
      "Bumper à /50 minimum si porteur d'info.",
  },
  {
    // white sur dark : seuil identique à cream.
    id: "low-opacity-white",
    pattern: /\btext-white\/(?:[1-3][05]|40)\b/g,
    why: "Opacité ≤ 40 % sur texte blanc → contraste insuffisant pour body.",
  },
];

// Allow-list : fichiers qui contiennent uniquement du décoratif ou du dark-bg
// avéré pour ces classes (audités manuellement Tâche #65).
// Format : { file: glob substring, ids: [..] }
const ALLOW = [
  // Sidebar/dark contexts entièrement sur wine-deep
  { file: "components/vendor/VendorLayout.tsx", ids: ["text-gold-on-light", "low-opacity-cream"] },
  { file: "components/layout/Header.tsx", ids: ["text-gold-on-light", "low-opacity-cream"] },
  { file: "components/layout/Footer.tsx", ids: ["text-gold-on-light", "low-opacity-cream"] },
  { file: "components/home/HeroCinematicIntro.tsx", ids: ["text-gold-on-light"] },
  // Étoiles décoratives + boutons hover
  { file: "components/marketplace/ReviewStars.tsx", ids: ["text-gold-on-light"] },
  // Pages dont les hero/CTA sections sont en bg-wine-deep et utilisent gold legitement
  { file: "pages/lieux.tsx", ids: ["text-gold-on-light"] },
  { file: "pages/realisations.tsx", ids: ["text-gold-on-light"] },
  { file: "pages/services.tsx", ids: ["text-gold-on-light"] },
  { file: "pages/comparateur.tsx", ids: ["text-gold-on-light"] },
  { file: "pages/guide.tsx", ids: ["text-gold-on-light"] },
  { file: "pages/plateforme.tsx", ids: ["text-gold-on-light"] },
  { file: "pages/home.tsx", ids: ["text-gold-on-light"] },
  { file: "pages/prestations.tsx", ids: ["text-gold-on-light"] },
  { file: "pages/contact.tsx", ids: ["text-gold-on-light"] }, // info card sur bg-wine-deep
  { file: "pages/vendor/sign-in.tsx", ids: ["text-gold-on-light"] },
  { file: "pages/vendor/sign-up.tsx", ids: ["text-gold-on-light"] },
  { file: "pages/vendor/dashboard.tsx", ids: ["text-gold-on-light"] },
  { file: "pages/vendor/abonnement.tsx", ids: ["text-gold-on-light"] },
  { file: "pages/prestataires-detail.tsx", ids: ["text-gold-on-light"] }, // hero dark
  // Décor : icônes ≥5xl italics, citations
  { file: "components/marketplace/ComparatorBar.tsx", ids: ["text-gold-on-light"] },
  // Décor placeholders/helpers tolérés
  { file: "pages/home.tsx", ids: ["low-opacity-cream"] },
  // ComparatorBar : placeholder "add slot" en bordure pointillée, hint visuel.
  { file: "components/marketplace/ComparatorBar.tsx", ids: ["low-opacity-cream"] },
  // ReviewStars : étoiles vides (état "non noté"), purement décoratives.
  { file: "components/marketplace/ReviewStars.tsx", ids: ["low-opacity-wine-deep"] },
];

function allowed(relPath, id) {
  return ALLOW.some((a) => relPath.includes(a.file) && a.ids.includes(id));
}

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(tsx|jsx|ts|js)$/.test(e.name)) yield p;
  }
}

const violations = [];
let scanned = 0;

for await (const file of walk(ROOT)) {
  scanned++;
  const content = await readFile(file, "utf8");
  const rel = relative(ROOT, file);
  for (const r of RISKY) {
    if (allowed(rel, r.id)) continue;
    const matches = [...content.matchAll(r.pattern)];
    if (matches.length === 0) continue;
    for (const m of matches) {
      const before = content.slice(0, m.index);
      const line = before.split("\n").length;
      violations.push({ file: rel, line, id: r.id, match: m[0], why: r.why });
    }
  }
}

console.log(`Scanned ${scanned} source files under src/`);
if (violations.length === 0) {
  console.log("✓ No contrast hazard detected (all risky usages are allow-listed as dark-bg or decorative).");
  process.exit(0);
}

console.error(`\n✗ ${violations.length} potential contrast hazard(s):\n`);
const byFile = {};
for (const v of violations) (byFile[v.file] ??= []).push(v);
for (const [file, vs] of Object.entries(byFile)) {
  console.error(`  ${file}`);
  for (const v of vs) console.error(`    L${v.line}  ${v.id}  →  ${v.match}`);
}
console.error(`\nFix : remplacer text-gold par text-gold-deep si le texte est porteur d'info,`);
console.error(`ou bumper l'opacité à /70 minimum, ou ajouter le fichier à l'allow-list dans`);
console.error(`scripts/audit-contrast.mjs s'il s'agit d'un contexte dark-bg / décor confirmé.`);
process.exit(1);
