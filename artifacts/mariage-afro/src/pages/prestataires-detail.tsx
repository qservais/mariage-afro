import { useCallback, useEffect, useMemo, useState } from "react";
import { storageUrl as objectUrl } from "@/lib/storage-url";
import type { BreadcrumbItem } from "@/components/SEO";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MapPin, CheckCircle2, Globe, Phone, Mail, Play, MessageCircle, X, ChevronLeft, ChevronRight, CalendarCheck, Check } from "lucide-react";
import ReviewsList from "@/components/marketplace/ReviewsList";
import { ReviewStars } from "@/components/marketplace/ReviewStars";
import VendorActionPanel from "@/components/marketplace/VendorActionPanel";
import VendorAvailabilityCalendar from "@/components/VendorAvailabilityCalendar";
import { SEO } from "@/components/SEO";
import { getCategoryConfig, getCategoryHeroUrl } from "@/lib/vendorCategoryConfig";

interface VendorDetail {
  id: number;
  slug?: string | null;
  name: string;
  category: string;
  city: string;
  tagline: string;
  description: string;
  descriptionFr?: string | null;
  descriptionNl?: string | null;
  descriptionEn?: string | null;
  services: Array<{ name: string; price?: number; price_unit?: string; price_on_request?: boolean }>;
  images: string[];
  coverImage?: string | null;
  logoUrl?: string | null;
  videoUrl?: string | null;
  verified: boolean;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  region?: string | null;
  priceTier?: number | null;
  culturalStyles?: string[] | null;
  spokenLanguages?: string[] | null;
  averageRating?: number;
  reviewCount?: number;
  indicativePrice?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
  pinterest?: string | null;
  packages?: Array<{
    id: string;
    name: string;
    subtitle?: string;
    price?: number;
    priceVisible: boolean;
    highlighted?: boolean;
    includes: string[];
  }> | null;
  videoUrls?: string[] | null;
}

const PRICE_LABEL = ["—", "€", "€€", "€€€", "€€€€"];

function stripLegacyLines(text: string): string {
  return text
    .split("\n")
    .filter((line) => {
      const t = line.trimStart();
      return !t.startsWith("Gamme:") && !t.startsWith("Spécialités:");
    })
    .join("\n")
    .trim();
}

function escapeJsonLd(s: string) {
  return s
    .replace(/<\/(script)/gi, "<\\/$1")
    .replace(/<!--/g, "<\\!--")
    .replace(/\u2028|\u2029/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

function extractInstagramHandle(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname.replace(/^\/+|\/+$/g, "") || url;
  } catch {
    return url.replace(/^@/, "");
  }
}

function ensureHttps(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

const SOCIAL_PROFILE_BASES: Record<string, string> = {
  instagram: "https://instagram.com/",
  facebook: "https://facebook.com/",
  tiktok: "https://tiktok.com/@",
  youtube: "https://youtube.com/@",
  pinterest: "https://pinterest.com/",
};

/**
 * Builds a safe, working profile URL from a stored social field value that may be
 * a full URL, a bare domain, or a raw handle (with or without a leading "@").
 * Prevents broken links like "https://@handle" when a user pastes a handle
 * instead of a full profile URL.
 */
function socialProfileUrl(raw: string, platform: keyof typeof SOCIAL_PROFILE_BASES): string {
  if (!raw) return raw;
  const trimmed = raw.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.includes(".") && !trimmed.startsWith("@")) return `https://${trimmed}`;
  const handle = trimmed.replace(/^@+/, "");
  return `${SOCIAL_PROFILE_BASES[platform]}${handle}`;
}

function getYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    // youtube.com/watch?v=ID
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
    // youtu.be/ID
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    // vimeo.com/ID
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

export default function PrestataireDetail() {
  const { t, i18n } = useTranslation();
  const { id: idParam } = useParams<{ id: string }>();

  const { data: vendor, isLoading, isError } = useQuery<VendorDetail>({
    queryKey: ["vendor-detail", idParam],
    enabled: !!idParam,
    retry: 0,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/vendors/${idParam}`);
      if (!res.ok) throw new Error("not_found");
      return res.json();
    },
  });

  useEffect(() => {
    if (!vendor?.id) return;
    fetch(`/api/marketplace/vendors/${vendor.id}/track-view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "detail", referrer: typeof document !== "undefined" ? document.referrer || null : null }),
    }).catch(() => undefined);
  }, [vendor?.id]);

  // Pick the best description for current language
  const localizedDescription = useMemo(() => {
    if (!vendor) return "";
    const lang = i18n.language?.slice(0, 2) ?? "fr";
    const raw = (() => {
      if (lang === "nl" && vendor.descriptionNl) return vendor.descriptionNl;
      if (lang === "en" && vendor.descriptionEn) return vendor.descriptionEn;
      if (vendor.descriptionFr) return vendor.descriptionFr;
      return vendor.description || vendor.tagline || "";
    })();
    return stripLegacyLines(raw);
  }, [vendor, i18n.language]);

  const embedUrl = useMemo(() => {
    if (!vendor?.videoUrl) return null;
    return getYouTubeEmbed(vendor.videoUrl);
  }, [vendor?.videoUrl]);

  const seoTitle = useMemo(
    () =>
      vendor
        ? `${vendor.name} — ${vendor.category} ${vendor.city}`
        : t("vendor_detail.title_fallback", { defaultValue: "Prestataire" }),
    [vendor, t]
  );

  const seoDescription = useMemo(
    () =>
      vendor
        ? stripLegacyLines(vendor.tagline || vendor.description || "").slice(0, 158)
        : "Fiche détaillée d'un prestataire de mariage afro ou mixte : services, galerie, avis, contact — Europe et Afrique.",
    [vendor]
  );

  const seoBreadcrumbs = useMemo<BreadcrumbItem[]>(
    () => {
      const trail: BreadcrumbItem[] = [
        { name: "Accueil", url: "/" },
        { name: "Prestataires", url: "/partenaires" },
      ];
      if (vendor) {
        trail.push({ name: vendor.name, url: `/partenaires/${vendor.slug || vendor.id}` });
      }
      return trail;
    },
    [vendor]
  );

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setLightboxIdx(null), []);
  const prevLightbox = useCallback(() => {
    setLightboxIdx((i) => {
      if (i === null) return null;
      const len = (vendor?.images && vendor.images.length > 0 ? vendor.images.slice(0, 6) : []).length;
      return len ? (i - 1 + len) % len : null;
    });
  }, [vendor?.images]);
  const nextLightbox = useCallback(() => {
    setLightboxIdx((i) => {
      if (i === null) return null;
      const len = (vendor?.images && vendor.images.length > 0 ? vendor.images.slice(0, 6) : []).length;
      return len ? (i + 1) % len : null;
    });
  }, [vendor?.images]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevLightbox();
      if (e.key === "ArrowRight") nextLightbox();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, closeLightbox, prevLightbox, nextLightbox]);

  const jsonLdString = useMemo(() => {
    if (!vendor) return "";
    const data: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: vendor.name,
      description: vendor.tagline || vendor.description,
      address: { "@type": "PostalAddress", addressLocality: vendor.city, addressCountry: "BE" },
      image: vendor.images?.slice(0, 4) ?? [],
      url: typeof window !== "undefined" ? window.location.href : undefined,
      telephone: vendor.phone || undefined,
      email: vendor.email || undefined,
      priceRange: vendor.priceTier ? PRICE_LABEL[vendor.priceTier] : undefined,
    };
    if ((vendor.reviewCount ?? 0) > 0 && (vendor.averageRating ?? 0) > 0) {
      data.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: vendor.averageRating!.toFixed(1),
        reviewCount: vendor.reviewCount!,
        bestRating: "5",
        worstRating: "1",
      };
    }
    return escapeJsonLd(JSON.stringify(data));
  }, [vendor]);

  const galleryImages = useMemo(
    () => (vendor?.images && vendor.images.length > 0 ? vendor.images.slice(0, 6) : []),
    [vendor]
  );

  type GalleryMedia =
    | { kind: "photo"; src: string; photoIdx: number }
    | { kind: "video"; url: string; embed: string | null };

  const allMedia = useMemo<Array<GalleryMedia | null>>(() => {
    const items: GalleryMedia[] = [];
    (vendor?.images ?? []).slice(0, 6).forEach((src, photoIdx) => {
      items.push({ kind: "photo", src, photoIdx });
    });
    if (vendor?.videoUrl) {
      items.push({ kind: "video", url: vendor.videoUrl, embed: embedUrl });
    }
    (vendor?.videoUrls ?? []).forEach((url) => {
      items.push({ kind: "video", url, embed: getYouTubeEmbed(url) });
    });
    const MIN_SLOTS = 3;
    const filled: Array<GalleryMedia | null> = [...items];
    while (filled.length < MIN_SLOTS) filled.push(null);
    return filled;
  }, [vendor, embedUrl]);

  const seoImage = useMemo(() => {
    const raw = vendor?.coverImage || vendor?.images?.[0];
    if (!raw) return undefined;
    const u = objectUrl(raw);
    if (!u) return undefined;
    if (u.startsWith("http")) return u;
    return typeof window !== "undefined" ? `${window.location.origin}${u}` : undefined;
  }, [vendor]);

  const whatsappHref = useMemo(() => {
    if (!vendor?.phone) return null;
    const cleaned = vendor.phone.replace(/\D/g, "");
    if (!cleaned) return null;
    return `https://wa.me/${cleaned}`;
  }, [vendor?.phone]);

  if (!idParam) {
    return (
      <section className="container mx-auto px-6 py-32 text-center">
        <p className="text-wine-deep">{t("vendor_detail.invalid_id")}</p>
        <Link to="/partenaires" className="text-gold-deep underline mt-4 inline-block font-semibold">
          {t("vendor_detail.back")}
        </Link>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="container mx-auto px-6 py-32 text-center text-wine-deep/60">
        {t("vendor_detail.loading")}
      </section>
    );
  }

  if (isError || !vendor) {
    return (
      <section className="container mx-auto px-6 py-32 text-center">
        <p className="text-wine-deep">{t("vendor_detail.not_found")}</p>
        <Link to="/partenaires" className="text-gold-deep underline mt-4 inline-block font-semibold">
          {t("vendor_detail.back")}
        </Link>
      </section>
    );
  }

  return (
    <div className="bg-cream min-h-screen">
      <SEO title={seoTitle} description={seoDescription} breadcrumbs={seoBreadcrumbs} image={seoImage} />
      {jsonLdString && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString }} />
      )}

      {/* Full-width hero with cover photo */}
      <section className="relative min-h-[70vh] flex items-end bg-wine-deep overflow-hidden">
        <img
          src={(vendor.coverImage && objectUrl(vendor.coverImage)) || getCategoryHeroUrl(vendor.category ?? "")}
          alt={vendor.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay — stronger at bottom where text lives */}
        <div className="absolute inset-0 bg-gradient-to-t from-wine-deep via-wine-deep/65 to-wine-deep/25" />

        <div className="relative z-10 w-full pt-28 pb-14">
          <div className="container mx-auto px-6 md:px-12 max-w-5xl">
            <Link
              to="/partenaires"
              className="inline-flex items-center gap-2 text-gold hover:text-cream text-xs uppercase tracking-[0.3em] mb-8"
            >
              <ArrowLeft className="w-4 h-4" /> {t("vendor_detail.back")}
            </Link>

            <div className="flex items-end gap-6">
              {/* Logo */}
              {vendor.logoUrl && (
                <div className="hidden sm:flex flex-shrink-0 w-20 h-20 bg-cream/10 overflow-hidden items-center justify-center border border-cream/20">
                  <img
                    src={objectUrl(vendor.logoUrl)}
                    alt={`${vendor.name} logo`}
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0 text-cream">
                <p className="text-[10px] uppercase tracking-[0.4em] text-gold mb-3">{vendor.category}</p>
                <h1 className="font-display uppercase text-4xl md:text-6xl tracking-[-0.01em] mb-4 drop-shadow-sm">
                  {vendor.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-cream/85">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {vendor.city}
                  </span>
                  {vendor.verified && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-gold/25 text-gold text-[10px] uppercase tracking-[0.2em] border border-gold/30">
                      <CheckCircle2 className="w-3 h-3" /> {t("vendor_detail.verified")}
                    </span>
                  )}
                  {(vendor.reviewCount ?? 0) > 0 && (vendor.averageRating ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-2">
                      <ReviewStars rating={vendor.averageRating!} size={14} />
                      <span>
                        {vendor.averageRating!.toFixed(1)} ({t("vendor_detail.review_count", { count: vendor.reviewCount! })})
                      </span>
                    </span>
                  )}
                  {vendor.indicativePrice && (
                    <span className="text-cream/80 text-sm">{vendor.indicativePrice}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 md:px-12 max-w-5xl py-12 grid md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-10">

          {/* Description (localized) */}
          <div>
            <h2 className="font-display uppercase text-2xl text-wine-deep mb-3">{t("vendor_detail.about")}</h2>
            <p className="text-wine-deep/80 leading-relaxed whitespace-pre-wrap">
              {localizedDescription || vendor.tagline}
            </p>
          </div>

          {/* Services — category-aware */}
          {vendor.services?.length > 0 && (() => {
            const catConfig = getCategoryConfig(vendor.category);
            const suggestedSet = new Set(catConfig?.suggestedServices ?? []);

            const suggestedServices = vendor.services.filter((s) => suggestedSet.has(s.name));
            const otherServices = vendor.services.filter((s) => !suggestedSet.has(s.name));

            const formatPrice = (price: number, unit?: string) => {
              const amount = price.toLocaleString("fr-BE", { minimumFractionDigits: 0 });
              if (!unit || unit === "forfait") return t("vendor.services.price_from", { amount: `${amount} €` });
              if (unit === "pers") return `${amount} € / pers.`;
              if (unit === "heure") return `${amount} € / h`;
              if (unit === "nuit") return `${amount} € / nuit`;
              if (unit === "table") return `${amount} € / table`;
              return t("vendor.services.price_from", { amount: `${amount} €` });
            };

            const ServiceChip = ({
              svc,
            }: {
              svc: { name: string; price?: number; price_unit?: string; price_on_request?: boolean };
            }) => (
              <li className="flex items-center gap-2 px-3 py-1.5 bg-wine-deep/10 text-wine-deep text-xs border border-wine-deep/10">
                <span className="uppercase tracking-[0.15em]">{svc.name}</span>
                {svc.price != null ? (
                  <span className="text-wine-deep/70 font-semibold whitespace-nowrap">
                    {formatPrice(svc.price, svc.price_unit)}
                  </span>
                ) : svc.price_on_request ? (
                  <span className="text-wine-deep/50 italic whitespace-nowrap">
                    {t("vendor.services.price_on_request")}
                  </span>
                ) : null}
              </li>
            );

            if (catConfig && suggestedServices.length > 0) {
              return (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-[10px] uppercase tracking-[0.3em] text-gold-deep font-semibold mb-3">
                      {t("vendor_detail.services")}
                    </h3>
                    <ul className="flex flex-wrap gap-2">
                      {suggestedServices.map((s) => (
                        <ServiceChip key={s.name} svc={s} />
                      ))}
                    </ul>
                  </div>
                  {otherServices.length > 0 && (
                    <div>
                      <h3 className="text-[10px] uppercase tracking-[0.3em] text-gold-deep/70 font-semibold mb-3">
                        {t("vendor_detail.other_services", { defaultValue: "Prestations supplémentaires" })}
                      </h3>
                      <ul className="flex flex-wrap gap-2">
                        {otherServices.map((s) => (
                          <ServiceChip key={s.name} svc={s} />
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.3em] text-gold-deep font-semibold mb-3">
                  {t("vendor_detail.services")}
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {vendor.services.map((s) => (
                    <ServiceChip key={s.name} svc={s} />
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* Packages / Formules */}
          {vendor.packages && vendor.packages.length > 0 && (
            <div>
              <h2 className="font-display uppercase text-2xl text-wine-deep mb-6">
                {t("vendor_detail.packages_title", { defaultValue: "Nos Formules" })}
              </h2>
              <div className={`grid gap-4 ${vendor.packages.length === 1 ? "grid-cols-1" : vendor.packages.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                {vendor.packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`relative flex flex-col p-6 border ${
                      pkg.highlighted
                        ? "bg-wine-deep text-cream border-wine-deep"
                        : "bg-cream-soft border-wine-deep/15"
                    }`}
                  >
                    {pkg.highlighted && (
                      <span className="absolute -top-3 left-6 bg-gold text-wine-deep text-[9px] uppercase tracking-[0.25em] font-bold px-3 py-1">
                        {t("vendor_detail.packages_recommended", { defaultValue: "Recommandé" })}
                      </span>
                    )}
                    <p className={`text-[10px] uppercase tracking-[0.25em] font-semibold mb-1 ${pkg.highlighted ? "text-gold" : "text-gold-deep"}`}>
                      {t("vendor_detail.packages_formula", { defaultValue: "Formule" })}
                    </p>
                    <h3 className={`font-display text-2xl mb-2 ${pkg.highlighted ? "text-cream" : "text-wine-deep"}`}>
                      {pkg.name}
                    </h3>
                    {pkg.subtitle && (
                      <p className={`text-sm mb-4 leading-relaxed ${pkg.highlighted ? "text-cream/70" : "text-wine-deep/60"}`}>
                        {pkg.subtitle}
                      </p>
                    )}
                    <div className={`border-b pb-4 mb-4 ${pkg.highlighted ? "border-cream/20" : "border-wine-deep/10"}`}>
                      {pkg.priceVisible && pkg.price != null ? (
                        <p className={`text-3xl font-bold ${pkg.highlighted ? "text-gold" : "text-wine-deep"}`}>
                          {pkg.price.toLocaleString("fr-BE")} <span className="text-lg">€</span>
                        </p>
                      ) : (
                        <p className={`text-sm italic ${pkg.highlighted ? "text-cream/60" : "text-wine-deep/50"}`}>
                          {t("vendor.services.price_on_request")}
                        </p>
                      )}
                    </div>
                    <ul className="space-y-2 flex-1">
                      {pkg.includes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${pkg.highlighted ? "text-gold" : "text-gold-deep"}`} />
                          <span className={pkg.highlighted ? "text-cream/90" : "text-wine-deep/80"}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unified media gallery — photos + videos, min 3 slots */}
          <div>
            <h2 className="font-display uppercase text-2xl text-wine-deep mb-3">{t("vendor_detail.gallery", { defaultValue: "Galerie" })}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {allMedia.map((item, i) => {
                if (!item) {
                  return (
                    <div
                      key={`ph-${i}`}
                      className="h-40 bg-wine-deep/5 border border-dashed border-wine-deep/20"
                      aria-hidden="true"
                    />
                  );
                }
                if (item.kind === "photo") {
                  return (
                    <button
                      key={item.src}
                      type="button"
                      onClick={() => setLightboxIdx(item.photoIdx)}
                      className="block w-full overflow-hidden rounded-sm focus:outline-none focus:ring-2 focus:ring-gold group"
                      aria-label={`${vendor.name} — photo ${item.photoIdx + 1}`}
                    >
                      <img
                        src={objectUrl(item.src)}
                        alt={`${vendor.name} ${item.photoIdx + 1}`}
                        className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </button>
                  );
                }
                // video item
                const ytId = item.embed ? item.embed.match(/\/embed\/([^?]+)/)?.[1] ?? null : null;
                const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
                const href = item.url.startsWith("/objects/")
                  ? (objectUrl(item.url) ?? item.url)
                  : ensureHttps(item.url);
                return (
                  <a
                    key={item.url + i}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block h-40 overflow-hidden rounded-sm group"
                    aria-label={t("vendor_detail.watch_video", { defaultValue: "Voir la vidéo" })}
                  >
                    {thumb ? (
                      <img src={thumb} alt="" className="w-full h-full object-cover" aria-hidden="true" />
                    ) : (
                      <div className="w-full h-full bg-wine-deep/80" />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                      <Play className="w-10 h-10 text-white drop-shadow-lg" aria-hidden="true" />
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Instagram section */}
          {vendor.instagram && (
            <div>
              <h2 className="font-display uppercase text-2xl text-wine-deep mb-4">Instagram</h2>
              <div className="border border-wine-deep/10 p-6 bg-cream-soft">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-white text-xl"
                    style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" }}>
                    📷
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-wine-deep">
                      @{extractInstagramHandle(vendor.instagram)}
                    </p>
                    <p className="text-xs text-wine-deep/60 mt-0.5">
                      {t("vendor_detail.instagram_subtitle", { defaultValue: "Retrouvez nos dernières réalisations sur Instagram" })}
                    </p>
                  </div>
                  <a
                    href={socialProfileUrl(vendor.instagram, "instagram")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 px-5 py-2.5 bg-wine-deep text-cream text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-gold hover:text-wine-deep transition-colors"
                  >
                    {t("vendor_detail.instagram_follow", { defaultValue: "Suivre" })}
                  </a>
                </div>
                <p className="text-sm text-wine-deep/70 leading-relaxed border-t border-wine-deep/10 pt-4">
                  {t("vendor_detail.instagram_auto_sync", { defaultValue: "🔄 Découvrez toutes nos réalisations, coulisses et inspirations en temps réel sur notre compte Instagram." })}
                </p>
              </div>
            </div>
          )}

          {/* Availability calendar */}
          <div>
            <h2 className="font-display uppercase text-2xl text-wine-deep mb-5 flex items-center gap-3">
              <CalendarCheck className="w-5 h-5 text-gold" />
              {t("marketplace.availability.title", { defaultValue: "Disponibilités (6 mois)" })}
            </h2>
            <VendorAvailabilityCalendar vendorId={vendor.id} months={6} />
          </div>

          {/* Reviews */}
          <div>
            <h2 className="font-display uppercase text-2xl text-wine-deep mb-5">
              {t("vendor_detail.reviews_title")}{" "}
              {(vendor.reviewCount ?? 0) > 0 && (
                <span className="text-sm text-wine-deep/60 normal-case font-sans tracking-normal">
                  {t("vendor_detail.last_n", { count: 3 })}
                </span>
              )}
            </h2>
            <ReviewsList vendorId={vendor.id} limit={3} />
          </div>
        </div>

        <aside className="space-y-6 md:sticky md:top-24 md:self-start">
          <VendorActionPanel vendor={{ id: vendor.id, name: vendor.name, category: vendor.category, services: vendor.services }} />

          <div className="bg-cream border border-wine-deep/10 p-5 space-y-3">
            {vendor.phone && (
              <a
                href={`tel:${vendor.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2.5 px-4 py-2.5 border border-wine-deep/15 text-wine-deep hover:bg-wine-deep hover:text-cream transition-colors text-sm font-medium group"
              >
                <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{vendor.phone}</span>
              </a>
            )}
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-4 py-2.5 bg-[#25D366] text-white hover:bg-[#1ebe5a] transition-colors text-sm font-medium"
              >
                <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                WhatsApp
              </a>
            )}
            {vendor.email && (
              <a
                href={`mailto:${vendor.email}`}
                className="flex items-center gap-2.5 text-wine-deep/70 hover:text-wine-deep text-sm transition-colors break-all"
              >
                <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
                {vendor.email}
              </a>
            )}
            {vendor.website && (
              <a
                href={ensureHttps(vendor.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-wine-deep/70 hover:text-wine-deep text-sm transition-colors break-all"
              >
                <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
                {vendor.website.replace(/^https?:\/\//, "")}
              </a>
            )}

            {/* Social media links */}
            {(vendor.instagram || vendor.facebook || vendor.tiktok || vendor.youtube || vendor.pinterest) && (
              <div className="pt-3 border-t border-wine-deep/10">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold-deep font-semibold mb-3">
                  {t("vendor_detail.social_media")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {vendor.instagram && (
                    <a
                      href={socialProfileUrl(vendor.instagram, "instagram")}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Instagram"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-85"
                      style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" }}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                      Instagram
                    </a>
                  )}
                  {vendor.facebook && (
                    <a
                      href={socialProfileUrl(vendor.facebook, "facebook")}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Facebook"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1877F2] text-white text-xs font-semibold hover:opacity-85 transition-opacity"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      Facebook
                    </a>
                  )}
                  {vendor.tiktok && (
                    <a
                      href={socialProfileUrl(vendor.tiktok, "tiktok")}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="TikTok"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#010101] text-white text-xs font-semibold hover:opacity-80 transition-opacity"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.23 8.23 0 004.83 1.56V6.79a4.84 4.84 0 01-1.06-.1z"/></svg>
                      TikTok
                    </a>
                  )}
                  {vendor.youtube && (
                    <a
                      href={socialProfileUrl(vendor.youtube, "youtube")}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="YouTube"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF0000] text-white text-xs font-semibold hover:opacity-85 transition-opacity"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      YouTube
                    </a>
                  )}
                  {vendor.pinterest && (
                    <a
                      href={socialProfileUrl(vendor.pinterest, "pinterest")}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Pinterest"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E60023] text-white text-xs font-semibold hover:opacity-85 transition-opacity"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
                      Pinterest
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {(vendor.culturalStyles?.length || vendor.spokenLanguages?.length) ? (
            <div className="bg-white p-6 border border-wine-deep/10 rounded-sm space-y-4 text-sm">
              {vendor.culturalStyles && vendor.culturalStyles.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gold-deep font-semibold mb-2">
                    {t("vendor_detail.cultural_styles")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {vendor.culturalStyles.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1 rounded-full border border-gold-deep/30 bg-gold-deep/10 text-wine-deep text-xs font-medium tracking-wide"
                      >
                        {t(`marketplace.styles.${s}`, { defaultValue: s.replace(/_/g, " ") })}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {vendor.spokenLanguages && vendor.spokenLanguages.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2">{t("vendor_detail.languages")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {vendor.spokenLanguages.map((l) => (
                      <span key={l} className="px-2 py-0.5 bg-wine-deep/5 text-xs uppercase">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </aside>
      </section>

      {/* Lightbox */}
      {lightboxIdx !== null && galleryImages[lightboxIdx] && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`${vendor.name} — photo ${lightboxIdx + 1} / ${galleryImages.length}`}
        >
          {/* Close */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
            aria-label={t("vendor_detail.lightbox_close")}
          >
            <X className="w-7 h-7" />
          </button>

          {/* Prev */}
          {galleryImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prevLightbox(); }}
              className="absolute left-4 p-2 text-white/80 hover:text-white"
              aria-label={t("vendor_detail.lightbox_prev")}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Image */}
          <img
            src={objectUrl(galleryImages[lightboxIdx])}
            alt={`${vendor.name} ${lightboxIdx + 1}`}
            className="max-h-[88vh] max-w-[90vw] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {galleryImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); nextLightbox(); }}
              className="absolute right-4 p-2 text-white/80 hover:text-white"
              aria-label={t("vendor_detail.lightbox_next")}
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Counter */}
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs tracking-widest">
            {lightboxIdx + 1} / {galleryImages.length}
          </span>
        </div>
      )}
    </div>
  );
}
