import type { ReactNode } from "react";

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
    bg: "#faf9f7",
    surface: "#ffffff",
    ink: "#1f1416",
    inkSoft: "rgba(31,20,22,0.7)",
    accent: "#68191e",
    accentSoft: "rgba(104,25,30,0.18)",
    divider: "rgba(104,25,30,0.18)",
    hero: {
      bg: "#1f1416",
      eyebrow: "#c9a96e",
      title: "#fff4e4",
      meta: "rgba(255,244,228,0.72)",
    },
    fontHeading: "'Cormorant Garamond', serif",
    fontBody: "'Montserrat', sans-serif",
  },
  boheme: {
    bg: "#fff4e4",
    surface: "#fffaf1",
    ink: "#3b2a1d",
    inkSoft: "rgba(59,42,29,0.7)",
    accent: "#8a6d3b",
    accentSoft: "rgba(138,109,59,0.18)",
    divider: "rgba(138,109,59,0.22)",
    hero: {
      bg: "#fff4e4",
      eyebrow: "#8a6d3b",
      title: "#3b2a1d",
      meta: "rgba(59,42,29,0.65)",
    },
    fontHeading: "'Cormorant Garamond', serif",
    fontBody: "'Montserrat', sans-serif",
  },
  moderne: {
    bg: "#ffffff",
    surface: "#f7f7f5",
    ink: "#101010",
    inkSoft: "rgba(16,16,16,0.66)",
    accent: "#c9a96e",
    accentSoft: "rgba(201,169,110,0.22)",
    divider: "rgba(16,16,16,0.12)",
    hero: {
      bg: "#101010",
      eyebrow: "#c9a96e",
      title: "#ffffff",
      meta: "rgba(255,255,255,0.68)",
    },
    fontHeading: "'Montserrat', sans-serif",
    fontBody: "'Montserrat', sans-serif",
  },
  tropical: {
    bg: "#f4f8f3",
    surface: "#ffffff",
    ink: "#0f2e22",
    inkSoft: "rgba(15,46,34,0.7)",
    accent: "#1e5b3a",
    accentSoft: "rgba(30,91,58,0.16)",
    divider: "rgba(30,91,58,0.22)",
    hero: {
      bg: "#0f2e22",
      eyebrow: "#ff8a65",
      title: "#fff4e4",
      meta: "rgba(255,244,228,0.75)",
    },
    fontHeading: "'Cormorant Garamond', serif",
    fontBody: "'Montserrat', sans-serif",
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
