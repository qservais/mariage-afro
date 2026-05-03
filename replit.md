# Workspace

## Overview

This project is a pnpm workspace monorepo utilizing TypeScript to develop "Mariage Afro," a premium platform for Afro & mixed weddings in Belgium. It includes a React-based web application and an Express.js API server. The platform aims to connect couples with vendors, manage wedding planning, and provide tools for a seamless wedding experience.

The core business vision is to become the leading platform for Afro and mixed heritage weddings in Belgium, offering a tailored experience for couples and a dedicated marketplace for vendors. Key capabilities include vendor discovery, wedding planning tools (budget, guest list, planning tasks), a personalized wedding website builder, and integrated communication features.

## User Preferences

I prefer iterative development. Ask before making major changes.

## System Architecture

The project is structured as a pnpm monorepo.

### UI/UX Decisions

The "Mariage Afro" web application (`artifacts/mariage-afro`) is a React + Vite app styled with Tailwind CSS and Framer Motion for animations.

**Branding (charte hybride officielle):**
- **Primary Font**: Montserrat (300, 400, 500, 600, 700) for general text.
- **Secondary Font**: Cormorant Garamond for editorial titles (`.font-display`, `.font-serif`).
- **Color Palette**:
    - Primary bordeaux: `#68191e`
    - Secondary cream: `#fff4e4`
    - Alt white: `#ffffff`
    - Alt dark: `#141414`
    - Gold (for dark backgrounds): `#c9a96e` (accent for eyebrows, dividers, icons, focus rings, hover accents).
    - Gold-deep (for light backgrounds): `#8a6d3b` (WCAG AA compliant for cream/white backgrounds).
    - Wine-deep: `#1f1416` and Wine-mid: `#2a1c1f` for rich dark backgrounds.
- **Logo**: `attached_assets/logo-mariage-affro-01.svg` (wordmark bordeaux). It is recolored to white on dark backgrounds using `brightness-0 invert`.
- **Contrast & Readability**: Ensured WCAG AA compliance with adjusted text sizes (min `text-xs`) and `gold-deep` for accents on light backgrounds. `hover:underline underline-offset-4` added for enhanced hover states.

### Technical Implementations

- **Monorepo Tool**: pnpm workspaces
- **Node.js**: v24
- **TypeScript**: v5.9
- **API Framework**: Express 5
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build Tool**: esbuild (CJS bundle)
- **Authentication**: Clerk (`@clerk/react` for frontend, `@clerk/express` for API). Separate login flows for couples (`/espace-client/login`) and vendors (`/espace-pro/login`). Vendor accounts are auto-created on first request.
- **Email Service**: Resend (via `lib/email.ts`) for notifications (new leads, conversation messages, RSVPs, vendor approvals, etc.). Supports FR/NL/EN i18n. Email sending is fire-and-forget.
- **Internationalization**: `react-i18next` for FR (default), NL, EN, with translation files in `src/locales/`.
- **Image Optimization**: `scripts/optimize-images.mjs` uses `sharp` to generate AVIF and WebP variants from JPG/JPEG/PNG in `attached_assets/`. A custom `<Picture>` component handles responsive image rendering with AVIF/WebP/original fallbacks and explicit `width`/`height` for CLS prevention. `loading="eager"` and `fetchPriority="high"` are used for above-the-fold heroes.
- **Code Splitting**: All routes except `/` are lazy-loaded using `React.lazy` and `<Suspense>` to reduce initial bundle size.
- **Font Loading**: Optimized Google Fonts loading with `media="print"` and `onload="this.media='all'"` for non-blocking behavior, and `display=swap` to prevent FOIT.
- **Accessibility (A11y)**: Global `*:focus-visible` ring for WCAG 2.4.7. Reduced motion preference support. Skip-link for main content. `aria-label` and `aria-current` for navigation elements. Descriptive `alt` tags for images.
- **SEO**:
    - **Canonical Domain**: `https://www.mariage-afro.com` (with `www`).
    - **Sitemap**: Comprehensive sitemap (`public/sitemap.xml`) including all public URLs and `xhtml:link rel="alternate" hreflang` for FR/NL/EN/x-default.
    - **robots.txt**: Configured to disallow private and internal paths (e.g., `/mood-board/shared/`, `/mariage/`, `/_replit`).
    - **Reusable SEO Component (`src/components/SEO.tsx`)**: Manages `<title>`, `<meta description>`, `<link canonical>`, OG (Open Graph), Twitter card, and hreflang tags. Supports JSON-LD for `BreadcrumbList`, `LocalBusiness`, `Organization`, `WebSite`, and `ItemList` (for services).
- **HTTP Security**:
    - **API Server (`artifacts/api-server`)**: Uses `helmet` middleware for strict CSP, HSTS, Referrer-Policy, X-Frame-Options, X-Content-Type-Options, COOP, CORP, and Permissions-Policy. CSP is in Report-Only mode in development.
    - **Web App (`artifacts/mariage-afro`)**: Mini-Express server with `helmet` for HTTP headers including CSP, HSTS, X-Frame-Options, etc. CSP whitelist includes Clerk, Google Fonts, object storage, OSM tiles, Cloudflare Turnstile, YouTube/Vimeo. `frame-ancestors 'none'`, `object-src 'none'`, `upgrade-insecure-requests`.

### Feature Specifications

- **Mariage Afro Web App (`artifacts/mariage-afro`)**:
    - **Public Pages**: Home, Platform overview, Services, Vendor marketplace, Venue listing, Couple stories, Shop, About, Contact form, Public per-couple wedding pages (program + RSVP).
    - **Espace Client (Protected)**: Dashboard, Budget tracker, Guest list, Planning tasks, Saved vendors, Documents, Day-of timeline, Couple ↔ Admin messaging, Wedding website builder, Profile.
    - **Espace Pro (Protected - Vendor Area)**: Dashboard, Profile editing, Gallery upload (object storage), Service management, Account settings. Onboarding modal for new vendors, admin validation required for publishing.
    - **Legal Pages**: Dedicated pages for Legal Mentions, Privacy Policy, and Cookies Policy, served in FR/NL/EN via i18n. These pages follow a specific content structure and minimalist design.
    - **Conversion Tools & Lead Magnets**:
        - 5-step budget calculator wizard.
        - 7-question wedding style quiz.
        - Exit-Intent Popup (desktop mouseleave, mobile scroll inactivity).
        - Multi-Devis Form for sending inquiries to multiple vendors.
- **API Server (`artifacts/api-server`)**:
    - **Health Check**: `GET /api/healthz`.
    - **Contact Form**: `POST /api/contact`.
    - **Marketplace Endpoints**: `GET /api/marketplace/vendors`, `GET /api/marketplace/venues`, `GET /api/marketplace/realisations`.
    - **Client Endpoints (Auth-protected)**: `GET/PATCH /api/client/me`, `GET/POST /api/client/messages`, `GET/PATCH /api/client/wedding-website`.
    - **Wedding Endpoints**: `GET /api/wedding/:slug` (public), `POST /api/wedding/:slug/rsvp` (public).
    - **Admin Endpoints**: Full CRUD operations under `/admin/content/` for vendors, venues, realisations, messages, wedding-websites.
    - **Lead Magnet Endpoints**: `POST /api/leads/{budget-calculator,quiz,magnet,multi-devis}`.
- **Database (`lib/db`)**: Includes tables for couples, budget items, guests, planning tasks, client vendors, documents, day-of events, leads (with `payload jsonb`), marketplace vendors/venues, realisations, messages, wedding websites, RSVPs, and vendor accounts.

## External Dependencies

- **Clerk**: For user authentication and management (`@clerk/react`, `@clerk/express`).
- **Resend**: For sending transactional emails.
- **PostgreSQL**: Primary database.
- **Vite**: Frontend build tool.
- **Tailwind CSS**: Utility-first CSS framework.
- **Framer Motion**: Animation library.
- **react-i18next**: Internationalization framework for React.
- **@tanstack/react-query**: Data fetching and caching.
- **Cloudflare Turnstile**: CAPTCHA service.
- **Google Fonts**: For Montserrat and Cormorant Garamond fonts.
- **OpenStreetMap**: For map tiles and geocoding in marketplace features.
- **Sharp**: Image processing library used in optimization scripts.
- **Object Storage**: For storing vendor gallery images.