import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import logoColor from "@assets/logo-mariage-affro-01.svg";

export default function Header() {
  const { t, i18n } = useTranslation();
  const { pathname: location } = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const navLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/services", label: t("nav.services") },
    { to: "/prestations", label: t("nav.prestations") },
    { to: "/realisations", label: t("nav.realisations") },
    { to: "/a-propos", label: t("nav.about") },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || mobileMenuOpen ? "bg-white shadow-sm py-4" : "bg-white/95 backdrop-blur-sm py-5"
      }`}
    >
      <div className="container mx-auto px-5 md:px-10 xl:px-12 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center flex-shrink-0">
          <img src={logoColor} alt="Mariage Afro" className="h-9 lg:h-11 w-auto" />
        </Link>

        {/* Desktop Nav — visible only lg+ */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          <nav className="flex items-center gap-5 xl:gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium tracking-wide transition-colors hover:text-primary whitespace-nowrap ${
                  location === link.to ? "text-primary" : "text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground tracking-widest flex-shrink-0">
            <button
              onClick={() => changeLanguage("fr")}
              className={`hover:text-primary transition-colors ${i18n.language === "fr" ? "text-primary" : ""}`}
            >
              FR
            </button>
            <span>·</span>
            <button
              onClick={() => changeLanguage("nl")}
              className={`hover:text-primary transition-colors ${i18n.language === "nl" ? "text-primary" : ""}`}
            >
              NL
            </button>
            <span>·</span>
            <button
              onClick={() => changeLanguage("en")}
              className={`hover:text-primary transition-colors ${i18n.language === "en" ? "text-primary" : ""}`}
            >
              EN
            </button>
          </div>

          <Link to="/contact" className="flex-shrink-0">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase tracking-wider text-xs px-5 xl:px-7 py-5 whitespace-nowrap"
              data-testid="button-nav-cta"
            >
              {t("nav.cta")}
            </Button>
          </Link>
        </div>

        {/* Tablet/Mobile: language + hamburger */}
        <div className="lg:hidden flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-muted-foreground tracking-widest">
            <button
              onClick={() => changeLanguage("fr")}
              className={`hover:text-primary transition-colors ${i18n.language === "fr" ? "text-primary" : ""}`}
            >
              FR
            </button>
            <span>·</span>
            <button
              onClick={() => changeLanguage("nl")}
              className={`hover:text-primary transition-colors ${i18n.language === "nl" ? "text-primary" : ""}`}
            >
              NL
            </button>
            <span>·</span>
            <button
              onClick={() => changeLanguage("en")}
              className={`hover:text-primary transition-colors ${i18n.language === "en" ? "text-primary" : ""}`}
            >
              EN
            </button>
          </div>
          <button
            className="text-foreground p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "tween", duration: 0.28 }}
            className="fixed inset-0 top-[62px] lg:hidden bg-background z-40 flex flex-col px-6 py-8 overflow-y-auto"
          >
            <nav className="flex flex-col space-y-7 mt-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-2xl font-bold tracking-wider transition-colors ${
                    location === link.to ? "text-primary" : "text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-10 flex sm:hidden items-center space-x-4 text-sm font-bold text-muted-foreground tracking-widest">
              <button onClick={() => changeLanguage("fr")} className={i18n.language === "fr" ? "text-primary" : ""}>FR</button>
              <span>·</span>
              <button onClick={() => changeLanguage("nl")} className={i18n.language === "nl" ? "text-primary" : ""}>NL</button>
              <span>·</span>
              <button onClick={() => changeLanguage("en")} className={i18n.language === "en" ? "text-primary" : ""}>EN</button>
            </div>

            <div className="mt-auto pt-12 pb-10">
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase tracking-wider text-sm py-6">
                  {t("nav.cta")}
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
