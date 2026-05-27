# Mariage Afro — Design System

> Generated from source · Last updated May 2026

---

## Brand Register

**Type:** Premium editorial brand — the design IS the product.
**Mood:** Cinematic, intimate, minimal luxury. European + African heritage. Never SaaS, never template.
**Reference aesthetic:** Lamangue editorials, Vogue Africa, Amsale, luxury stationery.

---

## Color System

All colors are defined as CSS custom properties in `src/index.css` and consumed via Tailwind tokens.

| Token | Hex | Usage |
|-------|-----|-------|
| `wine-deep` | `#141414` | Body text, primary dark surface |
| `bordeaux` / `primary` | `#68191e` | CTAs, brand accent |
| `bordeaux-light` | `#7e2025` | Hover state for bordeaux CTAs |
| `cream` / `surface` | `#fff4e4` | Primary light background |
| `cream-soft` | `#faf9f7` | Alternate section background (near-white, on-brand) |
| `gold` | `#c9a96e` | Accent on dark surfaces |
| `gold-deep` | `#8a6d3b` | Accent on light surfaces (WCAG AA) |
| `gold-light` | `#d4b483` | Light gold variant |

**Rule:** Never use raw `bg-white` (`#ffffff`). Use `bg-cream` or `bg-cream-soft` instead. Never hard-code hex values — always use Tailwind token names.

---

## Typography

| Role | Family | Class |
|------|--------|-------|
| Display / Headings | Cormorant Garamond | `font-display` |
| Body / UI | Montserrat | `font-sans` (default) |

### Scale conventions
- Hero h1: `text-2xl sm:text-3xl md:text-[2rem] lg:text-[2.5rem] xl:text-[3rem]`
- Section h2 editorial: `.section-title-editorial` (utility class in index.css)
- Section eyebrow: `.section-eyebrow` (uppercase, tracked, gold-deep)
- Card titles: `font-display uppercase tracking-tight text-wine-deep`
- Micro labels: `text-[10px] uppercase tracking-[0.3em]`

**Rule:** Use `font-display uppercase` for headings, never `font-sans` for display-level text. Avoid `font-bold` on display text (use `font-medium` or weight from Cormorant).

---

## Spacing & Layout

- Page container: `container mx-auto px-6 md:px-12 max-w-6xl` (or `max-w-5xl` for narrow content)
- Section vertical rhythm: `py-24 md:py-32`
- Left sidebar offset (desktop lg+): `lg:pl-16` on hero, matching the 64px sidebar width

### Grid pattern (editorial multi-column)
```
gap-px bg-wine-deep/10 border border-wine-deep/10
```
Cards inside use `bg-cream-soft` (or `bg-cream`) to create hairline 1px separators between cells. This is the canonical card grid for the site.

---

## Spacing Tokens

Use Tailwind defaults. No custom spacing tokens.

---

## Component Conventions

### CTA Buttons
- Primary solid: `.btn-editorial-solid` → `bg-bordeaux text-cream border border-bordeaux hover:bg-bordeaux-light`
- Ghost: `.btn-editorial-ghost` → transparent with border, wine-deep text

### Nav Links (Header)
- Active: `text-gold` with `aria-current="page"`
- Hover: `hover:text-gold` (on dark), `hover:text-gold-deep` (on light)

### Section eyebrow
```tsx
<span className="section-eyebrow mb-6">{label}</span>
```

### Ordinal cards (editorial contact/feature pattern)
```tsx
<span className="font-display text-[11px] uppercase tracking-[0.35em] text-gold-deep">01</span>
```
Use ordinal numbers (01/02/03) instead of icon boxes for editorial contexts.

---

## Motion & Animation

All animations use Framer Motion. Constraints:
- `easeOut` only — no elastic/bounce/spring for public-facing animations
- Duration: 0.4–0.8s for UI transitions, 1.0–1.4s for hero/cinematic
- **Reduced motion:** Always check `window.matchMedia("(prefers-reduced-motion: reduce)")` for scroll-driven effects
- `will-change: "transform, opacity"` on hero parallax elements

### Scroll-driven hero
- `useScroll` + `useTransform` for cinematic parallax
- `willChange: "transform, opacity"` on animated `motion.div` elements

---

## Accessibility Checklist

- ✅ Skip link: `<a href="#main-content">` in `PublicLayout` (App.tsx)
- ✅ `<main id="main-content">` wraps all public page content
- ✅ `aria-current="page"` on active nav links (sidebar, overlay mobile, overlay desktop)
- ✅ Decorative SVGs: `aria-hidden="true"` (never `aria-label` on a non-interactive SVG)
- ✅ Accessible labels: always on the interactive anchor/button, not the icon inside
- ✅ `prefers-reduced-motion` respected in hero and HeroCursor
- ✅ `focus-visible:ring-*` for all interactive elements (no bare `outline-none`)

---

## Anti-Patterns (Banned)

| Anti-Pattern | Why banned |
|---|---|
| `bg-white` | Not in design system — use `bg-cream` or `bg-cream-soft` |
| `text-neutral-*` | Generic Tailwind — map to `text-wine-deep/*` opacity variants |
| `border-neutral-*` | Same — use `border-wine-deep/10`, `/15`, `/20` |
| Gradient text (`bg-gradient-to-r ... bg-clip-text`) | Screams AI template |
| Glassmorphism (`backdrop-blur` decoratively) | Only functional (sticky header) |
| Hero metric grid (3 identical `bg-primary/10` stat cards) | SaaS cliché |
| Identical icon card grid with 3 equal columns | Breaks editorial rhythm — use asymmetric layout |
| `border-l-4 border-primary` accent stripes | Stripe-kit cliché |
| Nested cards with excessive `rounded-*` | Too friendly for this register |

---

## File Structure

```
src/
  components/
    layout/          Header.tsx, Footer.tsx, BackToTop.tsx, ScrollToTop.tsx
    forms/           FormShell, FormStepper, TextField, SelectableCardGroup…
    ui/              shadcn-based primitives
    client/          ClientLayout, client-specific widgets
    vendor/          VendorLayout, vendor-specific widgets
  pages/
    home.tsx         Public home — hero, trust bar, services, testimonials
    contact.tsx      Contact page — editorial RDV grid + multi-step form
    client/          Authenticated couple space (budget, guests, seating…)
    vendor/          Authenticated vendor space
  index.css          @theme block with all design tokens
```

---

## i18n

Supported: `fr` (default) · `nl` · `en`
Lang detection via URL prefix (`/nl/...`, `/en/...`) — `LangUrlSync` in App.tsx.
Translation keys in `public/locales/{lang}/`.

---

## Do / Don't Quick Reference

| Do | Don't |
|---|---|
| `font-display uppercase tracking-tight` for headings | `font-bold text-xl` headings |
| `text-[10px] uppercase tracking-[0.3em]` for labels | `text-xs font-bold` labels |
| `bg-cream-soft` for alternate sections | `bg-white` for sections |
| `border-wine-deep/10` for subtle dividers | `border-gray-200` or `border-neutral-200` |
| `text-wine-deep/65` for secondary body | `text-gray-600` or `text-neutral-600` |
| Ordinal numbers (01/02/03) for editorial grids | Square icon boxes for everything |
| Asymmetric layouts for contact/feature sections | 3 identical equal-width columns |
