import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase, Image as ImageIcon, ListChecks, Settings, ExternalLink,
  CalendarDays, Eye, Inbox, MessageCircle, Sparkles, Crown,
  CheckCircle2, Circle, ArrowRight, Trophy, BarChart3,
} from "lucide-react";
import { useVendorMe } from "@/components/vendor/VendorLayout";
import { vendorApi } from "@/lib/vendorApi";

interface VendorStats {
  views7: number;
  views30: number;
  views90: number;
  leads30: number;
  leadsByStatus: Record<string, number>;
  conversionRate: number;
  unreadMessages: number;
  ranking: { rank: number; total: number; category: string } | null;
  series: { date: string; views: number }[];
  sources: { source: string; count: number }[];
}

interface ChecklistItem { key: string; done: boolean; count?: number }
interface ChecklistResp { items: ChecklistItem[]; completed: number; total: number; hide?: boolean }

interface SubscriptionResp {
  id: number;
  tier: "basic" | "premium" | "featured";
  status: "requested" | "active" | "cancelled" | "expired";
}

const ITEM_LINKS: Record<string, string> = {
  onboarding: "/espace-pro",
  profile_basics: "/espace-pro/profile",
  description_long: "/espace-pro/profile",
  photos_5: "/espace-pro/gallery",
  services_3: "/espace-pro/services",
  location: "/espace-pro/profile",
  languages: "/espace-pro/profile",
  price: "/espace-pro/profile",
  cultural_styles: "/espace-pro/profile",
  availability: "/espace-pro/agenda",
  tier: "/espace-pro/abonnement",
};

export default function VendorDashboard() {
  const { t } = useTranslation();
  const { data } = useVendorMe();
  const account = data?.account;
  const vendor = data?.vendor;

  const { data: stats } = useQuery<VendorStats>({
    queryKey: ["vendor", "stats"],
    queryFn: () => vendorApi.get<VendorStats>("/api/vendor/stats"),
    refetchInterval: 60_000,
  });
  const { data: checklist } = useQuery<ChecklistResp>({
    queryKey: ["vendor", "onboarding-checklist"],
    queryFn: () => vendorApi.get<ChecklistResp>("/api/vendor/onboarding-checklist"),
  });
  const { data: sub } = useQuery<SubscriptionResp | null>({
    queryKey: ["vendor", "subscription"],
    queryFn: () => vendorApi.get<SubscriptionResp | null>("/api/vendor/subscription"),
  });

  const isPublished = vendor?.verified && vendor?.active;
  const tierLabel = sub?.tier ? t(`vendor.subscription.tiers.${sub.tier}.label`) : t("vendor.subscription.no_plan");
  const TierIcon = sub?.tier === "featured" ? Crown : sub?.tier === "premium" ? Sparkles : Briefcase;

  const tiles = [
    { to: "/espace-pro/profile", label: t("vendor.nav.profile"), icon: Briefcase },
    { to: "/espace-pro/gallery", label: t("vendor.nav.gallery"), icon: ImageIcon },
    { to: "/espace-pro/services", label: t("vendor.nav.services"), icon: ListChecks },
    { to: "/espace-pro/agenda", label: t("vendor.nav.agenda"), icon: CalendarDays },
    { to: "/espace-pro/abonnement", label: t("vendor.nav.subscription"), icon: Crown },
    { to: "/espace-pro/settings", label: t("vendor.nav.settings"), icon: Settings },
  ];

  const checklistPct = checklist && checklist.total > 0
    ? Math.round((checklist.completed / checklist.total) * 100)
    : 0;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Status + plan */}
      <section className="bg-white p-6 border border-neutral-200 grid md:grid-cols-[1fr_auto] gap-6 items-start">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">{t("vendor.dashboard.profile_status")}</p>
          <p className="text-lg font-medium mt-1 text-wine-deep">{vendor?.name || account?.businessName || "—"}</p>
          <p className="text-sm text-neutral-600 mt-2">
            {isPublished ? t("vendor.dashboard.status_published_desc") : t("vendor.dashboard.status_pending_desc")}
          </p>
          {isPublished && vendor && (
            <Link
              to={`/partenaires/${vendor.id}`}
              className="inline-flex mt-3 items-center gap-2 text-xs uppercase tracking-widest text-gold hover:text-wine-deep"
              data-testid="link-public-marketplace"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t("vendor.dashboard.view_public")}
            </Link>
          )}
        </div>
        <Link
          to="/espace-pro/abonnement"
          className="bg-wine-deep text-cream px-5 py-4 hover:bg-wine-deep/90 transition-colors min-w-[16rem]"
          data-testid="card-current-plan"
        >
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold">
            <TierIcon className="w-3.5 h-3.5" /> {t("vendor.subscription.your_plan")}
          </div>
          <div className="text-lg font-display mt-1">{tierLabel}</div>
          <div className="text-xs text-cream/70 mt-2 flex items-center gap-1">
            {t("vendor.subscription.manage")} <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </section>

      {/* Stats */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Eye} label={t("vendor.dashboard.stat_views")} value={stats?.views30 ?? 0} sub={t("vendor.dashboard.stat_last_30d")} testid="stat-views" />
        <StatCard icon={Inbox} label={t("vendor.dashboard.stat_leads")} value={stats?.leads30 ?? 0} sub={t("vendor.dashboard.stat_last_30d")} testid="stat-leads" />
        <StatCard icon={MessageCircle} label={t("vendor.dashboard.stat_messages")} value={stats?.unreadMessages ?? 0} sub={t("vendor.dashboard.stat_unread")} testid="stat-messages" />
        <StatCard icon={Sparkles} label={t("vendor.dashboard.stat_conversion")} value={`${stats?.conversionRate ?? 0}%`} sub={t("vendor.dashboard.stat_last_30d")} testid="stat-conversion" />
      </section>

      {/* 90-day chart + ranking */}
      <section className="grid lg:grid-cols-[1fr_auto] gap-4">
        <ViewsChart series={stats?.series ?? []} totalLabel={t("vendor.dashboard.chart_total")} title={t("vendor.dashboard.chart_title")} />
        <RankingCard
          ranking={stats?.ranking ?? null}
          title={t("vendor.dashboard.ranking_title")}
          empty={t("vendor.dashboard.ranking_none")}
          formatValue={(rank, total) => t("vendor.dashboard.ranking_value", { rank, total })}
        />
      </section>

      {/* Top sources */}
      <section className="bg-white p-6 border border-neutral-200" data-testid="section-sources">
        <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">{t("vendor.dashboard.sources_title")}</p>
        <h2 className="font-display text-lg text-wine-deep mb-4">{t("vendor.dashboard.stat_last_30d")}</h2>
        {(!stats?.sources || stats.sources.length === 0) ? (
          <p className="text-sm text-neutral-500">{t("vendor.dashboard.sources_empty")}</p>
        ) : (
          <ul className="space-y-2">
            {stats.sources.map((s) => {
              const total = stats.sources.reduce((acc, x) => acc + x.count, 0);
              const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
              const label = t(`vendor.dashboard.source_${s.source}`, s.source);
              return (
                <li key={s.source} data-testid={`source-row-${s.source}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-wine-deep font-medium">{label}</span>
                    <span className="text-neutral-600">{s.count} <span className="text-neutral-400">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 mt-1 overflow-hidden">
                    <div className="h-full bg-gold transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Onboarding checklist (hidden when 100%) */}
      {checklist && !checklist.hide && (
        <section className="bg-white p-6 border border-neutral-200" data-testid="section-onboarding-checklist">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-neutral-500">{t("vendor.checklist.title")}</p>
              <h2 className="font-display text-lg text-wine-deep mt-1">{t("vendor.checklist.subtitle")}</h2>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-wine-deep">{checklist.completed}/{checklist.total}</div>
              <div className="text-xs text-neutral-500">{checklistPct}%</div>
            </div>
          </div>
          <div className="h-2 bg-neutral-100 mb-5 overflow-hidden">
            <div className="h-full bg-gold transition-all" style={{ width: `${checklistPct}%` }} />
          </div>
          <ul className="grid sm:grid-cols-2 gap-2">
            {checklist.items.map((item) => (
              <li key={item.key}>
                <Link
                  to={ITEM_LINKS[item.key] ?? "/espace-pro"}
                  className={`flex items-center gap-3 p-3 border transition-colors ${
                    item.done
                      ? "border-emerald-200 bg-emerald-50/50 text-emerald-900"
                      : "border-neutral-200 hover:border-gold text-neutral-800"
                  }`}
                  data-testid={`checklist-item-${item.key}`}
                >
                  {item.done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-neutral-400 shrink-0" />
                  )}
                  <span className="text-sm flex-1">{t(`vendor.checklist.items.${item.key}`)}</span>
                  {item.count !== undefined && (
                    <span className="text-xs text-neutral-500">{item.count}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Quick tiles */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.to}
              to={tile.to}
              className="bg-white p-5 border border-neutral-200 hover:border-gold transition-colors group flex items-center gap-4"
              data-testid={`tile-vendor-${tile.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <div className="w-10 h-10 bg-cream flex items-center justify-center">
                <Icon className="w-5 h-5 text-wine-deep" />
              </div>
              <p className="font-medium text-base group-hover:text-wine-deep flex-1">{tile.label}</p>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-gold" />
            </Link>
          );
        })}
      </section>
    </div>
  );
}

function ViewsChart({ series, title, totalLabel }: { series: { date: string; views: number }[]; title: string; totalLabel: string }) {
  const total = series.reduce((acc, p) => acc + p.views, 0);
  const max = Math.max(1, ...series.map((p) => p.views));
  return (
    <div className="bg-white p-6 border border-neutral-200" data-testid="section-views-chart">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">{title}</p>
          <p className="text-2xl font-bold text-wine-deep mt-1">
            {total} <span className="text-sm font-normal text-neutral-500">{totalLabel}</span>
          </p>
        </div>
        <BarChart3 className="w-5 h-5 text-gold" />
      </div>
      <svg viewBox={`0 0 ${Math.max(1, series.length)} 40`} preserveAspectRatio="none" className="w-full h-24" data-testid="chart-svg" aria-label={title}>
        {series.map((p, i) => {
          const h = (p.views / max) * 38;
          return (
            <rect
              key={p.date}
              x={i + 0.1}
              y={40 - h}
              width={0.8}
              height={Math.max(0.5, h)}
              fill="#c9a96e"
              opacity={0.85}
            >
              <title>{`${p.date}: ${p.views}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
        <span>{series[0]?.date ?? ""}</span>
        <span>{series[series.length - 1]?.date ?? ""}</span>
      </div>
    </div>
  );
}

function RankingCard({
  ranking, title, empty, formatValue,
}: {
  ranking: { rank: number; total: number; category: string } | null;
  title: string;
  empty: string;
  formatValue: (rank: number, total: number) => string;
}) {
  return (
    <div className="bg-wine-deep text-cream p-6 min-w-[16rem]" data-testid="section-ranking">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold">
        <Trophy className="w-3.5 h-3.5" /> {title}
      </div>
      {ranking ? (
        <>
          <p className="text-3xl font-display mt-2" data-testid="ranking-value">{formatValue(ranking.rank, ranking.total)}</p>
          <p className="text-xs text-cream/70 mt-1">{ranking.category}</p>
        </>
      ) : (
        <p className="text-sm text-cream/70 mt-3">{empty}</p>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, sub, testid,
}: {
  icon: typeof Eye; label: string; value: number | string; sub: string; testid: string;
}) {
  return (
    <div className="bg-white p-5 border border-neutral-200" data-testid={testid}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest text-neutral-500">{label}</p>
        <Icon className="w-4 h-4 text-gold" />
      </div>
      <p className="text-3xl font-bold text-wine-deep">{value}</p>
      <p className="text-xs text-neutral-500 mt-1">{sub}</p>
    </div>
  );
}
