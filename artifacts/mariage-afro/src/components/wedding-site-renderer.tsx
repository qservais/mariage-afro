import { MapPin, CalendarDays, Heart, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  WEDDING_TEMPLATES,
  applyPaletteOverrides,
  normalizeTemplate,
  type WeddingTemplateId,
  type WeddingTemplatePalette,
} from "@/lib/wedding-templates";

export interface WeddingSiteData {
  slug: string;
  title: string;
  welcomeMessage: string;
  weddingDate: string | null;
  venue: string | null;
  city: string | null;
  programme: { time: string; event: string }[];
  rsvpEnabled: boolean;
  colorPrimary?: string | null;
  colorBackground?: string | null;
  fontHeading?: string | null;
}

const LOCALE_MAP: Record<string, string> = { fr: "fr-BE", nl: "nl-BE", en: "en-GB" };

interface RendererProps {
  site: WeddingSiteData;
  template: WeddingTemplateId | string | null | undefined;
  /** When true, internal links (RSVP, cagnotte) are rendered as inert spans. */
  preview?: boolean;
}

interface LayoutProps {
  site: WeddingSiteData;
  slug: string;
  formattedDate: string | null;
  palette: WeddingTemplatePalette;
  preview: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export function WeddingSiteRenderer({ site, template, preview = false }: RendererProps) {
  const { t, i18n } = useTranslation();
  const dateLocale =
    LOCALE_MAP[(i18n.resolvedLanguage || i18n.language || "fr").split("-")[0]] || "fr-BE";

  const templateId: WeddingTemplateId = normalizeTemplate(template);
  const palette = applyPaletteOverrides(WEDDING_TEMPLATES[templateId], {
    colorPrimary: site.colorPrimary,
    colorBackground: site.colorBackground,
    fontHeading: site.fontHeading,
  });

  const formattedDate = site.weddingDate
    ? new Date(site.weddingDate).toLocaleDateString(dateLocale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const layoutProps: LayoutProps = {
    site,
    slug: site.slug || "preview",
    formattedDate,
    palette,
    preview,
    t,
  };

  const Layout =
    templateId === "boheme"
      ? BohemeLayout
      : templateId === "moderne"
        ? ModerneLayout
        : templateId === "tropical"
          ? TropicalLayout
          : RoyalAfroLayout;

  return (
    <div
      data-template={templateId}
      data-testid={`wedding-template-${templateId}`}
      style={{
        backgroundColor: palette.bg,
        color: palette.ink,
        fontFamily: palette.fontBody,
      }}
      className="min-h-full"
    >
      <Layout {...layoutProps} />
    </div>
  );
}

/* ---------------- Shared blocks ---------------- */

function MessageBlock({ site, palette }: LayoutProps) {
  if (!site.welcomeMessage) return null;
  return (
    <section className="py-20 px-6 max-w-2xl mx-auto text-center">
      <Heart className="w-8 h-8 mx-auto mb-6" style={{ color: palette.accent }} />
      <p
        className="text-lg md:text-xl leading-relaxed italic"
        style={{ color: palette.inkSoft, fontFamily: palette.fontHeading }}
      >
        “{site.welcomeMessage}”
      </p>
    </section>
  );
}

function ProgrammeBlock({ site, palette, t }: LayoutProps) {
  if (!site.programme?.length) return null;
  return (
    <section className="py-16" style={{ backgroundColor: palette.surface }}>
      <div className="max-w-xl mx-auto px-6">
        <h2
          className="text-2xl font-bold text-center mb-12"
          style={{ fontFamily: palette.fontHeading, color: palette.ink }}
        >
          {t("mariage_public.programme_title")}
        </h2>
        <div className="relative">
          <div
            className="absolute left-6 top-0 bottom-0 w-px"
            style={{ backgroundColor: palette.divider }}
          />
          <div className="space-y-8">
            {site.programme.map((item, i) => (
              <div key={i} className="flex gap-6 pl-14 relative">
                <div
                  className="absolute left-4 top-1 w-4 h-4 rounded-full border-2"
                  style={{ borderColor: palette.accent, backgroundColor: palette.surface }}
                />
                <div>
                  <div
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-1"
                    style={{ color: palette.accent }}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {item.time}
                  </div>
                  <p className="font-medium" style={{ color: palette.ink }}>
                    {item.event}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RsvpBlock({ site, slug, formattedDate, palette, preview, t }: LayoutProps) {
  if (!site.rsvpEnabled) return null;
  const ctaCommon = {
    className:
      "inline-flex items-center justify-center w-full h-12 font-bold uppercase tracking-wider text-sm px-6 transition-opacity hover:opacity-90",
    style: { backgroundColor: palette.accent, color: palette.hero.title },
    "data-testid": "link-rsvp-cta",
  };
  return (
    <section className="py-20 px-6 max-w-lg mx-auto">
      <h2
        className="text-2xl font-bold text-center mb-4"
        style={{ fontFamily: palette.fontHeading, color: palette.ink }}
      >
        {t("mariage_public.rsvp_title")}
      </h2>
      <p className="text-center mb-10 text-sm" style={{ color: palette.inkSoft }}>
        {formattedDate
          ? t("mariage_public.rsvp_subtitle_with_date", { date: formattedDate })
          : t("mariage_public.rsvp_subtitle_no_date")}
      </p>
      <div
        className="p-10 text-center space-y-5 border"
        style={{ backgroundColor: palette.surface, borderColor: palette.divider }}
      >
        <p className="text-sm" style={{ color: palette.inkSoft }}>
          {t("mariage_public.rsvp_cta_desc")}
        </p>
        {preview ? (
          <span {...ctaCommon}>{t("mariage_public.rsvp_cta_button")}</span>
        ) : (
          <a href={`/mariage/${slug}/rsvp`} {...ctaCommon}>
            {t("mariage_public.rsvp_cta_button")}
          </a>
        )}
      </div>
    </section>
  );
}

function CagnotteFooter({ slug, palette, preview, t }: LayoutProps) {
  const linkClass = "inline-flex items-center gap-2 text-sm uppercase tracking-wider hover:underline";
  const linkStyle = { color: palette.accent };
  return (
    <>
      <section
        className="py-12 text-center"
        style={{ backgroundColor: palette.accentSoft }}
      >
        {preview ? (
          <span className={linkClass} style={linkStyle}>
            🎁 {t("mariage_public.cagnotte_link")}
          </span>
        ) : (
          <a href={`/mariage/${slug}/cagnotte`} className={linkClass} style={linkStyle}>
            🎁 {t("mariage_public.cagnotte_link")}
          </a>
        )}
      </section>
      <footer
        className="py-8 text-center border-t"
        style={{ borderColor: palette.divider }}
      >
        <p className="text-xs" style={{ color: palette.inkSoft }}>
          {t("mariage_public.footer_made_with")}{" "}
          {preview ? (
            <span style={{ color: palette.accent }}>Mariage Afro</span>
          ) : (
            <a href="/" className="hover:underline" style={{ color: palette.accent }}>
              Mariage Afro
            </a>
          )}{" "}
          · {t("mariage_public.footer_tagline")}
        </p>
      </footer>
    </>
  );
}

function HeroMeta({ site, formattedDate, palette }: LayoutProps) {
  return (
    <>
      {formattedDate && (
        <div
          className="flex items-center justify-center gap-2 text-sm"
          style={{ color: palette.hero.meta }}
        >
          <CalendarDays className="w-4 h-4" />
          <span className="capitalize">{formattedDate}</span>
        </div>
      )}
      {(site.venue || site.city) && (
        <div
          className="flex items-center justify-center gap-2 text-sm mt-2"
          style={{ color: palette.hero.meta }}
        >
          <MapPin className="w-4 h-4" />
          <span>{[site.venue, site.city].filter(Boolean).join(" · ")}</span>
        </div>
      )}
    </>
  );
}

/* ---------------- 4 layouts ---------------- */

function RoyalAfroLayout(props: LayoutProps) {
  const { site, palette, t } = props;
  return (
    <>
      <section
        className="relative py-32 text-center overflow-hidden"
        style={{ backgroundColor: palette.hero.bg }}
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 px-6">
          <p
            className="text-xs uppercase tracking-[0.4em] font-bold mb-6"
            style={{ color: palette.hero.eyebrow }}
          >
            {t("mariage_public.eyebrow")}
          </p>
          <h1
            className="text-5xl md:text-7xl font-bold leading-tight mb-8"
            style={{ fontFamily: palette.fontHeading, color: palette.hero.title }}
          >
            {site.title}
          </h1>
          <HeroMeta {...props} />
        </div>
      </section>
      <MessageBlock {...props} />
      <ProgrammeBlock {...props} />
      <RsvpBlock {...props} />
      <CagnotteFooter {...props} />
    </>
  );
}

function BohemeLayout(props: LayoutProps) {
  const { site, palette, t } = props;
  return (
    <>
      <section
        className="relative py-36 text-center overflow-hidden"
        style={{ backgroundColor: palette.hero.bg }}
      >
        <svg
          className="absolute inset-x-0 top-8 mx-auto opacity-50"
          width="320"
          height="40"
          viewBox="0 0 320 40"
          aria-hidden="true"
        >
          <path
            d="M10 30 Q 80 0 160 24 T 310 18"
            stroke={palette.hero.eyebrow}
            strokeWidth="1"
            fill="none"
          />
        </svg>
        <div className="relative z-10 px-6">
          <p
            className="text-xs italic tracking-[0.3em] mb-6"
            style={{ color: palette.hero.eyebrow, fontFamily: palette.fontHeading }}
          >
            {t("mariage_public.eyebrow")}
          </p>
          <h1
            className="text-6xl md:text-8xl italic leading-none mb-10"
            style={{ fontFamily: palette.fontHeading, color: palette.hero.title }}
          >
            {site.title}
          </h1>
          <HeroMeta {...props} />
        </div>
      </section>
      <MessageBlock {...props} />
      <ProgrammeBlock {...props} />
      <RsvpBlock {...props} />
      <CagnotteFooter {...props} />
    </>
  );
}

function ModerneLayout(props: LayoutProps) {
  const { site, palette, t } = props;
  return (
    <>
      <section
        className="relative min-h-[70vh] flex flex-col items-center justify-center text-center px-6"
        style={{ backgroundColor: palette.hero.bg }}
      >
        <div
          className="w-12 h-px mb-10"
          style={{ backgroundColor: palette.hero.eyebrow }}
        />
        <p
          className="text-[10px] uppercase tracking-[0.6em] mb-8"
          style={{ color: palette.hero.eyebrow }}
        >
          {t("mariage_public.eyebrow")}
        </p>
        <h1
          className="text-6xl md:text-8xl font-light tracking-tight mb-12 max-w-4xl"
          style={{ fontFamily: palette.fontHeading, color: palette.hero.title }}
        >
          {site.title}
        </h1>
        <div
          className="w-12 h-px mb-8"
          style={{ backgroundColor: palette.hero.eyebrow }}
        />
        <HeroMeta {...props} />
      </section>
      <MessageBlock {...props} />
      <ProgrammeBlock {...props} />
      <RsvpBlock {...props} />
      <CagnotteFooter {...props} />
    </>
  );
}

function TropicalLayout(props: LayoutProps) {
  const { site, palette, t } = props;
  return (
    <>
      <section
        className="relative py-32 text-center overflow-hidden"
        style={{ backgroundColor: palette.hero.bg }}
      >
        <svg
          className="absolute left-0 bottom-0 opacity-40"
          width="220"
          height="220"
          viewBox="0 0 220 220"
          aria-hidden="true"
        >
          <path
            d="M20 220 Q 60 120 50 20"
            stroke={palette.hero.eyebrow}
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M40 220 Q 80 130 90 40"
            stroke={palette.hero.eyebrow}
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
        <svg
          className="absolute right-0 bottom-0 opacity-40 scale-x-[-1]"
          width="220"
          height="220"
          viewBox="0 0 220 220"
          aria-hidden="true"
        >
          <path
            d="M20 220 Q 60 120 50 20"
            stroke={palette.hero.eyebrow}
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M40 220 Q 80 130 90 40"
            stroke={palette.hero.eyebrow}
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
        <div className="relative z-10 px-6">
          <p
            className="text-xs uppercase tracking-[0.5em] font-bold mb-6"
            style={{ color: palette.hero.eyebrow }}
          >
            {t("mariage_public.eyebrow")}
          </p>
          <h1
            className="text-5xl md:text-7xl font-bold leading-tight mb-8"
            style={{ fontFamily: palette.fontHeading, color: palette.hero.title }}
          >
            {site.title}
          </h1>
          <HeroMeta {...props} />
        </div>
      </section>
      <MessageBlock {...props} />
      <ProgrammeBlock {...props} />
      <RsvpBlock {...props} />
      <CagnotteFooter {...props} />
    </>
  );
}
