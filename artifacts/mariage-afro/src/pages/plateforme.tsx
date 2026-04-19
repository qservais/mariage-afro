import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Wallet,
  Users,
  CalendarClock,
  FolderOpen,
  Handshake,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import heroImg from "@assets/MielmagMS-70of267.jpg_1776614313615.jpeg";

const ICONS = [LayoutDashboard, Wallet, Users, CalendarClock, FolderOpen, Handshake, Sparkles];

export default function Plateforme() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("nav.platform")} — Mariage Afro`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", t("platform_page.subtitle"));
    }
  }, [t]);

  const modules = [1, 2, 3, 4, 5, 6, 7].map((i) => ({
    icon: ICONS[i - 1],
    title: t(`platform_page.module${i}_title`),
    desc: t(`platform_page.module${i}_desc`),
    benefit: t(`platform_page.module${i}_benefit`),
  }));

  return (
    <div className="w-full pt-20">
      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden bg-foreground text-white">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="Platform" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-foreground/70" />
        </div>
        <div className="container relative z-10 mx-auto px-6 md:px-12 text-center max-w-4xl">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-5"
          >
            {t("platform_page.tagline")}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-4xl md:text-6xl font-bold font-serif leading-tight mb-6"
          >
            {t("platform_page.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto mb-10"
          >
            {t("platform_page.subtitle")}
          </motion.p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button className="bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-14 px-8 w-full sm:w-auto">
                {t("platform_page.cta_primary")}
              </Button>
            </Link>
            <Link to="/services">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-foreground rounded-none uppercase tracking-wider h-14 px-8 bg-transparent w-full sm:w-auto">
                {t("platform_page.cta_secondary")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Modules grid */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 md:mb-20 max-w-3xl mx-auto"
          >
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">
              {t("platform_page.modules_label")}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-foreground">
              {t("platform_page.modules_title")}
            </h2>
            <div className="w-16 h-1 bg-primary mx-auto mt-8"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {modules.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  className="bg-white border border-border p-8 flex flex-col group hover:border-primary hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-3xl font-bold text-primary/15 font-serif">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold font-serif text-foreground mb-3">{m.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-grow">
                    {m.desc}
                  </p>
                  <div className="border-t border-border pt-4 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-foreground/80 font-medium leading-snug">
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
      <section className="py-24 md:py-28 bg-primary text-white">
        <div className="container mx-auto px-6 md:px-12 text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold font-serif mb-6 leading-tight">
              {t("platform_page.cta_section_title")}
            </h2>
            <p className="text-lg text-white/85 leading-relaxed mb-10">
              {t("platform_page.cta_section_desc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button className="bg-white text-primary hover:bg-white/90 rounded-none uppercase tracking-wider h-14 px-10 font-bold w-full sm:w-auto gap-2">
                  {t("platform_page.cta_primary")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/espace-client">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary rounded-none uppercase tracking-wider h-14 px-10 bg-transparent w-full sm:w-auto">
                  {t("nav.client_area")}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
