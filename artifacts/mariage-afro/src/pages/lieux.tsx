import { useState, FormEvent, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users, Sparkles, List as ListIcon, Map as MapIcon, CheckCircle2 } from "lucide-react";

import MarketplaceFilters from "@/components/marketplace/MarketplaceFilters";
import MarketplaceMap from "@/components/marketplace/MarketplaceMap";
import VenueRequestModal from "@/components/VenueRequestModal";

import { Picture } from "@/components/Picture";
import { SEO } from "@/components/SEO";
import { storageUrl } from "@/lib/storage-url";

import lieuxBannerImg from "@assets/Screenshot_2026-05-19_at_10.08.13_1782821970682.png";

interface Venue {
  name: string;
  city: string;
  capacity: string;
  style: string;
  desc: string;
  image?: string;
  options: string[];
}

interface VenueApi extends Venue {
  id: number;
  image?: string;
  latitude?: string | null;
  longitude?: string | null;
}

export default function Lieux() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<"list" | "map">("list");
  const [modal, setModal] = useState<{ venueName: string; requestType: "visit" | "quote" } | null>(null);
  const openModal = useCallback((venueName: string, requestType: "visit" | "quote") => {
    setModal({ venueName, requestType });
  }, []);
  const closeModal = useCallback(() => setModal(null), []);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    weddingDate: "",
    guestCount: "",
    eventType: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const lang = (i18n.resolvedLanguage || i18n.language || "fr").split("-")[0];
  const dateHint = lang === "en" ? "MM/DD/YYYY" : lang === "nl" ? "DD/MM/JJJJ" : "JJ/MM/AAAA";

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
          eventType: formData.eventType || null,
          message: formData.message || null,
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

  const apiQueryString = searchParams.toString();

  function resolveVenueImage(src: string | null | undefined): string | undefined {
    if (!src) return undefined;
    if (/^https?:/i.test(src)) return src;
    if (src.startsWith("/objects/")) return storageUrl(src) ?? undefined;
    const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
    const rel = src.startsWith("/") ? src.slice(1) : src;
    return `${window.location.origin}${base}/${rel}`;
  }

  const { data: apiVenues = [] } = useQuery<VenueApi[]>({
    queryKey: ["marketplace-venues", apiQueryString],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/venues${apiQueryString ? `?${apiQueryString}` : ""}`, { cache: "no-store" });
      if (!res.ok) return [];
      const rows = await res.json();
      return rows.map((v: Record<string, unknown>) => ({
        id: v.id as number,
        name: v.name as string,
        city: v.city as string,
        capacity: v.capacity as string,
        style: v.style as string,
        desc: v.description as string,
        options: (v.options as string[]) ?? [],
        image: resolveVenueImage((v.coverImage as string | null) ?? ((v.images as string[]) ?? [])[0])
          ?? "https://images.unsplash.com/photo-1549224174-8c0e61705985?auto=format&fit=crop&w=1200&q=80",
        latitude: (v.latitude as string | null) ?? null,
        longitude: (v.longitude as string | null) ?? null,
      }));
    },
  });

  const i18nVenues = (t("venues.items", { returnObjects: true }) as Venue[]) || [];

  const venues: VenueApi[] = useMemo(() => {
    if (apiVenues.length > 0) return apiVenues;
    return i18nVenues.map((v, i) => ({ ...v, id: i }));
  }, [apiVenues, i18nVenues]);

  return (
    <>
    <div className="w-full">
      <SEO title="Lieux de réception" description="Sélection de lieux d'exception pour mariages afro et mixtes : châteaux, domaines champêtres, salles de réception premium, en Europe et au-delà." />
      {/* Hero éditorial — wine-deep style */}
      <section className="relative bg-wine-deep text-cream pt-40 pb-24 md:pt-48 md:pb-32 lg:pl-16 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${lieuxBannerImg})` }}
        >
          <div className="absolute inset-0 bg-wine-deep/65" />
        </div>
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>\")" }}
        />
        <div className="relative z-10 container mx-auto px-6 md:px-12 text-center max-w-5xl">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-3 text-[10px] md:text-xs uppercase tracking-[0.4em] text-gold font-medium mb-8"
          >
            <span className="block w-8 h-px bg-gold"></span>
            {t("venues.tagline")}
            <span className="block w-8 h-px bg-gold"></span>
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display uppercase font-medium leading-[0.95] tracking-[-0.01em] mb-8 text-cream text-5xl md:text-7xl lg:text-[6rem]"
          >
            {t("venues.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-cream/70 font-light max-w-2xl mx-auto leading-relaxed"
          >
            {t("venues.subtitle")}
          </motion.p>
        </div>
      </section>

      <div className="sticky top-[62px] lg:top-[72px] z-30">
        <MarketplaceFilters showCapacity totalResults={venues.length} />
        <div className="bg-cream border-b border-wine-deep/10">
          <div className="container mx-auto px-4 md:px-12 py-2 flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`px-3 py-2 text-xs uppercase tracking-[0.2em] inline-flex items-center gap-1.5 border ${view === "list" ? "bg-wine-deep text-cream border-wine-deep" : "border-wine-deep/20 text-wine-deep hover:border-wine-deep/60"}`}
              data-testid="view-list-venues"
            >
              <ListIcon className="w-3.5 h-3.5" /> Liste
            </button>
            <button
              type="button"
              onClick={() => setView("map")}
              className={`px-3 py-2 text-xs uppercase tracking-[0.2em] inline-flex items-center gap-1.5 border ${view === "map" ? "bg-wine-deep text-cream border-wine-deep" : "border-wine-deep/20 text-wine-deep hover:border-wine-deep/60"}`}
              data-testid="view-map-venues"
            >
              <MapIcon className="w-3.5 h-3.5" /> Carte
            </button>
          </div>
        </div>
      </div>

      {/* Venue cards or map */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="container mx-auto px-6 md:px-12">
          {view === "map" ? (
            <MarketplaceMap
              points={venues.map((v) => ({
                id: v.id,
                name: v.name,
                city: v.city,
                category: "Lieu",
                latitude: v.latitude ?? null,
                longitude: v.longitude ?? null,
                href: "#",
                image: v.image,
              }))}
              height={640}
            />
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {venues.map((venue, i) => (
              <motion.div
                key={venue.id ?? i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: (i % 2) * 0.1 }}
                className="card-editorial overflow-hidden flex flex-col group"
              >
                {/* Image */}
                <div className="relative h-80 overflow-hidden flex-shrink-0">
                  <Picture
                    src={venue.image || ""}
                    alt={venue.name}
                    width={1200}
                    height={900}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-wine-deep/85 via-wine-deep/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-cream">
                    <span className="badge-editorial-dark mb-3">
                      <MapPin className="w-3 h-3" />
                      {venue.city}
                    </span>
                    <h3 className="font-display uppercase text-3xl md:text-4xl tracking-tight leading-[0.95] mt-3">
                      {venue.name}
                    </h3>
                  </div>
                </div>

                {/* Body */}
                <div className="p-8 md:p-10 flex flex-col flex-grow">
                  <div className="flex flex-wrap gap-x-10 gap-y-4 mb-7 pb-7 border-b border-wine-deep/10">
                    <div>
                      <span className="flex items-center gap-1.5 text-xs uppercase tracking-[0.3em] text-gold-deep font-semibold mb-1.5">
                        <Users className="w-3 h-3" /> {t("venues.capacity_label")}
                      </span>
                      <span className="text-wine-deep font-display text-lg">{venue.capacity}</span>
                    </div>
                    <div>
                      <span className="flex items-center gap-1.5 text-xs uppercase tracking-[0.3em] text-gold-deep font-semibold mb-1.5">
                        <Sparkles className="w-3 h-3" /> {t("venues.style_label")}
                      </span>
                      <span className="text-wine-deep font-display text-lg">{venue.style}</span>
                    </div>
                  </div>

                  <p className="text-wine-deep/70 text-sm leading-relaxed mb-7 font-light italic">
                    {venue.desc}
                  </p>

                  <div className="mb-8">
                    <span className="block text-xs uppercase tracking-[0.3em] text-gold-deep font-semibold mb-3">
                      {t("venues.options_label")}
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      {venue.options.map((opt, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-wine-deep/85 font-light">
                          <span className="block w-3 h-px bg-gold flex-shrink-0 mt-2.5" />
                          <span>{opt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                    <button
                      type="button"
                      onClick={() => openModal(venue.name, "visit")}
                      className="btn-editorial-compact flex-1"
                    >
                      {t("venues.cta_visit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => openModal(venue.name, "quote")}
                      className="btn-editorial-compact-solid flex-1"
                    >
                      {t("venues.cta_quote")}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            {venues.length === 0 && (
              <div className="col-span-full text-center py-16 text-wine-deep/60">
                Aucun lieu trouvé pour ces filtres. Essayez de réinitialiser.
              </div>
            )}
          </div>
          )}
        </div>
      </section>

      {/* Venue Inquiry Form */}
      <section className="py-24 md:py-32 bg-wine-deep text-cream relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>\")" }}
        />
        <div className="relative z-10 container mx-auto px-6 md:px-12 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="section-eyebrow section-eyebrow-light mb-6">
              {t("venues.form_eyebrow") !== "venues.form_eyebrow" ? t("venues.form_eyebrow") : "Demande personnalisée"}
            </span>
            <h2 className="font-display uppercase text-cream text-3xl md:text-5xl mt-4 mb-6 leading-[0.95] tracking-tight">
              {t("venues.form_title")}
            </h2>
            <p className="text-cream/70 leading-relaxed font-light">
              {t("venues.form_desc")}
            </p>
          </motion.div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-10"
            >
              <CheckCircle2 className="w-14 h-14 text-gold mx-auto mb-4" />
              <h3 className="font-display uppercase text-cream text-2xl mb-3">{t("venues.form_success_title")}</h3>
              <p className="text-cream/70">{t("venues.form_success_desc")}</p>
            </motion.div>
          ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-6"
            data-testid="form-venues"
          >
            {/* Prénom + Nom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="venues-firstname" className="block text-[10px] uppercase tracking-[0.3em] font-medium text-gold mb-3">
                  Prénom *
                </label>
                <input
                  id="venues-firstname"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-base text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-colors"
                  data-testid="input-venues-firstname"
                />
              </div>
              <div>
                <label htmlFor="venues-lastname" className="block text-[10px] uppercase tracking-[0.3em] font-medium text-gold mb-3">
                  {t("venues.form_name")} *
                </label>
                <input
                  id="venues-lastname"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-base text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-colors"
                  data-testid="input-venues-lastname"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="venues-email" className="block text-[10px] uppercase tracking-[0.3em] font-medium text-gold mb-3">
                {t("venues.form_email")} *
              </label>
              <input
                id="venues-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-base text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-colors"
                data-testid="input-venues-email"
              />
            </div>

            {/* Date + Invités */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="venues-date" className="block text-[10px] uppercase tracking-[0.3em] font-medium text-gold mb-3">
                  {t("venues.form_date")}
                </label>
                <input
                  id="venues-date"
                  type="date"
                  value={formData.weddingDate}
                  onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
                  className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-base text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-colors"
                  data-testid="input-venues-date"
                />
                <p className="text-[10px] text-cream/40 mt-1">{dateHint}</p>
              </div>
              <div>
                <label htmlFor="venues-guests" className="block text-[10px] uppercase tracking-[0.3em] font-medium text-gold mb-3">
                  {t("venues.form_guests")}
                </label>
                <input
                  id="venues-guests"
                  type="number"
                  min="1"
                  value={formData.guestCount}
                  onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                  className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-base text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-colors"
                  data-testid="input-venues-guests"
                />
              </div>
            </div>

            {/* Type d'événement */}
            <div>
              <label htmlFor="venues-event-type" className="block text-[10px] uppercase tracking-[0.3em] font-medium text-gold mb-3">
                Type d'événement
              </label>
              <select
                id="venues-event-type"
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-base text-cream focus:outline-none focus:border-gold transition-colors appearance-none cursor-pointer"
                data-testid="input-venues-event-type"
              >
                <option value="" className="bg-wine-deep">— Choisir —</option>
                <option value="Mariage civil" className="bg-wine-deep">Mariage civil</option>
                <option value="Mariage traditionnel" className="bg-wine-deep">Mariage traditionnel</option>
                <option value="Mariage mixte / interculturel" className="bg-wine-deep">Mariage mixte / interculturel</option>
                <option value="Anniversaire" className="bg-wine-deep">Anniversaire</option>
                <option value="Autre" className="bg-wine-deep">Autre</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="venues-message" className="block text-[10px] uppercase tracking-[0.3em] font-medium text-gold mb-3">
                {t("venues.form_message")}
              </label>
              <textarea
                id="venues-message"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={t("venues.form_message_placeholder")}
                className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-base text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-colors resize-none"
                data-testid="input-venues-message"
              />
            </div>

            {submitError && (
              <p className="text-red-400 text-sm">{submitError}</p>
            )}

            <div className="pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="btn-editorial w-full justify-center disabled:opacity-60"
                data-testid="button-venues-submit"
              >
                {submitting ? t("venues.form_submitting") : t("venues.form_submit")}
              </button>
            </div>
          </motion.form>
          )}
        </div>
      </section>

      {/* Banner */}
      <section
        className="h-[300px] md:h-[400px] relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${lieuxBannerImg})` }}
      >
        <div className="absolute inset-0 bg-black/30" />
      </section>
    </div>

    {modal && (
      <VenueRequestModal
        venueName={modal.venueName}
        requestType={modal.requestType}
        onClose={closeModal}
      />
    )}
    </>
  );
}
