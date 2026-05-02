import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Sparkles, Crown, CheckCircle2, Loader2 } from "lucide-react";
import { vendorApi } from "@/lib/vendorApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

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

const TIERS: Tier[] = ["basic", "premium", "featured"];

const ICONS: Record<Tier, typeof Briefcase> = {
  basic: Briefcase,
  premium: Sparkles,
  featured: Crown,
};

export default function VendorAbonnementPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");

  const { data: sub, isLoading } = useQuery<SubscriptionResp | null>({
    queryKey: ["vendor", "subscription"],
    queryFn: () => vendorApi.get<SubscriptionResp | null>("/api/vendor/subscription"),
  });

  const choose = useMutation({
    mutationFn: (tier: Tier) =>
      vendorApi.post<SubscriptionResp>("/api/vendor/subscription", { tier, notes: notes || null }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["vendor", "subscription"] });
      qc.invalidateQueries({ queryKey: ["vendor", "onboarding-checklist"] });
      setNotes("");
      toast({
        title: row.status === "requested"
          ? t("vendor.subscription.toast_requested")
          : t("vendor.subscription.toast_activated"),
      });
    },
    onError: () => toast({ title: t("vendor.leads.error"), variant: "destructive" }),
  });

  const currentTier = sub?.tier;
  const currentStatus = sub?.status;

  return (
    <div className="space-y-8 max-w-5xl">
      <header>
        <h1 className="font-display text-2xl md:text-3xl text-wine-deep">{t("vendor.subscription.title")}</h1>
        <p className="text-sm text-neutral-600 mt-1">{t("vendor.subscription.subtitle")}</p>
      </header>

      {sub && (
        <div
          className="bg-cream border border-gold/40 px-5 py-4 flex flex-wrap items-center gap-3"
          data-testid="banner-current-subscription"
        >
          <CheckCircle2 className="w-5 h-5 text-gold" />
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest text-neutral-600">{t("vendor.subscription.your_plan")}</div>
            <div className="text-base font-medium text-wine-deep">
              {t(`vendor.subscription.tiers.${sub.tier}.label`)}
              {" · "}
              <span className="text-sm text-neutral-700">{t(`vendor.subscription.status.${sub.status}`)}</span>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-neutral-500"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : (
        <section className="grid md:grid-cols-3 gap-5">
          {TIERS.map((tier) => {
            const Icon = ICONS[tier];
            const isCurrent = currentTier === tier;
            const isFeatured = tier === "featured";
            return (
              <div
                key={tier}
                className={`bg-white border p-6 flex flex-col ${
                  isFeatured ? "border-gold border-2" : "border-neutral-200"
                }`}
                data-testid={`card-tier-${tier}`}
              >
                {isFeatured && (
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2">{t("vendor.subscription.recommended")}</p>
                )}
                <div className="flex items-center gap-2 text-wine-deep mb-2">
                  <Icon className="w-5 h-5" />
                  <h3 className="font-display text-xl">{t(`vendor.subscription.tiers.${tier}.label`)}</h3>
                </div>
                <p className="text-sm text-neutral-600 mb-4">{t(`vendor.subscription.tiers.${tier}.tagline`)}</p>
                <ul className="text-sm space-y-2 mb-6 flex-1">
                  {(t(`vendor.subscription.tiers.${tier}.features`, { returnObjects: true }) as string[]).map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  onClick={() => choose.mutate(tier)}
                  disabled={isCurrent && currentStatus === "active" || (choose.isPending && choose.variables === tier)}
                  className={`w-full rounded-none uppercase tracking-wider text-xs ${
                    isCurrent
                      ? "bg-emerald-700 text-cream hover:bg-emerald-700"
                      : "bg-wine-deep text-cream hover:bg-wine-deep/90"
                  }`}
                  data-testid={`button-choose-${tier}`}
                >
                  {choose.isPending && choose.variables === tier ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrent ? (
                    currentStatus === "requested"
                      ? t("vendor.subscription.requested_state")
                      : t("vendor.subscription.current_plan")
                  ) : tier === "basic" ? (
                    t("vendor.subscription.activate")
                  ) : (
                    t("vendor.subscription.request")
                  )}
                </Button>
              </div>
            );
          })}
        </section>
      )}

      <section className="bg-white border border-neutral-200 p-6 max-w-2xl">
        <h2 className="font-display text-lg text-wine-deep">{t("vendor.subscription.notes_title")}</h2>
        <p className="text-sm text-neutral-600 mt-1 mb-3">{t("vendor.subscription.notes_help")}</p>
        <Textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("vendor.subscription.notes_placeholder")}
          className="rounded-none"
          data-testid="textarea-subscription-notes"
        />
        <p className="text-[10px] uppercase tracking-widest text-neutral-400 mt-2">
          {t("vendor.subscription.notes_attach")}
        </p>
      </section>
    </div>
  );
}
