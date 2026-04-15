import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { t, i18n } = useTranslation();
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/services", label: t("nav.services") },
    { href: "/prestations", label: t("nav.prestations") },
    { href: "/realisations", label: t("nav.realisations") },
    { href: "/a-propos", label: t("nav.about") },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || mobileMenuOpen ? "bg-white shadow-sm py-4" : "bg-white/90 backdrop-blur-sm py-6"
      }`}
    >
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex flex-col">
          <span className="text-xl md:text-2xl font-bold tracking-wider text-primary leading-none">
            MARIAGE AFRO
          </span>
          <span className="text-[10px] md:text-xs text-muted-foreground tracking-widest uppercase mt-1">
            Afro & Mixed Wedding Platform
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-8">
          <nav className="flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium tracking-wide transition-colors hover:text-primary ${
                  location === link.href ? "text-primary" : "text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-2 text-xs font-bold text-muted-foreground tracking-widest">
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

          <Link href="/contact">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase tracking-wider text-xs px-6 py-5"
              data-testid="button-nav-cta"
            >
              {t("nav.cta")}
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-0 top-[72px] md:hidden bg-background z-40 flex flex-col px-6 py-8"
          >
            <nav className="flex flex-col space-y-6 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-2xl font-bold tracking-wider ${
                    location === link.href ? "text-primary" : "text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-12 flex items-center space-x-4 text-sm font-bold text-muted-foreground tracking-widest">
              <button onClick={() => changeLanguage("fr")} className={i18n.language === "fr" ? "text-primary" : ""}>FR</button>
              <span>·</span>
              <button onClick={() => changeLanguage("nl")} className={i18n.language === "nl" ? "text-primary" : ""}>NL</button>
              <span>·</span>
              <button onClick={() => changeLanguage("en")} className={i18n.language === "en" ? "text-primary" : ""}>EN</button>
            </div>

            <div className="mt-auto pb-12">
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
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