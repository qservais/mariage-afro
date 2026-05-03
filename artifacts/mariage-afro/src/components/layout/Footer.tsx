import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logoCreme from "@assets/logo-mariage-affro-02.svg";

export default function Footer() {
  const { t } = useTranslation();
  const phone = t("footer.phone");
  const phoneAvailable = !/X{2,}/.test(phone);

  return (
    <footer className="bg-wine-deep text-cream pt-24 pb-10 relative overflow-hidden">
      {/* Subtle grain texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>\")",
        }}
      />

      <div className="relative z-10 container mx-auto px-6 md:px-12">
        {/* Top large editorial signature */}
        <div className="border-b border-cream/10 pb-16 mb-16 text-center md:text-left">
          <span className="section-eyebrow section-eyebrow-left mb-6 justify-center md:justify-start">
            {t("footer.signature_eyebrow")}
          </span>
          <h3 className="font-display uppercase text-cream text-4xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight max-w-4xl">
            {t("footer.signature")}
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-12 mb-16">
          <div className="col-span-2 md:col-span-2">
            <Link to="/" className="block mb-6">
              <img src={logoCreme} alt="Mariage Afro" width={200} height={64} loading="lazy" decoding="async" className="h-16 w-auto" />
            </Link>
            <p className="text-cream/60 text-sm leading-relaxed max-w-xs font-light">
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-gold mb-6">
              {t("footer.nav_title")}
            </h4>
            <ul className="space-y-3 text-sm text-cream/70 font-light">
              <li><Link to="/" className="hover:text-gold transition-colors">{t("nav.home")}</Link></li>
              <li><Link to="/plateforme" className="hover:text-gold transition-colors">{t("nav.platform")}</Link></li>
              <li><Link to="/services" className="hover:text-gold transition-colors">{t("nav.services")}</Link></li>
              <li><Link to="/partenaires" className="hover:text-gold transition-colors">{t("nav.partners")}</Link></li>
              <li><Link to="/lieux" className="hover:text-gold transition-colors">{t("nav.venues")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-gold mb-6">
              {t("footer.explore_title")}
            </h4>
            <ul className="space-y-3 text-sm text-cream/70 font-light">
              <li><Link to="/realisations" className="hover:text-gold transition-colors">{t("nav.realisations")}</Link></li>
              <li><Link to="/shop" className="hover:text-gold transition-colors">{t("nav.shop")}</Link></li>
              <li><Link to="/a-propos" className="hover:text-gold transition-colors">{t("nav.about")}</Link></li>
              <li><Link to="/contact" className="hover:text-gold transition-colors">{t("nav.contact")}</Link></li>
              <li><Link to="/espace-client" className="hover:text-gold transition-colors">{t("nav.client_area")}</Link></li>
              <li><Link to="/guide" className="hover:text-gold transition-colors">{t("nav.guide")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-gold mb-6">
              {t("footer.contact_title")}
            </h4>
            <ul className="space-y-3 text-sm text-cream/70 mb-8 font-light">
              <li>{t("footer.address")}</li>
              <li><a href={`mailto:${t("footer.email")}`} className="hover:text-gold transition-colors">{t("footer.email")}</a></li>
              {phoneAvailable && (
                <li><a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-gold transition-colors">{phone}</a></li>
              )}
            </ul>
            <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-gold mb-4">
              {t("footer.social_title")}
            </h4>
            <div className="flex space-x-3">
              <span aria-label="Instagram (bientôt disponible)" aria-disabled="true" className="w-10 h-10 border border-cream/10 flex items-center justify-center text-cream/30 cursor-not-allowed">
                <svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </span>
              <span aria-label="Facebook (bientôt disponible)" aria-disabled="true" className="w-10 h-10 border border-cream/10 flex items-center justify-center text-cream/30 cursor-not-allowed">
                <svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </span>
              <span aria-label="TikTok (bientôt disponible)" aria-disabled="true" className="w-10 h-10 border border-cream/10 flex items-center justify-center text-cream/30 cursor-not-allowed">
                <svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
              </span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-cream/10 flex flex-col md:flex-row justify-between items-center text-[11px] text-cream/70 uppercase tracking-[0.2em] gap-4">
          <p>&copy; {new Date().getFullYear()} Mariage Afro. {t("footer.rights")}</p>
          <div className="flex space-x-6">
            <Link to="#" className="hover:text-gold transition-colors">{t("footer.legal")}</Link>
            <Link to="#" className="hover:text-gold transition-colors">{t("footer.privacy")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
