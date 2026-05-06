import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarCheck2, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * WhatsApp contact number — set VITE_WHATSAPP_NUMBER in .env to override.
 * Format: international digits only, no "+", no spaces (e.g. "32470123456").
 */
const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? "32470000000";

/**
 * StickyCTA — appears after 300 px of scroll, disappears when footer is visible.
 *
 * Desktop: fixed "Prendre rendez-vous" button bottom-right.
 * Mobile:  floating WhatsApp + contact shortcut.
 * Respects prefers-reduced-motion (AnimatePresence handles it).
 * All colors use semantic Tailwind tokens — no raw hex in this file.
 */
export function StickyCTA() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const SCROLL_THRESHOLD = 300;

    const update = () => {
      const scrolled = window.scrollY > SCROLL_THRESHOLD;
      const footer = document.querySelector("footer");
      const footerVisible = footer
        ? footer.getBoundingClientRect().top < window.innerHeight - 60
        : false;
      setVisible(scrolled && !footerVisible);
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Desktop CTA */}
          <motion.div
            key="sticky-desktop"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="hidden md:block fixed bottom-8 right-8 z-40"
          >
            <Link
              to="/contact#contact-form"
              className="group flex items-center gap-3 bg-accent text-primary border border-accent hover:bg-surface hover:border-surface px-6 py-3.5 shadow-xl transition-all duration-300"
              aria-label={t("header.cta_rdv")}
            >
              <CalendarCheck2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span className="text-[11px] uppercase tracking-[0.25em] font-semibold whitespace-nowrap">
                {t("header.cta_rdv")}
              </span>
              <span className="block w-0 group-hover:w-5 h-px bg-primary transition-all duration-300 overflow-hidden" />
            </Link>
          </motion.div>

          {/* Mobile floating buttons */}
          <motion.div
            key="sticky-mobile"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="md:hidden fixed bottom-6 right-5 z-40 flex flex-col gap-3 items-end"
          >
            <a
              href={`https://wa.me/${WA_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 bg-whatsapp text-white px-4 py-3 shadow-lg hover:bg-whatsapp-hover transition-colors"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold">WhatsApp</span>
            </a>
            <Link
              to="/contact#contact-form"
              className="flex items-center gap-2.5 bg-accent text-primary px-4 py-3 shadow-lg hover:bg-surface transition-colors"
              aria-label={t("header.cta_rdv")}
            >
              <CalendarCheck2 className="w-4 h-4" aria-hidden="true" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold">
                {t("header.cta_rdv")}
              </span>
            </Link>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
