import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Loader2, ChevronRight, ChevronLeft, Calculator, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";

type Standing = "essentiel" | "premium" | "luxe";
type Region = "bruxelles" | "wallonie" | "flandre";
type ServiceKey =
  | "venue"
  | "catering"
  | "decoration"
  | "photo_video"
  | "dj_music"
  | "mc"
  | "live_band"
  | "cocktail_bar"
  | "wedding_planner"
  | "coordination_jour_j"
  | "drinks"
  | "sound_light"
  | "service_staff"
  | "tenue"
  | "flowers";

interface Inputs {
  guestCount: number;
  region: Region;
  standing: Standing;
  services: ServiceKey[];
  weddingMonth: string;
}

interface BreakdownLine {
  key: ServiceKey;
  label: string;
  min: number;
  max: number;
}

const SERVICE_BASE: Record<ServiceKey, { label: string; perGuest?: [number, number]; flat?: [number, number] }> = {
  venue: { label: "Lieu de réception", flat: [3500, 12000] },
  catering: { label: "Traiteur (par invité)", perGuest: [40, 75] },
  decoration: { label: "Décoration & scénographie", flat: [4000, 10000] },
  photo_video: { label: "Photo & vidéo", flat: [4200, 7500] },
  dj_music: { label: "DJ", flat: [800, 2500] },
  mc: { label: "MC / animateur de cérémonie", flat: [750, 1500] },
  live_band: { label: "Live band / groupe musical", flat: [1000, 3000] },
  cocktail_bar: { label: "Cocktail bar & open bar", flat: [2000, 3500] },
  wedding_planner: { label: "Wedding planner", flat: [2500, 7000] },
  coordination_jour_j: { label: "Coordination Jour J", flat: [2000, 3500] },
  drinks: { label: "Boissons (par invité)", perGuest: [30, 40] },
  sound_light: { label: "Sonorisation, lumières & effets spéciaux", flat: [2000, 2000] },
  service_staff: { label: "Service (personnel)", flat: [2000, 4850] },
  tenue: { label: "Tenues mariés (robe, costume, accessoires)", flat: [1500, 6000] },
  flowers: { label: "Fleurs (bouquet, boutonnières, autels)", flat: [600, 3000] },
};

const STANDING_FACTOR: Record<Standing, number> = {
  essentiel: 0.85,
  premium: 1.0,
  luxe: 1.45,
};

const REGION_FACTOR: Record<Region, number> = {
  bruxelles: 1.1,
  wallonie: 0.95,
  flandre: 1.0,
};

const HIGH_DEMAND_MONTHS = ["mai", "juin", "juillet", "aout", "septembre"];
const ALL_SERVICES: ServiceKey[] = ["venue", "catering", "drinks", "decoration", "photo_video", "dj_music", "mc", "live_band", "cocktail_bar", "wedding_planner", "coordination_jour_j", "sound_light", "service_staff", "tenue", "flowers"];

function computeBreakdown(inputs: Inputs): BreakdownLine[] {
  const standing = STANDING_FACTOR[inputs.standing];
  const region = REGION_FACTOR[inputs.region];
  const monthMultiplier = HIGH_DEMAND_MONTHS.includes(inputs.weddingMonth.toLowerCase()) ? 1.08 : 1.0;
  const factor = standing * region * monthMultiplier;
  return inputs.services.map<BreakdownLine>((key) => {
    const base = SERVICE_BASE[key];
    const [minBase, maxBase] = base.perGuest
      ? [base.perGuest[0] * inputs.guestCount, base.perGuest[1] * inputs.guestCount]
      : (base.flat ?? [0, 0]);
    return {
      key,
      label: base.label,
      min: Math.round((minBase * factor) / 50) * 50,
      max: Math.round((maxBase * factor) / 50) * 50,
    };
  });
}

function fmt(n: number): string {
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export default function OutilsBudget() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState<Inputs>({
    guestCount: 100,
    region: "bruxelles",
    standing: "premium",
    services: ["venue", "catering", "decoration", "photo_video", "dj_music"],
    weddingMonth: "juin",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });


  const breakdown = useMemo(() => computeBreakdown(inputs), [inputs]);
  const totalMin = breakdown.reduce((s, b) => s + b.min, 0);
  const totalMax = breakdown.reduce((s, b) => s + b.max, 0);

  const STEPS = [
    t("tools.budget.step1"),
    t("tools.budget.step2"),
    t("tools.budget.step3"),
    t("tools.budget.step4"),
    t("tools.budget.step5"),
    t("tools.budget.step_result"),
  ];
  const totalSteps = STEPS.length;
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  const canNext = (() => {
    if (step === 0) return inputs.guestCount > 0 && inputs.guestCount < 1000;
    if (step === 3) return inputs.services.length > 0;
    return true;
  })();

  function next() {
    if (canNext && step < totalSteps - 1) setStep(step + 1);
  }
  function prev() {
    if (step > 0) setStep(step - 1);
  }

  async function onSubmitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads/budget-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contact.name,
          email: contact.email,
          phone: contact.phone || null,
          locale: i18n.language,
          inputs,
          result: {
            totalMin,
            totalMax,
            breakdown: breakdown.map((b) => ({ label: b.label, min: b.min, max: b.max })),
          },
        }),
      });
      if (!res.ok) throw new Error("Bad status");
      setSubmitted(true);
      toast({ title: t("tools.budget.email_success") });
    } catch {
      toast({ variant: "destructive", title: t("tools.budget.email_error") });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <SEO title="Calculateur de budget mariage" description="Estimez en quelques clics le budget de votre mariage afro ou mixte : nombre d'invités, standing, région, saison — outil gratuit disponible partout." />
      <section className="relative bg-wine-deep text-cream pt-40 pb-20 md:pt-48 md:pb-28 overflow-hidden">
        <div className="container mx-auto px-6 md:px-12 max-w-4xl text-center">
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section-eyebrow section-eyebrow-light mb-8">
            <Calculator className="inline w-4 h-4 mr-2 -mt-1" />
            {t("tools.budget.eyebrow")}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-display uppercase font-medium leading-[0.95] tracking-[-0.01em] mt-6 mb-6 text-cream text-4xl md:text-6xl lg:text-[5rem]"
          >
            {t("tools.budget.hero_title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-cream/70 font-light max-w-2xl mx-auto leading-relaxed"
          >
            {t("tools.budget.hero_desc")}
          </motion.p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-cream">
        <div className="container mx-auto px-6 md:px-12 max-w-3xl">
          <div className="bg-white border border-wine-deep/10 p-8 md:p-12">
            <div className="mb-8">
              <div className="flex justify-between text-xs uppercase tracking-[0.2em] text-wine-deep/60 mb-3">
                <span>{t("tools.budget.step")} {step + 1}/{totalSteps}</span>
                <span>{STEPS[step]}</span>
              </div>
              <Progress value={progress} className="h-1 bg-wine-deep/10" />
            </div>

            {step === 0 && (
              <div className="space-y-6" data-testid="budget-step-0">
                <h2 className="font-display text-2xl text-wine-deep">{t("tools.budget.q1")}</h2>
                <Input
                  type="number"
                  min={10}
                  max={500}
                  value={inputs.guestCount}
                  onChange={(e) => setInputs({ ...inputs, guestCount: Number(e.target.value) || 0 })}
                  className="bg-cream border-wine-deep/15 rounded-none text-2xl py-6 text-center font-display"
                  data-testid="input-guest-count"
                />
                <p className="text-sm text-wine-deep/60 text-center">{t("tools.budget.q1_help")}</p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6" data-testid="budget-step-1">
                <h2 className="font-display text-2xl text-wine-deep">{t("tools.budget.q2")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(["bruxelles", "wallonie", "flandre"] as Region[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setInputs({ ...inputs, region: r })}
                      className={`p-6 border text-center transition-colors ${
                        inputs.region === r ? "bg-wine-deep text-cream border-wine-deep" : "bg-cream border-wine-deep/15 hover:border-wine-deep"
                      }`}
                      data-testid={`region-${r}`}
                    >
                      <div className="font-display uppercase text-base">{t(`tools.budget.region.${r}`)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6" data-testid="budget-step-2">
                <h2 className="font-display text-2xl text-wine-deep">{t("tools.budget.q3")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(["essentiel", "premium", "luxe"] as Standing[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setInputs({ ...inputs, standing: s })}
                      className={`p-6 border text-left transition-colors ${
                        inputs.standing === s ? "bg-wine-deep text-cream border-wine-deep" : "bg-cream border-wine-deep/15 hover:border-wine-deep"
                      }`}
                      data-testid={`standing-${s}`}
                    >
                      <div className="font-display uppercase text-base mb-2">{t(`tools.budget.standing.${s}`)}</div>
                      <div className={`text-xs ${inputs.standing === s ? "text-cream/70" : "text-wine-deep/60"}`}>
                        {t(`tools.budget.standing.${s}_desc`)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6" data-testid="budget-step-3">
                <h2 className="font-display text-2xl text-wine-deep">{t("tools.budget.q4")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ALL_SERVICES.map((svc) => {
                    const checked = inputs.services.includes(svc);
                    return (
                      <label
                        key={svc}
                        className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${
                          checked ? "border-wine-deep bg-wine-deep/5" : "border-wine-deep/15 bg-cream hover:border-wine-deep/40"
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) => {
                            setInputs({
                              ...inputs,
                              services: c ? [...inputs.services, svc] : inputs.services.filter((s) => s !== svc),
                            });
                          }}
                          className="rounded-none border-wine-deep/30 data-[state=checked]:bg-wine-deep data-[state=checked]:border-wine-deep"
                          data-testid={`service-${svc}`}
                        />
                        <span className="text-sm text-wine-deep">{SERVICE_BASE[svc].label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6" data-testid="budget-step-4">
                <h2 className="font-display text-2xl text-wine-deep">{t("tools.budget.q5")}</h2>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setInputs({ ...inputs, weddingMonth: m })}
                      className={`p-3 text-xs uppercase tracking-wide border transition-colors ${
                        inputs.weddingMonth === m
                          ? "bg-wine-deep text-cream border-wine-deep"
                          : "bg-cream border-wine-deep/15 hover:border-wine-deep text-wine-deep"
                      }`}
                      data-testid={`month-${m}`}
                    >
                      {m.slice(0, 3)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-wine-deep/60 text-center">{t("tools.budget.q5_help")}</p>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-8" data-testid="budget-step-result">
                <div className="text-center">
                  <span className="section-eyebrow text-wine-deep/60 mb-3 block">{t("tools.budget.result_label")}</span>
                  <h2 className="font-display text-3xl md:text-5xl text-wine-deep mb-2">
                    {fmt(totalMin)} <span className="text-gold-deep">–</span> {fmt(totalMax)}
                  </h2>
                  <p className="text-sm text-wine-deep/60">
                    {t("tools.budget.result_for", { count: inputs.guestCount })}
                  </p>
                </div>

                <div className="border-t border-wine-deep/10 pt-6">
                  <h3 className="font-display uppercase text-sm tracking-[0.2em] text-wine-deep/70 mb-4">
                    {t("tools.budget.breakdown")}
                  </h3>
                  <div className="space-y-4" data-testid="budget-chart">
                    {breakdown.map((b) => {
                      const pctMin = totalMax > 0 ? Math.round((b.min / totalMax) * 100) : 0;
                      const pctMax = totalMax > 0 ? Math.round((b.max / totalMax) * 100) : 0;
                      return (
                        <div key={b.key} className="space-y-1">
                          <div className="flex justify-between items-baseline text-sm">
                            <span className="text-wine-deep">{b.label}</span>
                            <span className="font-medium text-wine-deep tabular-nums">
                              {fmt(b.min)} – {fmt(b.max)}
                            </span>
                          </div>
                          <div className="relative h-2 bg-wine-deep/8 overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 bg-wine-deep/25"
                              style={{ width: `${pctMax}%` }}
                              aria-hidden
                            />
                            <div
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-wine-deep to-gold"
                              style={{ width: `${pctMin}%` }}
                              aria-hidden
                            />
                          </div>
                          <div className="text-xs uppercase tracking-wider text-wine-deep/70 tabular-nums font-medium">
                            {pctMin}% – {pctMax}% {t("tools.budget.of_total")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {!submitted ? (
                  <form onSubmit={onSubmitEmail} className="bg-cream border border-gold-deep p-6 space-y-4">
                    <div className="text-center">
                      <Mail className="w-8 h-8 text-gold-deep mx-auto mb-2" />
                      <h3 className="font-display text-xl text-wine-deep">{t("tools.budget.email_title")}</h3>
                      <p className="text-sm text-wine-deep/60 mt-1">{t("tools.budget.email_desc")}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs uppercase tracking-wide">{t("tools.budget.form_name")}</Label>
                        <Input
                          required
                          minLength={2}
                          value={contact.name}
                          onChange={(e) => setContact({ ...contact, name: e.target.value })}
                          className="bg-cream border-wine-deep/15 rounded-none mt-1"
                          data-testid="budget-input-name"
                        />
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wide">{t("tools.budget.form_email")}</Label>
                        <Input
                          type="email"
                          required
                          value={contact.email}
                          onChange={(e) => setContact({ ...contact, email: e.target.value })}
                          className="bg-cream border-wine-deep/15 rounded-none mt-1"
                          data-testid="budget-input-email"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full btn-editorial-solid !h-12"
                      data-testid="budget-submit"
                    >
                      {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("tools.budget.email_submitting")}</> : t("tools.budget.email_cta")}
                    </Button>
                  </form>
                ) : (
                  <div className="bg-cream border border-gold-deep p-8 text-center" data-testid="budget-success">
                    <CheckCircle2 className="w-12 h-12 text-gold-deep mx-auto mb-3" />
                    <h3 className="font-display text-2xl text-wine-deep">{t("tools.budget.success_title")}</h3>
                    <p className="text-sm text-wine-deep/70 mt-2">{t("tools.budget.success_desc")}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-wine-deep/10">
              <Button
                type="button"
                variant="outline"
                onClick={prev}
                disabled={step === 0}
                className="rounded-none border-wine-deep/30 text-wine-deep hover:bg-wine-deep hover:text-cream"
                data-testid="budget-prev"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t("tools.common.prev")}
              </Button>
              {step < totalSteps - 1 && (
                <Button
                  type="button"
                  onClick={next}
                  disabled={!canNext}
                  className="bg-wine-deep text-cream hover:bg-wine-deep/90 rounded-none"
                  data-testid="budget-next"
                >
                  {t("tools.common.next")}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
