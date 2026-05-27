---
name: Design system tokens
description: Token rules for Mariage Afro — what to use instead of raw values
---

# Token usage rules

## Backgrounds
- `bg-cream` (#fff4e4) — primary warm off-white background
- `bg-cream-soft` (#faf9f7) — alternate section background (near-white, on-brand)
- **Never** `bg-white` (#ffffff) for page sections or cards — it breaks the warm palette

## Borders
- `border-wine-deep/10` — subtle dividers, card borders
- `border-wine-deep/15` — slightly stronger borders
- `border-wine-deep/20` — form inputs, interactive borders
- **Never** `border-neutral-200`, `border-neutral-300` — generic Tailwind

## Text
- `text-wine-deep` — primary body text
- `text-wine-deep/70` — secondary body (replaces `text-neutral-600`)
- `text-wine-deep/50` — tertiary / meta (replaces `text-neutral-500`)
- `text-wine-deep/40` — muted / placeholder (replaces `text-neutral-400`)
- `text-wine-deep/30` — very muted (replaces `text-neutral-300`)

**Why:** The site uses a warm cream palette; neutral-* grays clash with the warm tones and break brand consistency. wine-deep with opacity maintains warmth.

**How to apply:** Any time you write neutral-* or bg-white in pages or components, swap immediately. Exception: bg-white/90 for image overlay buttons (semi-transparent on dark images) is intentional.
