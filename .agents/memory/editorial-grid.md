---
name: Editorial grid pattern
description: Canonical multi-column card grid pattern for Mariage Afro
---

# Editorial Grid Pattern

## Canonical card grid (used across the site)
```tsx
<div className="grid grid-cols-1 md:grid-cols-N gap-px bg-wine-deep/10 border border-wine-deep/10">
  <div className="bg-cream-soft p-10 md:p-12 flex flex-col group">
    ...
  </div>
</div>
```
The `gap-px` + `bg-wine-deep/10` creates hairline 1px separators between cards. Cards use `bg-cream-soft` (not bg-white) as fill.

## Ordinal numbers over icon boxes
For editorial/contact/feature sections: use Cormorant ordinal numbers (01/02/03) instead of square icon boxes:
```tsx
<span className="font-display text-[11px] uppercase tracking-[0.35em] text-gold-deep mb-10">01</span>
```
Icon boxes (w-14 h-14 border border-gold/40) are the old pattern — keep only where already established and working.

## Asymmetric contact grid
For 3-item contact/feature blocks, avoid equal 3-column layout. Use:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-[5fr_3fr] gap-px bg-wine-deep/10 border border-wine-deep/10">
  {/* Featured large card */}
  <div className="p-10 md:p-14">...</div>
  {/* Two stacked secondary cards */}
  <div className="flex flex-col gap-px">
    <div className="p-8 md:p-10 flex-1">...</div>
    <div className="p-8 md:p-10 flex-1">...</div>
  </div>
</div>
```

**Why:** 3 identical equal-width columns is the most generic SaaS pattern. Asymmetry signals editorial intent and breaks the "template" read.
