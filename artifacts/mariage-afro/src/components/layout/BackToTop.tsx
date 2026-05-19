import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function BackToTop() {
  const { t } = useTranslation("common");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label={t("popup.back_to_top", "Back to top")}
      className="fixed bottom-40 right-5 md:bottom-24 md:right-8 z-40 w-11 h-11 bg-wine-deep text-cream border border-gold/30 flex items-center justify-center hover:bg-bordeaux hover:border-bordeaux transition-colors duration-300 shadow-lg"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}
