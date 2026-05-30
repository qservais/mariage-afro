import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Heart, Loader2, ExternalLink, Gift } from "lucide-react";
import QRCode from "qrcode";

interface Cagnotte {
  id: number;
  title: string;
  description: string;
  photo: string | null;
  iban: string | null;
  externalUrl: string | null;
}

import { storageUrlOrEmpty as objectUrl } from "@/lib/storage-url";

function QrPreview({ value }: { value: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => { QRCode.toDataURL(value, { margin: 1, width: 180 }).then(setSrc).catch(() => setSrc("")); }, [value]);
  return src ? <img src={src} alt="QR code IBAN pour virement" width={160} height={160} loading="lazy" decoding="async" className="w-40 h-40 border border-border bg-white p-2" /> : null;
}

export default function MariageCagnottePage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();

  const { data: site } = useQuery({
    queryKey: ["wedding-public", slug],
    queryFn: async () => { const r = await fetch(`/api/wedding/${slug}`); if (!r.ok) throw new Error("nf"); return r.json(); },
    enabled: !!slug,
  });
  const { data: cagnottes = [], isLoading } = useQuery<Cagnotte[]>({
    queryKey: ["wedding-cagnottes", slug],
    queryFn: async () => { const r = await fetch(`/api/wedding/${slug}/cagnottes`); if (!r.ok) throw new Error("nf"); return r.json(); },
    enabled: !!slug,
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-cream-soft">
      <section className="py-16 text-center bg-foreground">
        <Gift className="w-10 h-10 text-primary mx-auto mb-3" />
        <h1 className="text-3xl md:text-4xl font-bold font-serif text-white">{t("mariage_cagnotte.title")}</h1>
        {site?.title && <p className="text-white/70 text-sm mt-2">{site.title}</p>}
      </section>

      <section className="py-12 px-6 max-w-3xl mx-auto space-y-6">
        <p className="text-center text-muted-foreground">{t("mariage_cagnotte.intro")}</p>

        {cagnottes.length === 0 && (
          <div className="bg-cream border border-dashed border-border p-10 text-center text-muted-foreground">
            <Heart className="w-10 h-10 mx-auto mb-3 text-primary/40" />
            {t("mariage_cagnotte.empty")}
          </div>
        )}

        {cagnottes.map((c) => (
          <article key={c.id} className="bg-cream border border-border p-6 flex flex-col md:flex-row gap-6">
            {c.photo && <img src={objectUrl(c.photo)} alt={c.title} width={400} height={176} loading="lazy" decoding="async" className="w-full md:w-44 h-44 object-cover" />}
            <div className="flex-1 space-y-3">
              <h2 className="text-xl font-bold font-serif text-foreground">{c.title}</h2>
              {c.description && <p className="text-sm text-foreground/80 leading-relaxed">{c.description}</p>}
              {c.iban && (
                <div className="text-sm">
                  <span className="text-muted-foreground">IBAN : </span>
                  <span className="font-mono text-foreground">{c.iban}</span>
                </div>
              )}
              {c.externalUrl && (
                <a href={c.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs uppercase tracking-wider hover:bg-primary/90">
                  <ExternalLink className="w-3.5 h-3.5" /> {t("mariage_cagnotte.contribute")}
                </a>
              )}
            </div>
            {c.iban && <QrPreview value={`BCD\n002\n1\nSCT\n\n${c.iban.replace(/\s/g, "")}\n\n\n${c.title}`} />}
          </article>
        ))}

        <p className="text-center pt-6">
          <Link to={`/mariage/${slug}`} className="text-sm text-primary hover:underline">← {t("mariage_cagnotte.back_to_site")}</Link>
        </p>
      </section>
    </div>
  );
}
