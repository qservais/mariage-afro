import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://www.mariage-afro.com";
const SITE_NAME = "Mariage Afro";
const DEFAULT_OG = `${SITE_URL}/opengraph.jpg`;

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface SEOProps {
  /** Page title (will be suffixed with " — Mariage Afro" if not already present) */
  title: string;
  /** Meta description (~150 chars) */
  description: string;
  /** Optional absolute path override (defaults to current pathname); e.g. "/partenaires" */
  path?: string;
  /** Optional OG image URL (absolute). Defaults to /opengraph.jpg */
  image?: string;
  /** Optional og:type (defaults to "website") */
  type?: "website" | "article" | "profile";
  /** Optional breadcrumb trail for BreadcrumbList JSON-LD */
  breadcrumbs?: BreadcrumbItem[];
  /** Optional additional JSON-LD object (will be JSON-stringified) */
  jsonLd?: Record<string, unknown>;
}

function setMeta(selector: string, attr: "content" | "href", value: string) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    if (selector.startsWith('meta[')) {
      el = document.createElement("meta");
      const m = selector.match(/\[(name|property)="([^"]+)"\]/);
      if (m) el.setAttribute(m[1], m[2]);
    } else if (selector.startsWith('link[')) {
      el = document.createElement("link");
      const m = selector.match(/\[rel="([^"]+)"(?:\]\[hreflang="([^"]+)")?/);
      if (m) {
        el.setAttribute("rel", m[1]);
        if (m[2]) el.setAttribute("hreflang", m[2]);
      }
    }
    if (el) document.head.appendChild(el);
  }
  if (el) el.setAttribute(attr, value);
}

function setHreflang(lang: string, href: string) {
  const selector = `link[rel="alternate"][hreflang="${lang}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "alternate");
    el.setAttribute("hreflang", lang);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(id: string, data: unknown) {
  let el = document.head.querySelector<HTMLScriptElement>(`script[type="application/ld+json"][data-seo="${id}"]`);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-seo", id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd(id: string) {
  const el = document.head.querySelector(`script[type="application/ld+json"][data-seo="${id}"]`);
  if (el) el.remove();
}

/**
 * Per-route SEO injector for SPA. Updates document.head with title, description,
 * canonical, OG, Twitter, hreflang and optional JSON-LD on mount and when props change.
 *
 * Usage: drop `<SEO title="..." description="..." />` at the top of any public page.
 * Path defaults to current location pathname; pass `path` only if you need to override
 * (e.g. canonical for a redirected route).
 */
export function SEO({ title, description, path, image, type = "website", breadcrumbs, jsonLd }: SEOProps) {
  const location = useLocation();
  const effectivePath = path ?? location.pathname;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
  const url = `${SITE_URL}${effectivePath === "/" ? "/" : effectivePath}`;
  const ogImage = image ?? DEFAULT_OG;

  useEffect(() => {
    document.title = fullTitle;
    setMeta('meta[name="description"]', "content", description);

    setMeta('link[rel="canonical"]', "href", url);

    setMeta('meta[property="og:type"]', "content", type);
    setMeta('meta[property="og:site_name"]', "content", SITE_NAME);
    setMeta('meta[property="og:title"]', "content", fullTitle);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:image"]', "content", ogImage);

    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "content", fullTitle);
    setMeta('meta[name="twitter:description"]', "content", description);
    setMeta('meta[name="twitter:image"]', "content", ogImage);

    const sep = effectivePath.includes("?") ? "&" : "?";
    const base = `${SITE_URL}${effectivePath}`;
    setHreflang("fr-BE", `${base}${sep}lang=fr`);
    setHreflang("nl-BE", `${base}${sep}lang=nl`);
    setHreflang("en-GB", `${base}${sep}lang=en`);
    setHreflang("x-default", base);

    if (breadcrumbs && breadcrumbs.length > 0) {
      setJsonLd("breadcrumb", {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: b.url.startsWith("http") ? b.url : `${SITE_URL}${b.url}`,
        })),
      });
    } else {
      removeJsonLd("breadcrumb");
    }

    if (jsonLd) {
      setJsonLd("page", jsonLd);
    } else {
      removeJsonLd("page");
    }
  }, [fullTitle, description, url, ogImage, type, effectivePath, breadcrumbs, jsonLd]);

  return null;
}

export default SEO;
