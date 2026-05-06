import { useEffect, useRef, useState } from "react";

/**
 * HeroCursor — Custom bordeaux ring cursor for the hero section.
 *
 * Only active on desktop (pointer: fine) and only while hovering the hero.
 * Disabled when prefers-reduced-motion is set.
 * The native cursor is hidden inside the hero via CSS class `cursor-hero-active`
 * applied to the hero element.
 */
export function HeroCursor({ heroRef }: { heroRef: React.RefObject<HTMLElement | null> }) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (reduced || !fine) return;

    const hero = heroRef.current;
    if (!hero) return;

    let rafId = 0;
    let mx = -200;
    let my = -200;

    const move = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (cursorRef.current) {
          cursorRef.current.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
        }
      });
    };

    const enter = () => {
      setActive(true);
      hero.classList.add("cursor-none");
    };
    const leave = () => {
      setActive(false);
      hero.classList.remove("cursor-none");
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(-200px, -200px) translate(-50%, -50%)`;
      }
    };

    hero.addEventListener("mouseenter", enter);
    hero.addEventListener("mouseleave", leave);
    hero.addEventListener("mousemove", move);

    return () => {
      cancelAnimationFrame(rafId);
      hero.removeEventListener("mouseenter", enter);
      hero.removeEventListener("mouseleave", leave);
      hero.removeEventListener("mousemove", move);
      hero.classList.remove("cursor-none");
    };
  }, [heroRef]);

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="fixed top-0 left-0 z-[9999] pointer-events-none will-change-transform"
      style={{
        transform: "translate(-200px, -200px) translate(-50%, -50%)",
        opacity: active ? 1 : 0,
        transition: "opacity 0.25s ease",
      }}
    >
      {/* Outer ring — bordeaux */}
      <div
        className="w-10 h-10 rounded-full border border-secondary"
        style={{ transition: "width 0.15s ease, height 0.15s ease" }}
      />
      {/* Inner dot — gold */}
      <div
        className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-accent"
        style={{ transform: "translate(-50%, -50%)" }}
      />
    </div>
  );
}
