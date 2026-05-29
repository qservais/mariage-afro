---
name: Custom JWT Auth
description: How the custom email+password auth system works after replacing Clerk.
---

## Architecture

- **Table**: `app_users` (PostgreSQL) — id, email, password_hash, role, email_verified, verify/reset tokens.
- **Cookie**: `ma_token` — httpOnly, 30-day JWT. Also accepts `Authorization: Bearer` header.
- **JWT_SECRET**: reads `process.env.JWT_SECRET` → fallback to `ADMIN_PASSWORD` → dev hardcoded string.
- **Routes**: `POST /api/auth/register|login|logout|forgot-password|reset-password`, `GET /api/auth/me|verify-email`.
- **Middleware**: `requireClientAuth`, `requireVendorAuth`, `optionalAuth` in `artifacts/api-server/src/middlewares/jwtAuth.ts`. Auto-creates couple/vendor DB row on first login if missing.

## Frontend

- `artifacts/mariage-afro/src/lib/auth.tsx` — `AuthProvider` + `useAuth()` hook (replaces Clerk).
- `useUser()` exported from `auth.tsx` as thin shim (returns `{ user, isSignedIn }`).
- `tokenStore.ts` is a no-op shim (httpOnly cookie sent automatically via `credentials: "include"`).
- `lib/clerk.tsx` kept as empty shim to avoid import errors from stale references.
- Login pages: `/espace-client/login`, `/espace-pro/login` (dark wine-deep theme for vendor).
- `ProtectedClient`/`ProtectedVendor` in App.tsx use `useAuth()` loading state before redirecting.

## DB Migration

- `app_users` table created manually via SQL (drizzle `push` prompts interactively, use `executeSql` code tool instead).
- After adding to `lib/db/src/schema/index.ts`, run `cd lib/db && pnpm tsc --build` to regenerate declarations so API server resolves the new export.

**Why:** Clerk was removed to simplify the auth stack, avoid Clerk billing, and unify client+vendor auth under one system.
