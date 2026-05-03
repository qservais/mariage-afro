import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Wallet,
  Users,
  CalendarClock,
  FolderOpen,
  Handshake,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

import heroImg from "@assets/MielmagMS-70of267.jpg_1776614313615.jpeg";
import { Picture } from "@/components/Picture";
import { SEO } from "@/components/SEO";

const ICONS = [LayoutDashboard, Wallet, Users, CalendarClock, FolderOpen, Handshake, Sparkles];

export default function Plateforme() {
  const { t } = useTranslation();


  const modules = [1, 2, 3, 4, 5, 6, 7].map((i) => ({
    icon: ICONS[i - 1],
    title: t(`platform_page.module${i}_title`),
    desc: t(`platform_page.module${i}_desc`),
    benefit: t(`platform_page.module${i}_benefit`),
  }));

  return (
    <div className="w-full">
      <SEO title="La plateforme" description="Découvrez Mariage Afro : marketplace de prestataires vérifiés, espace client complet et outils pour organiser un mariage afro ou mixte en Belgique." />
      {/* Hero — wine-deep editorial */}
      <section className="relative pt-40 pb-28 md:pt-48 md:pb-36 overflow-hidden bg-wine-deep text-cream">
        <div className="absolute inset-0 z-0">
          <Picture
            src={heroImg}
            alt="Couple afro célébrant son mariage"
            width={2048}
            height={1365}
            loading="eager"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-wine-deep/60" />
        </div>
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>\")" }}
        />
        <div className="container relative z-10 mx-auto px-6 md:px-12 text-center max-w-5xl">
          <motion.span
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="section-eyebrow section-eyebrow-light mb-8"
          >
            {t("platform_page.tagline")}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            className="font-display uppercase font-medium leading-[0.95] tracking-[-0.01em] mt-6 mb-8 text-cream text-5xl md:text-7xl lg:text-[6.5rem]"
          >
            {t("platform_page.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            className="text-lg md:text-xl text-cream/75 leading-relaxed max-w-2xl mx-auto mb-14 font-light"
          >
            {t("platform_page.subtitle")}
          </motion.p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/contact" className="btn-editorial w-full sm:w-auto justify-center">
              {t("platform_page.cta_primary")}
            </Link>
            <Link to="/services" className="btn-editorial-ghost text-cream/80 hover:text-gold">
              {t("platform_page.cta_secondary")} →
            </Link>
          </div>
        </div>
      </section>

      {/* Modules grid */}
      <section className="py-24 md:py-32 bg-cream">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20 max-w-3xl mx-auto"
          >
            <span className="section-eyebrow mb-6">{t("platform_page.modules_label")}</span>
            <h2 className="section-title-editorial text-4xl md:text-6xl lg:text-7xl mt-4">
              {t("platform_page.modules_title")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-wine-deep/10 border border-wine-deep/10">
            {modules.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  className="bg-cream p-10 flex flex-col group hover:bg-white transition-colors"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-14 h-14 border border-gold-deep flex items-center justify-center text-gold-deep group-hover:bg-gold-deep group-hover:text-cream transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-display text-5xl text-gold-deep/40 leading-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="font-display uppercase text-xl tracking-tight text-wine-deep mb-4">{m.title}</h3>
                  <p className="text-wine-deep/65 text-sm leading-relaxed mb-8 flex-grow font-light">
                    {m.desc}
                  </p>
                  <div className="border-t border-wine-deep/10 pt-5 flex items-start gap-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold-deep flex-shrink-0 mt-1" />
                    <span className="text-[11px] uppercase tracking-[0.15em] text-wine-deep/80 font-medium leading-snug">
                      {m.benefit}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-32 md:py-40 bg-wine-deep text-cream relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>\")" }}
        />
        <div className="container relative z-10 mx-auto px-6 md:px-12 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-eyebrow section-eyebrow-light mb-8">Lancement</span>
            <h2 className="font-display uppercase text-cream text-4xl md:text-6xl lg:text-7xl mt-4 mb-10 leading-[0.95] tracking-tight">
              {t("platform_page.cta_section_title")}
            </h2>
            <p className="text-lg text-cream/75 leading-relaxed mb-14 font-light max-w-2xl mx-auto">
              {t("platform_page.cta_section_desc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/contact" className="btn-editorial w-full sm:w-auto justify-center">
                {t("platform_page.cta_primary")}
              </Link>
              <Link to="/espace-client" className="btn-editorial-ghost text-cream/80 hover:text-gold">
                {t("nav.client_area")} →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
