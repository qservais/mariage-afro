---
name: Build-time DB scripts in Vite (client-only) artifacts
description: How to write a Node build-time script that needs DATABASE_URL access from inside a leaf Vite artifact, without a TS loader.
---

Leaf `artifacts/*` packages (per `pnpm-workspace` skill) have no `tsx`/`ts-node` registered, and `@workspace/db`'s package exports are raw `.ts` source (`"./src/index.ts"`) — so a plain `node scripts/foo.mjs` in an artifact cannot `import { db } from "@workspace/db"` directly.

**Decision:** for a one-off build-time script in a Vite artifact that needs the database (e.g. generating a sitemap with live slugs), add `pg` directly as a devDependency and run a raw SQL query with `new pg.Client({ connectionString: process.env.DATABASE_URL })`, rather than depending on `@workspace/db`.

**Why:** avoids needing to introduce a TS-execution toolchain into a leaf package just for one script, and keeps the artifact's dependency graph simple (Vite never bundles the script since it's not imported from `src/`).

**How to apply:** wire the script as a `prebuild`-style step in `package.json`'s `build` script (`"build": "node scripts/x.mjs && vite build ..."`), and make it fail-soft (catch DB errors, log a warning, fall back to static output) so a transient DB hiccup doesn't break the whole build.
