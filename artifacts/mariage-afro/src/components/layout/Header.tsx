import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X, User, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

  // Détecter si on est sur une page avec hero sombre (style éditorial wine-deep)
  // pour adapter automatiquement les couleurs du header + sidebar
  const DARK_HERO_ROUTES = ["/", "/realisations", "/lieux", "/partenaires"];
  const isOverDarkRoute = DARK_HERO_ROUTES.includes(location);
  const isOverDark = isOverDarkRoute && !isScrolled;

  const primaryNav = [
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

  // Liens rapides dans la sidebar verticale (style lamangue)
  const sidebarLinks = [
    { to: "/contact", label: "Nous écrire" },
    { to: "/partenaires", label: "Nos partenaires" },
    { to: "/services", label: "Tarifs" },
    { to: "/a-propos", label: "À propos" },
  ];

  const isActive = (to: string) => {
    if (to === "/") return location === "/";
    return location === to || location.startsWith(to + "/");
  };

  return (
    <>
      {/* Top Header — minimal, logo centered, hamburger top-left */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled || mobileMenuOpen
            ? "bg-wine-deep/95 backdrop-blur-md py-4"
            : isOverDark
            ? "bg-transparent py-6"
            : "bg-cream/95 backdrop-blur-sm py-5"
        }`}
      >
        <div className="px-5 md:px-10 flex items-center justify-between">
          {/* Hamburger top-left */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex items-center gap-3 group transition-colors ${
              isOverDark || isScrolled || mobileMenuOpen ? "text-cream" : "text-wine-deep"
            }`}
            aria-label="Toggle menu"
            data-testid="button-mobile-menu"
          >
            <div className="flex flex-col items-end gap-1.5">
              <span className="block h-px w-7 bg-current transition-all" />
              <span className="block h-px w-5 bg-current transition-all" />
            </div>
            <span className="text-[11px] uppercase tracking-[0.25em] font-medium hidden sm:inline">
              {mobileMenuOpen ? "Fermer" : "Menu"}
            </span>
          </button>

          {/* Logo center */}
          <Link to="/" className="flex items-center" aria-label="Mariage Afro">
            <img
              src={logoColor}
              alt="Mariage Afro"
              className={`h-10 md:h-12 w-auto transition-all duration-500 ${
                isOverDark && !isScrolled && !mobileMenuOpen ? "brightness-0 invert" : ""
              }`}
            />
          </Link>

          {/* Right: language + client area */}
          <div className="flex items-center gap-4 md:gap-6">
            <div
              className={`hidden sm:flex items-center gap-1.5 text-[10px] font-medium tracking-[0.2em] transition-colors ${
                isOverDark || isScrolled || mobileMenuOpen ? "text-cream/80" : "text-wine-deep/70"
              }`}
            >
              <button
                onClick={() => changeLanguage("fr")}
                className={`hover:text-gold transition-colors ${i18n.language === "fr" ? "text-gold" : ""}`}
              >
                FR
              </button>
              <span className="opacity-50">·</span>
              <button
                onClick={() => changeLanguage("nl")}
                className={`hover:text-gold transition-colors ${i18n.language === "nl" ? "text-gold" : ""}`}
              >
                NL
              </button>
              <span className="opacity-50">·</span>
              <button
                onClick={() => changeLanguage("en")}
                className={`hover:text-gold transition-colors ${i18n.language === "en" ? "text-gold" : ""}`}
              >
                EN
              </button>
            </div>

            <Link
              to="/espace-client/login"
              className={`hidden md:flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-medium transition-colors ${
                isOverDark || isScrolled || mobileMenuOpen
                  ? "text-cream/90 hover:text-gold"
                  : "text-wine-deep hover:text-primary"
              }`}
              aria-label={t("nav.client_area")}
            >
              <User className="w-3.5 h-3.5" />
              <span>{t("nav.client_area")}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Vertical sidebar — visible on lg+, lamangue style */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 bottom-0 w-16 z-40 flex-col items-center justify-between py-32 pointer-events-none transition-opacity duration-500 ${
          mobileMenuOpen ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex flex-col items-center gap-12 pointer-events-auto">
          {sidebarLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`vertical-text-up transition-colors hover:text-gold ${
                isOverDark ? "text-cream/70" : "text-wine-deep/70"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </aside>

      {/* Fullscreen Menu Overlay (style lamangue : grandes typo serif majuscule) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-wine-deep flex flex-col"
          >
            <div className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-32 pt-24 pb-12 overflow-y-auto">
              <nav className="flex flex-col gap-2 md:gap-4">
                {primaryNav.map((link, i) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 + i * 0.04 }}
                  >
                    <Link
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`group flex items-baseline gap-4 font-display uppercase text-3xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1] transition-colors ${
                        isActive(link.to) ? "text-gold" : "text-cream hover:text-gold"
                      }`}
                      data-testid={`link-mobile-${link.to.replace(/\//g, "") || "home"}`}
                    >
                      <span className="text-xs md:text-sm tracking-[0.3em] text-gold/60 font-sans font-medium opacity-70 group-hover:opacity-100 transition-opacity">
                        0{i + 1}
                      </span>
                      <span>{link.label}</span>
                    </Link>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.55 }}
                  className="mt-4 pt-6 border-t border-cream/15 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-12"
                >
                  <Link
                    to="/espace-client/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-cream/80 hover:text-gold transition-colors text-sm uppercase tracking-[0.2em] font-medium"
                  >
                    <User className="w-4 h-4" />
                    {t("nav.client_area")}
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-gold hover:text-gold-light text-sm uppercase tracking-[0.2em] font-medium group"
                  >
                    <span>{t("nav.cta")}</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </motion.div>
              </nav>
            </div>

            {/* Footer overlay */}
            <div className="px-6 md:px-16 lg:px-32 pb-8 flex items-center justify-between text-cream/50 text-[10px] tracking-[0.25em] uppercase">
              <span>Mariage Afro · Belgique</span>
              <div className="flex items-center gap-3">
                <button onClick={() => changeLanguage("fr")} className={i18n.language === "fr" ? "text-gold" : "hover:text-gold"}>FR</button>
                <span className="opacity-50">·</span>
                <button onClick={() => changeLanguage("nl")} className={i18n.language === "nl" ? "text-gold" : "hover:text-gold"}>NL</button>
                <span className="opacity-50">·</span>
                <button onClick={() => changeLanguage("en")} className={i18n.language === "en" ? "text-gold" : "hover:text-gold"}>EN</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
