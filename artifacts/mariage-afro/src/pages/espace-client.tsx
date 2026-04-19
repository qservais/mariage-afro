import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Users,
  CalendarClock,
  FolderOpen,
  Handshake,
  Sparkles,
  Lock,
} from "lucide-react";

const FEATURE_ICONS = [Wallet, Users, CalendarClock, FolderOpen, Handshake, Sparkles];

export default function EspaceClient() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("nav.client_area")} — Mariage Afro`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", t("client_area.subtitle"));
    }
  }, [t]);

  const features = [1, 2, 3, 4, 5, 6].map((i) => ({
    Icon: FEATURE_ICONS[i - 1],
    label: t(`client_area.feature${i}`),
  }));

  return (
    <div className="w-full pt-28">
      {/* Hero */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container mx-auto px-6 md:px-12 text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 text-primary mb-8 rounded-full"
          >
            <Lock className="w-9 h-9" />
          </motion.div>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-5"
          >
            {t("client_area.tagline")}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold font-serif mb-6 text-foreground"
          >
            {t("client_area.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground leading-relaxed"
          >
            {t("client_area.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6 md:px-12 max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {features.map((f, i) => {
              const Icon = f.Icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="flex items-start gap-4 p-6 border border-border bg-background"
                >
                  <div className="w-11 h-11 bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-snug">{f.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary text-white">
        <div className="container mx-auto px-6 md:px-12 text-center max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-5 leading-tight">
              {t("client_area.cta_title")}
            </h2>
            <p className="text-lg text-white/85 leading-relaxed mb-10">
              {t("client_area.cta_desc")}
            </p>
            <Link to="/contact">
              <Button className="bg-white text-primary hover:bg-white/90 rounded-none uppercase tracking-wider h-14 px-10 font-bold">
                {t("client_area.cta_button")}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
