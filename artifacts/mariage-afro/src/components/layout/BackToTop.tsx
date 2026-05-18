import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
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
      aria-label="Retour en haut"
      className="fixed bottom-6 right-6 z-40 w-11 h-11 bg-wine-deep text-cream border border-gold/30 flex items-center justify-center hover:bg-bordeaux hover:border-bordeaux transition-colors duration-300 shadow-lg"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}
