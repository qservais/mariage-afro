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
      const len = (vendor?.images && vendor.images.length > 1 ? vendor.images.slice(0, 6) : []).length;
      return len ? (i - 1 + len) % len : null;
    });
  }, [vendor?.images]);
  const nextLightbox = useCallback(() => {
    setLightboxIdx((i) => {
      if (i === null) return null;
      const len = (vendor?.images && vendor.images.length > 1 ? vendor.images.slice(0, 6) : []).length;
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
    () => (vendor?.images && vendor.images.length > 1 ? vendor.images.slice(0, 6) : []),
    [vendor]
  );

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

          {/* Gallery — click to open lightbox */}
          {galleryImages.length > 0 && (
            <div>
              <h2 className="font-display uppercase text-2xl text-wine-deep mb-3">{t("vendor_detail.gallery", { defaultValue: "Galerie" })}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {galleryImages.map((img, idx) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setLightboxIdx(idx)}
                    className="block w-full overflow-hidden rounded-sm focus:outline-none focus:ring-2 focus:ring-gold group"
                    aria-label={`${vendor.name} — photo ${idx + 1}`}
                  >
                    <img
                      src={objectUrl(img)}
                      alt={`${vendor.name} ${idx + 1}`}
                      className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Video */}
          {vendor.videoUrl && (
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-gold-deep font-semibold mb-4 flex items-center gap-2">
                <Play className="w-3.5 h-3.5" />
                {t("vendor_detail.video", { defaultValue: "Vidéo de présentation" })}
              </h3>
              {vendor.videoUrl.startsWith("/objects/") || vendor.videoUrl.startsWith("http") && !embedUrl ? (
                /* Uploaded video file — serve via storage proxy */
                <video
                  src={objectUrl(vendor.videoUrl)}
                  controls
                  className="w-full rounded-sm max-h-[480px]"
                  preload="metadata"
                />
              ) : embedUrl ? (
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    src={embedUrl}
                    title={t("vendor_detail.video_title", { name: vendor.name })}
                    className="absolute inset-0 w-full h-full rounded-sm"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a
                  href={vendor.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-wine-deep hover:text-gold text-sm underline"
                >
                  <Play className="w-4 h-4" />
                  {vendor.videoUrl}
                </a>
              )}
            </div>
          )}

          {/* Additional videos */}
          {vendor.videoUrls && vendor.videoUrls.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-gold-deep font-semibold flex items-center gap-2">
                <Play className="w-3.5 h-3.5" />
                {t("vendor_detail.more_videos", { defaultValue: "Autres vidéos" })}
              </h3>
              {vendor.videoUrls.map((url, idx) => {
                const embed = getYouTubeEmbed(url);
                return (
                  <div key={idx}>
                    {embed ? (
                      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                        <iframe
                          src={embed}
                          title={t("vendor_detail.video_title_n", { name: vendor.name, index: idx + 2 })}
                          className="absolute inset-0 w-full h-full rounded-sm"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-wine-deep hover:text-gold text-sm underline">
                        <Play className="w-4 h-4" /> {url}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

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
                    href={vendor.instagram}
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

          <div className="bg-white p-6 border border-wine-deep/10 rounded-sm space-y-3">
            {vendor.website && (
              <a
                href={vendor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-wine-deep hover:text-gold text-sm break-all"
              >
                <Globe className="w-4 h-4 shrink-0" />
                {vendor.website}
              </a>
            )}
            {vendor.phone && (
              <a
                href={`tel:${vendor.phone}`}
                className="flex items-center gap-2 text-wine-deep hover:text-gold text-sm"
              >
                <Phone className="w-4 h-4 shrink-0" />
                {vendor.phone}
              </a>
            )}
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#25D366] hover:text-green-700 text-sm font-medium"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                WhatsApp
              </a>
            )}
            {vendor.email && (
              <a
                href={`mailto:${vendor.email}`}
                className="flex items-center gap-2 text-wine-deep hover:text-gold text-sm break-all"
              >
                <Mail className="w-4 h-4 shrink-0" />
                {vendor.email}
              </a>
            )}
            {/* Social media links */}
            {(vendor.instagram || vendor.facebook || vendor.tiktok || vendor.youtube || vendor.pinterest) && (
              <div className="pt-3 border-t border-wine-deep/10">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold-deep font-semibold mb-3">
                  {t("vendor_detail.social_media")}
                </p>
                <div className="flex flex-wrap gap-3">
                  {vendor.instagram && (
                    <a href={vendor.instagram} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-wine-deep hover:text-gold text-xs font-medium transition-colors"
                      title="Instagram">
                      <span className="text-base">📸</span> Instagram
                    </a>
                  )}
                  {vendor.facebook && (
                    <a href={vendor.facebook} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-wine-deep hover:text-gold text-xs font-medium transition-colors"
                      title="Facebook">
                      <span className="text-base">👤</span> Facebook
                    </a>
                  )}
                  {vendor.tiktok && (
                    <a href={vendor.tiktok} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-wine-deep hover:text-gold text-xs font-medium transition-colors"
                      title="TikTok">
                      <span className="text-base">🎵</span> TikTok
                    </a>
                  )}
                  {vendor.youtube && (
                    <a href={vendor.youtube} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-wine-deep hover:text-gold text-xs font-medium transition-colors"
                      title="YouTube">
                      <span className="text-base">▶️</span> YouTube
                    </a>
                  )}
                  {vendor.pinterest && (
                    <a href={vendor.pinterest} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-wine-deep hover:text-gold text-xs font-medium transition-colors"
                      title="Pinterest">
                      <span className="text-base">📌</span> Pinterest
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
                  <div className="flex flex-wrap gap-1.5">
                    {vendor.culturalStyles.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-wine-deep/5 text-xs">
                        {s}
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
