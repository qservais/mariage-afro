# 🔧 FULL FUNCTIONAL QA SWEEP — Mariage Afro

> **Mission:** test every feature of this platform end-to-end. Find what's broken. Fix it. Make sure every flow works tonight.
> **This is a whitelabel project.** No "Done.", no "madebydone.be", no agency credit anywhere visible to end users. Verify and strip if you find any.

---

## 0. CONTEXT & SOURCE OF TRUTH

**Project:** Mariage Afro — wedding marketplace platform for the Belgian African community.
**Stack assumption:** Next.js 14 (App Router) + TypeScript + Tailwind + Resend + (Postgres or JSON store).
**3 user roles + 1 admin role:**
- **Public visitors** (couples-to-be researching)
- **Couples** (logged-in, planning their wedding)
- **Prestataires** (vendors: photographers, traiteurs, DJs, lieux, etc.)
- **Admin** (Mariage Afro internal team)

**Read this FIRST, before doing anything else:**
1. Open the route `/_interne/guide` and read the page source. This is the complete feature inventory and acceptance criteria. Treat it as the QA spec.
2. Run `find . -type f \( -name "*.tsx" -o -name "*.ts" \) -path "*/app/*" | head -200` to inventory all routes.
3. Run `cat package.json` to confirm available scripts and dependencies.
4. Read `.env.example` (if present) and confirm which env vars are set in Replit Secrets (especially `RESEND_API_KEY`, DB url, auth secrets).

If anything in this prompt contradicts `/_interne/guide`, the guide wins. Flag the contradiction in the final report.

---

## 1. WHITELABEL ENFORCEMENT (do this early — non-negotiable)

This site must contain **zero trace** of the agency that built it. Run these checks and fix any hit:

```bash
# Visible-to-user strings — these MUST return zero results in user-facing code
grep -rEni "done\.|madebydone|made by done|réalisé par done|site by done|quentin servais|maxime gillent" \
  app/ components/ public/ pages/ lib/ src/ 2>/dev/null

# Same check inside built output (catch anything baked into the bundle or JSON-LD / meta)
grep -rEni "done\.|madebydone|made by done|réalisé par done|site by done|quentin servais|maxime gillent" \
  .next/ dist/ build/ 2>/dev/null
```

Specifically check and clean if needed:
- **Footer** of every page (public, dashboards, admin)
- `<meta>` tags: `author`, `generator`, `og:site_name`, `application-name`
- JSON-LD blocks (`schema.org` `creator`, `publisher`, `author`)
- `package.json` `author` / `name` / `description` (if these leak into a public manifest, sitemap, or `humans.txt`, replace them)
- `manifest.json` / PWA manifest
- `robots.txt`, `humans.txt`, `security.txt`
- `<title>` tags (no "by Done." patterns)
- Email templates (Resend HTML emails, footer signatures)
- PDF outputs (the "Guide PDF" lead magnet, exported invité lists, devis exports — check the rendering template for any agency credit)
- Comments in HTML output (`<!-- ... -->`) — sometimes Replit Agent leaves "built by" comments in layouts
- Custom error pages (404, 500)
- Legal pages (CGV, mentions légales) — these may legitimately mention the legal entity behind the site, but should NOT mention Done. as the developer

**If the project's legal entity behind Mariage Afro is documented somewhere in the repo, leave that intact in legal pages. Strip only the agency/developer credit.**

Log every removal in the report.

---

## 2. METHODOLOGY

For every route and every interactive element, verify these 8 axes:

| # | Axis | What "pass" looks like |
|---|------|------------------------|
| 1 | **Route loads** | HTTP 200, no console error, no hydration mismatch, no `Error: ...` overlay |
| 2 | **Layout integrity** | No overflow, no broken images, no placeholder leftovers |
| 3 | **Interactive elements** | All buttons clickable, all links navigate, all dropdowns open |
| 4 | **Form validation** | Required fields blocked, email/phone formats checked, error messages shown |
| 5 | **Form submission** | POST returns 2xx, success state shown, Resend email logged in server output |
| 6 | **Image upload** | File picker opens, accepts jpg/png/webp, rejects oversized files, preview renders, file persists across server restart |
| 7 | **CRUD persistence** | Create / read / update / delete actually round-trip to the store and survive a refresh |
| 8 | **Mobile responsive** | Test viewport at 375px width — no horizontal scroll, nav usable |

**Tooling:**
- Boot the dev server: `npm run dev` (or whatever the start script is).
- Use `curl -I` for HTTP status checks on every route.
- Use `curl -X POST` for API endpoint smoke tests.
- For end-to-end browser tests: install Playwright (`npm i -D @playwright/test && npx playwright install chromium`) and write `tests/qa-sweep.spec.ts` covering the scenarios in section 5.
- For Resend: don't send to real addresses. Use `delivered@resend.dev` for success tests and `bounced@resend.dev` for bounce tests. If env doesn't allow real sends, mock the Resend client.

---

## 3. ROUTE INVENTORY (test every one, HTTP 200 required)

### A. Public site (no auth)
- `/` — cinematic homepage
- `/services` — services d'accompagnement marketplace
- `/prestataires` — annonces prestataires (with filters)
- `/prestataires/[slug]` — fiche prestataire individuelle
- `/lieux` — lieux de réception
- `/lieux/[slug]` — fiche lieu individuelle
- `/realisations` — galerie de mariages réalisés
- `/realisations/[slug]` — fiche réalisation
- `/boutique` — boutique
- `/comparateur` — comparateur prestataires
- `/contact` — contact multi-étapes
- `/calculateur-budget` — budget calculator (lead magnet)
- `/quiz-style` — wedding style quiz (lead magnet)
- `/guide` — PDF guide download (lead magnet)
- `/connexion` & `/inscription` (or `/login` & `/signup`)
- `/mariages/[slug]` — public couple wedding site
- `/mariages/[slug]/rsvp` — public RSVP form
- `/mariages/[slug]/cagnotte` — public cagnotte page
- `/mentions-legales`, `/cgv`, `/politique-confidentialite`

### B. Couple dashboard (auth required)
Base: `/espace-couple` or `/dashboard/couple`
- `/` — tableau de bord
- `/budget`
- `/invites` (or `/rsvp`)
- `/plan-de-table`
- `/planning` (or `/taches`)
- `/site-couple` (editor)
- `/cagnotte` (editor)
- `/inspiration` (mood board)
- `/documents`
- `/jour-j` (timeline)
- `/prestataires` (mes prestataires)
- `/messagerie` (communication)

### C. Prestataire dashboard (auth required)
Base: `/espace-pro` or `/dashboard/pro`
- `/` — tableau de bord
- `/devis` — demandes de devis
- `/messagerie`
- `/profil`
- `/galerie`
- `/services`
- `/agenda`
- `/abonnement`
- `/parametres`

### D. Admin back-office (admin auth required)
Base: `/admin`
- `/` — dashboard global
- `/demandes` — réservoir de demandes
- `/moderation/avis`
- `/moderation/comptes-pros`
- `/moderation/sites-mariages`
- `/maintenance-pros`
- `/prestataires` (CRUD)
- `/lieux` (CRUD)
- `/realisations` (CRUD)
- `/communication/messages-couples`
- `/communication/pros-actifs`
- `/systeme/statut-serveur`
- `/systeme/health-check`

> **If a route in the guide doesn't exist in the codebase yet, do NOT create it.** Log it as "Missing route — V2 scope" in the report.

---

## 4. SEED DATA REQUIRED

Before testing, ensure the following test data exists (create a `scripts/seed-test.ts` if needed):
- **3 test couples** with progressive completion: empty / partial / fully populated
- **5 test prestataires** across categories (photographe, traiteur, lieu, DJ, fleuriste) with photos
- **2 test lieux** with hero images
- **2 test réalisations** with full galleries
- **1 admin account** with valid credentials
- **Test credentials documented** in `TEST_ACCOUNTS.md` at repo root (email + password for couple, pro, admin)

---

## 5. END-TO-END SCENARIOS (must all pass)

Write each as a Playwright test in `tests/qa-sweep.spec.ts`. If Playwright can't install, walk through with `curl` + headless Node fetch and document the result.

### Scenario 1 — Public visitor → lead capture
1. Land on `/`
2. Open `/calculateur-budget` → answer all questions → see total → submit email → check Resend log shows email queued
3. Back to `/` → open `/quiz-style` → complete → submit → verify lead saved
4. Open `/guide` → trigger PDF download → confirm PDF is served and email captured (if gated)
5. Open `/prestataires` → apply at least one filter (category, region) → results update
6. Open a prestataire fiche → click "Demander un devis" → fill multi-step contact form → submit → 2xx + Resend log

### Scenario 2 — Couple onboarding & dashboard
1. Sign up as new couple OR log in as test couple
2. Land on `/espace-couple` — dashboard renders with widgets
3. `/budget` → add category → add line item → edit amount → delete → all persist after refresh
4. `/invites` → add invité → CSV import if supported → mark RSVP status
5. `/plan-de-table` → create table → assign invité (drag-drop or click)
6. `/planning` → tick a task → state persists
7. `/site-couple` → upload cover photo → edit story → save → open public URL `/mariages/[slug]` in incognito → changes visible
8. `/cagnotte` → set goal amount → activate → public page works
9. `/inspiration` → upload image to mood board
10. `/documents` → upload PDF → download it back
11. `/messagerie` → send message to a prestataire → check it appears on the pro side
12. `/jour-j` → add an event to the timeline → reorder → save

### Scenario 3 — Prestataire workflow
1. Log in as test prestataire
2. `/espace-pro` — dashboard shows stats
3. `/profil` → upload logo + bio → save → check it reflects on public fiche
4. `/galerie` → upload 3 images → reorder → delete one → all persist after refresh
5. `/services` → add a service with price → edit → delete
6. `/devis` → see the demande de devis from Scenario 1 → click "Répondre" → send response → couple receives notification
7. `/messagerie` → see message from Scenario 2 → reply → couple sees reply
8. `/agenda` → block a date → check it shows as unavailable on public fiche
9. `/abonnement` → see current tier → simulate upgrade flow (don't actually charge)
10. `/parametres` → change notification preferences → save → persists

### Scenario 4 — Admin moderation
1. Log in as admin
2. `/admin` dashboard renders with KPIs
3. `/admin/moderation/comptes-pros` — see pending pro from Scenario 3 → approve → pro account becomes active
4. `/admin/moderation/avis` — approve / reject a review → state changes
5. `/admin/moderation/sites-mariages` — moderate a public couple site
6. `/admin/prestataires` → edit a prestataire → save → changes reflect on public site
7. `/admin/lieux` → create / edit / delete a lieu → reflects publicly
8. `/admin/realisations` → create / edit / delete a réalisation → reflects publicly
9. `/admin/communication/messages-couples` → send a broadcast (use a test segment, not real users)
10. `/admin/systeme/health-check` → all green
11. `/admin/systeme/statut-serveur` → metrics visible

---

## 6. INFRASTRUCTURE & INTEGRATION CHECKS

- **Resend:** Confirm `RESEND_API_KEY` is in env. Test one real send to `delivered@resend.dev` and one to `bounced@resend.dev`. Verify webhook (if used) handles both. Check email templates contain **no agency credit** (whitelabel rule).
- **Database:** Run a connection check. If Postgres/Neon, ensure migrations are applied (`prisma migrate status` or equivalent).
- **Image storage:** Confirm where uploaded images go (local `/public/uploads`, S3, Vercel Blob, Replit Object Storage). Verify a freshly uploaded image is reachable via its public URL **after a server restart**.
- **Auth:** Verify session persists across page reloads, logout actually clears session, role-based route guards work (couple cannot access `/admin`, anonymous cannot access `/espace-couple`, prestataire cannot access another pro's data).
- **404 / 500 pages:** Custom error pages render correctly and contain no agency credit.
- **Sitemap & robots.txt:** Present and clean.
- **Favicon & OG image:** Present, render correctly when URL is shared, no agency branding.
- **Analytics / GTM:** If present, confirm `dataLayer` is initialized and at least one event fires (e.g. page_view).

---

## 7. BUG TRIAGE & FIX RULES

Classify every issue you find:

| Severity | Definition | Action |
|----------|------------|--------|
| **P0** | Crashes, 500s, auth broken, can't submit a form, data loss, whitelabel leak | **Fix immediately** |
| **P1** | Feature partially broken, broken image, layout glitch, console error | **Fix if isolated** |
| **P2** | Edge case, mobile-only minor issue, copy typo | **Log, don't fix** |
| **P3** | V2 scope (route in guide but not built) | **Log as roadmap** |

**Fix authorization:**
- P0 → fix without asking.
- P1 → fix if isolated; if it requires touching shared components or data model, **stop and ask**.
- P2/P3 → never fix in this pass.

**Forbidden during this pass:**
- Refactoring working code
- Changing visual design (colors, fonts, spacing)
- Rewriting copy
- Adding new features
- Touching the `/_interne/guide` page itself

---

## 8. NON-NEGOTIABLES TO VERIFY

- **Whitelabel:** zero mention of `Done.`, `madebydone`, `Quentin Servais`, `Maxime Gillent` in user-visible output (see section 1)
- All icons are SVG (no emoji in UI)
- Forms route through Resend (not generic mailto)
- No placeholder text remaining (`Lorem ipsum`, `TODO`, `FIXME`, `XXX`)
- No broken `<Image>` (Next/Image) — every image has valid `src`, `width`, `height`, `alt`
- No console errors or warnings on any tested page

Run a global grep at the end:
```bash
grep -rEn "lorem ipsum|TODO|FIXME|XXX|console\.error" app/ components/ lib/ 2>/dev/null
```

---

## 9. FINAL DELIVERABLE

At the end of the pass, produce `QA_REPORT.md` at the repo root:

```markdown
# QA Report — Mariage Afro
Generated: <timestamp>

## Summary
- Routes tested: X / Y
- Scenarios passed: X / 4
- P0 bugs found: N (fixed: N)
- P1 bugs found: N (fixed: N, deferred: N)
- P2/P3 logged: N
- Whitelabel leaks found: N (cleaned: N)

## Test accounts
- Couple: <email> / <password>
- Prestataire: <email> / <password>
- Admin: <email> / <password>

## Whitelabel cleanup
<list of every file/string removed or replaced>

## Scenarios
| # | Scenario | Status | Notes |
|---|----------|--------|-------|
| 1 | Public → lead | ✅ / ❌ | |
| 2 | Couple journey | ✅ / ❌ | |
| 3 | Prestataire journey | ✅ / ❌ | |
| 4 | Admin moderation | ✅ / ❌ | |

## Route inventory
<table: Route | Status code | Issues>

## Bugs fixed in this pass
<list with file changed and brief description>

## Bugs deferred (P2/P3)
<list with severity and proposed fix>

## Missing routes / V2 scope
<list of guide features not yet built>

## Open questions
<anything ambiguous in the guide that needs Quentin's call>
```

---

## 10. EXECUTION ORDER

1. Discovery (section 0)
2. **Whitelabel sweep (section 1) — do this early so any fixes are visible during scenarios**
3. Spin up dev server + verify build
4. Seed data check (section 4)
5. Route inventory smoke test (section 3)
6. Infrastructure checks (section 6)
7. End-to-end scenarios (section 5)
8. Triage + fix P0/P1 (section 7)
9. Final grep + non-negotiables (section 8)
10. Report generation (section 9)

No time-box. Take the time needed. The goal is that everything works.

---

## 11. WHAT TO DO IF SOMETHING IS UNCLEAR

If you hit ambiguity (e.g. "is RSVP V1 or V2?", "should drag-drop work in plan de table?"), **don't guess**. Read `/_interne/guide` again — the answer is there. If it's still unclear, log it in the report under "Open questions" and skip the test.

Start now. Begin with section 0.
