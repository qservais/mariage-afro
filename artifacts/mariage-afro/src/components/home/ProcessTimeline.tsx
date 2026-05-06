import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const steps = [
  {
    num: "01",
    label: "Consultation",
    desc: "Un échange personnalisé pour comprendre votre vision, votre budget et vos besoins culturels.",
    icon: "◎",
  },
  {
    num: "02",
    label: "Sélection",
    desc: "Accès à notre réseau de prestataires triés sur le volet, spécialisés mariage afro & mixte.",
    icon: "◈",
  },
  {
    num: "03",
    label: "Planification",
    desc: "Suivi complet sur notre plateforme : budget, invités, planning, documents en un seul endroit.",
    icon: "◇",
  },
  {
    num: "04",
    label: "Coordination",
    desc: "Nos équipes orchestrent chaque prestataire pour garantir une cohérence parfaite le grand jour.",
    icon: "◆",
  },
  {
    num: "05",
    label: "Jour J",
    desc: "Vivez pleinement votre mariage. Nous gérons les imprévus, vous créez les souvenirs.",
    icon: "★",
  },
];

/**
 * ProcessTimeline — 5-step « Comment ça marche » section.
 * Horizontal timeline on desktop, vertical on mobile.
 * Each step is revealed on scroll via Framer Motion whileInView.
 */
export function ProcessTimeline() {
  const { t } = useTranslation();

  return (
    <section
      className="py-24 md:py-36 bg-primary text-surface overflow-hidden"
      aria-labelledby="process-title"
    >
      <div className="relative max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="inline-flex items-center gap-3 text-[10px] md:text-xs uppercase tracking-[0.4em] text-accent font-medium mb-5">
            <span className="block w-8 h-px bg-accent" />
            {t("process.label", "Notre méthode")}
            <span className="block w-8 h-px bg-accent" />
          </span>
          <h2
            id="process-title"
            className="font-display uppercase text-4xl md:text-6xl lg:text-7xl text-surface leading-[0.95] tracking-tight mt-4"
          >
            {t("process.title", "Comment ça marche")}
          </h2>
          <p className="text-surface/60 max-w-xl mx-auto mt-6 text-sm md:text-base font-light leading-relaxed">
            {t("process.subtitle", "De la première rencontre jusqu'au jour J, un accompagnement sur-mesure.")}
          </p>
        </motion.div>

        {/* Desktop: horizontal connector line */}
        <div className="hidden md:block relative mb-0">
          <div className="absolute top-[2.75rem] left-[calc(10%-1rem)] right-[calc(10%-1rem)] h-px bg-accent/20 z-0" />
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-0 md:gap-0 relative">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: "easeOut" }}
              className="relative flex md:flex-col items-start md:items-center gap-6 md:gap-0 pb-10 md:pb-0 px-0 md:px-4"
            >
              {/* Vertical connector line — mobile only */}
              {i < steps.length - 1 && (
                <div className="md:hidden absolute left-[1.375rem] top-12 bottom-0 w-px bg-accent/20" />
              )}

              {/* Step number bubble */}
              <div className="relative z-10 flex-shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-full border border-accent/40 flex items-center justify-center bg-primary md:mb-6">
                <span className="text-accent font-display text-lg leading-none">{step.icon}</span>
              </div>

              {/* Text content */}
              <div className="md:text-center pt-1 md:pt-0">
                <span className="text-[9px] uppercase tracking-[0.35em] text-accent/60 font-medium block mb-1">
                  {step.num}
                </span>
                <h3 className="font-display uppercase text-xl md:text-2xl text-surface tracking-tight leading-tight mb-3">
                  {step.label}
                </h3>
                <p className="text-surface/55 text-xs md:text-sm leading-relaxed font-light">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
