import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Loader2, X, Check, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReviewStars } from "@/components/marketplace/ReviewStars";
import { comparator } from "@/lib/comparator";
import { SEO } from "@/components/SEO";

interface Vendor {
  id: number;
  name: string;
  category: string;
  city: string;
  tagline: string;
  description: string;
  services: string[];
  images: string[];
  coverImage: string | null;
  rating: number;
  verified: boolean;
  region?: string | null;
  priceTier?: number | null;
  culturalStyles: string[];
  spokenLanguages: string[];
  averageRating?: number;
  reviewCount?: number;
}

const PRICE_LABEL = ["—", "€", "€€", "€€€", "€€€€"];

export default function Comparateur() {
  const { t } = useTranslation();
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const leadSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, t("comparateur.err_min2")),
        email: z.string().email(t("comparateur.err_email")),
        phone: z.string().optional(),
        weddingDate: z.string().optional(),
        message: z.string().min(10, t("comparateur.err_min10")).max(4000),
        requestType: z.literal("quote").default("quote"),
      }),
    [t],
  );
  type LeadForm = z.infer<typeof leadSchema>;

  const ids = useMemo(() => {
    const raw = sp.get("ids") || "";
    const fromUrl = raw.split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0);
    const source = fromUrl.length > 0 ? fromUrl : comparator.get("vendor");
    return Array.from(new Set(source)).slice(0, 3);
  }, [sp]);


  // LOT 8 — track comparator views
  useEffect(() => {
    if (ids.length === 0) return;
    ids.forEach((id) => {
      fetch(`/api/marketplace/vendors/${id}/track-view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "comparator" }),
        keepalive: true,
      }).catch(() => undefined);
    });
  }, [ids]);

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ["comparator-vendors", ids.join(",")],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const all = await Promise.all(
        ids.map(async (id) => {
          const r = await fetch(`/api/marketplace/vendors/${id}`);
          if (!r.ok) return null;
          return r.json();
        }),
      );
      return all.filter((v): v is Vendor => v !== null);
    },
    enabled: ids.length > 0,
  });

  const removeId = (id: number) => {
    const next = ids.filter((x) => x !== id);
    comparator.remove("vendor", id);
    if (next.length === 0) {
      setSp(new URLSearchParams());
    } else {
      setSp(new URLSearchParams({ ids: next.join(",") }), { replace: true });
    }
  };

  const form = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: "", email: "", phone: "", weddingDate: "", message: "" },
  });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<{ ok: number; failed: number } | null>(null);

  const onSubmit = async (data: LeadForm) => {
    if (ids.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/marketplace/comparator/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorIds: ids,
          contact: { ...data, requestType: "quote" },
        }),
      });
      const json = await res.json();
      if (res.ok || res.status === 201) {
        const okCount = (json.created || []).length;
        const failCount = (json.failed || []).length;
        setSent({ ok: okCount, failed: failCount });
        toast({
          title: t("comparateur.toast_success", { count: okCount }),
          description: failCount > 0 ? t("comparateur.toast_desc_fail", { count: failCount }) : t("comparateur.toast_desc_ok"),
        });
        form.reset();
      } else {
        toast({ title: t("comparateur.err_network"), description: json.error || t("comparateur.err_network"), variant: "destructive" });
      }
    } catch (err) {
      toast({ title: t("comparateur.err_network"), description: String(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (ids.length === 0) {
    return (
      <div className="min-h-[60vh] container mx-auto px-6 py-32 text-center">
        <h1 className="font-display uppercase text-4xl text-wine-deep mb-4">{t("comparateur.empty_title")}</h1>
        <p className="text-wine-deep/70 mb-8">{t("comparateur.empty_desc")}</p>
        <Link to="/partenaires" className="btn-editorial-compact-solid inline-flex">
          <ArrowLeft className="w-3.5 h-3.5" /> {t("comparateur.back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-cream min-h-screen">
      <SEO title="Comparateur de prestataires" description="Comparez jusqu'à 4 prestataires côte à côte pour votre mariage afro ou mixte : tarifs, services, avis — partout en Europe et en Afrique." />
      <section className="bg-wine-deep text-cream py-20 md:py-28">
        <div className="container mx-auto px-6 md:px-12 max-w-6xl">
          <Link to="/partenaires" className="text-xs uppercase tracking-[0.3em] text-gold hover:text-cream inline-flex items-center gap-2 mb-6">
            <ArrowLeft className="w-3 h-3" /> {t("comparateur.back_short")}
          </Link>
          <h1 className="font-display uppercase text-4xl md:text-6xl mb-4 leading-[0.95]">{t("comparateur.title")}</h1>
          <p className="text-cream/70 max-w-2xl">{t("comparateur.subtitle")}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 md:px-12 overflow-x-auto">
          {isLoading ? (
            <div className="py-24 text-center text-wine-deep/60">{t("comparateur.loading")}</div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${vendors.length}, minmax(260px, 1fr))` }}>
              <div></div>
              {vendors.map((v) => (
                <div key={v.id} className="card-editorial p-4 relative">
                  <button
                    type="button"
                    onClick={() => removeId(v.id)}
                    aria-label={t("comparateur.remove_aria", { name: v.name })}
                    className="absolute top-2 right-2 p-1 text-wine-deep/50 hover:text-wine-deep bg-cream/80 z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <img
                    src={v.coverImage || v.images[0] || ""}
                    alt={v.name}
                    className="w-full h-40 object-cover mb-3"
                  />
                  <p className="text-xs uppercase tracking-[0.3em] text-gold-deep font-semibold mb-1">{v.category}</p>
                  <h3 className="font-display uppercase text-xl text-wine-deep leading-tight">{v.name}</h3>
                  <p className="text-xs text-wine-deep/60 mt-1">{v.city}</p>
                </div>
              ))}

              <RowLabel label={t("comparateur.row_rating")} />
              {vendors.map((v) => (
                <Cell key={v.id}>
                  {v.averageRating && v.averageRating > 0 ? (
                    <div className="flex items-center gap-2">
                      <ReviewStars rating={v.averageRating} />
                      <span className="text-sm text-wine-deep/70">
                        {v.averageRating.toFixed(1)} ({v.reviewCount})
                      </span>
                    </div>
                  ) : (
                    <span className="text-wine-deep/70 text-sm">{t("comparateur.no_rating")}</span>
                  )}
                </Cell>
              ))}

              <RowLabel label={t("comparateur.row_budget")} />
              {vendors.map((v) => (
                <Cell key={v.id}>
                  <span className="font-display text-lg text-wine-deep">{v.priceTier ? PRICE_LABEL[v.priceTier] : "—"}</span>
                </Cell>
              ))}

              <RowLabel label={t("comparateur.row_region")} />
              {vendors.map((v) => (
                <Cell key={v.id}>{v.region ? v.region.charAt(0).toUpperCase() + v.region.slice(1) : v.city}</Cell>
              ))}

              <RowLabel label={t("comparateur.row_verified")} />
              {vendors.map((v) => (
                <Cell key={v.id}>
                  {v.verified ? <Check className="w-4 h-4 text-emerald-700" /> : <X className="w-4 h-4 text-wine-deep/60" />}
                </Cell>
              ))}

              <RowLabel label={t("comparateur.row_cultural")} />
              {vendors.map((v) => (
                <Cell key={v.id}>
                  {v.culturalStyles?.length > 0 ? v.culturalStyles.join(", ") : "—"}
                </Cell>
              ))}

              <RowLabel label={t("comparateur.row_languages")} />
              {vendors.map((v) => (
                <Cell key={v.id}>
                  {v.spokenLanguages?.length > 0 ? v.spokenLanguages.map((l) => l.toUpperCase()).join(" · ") : "—"}
                </Cell>
              ))}

              <RowLabel label={t("comparateur.row_description")} />
              {vendors.map((v) => (
                <Cell key={v.id}>
                  <p className="text-sm text-wine-deep/80 italic line-clamp-6">{v.tagline}</p>
                </Cell>
              ))}

              <RowLabel label={t("comparateur.row_services")} />
              {vendors.map((v) => (
                <Cell key={v.id}>
                  <ul className="space-y-1">
                    {(v.services || []).slice(0, 6).map((s) => (
                      <li key={s} className="text-xs text-wine-deep/80 flex items-start gap-2">
                        <span className="block w-2 h-px bg-gold flex-shrink-0 mt-2" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </Cell>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="bulk-quote" className="bg-wine-deep text-cream py-16 md:py-24">
        <div className="container mx-auto px-6 md:px-12 max-w-3xl">
          <div className="text-center mb-10">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium mb-3">{t("comparateur.bulk_eyebrow")}</p>
            <h2 className="font-display uppercase text-3xl md:text-5xl mb-4">{t("comparateur.bulk_title", { count: vendors.length })}</h2>
            <p className="text-cream/70">{t("comparateur.bulk_subtitle")}</p>
          </div>

          {sent ? (
            <div className="bg-cream/5 border border-cream/20 p-8 text-center">
              <p className="text-2xl font-display mb-3">{t("comparateur.sent_thanks")}</p>
              <p className="text-cream/80 mb-6">{t("comparateur.sent_desc", { count: sent.ok })}</p>
              <button onClick={() => navigate("/partenaires")} className="btn-editorial">
                {t("comparateur.back_short")}
              </button>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label={t("comparateur.field_name")} error={form.formState.errors.name?.message}>
                  <input
                    {...form.register("name")}
                    type="text"
                    className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-cream focus:outline-none focus:border-gold"
                    data-testid="bulk-name"
                  />
                </Field>
                <Field label={t("comparateur.field_email")} error={form.formState.errors.email?.message}>
                  <input
                    {...form.register("email")}
                    type="email"
                    className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-cream focus:outline-none focus:border-gold"
                    data-testid="bulk-email"
                  />
                </Field>
                <Field label={t("comparateur.field_phone")}>
                  <input
                    {...form.register("phone")}
                    type="tel"
                    className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-cream focus:outline-none focus:border-gold"
                  />
                </Field>
                <Field label={t("comparateur.field_date")}>
                  <input
                    {...form.register("weddingDate")}
                    type="date"
                    className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-cream focus:outline-none focus:border-gold"
                  />
                </Field>
              </div>
              <Field label={t("comparateur.field_message")} error={form.formState.errors.message?.message}>
                <textarea
                  {...form.register("message")}
                  rows={5}
                  placeholder={t("comparateur.message_placeholder")}
                  className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-cream focus:outline-none focus:border-gold resize-none"
                  data-testid="bulk-message"
                />
              </Field>
              <div className="pt-4 flex justify-center">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-4 bg-gold text-wine-deep text-xs uppercase tracking-[0.3em] font-bold hover:bg-cream transition inline-flex items-center gap-2"
                  data-testid="bulk-submit"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("comparateur.submit", { count: vendors.length })}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

function RowLabel({ label }: { label: string }) {
  return (
    <div className="text-xs uppercase tracking-[0.3em] text-gold-deep font-semibold border-t border-wine-deep/10 pt-4 self-start">
      {label}
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t border-wine-deep/10 pt-4 text-sm text-wine-deep/80">
      {children}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.3em] text-gold font-medium mb-2">{label}</label>
      {children}
      {error && <p className="text-xs text-rose-300 mt-1">{error}</p>}
    </div>
  );
}
