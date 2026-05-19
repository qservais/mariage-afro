# Mission — Pro-grade UX/UI & Accessibility Audit (Back Office)

## Role
You are acting as a senior product designer + accessibility specialist conducting a **read-only audit** of the back office / admin interfaces of this project. Use the **`interface-design` agent skill** as your primary reference for design system standards, layout patterns, and component-level recommendations.

## Scope
Audit **every back office / admin route** in the codebase. Identify them yourself by scanning the project structure (typically `/admin`, `/dashboard`, `/back-office`, protected routes, or any tenant-scoped management UI). Produce a route-by-route inventory before starting the audit so I can confirm coverage.

## Strict constraints (non-negotiable)
- **PHASE 1 IS READ-ONLY.** Do not modify, refactor, rename, move, or "fix" any file during the audit. No code changes, no dependency installs, no config edits. If you spot something tempting to fix, log it in the report — do not touch it.
- Do not run destructive commands (no migrations, no resets, no deletions).
- Do not change any design tokens, theme files, or shared components.
- If a finding requires verification, take a screenshot or quote the code — do not "test by editing."

## Phase 1 — Audit (deliverable: a single Markdown report)

For each back office screen, evaluate against these axes:

### 1. UI / Visual design
- Visual hierarchy (typography scale, spacing rhythm, contrast of importance)
- Consistency with the design system (spacing, radius, shadows, color tokens)
- Component reuse vs one-off styles
- Empty states, loading states, error states, success states
- Density appropriate to the task (data-heavy ≠ marketing pages)
- Dark mode parity if applicable

### 2. UX & interaction
- Nielsen's 10 heuristics applied per screen (flag violations)
- Navigation clarity (where am I, where can I go, how do I get back)
- Form design (label placement, inline validation, error recovery, autosave, destructive action confirmation)
- Table design (sort, filter, pagination, bulk actions, column priorities on mobile)
- Feedback latency (optimistic UI, skeletons vs spinners, perceived performance)
- Task completion paths (minimum clicks for top 3 admin tasks per section)

### 3. Accessibility (WCAG 2.2 AA)
- Color contrast (text and non-text, including focus indicators)
- Keyboard navigation (tab order, visible focus, no traps, skip links)
- Semantic HTML (landmarks, headings hierarchy, lists, buttons vs links)
- ARIA usage (only where needed, correctly)
- Form accessibility (labels, descriptions, error association via `aria-describedby`)
- Screen reader support for dynamic content (`aria-live` for toasts, modals announce properly)
- Motion preferences (`prefers-reduced-motion` respected by Framer Motion animations)
- Touch target sizes (min 44×44px)

### 4. Responsive & device coverage
- Breakpoint behavior (sm / md / lg / xl)
- Mobile usability of admin tables and forms
- Sidebar / nav collapse behavior

### 5. Information architecture
- Menu grouping and labeling
- Discoverability of secondary actions
- Cognitive load per screen

### Report format (mandatory)
For each finding, use this exact structure:

```
### [Route] — [Issue title]
- **Severity**: Critical | High | Medium | Low
- **Axis**: UI / UX / A11y / Responsive / IA
- **Evidence**: file path + line OR screenshot description
- **Why it matters**: 1–2 sentences (user impact)
- **Recommended fix**: concrete, specific (no vague advice)
- **Effort**: S / M / L
- **Risk if changed**: what could break
```

End the report with:
- A **summary scorecard** per route (0–5 per axis)
- A **prioritized action plan** (P0 → P3)
- A **quick wins list** (high impact, low effort, low risk)

## Phase 2 — Proposal (STOP and wait for my green light)

After delivering the Phase 1 report, **stop and wait for my approval**. Do not start implementing anything.

When I approve, propose a **staged implementation plan**:
1. **Wave 1** — Quick wins (no risk, no breaking changes, design tokens / spacing / a11y attributes / contrast)
2. **Wave 2** — Component-level improvements (single-file changes, behind feature checks)
3. **Wave 3** — Structural changes (IA, navigation, table redesigns) — require explicit per-item approval

For each proposed change, specify:
- Files touched
- Backward compatibility plan
- Manual test checklist before / after
- Rollback procedure

## Tone & style
- No flattery, no "great codebase!" filler.
- Be direct about what's broken. I want a critical eye, not validation.
- If something is genuinely well done, say so briefly — but the value is in the gaps.

## Begin
Start by listing every back office route you identified, then proceed with Phase 1 only.
