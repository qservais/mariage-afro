# Mobile-First UX/UI Audit & Remediation — Mariage Afro Platform

## 0. Role & Mission (Replit Agent)

You are acting as a senior UX/UI auditor and frontend engineer on the **Mariage Afro** platform (Next.js 14 / TypeScript / Tailwind CSS / Framer Motion / Neon Postgres / Resend, hosted on Replit).

The product was designed and iterated primarily with a **desktop-first mindset**. Over time, many features were added on the couple side and the prestataire (vendor) side without a systematic mobile re-evaluation. Your mission is to run a **full mobile-first UX/UI audit AND apply the corrections directly**, space by space, following the phased protocol below — with explicit validation gates between phases.

You have direct access to the real codebase, routes, and components. This document does **not** hand you fixed pixel/rem values or breakpoints — you must derive them from what already exists in the codebase (design tokens, Tailwind config, existing component patterns) and propose a coherent mobile-first evolution of that system. Where no system exists yet, propose one, document it, and get it validated before applying it broadly.

## 1. Non-Negotiables (apply to every phase, no exceptions)

- [ ] Zero agency/Done. branding anywhere client-side — this is a whitelabel platform, P0
- [ ] Zero visible Replit traces client-side (URLs, watermark, console logs, dev banners)
- [ ] Icons stay SVG-only via Lucide — no emoji, no icon fonts, no raster icon substitutes
- [ ] No functional regression: every fix must preserve existing behavior (Resend forms, auth flows, booking/messaging flows, notifications)
- [ ] No silent removal of features to "simplify" mobile — if something doesn't fit, redesign the interaction, don't cut the capability
- [ ] Every change respects Mariage Afro's existing brand identity (colors, fonts, tone) — you are making the existing brand work on small screens, not restyling it
- [ ] All changes stay visually/behaviorally coherent with the parts of the app not yet touched — don't leave the product inconsistent mid-audit

## 2. Methodology (read before starting anything)

This is not a "shrink the desktop layout" pass. For every screen, evaluate three dimensions:

**A. Typography** — Is text legible, is hierarchy clear, is density appropriate at mobile viewport widths — in BOTH marketing/public pages and dense back-office screens (tables, forms, stats)? Back-office screens often reuse desktop-era type choices that are technically responsive (nothing breaks) but not actually *comfortable* on a phone: text too small for data-dense screens, no visual distinction between primary and secondary information, headings that don't scale relative to body text, etc.

**B. Image usage** — For every image, illustration, or photo currently rendered, make a deliberate call: keep it as-is (responsively), art-direct it differently on mobile (different crop/focal point per breakpoint), deprioritize or hide it on small viewports because it costs more (bandwidth, scroll length, competing with content/CTA) than it adds, or replace it with a lighter equivalent. "It's there on desktop" is never sufficient reason to keep it on mobile.

**C. Interaction & layout patterns, especially back-office** — Multi-column dashboards, wide data tables, hover-only actions, side-by-side forms, tiny click targets: none of these survive a phone screen by simply reflowing. Each needs an explicit mobile-first equivalent — card/list views instead of tables, tap-sized targets instead of hover-dependent icons, bottom sheets/drawers instead of hover panels, vertical single-column step flows instead of side-by-side forms, sticky primary actions instead of buried desktop toolbars.

For every finding, classify severity:
- **Blocker** — unusable or broken on mobile (overflow, unreadable text, unreachable action)
- **Major** — usable but frustrating/inefficient on mobile
- **Minor** — cosmetic/polish

## 3. Process per phase

Each phase (Couple / Prestataire / Admin) follows the same four steps:

**Step A — Audit.** Inventory every route/screen in scope. Evaluate against §2 (A/B/C). Produce a written findings report (format in §9) with severity per issue. Do not fix anything yet.

**Step B — GATE 1 (review findings).** Present the findings report and pause for review before touching code (see execution mode in §10 for the autonomous variant). This gate exists so scope/priority can be adjusted before engineering time is spent.

**Step C — Remediation.** Apply fixes in order of severity (Blockers → Major → Minor), respecting every Non-Negotiable in §1. When you introduce new typography, spacing, or breakpoint values, document the decision — what changed, why, and everywhere else in the app the same pattern occurs — instead of fixing it as a one-off.

**Step D — GATE 2 (verification).** Before declaring the phase done: re-test every touched route at mobile widths, confirm no desktop regression, confirm no Non-Negotiable was violated, update the Coverage Matrix (§9). Present a short before/after summary.

Only move to the next phase once GATE 2 of the current phase is cleared.

## 4. Phase 0 — Foundation & Inventory (run once, before Phase 1)

Before starting the Couple phase, do a lightweight pass across the whole app (~50 routes) to build the map you'll work from:

- [ ] List all routes/screens, tagged by: space (Public / Couple / Prestataire / Admin) and type (marketing, discovery/search, profile/detail, form, dashboard/stats, data table/list, messaging/inbox, settings)
- [ ] Identify the design tokens currently in use (Tailwind config, any existing type scale, color tokens, spacing scale) — this is the system you extend, not replace
- [ ] Flag components reused across multiple spaces (shared table, shared modal, shared nav shell) — fixing these once cascades, so prioritize accordingly
- [ ] Flag any component/page that is explicitly desktop-only in its current implementation (fixed pixel widths, hover-dependent-only actions, layouts with no stacking/collapse behavior) — this is your desktop-first technical debt list
- [ ] Produce the initial Coverage Matrix (§9) from this inventory, status = "Not audited" for every row

This phase produces no code changes, only the inventory and matrix. **GATE 0**: present the inventory and matrix before starting Phase 1.

## 5. Phase 1 — Couple space

Scope: every route a couple interacts with — public discovery/search pages, vendor profile pages as seen by a couple, registration/onboarding, and the couple's private dashboard (planning tools, budget, guest list, checklist, saved/booked vendors, messaging with prestataires, any gift registry or invitation feature).

Audit focus points specific to this space:
- [ ] Discovery/search: filters and search usable one-handed on mobile, not hidden behind a desktop-style multi-column filter panel with no mobile equivalent
- [ ] Vendor profile pages: photo galleries/portfolios — apply the image-usage decision from §2.B (lazy-loading, touch-appropriate gallery pattern, no desktop-lightbox-only behavior)
- [ ] Budget/planning tools: usually the most data-dense couple feature — check it isn't just a shrunk desktop spreadsheet view; check numeric inputs use appropriate mobile input types
- [ ] Guest list / checklist: table-like data — apply the card/list transformation from §2.C wherever a desktop table pattern was reused as-is
- [ ] Messaging with vendors: mobile-appropriate list-detail pattern, not a desktop split-view forced onto a narrow screen
- [ ] Onboarding/registration forms: single column, correct input types, realistic tap target sizes

Run Steps A–D from §3.

## 6. Phase 2 — Prestataire (vendor) space

Scope: the vendor's public-facing profile/portfolio management, plus the private back-office (leads/inquiries inbox, availability/calendar, profile & media editor, subscription/billing area if any, performance stats).

Audit focus points specific to this space:
- [ ] Media/portfolio upload & management: very likely used from a phone by vendors on-site — check the upload flow itself (camera access, multi-photo upload, reordering) is mobile-first, not a desktop drag-and-drop grid with no touch equivalent
- [ ] Leads/inquiries inbox: same list-detail concern as couple messaging — check response actions (accept/decline/quote) are reachable via sticky/bottom actions rather than buried in a desktop toolbar
- [ ] Availability/calendar management: calendars are a classic desktop-first trap (dense month grids) — check there's a genuinely usable mobile interaction, not a shrunk grid with unreadable day cells
- [ ] Stats/performance dashboards: apply §2.A and §2.C — prioritize the 2–3 numbers that matter most on mobile, don't force every desktop chart into a shrunk mobile chart
- [ ] Profile/media editor forms: same as couple onboarding — single column, correct input types, realistic sizes

Run Steps A–D from §3.

## 7. Phase 3 — Admin space

Scope: the platform's internal back-office (user/account management, moderation, platform configuration, reporting/analytics).

This is usually the most desktop-biased space in any platform, and the most tempting to leave "because admins use a laptop anyway." Treat it with the same rigor:

- [ ] Check whether there's any evidence in the codebase/usage pattern of admin actions happening from mobile (e.g. moderation-on-the-go); even if primary usage is desktop, time-sensitive actions (approve/reject a vendor, respond to a report) should not be *unusable* from a phone
- [ ] Data tables (user lists, transaction/booking lists, moderation queues): apply §2.C card/list transformation, at minimum for time-sensitive actions
- [ ] Bulk actions: define an explicit mobile affordance rather than hiding them until desktop
- [ ] Multi-step admin workflows (e.g. reviewing and approving a new vendor): re-sequence as a vertical, single-column, step-indicated flow on mobile rather than a desktop side-by-side review panel

Run Steps A–D from §3.

## 8. Phase 4 — Cross-cutting final pass

Once Phases 1–3 are individually cleared:

- [ ] Full regression sweep on mobile viewports across all three spaces plus the public site
- [ ] Whitelabel final check: search the entire touched codebase for any agency/Done. reference or Replit trace reintroduced during remediation
- [ ] Consistency check: couple / prestataire / admin should feel like the same coherent product on mobile (same type-scale logic, same table→card pattern, same nav pattern for authenticated spaces), not three separately patched apps
- [ ] Informal mobile performance check (image weight, layout shift, obviously slow interactions) — flag for a dedicated performance pass if issues are structural rather than quick fixes
- [ ] Close out the Coverage Matrix

## 9. Deliverables & reporting format

**Findings report (per phase, Step A):**

| Route/Screen | Space | Dimension (A/B/C) | Severity | Issue | Recommended fix |
|---|---|---|---|---|---|

**Coverage Matrix (living document, updated at every gate):**

| Route/Screen | Space | Public/Private | Audited | Issues found | Fixed | Verified mobile | Verified desktop (no regression) | Whitelabel clean |
|---|---|---|---|---|---|---|---|---|

**Phase close-out summary:** short before/after description per major fix, plus any decisions made about new typography/spacing/breakpoint values and everywhere else in the app they now apply.

## 10. Execution mode

Default: pause at every GATE (1 and 2) in every phase for human review before continuing.

If instructed to run autonomously instead, skip the GATE pauses and simply log each gate's checklist result in the phase report — the checklist logic and severity ordering stay identical either way.
