import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, ArrowUpRight, Briefcase, CalendarCheck2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logoColor from "@assets/logo-mariage-affro-01.svg";

export default function Header() {
  const { t, i18n } = useTranslation();
  const { pathname: location } = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenSection(null);
  }, [location]);

  useEffect(() => {
    if (!mobileMenuOpen) setOpenSection(null);
  }, [mobileMenuOpen]);

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

  const DARK_HERO_ROUTES = ["/", "/realisations", "/lieux", "/partenaires", "/services", "/plateforme", "/contact", "/shop"];
  const isOverDarkRoute = DARK_HERO_ROUTES.includes(location);
  const isOverDark = isOverDarkRoute && !isScrolled;

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

  const goldHover =
    isOverDark || isScrolled || mobileMenuOpen ? "hover:text-gold" : "hover:text-gold-deep";

  const isLight = !isOverDark && !isScrolled && !mobileMenuOpen;

  return (
    <>
      {/* Top Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled || mobileMenuOpen
            ? "bg-wine-deep/95 backdrop-blur-md py-4"
            : isOverDark
            ? "bg-transparent py-6"
            : "bg-cream/95 backdrop-blur-sm py-5"
        }`}
      >
        {/*
          3-section flex: left=flex-none, center=flex-1 justify-center, right=flex-none.
          Logo is centered in the available middle space — no absolute positioning needed,
          no z-index collisions with right-side controls.
        */}
        <div className="px-5 md:px-10 flex items-center gap-4 md:gap-6">

          {/* Left: hamburger — flex-1 so it balances the right side */}
          <div className="flex-1 flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`flex items-center gap-3 group transition-colors ${
                isLight ? "text-wine-deep" : "text-cream"
              }`}
              aria-label={t("header.toggle_menu")}
              data-testid="button-mobile-menu"
            >
              <div className="flex flex-col items-end gap-1.5">
                <span className="block h-px w-7 bg-current transition-all" />
                <span className="block h-px w-5 bg-current transition-all" />
              </div>
              <span className="text-xs uppercase tracking-[0.25em] font-semibold hidden sm:inline">
                {mobileMenuOpen ? t("header.menu_close") : t("header.menu_open")}
              </span>
            </button>
          </div>

          {/* Center: Logo — flex-none, truly centered between two flex-1 sides */}
          <div className="flex-none flex justify-center">
            <Link to="/" className="flex items-center" aria-label="Mariage Afro">
              <img
                src={logoColor}
                alt="Mariage Afro"
                width={180}
                height={48}
                fetchPriority="high"
                className={`h-8 sm:h-9 md:h-9 lg:h-10 xl:h-12 w-auto transition-all duration-500 ${
                  isScrolled || mobileMenuOpen || isOverDark ? "brightness-0 invert" : ""
                }`}
              />
            </Link>
          </div>

          {/* Right: language switcher (always visible) + CTA + client area (md+) — flex-1 justify-end */}
          <div className="flex-1 flex items-center justify-end gap-2 md:gap-4">
            {/* Language switcher — visible on all screen sizes */}
            <div
              className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-medium tracking-[0.15em] sm:tracking-[0.2em] transition-colors ${
                isLight ? "text-wine-deep" : "text-cream/90"
              }`}
            >
              <button
                onClick={() => changeLanguage("fr")}
                aria-label="Français"
                aria-current={i18n.language === "fr" ? "true" : undefined}
                className={`${goldHover} transition-colors px-0.5 ${
                  i18n.language === "fr"
                    ? `underline underline-offset-4 font-semibold ${isLight ? "text-gold-deep" : "text-gold"}`
                    : ""
                }`}
              >
                FR
              </button>
              <span className="opacity-40" aria-hidden="true">·</span>
              <button
                onClick={() => changeLanguage("nl")}
                aria-label="Nederlands"
                aria-current={i18n.language === "nl" ? "true" : undefined}
                className={`${goldHover} transition-colors px-0.5 ${
                  i18n.language === "nl"
                    ? `underline underline-offset-4 font-semibold ${isLight ? "text-gold-deep" : "text-gold"}`
                    : ""
                }`}
              >
                NL
              </button>
              <span className="opacity-40" aria-hidden="true">·</span>
              <button
                onClick={() => changeLanguage("en")}
                aria-label="English"
                aria-current={i18n.language === "en" ? "true" : undefined}
                className={`${goldHover} transition-colors px-0.5 ${
                  i18n.language === "en"
                    ? `underline underline-offset-4 font-semibold ${isLight ? "text-gold-deep" : "text-gold"}`
                    : ""
                }`}
              >
                EN
              </button>
            </div>

            {/* PRENDRE RDV — icon only on md, full label on lg+ */}
            <Link
              to="/contact#contact-form"
              className="hidden md:inline-flex items-center gap-2 px-3 lg:px-4 py-2 text-[11px] uppercase tracking-[0.2em] font-semibold border transition-colors bg-bordeaux text-cream border-bordeaux hover:bg-bordeaux-light hover:border-bordeaux-light"
              aria-label={t("header.cta_rdv")}
              data-testid="link-header-rdv"
            >
              <CalendarCheck2 className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              <span className="hidden lg:inline">{t("header.cta_rdv")}</span>
            </Link>

            {/* ESPACE CLIENT — icon only on md, full label on lg+ */}
            <Link
              to="/espace-client/login"
              className={`hidden md:flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium transition-colors ${goldHover} hover:underline underline-offset-4 ${
                isLight ? "text-wine-deep" : "text-cream"
              }`}
              aria-label={t("nav.client_area")}
            >
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden lg:inline">{t("nav.client_area")}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Vertical sidebar — visible on lg+ */}
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
              className={`vertical-text-up transition-colors ${
                isOverDark ? "text-cream/70 hover:text-gold" : "text-wine-deep/70 hover:text-gold-deep"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </aside>

      {/* Fullscreen Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 z-[45] bg-wine-deep flex flex-col overflow-hidden"
          >
            {/* Bandeau B2B/B2C */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="pt-16 sm:pt-20 md:pt-24 pb-3 md:pb-5 px-6 md:px-16 lg:px-32 border-b border-cream/10 flex-shrink-0"
            >
              <p className="text-[10px] tracking-[0.3em] uppercase text-gold mb-2 font-semibold">{t("header.you_are")}</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-6">
                <Link
                  to="/services"
                  onClick={() => setMobileMenuOpen(false)}
                  className="group inline-flex items-center gap-2 text-cream hover:text-gold transition-colors"
                  data-testid="link-menu-b2c"
                >
                  <span className="font-display uppercase text-base sm:text-lg md:text-xl tracking-tight">
                    {t("header.b2c_link")}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>
                <span className="hidden sm:block text-cream/30">·</span>
                <Link
                  to="/espace-pro/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="group inline-flex items-center gap-2 text-cream/80 hover:text-gold transition-colors"
                  data-testid="link-menu-b2b"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="font-display uppercase text-base sm:text-lg md:text-xl tracking-tight">
                    {t("header.b2b_link")}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>
              </div>
            </motion.div>

            {/* CTA RDV */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="px-6 md:px-16 lg:px-32 pt-3 pb-3 md:pt-5 md:pb-4 border-b border-cream/10 flex-shrink-0"
            >
              <Link
                to="/contact#contact-form"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 md:py-4 bg-bordeaux text-cream border border-bordeaux hover:bg-bordeaux-light hover:border-bordeaux-light transition-colors text-sm uppercase tracking-[0.25em] font-semibold"
                aria-label={t("header.cta_rdv")}
                data-testid="link-mobile-rdv"
              >
                <CalendarCheck2 className="w-4 h-4" aria-hidden="true" />
                <span>{t("header.cta_rdv")}</span>
              </Link>
            </motion.div>

            {/* Menu links — 3 columns on md+, accordion on mobile */}
            <div className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-32 py-2 md:py-8 min-h-0 overflow-y-auto">
              <nav className="grid grid-cols-1 md:grid-cols-3 gap-x-10 lg:gap-x-16 md:gap-y-0">
                {menuColumns.map((col, ci) => (
                  <motion.div
                    key={col.eyebrow}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + ci * 0.08 }}
                    className="flex flex-col border-b border-cream/10 md:border-none"
                  >
                    {/* Mobile: tappable header; Desktop: static label */}
                    <button
                      className="md:pointer-events-none flex items-center justify-between w-full py-3 md:py-0 md:mb-5 text-left group"
                      onClick={() => setOpenSection(openSection === ci ? null : ci)}
                      aria-expanded={openSection === ci}
                    >
                      <span className="text-[9px] tracking-[0.3em] uppercase text-gold/70 font-semibold">
                        {col.eyebrow}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-gold/50 transition-transform duration-300 md:hidden ${
                          openSection === ci ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {/* Links: always visible on md+, collapsed on mobile */}
                    <AnimatePresence initial={false}>
                      {(openSection === ci) && (
                        <motion.ul
                          key="links"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: "easeInOut" }}
                          className="flex flex-col gap-1 overflow-hidden md:!h-auto md:!opacity-100 md:gap-2 pb-3 md:pb-0"
                        >
                          {col.links.map((link) => (
                            <li key={link.to}>
                              <Link
                                to={link.to}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`font-display uppercase text-xl md:text-lg lg:text-2xl xl:text-[1.85rem] tracking-tight leading-snug transition-colors block ${
                                  isActive(link.to) ? "text-gold" : "text-cream hover:text-gold"
                                }`}
                                data-testid={`link-mobile-${link.to.replace(/\//g, "") || "home"}`}
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>

                    {/* Desktop: links always shown (no AnimatePresence) */}
                    <ul className="hidden md:flex flex-col gap-2">
                      {col.links.map((link) => (
                        <li key={link.to}>
                          <Link
                            to={link.to}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`font-display uppercase text-lg lg:text-2xl xl:text-[1.85rem] tracking-tight leading-snug transition-colors block ${
                              isActive(link.to) ? "text-gold" : "text-cream hover:text-gold"
                            }`}
                            data-testid={`link-desktop-${link.to.replace(/\//g, "") || "home"}`}
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

            {/* Footer overlay: secondary links + language switcher */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="flex-shrink-0 px-6 md:px-16 lg:px-32 py-4 md:py-5 border-t border-cream/10 flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3"
            >
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
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
              <div className="flex items-center gap-3 text-cream/60 text-[10px] tracking-[0.25em] uppercase">
                <button
                  onClick={() => changeLanguage("fr")}
                  className={`transition-colors ${i18n.language === "fr" ? "text-gold font-semibold" : "hover:text-gold"}`}
                >FR</button>
                <span className="opacity-40">·</span>
                <button
                  onClick={() => changeLanguage("nl")}
                  className={`transition-colors ${i18n.language === "nl" ? "text-gold font-semibold" : "hover:text-gold"}`}
                >NL</button>
                <span className="opacity-40">·</span>
                <button
                  onClick={() => changeLanguage("en")}
                  className={`transition-colors ${i18n.language === "en" ? "text-gold font-semibold" : "hover:text-gold"}`}
                >EN</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
