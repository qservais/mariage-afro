/**
 * Simple env-driven feature flags. Off unless the env var is explicitly "true" —
 * flip the var back on to restore full previous functionality with no code
 * changes needed.
 */

// "Guide Gratuit" exit-intent/scroll-inactivity lead-magnet popup (see
// ExitIntentPopup.tsx). Hidden by default — data capture and PDF generation
// stay intact for a future reactivation, only the client-facing triggers are gated.
export const GUIDE_GRATUIT_ENABLED = import.meta.env.VITE_GUIDE_GRATUIT_ENABLED === "true";
