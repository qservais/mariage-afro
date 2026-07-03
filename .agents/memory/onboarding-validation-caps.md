---
name: Vendor onboarding validation caps
description: Why the onboarding zod caps must be generous and match what the form actually sends.
---

The vendor onboarding form (`VendorOnboardingGate.tsx`) repurposes the `city`
field to hold the comma-joined list of every region/country the vendor selected,
and `description` is a free-text business pitch. The backend
`onboardingSchema` (`artifacts/api-server/src/routes/vendor.ts`) validates these.

**Rule:** zod max caps on onboarding fields must comfortably exceed what the form
can legitimately produce. The underlying DB columns are all `text` (unbounded),
so the caps are only abuse guards — keep them generous (city ~500, description
~5000).

**Why:** Tight caps (city 80, description 2000) silently rejected normal
submissions (multi-region vendors, detailed descriptions) with HTTP 400. The
frontend collapsed that into a generic "Une erreur est survenue.", so the real
cause was invisible for a long time.

**How to apply:** If you change the onboarding form to add fields or feed more
data into an existing field, re-check the matching zod cap. On a 400 the route
now returns a specific human-readable `message`; the frontend surfaces it only
for status 400.
