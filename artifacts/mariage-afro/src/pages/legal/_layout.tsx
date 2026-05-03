import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";

type Section = { h: string; p?: string | string[]; ul?: string[] };

type LegalNs = "mentions" | "privacy" | "cookies";

const PATH: Record<LegalNs, string> = {
  mentions: "/mentions-legales",
  privacy: "/confidentialite",
  cookies: "/cookies",
};

export function LegalPage({ ns }: { ns: LegalNs }) {
  const { t } = useTranslation();
  const title = t(`legal.${ns}.title`);
  const intro = t(`legal.${ns}.intro`);
  const sections = t(`legal.${ns}.sections`, { returnObjects: true }) as Section[];

  return (
    <>
      <SEO
        title={`${title} — Mariage Afro`}
        description={intro}
        path={PATH[ns]}
      />
      <article className="bg-cream py-20 md:py-28">
        <div className="container mx-auto px-6 max-w-3xl">
          <Link
            to="/"
            className="inline-block text-[11px] font-medium uppercase tracking-[0.3em] text-wine-deep/60 hover:text-wine-deep transition-colors"
          >
            ← {t("legal.common.back_home")}
          </Link>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-wine-deep mt-6 mb-3 leading-tight">
            {title}
          </h1>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-wine-deep/50 mb-10">
            {t("legal.common.last_updated")}
          </p>
          <p className="text-base md:text-lg text-wine-deep/80 leading-relaxed mb-12">
            {intro}
          </p>

          {Array.isArray(sections) &&
            sections.map((s, i) => (
              <section key={i} className="mb-10">
                <h2 className="font-display text-2xl md:text-3xl text-wine-deep mb-4">
                  {s.h}
                </h2>
                {Array.isArray(s.p) ? (
                  s.p.map((para, j) => (
                    <p
                      key={j}
                      className="text-wine-deep/80 leading-relaxed mb-3"
                    >
                      {para}
                    </p>
                  ))
                ) : s.p ? (
                  <p className="text-wine-deep/80 leading-relaxed mb-3">{s.p}</p>
                ) : null}
                {s.ul && (
                  <ul className="list-disc pl-6 space-y-1.5 text-wine-deep/80 marker:text-gold-deep">
                    {s.ul.map((li, k) => (
                      <li key={k} className="leading-relaxed">
                        {li}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
        </div>
      </article>
    </>
  );
}
