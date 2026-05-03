/**
 * Backend regression — Zod validation for PATCH /api/client/wedding-website
 * template field.
 *
 * The schema below MUST mirror `websiteSchema` in
 * artifacts/api-server/src/routes/client.ts. The route returns 400 when a
 * payload fails Zod parsing, so we validate behaviour at the schema level
 * (no live HTTP / auth needed) and assert the same shape the route relies on.
 *
 * Run with: node artifacts/api-server/tests/wedding-website-template-validation.spec.mjs
 */
import { z } from "zod";

// Mirror of websiteSchema — keep in sync with routes/client.ts.
const websiteSchema = z.object({
  slug: z.string().min(3).max(60).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().max(100).optional(),
  welcomeMessage: z.string().max(2000).optional(),
  weddingDate: z.string().optional(),
  venue: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  programme: z.array(z.object({ time: z.string(), event: z.string() })).optional(),
  template: z.enum(["royal-afro", "boheme", "moderne", "tropical"]).optional(),
  active: z.boolean().optional(),
  rsvpEnabled: z.boolean().optional(),
});

const failures = [];
const check = (label, cond) => {
  if (cond) console.log(`  ✓ ${label}`);
  else { console.error(`  ✗ ${label}`); failures.push(label); }
};

// 1. Each accepted template id parses successfully.
for (const id of ["royal-afro", "boheme", "moderne", "tropical"]) {
  const r = websiteSchema.safeParse({ template: id });
  check(`accepts template "${id}"`, r.success === true);
}

// 2. Invalid templates are rejected (would yield HTTP 400 in the route).
const invalids = [
  "vintage",          // unknown id
  "Royal-Afro",       // wrong casing
  "",                 // empty string
  null,               // null
  42,                 // wrong type
  ["boheme"],         // wrong type (array)
  { id: "boheme" },   // wrong type (object)
];
for (const v of invalids) {
  const r = websiteSchema.safeParse({ template: v });
  check(
    `rejects invalid template ${JSON.stringify(v)}`,
    r.success === false &&
      Array.isArray(r.error.issues) &&
      r.error.issues.some((i) => i.path.join(".") === "template"),
  );
}

// 3. Omitting template is allowed (field is optional).
check(
  "allows omitted template",
  websiteSchema.safeParse({ title: "Hello" }).success === true,
);

// 4. Empty patch is allowed (full optional schema).
check("allows empty patch", websiteSchema.safeParse({}).success === true);

if (failures.length > 0) {
  console.error(`\n[wedding-website-template-validation.spec] ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\n[wedding-website-template-validation.spec] all passed.");
