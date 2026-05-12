import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2, Heart, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RsvpQuestion {
  id: number;
  label: string;
  type: "text" | "yesno" | "choice";
  options: string[];
  required: boolean;
}

export default function MariageRsvpPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", attending: true, message: "" });
  const [companion, setCompanion] = useState<{ firstName: string; lastName: string } | null>(null);
  const emailValid = /.+@.+\..+/.test(form.email);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const { data: site } = useQuery({
    queryKey: ["wedding-public", slug],
    queryFn: async () => { const r = await fetch(`/api/wedding/${slug}`); if (!r.ok) throw new Error("nf"); return r.json(); },
    enabled: !!slug,
  });
  const { data: questions = [] } = useQuery<RsvpQuestion[]>({
    queryKey: ["wedding-questions", slug],
    queryFn: async () => { const r = await fetch(`/api/wedding/${slug}/rsvp-questions`); if (!r.ok) return []; return r.json(); },
    enabled: !!slug,
  });

  useEffect(() => { if (site?.title) document.title = `RSVP — ${site.title}`; }, [site]);

  const submit = useMutation({
    mutationFn: async () => {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email,
        attending: form.attending,
        companionFirstName: companion?.firstName.trim() || null,
        companionLastName: companion?.lastName.trim() || null,
        message: form.message,
        answers: Object.entries(answers).map(([qid, a]) => ({ questionId: Number(qid), answer: a })).filter((a) => a.answer !== ""),
      };
      const r = await fetch(`/api/wedding/${slug}/rsvp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error("err");
    },
    onSuccess: () => setDone(true),
  });

  if (!site) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (done) {
    return (
      <div className="min-h-screen bg-cream-soft flex items-center justify-center px-6">
        <div className="bg-white border border-border p-10 text-center max-w-md">
          <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-serif mb-2">{t("mariage_public.rsvp_done_title")}</h1>
          <p className="text-muted-foreground text-sm mb-6">{t("mariage_public.rsvp_done_desc")}</p>
          <Link to={`/mariage/${slug}`} className="text-sm text-primary hover:underline">← {t("mariage_cagnotte.back_to_site")}</Link>
        </div>
      </div>
    );
  }

  const customMissing = questions.some((q) => q.required && !((answers[q.id] || "").trim()));
  const canSubmit = !!form.firstName.trim() && emailValid && !customMissing && !submit.isPending;

  return (
    <div className="min-h-screen bg-cream-soft">
      <section className="py-12 text-center bg-foreground">
        <Heart className="w-10 h-10 text-primary mx-auto mb-3" />
        <h1 className="text-3xl md:text-4xl font-bold font-serif text-white">{t("mariage_public.rsvp_title")}</h1>
        {site.title && <p className="text-white/70 text-sm mt-2">{site.title}</p>}
      </section>

      <section className="py-10 px-6 max-w-lg mx-auto">
        <form onSubmit={(e) => { e.preventDefault(); if (canSubmit) submit.mutate(); }} className="bg-white border border-border p-6 space-y-5">

          {/* Prénom + Nom séparés */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("mariage_public.first_name")} *</Label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
                className="rounded-none"
                data-testid="input-rsvp-firstname"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("mariage_public.last_name")}</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="rounded-none"
                data-testid="input-rsvp-lastname"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("mariage_public.email_required")} *</Label>
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-none" data-testid="input-rsvp-email" />
          </div>

          <div className="space-y-2">
            <Label>{t("mariage_public.presence")}</Label>
            <div className="flex gap-3">
              {[
                { val: true, label: t("mariage_public.attending") },
                { val: false, label: t("mariage_public.not_attending") },
              ].map(({ val, label }) => (
                <button key={String(val)} type="button"
                  onClick={() => { setForm({ ...form, attending: val }); if (!val) setCompanion(null); }}
                  className={`flex-1 text-sm py-2.5 px-3 border ${form.attending === val ? "border-primary bg-primary text-white" : "border-border hover:border-primary"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Accompagnant (un seul) — visible seulement si "présent" */}
          {form.attending && (
            <div className="space-y-3">
              <Label>{t("mariage_public.companion_title")}</Label>
              {companion === null ? (
                <button
                  type="button"
                  onClick={() => setCompanion({ firstName: "", lastName: "" })}
                  className="flex items-center gap-2 text-sm text-primary hover:underline underline-offset-4"
                  data-testid="button-add-companion"
                >
                  <Plus className="w-4 h-4" />
                  {t("mariage_public.add_companion")}
                </button>
              ) : (
                <div className="border border-border p-4 space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => setCompanion(null)}
                    className="absolute top-3 right-3 text-muted-foreground hover:text-primary"
                    aria-label={t("mariage_public.remove_companion")}
                    data-testid="button-remove-companion"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{t("mariage_public.companion_info")}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("mariage_public.first_name")}</Label>
                      <Input
                        value={companion.firstName}
                        onChange={(e) => setCompanion({ ...companion, firstName: e.target.value })}
                        className="rounded-none h-9 text-sm"
                        data-testid="input-companion-firstname"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("mariage_public.last_name")}</Label>
                      <Input
                        value={companion.lastName}
                        onChange={(e) => setCompanion({ ...companion, lastName: e.target.value })}
                        className="rounded-none h-9 text-sm"
                        data-testid="input-companion-lastname"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom questions */}
          {questions.map((q) => (
            <div key={q.id} className="space-y-2">
              <Label>{q.label}{q.required ? " *" : ""}</Label>
              {q.type === "yesno" ? (
                <div className="flex gap-3">
                  {["yes", "no"].map((opt) => (
                    <button key={opt} type="button" onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                      className={`flex-1 text-sm py-2 px-3 border ${answers[q.id] === opt ? "border-primary bg-primary text-white" : "border-border hover:border-primary"}`}>
                      {t(`mariage_public.${opt === "yes" ? "yes" : "no"}`)}
                    </button>
                  ))}
                </div>
              ) : q.type === "choice" ? (
                <select value={answers[q.id] || ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} className="w-full border border-border h-10 px-3 text-sm" required={q.required}>
                  <option value="">—</option>
                  {q.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <Input value={answers[q.id] || ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} required={q.required} className="rounded-none" />
              )}
            </div>
          ))}

          <div className="space-y-2">
            <Label>{t("mariage_public.message_optional")}</Label>
            <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="rounded-none resize-none" rows={3} />
          </div>

          <Button type="submit" disabled={!canSubmit} className="w-full rounded-none bg-primary hover:bg-primary/90 h-12 font-bold uppercase tracking-wider text-sm">
            {submit.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {t("mariage_public.confirm")}
          </Button>
        </form>
      </section>
    </div>
  );
}
