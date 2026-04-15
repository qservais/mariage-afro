import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, Video, Music, Flower2, Utensils, Scissors, MapPin, Car } from "lucide-react";

import heroImage from "@assets/pexels-angel-ayala-321556-28976221_1776285262171.jpg";
import aboutImage from "@assets/pexels-pavel-danilyuk-8815279_1776285262172.jpg";
import servicesImg from "@assets/pexels-darina-belonogova-7193167_1776285262172.jpg";
import videoSrc from "@assets/8247047-hd_1920_1080_25fps_1776285295920.mp4";

export default function Home() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = "Mariage Afro — Mariages Afro & Mixtes en Belgique";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Mariage Afro est la première plateforme premium dédiée aux mariages afro et mixtes en Belgique. Trouvez vos prestataires et organisez votre grand jour.");
    }
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.8, ease: "easeOut" as const }
  };

  const serviceCards = [
    {
      num: "01",
      title: "Wedding Planning Complet",
      desc: "De la vision à la réalité : nous orchestrons chaque détail de votre grand jour, de A à Z, dans le respect de vos traditions.",
      href: "/services"
    },
    {
      num: "02",
      title: "Coordination Jour-J",
      desc: "Votre journée se déroulera exactement comme vous l'avez rêvée. Notre équipe gère la logistique en coulisses.",
      href: "/services"
    },
    {
      num: "03",
      title: "Sélection de Prestataires",
      desc: "Accédez à notre réseau exclusif de prestataires spécialisés dans les mariages afro et mixtes en Belgique.",
      href: "/prestations"
    }
  ];

  const prestationsItems = [
    { icon: <Camera className="w-7 h-7 text-primary" />, label: "Photographes" },
    { icon: <Video className="w-7 h-7 text-primary" />, label: "Vidéastes" },
    { icon: <Music className="w-7 h-7 text-primary" />, label: "Animateurs & DJs" },
    { icon: <Flower2 className="w-7 h-7 text-primary" />, label: "Fleuristes" },
    { icon: <Utensils className="w-7 h-7 text-primary" />, label: "Traiteurs" },
    { icon: <Scissors className="w-7 h-7 text-primary" />, label: "Coiffure & Maquillage" },
    { icon: <MapPin className="w-7 h-7 text-primary" />, label: "Lieux de Réception" },
    { icon: <Car className="w-7 h-7 text-primary" />, label: "Transport & Limousines" }
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Wedding Reception"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="container relative z-10 mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="max-w-3xl text-white"
          >
            <span className="inline-block text-xs md:text-sm uppercase tracking-[0.3em] mb-6 font-medium">
              {t("hero.tagline")}
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 font-serif">
              {t("hero.title")}
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl leading-relaxed">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/services">
                <Button className="bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-14 px-8 w-full sm:w-auto">
                  {t("hero.cta_primary")}
                </Button>
              </Link>
              <Link href="/realisations">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black rounded-none uppercase tracking-wider h-14 px-8 w-full sm:w-auto bg-transparent">
                  {t("hero.cta_secondary")}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div {...fadeIn} className="text-center mb-16 md:mb-24">
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-foreground">
              {t("value_props.title")}
            </h2>
            <div className="w-16 h-1 bg-primary mx-auto mt-8"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[1, 2, 3, 4].map((i, index) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto bg-card rounded-full flex items-center justify-center mb-6 shadow-sm border border-border">
                  <span className="text-primary font-bold text-xl">0{i}</span>
                </div>
                <h3 className="text-xl font-bold mb-4">{t(`value_props.item${i}_title`)}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t(`value_props.item${i}_desc`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div {...fadeIn} className="text-center mb-16">
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">Nos Services</span>
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-foreground">
              Un accompagnement sur-mesure
            </h2>
            <div className="w-16 h-1 bg-primary mx-auto mt-8"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {serviceCards.map((card, index) => (
              <motion.div
                key={card.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.12 }}
                className="bg-background border border-border p-10 flex flex-col group hover:shadow-lg transition-shadow"
              >
                <span className="text-4xl font-bold text-primary/20 font-serif mb-4">{card.num}</span>
                <h3 className="text-xl font-bold font-serif mb-4 text-foreground">{card.title}</h3>
                <div className="w-10 h-0.5 bg-primary mb-6"></div>
                <p className="text-muted-foreground leading-relaxed flex-grow mb-8">{card.desc}</p>
                <Link href={card.href}>
                  <Button variant="outline" className="rounded-none border-primary text-primary hover:bg-primary hover:text-white uppercase tracking-wider w-full text-sm">
                    En savoir plus
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/services">
              <Button className="bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-12 px-10">
                Voir tous nos services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Film de Miel (Video Section) */}
      <section className="relative py-32 bg-black text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <video
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container relative z-10 mx-auto px-6 md:px-12 flex justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl bg-black/60 backdrop-blur-sm p-12 md:p-16 border border-white/10"
          >
            <span className="inline-block text-primary uppercase tracking-widest text-sm font-bold mb-4">
              {t("film_de_miel.label")}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold font-serif mb-6">
              {t("film_de_miel.title")}
            </h2>
            <p className="text-lg text-white/80 leading-relaxed mb-10">
              {t("film_de_miel.desc")}
            </p>
            <Link href="/realisations">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white rounded-none uppercase tracking-wider h-12 px-8 bg-transparent">
                {t("film_de_miel.cta")}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Prestations Grid Preview */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div {...fadeIn} className="text-center mb-16">
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">Nos Prestataires</span>
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-foreground">
              Tous vos besoins, un seul réseau
            </h2>
            <div className="w-16 h-1 bg-primary mx-auto mt-8"></div>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {prestationsItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="group border border-border bg-white p-8 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
              >
                <div className="mb-4">{item.icon}</div>
                <h3 className="font-semibold text-sm text-foreground">{item.label}</h3>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/prestations">
              <Button className="bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-12 px-10">
                Découvrir tous les prestataires
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <img
                src={aboutImage}
                alt="Mixed Wedding Ceremony"
                className="w-full h-[600px] object-cover rounded-sm shadow-xl"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:pl-10"
            >
              <span className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-6">Notre Histoire</span>
              <h2 className="text-3xl md:text-5xl font-bold font-serif text-foreground mb-8">
                L'art de célébrer l'union de vos cultures
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Chaque histoire d'amour est unique, et lorsque deux cultures se rencontrent, elles méritent une célébration qui honore les deux héritages avec élégance et respect.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-10">
                Chez Mariage Afro, nous avons créé le premier espace en Belgique où l'excellence de l'événementiel rencontre la richesse de vos traditions. Nous sélectionnons les meilleurs prestataires pour faire de votre vision une réalité inoubliable.
              </p>
              <Link href="/a-propos">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase tracking-wider h-12 px-8">
                  Découvrir notre histoire
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-28 bg-primary text-white">
        <div className="container mx-auto px-6 md:px-12 text-center max-w-3xl">
          <motion.div {...fadeIn}>
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-white/60 font-bold mb-6">Commencez dès aujourd'hui</span>
            <h2 className="text-3xl md:text-5xl font-bold font-serif mb-8 leading-tight">
              Prêts à vivre le mariage de vos rêves ?
            </h2>
            <p className="text-lg text-white/80 leading-relaxed mb-10">
              Prenez rendez-vous avec notre équipe pour une consultation gratuite. Nous construirons ensemble un projet à la mesure de votre amour et de vos cultures.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button className="bg-white text-primary hover:bg-white/90 rounded-none uppercase tracking-wider h-14 px-10 font-bold w-full sm:w-auto">
                  Prendre rendez-vous
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary rounded-none uppercase tracking-wider h-14 px-10 bg-transparent w-full sm:w-auto">
                  Voir nos services
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services image accent */}
      <section className="h-[300px] md:h-[450px] relative overflow-hidden">
        <img
          src={servicesImg}
          alt="Wedding Details"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20"></div>
      </section>
    </div>
  );
}
