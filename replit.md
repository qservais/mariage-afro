# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Mariage Afro (`artifacts/mariage-afro`)
- **Type**: React + Vite web app
- **Preview path**: `/`
- **Purpose**: Premium platform for Afro & mixed weddings in Belgium
- **Stack**: React, Vite, Tailwind CSS, Framer Motion, react-i18next, react-hook-form, Zod, @tanstack/react-query, Clerk
- **Auth**: Clerk (`@clerk/react`) — couples sign in at `/espace-client/login`, vendors sign in at `/espace-pro/login` (both areas use Clerk; vendors get a separate `vendor_accounts` row auto-created on first request)
- **Emails (Resend)**: `lib/email.ts` exposes 6 i18n notify* fns (FR/NL/EN): `notifyAdminNewLead`, `notifyVendorNewLead`, `notifyConversationMessage` (15min throttle), `notifyCoupleNewRsvp`, `notifyVendorApproved`, `notifyPartnerApplicationReceived`. Templates in `lib/email/templates.ts` + i18n dict in `lib/email/i18n.ts`. Wired into leads/contact/client/wedding-public/admin-content routes. All sends are fire-and-forget; gracefully no-op when `RESEND_API_KEY` missing. Admin smoke-test UI at `/admin/test-email`. Env: `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`, optional `PUBLIC_APP_URL`.
- **Languages**: FR (default), NL, EN — via react-i18next, translation files in `src/locales/`
- **Images**: Wedding photos from `attached_assets/` via `@assets` Vite alias
- **Branding**: Montserrat font, bordeaux (#68191e), crème (#fff4e4), dark (#141414)

#### Public Pages
- `/` — Home
- `/plateforme` — Platform overview
- `/services` — Services
- `/partenaires` — Vendor marketplace (fetches from `/api/marketplace/vendors` with i18n fallback)
- `/lieux` — Venue listing (fetches from `/api/marketplace/venues` with i18n fallback)
- `/realisations` — Storytelling couple cards (fetches from `/api/marketplace/realisations` with fallback)
- `/shop` — Shop
- `/a-propos` — About
- `/contact` — Contact form
- `/mariage/:slug` — Public per-couple wedding page (programme + RSVP form, standalone without header/footer)

#### Espace Client (protected, requires Clerk auth)
- `/espace-client/dashboard` — Dashboard with 8 modules
- `/espace-client/budget` — Budget tracker
- `/espace-client/invites` — Guest list
- `/espace-client/planning` — Planning tasks
- `/espace-client/prestataires` — Saved vendors
- `/espace-client/documents` — Documents
- `/espace-client/jour-j` — Day-of timeline
- `/espace-client/communication` — Couple ↔ Admin messaging thread
- `/espace-client/site` — Wedding website builder (slug, title, programme, RSVP toggle)
- `/espace-client/profil` — Profile

#### Espace Pro (protected, requires Clerk auth — vendor area, LOT 1)
- `/espace-pro/login` & `/espace-pro/register` — Clerk sign-in / sign-up (wine-deep + gold theme)
- `/espace-pro` — Dashboard with status badge (publié / en attente) + 4 nav tiles
- `/espace-pro/profile` — Edit marketplace profile (name, category, city, tagline, description, contact)
- `/espace-pro/gallery` — Upload photos via object storage (public ACL) + cover image
- `/espace-pro/services` — Manage services list
- `/espace-pro/settings` — Account info + Clerk profile + sign out
- Onboarding gate (modal) shown on first login — collects business name, contact, category, city, etc., creates `marketplace_vendors` row with `verified=false active=false`
- Admin validates submissions at `/admin/content/vendor-accounts` → toggles `marketplace_vendors.verified=true active=true` to publish

### API Server (`artifacts/api-server`)
- **Type**: Express 5 API
- **Preview path**: `/api`
- **Auth middleware**: Clerk (`@clerk/express`) — `clerkMiddleware()` global, `requireCouple` per-route

#### Middleware order (important — public routes must be BEFORE auth-protected router):
1. `weddingPublicRouter` at `/` (public)
2. `marketplaceRouter` at `/api` (public)
3. Main `router` at `/api` (auth-protected via `requireCouple` in client.ts)
4. `adminRouter` + `adminContentRouter` at `/admin`

#### API Routes
- `GET /api/healthz` — Health check
- `POST /api/contact` — Contact form (Resend email)
- `GET /api/marketplace/vendors` — Public vendor list (DB or seeded)
- `GET /api/marketplace/venues` — Public venue list
- `GET /api/marketplace/realisations` — Public couple stories
- `POST /api/marketplace/vendors/:id/add-to-project` — Add vendor to couple's project (Clerk auth)
- `GET /api/client/me` — Couple profile
- `PATCH /api/client/me` — Update couple profile
- `GET/POST /api/client/messages` — Couple ↔ Admin messages
- `GET/PATCH /api/client/wedding-website` — Per-couple wedding website config
- `GET /api/wedding/:slug` — Public wedding page (no auth)
- `POST /api/wedding/:slug/rsvp` — Submit RSVP (no auth)
- Full CRUD under `/admin/content/` — vendors, venues, réalisations, messages, wedding-websites

### DB (`lib/db`)
- **Tables**: couples, budgetItems, guests, planningTasks, clientVendors, clientDocuments, jourJEvents, leads (+ `payload jsonb` for budget/quiz/magnet/multi-devis since LOT 6), marketplaceVendors, marketplaceVenues, realisations, messages, weddingWebsites, weddingRsvps, vendorAccounts (LOT 1 — Clerk userId ↔ marketplaceVendor link, status pending/approved/rejected)

### LOT 6 — Conversion tools & lead magnets
- `/outils/budget` — 5-step wizard, deterministic client-side estimate, email capture
- `/outils/quiz` — 7-question quiz scoring 5 wedding-style profiles, email capture
- `<ExitIntentPopup>` mounted in `PublicLayout` — desktop mouseleave + 30s mobile scroll inactivity, 1×/session via sessionStorage, suppressed on `/outils/`, `/contact`, auth & dashboard paths
- `<MultiDevisForm>` triggered from `ComparatorBar` — sends 1 demand to up to 5 vendors at once, creates N `vendor_requests` rows + couple confirmation
- API routes: `POST /api/leads/{budget-calculator,quiz,magnet,multi-devis}` (zod-validated, fire-and-forget emails)
- Optional env: `LEAD_MAGNET_PDF_URL` (fallback `${appUrl()}/guide-mariage-afro.pdf`)

### LOT 10 — Performance & accessibility
- **Code splitting**: All routes except `/` (Home) are lazy-loaded via `React.lazy` + `<Suspense>` in `src/App.tsx`. The public bundle no longer includes Espace Client / Espace Pro / `/mariage/:slug` / `/mood-board/shared` / auth code paths.
- **Image pipeline**: `scripts/optimize-images.mjs` (uses `sharp`) generates AVIF + WebP siblings of every JPG/JPEG/PNG in `attached_assets/`. Run with `pnpm --filter @workspace/mariage-afro run optimize-images`. Idempotent (skips up-to-date files). Typical savings: PNG → AVIF ≈ 95%, JPEG → AVIF ≈ 55%.
- **`<Picture>` component** (`src/components/Picture.tsx`): renders `<picture>` with AVIF → WebP → original fallback. Requires explicit `width`/`height` props for CLS prevention (sets `aspect-ratio` CSS). `loading="eager"` adds `fetchPriority="high"` for above-the-fold heroes; defaults to lazy + async for below-fold.
- **Hero images**: Above-the-fold heroes (`plateforme.tsx`) use `<Picture loading="eager" />`. Below-fold banners (lieux/prestations bottom banners, home about/services accent) use default lazy `<Picture>`. First two vendor cards on `/prestations` are eager + `fetchPriority="high"`; remaining are lazy.
- **Width/height everywhere**: All `<img>` tags across the public site (Header logo, Footer logo, vendor cards, gallery thumbs, shop categories, realisations covers, mood boards, cagnotte photos, QR codes, marketplace map popups) carry explicit `width`/`height` + `aspect-ratio` style → no CLS.
- **Fonts**: Trimmed Google Fonts URL in `index.html` to only the weights actually used (Montserrat 400/500/600/700, Cormorant Garamond 400/500/600/700; Playfair Display removed). Loaded via non-blocking pattern (`media="print"` + `onload="this.media='all'"`) with `<noscript>` fallback. `display=swap` avoids FOIT.
- **A11y baseline**:
  - `src/index.css`: global `*:focus-visible` ring (gold, 2px) for WCAG 2.4.7; `@media (prefers-reduced-motion: reduce)` disables animations.
  - Skip-link "Aller au contenu principal" in `PublicLayout` jumps to `<main id="main-content">`.
  - Suspense fallback uses `role="status"` + `aria-live="polite"`.
  - Header language switcher buttons have `aria-label` (Français / Nederlands / English) + `aria-current="true"` on active language; separator dots are `aria-hidden`.
  - Header logo link has `aria-label="Mariage Afro"`; logo `<img>` is `fetchPriority="high"`.
  - All decorative `alt=""` for purely visual images; meaningful images carry descriptive alt (vendor names, captions, "QR code IBAN pour virement", etc.).
- **Lighthouse / axe-core capture**: Cannot be run from the agent environment (no headless browser CLI is available in this sandbox). Pipeline + assets are ready; the user / CI should run `lighthouse https://<deployed-url>/` after deploy. Follow-up #53 tracks the audit run.
- **Deferred to follow-up #52**: Server-side `<picture>` AVIF/WebP via vite-imagetools (current `<Picture>` derives sibling URLs by extension swap; AVIF/WebP siblings are emitted to `attached_assets/` but Vite only bundles explicitly imported variants — graceful fallback to original works, but a build-time plugin would guarantee modern formats are served in production).

### SEO technique #55 (mai 2026)
- **Domaine canonique** : aligné sur `https://www.mariage-afro.com` (avec `www`) dans `index.html`, `public/sitemap.xml`, `public/robots.txt` et la mention `mariage-afro.com/mariage/...` du guide.
- **Sitemap** : étendu à 13 URLs (vs 9 avant) — ajout de `/comparateur`, `/guide`, `/outils/budget`, `/outils/quiz`. Chaque URL porte ses 4 `xhtml:link rel="alternate" hreflang` (fr-BE, nl-BE, en-GB, x-default).
- **robots.txt** : ajout de `Disallow: /mood-board/shared/` (liens privés par token) et `Disallow: /mariage/` (sites couples privés). Conserve les disallow Espaces / Auth / Admin / API.
- **Composant SEO réutilisable** (`src/components/SEO.tsx`) : injecte `<title>`, `<meta description>`, `<link canonical>`, OG (type/site/title/description/url/image), Twitter card et 4 hreflang via `useEffect` qui mute `document.head` (pas de dépendance ajoutée). Supporte un prop `breadcrumbs` qui pose un JSON-LD `BreadcrumbList` (id `data-seo="breadcrumb"`) et un prop `jsonLd` libre.
- **Intégration** : `<SEO>` posé dans 14 pages publiques (home, plateforme, services, prestations, prestataires-detail, lieux, realisations, shop, about, contact, guide, outils-budget, outils-quiz, comparateur). L'ancien pattern manuel `useEffect` qui mutait `document.title` + meta description a été retiré dans 13 pages (race condition évitée).
- **Détail prestataire** : source SEO unifiée — `seoTitle`, `seoDescription`, `seoBreadcrumbs` mémoïsés via `useMemo` à partir des données vendor, passés à un seul `<SEO>` (pas de double effet sur head). Breadcrumb à 3 niveaux : Accueil > Prestataires > {vendor.name} avec URLs absolues. Le JSON-LD `LocalBusiness` (avec `aggregateRating` si disponible) reste injecté en `<script>` inline avec `escapeJsonLd`.
- **Vérifs finales** : typecheck propre, console sans erreur, aucun `http://` en dur, aucune occurrence restante de l'apex `https://mariage-afro.com` (sans `www`) hors emails `info@`/`noreply@`.

### Audit fonctionnel #54 (mai 2026)
- Typecheck web + API : ✅ propre.
- Traductions FR/NL/EN : ✅ parité parfaite (63 clés communes).
- Auth : ✅ toutes routes `/admin` derrière `adminAuth`, `/api/client` derrière `requireCouple`, espaces client/pro derrière Clerk `<ProtectedClient>` / `<ProtectedVendor>`.
- Console JS : ✅ aucune erreur runtime persistante (l'ancienne "Picture is not defined" sur home.tsx a été résolue par HMR avant l'audit).
- Fixes appliqués (risque faible) :
  - `Footer.tsx` : téléphone `+32 XXX XX XX XX` masqué tant que placeholder (regex `/X{2,}/`), n'apparaît que quand un vrai numéro sera renseigné dans les 3 locales.
  - `Footer.tsx` : 3 liens sociaux (Instagram/Facebook/TikTok) `href="#"` → `<span aria-disabled="true">` désactivés visuellement (border + opacity réduites) en attendant les URLs.
  - `Footer.tsx` : "Guide complet" en dur → `t("nav.guide")` ; clé ajoutée FR/NL/EN.
- Différé (couvert par tâches dédiées, **non corrigé ici**) :
  - Liens Footer "Mentions légales" / "Politique de confidentialité" `to="#"` → tâche #58.
  - `footer.made_by` "Site réalisé par Done. — madebydone.be" → tâche #56 (whitelabel).
  - Sitemap statique manque `/lieux /realisations /shop /outils-* /guide /comparateur` + URL canonique sans `www` → tâche #55.
  - Headers HTTP de production (CSP/HSTS) → tâche #57.
  - Route `/comparateur` orpheline (pas dans nav, accessible via guide.tsx + lien direct) — comportement intentionnel, pas un bug.

## Environment Variables

- `RESEND_API_KEY` — Required for contact form emails
- `ADMIN_PASSWORD` — Required for admin panel access
- `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — Clerk auth
