import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background pt-28">
      <div className="text-center px-6">
        <span className="text-7xl font-bold text-primary/20 font-serif">{t("not_found.code")}</span>
        <h1 className="text-3xl font-bold font-serif text-foreground mt-4 mb-4">{t("not_found.title")}</h1>
        <p className="text-muted-foreground mb-8">{t("not_found.desc")}</p>
        <Link to="/" className="inline-block bg-primary text-white px-8 py-3 uppercase tracking-wider text-sm font-bold hover:bg-primary/90 transition-colors">
          {t("not_found.back_home")}
        </Link>
      </div>
    </div>
  );
}
