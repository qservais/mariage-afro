import { useEffect, useMemo } from "react";
import type { BreadcrumbItem } from "@/components/SEO";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MapPin, CheckCircle2, Globe, Phone, Mail, Play } from "lucide-react";
import ReviewsList from "@/components/marketplace/ReviewsList";
import { ReviewStars } from "@/components/marketplace/ReviewStars";
import VendorActionPanel from "@/components/marketplace/VendorActionPanel";
import { SEO } from "@/components/SEO";

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
  services: string[];
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
}

const PRICE_LABEL = ["—", "€", "€€", "€€€", "€€€€"];

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Convert an internal object path to a public serving URL. */
function objectUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/objects/")) return `${BASE}/storage${path}`;
  return path;
}

function escapeJsonLd(s: string) {
  return s
    .replace(/<\/(script)/gi, "<\\/$1")
    .replace(/<!--/g, "<\\!--")
    .replace(/\u2028|\u2029/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
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
    if (lang === "nl" && vendor.descriptionNl) return vendor.descriptionNl;
    if (lang === "en" && vendor.descriptionEn) return vendor.descriptionEn;
    if (vendor.descriptionFr) return vendor.descriptionFr;
    return vendor.description || vendor.tagline || "";
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
        ? (vendor.tagline || vendor.description || "").slice(0, 158)
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
      <SEO title={seoTitle} description={seoDescription} breadcrumbs={seoBreadcrumbs} />
      {jsonLdString && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString }} />
      )}

      {/* Hero header */}
      <section className="bg-wine-deep text-cream pt-32 pb-12">
        <div className="container mx-auto px-6 md:px-12 max-w-5xl">
          <Link
            to="/partenaires"
            className="inline-flex items-center gap-2 text-gold hover:text-cream text-xs uppercase tracking-[0.3em] mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> {t("vendor_detail.back")}
          </Link>

          <div className="flex items-start gap-6">
            {/* Logo */}
            {vendor.logoUrl && (
              <div className="hidden sm:flex flex-shrink-0 w-20 h-20 bg-cream/10 overflow-hidden items-center justify-center">
                <img
                  src={objectUrl(vendor.logoUrl)}
                  alt={`${vendor.name} logo`}
                  className="w-full h-full object-contain p-1"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.4em] text-gold mb-3">{vendor.category}</p>
              <h1 className="font-display uppercase text-4xl md:text-6xl tracking-[-0.01em] mb-4">
                {vendor.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-cream/80">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {vendor.city}
                </span>
                {vendor.verified && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-gold/20 text-gold text-[10px] uppercase tracking-[0.2em]">
                    <CheckCircle2 className="w-3 h-3" /> {t("vendor_detail.verified")}
                  </span>
                )}
                {(vendor.reviewCount ?? 0) > 0 && (vendor.averageRating ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-2">
                    <ReviewStars rating={vendor.averageRating!} size={14} />
                    <span className="text-cream">
                      {vendor.averageRating!.toFixed(1)} ({t("vendor_detail.review_count", { count: vendor.reviewCount! })})
                    </span>
                  </span>
                )}
                {vendor.priceTier && (
                  <span className="text-cream font-medium">{PRICE_LABEL[vendor.priceTier]}</span>
                )}
                {vendor.indicativePrice && (
                  <span className="text-cream/80 text-sm">{vendor.indicativePrice}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 md:px-12 max-w-5xl py-12 grid md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-10">
          {/* Cover image */}
          {vendor.coverImage && (
            <img
              src={objectUrl(vendor.coverImage)}
              alt={vendor.name}
              className="w-full h-80 object-cover rounded-sm"
            />
          )}

          {/* Description (localized) */}
          <div>
            <h2 className="font-display uppercase text-2xl text-wine-deep mb-3">{t("vendor_detail.about")}</h2>
            <p className="text-wine-deep/80 leading-relaxed whitespace-pre-wrap">
              {localizedDescription || vendor.tagline}
            </p>
          </div>

          {/* Services */}
          {vendor.services?.length > 0 && (
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-gold-deep font-semibold mb-3">{t("vendor_detail.services")}</h3>
              <ul className="flex flex-wrap gap-2">
                {vendor.services.map((s) => (
                  <li
                    key={s}
                    className="px-3 py-1.5 bg-wine-deep/5 text-wine-deep text-xs uppercase tracking-[0.15em]"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Gallery */}
          {vendor.images && vendor.images.length > 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {vendor.images.slice(0, 6).map((img) => (
                <img
                  key={img}
                  src={objectUrl(img)}
                  alt={vendor.name}
                  className="w-full h-40 object-cover rounded-sm"
                  loading="lazy"
                />
              ))}
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
                    title={`${vendor.name} — vidéo`}
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
          <VendorActionPanel vendor={{ id: vendor.id, name: vendor.name }} />

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
            {vendor.email && (
              <a
                href={`mailto:${vendor.email}`}
                className="flex items-center gap-2 text-wine-deep hover:text-gold text-sm break-all"
              >
                <Mail className="w-4 h-4 shrink-0" />
                {vendor.email}
              </a>
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
    </div>
  );
}
