import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Quote, Heart, Globe2, Star, Lightbulb } from "lucide-react";
import { SEO } from "@/components/SEO";

const VALUES = [
  {
    icon: Star,
    title: "Excellence",
    desc: "Chaque union mérite le meilleur. Nous sélectionnons rigoureusement chaque prestataire pour garantir un niveau irréprochable.",
  },
  {
    icon: Heart,
    title: "Authenticité",
    desc: "Honorer les cultures et traditions de chaque couple, sans compromis sur l'identité ni sur l'élégance.",
  },
  {
    icon: Globe2,
    title: "Diversité",
    desc: "Célébrer tous les mélanges — afro-européens, afro-asiatiques, afro-américains — avec la même passion et le même soin.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    desc: "Réinventer la célébration en mariant les traditions ancestrales avec les codes contemporains du luxe événementiel.",
  },
];

const fadeIn = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.7 } };

export default function About() {
  const { t } = useTranslation();
  const [videoError, setVideoError] = useState(false);

  return (
    <div className="w-full pt-28">
      <SEO
        title="À propos"
        description="Mariage Afro est née de la passion de célébrer les mariages afro et mixtes avec excellence, élégance et authenticité, partout en Europe et en Afrique."
      />

      {/* Editorial Hero */}
      <section className="relative bg-wine-deep text-cream pt-40 pb-24 md:pt-52 md:pb-36 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>\")",
          }}
        />
        <div className="relative z-10 container mx-auto px-6 md:px-12 text-center max-w-5xl">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-gold font-medium mb-8"
          >
            <span className="block w-8 h-px bg-gold" />
            {t("home.about_label")}
            <span className="block w-8 h-px bg-gold" />
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display uppercase font-medium leading-[0.9] tracking-[-0.01em] mb-8 text-cream text-5xl md:text-7xl lg:text-[7rem]"
          >
            {t("about.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-base md:text-lg text-cream/70 font-light max-w-2xl mx-auto leading-relaxed"
          >
            {t("about.text1")}
          </motion.p>
        </div>
      </section>

      {/* Mission / Quote */}
      <section className="py-24 md:py-36 bg-cream">
        <div className="container mx-auto px-6 md:px-12 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeIn}>
              <Quote className="w-10 h-10 text-gold mb-8" aria-hidden="true" />
              <blockquote className="font-display italic text-2xl md:text-3xl text-wine-deep leading-[1.2] mb-8">
                "{t("about.quote")}"
              </blockquote>
              <p className="text-wine-deep/70 leading-relaxed mb-6 font-light">
                {t("about.text2")}
              </p>
              <h2 className="font-display uppercase text-wine-deep text-xl md:text-2xl tracking-tight mt-10 mb-4">
                {t("about.vision_title")}
              </h2>
              <p className="text-wine-deep/70 leading-relaxed mb-4 font-light">
                {t("about.vision_text1")}
              </p>
              <p className="text-wine-deep/70 leading-relaxed font-light">
                {t("about.vision_text2")}
              </p>
            </motion.div>

            <motion.div
              {...fadeIn}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative aspect-[4/5] overflow-hidden"
            >
              <img
                src="/images/dsc05077.webp"
                alt="Mariage afro et mixte — L'art de célébrer"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-wine-deep/30 via-transparent to-transparent pointer-events-none" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 md:py-28 bg-wine-deep text-cream">
        <div className="container mx-auto px-6 md:px-12 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: t("about.stat1_value"), label: t("about.stat1_label") },
              { value: t("about.stat2_value"), label: t("about.stat2_label") },
              { value: t("about.stat3_value"), label: t("about.stat3_label") },
              { value: t("about.stat4_value"), label: t("about.stat4_label") },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <div className="font-display text-5xl md:text-7xl text-gold mb-3 leading-none">
                  {stat.value}
                </div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-cream/70 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 md:py-36 bg-[#faf9f7]">
        <div className="container mx-auto px-6 md:px-12 max-w-6xl">
          <motion.div {...fadeIn} className="text-center mb-20">
            <span className="section-eyebrow mb-6">Nos valeurs</span>
            <h2 className="section-title-editorial text-3xl md:text-4xl lg:text-5xl mt-4 text-wine-deep">
              Ce qui nous guide
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-wine-deep/10 border border-wine-deep/10">
            {VALUES.map((val, i) => {
              const Icon = val.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="bg-[#faf9f7] p-10 md:p-14 flex flex-col gap-5"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-display text-[2.5rem] leading-none text-wine-deep/15 font-bold select-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Icon className="w-6 h-6 text-gold flex-shrink-0" aria-hidden="true" />
                  </div>
                  <h3 className="font-display uppercase text-wine-deep text-xl tracking-tight">
                    {val.title}
                  </h3>
                  <p className="text-wine-deep/65 text-sm leading-relaxed font-light">
                    {val.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Video — only renders if file present */}
      {!videoError && (
        <section className="relative bg-[#0a0705] overflow-hidden">
          <video
            src="/images/about-video.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="w-full max-h-[80vh] object-cover opacity-90"
            onError={() => setVideoError(true)}
            aria-label="Mariage Afro — reportage vidéo"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0705]/60 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <p className="text-[10px] uppercase tracking-[0.4em] text-cream/60 font-medium">
              Mariage Afro — en images
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
