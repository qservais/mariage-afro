---
name: Dev DB data/schema is not a proxy for production during QA
description: Why dev-environment DB rows and psql "$DATABASE_URL" checks cannot be used to make claims about production data/behavior during a production QA/recette task.
---

# Dev DB ≠ production DB (data AND schema)

During a full production QA pass on mariage-afro, `psql "$DATABASE_URL"` in the sandbox and
`curl localhost:8080` hit the **dev** database/server, which had a completely different vendor
catalog (13 seeded/dev vendors, many "E2E ..." test-artifact venues) than production (4 real
vendors, 1 real venue). Conclusions drawn from dev data ("92% of vendors have <3 images") were
wrong for production (real number: 4/4 vendors <3 images, but only 4 vendors total — a much
smaller, different risk).

Dev and prod can also have **schema drift**, not just data drift — see
`drizzle-push-drift.md` for a case where a `.unique()` column existed in dev's Drizzle schema
and dev DB but was silently missing from production, breaking a live endpoint (500) for every
real visitor.

**Why:** the sandbox's `DATABASE_URL`/local server is always the dev copy. Nothing about a QA
task automatically routes checks to production.

**How to apply:** any time a task is scoped as "test/verify **production**" (a live domain,
"recette", "check what's live for users"), cross-check every DB-derived claim and every
API-behavior claim against production directly — read-only production SQL via
`executeSql({environment:"production"})`, and HTTP checks via the real public domain
(`curl https://<domain>/api/...`), not `localhost`. Do this early, before drafting statistics
or acceptance-criteria arguments for the user — a wrong dev-based number can lead to the wrong
product decision being asked/made.
