---
name: drizzle-kit push drift & unique-constraint trap
description: Why drizzle-kit push/push-force can silently fail to apply schema changes in this repo, and how to unblock it safely.
---

# drizzle-kit push (0.31.9) unique-constraint drift trap

`pnpm --filter @workspace/db run push-force` (drizzle-kit `push --force`) still renders an
**interactive** "Do you want to truncate <table>?" prompt when it wants to add a UNIQUE
constraint to a table that already has rows. `--force` does NOT suppress this prompt.

In a non-TTY (piped, `</dev/null`, or post-merge.sh which closes stdin) the process
**exits 0 but applies NOTHING after the prompt** — a silent no-op. So a schema change
(e.g. a new column) can appear to "push" successfully yet never reach the DB, because an
unrelated pending unique-constraint drift blocks the batch first.

**Why it drifts:** columns declared with drizzle `.unique()` expect a named UNIQUE
*constraint*, but this dev DB accumulated plain unique *indexes* with the same name (no
constraint). drizzle diffs index-vs-constraint as a pending change every push.

**How to apply (safe, idempotent):**
- Verify data is safe first: `select count(*), count(distinct col), count(col) from t;`
  (a UNIQUE constraint is safe when distinct == non-null count; Postgres allows many NULLs).
- Promote an existing unique index in place (no rebuild, no data change):
  `ALTER TABLE t ADD CONSTRAINT <name> UNIQUE USING INDEX <existing_index_name>;`
- If no index exists yet: `ALTER TABLE t ADD CONSTRAINT <name> UNIQUE (col);`
- Add a plain column directly when push is blocked:
  `ALTER TABLE t ADD COLUMN IF NOT EXISTS c <type> NOT NULL DEFAULT <v>;`
- After clearing all drift, re-run `push-force </dev/null` — a clean run prints
  `[✓] Changes applied` with no prompt.

**How to apply this:** any task that adds a column/constraint and finds push-force hangs or
no-ops should clear the pre-existing unique-index-vs-constraint drift (vendor_quotes,
marketplace_vendors were the known ones) so post-merge.sh (`set -e`, stdin closed) reliably
applies the schema on merge. Always confirm the actual DB state with `information_schema` /
`pg_constraint`, never trust the push-force exit code alone (it's masked by pipes and no-ops).

**Same trap hits the Publish flow's prod schema diff, not just dev push-force.** Found
`marketplace_venues.slug` (a `.unique()` text column) present in dev schema/DB but silently
missing in production — the live `/api/marketplace/venues` endpoint 500'd for every real user
because `db.select()` selects all schema columns including the missing one. A prior publish's
automatic schema diff must have hit the same unique-constraint prompt and no-op'd for that one
column while other columns in the same table went through. **Always verify production schema
directly** (`information_schema.columns` via `executeSql({environment:"production"})`) for any
column with a `.unique()`/constraint modifier before assuming a publish actually applied it —
do not trust "it was in a past deploy" as proof it's live.
