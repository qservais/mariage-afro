import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X, User } from "lucide-react";
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
    { to: "/plateforme", label: t("nav.platform") },
    { to: "/services", label: t("nav.services") },
    { to: "/partenaires", label: t("nav.partners") },
    { to: "/lieux", label: t("nav.venues") },
    { to: "/realisations", label: t("nav.realisations") },
    { to: "/shop", label: t("nav.shop") },
    { to: "/a-propos", label: t("nav.about") },
    { to: "/contact", label: t("nav.contact") },
  ];

  const isActive = (to: string) => {
    if (to === "/") return location === "/";
    return location === to || location.startsWith(to + "/");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || mobileMenuOpen ? "bg-white shadow-sm py-3" : "bg-white/95 backdrop-blur-sm py-4"
      }`}
    >
      <div className="container mx-auto px-5 md:px-8 xl:px-6 2xl:px-10 flex items-center justify-between gap-3 xl:gap-4">
        <Link to="/" className="flex items-center flex-shrink-0">
          <img src={logoColor} alt="Mariage Afro" className="h-9 xl:h-10 w-auto" />
        </Link>

        {/* Desktop Nav — visible only xl+ */}
        <div className="hidden xl:flex items-center gap-3 2xl:gap-6 flex-1 justify-end">
          <nav className="flex items-center gap-3 2xl:gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-[12px] 2xl:text-[13px] font-medium tracking-wide transition-colors hover:text-primary whitespace-nowrap ${
                  isActive(link.to) ? "text-primary" : "text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 text-[10px] 2xl:text-[11px] font-bold text-muted-foreground tracking-widest flex-shrink-0">
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

          <Link to="/espace-client" className="flex-shrink-0" aria-label={t("nav.client_area")}>
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white rounded-none uppercase tracking-wider text-[10px] 2xl:text-[11px] px-3 2xl:px-4 py-3.5 h-auto whitespace-nowrap gap-1.5"
              data-testid="button-nav-client-area"
            >
              <User className="w-3.5 h-3.5" />
              <span>{t("nav.client_area")}</span>
            </Button>
          </Link>

          <Link to="/contact" className="flex-shrink-0">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase tracking-wider text-[10px] 2xl:text-[11px] px-4 2xl:px-5 py-3.5 h-auto whitespace-nowrap"
              data-testid="button-nav-cta"
            >
              {t("nav.cta")}
            </Button>
          </Link>
        </div>

        {/* Tablet/Mobile: language + hamburger */}
        <div className="xl:hidden flex items-center gap-4">
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
            data-testid="button-mobile-menu"
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
            className="fixed inset-0 top-[60px] xl:hidden bg-background z-40 flex flex-col px-6 py-8 overflow-y-auto"
          >
            <nav className="flex flex-col space-y-5 mt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-xl font-bold tracking-wide transition-colors ${
                    isActive(link.to) ? "text-primary" : "text-foreground"
                  }`}
                  data-testid={`link-mobile-${link.to.replace(/\//g, "") || "home"}`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/espace-client"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 text-xl font-bold tracking-wide transition-colors ${
                  isActive("/espace-client") ? "text-primary" : "text-foreground"
                }`}
              >
                <User className="w-5 h-5" />
                {t("nav.client_area")}
              </Link>
            </nav>

            <div className="mt-8 flex sm:hidden items-center space-x-4 text-sm font-bold text-muted-foreground tracking-widest">
              <button onClick={() => changeLanguage("fr")} className={i18n.language === "fr" ? "text-primary" : ""}>FR</button>
              <span>·</span>
              <button onClick={() => changeLanguage("nl")} className={i18n.language === "nl" ? "text-primary" : ""}>NL</button>
              <span>·</span>
              <button onClick={() => changeLanguage("en")} className={i18n.language === "en" ? "text-primary" : ""}>EN</button>
            </div>

            <div className="mt-auto pt-10 pb-10">
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
