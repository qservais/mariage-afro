import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Briefcase, Image as ImageIcon, ListChecks, Settings, ExternalLink } from "lucide-react";
import { useVendorMe } from "@/components/vendor/VendorLayout";

export default function VendorDashboard() {
  const { t } = useTranslation();
  const { data } = useVendorMe();
  const account = data?.account;
  const vendor = data?.vendor;

  const tiles = [
    { to: "/espace-pro/profile", label: t("vendor.nav.profile"), icon: Briefcase, color: "bg-cream" },
    { to: "/espace-pro/gallery", label: t("vendor.nav.gallery"), icon: ImageIcon, color: "bg-amber-50" },
    { to: "/espace-pro/services", label: t("vendor.nav.services"), icon: ListChecks, color: "bg-rose-50" },
    { to: "/espace-pro/settings", label: t("vendor.nav.settings"), icon: Settings, color: "bg-stone-50" },
  ];

  const isPublished = vendor?.verified && vendor?.active;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Status card */}
      <section className="bg-white p-6 border border-neutral-200">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500">{t("vendor.dashboard.profile_status")}</p>
            <p className="text-lg font-medium mt-1 text-wine-deep">{vendor?.name || account?.businessName || "—"}</p>
            <p className="text-sm text-neutral-600 mt-2">
              {isPublished
                ? t("vendor.dashboard.status_published_desc")
                : t("vendor.dashboard.status_pending_desc")}
            </p>
          </div>
          {isPublished && vendor && (
            <Link
              to={`/partenaires`}
              className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold hover:text-wine-deep"
              data-testid="link-public-marketplace"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t("vendor.dashboard.view_public")}
            </Link>
          )}
        </div>
      </section>

      {/* Stats placeholder */}
      <section className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 border border-neutral-200">
          <p className="text-xs uppercase tracking-widest text-neutral-500">{t("vendor.dashboard.stat_views")}</p>
          <p className="text-3xl font-bold text-wine-deep mt-2">—</p>
          <p className="text-xs text-neutral-500 mt-1">{t("vendor.dashboard.stat_soon")}</p>
        </div>
        <div className="bg-white p-6 border border-neutral-200">
          <p className="text-xs uppercase tracking-widest text-neutral-500">{t("vendor.dashboard.stat_leads")}</p>
          <p className="text-3xl font-bold text-wine-deep mt-2">—</p>
          <p className="text-xs text-neutral-500 mt-1">{t("vendor.dashboard.stat_soon")}</p>
        </div>
        <div className="bg-white p-6 border border-neutral-200">
          <p className="text-xs uppercase tracking-widest text-neutral-500">{t("vendor.dashboard.stat_messages")}</p>
          <p className="text-3xl font-bold text-wine-deep mt-2">—</p>
          <p className="text-xs text-neutral-500 mt-1">{t("vendor.dashboard.stat_soon")}</p>
        </div>
      </section>

      {/* Tiles */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.to}
              to={tile.to}
              className="bg-white p-6 border border-neutral-200 hover:border-gold transition-colors group"
              data-testid={`tile-vendor-${tile.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <div className={`w-12 h-12 ${tile.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-wine-deep" />
              </div>
              <p className="font-bold text-lg group-hover:text-wine-deep">{tile.label}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
