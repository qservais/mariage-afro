---
name: Vendor onboarding city field holds comma-joined regions
description: Why the onboarding city field can be long and its validation cap must stay generous.
---

The vendor onboarding form (`VendorOnboardingGate.tsx`) does NOT put a single
town in the `city` field — it stores the comma-joined list of every region /
country the vendor selected. So `city` can legitimately be 100+ chars for a
multi-region vendor.

**Why:** A tight `city` cap (originally 80) silently 400'd normal multi-region
submissions; the frontend collapsed that into a generic error, so the real cause
stayed invisible for a long time. The DB columns are unbounded `text`, so the
zod caps are only abuse guards, not storage limits.

**How to apply:** Keep onboarding zod caps comfortably above what the form can
produce. If you feed more data into `city` (or any onboarding field), re-check
its cap. On a 400 the route returns a specific human-readable `message`, shown by
the frontend only for status 400.
