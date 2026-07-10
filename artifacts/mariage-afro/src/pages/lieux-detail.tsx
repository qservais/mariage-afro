import { useState, useEffect, useRef, useCallback, FormEvent } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Users, Sparkles, ArrowLeft,
  Images, ChevronLeft, ChevronRight, X,
  CheckCircle2,
} from "lucide-react";

import { Picture } from "@/components/Picture";
import { SEO } from "@/components/SEO";
import VenueRequestModal from "@/components/VenueRequestModal";
import { storageUrl } from "@/lib/storage-url";

interface VenueDetail {
  id: number;
  slug?: string | null;
  name: string;
  city: string;
  capacity: string;
  style: string;
  description: string;
  options: string[];
  images: string[];
  coverImage?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  region?: string | null;
  priceTier?: number | null;
  culturalStyles?: string[] | null;
  spokenLanguages?: string[] | null;
  capacityMin?: number | null;
  capacityMax?: number | null;
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1549224174-8c0e61705985?auto=format&fit=crop&w=1200&q=80";

function resolveUrl(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  if (/^https?:/i.test(src)) return src;
  if (src.startsWith("/objects/")) return storageUrl(src) ?? undefined;
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  const rel = src.startsWith("/") ? src.slice(1) : src;
  return `${window.location.origin}${base}/${rel}`;
}

function buildGallery(cover: string | null | undefined, extras: string[]): string[] {
  const set = new Set<string>();
  const c = resolveUrl(cover);
  if (c) set.add(c);
  for (const s of extras) { const r = resolveUrl(s); if (r) set.add(r); }
  return Array.from(set);
}

const FOCUSABLE = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';

function Lightbox({
  images, idx, name, onClose, onChange,
}: {
  images: string[]; idx: number; name: string;
  onClose: () => void; onChange: (i: number) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    prevFocusRef.current = document.activeElement;
    closeBtnRef.current?.focus();
    return () => { (prevFocusRef.current as HTMLElement | null)?.focus?.(); };
  }, []);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter(n => !n.hasAttribute("disabled") && n.offsetParent !== null);
      if (!nodes.length) return;
      if (e.shiftKey) { if (document.activeElement === nodes[0]) { e.preventDefault(); nodes[nodes.length - 1].focus(); } }
      else { if (document.activeElement === nodes[nodes.length - 1]) { e.preventDefault(); nodes[0].focus(); } }
    };
    el.addEventListener("keydown", trap);
    return () => el.removeEventListener("keydown", trap);
  }, []);

  useEffect(() => {
    const total = images.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowLeft" && idx > 0) onChange(idx - 1);
      if (e.key === "ArrowRight" && idx < total - 1) onChange(idx + 1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [idx, images.length, onClose, onChange]);

  const current = images[idx] ?? FALLBACK_IMG;
  const total = images.length;

  return (
    <div
      ref={dialogRef}
      role="dialog" aria-modal="true"
      aria-label={`Galerie photos — ${name}`}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/92"
      onClick={onClose}
    >
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-10"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-cream/70 text-xs uppercase tracking-[0.25em]">
          {name} — {idx + 1}/{total}
        </span>
        <button
          ref={closeBtnRef}
          type="button" onClick={onClose}
          aria-label="Fermer la galerie"
          className="w-10 h-10 flex items-center justify-center text-cream hover:text-gold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        className="relative flex items-center justify-center w-full max-w-6xl px-14 md:px-20"
        style={{ height: "70vh" }}
        onClick={e => e.stopPropagation()}
      >
        {idx > 0 && (
          <button
            type="button" onClick={() => onChange(idx - 1)}
            aria-label="Photo précédente"
            className="absolute left-2 md:left-4 z-10 w-10 h-10 flex items-center justify-center text-cream bg-black/40 hover:bg-wine-deep transition-colors rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={current}
            alt={`${name} — photo ${idx + 1}`}
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.22 }}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
          />
        </AnimatePresence>
        {idx < total - 1 && (
          <button
            type="button" onClick={() => onChange(idx + 1)}
            aria-label="Photo suivante"
            className="absolute right-2 md:right-4 z-10 w-10 h-10 flex items-center justify-center text-cream bg-black/40 hover:bg-wine-deep transition-colors rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {total > 1 && (
        <div
          className="flex items-center gap-2 mt-4 px-4 overflow-x-auto max-w-full pb-2"
          onClick={e => e.stopPropagation()}
        >
          {images.map((src, i) => (
            <button
              key={i} type="button" onClick={() => onChange(i)}
              aria-label={`Voir photo ${i + 1}`}
              className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 overflow-hidden border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${i === idx ? "border-gold" : "border-transparent opacity-60 hover:opacity-100"}`}
            >
              <img src={src} alt={`Miniature ${i + 1}`} className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LeafletMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: unknown;
    import("leaflet").then((L) => {
      const Leaflet = L.default ?? L;
      if (!mapRef.current) return;
      const m = Leaflet.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false })
        .setView([lat, lng], 14);
      Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(m);
      const icon = Leaflet.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;background:#68191e;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      Leaflet.marker([lat, lng], { icon }).bindPopup(`<strong>${name}</strong>`).addTo(m);
      map = m;
    });
    return () => {
      if (map && (map as { remove?: () => void }).remove) (map as { remove: () => void }).remove();
    };
  }, [lat, lng, name]);

  return <div ref={mapRef} style={{ height: 340 }} className="w-full rounded-none z-0" />;
}

export default function LieuDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const openLightbox = useCallback((i: number) => setLightboxIdx(i), []);
  const closeLightbox = useCallback(() => setLightboxIdx(null), []);
  const changeLightbox = useCallback((i: number) => setLightboxIdx(i), []);

  const [modal, setModal] = useState<{ requestType: "visit" | "quote" } | null>(null);
  const openModal = useCallback((requestType: "visit" | "quote") => setModal({ requestType }), []);
  const closeModal = useCallback(() => setModal(null), []);

  const lang = (i18n.resolvedLanguage || i18n.language || "fr").split("-")[0];
  const dateHint = lang === "en" ? "MM/DD/YYYY" : lang === "nl" ? "DD/MM/JJJJ" : "JJ/MM/AAAA";

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "",
    weddingDate: "", guestCount: "", message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: venue, isLoading, isError } = useQuery<VenueDetail>({
    queryKey: ["venue-detail", slug],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/venues/${encodeURIComponent(slug ?? "")}`, { cache: "no-store" });
      if (!res.ok) throw new Error("not_found");
      return res.json();
    },
    retry: false,
    enabled: Boolean(slug),
  });

  const gallery = venue ? buildGallery(venue.coverImage, venue.images) : [];
  const coverImg = gallery[0] ?? FALLBACK_IMG;
  const hasGallery = gallery.length > 1;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/leads/venue-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          weddingDate: formData.weddingDate || null,
          guestCount: formData.guestCount ? Number(formData.guestCount) : null,
          message: (venue ? `[${venue.name}] ` : "") + (formData.message || ""),
        }),
      });
      if (!res.ok) throw new Error("error");
      setSubmitted(true);
    } catch {
      setSubmitError(t("venues.form_error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-wine-deep border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !venue) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6 px-6">
        <SEO title={t("venues.detail_not_found")} description={t("venues.detail_not_found_desc")} />
        <h1 className="font-display text-3xl text-wine-deep">{t("venues.detail_not_found")}</h1>
        <p className="text-wine-deep/60">{t("venues.detail_not_found_desc")}</p>
        <Link to="/lieux" className="btn-editorial">{t("venues.detail_back")}</Link>
      </div>
    );
  }

  const lat = venue.latitude ? parseFloat(venue.latitude) : null;
  const lng = venue.longitude ? parseFloat(venue.longitude) : null;
  const hasGeo = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);

  return (
    <>
      <SEO
        title={`${venue.name} ${t("venues.detail_seo_suffix")}`}
        description={venue.description || t("venues.seo_description")}
      />

      {lightboxIdx !== null && (
        <Lightbox
          images={gallery}
          idx={lightboxIdx}
          name={venue.name}
          onClose={closeLightbox}
          onChange={changeLightbox}
        />
      )}

      {modal && (
        <VenueRequestModal
          venueName={venue.name}
          requestType={modal.requestType}
          onClose={closeModal}
        />
      )}

      {/* Hero */}
      <section className="relative bg-wine-deep text-cream overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${coverImg})` }}
        >
          <div className="absolute inset-0 bg-wine-deep/70" />
        </div>
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>\")" }}
        />

        <div className="relative z-10 container mx-auto px-6 md:px-12 pt-36 pb-20 md:pt-44 md:pb-28 max-w-5xl">
          <Link
            to="/lieux"
            className="inline-flex items-center gap-2 text-cream/60 hover:text-gold text-xs uppercase tracking-[0.3em] mb-10 transition-colors"
          >
            {t("venues.detail_back")}
          </Link>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-gold font-medium mb-6"
          >
            <span className="block w-8 h-px bg-gold" />
            <MapPin className="w-3 h-3" aria-hidden="true" />
            {venue.city}
            <span className="block w-8 h-px bg-gold" />
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-display uppercase font-medium leading-[0.93] tracking-[-0.01em] text-cream text-5xl md:text-7xl lg:text-[6rem] mb-8"
          >
            {venue.name}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-8 mb-10"
          >
            {venue.capacity && (
              <div>
                <span className="flex items-center gap-1.5 text-xs uppercase tracking-[0.3em] text-gold font-semibold mb-1">
                  <Users className="w-3 h-3" aria-hidden="true" /> {t("venues.detail_capacity")}
                </span>
                <span className="text-cream font-display text-xl">{venue.capacity}</span>
              </div>
            )}
            {venue.style && (
              <div>
                <span className="flex items-center gap-1.5 text-xs uppercase tracking-[0.3em] text-gold font-semibold mb-1">
                  <Sparkles className="w-3 h-3" aria-hidden="true" /> {t("venues.detail_style")}
                </span>
                <span className="text-cream font-display text-xl">{venue.style}</span>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            {hasGallery && (
              <button
                type="button"
                onClick={() => openLightbox(0)}
                className="btn-editorial-compact flex items-center gap-2"
              >
                <Images className="w-3.5 h-3.5" aria-hidden="true" />
                {t("venues.detail_gallery_btn")} ({gallery.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => openModal("visit")}
              className="btn-editorial-compact"
            >
              {t("venues.cta_visit")}
            </button>
            <button
              type="button"
              onClick={() => openModal("quote")}
              className="btn-editorial-compact-solid"
            >
              {t("venues.cta_quote")}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Gallery grid (when > 1 image) */}
      {hasGallery && (
        <section className="bg-wine-deep/5 py-0">
          <div
            className={`grid gap-px ${gallery.length >= 4 ? "grid-cols-2 md:grid-cols-4" : gallery.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}
            style={{ background: "rgba(104,25,30,.1)" }}
          >
            {gallery.slice(0, 5).map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => openLightbox(i)}
                aria-label={`Voir photo ${i + 1}`}
                className={`relative overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset ${i === 0 && gallery.length >= 4 ? "col-span-2 row-span-2" : ""}`}
                style={{ height: i === 0 && gallery.length >= 4 ? 440 : 220 }}
              >
                <img
                  src={src}
                  alt={`${venue.name} — ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading={i === 0 ? "eager" : "lazy"}
                />
                {i === 4 && gallery.length > 5 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-cream text-2xl font-display tracking-tight">
                      +{gallery.length - 4}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Description + Options */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="container mx-auto px-6 md:px-12 max-w-5xl">
          <div className="grid md:grid-cols-3 gap-12 md:gap-20">
            <div className="md:col-span-2">
              {venue.description && (
                <p className="text-wine-deep/80 text-lg leading-relaxed font-light mb-10 whitespace-pre-line">
                  {venue.description}
                </p>
              )}

              {venue.options.length > 0 && (
                <div>
                  <span className="block text-xs uppercase tracking-[0.35em] text-gold-deep font-semibold mb-5">
                    {t("venues.detail_options")}
                  </span>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                    {venue.options.map((opt, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-wine-deep/85 font-light">
                        <span className="block w-3 h-px bg-gold flex-shrink-0 mt-2.5" />
                        <span>{opt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              {(venue.culturalStyles?.length ?? 0) > 0 && (
                <div className="mb-8">
                  <span className="block text-xs uppercase tracking-[0.35em] text-gold-deep font-semibold mb-3">
                    Styles culturels
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(venue.culturalStyles ?? []).map((s, i) => (
                      <span key={i} className="badge-editorial">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {(venue.spokenLanguages?.length ?? 0) > 0 && (
                <div className="mb-8">
                  <span className="block text-xs uppercase tracking-[0.35em] text-gold-deep font-semibold mb-3">
                    Langues parlées
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(venue.spokenLanguages ?? []).map((l, i) => (
                      <span key={i} className="badge-editorial">{l}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => openModal("visit")}
                  className="btn-editorial-compact w-full justify-center"
                >
                  {t("venues.cta_visit")}
                </button>
                <button
                  type="button"
                  onClick={() => openModal("quote")}
                  className="btn-editorial-compact-solid w-full justify-center"
                >
                  {t("venues.cta_quote")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      {hasGeo && (
        <section className="bg-cream border-t border-wine-deep/10">
          <div className="container mx-auto px-6 md:px-12 max-w-5xl py-16 md:py-20">
            <span className="section-eyebrow mb-6 block">{t("venues.detail_map_title")}</span>
            <h2 className="font-display uppercase text-wine-deep text-2xl md:text-3xl mb-8 leading-tight">
              {venue.name} · <span className="text-wine-deep/50">{venue.city}</span>
            </h2>
            <div className="border border-wine-deep/15 overflow-hidden">
              <LeafletMap lat={lat!} lng={lng!} name={venue.name} />
            </div>
          </div>
        </section>
      )}

      {/* Contact form */}
      <section className="py-24 md:py-32 bg-wine-deep text-cream relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>\")" }}
        />
        <div className="relative z-10 container mx-auto px-6 md:px-12 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className="text-center mb-12"
          >
            <span className="section-eyebrow section-eyebrow-light mb-6">
              {t("venues.detail_contact_eyebrow")}
            </span>
            <h2 className="font-display uppercase text-cream text-3xl md:text-5xl mt-4 mb-6 leading-[0.95] tracking-tight">
              {t("venues.detail_contact_title")}
            </h2>
            <p className="text-cream/70 leading-relaxed font-light">
              {t("venues.detail_contact_desc")}
            </p>
          </motion.div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="text-center py-10"
            >
              <CheckCircle2 className="w-14 h-14 text-gold mx-auto mb-4" />
              <h3 className="font-display uppercase text-cream text-2xl mb-3">
                {t("venues.form_success_title")}
              </h3>
              <p className="text-cream/70">{t("venues.form_success_desc")}</p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.1 }}
              onSubmit={handleSubmit}
              className="space-y-6"
              data-testid="form-lieu-detail"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="lieu-firstname" className="block text-[10px] uppercase tracking-[0.3em] font-medium text-gold mb-3">
                    {t("venues.form_firstname")} *
                  </label>
                  <input
                    id="lieu-firstname" type="text" required
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-base text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="lieu-lastname" className="block text-[10px] uppercase tracking-[0.3em] font-medium text-gold mb-3">
                    {t("venues.form_lastname")} *
                  </label>
                  <input
                    id="lieu-lastname" type="text" required
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-base text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lieu-email" className="block text-[10px] uppercase tracking-[0.3em] font-medium text-gold mb-3">
                  {t("venues.form_email")} *
                </label>
                <input
                  id="lieu-email" type="email" required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-base text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="lieu-date" className="block text-[10px] uppercase tracking-[0.3em] font-medium text-gold mb-3">
                    {t("venues.form_date")}
                  </label>
                  <input
                    id="lieu-date" type="date"
                    value={formData.weddingDate}
                    onChange={e => setFormData({ ...formData, weddingDate: e.target.value })}
                    placeholder={dateHint}
                    className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-base text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="lieu-guests" className="block text-[10px] uppercase tracking-[0.3em] font-medium text-gold mb-3">
                    {t("venues.form_guests")}
                  </label>
                  <input
                    id="lieu-guests" type="number" min="1"
                    value={formData.guestCount}
                    onChange={e => setFormData({ ...formData, guestCount: e.target.value })}
                    placeholder="ex: 150"
                    className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-base text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lieu-message" className="block text-[10px] uppercase tracking-[0.3em] font-medium text-gold mb-3">
                  {t("venues.form_message")}
                </label>
                <textarea
                  id="lieu-message" rows={3}
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  placeholder={t("venues.form_message_placeholder")}
                  className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-base text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-colors resize-none"
                />
              </div>

              {submitError && (
                <p className="text-sm text-red-300 bg-red-900/30 border border-red-700/30 px-4 py-3">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-editorial-compact-solid w-full justify-center disabled:opacity-60"
                data-testid="submit-lieu-detail"
              >
                {submitting ? t("venues.form_submitting") : t("venues.form_submit")}
              </button>
            </motion.form>
          )}
        </div>
      </section>
    </>
  );
}
