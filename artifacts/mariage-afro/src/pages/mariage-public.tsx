import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MapPin, CalendarDays, Heart, CheckCircle2, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface WeddingWebsite {
  id: number;
  slug: string;
  title: string;
  welcomeMessage: string;
  weddingDate: string | null;
  venue: string | null;
  city: string | null;
  programme: { time: string; event: string }[];
  active: boolean;
  rsvpEnabled: boolean;
}

const LOCALE_MAP: Record<string, string> = { fr: "fr-BE", nl: "nl-BE", en: "en-GB" };

export default function MariagePublicPage() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const dateLocale = LOCALE_MAP[(i18n.resolvedLanguage || i18n.language || "fr").split("-")[0]] || "fr-BE";
  const [rsvpDone, setRsvpDone] = useState(false);
  const [rsvpForm, setRsvpForm] = useState({
    name: "",
    email: "",
    attending: true,
    guestCount: 1,
    message: "",
  });

  const { data: site, isLoading, isError } = useQuery<WeddingWebsite>({
    queryKey: ["wedding-public", slug],
    queryFn: async () => {
      const res = await fetch(`/api/wedding/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (site) document.title = `${site.title} — Mariage Afro`;
  }, [site]);

  const rsvpMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/wedding/${slug}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rsvpForm,
          attending: rsvpForm.attending,
          guestCount: Number(rsvpForm.guestCount),
        }),
      });
      if (!res.ok) throw new Error("Erreur");
    },
    onSuccess: () => setRsvpDone(true),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !site) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <Heart className="w-16 h-16 text-primary/30" />
        <h1 className="text-2xl font-bold font-serif text-foreground">{t("mariage_public.not_found_title")}</h1>
        <p className="text-muted-foreground max-w-xs">
          {t("mariage_public.not_found_desc")}
        </p>
        <Link to="/" className="text-primary hover:underline text-sm">
          {t("mariage_public.back_home")}
        </Link>
      </div>
    );
  }

  const formattedDate = site.weddingDate
    ? new Date(site.weddingDate).toLocaleDateString(dateLocale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-[#faf9f7] font-sans">
      <section className="relative py-32 text-center bg-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 px-6">
          <p className="text-primary text-xs uppercase tracking-[0.4em] font-bold mb-6">
            {t("mariage_public.eyebrow")}
          </p>
          <h1 className="text-5xl md:text-7xl font-bold font-serif text-white leading-tight mb-8">
            {site.title}
          </h1>
          {formattedDate && (
            <div className="flex items-center justify-center gap-2 text-white/70 text-sm">
              <CalendarDays className="w-4 h-4" />
              <span className="capitalize">{formattedDate}</span>
            </div>
          )}
          {(site.venue || site.city) && (
            <div className="flex items-center justify-center gap-2 text-white/70 text-sm mt-2">
              <MapPin className="w-4 h-4" />
              <span>{[site.venue, site.city].filter(Boolean).join(" · ")}</span>
            </div>
          )}
        </div>
      </section>

      {site.welcomeMessage && (
        <section className="py-20 px-6 max-w-2xl mx-auto text-center">
          <Heart className="w-8 h-8 text-primary mx-auto mb-6" />
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed italic">
            "{site.welcomeMessage}"
          </p>
        </section>
      )}

      {site.programme && site.programme.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-xl mx-auto px-6">
            <h2 className="text-2xl font-bold font-serif text-foreground text-center mb-12">
              {t("mariage_public.programme_title")}
            </h2>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-primary/20" />
              <div className="space-y-8">
                {site.programme.map((item, i) => (
                  <div key={i} className="flex gap-6 pl-14 relative">
                    <div className="absolute left-4 top-1 w-4 h-4 rounded-full border-2 border-primary bg-white" />
                    <div>
                      <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        {item.time}
                      </div>
                      <p className="text-foreground font-medium">{item.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {site.rsvpEnabled && (
        <section className="py-20 px-6 max-w-lg mx-auto">
          <h2 className="text-2xl font-bold font-serif text-foreground text-center mb-4">
            {t("mariage_public.rsvp_title")}
          </h2>
          <p className="text-center text-muted-foreground mb-10 text-sm">
            {formattedDate
              ? t("mariage_public.rsvp_subtitle_with_date", { date: formattedDate })
              : t("mariage_public.rsvp_subtitle_no_date")}
          </p>

          {rsvpDone ? (
            <div className="bg-white border border-border p-10 text-center">
              <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold font-serif mb-2">{t("mariage_public.rsvp_done_title")}</h3>
              <p className="text-muted-foreground text-sm">
                {t("mariage_public.rsvp_done_desc")}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-border p-8 space-y-5">
              <div className="space-y-2">
                <Label>{t("mariage_public.your_name")}</Label>
                <Input
                  value={rsvpForm.name}
                  onChange={(e) => setRsvpForm({ ...rsvpForm, name: e.target.value })}
                  placeholder={t("mariage_public.name_placeholder")}
                  className="rounded-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("mariage_public.email_required")} *</Label>
                <Input
                  type="email"
                  required
                  value={rsvpForm.email}
                  onChange={(e) => setRsvpForm({ ...rsvpForm, email: e.target.value })}
                  placeholder={t("mariage_public.email_placeholder")}
                  className="rounded-none"
                />
              </div>

              <div className="space-y-2">
                <Label>{t("mariage_public.presence")}</Label>
                <div className="flex gap-3">
                  {[
                    { val: true, label: t("mariage_public.attending") },
                    { val: false, label: t("mariage_public.not_attending") },
                  ].map(({ val, label }) => (
                    <button
                      key={String(val)}
                      onClick={() => setRsvpForm({ ...rsvpForm, attending: val })}
                      className={`flex-1 text-sm py-2.5 px-3 border transition-colors ${
                        rsvpForm.attending === val
                          ? "border-primary bg-primary text-white"
                          : "border-border text-foreground hover:border-primary"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {rsvpForm.attending && (
                <div className="space-y-2">
                  <Label>{t("mariage_public.guest_count")}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={rsvpForm.guestCount}
                    onChange={(e) => setRsvpForm({ ...rsvpForm, guestCount: Number(e.target.value) })}
                    className="rounded-none w-28"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>{t("mariage_public.message_optional")}</Label>
                <Textarea
                  value={rsvpForm.message}
                  onChange={(e) => setRsvpForm({ ...rsvpForm, message: e.target.value })}
                  placeholder={t("mariage_public.message_placeholder")}
                  className="rounded-none resize-none"
                  rows={3}
                />
              </div>

              <Button
                onClick={() => rsvpMutation.mutate()}
                disabled={!rsvpForm.name.trim() || !/.+@.+\..+/.test(rsvpForm.email) || rsvpMutation.isPending}
                className="w-full rounded-none bg-primary hover:bg-primary/90 h-12 font-bold uppercase tracking-wider text-sm"
              >
                {rsvpMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {t("mariage_public.confirm")}
              </Button>
            </div>
          )}
        </section>
      )}

      <section className="py-12 text-center bg-foreground/5">
        <a href={`/mariage/${slug}/cagnotte`} className="inline-flex items-center gap-2 text-sm text-primary hover:underline uppercase tracking-wider">
          🎁 {t("mariage_public.cagnotte_link")}
        </a>
      </section>

      <footer className="py-8 text-center border-t border-border">
        <p className="text-xs text-muted-foreground">
          {t("mariage_public.footer_made_with")}{" "}
          <a href="/" className="text-primary hover:underline">
            Mariage Afro
          </a>{" "}
          · {t("mariage_public.footer_tagline")}
        </p>
      </footer>
    </div>
  );
}
