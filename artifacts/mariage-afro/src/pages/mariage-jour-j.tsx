import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Heart, Loader2, Clock, UtensilsCrossed, Users, ImageIcon, ExternalLink } from "lucide-react";

interface JourJPublicData {
  id: number;
  slug: string;
  title: string;
  weddingDate: string | null;
  partner1Name: string;
  partner2Name: string;
  menuText: string;
  timeline: { time: string; label: string }[];
  bioPartner1: string;
  bioPartner2: string;
  driveUrl: string | null;
  enabled: boolean;
}

const PRIMARY = "#68191e";
const CREAM = "#fff4e4";

export default function MariageJourJPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, isError } = useQuery<JourJPublicData>({
    queryKey: ["wedding-jour-j-public", slug],
    queryFn: async () => {
      const res = await fetch(`/api/wedding/${slug}/jour-j`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (data) {
      document.title = `${data.partner1Name} & ${data.partner2Name} — Jour J`;
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: CREAM }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: PRIMARY }} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6"
        style={{ background: CREAM }}
      >
        <Heart className="w-16 h-16" style={{ color: PRIMARY, opacity: 0.25 }} />
        <h1 className="text-2xl font-bold font-serif" style={{ color: PRIMARY }}>
          {t("mariage_jour_j.not_found_title")}
        </h1>
        <p className="text-neutral-600 max-w-xs text-sm">
          {t("mariage_jour_j.not_found_desc")}
        </p>
        <Link to="/" className="text-sm underline" style={{ color: PRIMARY }}>
          {t("mariage_jour_j.back_home")}
        </Link>
      </div>
    );
  }

  const formattedDate = data.weddingDate
    ? new Date(data.weddingDate).toLocaleDateString("fr-BE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen font-sans" style={{ background: CREAM }}>
      {/* Hero */}
      <div
        className="text-center py-16 px-6"
        style={{ background: PRIMARY, color: CREAM }}
      >
        <div className="flex items-center justify-center gap-2 mb-4 opacity-60">
          <Heart className="w-3 h-3" fill="currentColor" />
          <span className="text-xs uppercase tracking-widest">{t("mariage_jour_j.day_label")}</span>
          <Heart className="w-3 h-3" fill="currentColor" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight tracking-tight">
          {data.partner1Name}
        </h1>
        <p className="my-3 text-2xl font-serif opacity-50">&amp;</p>
        <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight tracking-tight">
          {data.partner2Name}
        </h1>
        {formattedDate && (
          <p className="mt-6 text-xs tracking-widest uppercase opacity-70">{formattedDate}</p>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-5 py-10 space-y-14">
        {/* Timeline */}
        {data.timeline.length > 0 && (
          <section>
            <SectionHeader icon={<Clock className="w-4 h-4" />} label={t("mariage_jour_j.timeline_title")} />
            <div className="bg-white/70 border border-neutral-200 divide-y divide-neutral-100">
              {data.timeline.map((step, i) => (
                <div key={i} className="flex items-start gap-4 px-5 py-3">
                  <span
                    className="font-bold tabular-nums text-sm w-14 shrink-0 mt-0.5"
                    style={{ color: PRIMARY }}
                  >
                    {step.time}
                  </span>
                  <span className="text-sm text-neutral-700">{step.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Menu */}
        {data.menuText && (
          <section>
            <SectionHeader icon={<UtensilsCrossed className="w-4 h-4" />} label={t("mariage_jour_j.menu_title")} />
            <div className="bg-white/70 border border-neutral-200 p-5 text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
              {data.menuText}
            </div>
          </section>
        )}

        {/* Bios */}
        {(data.bioPartner1 || data.bioPartner2) && (
          <section>
            <SectionHeader icon={<Users className="w-4 h-4" />} label={t("mariage_jour_j.bio_title")} />
            <div className="grid sm:grid-cols-2 gap-4">
              {data.bioPartner1 && (
                <div className="bg-white/70 border border-neutral-200 p-5">
                  <p
                    className="text-xs uppercase tracking-widest mb-3 font-bold"
                    style={{ color: PRIMARY }}
                  >
                    {data.partner1Name}
                  </p>
                  <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                    {data.bioPartner1}
                  </p>
                </div>
              )}
              {data.bioPartner2 && (
                <div className="bg-white/70 border border-neutral-200 p-5">
                  <p
                    className="text-xs uppercase tracking-widest mb-3 font-bold"
                    style={{ color: PRIMARY }}
                  >
                    {data.partner2Name}
                  </p>
                  <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                    {data.bioPartner2}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Gallery / Drive */}
        {data.driveUrl && (
          <section>
            <SectionHeader icon={<ImageIcon className="w-4 h-4" />} label={t("mariage_jour_j.gallery_title")} />
            <a
              href={data.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-white/70 border border-neutral-200 p-5 transition-colors hover:border-neutral-400 group"
            >
              <div
                className="w-10 h-10 flex items-center justify-center shrink-0"
                style={{ background: PRIMARY + "15" }}
              >
                <ImageIcon className="w-5 h-5" style={{ color: PRIMARY }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: PRIMARY }}>
                  {t("mariage_jour_j.gallery_open")}
                </p>
                <p className="text-xs text-neutral-500 truncate mt-0.5">{data.driveUrl}</p>
              </div>
              <ExternalLink className="w-4 h-4 shrink-0 text-neutral-400 group-hover:text-neutral-600" />
            </a>
          </section>
        )}
      </div>

      {/* CTA Footer */}
      <div className="border-t border-neutral-200 py-10 text-center px-6">
        <p className="text-xs text-neutral-400 mb-4 uppercase tracking-widest">
          {t("mariage_jour_j.footer_made_with")} ♥{" "}
          <span style={{ color: PRIMARY }}>Mariage Afro</span>
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 text-xs uppercase tracking-widest font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: PRIMARY }}
        >
          {t("mariage_jour_j.cta_btn")}
        </Link>
      </div>
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span style={{ color: PRIMARY }}>{icon}</span>
      <h2
        className="text-xs uppercase tracking-widest font-bold"
        style={{ color: PRIMARY }}
      >
        {label}
      </h2>
      <div className="flex-1 h-px bg-neutral-200" />
    </div>
  );
}
