# Mariage Afro — Corrective Patch (Premium & International Vision)

> **Goal:** Reinforce brand consistency, premium perception, and international platform positioning.
> **Constraint:** Apply ONLY the changes listed below. Do not modify unrelated functionality, components, or content. Preserve all existing animations, routing, and form integrations (Resend).
> **Language:** Keep all visible copy in French. The instructions below are in English for agent clarity.

---

## Task 1 — Brand colors alignment

- Replace the current color palette with the **official brand identity colors** (provided by email — refer to the brand kit document).
- Update Tailwind config (`tailwind.config.ts`) → `theme.extend.colors` to expose semantic tokens (e.g. `primary`, `secondary`, `accent`, `neutral`, `background`).
- Refactor all hardcoded hex values across components to use the semantic tokens.
- Verify hover, focus, and active states remain accessible (WCAG AA contrast).

**Acceptance:** No raw hex codes left in components except in `tailwind.config.ts`. Buttons, CTAs, links, and section backgrounds all reflect brand identity.

---

## Task 2 — Reposition “Wedding Planner” wording

The current wording creates confusion with traditional wedding planners. **Remove all "wedding planner" mentions** in headlines, subheadlines, and meta descriptions where Mariage Afro positions itself as such.

**Replace with this single tagline (chosen):**

> **« Une plateforme qui centralise et coordonne les meilleurs prestataires pour votre mariage »**

(Alternative options kept on file but not used: « Organisation & encadrement de mariages afro & mixtes » / « Votre plateforme dédiée à l'organisation de mariages afro et mixtes »)

**Acceptance:** Hero, About, and meta tags reflect the platform/coordination angle, not the wedding planner role.

---

## Task 3 — Cultures / Countries scope

- **Remove:** « 12 cultures maîtrisées »
- **Replace with:** « **55 pays maîtrisés** — l'ensemble des pays et îles du continent africain »
- Update the supporting visual (counter, map, or grid) to reflect the broader Pan-African scope.
- If a country/flag grid exists, expand it to cover all 55 African countries (or display a stylized map of Africa as alternative).

**Acceptance:** No "12 cultures" reference left anywhere. The new figure communicates global mastery, not limitation.

---

## Task 4 — Video section: Film de Miel

- Embed a qualitative video from the Film de Miel Instagram account: **https://www.instagram.com/filmdemiel/**
- Select a video aligned with our premium positioning (elegant cinematography, afro/mixed wedding aesthetic).
- Use Instagram's official embed code (`<blockquote class="instagram-media">` + their embed.js script) OR download the video with permission and self-host as `<video>` with `autoplay muted loop playsinline`.
- Add a discreet credit: *« Vidéo : @filmdemiel »*

**Acceptance:** Video plays inline on desktop and mobile, no external player UI dominates the section.

---

## Task 5 — Reviews section

1. **Start with our Google Reviews** — fetch and integrate authentic reviews from our Google Business Profile (manually, or via Google Places API if a key is available).
2. Then complete with additional reviews from other sources if needed (Instagram testimonials, partner feedback).
3. Display layout: card grid or carousel with author name, rating (5 stars), date, source icon (Google logo).

**Acceptance:** Google reviews appear first and are visually identifiable as such. No fake/placeholder content.

---

## Task 6 — Partners section (icons & categories)

Restructure the partner categories block. **Use clear SVG icons** (no emojis — per Done. convention) for each:

1. **Location de salle**
2. **Traiteur** *(rename — replace any "Catering" wording)*
3. **Boissons**
4. **Cocktail bar**
5. **Serveurs**
6. **Hôtesses**
7. **Wedding planner / Coordination**

**Acceptance:** « Catering » no longer appears in the codebase. Each category has a distinct, brand-aligned SVG icon. Grid is responsive (3-col desktop / 2-col mobile).

---

## Task 7 — International vision

The site **must not be Belgium-centric**.

- Audit every page (Home, About, Services, Footer, Meta) and **remove all unnecessary local references** (e.g. "en Belgique", "Bruxelles" outside the legal footer, "partout en Belgique").
- Reposition Mariage Afro as an **international platform** for afro and mixed weddings.
- **Keep the existing tagline (slogan)** untouched.
- Reference for tone and positioning: **https://instagram.com/mariageafro**

**Acceptance:** Outside the legal HQ block (Task 8), no copy implies a Belgian-only scope. Hero, services, and CTAs use international language.

---

## Task 8 — Legal HQ address (Footer)

Add the registered office address in the footer (legal block):

```
Avenue Louise 231
1050 Bruxelles
Belgique
```

**Acceptance:** Address visible in footer, formatted on 3 lines, with subtle typography (no over-emphasis).

---

## Task 9 — Services & Modules: balance the grids

- **Services section:** currently 7 → **add 2 more services** (total of 9) for visual balance and strategic completeness.
- **Platform modules section:** same logic → **add 2 more modules**.

**Suggested additions** (use these or generate equivalents that fit the premium platform narrative):

**Services (+2):**
- *Conseil & direction artistique* (mood board, scénographie, palette)
- *Gestion logistique & transport invités* (navettes, hébergement)

**Modules (+2):**
- *Espace invités* (RSVP, plan de table, cagnotte mariage)
- *Tableau de bord couple* (suivi budget, planning, prestataires en temps réel)

**Acceptance:** Both grids display cleanly in 3×3 (services) and balanced rows (modules). New cards match existing card design system.

---

## Task 10 — Destination Wedding logic

Restructure this section into a **continent → country example** model.

| Continent | Pays exemple |
|-----------|--------------|
| Afrique | Congo |
| Europe | Portugal, Grèce |
| Asie | Thaïlande |
| Amérique | *(à définir — suggestion : Mexique ou République dominicaine)* |

- Display 4 continent cards, each opening or revealing the example country/countries.
- Use evocative imagery per continent (premium, editorial photography).

**Acceptance:** No more flat country list. Continents lead the navigation, countries serve as illustrative examples.

---

## Task 11 — Réalisations: storytelling premium

Transform the gallery into a storytelling experience. **For each wedding case study, add:**

- 🎬 **Vidéo** (short cinematic clip — autoplay muted on hover, full play on click)
- ✍️ **Courte description** (2–3 lines of narrative — couple, atmosphere, moment fort)
- 📍 **Lieu** (ville, pays)
- 📅 **Date** (mois + année)

**Layout suggestion:** Editorial card with video preview on top, metadata pill row below, description on hover/expand.

**Acceptance:** No realisation card is a static image only. Each tells a mini story with all 4 metadata fields.

---

## Task 12 — UX/UI freedom: proactive premium upgrades

Beyond the explicit tasks above, **proactively propose and implement** any improvements that elevate:

- **User experience** (micro-interactions, smooth scroll, lazy load, loading states)
- **Conversion** (sticky CTA on scroll, exit-intent prompt, social proof badges)
- **Premium perception** (refined typography hierarchy, generous white space, subtle motion, custom cursor on desktop hero, scroll-triggered reveals)
- **Platform structure** (clearer information architecture, breadcrumbs on deeper pages, search/filter on the partner directory)

**Suggested additions to consider:**
- Hero video background (subtle, low-volume) instead of static image
- "Trusted by" partner logo strip near the top
- A "Process" timeline showing the 5 steps from first contact to D-Day
- Multilingual switcher (FR / EN) — preparing the international ambition
- Floating WhatsApp/contact button (mobile)

**Acceptance:** At least 3 proactive UX/UI enhancements implemented. Document each in the commit message.

---

## Global rules (apply across all tasks)

- ✅ SVG icons only — **no emojis** in production UI (emojis above are for documentation only)
- ✅ Resend for any new form (`RESEND_API_KEY`)
- ✅ Keep mandatory footer credit: « Site réalisé par Done. — madebydone.be »
- ✅ No analytics integration at this stage
- ✅ Mobile-first responsive on every section
- ✅ Lighthouse: maintain or improve current scores (Performance, Accessibility, Best Practices, SEO)
- ✅ Do not break existing routing or working components
