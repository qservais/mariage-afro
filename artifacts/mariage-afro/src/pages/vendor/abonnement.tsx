import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Crown, CheckCircle2, Loader2, Mail } from "lucide-react";
import { vendorApi } from "@/lib/vendorApi";

type Tier = "basic" | "premium" | "featured";
type Status = "requested" | "active" | "cancelled" | "expired";

interface SubscriptionResp {
  id: number;
  tier: Tier;
  status: Status;
  notes: string | null;
  startedAt: string | null;
  endsAt: string | null;
  requestedAt: string;
}

export default function VendorAbonnementPage() {
  const { t } = useTranslation();

  const { data: sub, isLoading } = useQuery<SubscriptionResp | null>({
    queryKey: ["vendor", "subscription"],
    queryFn: () => vendorApi.get<SubscriptionResp | null>("/api/vendor/subscription"),
  });

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="font-display text-2xl md:text-3xl text-wine-deep">{t("vendor.subscription.title")}</h1>
        <p className="text-sm text-neutral-600 mt-1">{t("vendor.subscription.subtitle_free")}</p>
      </header>

      {isLoading ? (
        <div className="text-neutral-500"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : (
        <div
          className="bg-cream border-2 border-gold p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6"
          data-testid="banner-current-subscription"
        >
          <div className="w-14 h-14 bg-wine-deep flex items-center justify-center shrink-0">
            <Crown className="w-7 h-7 text-gold" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">{t("vendor.subscription.your_plan")}</p>
            <p className="font-display text-2xl text-wine-deep mt-1">
              {sub ? t(`vendor.subscription.tiers.${sub.tier}.label`) : t("vendor.subscription.tiers.featured.label")}
            </p>
            <p className="text-sm text-neutral-700 mt-1">
              {t(`vendor.subscription.status.${sub?.status ?? "active"}`)}
            </p>
            <ul className="mt-4 space-y-1.5">
              {(t("vendor.subscription.tiers.featured.features", { returnObjects: true }) as string[]).map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 p-5">
        <p className="text-sm font-semibold text-amber-800">{t("vendor.subscription.free_notice_title")}</p>
        <p className="text-sm text-amber-700 mt-1">{t("vendor.subscription.free_notice_desc")}</p>
      </div>

      <div className="bg-cream border border-gold/30 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-10 h-10 bg-wine-deep flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5 text-gold" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-wine-deep">{t("vendor.dashboard.contact_team_title")}</p>
          <p className="text-sm text-neutral-600 mt-0.5">{t("vendor.subscription.contact_team_help")}</p>
        </div>
        <a
          href="mailto:info@mariage-afro.com"
          className="inline-flex items-center gap-2 bg-wine-deep text-cream px-5 py-2.5 text-xs uppercase tracking-widest hover:bg-wine-deep/90 transition-colors shrink-0"
          data-testid="btn-contact-team-subscription"
        >
          <Mail className="w-3.5 h-3.5" />
          {t("vendor.dashboard.contact_team_cta")}
        </a>
      </div>
    </div>
  );
}
