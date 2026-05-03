import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

import servicesBg from "@assets/pexels-angel-ayala-321556-28976221_1776285262171.jpg";
import { SEO } from "@/components/SEO";

const SERVICES_JSONLD = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Services pour mariages afro et mixtes en Belgique",
  itemListElement: [
    "Photographie",
    "Vidéographie",
    "DJ & Animation musicale",
    "Décoration florale",
    "Traiteur",
    "Coiffure & Maquillage",
    "Lieux de réception",
    "Transport",
    "Wedding planning",
    "Papeterie & Faire-part",
  ].map((name, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Service",
      name,
      provider: {
        "@type": "Organization",
        name: "Mariage Afro",
        url: "https://www.mariage-afro.com/",
      },
      areaServed: { "@type": "Country", name: "Belgique" },
      serviceType: name,
      url: "https://www.mariage-afro.com/partenaires",
    },
  })),
} as const;

export default function Services() {
  const { t } = useTranslation();


  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <div className="w-full">
      <SEO title="Nos services" description="Photographes, traiteurs, DJ, lieux, décoration : tous les services pour un mariage afro ou mixte en Belgique, sélectionnés et vérifiés." jsonLd={SERVICES_JSONLD} />
      {/* Hero éditorial */}
      <section className="relative bg-wine-deep text-cream pt-40 pb-24 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>\")" }}
        />
        <div className="relative z-10 container mx-auto px-6 md:px-12 max-w-5xl text-center">
          <motion.span
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="section-eyebrow section-eyebrow-light mb-8"
          >
            {t("services.label")}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            className="font-display uppercase font-medium leading-[0.95] tracking-[-0.01em] mt-6 mb-8 text-cream text-5xl md:text-7xl lg:text-[6rem]"
          >
            {t("services.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-cream/70 font-light max-w-2xl mx-auto leading-relaxed"
          >
            {t("services.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Services List — 3 main services */}
      <section className="py-24 md:py-32 bg-cream">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-wine-deep/10 border border-wine-deep/10">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ delay: i * 0.1 }}
                className="bg-cream p-10 md:p-12 flex flex-col items-start"
              >
                <span className="font-display text-6xl text-gold mb-6 leading-none">0{i}</span>
                <h3 className="font-display uppercase text-2xl md:text-3xl tracking-tight text-wine-deep mb-5 leading-[1]">{t(`services.item${i}_title`)}</h3>
                <div className="w-8 h-px bg-gold mb-6"></div>
                <p className="text-wine-deep/70 leading-relaxed mb-10 flex-grow font-light text-sm md:text-base">
                  {t(`services.item${i}_desc`)}
                </p>
                <Link to="/contact" className="btn-editorial-compact w-full justify-center">
                  {t(`services.item${i}_cta`)}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Destination Wedding — Featured 4th Service */}
      <section className="py-28 md:py-40 bg-wine-deep text-cream relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>\")" }}
        />
        <div className="container relative z-10 mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="section-eyebrow section-eyebrow-light section-eyebrow-left mb-6 inline-flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                Service exclusif
              </span>
              <h2 className="font-display uppercase text-cream text-4xl md:text-6xl lg:text-7xl mt-4 mb-8 leading-[0.95] tracking-tight">
                {t("services.item4_title")}
              </h2>
              <p className="text-lg text-cream/70 leading-relaxed mb-12 font-light">
                {t("services.item4_desc")}
              </p>
              <Link to="/contact" className="btn-editorial">
                {t("services.item4_cta")}
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-2 gap-px bg-cream/10 border border-cream/10"
            >
              {["Maroc", "Sénégal", "Côte d'Ivoire", "Portugal"].map((dest) => (
                <div
                  key={dest}
                  className="bg-wine-deep p-12 flex flex-col items-center justify-center text-center hover:bg-wine-mid transition-colors min-h-[180px]"
                >
                  <MapPin className="w-4 h-4 text-gold mb-4" />
                  <span className="font-display uppercase text-xl tracking-tight text-cream">{dest}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Image Banner */}
      <section className="h-[300px] md:h-[500px] relative overflow-hidden">
        <img
          src={servicesBg}
          alt="Details"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-wine-deep/30"></div>
      </section>
    </div>
  );
}
