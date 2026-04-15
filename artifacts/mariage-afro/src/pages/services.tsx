import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

import servicesBg from "@assets/pexels-darina-belonogova-7193204_1776285262172.jpg";

export default function Services() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = "Services — Mariage Afro";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Découvrez nos services de wedding planning complet, coordination jour-J et sélection de prestataires pour votre mariage afro ou mixte en Belgique.");
    }
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <div className="w-full pt-28">
      {/* Header */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold font-serif mb-6 text-foreground"
          >
            {t("services.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            {t("services.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Services List — 3 main services */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ delay: i * 0.1 }}
                className="bg-background border border-border p-10 flex flex-col items-start shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-2xl font-bold mb-4 font-serif">{t(`services.item${i}_title`)}</h3>
                <div className="w-12 h-1 bg-primary mb-6"></div>
                <p className="text-muted-foreground leading-relaxed mb-8 flex-grow">
                  {t(`services.item${i}_desc`)}
                </p>
                <Link to="/contact">
                  <Button variant="outline" className="rounded-none border-primary text-primary hover:bg-primary hover:text-white uppercase tracking-wider w-full">
                    {t(`services.item${i}_cta`)}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Destination Wedding — Featured 4th Service */}
      <section className="py-24 bg-foreground text-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-xs uppercase tracking-[0.3em] text-primary font-bold">
                  Service exclusif
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold font-serif leading-tight mb-6">
                {t("services.item4_title")}
              </h2>
              <div className="w-14 h-1 bg-primary mb-8"></div>
              <p className="text-lg text-white/70 leading-relaxed mb-10">
                {t("services.item4_desc")}
              </p>
              <Link to="/contact">
                <Button className="bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-12 px-8">
                  {t("services.item4_cta")}
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-2 gap-4"
            >
              {["Maroc", "Sénégal", "Côte d'Ivoire", "Portugal"].map((dest, i) => (
                <div
                  key={dest}
                  className="border border-white/15 p-8 flex items-center justify-center text-center bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <span className="font-semibold text-white/80 text-sm tracking-wide">{dest}</span>
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
        <div className="absolute inset-0 bg-black/20"></div>
      </section>
    </div>
  );
}
