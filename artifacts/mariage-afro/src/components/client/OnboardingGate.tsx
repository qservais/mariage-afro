import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { useTranslation } from "react-i18next";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart } from "lucide-react";

interface CoupleLike {
  partner1Name?: string;
  partner2Name?: string;
  weddingDate?: string | null;
  onboardedAt?: string | null;
}

interface Props {
  couple: CoupleLike | undefined;
  children: React.ReactNode;
}

export default function OnboardingGate({ couple, children }: Props) {
  const { t } = useTranslation();
  const { user } = useUser();
  const qc = useQueryClient();

  const needsOnboarding = couple !== undefined && !couple.onboardedAt;

  const [partner1Name, setP1] = useState("");
  const [partner2Name, setP2] = useState("");
  const [weddingDate, setDate] = useState("");

  useEffect(() => {
    if (!couple) return;
    setP1(couple.partner1Name || user?.firstName || "");
    setP2(couple.partner2Name || "");
    setDate(couple.weddingDate ? couple.weddingDate.slice(0, 10) : "");
  }, [couple, user]);

  const save = useMutation({
    mutationFn: (b: {
      partner1Name: string;
      partner2Name: string;
      weddingDate: string | null;
      onboarded: true;
    }) => clientApi.patch("/api/client/me", b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "me"] }),
  });

  if (!needsOnboarding) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
      <form
        className="bg-white max-w-lg w-full p-8 border border-neutral-200 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!partner1Name || !weddingDate) return;
          save.mutate({
            partner1Name,
            partner2Name,
            weddingDate,
            onboarded: true,
          });
        }}
      >
        <div className="flex items-center gap-2 text-primary font-bold tracking-widest text-sm uppercase">
          <Heart className="w-4 h-4 fill-primary" />
          Mariage Afro
        </div>
        <div>
          <h2 className="font-bold text-2xl">{t("onboarding.title")}</h2>
          <p className="text-sm text-neutral-600 mt-1">
            {t("onboarding.subtitle")}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">
              {t("onboarding.your_name")} <span className="text-primary">*</span>
            </label>
            <Input
              value={partner1Name}
              onChange={(e) => setP1(e.target.value)}
              placeholder={t("onboarding.name_placeholder")}
              required
              data-testid="input-onboarding-partner1"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">
              {t("onboarding.partner_name")}
            </label>
            <Input
              value={partner2Name}
              onChange={(e) => setP2(e.target.value)}
              placeholder={t("onboarding.name_placeholder")}
              data-testid="input-onboarding-partner2"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">
              {t("onboarding.wedding_date")} <span className="text-primary">*</span>
            </label>
            <Input
              type="date"
              value={weddingDate}
              onChange={(e) => setDate(e.target.value)}
              required
              data-testid="input-onboarding-date"
            />
            <p className="text-xs text-neutral-500 mt-1">
              {t("onboarding.date_help")}
            </p>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full rounded-none uppercase tracking-wider text-xs"
          disabled={save.isPending}
          data-testid="button-onboarding-submit"
        >
          {save.isPending ? t("onboarding.saving") : t("onboarding.submit")}
        </Button>
      </form>
    </div>
  );
}
