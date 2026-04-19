import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MapPin, CheckCircle2, Star } from "lucide-react";

import img1 from "@assets/GM-01293.jpg_1776614313614.jpeg";
import img2 from "@assets/MielmagMS-48of267.jpg_1776614313615.jpeg";
import img3 from "@assets/New-Project-12_1776614330308.png";
import img4 from "@assets/MielmagMS-70of267.jpg_1776614313615.jpeg";
import img5 from "@assets/GM-00756.jpg_1776614313614.jpeg";
import img6 from "@assets/DSC05396.jpg_1776614313613.jpeg";
import img7 from "@assets/GM-00679.jpg_1776614313614.jpeg";
import img8 from "@assets/MielMagGM-156of162.jpg_1776614313614.jpeg";
import bannerImg from "@assets/GM-01293.jpg_1776614313614.jpeg";

const VENDORS = [
  {
    id: 1,
    name: "Aminata Photography",
    city: "Bruxelles",
    categoryIndex: 0,
    tagline: "Spécialiste des mariages afro et mixtes depuis 8 ans. Portraits authentiques chargés d'émotion et de couleurs.",
    rating: 5,
    image: img1,
    verified: true,
  },
  {
    id: 2,
    name: "Film de Miel",
    city: "Bruxelles · Anvers",
    categoryIndex: 1,
    tagline: "Films cinématographiques de mariage d'exception. Chaque image raconte une histoire unique et intemporelle.",
    rating: 5,
    image: img2,
    verified: true,
  },
  {
    id: 3,
    name: "DJ Koffi",
    city: "Liège · Bruxelles",
    categoryIndex: 2,
    tagline: "Ambiances afrobeats, coupe-décalé, afropop et afrotrap. Des sets sur mesure pour vos mariages mixtes.",
    rating: 5,
    image: img3,
    verified: true,
  },
  {
    id: 4,
    name: "Fleurs d'Afrique",
    city: "Bruxelles",
    categoryIndex: 3,
    tagline: "Compositions florales inspirées des traditions africaines. Couleurs vibrantes, textures riches, élégance contemporaine.",
    rating: 5,
    image: img4,
    verified: true,
  },
  {
    id: 5,
    name: "Saveurs du Monde",
    city: "Gand · Bruxelles",
    categoryIndex: 4,
    tagline: "Cuisine fusion afro-européenne raffinée. Cocktails dinatoires, buffets et repas assis pour vos réceptions.",
    rating: 4,
    image: img5,
    verified: true,
  },
  {
    id: 6,
    name: "Beauty by Ama",
    city: "Bruxelles",
    categoryIndex: 5,
    tagline: "Coiffures afro, tresses, chignons élaborés et maquillage de mariée. Sublimez votre beauté naturelle.",
    rating: 5,
    image: img6,
    verified: true,
  },
  {
    id: 7,
    name: "Domaine des Palmes",
    city: "Waterloo · Namur",
    categoryIndex: 6,
    tagline: "Domaine de prestige pour 50 à 500 invités. Espaces modulables, jardins et décoration premium inclus.",
    rating: 4,
    image: img7,
    verified: true,
  },
  {
    id: 8,
    name: "Elite Prestige",
    city: "Bruxelles",
    categoryIndex: 7,
    tagline: "Limousines, berlines de luxe et bus décoré pour cortège nuptial. Ponctualité et élégance garanties.",
    rating: 5,
    image: img8,
    verified: false,
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} étoiles sur 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${star <= count ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30 fill-muted-foreground/10"}`}
        />
      ))}
    </div>
  );
}

export default function Prestations() {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<number | null>(null);

  const categories = t("prestations.items", { returnObjects: true }) as string[];

  useEffect(() => {
    document.title = `${t("prestations.title")} — Mariage Afro`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", t("prestations.subtitle"));
    }
  }, [t]);

  const filtered = activeFilter === null
    ? VENDORS
    : VENDORS.filter((v) => v.categoryIndex === activeFilter);

  const filters = [
    { label: t("prestations.filter_all"), value: null },
    ...categories.map((cat, i) => ({ label: cat, value: i })),
  ];

  return (
    <div className="w-full pt-28">
      {/* Page Header */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-5"
          >
            {t("nav.partners")}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold font-serif mb-6 text-foreground"
          >
            {t("prestations.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            {t("prestations.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Category Filters */}
      <section className="bg-white border-y border-border py-6 sticky top-[62px] lg:top-[72px] z-30">
        <div className="container mx-auto px-4 md:px-12">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
            {filters.map((filter) => (
              <button
                key={String(filter.value)}
                onClick={() => setActiveFilter(filter.value)}
                className={`flex-shrink-0 snap-start px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                  activeFilter === filter.value
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-foreground border-border hover:border-primary hover:text-primary"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Vendor Cards Grid */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-6 md:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={String(activeFilter)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
            >
              {filtered.map((vendor, i) => (
                <motion.div
                  key={vendor.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  className="bg-white border border-border overflow-hidden group flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-300"
                >
                  {/* Photo */}
                  <div className="relative h-52 overflow-hidden flex-shrink-0">
                    <img
                      src={vendor.image}
                      alt={vendor.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors duration-300" />

                    {/* Category badge */}
                    <span className="absolute top-4 left-4 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
                      {categories[vendor.categoryIndex]}
                    </span>

                    {/* Verified badge */}
                    {vendor.verified && (
                      <span className="absolute top-4 right-4 bg-white/95 text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {t("prestations.verified_badge")}
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold font-serif text-foreground leading-tight">
                        {vendor.name}
                      </h3>
                      <StarRating count={vendor.rating} />
                    </div>

                    <p className="flex items-center gap-1.5 text-xs text-primary font-medium uppercase tracking-wide mb-4">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {vendor.city}
                    </p>

                    <p className="text-muted-foreground text-sm leading-relaxed flex-grow mb-6">
                      {vendor.tagline}
                    </p>

                    <Link to="/contact">
                      <Button
                        variant="outline"
                        className="w-full rounded-none border-primary text-primary hover:bg-primary hover:text-white uppercase tracking-wider text-xs h-10 transition-colors"
                      >
                        {t("prestations.vendor_cta")}
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-24 text-muted-foreground">
              <p className="text-lg">Aucun prestataire dans cette catégorie pour le moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* "Besoin d'aide" nudge */}
      <section className="py-16 bg-white border-t border-border">
        <div className="container mx-auto px-6 md:px-12 text-center max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-foreground mb-4">
              Vous ne savez pas par où commencer ?
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Notre équipe vous guide vers les prestataires les plus adaptés à votre vision, vos traditions et votre budget.
            </p>
            <Link to="/contact">
              <Button className="bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-12 px-10">
                {t("prestations.contact_cta")}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Banner */}
      <section className="py-32 relative flex items-center justify-center text-center">
        <div className="absolute inset-0 z-0">
          <img
            src={bannerImg}
            alt="Wedding"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/65"></div>
        </div>
        <div className="relative z-10 container mx-auto px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-white mb-6">
              {t("prestations.banner_title")}
            </h2>
            <p className="text-white/75 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
              {t("prestations.banner_desc")}
            </p>
            <Link to="/contact">
              <Button className="bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-14 px-10 text-sm">
                {t("prestations.banner_cta")}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
