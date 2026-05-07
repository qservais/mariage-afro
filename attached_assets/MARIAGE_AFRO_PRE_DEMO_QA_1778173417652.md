# 🔍 PRE-DEMO QA SWEEP — Mariage Afro

> **Live client demo tonight at 22h (Brussels time).**
> Mission: autonomous end-to-end QA pass + targeted fixes of any demo-blocking bug.
> Do **NOT** redesign anything. Do **NOT** rewrite copy. Do **NOT** add features.
> Only touch code when a P0/P1 bug requires it.

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
2. Run `find . -type f \( -name "*.tsx" -o -name "*.ts" \) -path "*/app/*" | head -100` to inventory all routes.
3. Run `cat package.json` to confirm available scripts and dependencies.
4. Read `.env.example` (if present) and confirm which env vars are set in Replit Secrets (especially `RESEND_API_KEY`, DB url, auth secrets).

If anything in this prompt contradicts `/_interne/guide`, the guide wins. Flag the contradiction in the final report.

---

## 1. METHODOLOGY

For every route and every interactive element, verify these 8 axes:

| # | Axis | What "pass" looks like |
|---|------|------------------------|
| 1 | **Route loads** | HTTP 200, no console error, no hydration mismatch, no `Error: ...` overlay |
| 2 | **Layout integrity** | No overflow, no broken images, footer credit `Site réalisé par Done. — madebydone.be` present |
| 3 | **Interactive elements** | All buttons clickable, all links navigate, all dropdowns open |
| 4 | **Form validation** | Required fields blocked, email/phone formats checked, error messages shown |
| 5 | **Form submission** | POST returns 2xx, success state shown, Resend email logged in server output |
| 6 | **Image upload** | File picker opens, accepts jpg/png/webp, rejects oversized files, preview renders, file persists |
| 7 | **CRUD persistence** | Create / read / update / delete actually round-trip to the store |
| 8 | **Mobile responsive** | Test viewport at 375px width — no horizontal scroll, nav usable |

**Tooling:**
- Boot the dev server: `npm run dev` (or whatever the start script is).
- Use `curl -I` for HTTP status checks on every route.
- Use `curl -X POST` for API endpoint smoke tests.
- For end-to-end browser tests: install Playwright (`npm i -D @playwright/test && npx playwright install chromium`) and write **one** test file `tests/demo-readiness.spec.ts` that covers the critical paths in section 4.
- For Resend: don't send to real addresses. Use `delivered@resend.dev` for success tests and `bounced@resend.dev` for bounce tests, OR mock the Resend client in a `__tests__/` setup if env doesn't allow real sends.

---

## 2. ROUTE INVENTORY (test every one, HTTP 200 required)

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

> **If a route in the guide doesn't exist in the codebase yet, do NOT create it.** Log it as "Missing route — defer to V2" in the report.

---

## 3. SEED DATA REQUIRED FOR DEMO

Before testing, ensure the following seed data exists (create a `scripts/seed-demo.ts` if needed):
- **3 test couples** with progressive completion: empty / partial / fully populated
- **5 test prestataires** across categories (photographe, traiteur, lieu, DJ, fleuriste) with photos
- **2 test lieux** with hero images
- **2 test réalisations** with full galleries
- **1 admin account** with valid credentials
- **Public credentials documented** in `DEMO_ACCOUNTS.md` (email + password for couple, pro, admin) so I can demo without fumbling

---

## 4. CRITICAL E2E SCENARIOS (must all pass for GO)

Write each as a Playwright test in `tests/demo-readiness.spec.ts`. Or, if Playwright can't install, walk through manually with `curl` + headless Node fetch and document the result.

### Scenario 1 — Public visitor → lead
1. Land on `/`
2. Click "Calculateur budget" → answer all questions → see total → submit email → check Resend log shows email queued
3. Back to `/` → open `/quiz-style` → complete → submit → verify lead saved
4. Open `/prestataires` → apply at least one filter (category, region) → results update
5. Open a prestataire fiche → click "Demander un devis" → fill multi-step contact form → submit → 2xx response + Resend log

### Scenario 2 — Couple onboarding & dashboard
1. Sign up as new couple OR log in as test couple
2. Land on `/espace-couple` — dashboard renders with widgets
3. Go to `/budget` → add a category → add a line item → edit amount → delete → all persist after page refresh
4. Go to `/invites` → add an invité → import via CSV if supported → mark RSVP status
5. Go to `/plan-de-table` → create a table → drag-drop an invité onto it (if drag-drop is V1)
6. Go to `/planning` → tick a task → state persists
7. Go to `/site-couple` → edit cover photo (image upload!) → edit story → save → open public URL `/mariages/[slug]` in incognito → changes visible
8. Go to `/cagnotte` → set goal amount → activate → public page works
9. Go to `/inspiration` → upload an image to mood board
10. Go to `/documents` → upload a PDF → download it back
11. Go to `/messagerie` → send a message to a prestataire → check it appears on the pro side

### Scenario 3 — Prestataire workflow
1. Log in as test prestataire
2. Land on `/espace-pro` — dashboard shows stats
3. Go to `/profil` → upload logo + bio → save → check it reflects on public fiche
4. Go to `/galerie` → upload 3 images → reorder → delete one → all persist
5. Go to `/services` → add a service with price → edit → delete
6. Go to `/devis` → see the demande de devis from Scenario 1 → click "Répondre" → send response → check couple receives notification
7. Go to `/messagerie` → see message from Scenario 2 → reply → check couple sees reply
8. Go to `/agenda` → block a date → check it shows as unavailable on public fiche
9. Go to `/abonnement` → see current tier → simulate upgrade flow (don't actually charge)

### Scenario 4 — Admin moderation
1. Log in as admin
2. `/admin` dashboard renders with KPIs
3. `/admin/moderation/comptes-pros` — see pending pro from scenario 3 → approve → pro account becomes active
4. `/admin/moderation/avis` — approve / reject a review → state changes
5. `/admin/moderation/sites-mariages` — moderate a public couple site
6. `/admin/prestataires` → edit a prestataire → save → changes reflect on public site
7. `/admin/communication/messages-couples` → send a broadcast (don't actually send to real users — use a test segment)
8. `/admin/systeme/health-check` → all green
9. `/admin/systeme/statut-serveur` → metrics visible

---

## 5. INFRASTRUCTURE & INTEGRATION CHECKS

- **Resend:** Confirm `RESEND_API_KEY` is in env. Test one real send to `delivered@resend.dev` and one to `bounced@resend.dev`. Verify webhook (if used) handles both.
- **Database:** Run a connection check. If Postgres/Neon, ensure migrations are applied (`prisma migrate status` or equivalent).
- **Image storage:** Confirm where uploaded images go (local `/public/uploads`, S3, Vercel Blob, Replit Object Storage). Verify a freshly uploaded image is reachable via its public URL **after a server restart**.
- **Auth:** Verify session persists across page reloads, logout actually clears session, role-based route guards work (couple cannot access `/admin`, anonymous cannot access `/espace-couple`).
- **404 / 500 pages:** Custom error pages render correctly.
- **Sitemap & robots.txt:** Present.
- **Favicon & OG image:** Present, render correctly when URL is shared.
- **Analytics / GTM:** If present, confirm `dataLayer` is initialized and at least one event fires (e.g. page_view).

---

## 6. BUG TRIAGE RULES

Classify every issue you find:

| Severity | Definition | Action |
|----------|------------|--------|
| **P0** | Demo-blocker. Crashes, 500s on critical paths, auth broken, can't submit a form | **Fix immediately** |
| **P1** | Visible in demo. Broken image, layout glitch on a page I'll show, console error visible to client | **Fix if < 30 min effort, else document workaround** |
| **P2** | Polish. Edge case, mobile-only minor, copy typo | **Defer, list in report** |
| **P3** | V2 scope (route in guide but not built) | **Defer, list as roadmap** |

**Fix authorization:**
- P0 → fix without asking.
- P1 → fix if isolated; if it requires touching shared components or data model, **stop and ask**.
- P2/P3 → never fix in this pass.

**Forbidden during this pass:**
- Refactoring
- Changing visual design (colors, fonts, spacing)
- Rewriting copy
- Adding new features
- Touching the `/_interne/guide` page itself

---

## 7. NON-NEGOTIABLES TO VERIFY (Done. agency standards)

- Footer credit present on every public page: `Site réalisé par Done. — madebydone.be`
- All icons are SVG (no emoji in UI)
- Forms route through Resend (not a generic mailto)
- No placeholder text remaining (`Lorem ipsum`, `TODO`, `FIXME`, `XXX`)
- No broken `<Image>` (Next/Image) — every image has valid `src`, `width`, `height`, `alt`
- No console errors or warnings on any tested page

Run a global grep at the end:
```bash
grep -rEn "lorem ipsum|TODO|FIXME|XXX|console\.error" app/ components/ lib/ 2>/dev/null
```

---

## 8. FINAL DELIVERABLE

At the end of the pass, produce a single Markdown file `DEMO_READINESS_REPORT.md` at the repo root with this exact structure:

```markdown
# Demo Readiness Report — Mariage Afro
Generated: <timestamp>

## GO / NO-GO: <GO | NO-GO with conditions | NO-GO>

## Stats
- Routes tested: X / Y
- Critical scenarios passed: X / 4
- P0 bugs found: N (fixed: N)
- P1 bugs found: N (fixed: N, deferred: N)
- P2/P3 logged: N

## Demo accounts
- Couple: <email> / <password>
- Prestataire: <email> / <password>
- Admin: <email> / <password>

## Critical scenarios
| # | Scenario | Status | Notes |
|---|----------|--------|-------|
| 1 | Public → lead | ✅ / ❌ | |
| 2 | Couple journey | ✅ / ❌ | |
| 3 | Prestataire journey | ✅ / ❌ | |
| 4 | Admin moderation | ✅ / ❌ | |

## Route inventory
<table: Route | Status code | Issues>

## Bugs fixed in this pass
<list with commit hash or file changed>

## Bugs deferred (with workaround for the demo)
<list — for each, what to avoid clicking during the demo>

## Missing routes / V2 scope
<list of guide features not yet built>

## Recommended demo script (avoiding any deferred bugs)
<5-10 step click-through that avoids known issues>
```

---

## 9. EXECUTION ORDER

1. Discovery (section 0) — 5 min
2. Spin up dev server + verify it builds — 5 min
3. Seed data check (section 3) — 10 min
4. Route inventory smoke test (section 2) — 15 min
5. Infrastructure checks (section 5) — 10 min
6. Critical E2E scenarios (section 4) — 30 min
7. Triage + fix P0/P1 (section 6) — variable
8. Final grep + report generation (sections 7 & 8) — 5 min

**Time-box: 90 minutes total.** If we hit 90 min before the report is done, stop fixing, write the report with what we have, and recommend NO-GO with a list of known issues so I can decide whether to push the demo.

---

## 10. WHAT TO DO IF SOMETHING IS UNCLEAR

If you hit ambiguity (e.g. "is RSVP V1 or V2?", "should drag-drop work in plan de table?"), **don't guess**. Read `/_interne/guide` again — the answer is there. If it's still unclear, log it in the report under "Open questions for Quentin" and skip the test.

Start now. Begin with section 0.
