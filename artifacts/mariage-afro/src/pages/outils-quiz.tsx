import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Loader2, ChevronRight, ChevronLeft, Sparkles, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

type ProfileId = "elegance_senegalaise" | "fusion_caribeenne" | "afro_chic" | "tradi_revisitee" | "minimaliste_dore";

interface Profile {
  id: ProfileId;
  name: string;
  description: string;
  recommendedTags: string[];
  image: string;
  gradient: string;
}

const PROFILES: Record<ProfileId, Profile> = {
  elegance_senegalaise: {
    id: "elegance_senegalaise",
    name: "Élégance Sénégalaise",
    description: "Tonalité raffinée, palette dorée et bordeaux, drapés de bazin et ambiance feutrée. Une cérémonie qui célèbre l'héritage avec sobriété.",
    recommendedTags: ["bazin", "wedding-planner", "calligraphie"],
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
    gradient: "from-[#68191e] via-[#8b3038] to-[#c9a96e]",
  },
  fusion_caribeenne: {
    id: "fusion_caribeenne",
    name: "Fusion Caribéenne",
    description: "Couleurs vibrantes, rythmes soca/zouk, fleurs tropicales et énergie festive. L'art de mélanger les traditions sans rien renier.",
    recommendedTags: ["dj-zouk", "tropical-deco", "rhum"],
    image: "https://images.unsplash.com/photo-1525258946800-98cfd641d0de?auto=format&fit=crop&w=900&q=80",
    gradient: "from-[#a44a2c] via-[#c9a96e] to-[#fff4e4]",
  },
  afro_chic: {
    id: "afro_chic",
    name: "Afro Chic Urbain",
    description: "Architecture contemporaine, matériaux nobles (laiton, terracotta), prints minimalistes. Pour les couples ancrés dans la modernité.",
    recommendedTags: ["lieu-loft", "deco-minimal", "photo-editorial"],
    image: "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=900&q=80",
    gradient: "from-[#1f1416] via-[#68191e] to-[#c9a96e]",
  },
  tradi_revisitee: {
    id: "tradi_revisitee",
    name: "Tradition Revisitée",
    description: "Cérémonie coutumière complète (dot, libations) suivie d'une réception épurée. L'authenticité au premier plan.",
    recommendedTags: ["ceremonie-coutumiere", "tenues-traditionnelles", "videaste-documentaire"],
    image: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=900&q=80",
    gradient: "from-[#68191e] via-[#a44a2c] to-[#c9a96e]",
  },
  minimaliste_dore: {
    id: "minimaliste_dore",
    name: "Minimaliste Doré",
    description: "Lignes pures, ivoire & gold uniquement, scénographie épurée. La sophistication par la retenue.",
    recommendedTags: ["fleuriste-japonisant", "calligraphie", "lieu-blanc"],
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80",
    gradient: "from-[#fff4e4] via-[#c9a96e] to-[#68191e]",
  },
};

interface RecommendedVendor {
  id: number;
  name: string;
  category: string;
  city?: string | null;
  tagline?: string | null;
  coverImage?: string | null;
}

interface Question {
  id: string;
  q: string;
  options: { value: string; label: string; weight: Partial<Record<ProfileId, number>> }[];
}

const QUESTIONS: Question[] = [
  {
    id: "mood",
    q: "tools.quiz.q_mood",
    options: [
      { value: "feutree", label: "tools.quiz.opt_feutree", weight: { elegance_senegalaise: 3, minimaliste_dore: 2 } },
      { value: "festive", label: "tools.quiz.opt_festive", weight: { fusion_caribeenne: 3, tradi_revisitee: 1 } },
      { value: "moderne", label: "tools.quiz.opt_moderne", weight: { afro_chic: 3, minimaliste_dore: 2 } },
      { value: "authentique", label: "tools.quiz.opt_authentique", weight: { tradi_revisitee: 3, elegance_senegalaise: 1 } },
    ],
  },
  {
    id: "palette",
    q: "tools.quiz.q_palette",
    options: [
      { value: "bordeaux_or", label: "tools.quiz.opt_bordeaux_or", weight: { elegance_senegalaise: 3 } },
      { value: "tropical", label: "tools.quiz.opt_tropical", weight: { fusion_caribeenne: 3 } },
      { value: "terracotta", label: "tools.quiz.opt_terracotta", weight: { afro_chic: 3 } },
      { value: "ivoire_or", label: "tools.quiz.opt_ivoire_or", weight: { minimaliste_dore: 3 } },
    ],
  },
  {
    id: "heritage",
    q: "tools.quiz.q_heritage",
    options: [
      { value: "afrique_ouest", label: "tools.quiz.opt_afrique_ouest", weight: { elegance_senegalaise: 3, tradi_revisitee: 1 } },
      { value: "antilles", label: "tools.quiz.opt_antilles", weight: { fusion_caribeenne: 3 } },
      { value: "afrique_centrale", label: "tools.quiz.opt_afrique_centrale", weight: { tradi_revisitee: 2, elegance_senegalaise: 1 } },
      { value: "mixte", label: "tools.quiz.opt_mixte", weight: { afro_chic: 2, minimaliste_dore: 2 } },
    ],
  },
  {
    id: "ambiance",
    q: "tools.quiz.q_ambiance",
    options: [
      { value: "intime", label: "tools.quiz.opt_intime", weight: { minimaliste_dore: 3, elegance_senegalaise: 1 } },
      { value: "energique", label: "tools.quiz.opt_energique", weight: { fusion_caribeenne: 3 } },
      { value: "elegante", label: "tools.quiz.opt_elegante", weight: { elegance_senegalaise: 3, afro_chic: 1 } },
      { value: "spirituelle", label: "tools.quiz.opt_spirituelle", weight: { tradi_revisitee: 3 } },
    ],
  },
  {
    id: "taille",
    q: "tools.quiz.q_taille",
    options: [
      { value: "intime_50", label: "tools.quiz.opt_intime_50", weight: { minimaliste_dore: 3, afro_chic: 1 } },
      { value: "moyen_120", label: "tools.quiz.opt_moyen_120", weight: { elegance_senegalaise: 2, afro_chic: 2 } },
      { value: "grand_200", label: "tools.quiz.opt_grand_200", weight: { fusion_caribeenne: 2, tradi_revisitee: 2 } },
      { value: "tres_grand", label: "tools.quiz.opt_tres_grand", weight: { tradi_revisitee: 3, fusion_caribeenne: 1 } },
    ],
  },
  {
    id: "lieu",
    q: "tools.quiz.q_lieu",
    options: [
      { value: "chateau", label: "tools.quiz.opt_chateau", weight: { elegance_senegalaise: 3 } },
      { value: "loft", label: "tools.quiz.opt_loft", weight: { afro_chic: 3, minimaliste_dore: 1 } },
      { value: "salle_familiale", label: "tools.quiz.opt_salle_familiale", weight: { tradi_revisitee: 3 } },
      { value: "jardin", label: "tools.quiz.opt_jardin", weight: { fusion_caribeenne: 2, minimaliste_dore: 1 } },
    ],
  },
  {
    id: "musique",
    q: "tools.quiz.q_musique",
    options: [
      { value: "afrobeat", label: "tools.quiz.opt_afrobeat", weight: { afro_chic: 2, fusion_caribeenne: 1 } },
      { value: "zouk", label: "tools.quiz.opt_zouk", weight: { fusion_caribeenne: 3 } },
      { value: "mbalax", label: "tools.quiz.opt_mbalax", weight: { elegance_senegalaise: 3, tradi_revisitee: 1 } },
      { value: "jazz_soul", label: "tools.quiz.opt_jazz_soul", weight: { minimaliste_dore: 3, afro_chic: 1 } },
    ],
  },
];

function scoreProfile(answers: Record<string, string>): Profile {
  const scores: Record<ProfileId, number> = {
    elegance_senegalaise: 0,
    fusion_caribeenne: 0,
    afro_chic: 0,
    tradi_revisitee: 0,
    minimaliste_dore: 0,
  };
  for (const q of QUESTIONS) {
    const ans = answers[q.id];
    if (!ans) continue;
    const opt = q.options.find((o) => o.value === ans);
    if (!opt) continue;
    for (const [pid, w] of Object.entries(opt.weight) as [ProfileId, number][]) {
      scores[pid] += w;
    }
  }
  let best: ProfileId = "elegance_senegalaise";
  let bestScore = -1;
  for (const [pid, s] of Object.entries(scores) as [ProfileId, number][]) {
    if (s > bestScore) { bestScore = s; best = pid; }
  }
  return PROFILES[best];
}

export default function OutilsQuiz() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState({ name: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [recommendedVendors, setRecommendedVendors] = useState<RecommendedVendor[]>([]);

  useEffect(() => {
    document.title = `${t("tools.quiz.meta_title")} — Mariage Afro`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("tools.quiz.meta_desc"));
  }, [t]);

  const profile = useMemo(() => scoreProfile(answers), [answers]);
  const totalSteps = QUESTIONS.length + 1;
  const progress = Math.round(((step + 1) / totalSteps) * 100);
  const isResultStep = step === QUESTIONS.length;

  // Fetch up to 3 recommended vendors when reaching the result, based on profile tags.
  useEffect(() => {
    if (!isResultStep) return;
    let aborted = false;
    const tags = profile.recommendedTags.join(",");
    fetch(`/api/marketplace/vendors-by-tags?tags=${encodeURIComponent(tags)}&limit=3`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: RecommendedVendor[]) => { if (!aborted) setRecommendedVendors(Array.isArray(data) ? data : []); })
      .catch(() => { if (!aborted) setRecommendedVendors([]); });
    return () => { aborted = true; };
  }, [isResultStep, profile.id]);
  const currentQuestion = !isResultStep ? QUESTIONS[step] : null;
  const canNext = !!(currentQuestion && answers[currentQuestion.id]);

  function next() { if (canNext && step < totalSteps - 1) setStep(step + 1); }
  function prev() { if (step > 0) setStep(step - 1); }

  function setAnswer(qid: string, value: string) {
    setAnswers({ ...answers, [qid]: value });
    setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, 250);
  }

  async function onSubmitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contact.name,
          email: contact.email,
          locale: i18n.language,
          answers,
          profile: {
            id: profile.id,
            name: profile.name,
            description: profile.description,
            recommendedTags: profile.recommendedTags,
          },
        }),
      });
      if (!res.ok) throw new Error("Bad status");
      setSubmitted(true);
      toast({ title: t("tools.quiz.email_success") });
    } catch {
      toast({ variant: "destructive", title: t("tools.quiz.email_error") });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <section className="relative bg-wine-deep text-cream pt-40 pb-20 md:pt-48 md:pb-28 overflow-hidden">
        <div className="container mx-auto px-6 md:px-12 max-w-4xl text-center">
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section-eyebrow mb-8">
            <Sparkles className="inline w-4 h-4 mr-2 -mt-1" />
            {t("tools.quiz.eyebrow")}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-display uppercase font-medium leading-[0.95] tracking-[-0.01em] mt-6 mb-6 text-cream text-4xl md:text-6xl lg:text-[5rem]"
          >
            {t("tools.quiz.hero_title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-cream/70 font-light max-w-2xl mx-auto leading-relaxed"
          >
            {t("tools.quiz.hero_desc")}
          </motion.p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-cream">
        <div className="container mx-auto px-6 md:px-12 max-w-3xl">
          <div className="bg-white border border-wine-deep/10 p-8 md:p-12">
            <div className="mb-8">
              <div className="flex justify-between text-xs uppercase tracking-[0.2em] text-wine-deep/60 mb-3">
                <span>{t("tools.quiz.step")} {Math.min(step + 1, totalSteps)}/{totalSteps}</span>
                {isResultStep && <span>{t("tools.quiz.your_profile")}</span>}
              </div>
              <Progress value={progress} className="h-1 bg-wine-deep/10" />
            </div>

            {!isResultStep && currentQuestion && (
              <div className="space-y-6" data-testid={`quiz-step-${step}`}>
                <h2 className="font-display text-2xl text-wine-deep">{t(currentQuestion.q)}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentQuestion.options.map((opt) => {
                    const checked = answers[currentQuestion.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAnswer(currentQuestion.id, opt.value)}
                        className={`p-5 border text-left transition-colors ${
                          checked ? "bg-wine-deep text-cream border-wine-deep" : "bg-cream border-wine-deep/15 hover:border-wine-deep"
                        }`}
                        data-testid={`quiz-opt-${currentQuestion.id}-${opt.value}`}
                      >
                        <span className="text-sm uppercase tracking-wide font-medium">{t(opt.label)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {isResultStep && (
              <div className="space-y-8" data-testid="quiz-result">
                <div
                  className={`relative h-56 md:h-72 w-full overflow-hidden bg-gradient-to-br ${profile.gradient} flex items-end`}
                  data-testid="quiz-profile-hero"
                >
                  <img
                    src={profile.image}
                    alt={profile.name}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-wine-deep/80 via-wine-deep/30 to-transparent" />
                  <div className="relative p-6 md:p-8 text-cream">
                    <span className="section-eyebrow text-cream/80 mb-2 block">{t("tools.quiz.result_label")}</span>
                    <h2 className="font-display text-3xl md:text-5xl text-cream">{profile.name}</h2>
                  </div>
                </div>
                <p className="text-wine-deep/75 max-w-xl mx-auto leading-relaxed text-center">{profile.description}</p>

                {recommendedVendors.length > 0 && (
                  <div className="border-t border-wine-deep/10 pt-6" data-testid="quiz-recommended-vendors">
                    <h3 className="font-display uppercase text-sm tracking-[0.2em] text-wine-deep/70 mb-4 text-center">
                      {t("tools.quiz.recommended_title")}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {recommendedVendors.map((v) => (
                        <a
                          key={v.id}
                          href={`/partenaires/${v.id}`}
                          className="block border border-wine-deep/15 bg-cream hover:border-wine-deep transition-colors group"
                          data-testid={`quiz-vendor-${v.id}`}
                        >
                          {v.coverImage && (
                            <div className="aspect-[4/3] overflow-hidden bg-wine-deep/5">
                              <img src={v.coverImage} alt={v.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            </div>
                          )}
                          <div className="p-4">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-gold mb-1">{v.category}</div>
                            <div className="font-display text-base text-wine-deep leading-tight">{v.name}</div>
                            {v.city && <div className="text-xs text-wine-deep/60 mt-1">{v.city}</div>}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {!submitted ? (
                  <form onSubmit={onSubmitEmail} className="bg-cream border border-gold/40 p-6 space-y-4">
                    <div className="text-center">
                      <Mail className="w-8 h-8 text-gold mx-auto mb-2" />
                      <h3 className="font-display text-xl text-wine-deep">{t("tools.quiz.email_title")}</h3>
                      <p className="text-sm text-wine-deep/60 mt-1">{t("tools.quiz.email_desc")}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs uppercase tracking-wide">{t("tools.budget.form_name")}</Label>
                        <Input
                          required minLength={2}
                          value={contact.name}
                          onChange={(e) => setContact({ ...contact, name: e.target.value })}
                          className="bg-white border-wine-deep/15 rounded-none mt-1"
                          data-testid="quiz-input-name"
                        />
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wide">{t("tools.budget.form_email")}</Label>
                        <Input
                          type="email" required
                          value={contact.email}
                          onChange={(e) => setContact({ ...contact, email: e.target.value })}
                          className="bg-white border-wine-deep/15 rounded-none mt-1"
                          data-testid="quiz-input-email"
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full btn-editorial-solid !h-12" data-testid="quiz-submit">
                      {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("tools.quiz.email_submitting")}</> : t("tools.quiz.email_cta")}
                    </Button>
                  </form>
                ) : (
                  <div className="bg-cream border border-gold/40 p-8 text-center" data-testid="quiz-success">
                    <CheckCircle2 className="w-12 h-12 text-gold mx-auto mb-3" />
                    <h3 className="font-display text-2xl text-wine-deep">{t("tools.quiz.success_title")}</h3>
                    <p className="text-sm text-wine-deep/70 mt-2">{t("tools.quiz.success_desc")}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-wine-deep/10">
              <Button
                type="button" variant="outline" onClick={prev} disabled={step === 0}
                className="rounded-none border-wine-deep/30 text-wine-deep hover:bg-wine-deep hover:text-cream"
                data-testid="quiz-prev"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />{t("tools.common.prev")}
              </Button>
              {!isResultStep && (
                <Button
                  type="button" onClick={next} disabled={!canNext}
                  className="bg-wine-deep text-cream hover:bg-wine-deep/90 rounded-none"
                  data-testid="quiz-next"
                >
                  {t("tools.common.next")}<ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
