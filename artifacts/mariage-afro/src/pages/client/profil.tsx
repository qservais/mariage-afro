import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/lib/auth";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCouple } from "@/components/client/ClientLayout";

interface CouplePatch {
  partner1Name?: string;
  partner2Name?: string;
  weddingDate?: string | null;
  ceremonyCity?: string | null;
  ceremonyVenue?: string | null;
  guestEstimate?: number | null;
  budget?: number | null;
}

export default function ProfilPage() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { data: couple } = useCouple();
  const qc = useQueryClient();

  const [partner1Name, setP1] = useState("");
  const [partner2Name, setP2] = useState("");
  const [weddingDate, setDate] = useState("");
  const [ceremonyCity, setCity] = useState("");
  const [ceremonyVenue, setVenue] = useState("");
  const [guestEstimate, setGuests] = useState("");
  const [budget, setBudget] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!couple) return;
    setP1(couple.partner1Name || "");
    setP2(couple.partner2Name || "");
    setDate(couple.weddingDate ? couple.weddingDate.slice(0, 10) : "");
    const c = couple as unknown as Record<string, unknown>;
    setCity(typeof c.ceremonyCity === "string" ? c.ceremonyCity : "");
    setVenue(typeof c.ceremonyVenue === "string" ? c.ceremonyVenue : "");
    setGuests(typeof c.guestEstimate === "number" ? String(c.guestEstimate) : "");
    setBudget(typeof c.budget === "number" ? String(c.budget) : "");
  }, [couple]);

  const update = useMutation({
    mutationFn: (b: CouplePatch) => clientApi.patch("/api/client/me", b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", "me"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="font-bold text-2xl">{t("profil.title")}</h2>
        <p className="text-sm text-neutral-600">{t("profil.subtitle")}</p>
      </div>

      <section className="bg-cream p-6 border border-neutral-200">
        <p className="text-xs uppercase tracking-widest text-neutral-500 mb-3">{t("profil.account")}</p>
        <p className="text-sm">
          {t("profil.email_label")} <span className="font-medium">{user?.email || "—"}</span>
        </p>
      </section>

      <form
        className="bg-cream p-6 border border-neutral-200 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate({
            partner1Name,
            partner2Name,
            weddingDate: weddingDate || null,
            ceremonyCity: ceremonyCity || null,
            ceremonyVenue: ceremonyVenue || null,
            guestEstimate: guestEstimate ? Number(guestEstimate) : null,
            budget: budget ? Number(budget) : null,
          });
        }}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("profil.partner1")}</label>
            <Input value={partner1Name} onChange={(e) => setP1(e.target.value)} data-testid="input-partner1" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("profil.partner2")}</label>
            <Input value={partner2Name} onChange={(e) => setP2(e.target.value)} data-testid="input-partner2" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("profil.wedding_date")}</label>
            <Input type="date" value={weddingDate} onChange={(e) => setDate(e.target.value)} data-testid="input-wedding-date" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("profil.city")}</label>
            <Input value={ceremonyCity} onChange={(e) => setCity(e.target.value)} placeholder="Bruxelles" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("profil.venue")}</label>
            <Input value={ceremonyVenue} onChange={(e) => setVenue(e.target.value)} placeholder={t("profil.venue_placeholder")} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("profil.guest_estimate")}</label>
            <Input type="number" min="0" value={guestEstimate} onChange={(e) => setGuests(e.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("profil.budget")}</label>
            <Input type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" className="rounded-none uppercase tracking-wider text-xs" disabled={update.isPending} data-testid="button-save-profile">
            {update.isPending ? t("profil.saving") : t("profil.save")}
          </Button>
          {saved && <p className="text-sm text-gold-deep">{t("profil.saved")}</p>}
        </div>
      </form>
    </div>
  );
}
