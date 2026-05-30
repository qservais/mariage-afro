---
name: Storage URL pattern
description: How to convert /objects/ paths to browser-accessible URLs — shared utility, never inline.
---

# Rule
Always import `storageUrl` from `@/lib/storage-url`. Never write inline converters.

```ts
import { storageUrl } from "@/lib/storage-url";
// returns: `${BASE}/api/storage${path}` for /objects/... paths
// BASE = import.meta.env.BASE_URL.replace(/\/$/, "")
```

**Why:** Two bugs coexisted before the utility was introduced:
1. Missing `/api` segment → `${BASE}/storage/objects/...` 404s
2. Missing BASE_URL prefix → `/api/storage/objects/...` bypasses Replit path-based proxy

**How to apply:** Anytime you build an `<img src>`, `<video src>`, anchor `href`, or CSS `url()` from an object path — use `storageUrl(path)`. For empty-string fallback use `storageUrlOrEmpty`.

Files fixed (2026-05-30): profile.tsx, gallery.tsx, documents.tsx, cagnotte.tsx, site-mariage.tsx, inspiration.tsx, prestataires.tsx, wedding-site-renderer.tsx, prestataires-detail.tsx, realisations.tsx, mariage-cagnotte.tsx, comparateur.tsx, prestations.tsx, mood-board-shared.tsx
