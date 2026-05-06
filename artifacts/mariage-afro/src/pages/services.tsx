import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Globe } from "lucide-react";

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

      {/* Services Grid — 9 services in 3×3 */}
      <section className="py-24 md:py-32 bg-cream">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-wine-deep/10 border border-wine-deep/10">
            {[
              { num: 1, to: "/contact" },
              { num: 2, to: "/contact" },
              { num: 3, to: "/contact" },
              { num: 5, to: "/plateforme" },
              { num: 6, to: "/espace-client" },
              { num: 7, to: "/shop" },
              { num: 4, to: "#destination-wedding" },
              { num: 8, to: "/contact" },
              { num: 9, to: "/contact" },
            ].map((item, idx) => {
              const benefits = t(`services.item${item.num}_benefits`, { returnObjects: true, defaultValue: [] }) as string[];
              return (
                <motion.div
                  key={item.num}
                  {...fadeIn}
                  transition={{ delay: idx * 0.08 }}
                  className="bg-cream p-10 md:p-12 flex flex-col items-start"
                >
                  <span className="font-display text-6xl text-gold-deep mb-6 leading-none">{String(idx + 1).padStart(2, "0")}</span>
                  <h3 className="font-display uppercase text-2xl md:text-3xl tracking-tight text-wine-deep mb-5 leading-[1]">{t(`services.item${item.num}_title`)}</h3>
                  <div className="w-8 h-px bg-gold-deep mb-6"></div>
                  <p className="text-wine-deep/70 leading-relaxed mb-6 font-light text-sm md:text-base">
                    {t(`services.item${item.num}_desc`)}
                  </p>
                  {Array.isArray(benefits) && benefits.length > 0 && (
                    <ul className="space-y-2 mb-10 flex-grow w-full" data-testid={`list-benefits-${item.num}`}>
                      {benefits.map((b, bi) => (
                        <li key={bi} className="flex items-start gap-3 text-wine-deep/80 font-light text-sm">
                          <span className="mt-[0.6em] inline-block w-3 h-px bg-gold-deep flex-shrink-0"></span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!(Array.isArray(benefits) && benefits.length > 0) && <div className="flex-grow"></div>}
                  {item.to.startsWith("#") ? (
                    <a href={item.to} className="btn-editorial-compact w-full justify-center" data-testid={`link-service-${item.num}`}>
                      {t(`services.item${item.num}_cta`)}
                    </a>
                  ) : (
                    <Link to={item.to} className="btn-editorial-compact w-full justify-center" data-testid={`link-service-${item.num}`}>
                      {t(`services.item${item.num}_cta`)}
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Destination Wedding — 4 Continents */}
      <section id="destination-wedding" className="py-28 md:py-40 bg-wine-deep text-cream relative overflow-hidden scroll-mt-24">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>\")" }}
        />
        <div className="container relative z-10 mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 md:mb-20"
          >
            <span className="section-eyebrow section-eyebrow-light mb-6 inline-flex items-center gap-2">
              <Globe className="w-3 h-3" />
              {t("destination.section_label")}
            </span>
            <h2 className="font-display uppercase text-cream text-4xl md:text-6xl lg:text-7xl mt-4 mb-8 leading-[0.95] tracking-tight">
              {t("services.item4_title")}
            </h2>
            <p className="text-lg text-cream/70 leading-relaxed mb-10 font-light max-w-2xl mx-auto">
              {t("services.item4_desc")}
            </p>
            <Link to="/contact" className="btn-editorial">
              {t("services.item4_cta")}
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-cream/10 border border-cream/10 mt-16">
            {[
              { nameKey: "destination.afrique_name", countriesKey: "destination.afrique_countries", gradient: "from-amber-900/60 to-wine-deep" },
              { nameKey: "destination.europe_name", countriesKey: "destination.europe_countries", gradient: "from-blue-900/60 to-wine-deep" },
              { nameKey: "destination.asie_name", countriesKey: "destination.asie_countries", gradient: "from-emerald-900/60 to-wine-deep" },
              { nameKey: "destination.amerique_name", countriesKey: "destination.amerique_countries", gradient: "from-purple-900/60 to-wine-deep" },
            ].map((continent, idx) => (
              <motion.div
                key={continent.nameKey}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="relative bg-wine-deep hover:bg-wine-mid transition-colors min-h-[220px] p-10 flex flex-col justify-between group overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${continent.gradient} opacity-30 group-hover:opacity-40 transition-opacity`} />
                <div className="relative z-10">
                  <MapPin className="w-4 h-4 text-gold mb-5" />
                  <h3 className="font-display uppercase text-2xl md:text-3xl tracking-tight text-cream mb-3 leading-[1]">
                    {t(continent.nameKey)}
                  </h3>
                </div>
                <p className="relative z-10 text-[11px] uppercase tracking-[0.3em] text-gold/80 font-medium leading-relaxed">
                  {t(continent.countriesKey)}
                </p>
              </motion.div>
            ))}
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
