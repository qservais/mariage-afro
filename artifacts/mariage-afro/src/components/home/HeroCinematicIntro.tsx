import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";

type Rect = { docTop: number; left: number; width: number; height: number };

export function HeroCinematicOverlay({
  videoSrc,
  posterSrc,
  slotRef,
}: {
  videoSrc: string;
  posterSrc: string;
  slotRef: RefObject<HTMLDivElement | null>;
}) {
  const { t } = useTranslation();
  const [rect, setRect] = useState<Rect | null>(null);
  const [vp, setVp] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 1280,
    h: typeof window !== "undefined" ? window.innerHeight : 720,
  }));

  const measure = () => {
    if (!slotRef.current) return;
    const r = slotRef.current.getBoundingClientRect();
    setRect({
      docTop: r.top + window.scrollY,
      left: r.left,
      width: r.width,
      height: r.height,
    });
    setVp({ w: window.innerWidth, h: window.innerHeight });
  };

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    const t1 = window.setTimeout(measure, 250);
    const t2 = window.setTimeout(measure, 900);
    // Remesure une fois les fontes web chargées (le H1 Cormorant change la hauteur).
    const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
    if (fonts?.ready) {
      fonts.ready.then(measure).catch(() => {});
    }
    return () => {
      window.removeEventListener("resize", measure);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // slotRef ref is stable; intentionally empty deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { scrollY } = useScroll();
  const morphDistance = Math.max(vp.h * 0.7, 320);

  const top = useTransform(scrollY, (sy) => {
    if (!rect) return 0;
    const p = Math.min(Math.max(sy / morphDistance, 0), 1);
    return (1 - p) * 0 + p * (rect.docTop - sy);
  });
  const left = useTransform(scrollY, (sy) => {
    if (!rect) return 0;
    const p = Math.min(Math.max(sy / morphDistance, 0), 1);
    return (1 - p) * 0 + p * rect.left;
  });
  const width = useTransform(scrollY, (sy) => {
    if (!rect) return vp.w;
    const p = Math.min(Math.max(sy / morphDistance, 0), 1);
    return (1 - p) * vp.w + p * rect.width;
  });
  const height = useTransform(scrollY, (sy) => {
    if (!rect) return vp.h;
    const p = Math.min(Math.max(sy / morphDistance, 0), 1);
    return (1 - p) * vp.h + p * rect.height;
  });

  const veilOpacity = useTransform(scrollY, [0, morphDistance * 0.6], [0.18, 0]);
  const cueOpacity = useTransform(scrollY, [0, morphDistance * 0.4, morphDistance * 0.95], [1, 0.5, 0]);
  const skipOpacity = useTransform(scrollY, [0, morphDistance * 0.6, morphDistance * 0.95], [1, 0.6, 0]);
  const skipPointer = useTransform(scrollY, (sy) => (sy < morphDistance * 0.95 ? "auto" : "none"));

  const skipIntro = () => {
    try {
      sessionStorage.setItem("mariageAfroIntroSeen", "true");
    } catch {}
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  return (
    <>
      <motion.div
        aria-hidden="true"
        style={{ opacity: veilOpacity }}
        className="fixed inset-0 z-30 bg-wine-deep pointer-events-none"
      />

      <motion.div
        style={{ top, left, width, height, position: "fixed" }}
        className="z-40 overflow-hidden shadow-2xl pointer-events-none will-change-transform"
        aria-hidden="true"
        data-testid="hero-intro-overlay"
      >
        <video
          src={videoSrc}
          poster={posterSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-wine-deep/40 via-transparent to-transparent pointer-events-none" />
      </motion.div>

      <motion.button
        type="button"
        onClick={skipIntro}
        style={{ opacity: skipOpacity, pointerEvents: skipPointer as unknown as "auto" | "none" }}
        className="fixed top-24 right-5 md:right-10 z-50 text-cream/85 hover:text-gold text-[10px] uppercase tracking-[0.3em] font-medium underline underline-offset-4 decoration-gold/40 hover:decoration-gold transition-colors"
        data-testid="hero-intro-skip"
      >
        {t("home.intro_skip")}
      </motion.button>

      <motion.div
        style={{ opacity: cueOpacity }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 text-cream pointer-events-none"
        aria-hidden="true"
      >
        <span className="text-[10px] uppercase tracking-[0.4em]">{t("home.discover")}</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </>
  );
}

export function HeroMobileFadeOverlay({
  videoSrc,
  posterSrc,
}: {
  videoSrc: string;
  posterSrc: string;
}) {
  const { t } = useTranslation();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 80) {
        setShow(false);
        try {
          sessionStorage.setItem("mariageAfroIntroSeen", "true");
        } catch {}
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const skipIntro = () => {
    try {
      sessionStorage.setItem("mariageAfroIntroSeen", "true");
    } catch {}
    setShow(false);
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="mobile-intro"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 z-40 bg-wine-deep pointer-events-none"
          data-testid="hero-intro-mobile"
        >
          <video
            src={videoSrc}
            poster={posterSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-wine-deep/40 via-transparent to-transparent pointer-events-none" />
          <button
            type="button"
            onClick={skipIntro}
            className="fixed top-24 right-5 z-[51] text-cream/90 hover:text-gold text-[10px] uppercase tracking-[0.3em] font-medium underline underline-offset-4 decoration-gold/40 pointer-events-auto"
            data-testid="hero-intro-skip"
          >
            {t("home.intro_skip")}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
