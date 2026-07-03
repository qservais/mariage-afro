---
name: i18n hardcoded literals
description: Where Mariage Afro i18n bugs actually come from and how to fix them safely
---

The Mariage Afro locale files (`src/locales/{fr,nl,en}/{public,client,vendor,common,forms,emails}.json`) are kept in **full key parity** across all three languages. When a page "doesn't switch language", the cause is almost always a **hardcoded French string literal in JSX**, not a missing key.

**Why:** The language switcher (`i18n.changeLanguage` in the header) works globally; every mounted component re-renders. So untranslated text = a literal that never went through `t()`.

**How to apply:**
- Grep the affected page(s) for raw French text, not just visible JSX text nodes. The easy-to-miss ones live in **template literals**: `aria-label={`${x} étoiles sur 5`}`, `title={`${name} — vidéo`}`. Plain "find visible French" detectors skip these.
- A module-level helper component (e.g. `StarRating`) has **no `t` in scope** — add its own `const { t } = useTranslation();`.
- Interpolation: use `t("key", { count })` with the placeholder written as `{{count}}` in the JSON value.
- **Do NOT translate backend-contract values**: `<option value="Mariage civil">` value attrs are stored verbatim as lead data — translate only the display text, keep the French `value`. Same reasoning for DB seed data like the default budget category-name array — leaving those French is correct, not a bug.
- Editing locale JSON: the files are canonical `JSON.stringify(obj, null, 2)` **without a trailing newline**. Add keys programmatically and write back with no trailing `\n` for a minimal diff; new keys land at the end of their parent block.
- Verify with: key-parity audit (must run from project root), `tsc --noEmit`, and a screenshot at `?lang=nl` / `?lang=en`.
