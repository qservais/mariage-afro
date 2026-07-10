import { useEffect } from "react";

/**
 * Locks page scroll (`document.body.style.overflow`) while `locked` is true.
 * Used for full-screen mobile overlays (nav drawers, lightboxes) so the page
 * behind them doesn't scroll while the overlay is open. Restores the previous
 * overflow value on unlock/unmount.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}
