import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X, User, ArrowUpRight, Briefcase } from "lucide-react";
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
  const DARK_HERO_ROUTES = ["/", "/realisations", "/lieux", "/partenaires", "/services", "/plateforme", "/contact", "/shop"];
  const isOverDarkRoute = DARK_HERO_ROUTES.includes(location);
  const isOverDark = isOverDarkRoute && !isScrolled;

  // Menu catégorisé en 3 colonnes pour tout afficher sans scroll.
  // Hiérarchie pensée pour qu'un visiteur comprenne immédiatement où aller.
  const menuColumns = [
    {
      eyebrow: t("header.eyebrow_couples"),
      audience: "b2c" as const,
      links: [
        { to: "/plateforme", label: t("nav.platform") },
        { to: "/services", label: t("nav.services") },
        { to: "/outils/budget", label: t("nav.tool_budget") },
        { to: "/outils/quiz", label: t("nav.tool_quiz") },
        { to: "/shop", label: t("nav.shop") },
      ],
    },
    {
      eyebrow: t("header.eyebrow_inspiration"),
      audience: "discover" as const,
      links: [
        { to: "/partenaires", label: t("nav.partners") },
        { to: "/lieux", label: t("nav.venues") },
        { to: "/realisations", label: t("nav.realisations") },
      ],
    },
    {
      eyebrow: t("header.eyebrow_house"),
      audience: "brand" as const,
      links: [
        { to: "/", label: t("nav.home") },
        { to: "/a-propos", label: t("nav.about") },
        { to: "/contact", label: t("nav.contact") },
      ],
    },
  ];

  const sidebarLinks = [
    { to: "/contact", label: t("nav.write_us") },
    { to: "/partenaires", label: t("nav.partners") },
    { to: "/services", label: t("nav.pricing") },
    { to: "/a-propos", label: t("nav.about") },
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
            aria-label={t("header.toggle_menu")}
            data-testid="button-mobile-menu"
          >
            <div className="flex flex-col items-end gap-1.5">
              <span className="block h-px w-7 bg-current transition-all" />
              <span className="block h-px w-5 bg-current transition-all" />
            </div>
            <span className="text-[11px] uppercase tracking-[0.25em] font-medium hidden sm:inline">
              {mobileMenuOpen ? t("header.menu_close") : t("header.menu_open")}
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
                  : "text-wine-deep hover:text-gold"
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
            {/* Bandeau B2B/B2C en haut du menu pour orienter immédiatement */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="pt-24 pb-6 md:pb-8 px-6 md:px-16 lg:px-32 border-b border-cream/10"
            >
              <p className="text-[10px] tracking-[0.3em] uppercase text-gold/70 mb-3">{t("header.you_are")}</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <Link
                  to="/services"
                  onClick={() => setMobileMenuOpen(false)}
                  className="group inline-flex items-center gap-3 text-cream hover:text-gold transition-colors"
                  data-testid="link-menu-b2c"
                >
                  <span className="font-display uppercase text-xl md:text-2xl tracking-tight">
                    {t("header.b2c_link")}
                  </span>
                  <ArrowUpRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>
                <span className="hidden sm:block text-cream/30">·</span>
                <Link
                  to="/espace-pro/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="group inline-flex items-center gap-3 text-cream/80 hover:text-gold transition-colors"
                  data-testid="link-menu-b2b"
                >
                  <Briefcase className="w-4 h-4" />
                  <span className="font-display uppercase text-xl md:text-2xl tracking-tight">
                    {t("header.b2b_link")}
                  </span>
                  <ArrowUpRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>
              </div>
            </motion.div>

            {/* Menu en 3 colonnes catégorisées : tout visible, jamais de scroll */}
            <div className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-32 py-8 md:py-12">
              <nav className="grid grid-cols-1 md:grid-cols-3 gap-x-10 lg:gap-x-16 gap-y-10 md:gap-y-0">
                {menuColumns.map((col, ci) => (
                  <motion.div
                    key={col.eyebrow}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + ci * 0.08 }}
                    className="flex flex-col"
                  >
                    <p className="text-[10px] tracking-[0.3em] uppercase text-gold/70 mb-5 md:mb-7">
                      {col.eyebrow}
                    </p>
                    <ul className="flex flex-col gap-2 md:gap-3">
                      {col.links.map((link) => (
                        <li key={link.to}>
                          <Link
                            to={link.to}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`font-display uppercase text-2xl md:text-3xl lg:text-[2.25rem] tracking-tight leading-tight transition-colors ${
                              isActive(link.to) ? "text-gold" : "text-cream hover:text-gold"
                            }`}
                            data-testid={`link-mobile-${link.to.replace(/\//g, "") || "home"}`}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </nav>
            </div>

            {/* Footer overlay : CTA secondaires + langues */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="px-6 md:px-16 lg:px-32 py-6 md:py-7 border-t border-cream/10 flex flex-col md:flex-row items-start md:items-center md:justify-between gap-5"
            >
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <Link
                  to="/espace-client/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-cream/80 hover:text-gold transition-colors text-[11px] uppercase tracking-[0.25em] font-medium"
                >
                  <User className="w-3.5 h-3.5" />
                  {t("nav.client_area")}
                </Link>
                <Link
                  to="/espace-pro/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-cream/80 hover:text-gold transition-colors text-[11px] uppercase tracking-[0.25em] font-medium"
                  data-testid="link-mobile-espace-pro"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  {t("header.pro_space")}
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-gold hover:text-gold-light text-[11px] uppercase tracking-[0.25em] font-medium group"
                >
                  <span>{t("nav.cta")}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
              <div className="flex items-center gap-3 text-cream/50 text-[10px] tracking-[0.25em] uppercase">
                <button onClick={() => changeLanguage("fr")} className={i18n.language === "fr" ? "text-gold" : "hover:text-gold"}>FR</button>
                <span className="opacity-50">·</span>
                <button onClick={() => changeLanguage("nl")} className={i18n.language === "nl" ? "text-gold" : "hover:text-gold"}>NL</button>
                <span className="opacity-50">·</span>
                <button onClick={() => changeLanguage("en")} className={i18n.language === "en" ? "text-gold" : "hover:text-gold"}>EN</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
