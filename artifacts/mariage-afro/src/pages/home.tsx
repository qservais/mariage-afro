import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, Video, Music, Flower2, Utensils, Scissors, MapPin, Car, Quote } from "lucide-react";

import heroImage from "@assets/GM-00756.jpg_1776614313614.jpeg";
import aboutImage from "@assets/pexels-rimiscky-34747069_1776285262172.jpg";
import servicesImg from "@assets/MielmagMS-70of267.jpg_1776614313615.jpeg";
import videoSrc from "@assets/Trailer-de-dingue_1776614330311.mp4";

export default function Home() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = "Mariage Afro — Mariages Afro & Mixtes en Belgique";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", t("hero.subtitle"));
    }
  }, [t]);

  const fadeIn = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.8, ease: "easeOut" as const }
  };

  const serviceCards = [
    {
      num: t("home.service1_num"),
      title: t("home.service1_title"),
      desc: t("home.service1_desc"),
      href: "/services"
    },
    {
      num: t("home.service2_num"),
      title: t("home.service2_title"),
      desc: t("home.service2_desc"),
      href: "/services"
    },
    {
      num: t("home.service3_num"),
      title: t("home.service3_title"),
      desc: t("home.service3_desc"),
      href: "/partenaires"
    }
  ];

  const howSteps = [
    {
      num: t("home.how_step1_num"),
      title: t("home.how_step1_title"),
      desc: t("home.how_step1_desc")
    },
    {
      num: t("home.how_step2_num"),
      title: t("home.how_step2_title"),
      desc: t("home.how_step2_desc")
    },
    {
      num: t("home.how_step3_num"),
      title: t("home.how_step3_title"),
      desc: t("home.how_step3_desc")
    }
  ];

  const prestationsItems = [
    { icon: <Camera className="w-7 h-7 text-primary" />, label: t("prestations.items.0") },
    { icon: <Video className="w-7 h-7 text-primary" />, label: t("prestations.items.1") },
    { icon: <Music className="w-7 h-7 text-primary" />, label: t("prestations.items.2") },
    { icon: <Flower2 className="w-7 h-7 text-primary" />, label: t("prestations.items.3") },
    { icon: <Utensils className="w-7 h-7 text-primary" />, label: t("prestations.items.4") },
    { icon: <Scissors className="w-7 h-7 text-primary" />, label: t("prestations.items.5") },
    { icon: <MapPin className="w-7 h-7 text-primary" />, label: t("prestations.items.6") },
    { icon: <Car className="w-7 h-7 text-primary" />, label: t("prestations.items.7") }
  ];

  const platformPoints = [
    {
      num: t("platform.point1_num"),
      title: t("platform.point1_title"),
      desc: t("platform.point1_desc")
    },
    {
      num: t("platform.point2_num"),
      title: t("platform.point2_title"),
      desc: t("platform.point2_desc")
    },
    {
      num: t("platform.point3_num"),
      title: t("platform.point3_title"),
      desc: t("platform.point3_desc")
    }
  ];

  const testimonials = [
    {
      quote: t("testimonials.item1_quote"),
      name: t("testimonials.item1_name"),
      origin: t("testimonials.item1_origin")
    },
    {
      quote: t("testimonials.item2_quote"),
      name: t("testimonials.item2_name"),
      origin: t("testimonials.item2_origin")
    },
    {
      quote: t("testimonials.item3_quote"),
      name: t("testimonials.item3_name"),
      origin: t("testimonials.item3_origin")
    }
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
          <div className="absolute inset-0 bg-black/45" />
        </div>

        <div className="container relative z-10 mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="max-w-3xl text-white"
          >
            <span className="inline-block text-xs md:text-sm uppercase tracking-[0.3em] mb-6 font-medium opacity-80">
              {t("hero.tagline")}
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 font-serif">
              {t("hero.title")}
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl leading-relaxed">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/contact">
                <Button className="bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-14 px-8 w-full sm:w-auto">
                  {t("hero.cta_primary")}
                </Button>
              </Link>
              <Link to="/plateforme">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black rounded-none uppercase tracking-wider h-14 px-8 w-full sm:w-auto bg-transparent">
                  {t("hero.cta_secondary")}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works — 3 steps */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div {...fadeIn} className="text-center mb-16 md:mb-20 max-w-3xl mx-auto">
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">
              {t("home.how_label")}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-foreground mb-6 leading-tight">
              {t("home.how_title")}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("home.how_subtitle")}
            </p>
            <div className="w-16 h-1 bg-primary mx-auto mt-8"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 mb-12 relative">
            {howSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="relative bg-background border border-border p-8 md:p-10 flex flex-col"
              >
                <div className="flex items-baseline gap-4 mb-6">
                  <span className="text-5xl md:text-6xl font-bold text-primary/15 font-serif leading-none">
                    {step.num}
                  </span>
                  <div className="h-px flex-grow bg-primary/30"></div>
                </div>
                <h3 className="text-xl md:text-2xl font-bold font-serif text-foreground mb-4 leading-tight">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/plateforme">
              <Button className="bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-12 px-10">
                {t("home.how_cta")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Differentiator Section */}
      <section className="py-24 md:py-36 bg-foreground text-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-6">
                {t("platform.label")}
              </span>
              <h2 className="text-3xl md:text-5xl font-bold font-serif leading-tight mb-8">
                {t("platform.title")}
              </h2>
              <p className="text-lg text-white/70 leading-relaxed mb-10">
                {t("platform.desc")}
              </p>
              <Link to="/contact">
                <Button className="bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-12 px-8">
                  {t("platform.cta")}
                </Button>
              </Link>
            </motion.div>

            <div className="grid grid-cols-1 gap-6">
              {platformPoints.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="flex gap-6 items-start border border-white/10 p-8 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex-shrink-0 w-16 h-16 border border-primary flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary font-serif">{point.num}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">{point.title}</h3>
                    <p className="text-white/60 leading-relaxed text-sm">{point.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
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
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">{t("home.services_label")}</span>
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-foreground">
              {t("home.services_title")}
            </h2>
            <div className="w-16 h-1 bg-primary mx-auto mt-8"></div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-10">
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
                <Link to={card.href}>
                  <Button variant="outline" className="rounded-none border-primary text-primary hover:bg-primary hover:text-white uppercase tracking-wider w-full text-sm">
                    {t("home.services_learn_more")}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/services">
              <Button className="bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-12 px-10">
                {t("home.services_cta")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Film de Miel — Sub-brand Section */}
      <section className="relative py-32 bg-black text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-35">
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
            className="max-w-3xl bg-black/65 backdrop-blur-sm p-12 md:p-16 border border-white/10"
          >
            <div className="mb-8">
              <span className="inline-block text-xs uppercase tracking-[0.4em] text-white/50 font-medium mb-3 block">
                {t("film_de_miel.label")}
              </span>
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-10 h-px bg-primary"></div>
                <span
                  className="text-3xl md:text-4xl font-bold font-serif tracking-wide"
                  style={{ color: "#c9a96e" }}
                >
                  Film de Miel
                </span>
                <div className="w-10 h-px bg-primary"></div>
              </div>
              <span className="text-xs uppercase tracking-[0.25em] text-white/40 font-medium">
                by Mariage Afro
              </span>
            </div>
            <p className="text-lg text-white/80 leading-relaxed mb-10">
              {t("film_de_miel.desc")}
            </p>
            <Link to="/realisations">
              <Button
                variant="outline"
                className="rounded-none uppercase tracking-wider h-12 px-8 bg-transparent"
                style={{ borderColor: "#c9a96e", color: "#c9a96e" }}
              >
                {t("film_de_miel.cta")}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 md:py-36 bg-background">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div {...fadeIn} className="text-center mb-16 md:mb-20">
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">
              {t("testimonials.label")}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-foreground">
              {t("testimonials.title")}
            </h2>
            <div className="w-16 h-1 bg-primary mx-auto mt-8"></div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="bg-white border border-border p-10 flex flex-col relative"
              >
                <Quote className="w-8 h-8 text-primary/25 mb-6 flex-shrink-0" />
                <p className="text-muted-foreground leading-relaxed italic flex-grow mb-8 text-base">
                  "{item.quote}"
                </p>
                <div className="border-t border-border pt-6">
                  <p className="font-bold text-foreground text-sm tracking-wide">{item.name}</p>
                  <p className="text-xs text-primary mt-1 uppercase tracking-wider">{item.origin}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Prestations Grid Preview */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div {...fadeIn} className="text-center mb-16">
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">{t("home.prestations_label")}</span>
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-foreground">
              {t("home.prestations_title")}
            </h2>
            <div className="w-16 h-1 bg-primary mx-auto mt-8"></div>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 md:gap-6">
            {prestationsItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="group border border-border bg-background p-8 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
              >
                <div className="mb-4">{item.icon}</div>
                <h3 className="font-semibold text-sm text-foreground">{item.label}</h3>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/partenaires">
              <Button className="bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-12 px-10">
                {t("home.prestations_cta")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-24 md:py-32 bg-background">
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
                className="w-full h-[400px] md:h-[600px] object-cover rounded-sm shadow-xl"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:pl-10"
            >
              <span className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-6">{t("home.about_label")}</span>
              <h2 className="text-3xl md:text-5xl font-bold font-serif text-foreground mb-8">
                {t("home.about_title")}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {t("home.about_text1")}
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-10">
                {t("home.about_text2")}
              </p>
              <Link to="/a-propos">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase tracking-wider h-12 px-8">
                  {t("home.about_cta")}
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
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-white/60 font-bold mb-6">{t("home.cta_label")}</span>
            <h2 className="text-3xl md:text-5xl font-bold font-serif mb-8 leading-tight">
              {t("home.cta_title")}
            </h2>
            <p className="text-lg text-white/80 leading-relaxed mb-10">
              {t("home.cta_desc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button className="bg-white text-primary hover:bg-white/90 rounded-none uppercase tracking-wider h-14 px-10 font-bold w-full sm:w-auto">
                  {t("home.cta_primary")}
                </Button>
              </Link>
              <Link to="/services">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary rounded-none uppercase tracking-wider h-14 px-10 bg-transparent w-full sm:w-auto">
                  {t("home.cta_secondary")}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services image accent */}
      <section className="h-[200px] md:h-[400px] relative overflow-hidden">
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
