import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logoCreme from "@assets/logo-mariage-affro-02.svg";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#141414] text-white pt-20 pb-8">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="block mb-6">
              <img src={logoCreme} alt="Mariage Afro" className="h-20 w-auto" />
            </Link>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-6">{t("footer.nav_title")}</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><Link to="/" className="hover:text-primary transition-colors">{t("nav.home")}</Link></li>
              <li><Link to="/services" className="hover:text-primary transition-colors">{t("nav.services")}</Link></li>
              <li><Link to="/prestations" className="hover:text-primary transition-colors">{t("nav.prestations")}</Link></li>
              <li><Link to="/realisations" className="hover:text-primary transition-colors">{t("nav.realisations")}</Link></li>
              <li><Link to="/a-propos" className="hover:text-primary transition-colors">{t("nav.about")}</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">{t("nav.contact")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-6">{t("footer.contact_title")}</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li>{t("footer.address")}</li>
              <li><a href={`mailto:${t("footer.email")}`} className="hover:text-primary transition-colors">{t("footer.email")}</a></li>
              <li><a href={`tel:${t("footer.phone")}`} className="hover:text-primary transition-colors">{t("footer.phone")}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-6">{t("footer.social_title")}</h4>
            <div className="flex space-x-4">
              <a href="#" aria-label="Instagram" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-primary hover:border-primary transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" aria-label="Facebook" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-primary hover:border-primary transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" aria-label="TikTok" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-primary hover:border-primary transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} Mariage Afro. {t("footer.rights")}</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="#" className="hover:text-white transition-colors">{t("footer.legal")}</Link>
            <Link to="#" className="hover:text-white transition-colors">{t("footer.privacy")}</Link>
          </div>
          <p className="mt-4 md:mt-0 hover:text-white transition-colors cursor-pointer">{t("footer.made_by")}</p>
        </div>
      </div>
    </footer>
  );
}
