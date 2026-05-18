import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const metrics = [
  { value: "50+", label: "Prestataires vérifiés" },
  { value: "55", label: "Pays représentés" },
  { value: "150+", label: "Mariages accompagnés" },
  { value: "3", label: "Langues disponibles" },
];

/**
 * TrustBar — horizontal strip of key social-proof metrics.
 * Appears just below the hero, scroll-triggered reveal via Framer Motion.
 * Mobile-first, non-intrusive, cream/gold palette.
 */
export function TrustBar() {
  const { t } = useTranslation();

  return (
    <section
      className="bg-surface border-t border-b border-primary/10 py-8 md:py-10 overflow-hidden"
      aria-label={t("trust_bar.aria_label", "Chiffres clés Mariage Afro")}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-primary/10 border border-primary/10">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: "easeOut" }}
              className="bg-surface flex flex-col items-center justify-center py-6 md:py-8 px-4 text-center"
            >
              <span className="font-display text-4xl md:text-5xl text-accent-deep leading-none mb-2">
                {metric.value}
              </span>
              <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-primary/60 font-medium">
                {metric.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Separator line with label */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-[10px] uppercase tracking-[0.35em] text-primary/40 font-medium mt-5"
        >
          {t("trust_bar.label", "La référence du mariage afro & mixte — partout dans le monde")}
        </motion.p>
      </div>
    </section>
  );
}
