import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2, Heart } from "lucide-react";
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
  const [form, setForm] = useState({ name: "", email: "", attending: true, guestCount: 1, message: "" });
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
        ...form,
        guestCount: Number(form.guestCount),
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
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-6">
        <div className="bg-white border border-border p-10 text-center max-w-md">
          <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-serif mb-2">{t("mariage_public.rsvp_done_title")}</h1>
          <p className="text-muted-foreground text-sm mb-6">{t("mariage_public.rsvp_done_desc")}</p>
          <Link to={`/mariage/${slug}`} className="text-sm text-primary hover:underline">← {t("mariage_cagnotte.back_to_site")}</Link>
        </div>
      </div>
    );
  }

  // Required-field validation includes custom required questions
  const customMissing = questions.some((q) => q.required && !((answers[q.id] || "").trim()));
  const canSubmit = !!form.name.trim() && emailValid && !customMissing && !submit.isPending;

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <section className="py-12 text-center bg-foreground">
        <Heart className="w-10 h-10 text-primary mx-auto mb-3" />
        <h1 className="text-3xl md:text-4xl font-bold font-serif text-white">{t("mariage_public.rsvp_title")}</h1>
        {site.title && <p className="text-white/70 text-sm mt-2">{site.title}</p>}
      </section>

      <section className="py-10 px-6 max-w-lg mx-auto">
        <form onSubmit={(e) => { e.preventDefault(); if (canSubmit) submit.mutate(); }} className="bg-white border border-border p-6 space-y-5">
          <div className="space-y-2">
            <Label>{t("mariage_public.your_name")} *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="rounded-none" data-testid="input-rsvp-name" />
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
                <button key={String(val)} type="button" onClick={() => setForm({ ...form, attending: val })}
                  className={`flex-1 text-sm py-2.5 px-3 border ${form.attending === val ? "border-primary bg-primary text-white" : "border-border hover:border-primary"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {form.attending && (
            <div className="space-y-2">
              <Label>{t("mariage_public.guest_count")}</Label>
              <Input type="number" min={1} max={20} value={form.guestCount} onChange={(e) => setForm({ ...form, guestCount: Number(e.target.value) })} className="rounded-none w-28" />
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
