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
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Mariage Afro (`artifacts/mariage-afro`)
- **Type**: React + Vite web app
- **Preview path**: `/`
- **Purpose**: V1 showcase website for Mariage Afro — premium Afro & mixed wedding platform in Belgium
- **Stack**: React, Vite, Tailwind CSS, Framer Motion, Wouter, react-i18next, react-hook-form, Zod
- **Languages**: FR (default), NL, EN — via react-i18next with translations in `public/locales/`
- **Pages**: Home, Services, Prestations, Réalisations, À Propos, Contact
- **Contact form**: POSTs to `/api/contact` — handled by the API server using Resend
- **Images**: Uses attached wedding photos from `attached_assets/` via `@assets` Vite alias
- **Branding**: Montserrat font, bordeaux (#68191e), crème (#fff4e4), dark (#141414)

### API Server (`artifacts/api-server`)
- **Type**: Express 5 API
- **Preview path**: `/api`
- **Routes**: GET /api/healthz, POST /api/contact
- **Contact route**: Validates name/email/message, sends email via Resend (requires RESEND_API_KEY env var)
- **Resend**: Configured to send from `noreply@mariage-afro.com` to `info@mariage-afro.com`
- **Note**: If RESEND_API_KEY is not set, the contact form still responds 200 but skips sending

## Environment Variables Needed for Production

- `RESEND_API_KEY` — Required for the contact form to send emails via Resend
