---
name: api-server dev workflow has no hot-reload
description: The api-server dev workflow builds then starts (no watch), so backend edits require a workflow restart before they take effect.
---

The `artifacts/api-server` dev workflow runs `build && start` (esbuild bundle to
`dist/index.mjs`, then `node dist/index.mjs`) — it is NOT `tsx watch`. Editing a
backend source file does nothing until you restart the workflow
`artifacts/api-server: API Server`.

**Why:** Verifying an API fix with curl right after editing will show the OLD
behavior and mislead you into thinking the fix failed. This cost a wasted
verification cycle on the vendor-onboarding fix.

**How to apply:** After any edit under `artifacts/api-server/src`, restart the
API Server workflow before re-testing endpoints (curl, e2e, etc.).
