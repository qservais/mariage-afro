import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import bannerImg from "@assets/pexels-rimiscky-34747069_1776285262172.jpg";

const team = [
  {
    name: "Amara Diallo",
    role: "Fondatrice & Wedding Planner",
    initial: "AD",
    bio: "Spécialisée dans les mariages afro depuis 10 ans, Amara allie tradition et modernité pour créer des cérémonies uniques."
  },
  {
    name: "Chloé Mbeki",
    role: "Coordinatrice Senior",
    initial: "CM",
    bio: "Passionnée par les cultures africaines, Chloé veille à ce que chaque détail reflète l'identité du couple."
  },
  {
    name: "Ismaël Fontaine",
    role: "Responsable Prestataires",
    initial: "IF",
    bio: "Ismaël sélectionne et coordonne notre réseau exclusif de prestataires spécialisés en mariage afro et mixte."
  }
];

export default function About() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = "Notre Histoire — Mariage Afro";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Découvrez l'équipe de Mariage Afro, première plateforme premium dédiée aux mariages afro et mixtes en Belgique.");
    }
  }, []);

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
            Notre Histoire
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
              "Mariage Afro est né d'un constat simple : l'amour n'a pas de frontières, mais il a des racines."
            </p>
            <p>
              Créée en 2023, notre plateforme est le fruit de la passion de professionnels de l'événementiel qui souhaitaient offrir aux couples afro et mixtes de Belgique un espace où leurs cultures seraient comprises, valorisées et célébrées avec élégance.
            </p>
            <p>
              L'organisation d'un mariage mixte ou d'un mariage afro traditionnel demande une expertise particulière. Il faut savoir naviguer entre différentes attentes familiales, harmoniser des coutumes parfois très différentes, et surtout, créer un événement qui ressemble au couple tout en honorant ses origines.
            </p>
            <img
              src={bannerImg}
              alt="Black and white wedding moment"
              className="w-full h-auto my-12 rounded-sm"
            />
            <h2 className="text-3xl font-serif text-foreground mt-12 mb-6">Notre Vision</h2>
            <p>
              Nous croyons que l'excellence réside dans les détails. Chaque mariage que nous accompagnons est traité comme une œuvre d'art unique. Nous avons rassemblé les meilleurs prestataires de Belgique, spécialisés et passionnés, pour vous offrir un service premium.
            </p>
            <p>
              Que vous rêviez d'une cérémonie traditionnelle intime ou d'une grande réception fusionnant deux cultures, nous sommes là pour transformer votre vision en une réalité exceptionnelle.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <div className="text-4xl md:text-6xl font-bold font-serif mb-2">150+</div>
              <div className="uppercase tracking-widest text-sm">Mariages Célébrés</div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="text-4xl md:text-6xl font-bold font-serif mb-2">50+</div>
              <div className="uppercase tracking-widest text-sm">Prestataires Premium</div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="text-4xl md:text-6xl font-bold font-serif mb-2">12</div>
              <div className="uppercase tracking-widest text-sm">Cultures Représentées</div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <div className="text-4xl md:text-6xl font-bold font-serif mb-2">100%</div>
              <div className="uppercase tracking-widest text-sm">Clients Satisfaits</div>
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
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">Notre Équipe</span>
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-foreground">
              Des experts à votre service
            </h2>
            <div className="w-16 h-1 bg-primary mx-auto mt-8"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
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
