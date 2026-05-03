import { useEffect, useState, FormEvent, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users, Sparkles, List as ListIcon, Map as MapIcon } from "lucide-react";

import MarketplaceFilters from "@/components/marketplace/MarketplaceFilters";
import MarketplaceMap from "@/components/marketplace/MarketplaceMap";

import img1 from "@assets/pexels-innocent-kapesa-760824113-18751317_1776285262172.jpg";
import img2 from "@assets/GM-00679.jpg_1776614313614.jpeg";
import img3 from "@assets/DSC05396.jpg_1776614313613.jpeg";
import img4 from "@assets/GM-00719.jpg_1776614313614.jpeg";
import img5 from "@assets/pexels-is0-shot-2150184196-31518214_1776285262172.jpg";
import img6 from "@assets/New-Project-12_1776614330308.png";
import bannerImg from "@assets/Screenshot-2025-12-09-at-15.23.02_1776614330310.png";
import { Picture } from "@/components/Picture";
import { SEO } from "@/components/SEO";

const VENUE_IMAGES = [img1, img2, img3, img4, img5, img6];

interface Venue {
  name: string;
  city: string;
  capacity: string;
  style: string;
  desc: string;
  options: string[];
}

interface VenueApi extends Venue {
  id: number;
  image?: string;
  latitude?: string | null;
  longitude?: string | null;
}

export default function Lieux() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<"list" | "map">("list");
  const [formData, setFormData] = useState({ name: "", venue: "", date: "" });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (formData.name) params.set("name", formData.name);
    if (formData.venue) params.set("venue", formData.venue);
    if (formData.date) params.set("date", formData.date);
    navigate(`/contact?${params.toString()}`);
  };


  const apiQueryString = searchParams.toString();
  const { data: apiVenues = [] } = useQuery<VenueApi[]>({
    queryKey: ["marketplace-venues", apiQueryString],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/venues${apiQueryString ? `?${apiQueryString}` : ""}`);
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
        image: (v.coverImage as string | null) ?? ((v.images as string[]) ?? [])[0],
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
    <div className="w-full">
      <SEO title="Lieux de réception" description="Sélection de lieux de réception en Belgique adaptés aux mariages afro et mixtes : châteaux, salles de réception, domaines d'exception." />
      {/* Hero éditorial — wine-deep style lamangue */}
      <section className="relative bg-wine-deep text-cream pt-40 pb-24 md:pt-48 md:pb-32 lg:pl-16 overflow-hidden">
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
                href: "/contact",
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
                  <img
                    src={venue.image || VENUE_IMAGES[i % VENUE_IMAGES.length]}
                    alt={venue.name}
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
                      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-gold font-medium mb-1.5">
                        <Users className="w-3 h-3" /> {t("venues.capacity_label")}
                      </span>
                      <span className="text-wine-deep font-display text-lg">{venue.capacity}</span>
                    </div>
                    <div>
                      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-gold font-medium mb-1.5">
                        <Sparkles className="w-3 h-3" /> {t("venues.style_label")}
                      </span>
                      <span className="text-wine-deep font-display text-lg">{venue.style}</span>
                    </div>
                  </div>

                  <p className="text-wine-deep/70 text-sm leading-relaxed mb-7 font-light italic">
                    {venue.desc}
                  </p>

                  <div className="mb-8">
                    <span className="block text-[10px] uppercase tracking-[0.3em] text-gold font-medium mb-3">
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
                    <Link to="/contact" className="btn-editorial-compact flex-1">
                      {t("venues.cta_visit")}
                    </Link>
                    <Link to="/contact" className="btn-editorial-compact-solid flex-1">
                      {t("venues.cta_quote")}
                    </Link>
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

      {/* Form */}
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
            <span className="section-eyebrow mb-6">{t("venues.form_eyebrow") !== "venues.form_eyebrow" ? t("venues.form_eyebrow") : "Demande personnalisée"}</span>
            <h2 className="font-display uppercase text-cream text-3xl md:text-5xl mt-4 mb-6 leading-[0.95] tracking-tight">
              {t("venues.form_title")}
            </h2>
            <p className="text-cream/70 leading-relaxed font-light">
              {t("venues.form_desc")}
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-6"
            data-testid="form-venues"
          >
            <div>
              <label htmlFor="venues-name" className="block text-[10px] uppercase tracking-[0.3em] font-medium text-gold mb-3">
                {t("venues.form_name")}
              </label>
              <input
                id="venues-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-base text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-colors"
                data-testid="input-venues-name"
              />
            </div>
            <div>
              <label htmlFor="venues-venue" className="block text-[10px] uppercase tracking-[0.3em] font-medium text-gold mb-3">
                {t("venues.form_venue")}
              </label>
              <input
                id="venues-venue"
                type="text"
                required
                placeholder={t("venues.form_venue_placeholder")}
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-base text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-colors"
                data-testid="input-venues-venue"
              />
            </div>
            <div>
              <label htmlFor="venues-date" className="block text-[10px] uppercase tracking-[0.3em] font-medium text-gold mb-3">
                {t("venues.form_date")}
              </label>
              <input
                id="venues-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-transparent border-b border-cream/30 px-0 py-3 text-base text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-colors"
                data-testid="input-venues-date"
              />
            </div>
            <div className="pt-6">
              <button
                type="submit"
                className="btn-editorial w-full justify-center"
                data-testid="button-venues-submit"
              >
                {t("venues.form_submit")}
              </button>
            </div>
          </motion.form>
        </div>
      </section>

      {/* Banner */}
      <section className="h-[300px] md:h-[400px] relative overflow-hidden">
        <Picture
          src={bannerImg}
          alt="Lieu de réception de mariage"
          width={1920}
          height={1080}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </section>
    </div>
  );
}
