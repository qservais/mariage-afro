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
let missing = 0;
for (const k of allKeys) {
  const m = [];
  if (!(k in fr)) m.push('fr');
  if (!(k in nl)) m.push('nl');
  if (!(k in en)) m.push('en');
  if (m.length) { console.log(`MISSING [${m.join(',')}]: ${k}`); missing++; }
}

// Placeholder parity
const PH = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
function placeholders(s) { const set = new Set(); let m; while ((m = PH.exec(s))) set.add(m[1]); return set; }
let placMismatch = 0;
for (const k of Object.keys(fr)) {
  if (!nl[k] || !en[k]) continue;
  const a = placeholders(fr[k]), b = placeholders(nl[k]), c = placeholders(en[k]);
  const all = new Set([...a, ...b, ...c]);
  for (const p of all) {
    if (!(a.has(p) && b.has(p) && c.has(p))) {
      console.log(`PLACEHOLDER MISMATCH [${p}] in ${k} — fr:${[...a]} nl:${[...b]} en:${[...c]}`);
      placMismatch++;
    }
  }
}

// Find hardcoded FR strings in tsx (heuristic: French accented characters, French-only words)
function walk(dir, files=[]) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.tsx?$/.test(f) && !p.includes('locales')) files.push(p);
  }
  return files;
}
const FR_PATTERNS = [
  /[A-Z][a-zà-ÿ]+(?:\s+[a-zà-ÿ]+){0,8}/g,
];
const FR_WORDS = /\b(Vous|Votre|Nous|Veuillez|Cliquez|Bonjour|Bienvenue|Modifier|Annuler|Enregistrer|Supprimer|Ajouter|Confirmer|Envoyer|Retour|Accueil|Découvrir|Prochaine|Aucun|Aucune|Toutes|Toutes|Réservé|Activé|Désactivé|Programme|Présence|Présent|Absent|Mariage|Tâche|Échéance|Semaine|Charg(ement|er)|Erreur|Réussi)\b/;
const SKIP = /^(import|from|console|require|export|return|const|let|var|function|class|interface|type|if|else|for|while|switch)$/;

let hard = 0;
for (const f of walk(path.join(SRC, 'pages'))) {
  const txt = fs.readFileSync(f, 'utf8');
  // Find JSX text content >{...}<
  const jsxText = /(?<=>)([^<>{}\n]{6,200})(?=<)/g;
  let m;
  while ((m = jsxText.exec(txt))) {
    const s = m[1].trim();
    if (s.length < 6) continue;
    if (/^[\s\d.,€%·&·:—–\-+/()\[\]'"!?…»«]+$/.test(s)) continue;
    if (FR_WORDS.test(s) || /[àâçéèêëîïôûùü]/.test(s)) {
      console.log(`HARDCODED FR in ${f}:${txt.substring(0, m.index).split('\n').length}: ${s.substring(0,80)}`);
      hard++;
    }
  }
  // Also: placeholder=" attribute, label=" attribute, aria-label="
  const attrs = /(?:placeholder|aria-label|title)\s*=\s*"([^"]{4,200})"/g;
  while ((m = attrs.exec(txt))) {
    const s = m[1];
    if (FR_WORDS.test(s) || /[àâçéèêëîïôûùü]/.test(s)) {
      console.log(`HARDCODED FR ATTR in ${f}: ${s.substring(0,80)}`);
      hard++;
    }
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Missing keys: ${missing}`);
console.log(`Placeholder mismatches: ${placMismatch}`);
console.log(`Hardcoded FR (heuristic): ${hard}`);
process.exit(missing + placMismatch > 0 ? 1 : 0);
