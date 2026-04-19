import { useEffect, useState, FormEvent, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Sparkles, CheckCircle2 } from "lucide-react";

import img1 from "@assets/GM-00756.jpg_1776614313614.jpeg";
import img2 from "@assets/GM-00679.jpg_1776614313614.jpeg";
import img3 from "@assets/DSC05396.jpg_1776614313613.jpeg";
import img4 from "@assets/GM-00719.jpg_1776614313614.jpeg";
import img5 from "@assets/MielMagGM-156of162.jpg_1776614313614.jpeg";
import img6 from "@assets/New-Project-12_1776614330308.png";
import bannerImg from "@assets/Screenshot-2025-12-09-at-15.23.02_1776614330310.png";

const VENUE_IMAGES = [img1, img2, img3, img4, img5, img6];

interface Venue {
  name: string;
  city: string;
  capacity: string;
  style: string;
  desc: string;
  options: string[];
}

export default function Lieux() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", venue: "", date: "" });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (formData.name) params.set("name", formData.name);
    if (formData.venue) params.set("venue", formData.venue);
    if (formData.date) params.set("date", formData.date);
    navigate(`/contact?${params.toString()}`);
  };

  useEffect(() => {
    document.title = `${t("nav.venues")} — Mariage Afro`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", t("venues.subtitle"));
    }
  }, [t]);

  const { data: apiVenues = [] } = useQuery({
    queryKey: ["marketplace-venues"],
    queryFn: async () => {
      const res = await fetch("/api/marketplace/venues");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const i18nVenues = (t("venues.items", { returnObjects: true }) as Venue[]) || [];

  const venues: (Venue & { image?: string })[] = useMemo(() => {
    if (apiVenues.length > 0) {
      return apiVenues.map((v: Record<string, unknown>) => ({
        name: v.name as string,
        city: v.city as string,
        capacity: v.capacity as string,
        style: v.style as string,
        desc: v.description as string,
        options: v.options as string[],
        image: (v.coverImage as string | null) || (v.images as string[])[0],
      }));
    }
    return i18nVenues;
  }, [apiVenues, i18nVenues]);

  return (
    <div className="w-full pt-28">
      {/* Header */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6 md:px-12 text-center max-w-3xl">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-5"
          >
            {t("venues.tagline")}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold font-serif mb-6 text-foreground"
          >
            {t("venues.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mx-auto"
          >
            {t("venues.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Venue cards */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
            {venues.map((venue, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: (i % 2) * 0.1 }}
                className="bg-background border border-border overflow-hidden flex flex-col group hover:shadow-xl transition-shadow"
              >
                {/* Image */}
                <div className="relative h-72 overflow-hidden flex-shrink-0">
                  <img
                    src={(venue as { image?: string }).image || VENUE_IMAGES[i % VENUE_IMAGES.length]}
                    alt={venue.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest bg-primary px-2.5 py-1 mb-2">
                      <MapPin className="w-3 h-3" />
                      {venue.city}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-bold font-serif leading-tight">
                      {venue.name}
                    </h3>
                  </div>
                </div>

                {/* Body */}
                <div className="p-8 flex flex-col flex-grow">
                  <div className="flex flex-wrap gap-x-6 gap-y-3 mb-5 text-xs">
                    <div>
                      <span className="block uppercase tracking-widest text-primary font-bold mb-1 flex items-center gap-1.5">
                        <Users className="w-3 h-3" /> {t("venues.capacity_label")}
                      </span>
                      <span className="text-foreground font-medium text-sm">{venue.capacity}</span>
                    </div>
                    <div>
                      <span className="block uppercase tracking-widest text-primary font-bold mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" /> {t("venues.style_label")}
                      </span>
                      <span className="text-foreground font-medium text-sm">{venue.style}</span>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    {venue.desc}
                  </p>

                  <div className="border-t border-border pt-5 mb-6">
                    <span className="block text-[10px] uppercase tracking-widest text-primary font-bold mb-3">
                      {t("venues.options_label")}
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      {venue.options.map((opt, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-foreground/80">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                          <span>{opt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                    <Link to="/contact" className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full rounded-none border-primary text-primary hover:bg-primary hover:text-white uppercase tracking-wider text-xs h-11"
                      >
                        {t("venues.cta_visit")}
                      </Button>
                    </Link>
                    <Link to="/contact" className="flex-1">
                      <Button className="w-full bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider text-xs h-11">
                        {t("venues.cta_quote")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-20 bg-background border-t border-border">
        <div className="container mx-auto px-6 md:px-12 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-foreground mb-4">
              {t("venues.form_title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("venues.form_desc")}
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="bg-white border border-border p-8 md:p-10 space-y-5"
            data-testid="form-venues"
          >
            <div>
              <label htmlFor="venues-name" className="block text-xs uppercase tracking-widest font-bold text-foreground mb-2">
                {t("venues.form_name")}
              </label>
              <input
                id="venues-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                data-testid="input-venues-name"
              />
            </div>
            <div>
              <label htmlFor="venues-venue" className="block text-xs uppercase tracking-widest font-bold text-foreground mb-2">
                {t("venues.form_venue")}
              </label>
              <input
                id="venues-venue"
                type="text"
                required
                placeholder={t("venues.form_venue_placeholder")}
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                data-testid="input-venues-venue"
              />
            </div>
            <div>
              <label htmlFor="venues-date" className="block text-xs uppercase tracking-widest font-bold text-foreground mb-2">
                {t("venues.form_date")}
              </label>
              <input
                id="venues-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                data-testid="input-venues-date"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-12 mt-2"
              data-testid="button-venues-submit"
            >
              {t("venues.form_submit")}
            </Button>
          </motion.form>
        </div>
      </section>

      {/* Banner */}
      <section className="h-[300px] md:h-[400px] relative overflow-hidden">
        <img src={bannerImg} alt="Wedding" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30"></div>
      </section>
    </div>
  );
}
