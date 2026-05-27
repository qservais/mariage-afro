---
name: Accessibility baseline
description: Required a11y patterns for Mariage Afro public pages
---

# Accessibility Baseline

## Skip link
Already present in `App.tsx` PublicLayout — do NOT remove or duplicate:
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only ...">Aller au contenu principal</a>
```
`<main id="main-content">` is the target.

## aria-current on nav
All three nav locations in `Header.tsx` now have `aria-current={isActive(link.to) ? "page" : undefined}`:
1. Sidebar vertical links
2. Mobile accordion overlay links
3. Desktop overlay links

The `isActive(to)` helper already handles exact (`/`) vs prefix (`/contact/...`) matching.

## SVG icons rule
- Decorative SVGs: `aria-hidden="true"` always
- **Never** `aria-label` on an SVG element — it's ignored by most AT
- Accessible name belongs on the interactive parent (`<a>`, `<button>`)
- Example: social proof logos in testimonials, all icon buttons

**Why:** aria-label on non-interactive SVG is a common WCAG failure (4.1.2 Name, Role, Value).

## focus-visible
Never use bare `outline-none` without a companion `focus-visible:ring-*`. All interactive elements must have a visible focus indicator.
