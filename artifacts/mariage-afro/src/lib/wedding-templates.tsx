import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand-colors";

const T = {
  boheme: {
    bg:        "var(--color-tmpl-boheme-surface)",
    ink:       "var(--color-tmpl-boheme-ink)",
    accentSoft:"rgba(138,109,59,0.18)", divider: "rgba(138,109,59,0.22)", heroMeta: "rgba(59,42,29,0.65)",
  },
  moderne: {
    bg:    "var(--color-tmpl-moderne-surface)",
    ink:   "var(--color-tmpl-moderne-ink)",
    hero:  "var(--color-tmpl-moderne-ink)",
    accentSoft: "rgba(201,169,110,0.22)", divider: "rgba(16,16,16,0.12)", inkSoft: "rgba(16,16,16,0.66)", heroMeta: "rgba(255,255,255,0.68)",
  },
  tropical: {
    bg:      "var(--color-tmpl-tropical-bg)",
    ink:     "var(--color-tmpl-tropical-ink)",
    accent:  "var(--color-tmpl-tropical-accent)",
    hero:    "var(--color-tmpl-tropical-ink)",
    eyebrow: "var(--color-tmpl-tropical-eyebrow)",
    accentSoft: "rgba(30,91,58,0.16)", divider: "rgba(30,91,58,0.22)", inkSoft: "rgba(15,46,34,0.7)", heroMeta: "rgba(255,244,228,0.75)",
  },
} as const;

export type WeddingTemplateId = "royal-afro" | "boheme" | "moderne" | "tropical";

export const WEDDING_TEMPLATE_IDS: WeddingTemplateId[] = [
  "royal-afro",
  "boheme",
  "moderne",
  "tropical",
];

export const DEFAULT_TEMPLATE: WeddingTemplateId = "royal-afro";

export function normalizeTemplate(value: unknown): WeddingTemplateId {
  return WEDDING_TEMPLATE_IDS.includes(value as WeddingTemplateId)
    ? (value as WeddingTemplateId)
    : DEFAULT_TEMPLATE;
}

export type WeddingFontHeading = "serif" | "sans" | "display";

export const WEDDING_FONT_HEADINGS: WeddingFontHeading[] = ["serif", "sans", "display"];

export const WEDDING_HEADING_FONT_STACKS: Record<WeddingFontHeading, string> = {
  serif: "'Cormorant Garamond', serif",
  sans: "'Montserrat', sans-serif",
  display: "'Playfair Display', serif",
};

function isHexColor(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
}

export interface WeddingPaletteOverrides {
  colorPrimary?: string | null;
  colorBackground?: string | null;
  fontHeading?: string | null;
}

export function applyPaletteOverrides(
  base: WeddingTemplatePalette,
  overrides: WeddingPaletteOverrides | null | undefined,
): WeddingTemplatePalette {
  if (!overrides) return base;
  const out: WeddingTemplatePalette = {
    ...base,
    hero: { ...base.hero },
  };
  if (isHexColor(overrides.colorPrimary)) {
    const c = overrides.colorPrimary;
    out.accent = c;
    out.accentSoft = hexToRgba(c, 0.18);
    out.divider = hexToRgba(c, 0.22);
  }
  if (isHexColor(overrides.colorBackground)) {
    out.bg = overrides.colorBackground;
  }
  if (
    typeof overrides.fontHeading === "string" &&
    (WEDDING_FONT_HEADINGS as string[]).includes(overrides.fontHeading)
  ) {
    out.fontHeading = WEDDING_HEADING_FONT_STACKS[overrides.fontHeading as WeddingFontHeading];
  }
  return out;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export interface WeddingTemplatePalette {
  bg: string;
  surface: string;
  ink: string;
  inkSoft: string;
  accent: string;
  accentSoft: string;
  divider: string;
  hero: { bg: string; eyebrow: string; title: string; meta: string };
  fontHeading: string;
  fontBody: string;
}

export const WEDDING_TEMPLATES: Record<WeddingTemplateId, WeddingTemplatePalette> = {
  "royal-afro": {
    bg:        BRAND.creamSoft,
    surface:   BRAND.white,
    ink:       BRAND.primary,
    inkSoft:   "rgba(31,20,22,0.7)",
    accent:    BRAND.secondary,
    accentSoft:"rgba(104,25,30,0.18)",
    divider:   "rgba(104,25,30,0.18)",
    hero: {
      bg:      BRAND.primary,
      eyebrow: BRAND.accent,
      title:   BRAND.surface,
      meta:    "rgba(255,244,228,0.72)",
    },
    fontHeading: "'Cormorant Garamond', serif",
    fontBody:    "'Montserrat', sans-serif",
  },
  boheme: {
    bg:        BRAND.surface,
    surface:   T.boheme.bg,
    ink:       T.boheme.ink,
    inkSoft:   "rgba(59,42,29,0.7)",
    accent:    BRAND.accentDeep,
    accentSoft:T.boheme.accentSoft,
    divider:   T.boheme.divider,
    hero: {
      bg:      BRAND.surface,
      eyebrow: BRAND.accentDeep,
      title:   T.boheme.ink,
      meta:    T.boheme.heroMeta,
    },
    fontHeading: "'Cormorant Garamond', serif",
    fontBody:    "'Montserrat', sans-serif",
  },
  moderne: {
    bg:        BRAND.white,
    surface:   T.moderne.bg,
    ink:       T.moderne.ink,
    inkSoft:   T.moderne.inkSoft,
    accent:    BRAND.accent,
    accentSoft:T.moderne.accentSoft,
    divider:   T.moderne.divider,
    hero: {
      bg:      T.moderne.hero,
      eyebrow: BRAND.accent,
      title:   BRAND.white,
      meta:    T.moderne.heroMeta,
    },
    fontHeading: "'Montserrat', sans-serif",
    fontBody:    "'Montserrat', sans-serif",
  },
  tropical: {
    bg:        T.tropical.bg,
    surface:   BRAND.white,
    ink:       T.tropical.ink,
    inkSoft:   T.tropical.inkSoft,
    accent:    T.tropical.accent,
    accentSoft:T.tropical.accentSoft,
    divider:   T.tropical.divider,
    hero: {
      bg:      T.tropical.hero,
      eyebrow: T.tropical.eyebrow,
      title:   BRAND.surface,
      meta:    T.tropical.heroMeta,
    },
    fontHeading: "'Cormorant Garamond', serif",
    fontBody:    "'Montserrat', sans-serif",
  },
};

export function TemplateThumbnail({
  id,
  className,
}: {
  id: WeddingTemplateId;
  className?: string;
}): ReactNode {
  const p = WEDDING_TEMPLATES[id];
  return (
    <svg
      viewBox="0 0 240 160"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="240" height="160" fill={p.bg} />
      <rect x="0" y="0" width="240" height="92" fill={p.hero.bg} />
      {id === "royal-afro" && (
        <>
          <circle cx="120" cy="40" r="14" fill="none" stroke={p.hero.eyebrow} strokeWidth="1.2" />
          <circle cx="120" cy="40" r="7" fill="none" stroke={p.hero.eyebrow} strokeWidth="0.8" />
          <line x1="60" y1="86" x2="180" y2="86" stroke={p.hero.eyebrow} strokeWidth="0.6" />
        </>
      )}
      {id === "boheme" && (
        <>
          <path d="M40 78 Q80 50 120 78 T200 78" stroke={p.hero.eyebrow} strokeWidth="1" fill="none" />
          <circle cx="60" cy="32" r="3" fill={p.hero.eyebrow} opacity="0.6" />
          <circle cx="190" cy="48" r="2" fill={p.hero.eyebrow} opacity="0.6" />
        </>
      )}
      {id === "moderne" && (
        <>
          <line x1="40" y1="46" x2="200" y2="46" stroke={p.hero.eyebrow} strokeWidth="0.5" />
          <line x1="40" y1="62" x2="200" y2="62" stroke={p.hero.eyebrow} strokeWidth="0.5" />
        </>
      )}
      {id === "tropical" && (
        <>
          <path d="M20 92 Q35 60 50 92" fill="none" stroke={p.hero.eyebrow} strokeWidth="1.2" />
          <path d="M30 92 Q42 70 56 92" fill="none" stroke={p.hero.eyebrow} strokeWidth="0.9" />
          <path d="M190 92 Q205 60 220 92" fill="none" stroke={p.hero.eyebrow} strokeWidth="1.2" />
          <path d="M200 92 Q212 70 224 92" fill="none" stroke={p.hero.eyebrow} strokeWidth="0.9" />
        </>
      )}
      <text
        x="120"
        y="50"
        textAnchor="middle"
        fontFamily={p.fontHeading}
        fontSize="22"
        fontWeight="600"
        fill={p.hero.title}
      >
        A &amp; B
      </text>
      <text
        x="120"
        y="68"
        textAnchor="middle"
        fontFamily={p.fontBody}
        fontSize="6"
        letterSpacing="2"
        fill={p.hero.meta}
      >
        15 · 06 · 2026
      </text>
      <rect x="20" y="104" width="200" height="6" fill={p.accentSoft} />
      <rect x="20" y="116" width="140" height="4" fill={p.accentSoft} />
      <rect x="20" y="126" width="170" height="4" fill={p.accentSoft} />
      <rect x="80" y="140" width="80" height="10" fill={p.accent} />
    </svg>
  );
}
