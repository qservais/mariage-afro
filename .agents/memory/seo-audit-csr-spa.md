---
name: SEO audit tooling on CSR SPAs
description: squirrel/audit-website CLI quirks in this environment and why most findings on a client-side-rendered app are false positives.
---

## squirrel CLI TLS
`squirrel` (installed via `.local/skills/audit-website` install script) fails with a TLS/certificate error hitting `$REPLIT_DEV_DOMAIN` even though `curl` works fine against the same URL. Prefix every invocation with `NODE_TLS_REJECT_UNAUTHORIZED=0`, e.g.:
`NODE_TLS_REJECT_UNAUTHORIZED=0 squirrel audit "https://$REPLIT_DEV_DOMAIN/" --offline --http ...`

**Why:** Bun's TLS client (squirrel's runtime) doesn't trust whatever cert chain the Replit preview proxy presents, unrelated to app code.

## CSR SPA false positives
For a client-side-rendered Vite/React SPA with no SSR, `--http` mode (no JS execution) crawls only the pre-hydration HTML shell — one page, effectively empty. This produces a flood of false-positive findings: "no H1", "0 words content", "no internal links", "missing About/Contact/Privacy pages", "crawlability" and "indexability" errors, even when those pages/elements exist and render fine once JS runs.

**How to apply:** Before reporting any squirrel/audit-website finding as a real bug on a CSR app, cross-check it against the actual source (grep routes in the router, read `index.html` directly, check server middleware) rather than trusting the crawl output at face value. Real, source-confirmed issues (e.g. a `viewport maximum-scale=1` meta tag, or headers legitimately missing in prod) are worth fixing; crawl-artifact findings are not. Rendered/`--render` crawling avoids this but needs login/credits.

Also: don't mistake the Replit **dev-domain** `x-robots-tag: noindex...` response header for an app bug — it's a platform-injected preview safety header, not something the app's own server code sets (verify by checking the production server file, e.g. `server.mjs`, for its own security-header middleware).
