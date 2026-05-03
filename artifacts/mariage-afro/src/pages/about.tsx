import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Picture } from "@/components/Picture";
import bannerImg from "@assets/MielmagMS-48of267.jpg_1776614313615.jpeg";
import { SEO } from "@/components/SEO";

export default function About() {
  const { t } = useTranslation();


  const team = [
    {
      name: t("about.team_member1_name"),
      role: t("about.team_member1_role"),
      initial: "AD",
      bio: t("about.team_member1_bio")
    },
    {
      name: t("about.team_member2_name"),
      role: t("about.team_member2_role"),
      initial: "CM",
      bio: t("about.team_member2_bio")
    },
    {
      name: t("about.team_member3_name"),
      role: t("about.team_member3_role"),
      initial: "IF",
      bio: t("about.team_member3_bio")
    }
  ];

  return (
    <div className="w-full pt-28">
      <SEO title="À propos" description="Mariage Afro est née de la passion de célébrer les mariages afro et mixtes en Belgique avec excellence, élégance et authenticité." />
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

      <section className="py-20 bg-white">
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
            <Picture
              src={bannerImg}
              alt="Black and white wedding moment"
              width={1200}
              height={800}
              loading="lazy"
              className="w-full h-auto my-12 rounded-sm"
            />
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

      {/* Team Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">{t("about.team_label")}</span>
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-foreground">
              {t("about.team_title")}
            </h2>
            <div className="w-16 h-1 bg-primary mx-auto mt-8"></div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10 max-w-5xl mx-auto">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="flex flex-col items-center text-center bg-white border border-border p-10 shadow-sm"
              >
                <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-primary font-serif">{member.initial}</span>
                </div>
                <h3 className="text-xl font-bold font-serif text-foreground mb-1">{member.name}</h3>
                <p className="text-xs uppercase tracking-widest text-primary font-bold mb-4">{member.role}</p>
                <div className="w-10 h-0.5 bg-primary mb-4"></div>
                <p className="text-muted-foreground text-sm leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
