import fs from 'fs';
import path from 'path';

const SRC = new URL('../src', import.meta.url).pathname;
const LOCALES_DIR = path.join(SRC, 'locales');

function flat(obj, prefix='') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flat(v, key));
    else out[key] = String(v);
  }
  return out;
}

function loadLocale(lang) {
  return flat(JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${lang}.json`), 'utf8')));
}

const fr = loadLocale('fr'), nl = loadLocale('nl'), en = loadLocale('en');
const allKeys = new Set([...Object.keys(fr), ...Object.keys(nl), ...Object.keys(en)]);

// === SECTION 1: missing keys ===
const missingByLang = { fr: [], nl: [], en: [] };
for (const k of allKeys) {
  if (!(k in fr)) missingByLang.fr.push(k);
  if (!(k in nl)) missingByLang.nl.push(k);
  if (!(k in en)) missingByLang.en.push(k);
}
const missing = missingByLang.fr.length + missingByLang.nl.length + missingByLang.en.length;

// === SECTION 2: placeholder parity ===
const PH = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
function placeholders(s) { const set = new Set(); let m; while ((m = PH.exec(s))) set.add(m[1]); return set; }
const placeholderIssues = [];
for (const k of Object.keys(fr)) {
  if (!nl[k] || !en[k]) continue;
  const a = placeholders(fr[k]), b = placeholders(nl[k]), c = placeholders(en[k]);
  const all = new Set([...a, ...b, ...c]);
  for (const p of all) {
    if (!(a.has(p) && b.has(p) && c.has(p))) {
      placeholderIssues.push({ key: k, placeholder: p, fr: [...a], nl: [...b], en: [...c] });
    }
  }
}

// === SECTION 3: hardcoded FR strings (full src/ scan grouped by section) ===
function walk(dir, files=[]) {
  for (const f of fs.readdirSync(dir)) {
    if (f === 'locales' || f === 'node_modules' || f.startsWith('.')) continue;
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.tsx?$/.test(f)) files.push(p);
  }
  return files;
}

const FR_WORDS = /\b(Vous|Votre|Nous|Veuillez|Cliquez|Bonjour|Bienvenue|Modifier|Annuler|Enregistrer|Supprimer|Ajouter|Confirmer|Envoyer|Retour|Accueil|Découvrir|Prochaine|Aucun|Aucune|Toutes|Réservé|Activé|Désactivé|Programme|Présence|Présent|Absent|Mariage|Tâche|Échéance|Semaine|Charg(ement|er)|Erreur|Réussi)\b/;

const SECTION_OF = (file) => {
  const rel = path.relative(SRC, file);
  const parts = rel.split(path.sep);
  if (parts[0] === 'pages' && parts[1] === 'client') return 'pages/client';
  if (parts[0] === 'pages' && parts[1] === 'admin') return 'pages/admin';
  if (parts[0] === 'pages' && parts[1] === 'pro') return 'pages/pro';
  if (parts[0] === 'pages') return 'pages';
  if (parts[0] === 'components') return parts.slice(0, 2).join('/');
  return parts[0] || 'misc';
};

const hardBySection = new Map();
let hardTotal = 0;
const files = walk(SRC);
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  const section = SECTION_OF(f);
  const list = hardBySection.get(section) ?? [];
  // JSX text content
  const jsxText = /(?<=>)([^<>{}\n]{6,200})(?=<)/g;
  let m;
  while ((m = jsxText.exec(txt))) {
    const s = m[1].trim();
    if (s.length < 6) continue;
    if (/^[\s\d.,€%·&·:—–\-+/()\[\]'"!?…»«]+$/.test(s)) continue;
    if (FR_WORDS.test(s) || /[àâçéèêëîïôûùü]/.test(s)) {
      const line = txt.substring(0, m.index).split('\n').length;
      list.push({ file: path.relative(SRC, f), line, text: s.substring(0, 80), kind: 'jsx' });
      hardTotal++;
    }
  }
  // attributes
  const attrs = /(?:placeholder|aria-label|title)\s*=\s*"([^"]{4,200})"/g;
  while ((m = attrs.exec(txt))) {
    const s = m[1];
    if (FR_WORDS.test(s) || /[àâçéèêëîïôûùü]/.test(s)) {
      const line = txt.substring(0, m.index).split('\n').length;
      list.push({ file: path.relative(SRC, f), line, text: s.substring(0, 80), kind: 'attr' });
      hardTotal++;
    }
  }
  if (list.length) hardBySection.set(section, list);
}

// === REPORT ===
console.log('================================================');
console.log('  MARIAGE AFRO — i18n AUDIT REPORT');
console.log('================================================\n');

console.log('### SECTION 1: Missing keys');
if (missing === 0) console.log('  ✓ All keys present in fr/nl/en\n');
else {
  for (const lang of ['fr', 'nl', 'en']) {
    if (missingByLang[lang].length) {
      console.log(`  [${lang}] missing ${missingByLang[lang].length}:`);
      for (const k of missingByLang[lang]) console.log(`    - ${k}`);
    }
  }
  console.log();
}

console.log('### SECTION 2: Placeholder parity ({{var}})');
if (placeholderIssues.length === 0) console.log('  ✓ All placeholders consistent across fr/nl/en\n');
else {
  for (const i of placeholderIssues) {
    console.log(`  [${i.placeholder}] in ${i.key} — fr:${i.fr} nl:${i.nl} en:${i.en}`);
  }
  console.log();
}

console.log('### SECTION 3: Hardcoded FR strings (by section)');
if (hardBySection.size === 0) console.log('  ✓ No hardcoded FR strings detected in src/\n');
else {
  const sections = [...hardBySection.keys()].sort();
  for (const sec of sections) {
    const items = hardBySection.get(sec);
    console.log(`\n  --- ${sec} (${items.length}) ---`);
    for (const it of items) {
      console.log(`    [${it.kind}] ${it.file}:${it.line}  ${it.text}`);
    }
  }
  console.log();
}

console.log('================================================');
console.log('  SUMMARY');
console.log('================================================');
console.log(`  Files scanned:           ${files.length}`);
console.log(`  Missing keys:            ${missing}`);
console.log(`  Placeholder mismatches:  ${placeholderIssues.length}`);
console.log(`  Hardcoded FR (heuristic):${hardTotal}`);
console.log('================================================');

process.exit(missing + placeholderIssues.length > 0 ? 1 : 0);
