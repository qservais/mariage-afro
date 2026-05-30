import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="w-full pt-28">
      <SEO title="À propos" description="Mariage Afro est née de la passion de célébrer les mariages afro et mixtes avec excellence, élégance et authenticité, partout en Europe et en Afrique." />
      {/* Header */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold font-serif mb-6 text-foreground"
          >
            {t("about.title")}
          </motion.h1>
        </div>
      </section>

      <section className="py-20 bg-cream">
        <div className="container mx-auto px-6 md:px-12 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="prose prose-lg md:prose-xl text-muted-foreground mx-auto"
          >
            <p className="text-2xl text-foreground font-serif leading-relaxed mb-8">
              "{t("about.quote")}"
            </p>
            <p>{t("about.text1")}</p>
            <p>{t("about.text2")}</p>
            <h2 className="text-3xl font-serif text-foreground mt-12 mb-6">{t("about.vision_title")}</h2>
            <p>{t("about.vision_text1")}</p>
            <p>{t("about.vision_text2")}</p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <div className="text-4xl md:text-6xl font-bold font-serif mb-2">{t("about.stat1_value")}</div>
              <div className="uppercase tracking-widest text-sm">{t("about.stat1_label")}</div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="text-4xl md:text-6xl font-bold font-serif mb-2">{t("about.stat2_value")}</div>
              <div className="uppercase tracking-widest text-sm">{t("about.stat2_label")}</div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="text-4xl md:text-6xl font-bold font-serif mb-2">{t("about.stat3_value")}</div>
              <div className="uppercase tracking-widest text-sm">{t("about.stat3_label")}</div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <div className="text-4xl md:text-6xl font-bold font-serif mb-2">{t("about.stat4_value")}</div>
              <div className="uppercase tracking-widest text-sm">{t("about.stat4_label")}</div>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
