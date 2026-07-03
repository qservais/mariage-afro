---
name: email templating escaping contract
description: How the api-server email wrap() escapes fields, and how to render HTML/line breaks safely
---

The `wrap()` helper in `artifacts/api-server/src/lib/email/templates.ts` builds all transactional emails. Its escaping contract: `title`, `intro`, `ctaLabel`, `ctaUrl`, and `row()` values are passed through `escapeHtml()` (plain text only); `bodyHtml` is injected **raw**.

**Rule:** To render line breaks or any markup in an email body, do NOT build an HTML string and pass it as `intro` — it gets escaped and the recipient sees literal `&lt;br&gt;` / `&lt;strong&gt;`. Instead escape each dynamic segment yourself, assemble the markup, and pass it as `bodyHtml`, e.g. `intro.split("\n\n").map(p => `<p>${escapeHtml(p).replace(/\n/g,"<br>")}</p>`).join("")`.

**Why:** The guest personal-invitation email showed a literal `<br>` because it joined text with `<br>` and passed it via `intro`. Escaping-before-markup keeps user-supplied names (guest/couple) XSS-safe while rendering real breaks. The same double-escape class has affected other senders (e.g. vendor invitation with `<strong>`), so check any sender that formats its intro.
