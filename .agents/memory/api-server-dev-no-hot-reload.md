---
name: api-server dev workflow has no hot-reload
description: The api-server dev workflow builds then starts (no watch), so backend edits require a workflow restart before they take effect.
---

The `artifacts/api-server` dev workflow runs `build && start` (esbuild bundle to
`dist/index.mjs`, then `node dist/index.mjs`) — it is NOT `tsx watch`. Editing a
backend source file does nothing until you restart the workflow
`artifacts/api-server: API Server`.

**Why:** Testing an API change with curl right after editing shows the OLD
behavior (the running process still serves the previous bundle), which misleads
you into thinking the change failed.

**How to apply:** After any edit under `artifacts/api-server/src`, restart the
API Server workflow before re-testing endpoints (curl, e2e, etc.).
