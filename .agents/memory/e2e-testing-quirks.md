---
name: e2e-testing-quirks
description: Non-obvious constraints when writing runTest() plans for this app — auth staleness and unsupported DB steps.
---

- The `tests/e2e/*.spec.mjs` files (`_clerk-auth-helper.mjs`, `bloc-b-couple-api.spec.mjs`, etc.) still reference Clerk sign-in. Auth was fully migrated to custom JWT (see `custom-jwt-auth.md`) — those test files are stale and their login pattern must NOT be copied for new tests. For `runTest()` plans, register/login via the real UI (`/espace-client/register`, `/espace-client/login`, or vendor equivalents under `/espace-pro/`) instead.
  **Why:** copying the Clerk helper pattern into a new test silently fails to authenticate since Clerk is no longer wired up.
  **How to apply:** when writing a test plan needing an authenticated couple/vendor session, drive the real register/login form; don't reuse the old spec files' auth helper.

- `[DB]` steps in `runTest()` test plans are unreliable/unsupported in this project's testing subagent environment (observed: subagent reported "database access function not available") despite the `database-testing.md` skill describing them as supported.
  **Why:** wasted a full test run attempting a `[DB]` UPDATE before falling back to a manual approach.
  **How to apply:** if a test needs DB state that the UI can't produce (e.g. bypassing an admin-validation gate), run the SQL yourself via `executeSql()` (the `database` skill) *between* two separate `runTest()` calls — one to register/create the record, one afterward that logs into the now-prepared account — rather than relying on an in-test `[DB]` step.

- The couple `validated_at` column on the `couples` table (nullable timestamp, matched by `email`) gates vendor-contact/invite features behind admin approval. A fresh test/registered account will show a "not validated" notice on vendor pages until this is set.
  **Why:** needed to test the `prestataires.tsx` external-vendor-invite flow end-to-end.
  **How to apply:** `UPDATE couples SET validated_at = now(), validated_by = '<label>' WHERE email = '<test email>'` via `executeSql()` before testing any vendor-contact flow; clean up test couples/app_users rows afterward.
