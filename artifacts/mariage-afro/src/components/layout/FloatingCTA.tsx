import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import LeadModal from "@/components/LeadModal";

export default function FloatingCTA() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-6 right-5 z-50"
          >
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t("nav.cta")}
              className="flex items-center gap-3 bg-primary text-white px-5 py-4 shadow-2xl hover:bg-primary/90 transition-all group cursor-pointer"
            >
              <Calendar className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs font-bold uppercase tracking-widest hidden sm:block whitespace-nowrap">
                {t("nav.cta")}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <LeadModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
