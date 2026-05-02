import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, X, Check, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReviewStars } from "@/components/marketplace/ReviewStars";
import { comparator } from "@/lib/comparator";

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

const leadSchema = z.object({
  name: z.string().min(2, "Au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  weddingDate: z.string().optional(),
  message: z.string().min(10, "Au moins 10 caractères").max(4000),
  requestType: z.literal("quote").default("quote"),
});
type LeadForm = z.infer<typeof leadSchema>;

export default function Comparateur() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const ids = useMemo(() => {
    const raw = sp.get("ids") || "";
    const fromUrl = raw.split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0);
    const source = fromUrl.length > 0 ? fromUrl : comparator.get("vendor");
    // Déduplique et clamp à MAX_COMPARE pour rester aligné avec la limite produit + backend.
    return Array.from(new Set(source)).slice(0, 3);
  }, [sp]);

  useEffect(() => {
    document.title = "Comparateur de prestataires — Mariage Afro";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Comparez côte-à-côte jusqu'à 3 prestataires mariage afro/mixte en Belgique.");
  }, []);

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
          title: `${okCount} prestataire${okCount > 1 ? "s contactés" : " contacté"}`,
          description: failCount > 0 ? `${failCount} échec${failCount > 1 ? "s" : ""}.` : "Vous recevrez leurs réponses par email.",
        });
        form.reset();
      } else {
        toast({ title: "Erreur", description: json.error || "Erreur réseau", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Erreur réseau", description: String(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (ids.length === 0) {
    return (
      <div className="min-h-[60vh] container mx-auto px-6 py-32 text-center">
        <h1 className="font-display uppercase text-4xl text-wine-deep mb-4">Comparateur vide</h1>
        <p className="text-wine-deep/70 mb-8">Sélectionnez jusqu'à 3 prestataires depuis la marketplace pour les comparer.</p>
        <Link to="/partenaires" className="btn-editorial-compact-solid inline-flex">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour à la marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-cream min-h-screen">
      <section className="bg-wine-deep text-cream py-20 md:py-28">
        <div className="container mx-auto px-6 md:px-12 max-w-6xl">
          <Link to="/partenaires" className="text-xs uppercase tracking-[0.3em] text-gold hover:text-cream inline-flex items-center gap-2 mb-6">
            <ArrowLeft className="w-3 h-3" /> Retour aux prestataires
          </Link>
          <h1 className="font-display uppercase text-4xl md:text-6xl mb-4 leading-[0.95]">Comparateur</h1>
          <p className="text-cream/70 max-w-2xl">Comparez côte-à-côte jusqu'à 3 prestataires et envoyez-leur une demande de devis groupée en un seul formulaire.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 md:px-12 overflow-x-auto">
          {isLoading ? (
            <div className="py-24 text-center text-wine-deep/60">Chargement…</div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${vendors.length}, minmax(260px, 1fr))` }}>
              <div></div>
              {vendors.map((v) => (
                <div key={v.id} className="card-editorial p-4 relative">
                  <button
                    type="button"
                    onClick={() => removeId(v.id)}
                    aria-label={`Retirer ${v.name}`}
                    className="absolute top-2 right-2 p-1 text-wine-deep/50 hover:text-wine-deep bg-cream/80 z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <img
                    src={v.coverImage || v.images[0] || ""}
                    alt={v.name}
                    className="w-full h-40 object-cover mb-3"
                  />
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium mb-1">{v.category}</p>
                  <h3 className="font-display uppercase text-xl text-wine-deep leading-tight">{v.name}</h3>
                  <p className="text-xs text-wine-deep/60 mt-1">{v.city}</p>
                </div>
              ))}

              <RowLabel label="Note moyenne" />
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
                    <span className="text-wine-deep/40 text-sm">Pas encore d'avis</span>
                  )}
                </Cell>
              ))}

              <RowLabel label="Budget" />
              {vendors.map((v) => (
                <Cell key={v.id}>
                  <span className="font-display text-lg text-wine-deep">{v.priceTier ? PRICE_LABEL[v.priceTier] : "—"}</span>
                </Cell>
              ))}

              <RowLabel label="Région" />
              {vendors.map((v) => (
                <Cell key={v.id}>{v.region ? v.region.charAt(0).toUpperCase() + v.region.slice(1) : v.city}</Cell>
              ))}

              <RowLabel label="Vérifié" />
              {vendors.map((v) => (
                <Cell key={v.id}>
                  {v.verified ? <Check className="w-4 h-4 text-emerald-700" /> : <X className="w-4 h-4 text-wine-deep/30" />}
                </Cell>
              ))}

              <RowLabel label="Style culturel" />
              {vendors.map((v) => (
                <Cell key={v.id}>
                  {v.culturalStyles?.length > 0 ? v.culturalStyles.join(", ") : "—"}
                </Cell>
              ))}

              <RowLabel label="Langues" />
              {vendors.map((v) => (
                <Cell key={v.id}>
                  {v.spokenLanguages?.length > 0 ? v.spokenLanguages.map((l) => l.toUpperCase()).join(" · ") : "—"}
                </Cell>
              ))}

              <RowLabel label="Description" />
              {vendors.map((v) => (
                <Cell key={v.id}>
                  <p className="text-sm text-wine-deep/80 italic line-clamp-6">{v.tagline}</p>
                </Cell>
              ))}

              <RowLabel label="Services" />
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
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium mb-3">Demande groupée</p>
            <h2 className="font-display uppercase text-3xl md:text-5xl mb-4">Demander un devis aux {vendors.length} prestataires</h2>
            <p className="text-cream/70">Une seule demande, envoyée simultanément à tous les prestataires sélectionnés.</p>
          </div>

          {sent ? (
            <div className="bg-cream/5 border border-cream/20 p-8 text-center">
              <p className="text-2xl font-display mb-3">Merci !</p>
              <p className="text-cream/80 mb-6">Votre demande a été envoyée à {sent.ok} prestataire{sent.ok > 1 ? "s" : ""}. Ils vous répondront par email dans les 48h.</p>
              <button onClick={() => navigate("/partenaires")} className="btn-editorial">
                Retour aux prestataires
              </button>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Nom *" error={form.formState.errors.name?.message}>
                  <input
                    {...form.register("name")}
                    type="text"
                    className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-cream focus:outline-none focus:border-gold"
                    data-testid="bulk-name"
                  />
                </Field>
                <Field label="Email *" error={form.formState.errors.email?.message}>
                  <input
                    {...form.register("email")}
                    type="email"
                    className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-cream focus:outline-none focus:border-gold"
                    data-testid="bulk-email"
                  />
                </Field>
                <Field label="Téléphone">
                  <input
                    {...form.register("phone")}
                    type="tel"
                    className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-cream focus:outline-none focus:border-gold"
                  />
                </Field>
                <Field label="Date du mariage">
                  <input
                    {...form.register("weddingDate")}
                    type="date"
                    className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-cream focus:outline-none focus:border-gold"
                  />
                </Field>
              </div>
              <Field label="Votre projet *" error={form.formState.errors.message?.message}>
                <textarea
                  {...form.register("message")}
                  rows={5}
                  placeholder="Date envisagée, lieu, nombre d'invités, attentes…"
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
                  Envoyer aux {vendors.length} prestataires
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
    <div className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium border-t border-wine-deep/10 pt-4 self-start">
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
