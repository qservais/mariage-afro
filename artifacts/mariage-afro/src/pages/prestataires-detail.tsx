import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MapPin, CheckCircle2, Globe, Phone, Mail } from "lucide-react";
import ReviewsList from "@/components/marketplace/ReviewsList";
import { ReviewStars } from "@/components/marketplace/ReviewStars";

interface VendorDetail {
  id: number;
  name: string;
  category: string;
  city: string;
  tagline: string;
  description: string;
  services: string[];
  images: string[];
  coverImage?: string | null;
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
}

const PRICE_LABEL = ["—", "€", "€€", "€€€", "€€€€"];

function escapeJsonLd(s: string) {
  return s
    .replace(/<\/(script)/gi, "<\\/$1")
    .replace(/<!--/g, "<\\!--")
    .replace(/\u2028|\u2029/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

export default function PrestataireDetail() {
  const { t } = useTranslation();
  const { id: idParam } = useParams<{ id: string }>();
  const id = Number(idParam);

  const { data: vendor, isLoading, isError } = useQuery<VendorDetail>({
    queryKey: ["vendor-detail", id],
    enabled: Number.isFinite(id) && id > 0,
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/vendors/${id}`);
      if (!res.ok) throw new Error("not_found");
      return res.json();
    },
  });

  useEffect(() => {
    if (!vendor) return;
    document.title = `${vendor.name} — ${vendor.category} ${vendor.city} — Mariage Afro`;
    const desc = (vendor.tagline || vendor.description || "").slice(0, 158);
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, [vendor]);

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

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <section className="container mx-auto px-6 py-32 text-center">
        <p className="text-wine-deep">{t("vendor_detail.invalid_id")}</p>
        <Link to="/partenaires" className="text-gold underline mt-4 inline-block">
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
        <Link to="/partenaires" className="text-gold underline mt-4 inline-block">
          {t("vendor_detail.back")}
        </Link>
      </section>
    );
  }

  return (
    <div className="bg-cream min-h-screen">
      {jsonLdString && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString }} />
      )}

      <section className="bg-wine-deep text-cream pt-32 pb-12">
        <div className="container mx-auto px-6 md:px-12 max-w-5xl">
          <Link
            to="/partenaires"
            className="inline-flex items-center gap-2 text-gold hover:text-cream text-xs uppercase tracking-[0.3em] mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> {t("vendor_detail.back")}
          </Link>
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
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 md:px-12 max-w-5xl py-12 grid md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-10">
          {vendor.coverImage && (
            <img
              src={vendor.coverImage}
              alt={vendor.name}
              className="w-full h-80 object-cover rounded-sm"
            />
          )}

          <div>
            <h2 className="font-display uppercase text-2xl text-wine-deep mb-3">{t("vendor_detail.about")}</h2>
            <p className="text-wine-deep/80 leading-relaxed whitespace-pre-wrap">
              {vendor.description || vendor.tagline}
            </p>
          </div>

          {vendor.services?.length > 0 && (
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-gold mb-3">{t("vendor_detail.services")}</h3>
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

          {vendor.images && vendor.images.length > 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {vendor.images.slice(0, 6).map((img) => (
                <img
                  key={img}
                  src={img}
                  alt={vendor.name}
                  className="w-full h-40 object-cover rounded-sm"
                  loading="lazy"
                />
              ))}
            </div>
          )}

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

        <aside className="space-y-6">
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
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2">
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
