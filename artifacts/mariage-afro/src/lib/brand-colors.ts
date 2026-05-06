/**
 * Brand palette utilities.
 *
 * All hex values live EXCLUSIVELY in src/index.css @theme inline.
 * This module exports only:
 *   - CSS variable reference strings  (for JSX style="" attributes)
 *   - Runtime resolver functions      (for canvas, SDKs, SVG attributes)
 *
 * Do NOT add raw hex literals to this file.
 */

/**
 * CSS variable strings for use in JSX `style` objects.
 * e.g. `style={{ color: BRAND.accent }}` → `style={{ color: "var(--color-accent)" }}`
 */
export const BRAND = {
  primary:    "var(--color-primary)",
  secondary:  "var(--color-secondary)",
  accent:     "var(--color-accent)",
  accentDeep: "var(--color-accent-deep)",
  surface:    "var(--color-surface)",
  creamSoft:  "var(--color-cream-soft)",
  white:      "var(--color-white)",
  charcoal:   "var(--color-charcoal)",
  wineMid:    "var(--color-wine-mid)",
  ink:        "var(--color-ink)",
  muted:      "var(--color-muted-warm)",
} as const;

/**
 * Resolve a CSS variable to its actual computed colour at runtime.
 *
 * Must be called inside browser context (component renders, effects,
 * event handlers). Safe to call because those always run in the browser.
 *
 * @param cssVarRef - A "var(--color-x)" string or raw "--color-x" name.
 */
export function resolveColor(cssVarRef: string): string {
  if (typeof document === "undefined") return "";
  const name = cssVarRef.startsWith("var(") ? cssVarRef.slice(4, -1) : cssVarRef;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Budget pie-chart colour ramp — resolved from CSS vars at render time.
 * Call inside the component body; the first entry is --color-secondary.
 */
export function getBudgetChartColors(): string[] {
  return [
    "--color-secondary",
    "--color-budget-1",
    "--color-budget-2",
    "--color-budget-3",
    "--color-budget-4",
    "--color-budget-5",
    "--color-budget-6",
  ].map(resolveColor);
}

/**
 * Clerk appearance variables — resolved at render time (not at module load)
 * so that CSS custom properties are already computed in the DOM.
 * Use via the getter in clerkAppearance.variables (see lib/clerk.tsx).
 */
export function getClerkVariables() {
  return {
    colorPrimary:         resolveColor(BRAND.secondary),
    colorBackground:      resolveColor(BRAND.white),
    colorInputBackground: resolveColor(BRAND.surface),
    colorText:            resolveColor("--color-neutral-text"),
    colorTextSecondary:   resolveColor("--color-neutral-text-soft"),
    colorInputText:       resolveColor("--color-neutral-text"),
    colorNeutral:         resolveColor("--color-neutral-text"),
  };
}
