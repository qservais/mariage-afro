# Verification Protocol — Mariage Afro Fix Requests

## Priority: investigate this first

**Erreur 403 — Token CSRF invalide** at `/admin/content/vendors/{id}/edit` blocks saving ANY vendor field edit (confirmed reproducible: editing Instagram or other vendor info). Root-cause this before touching anything else in the table below — several items depend on being able to actually save vendor data through this exact admin form. If the CSRF issue isn't fixed first, any other "fix" that depends on saving vendor data can look done in the code while never actually persisting.

Check specifically: session/cookie domain config between the Replit preview and the production custom domain (mariage-afro.com), CSRF token expiry relative to admin session length, and whether SameSite/Secure cookie flags differ between environments.

## Dev/preview vs. production — check this for every item, not just once

Most of what Replit Agent does happens in the development workspace/preview, which is not the same runtime as what's live at mariage-afro.com. A fix that works in dev can still be broken in production for several distinct reasons. For every item in the table below, rule each of these in or out explicitly — never assume production behaves like dev:

1. **Not deployed** — code changes in the editor don't go live until a deployment is published. Confirm a new deployment was actually triggered and completed, and note the timestamp.
2. **Different domain, different cookie/session behavior** — dev/preview runs on a Replit subdomain, production runs on mariage-afro.com. Cookie domain, SameSite/Secure flags, CORS/trusted-origins, and CSRF handling can behave differently between the two — a strong candidate for the CSRF 403 issue specifically.
3. **Different environment variables/secrets** — deployment secrets and development secrets can be configured separately in Replit; a fix depending on a secret only set in dev will misbehave in production.
4. **Different database** — confirm dev and production point at the same Neon branch, or that a data/schema fix applied in one was also applied in the other.
5. **Caching** — CDN edge cache, browser cache, or a stale build cache can make a genuinely-fixed deployment still look broken to the client. Test in an incognito window with cache disabled.

## Rule for every item below, before it can be marked "Fixed"

1. **Reproduce first.** Confirm you can trigger the exact reported behavior yourself, in the actual environment, before writing any fix. Describe what you observed. If you cannot reproduce it, say so explicitly instead of guessing.
2. **State the root cause** in one sentence before fixing it. If multiple issues share a symptom (e.g. several "doesn't save" reports), check for a shared root cause before treating them as separate bugs.
3. **Apply the fix.**
4. **Re-test the exact same reproduction steps on the actual production URL** (mariage-afro.com) — not only localhost or the Replit preview. State explicitly which environment you tested in. If you only tested in dev/preview, say so plainly and do not imply production is fixed.
5. **Provide evidence, not a claim.** A screenshot from the actual test, curl/network output, or a log excerpt showing the corrected behavior. "It's fixed" with nothing attached is not an acceptable answer.
6. **If you could not verify it, say so.** "Not verified" / "could not reproduce end-to-end" is a valid and expected answer when true — never report success you did not personally observe.
7. **Confirm deployment.** The fix must be actually deployed/published, not just saved in the editor. Note if you tested in an incognito window to rule out cached assets.

## Fix batch — to fill in and return

| # | Issue | Reproduced? | Root cause | Fix applied | Verified on production (not just dev)? | Evidence |
|---|---|---|---|---|---|---|
| 1 | Admin dashboard shows "1 compte à valider" with nothing actually pending (ghost/phantom record) | | | | | |
| 2 | Adding a partner to a project as a non-account visitor throws a generic "Erreur lors de l'ajout" with no explanation — should tell the visitor to create an account first | | | | | |
| 3 | Social media links on partner profiles don't work | | | | | |
| 4 | Phone numbers on partner profiles missing country/dial code, not displayed correctly | | | | | |
| 5 | "Cultural Styles" tags show raw values (e.g. `grand_format`) instead of formatted labels, and the block needs a more modern visual style | | | | | |
| 6 | 403 CSRF error when saving any vendor edit in admin (`/admin/content/vendors/{id}/edit`) | | | | | |

## New feature requests (separate from the fixes above — not broken, just not built yet)

- `/lieux`: add a photo gallery per venue for better visibility
- Partner listing cards: one mandatory cover photo
- Partner detail page: after clicking through, show description + mandatory gallery of 3+ photos/videos + social links
- Instagram integration: pull and display the partner's actual Instagram posts on their profile

## Non-negotiable

Nothing in the table above gets marked "Fixed" for the client unless the Evidence column contains something concrete Quentin can check himself.
