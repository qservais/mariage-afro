import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Quote, ChevronDown, ArrowRight, Heart, Briefcase, Building2, ChefHat, Wine, GlassWater, Users, UserCheck, Sparkles as SparklesIcon } from "lucide-react";
import { Picture } from "@/components/Picture";

import heroImage from "@assets/GM-00756.jpg_1776614313614.jpeg";
import aboutImage from "@assets/pexels-rimiscky-34747069_1776285262172.jpg";
import servicesImg from "@assets/MielmagMS-70of267.jpg_1776614313615.jpeg";
import videoSrc from "@assets/Trailer-de-dingue_1776614330311.mp4";
import { SEO } from "@/components/SEO";
import { HeroCinematicOverlay, HeroMobileFadeOverlay } from "@/components/home/HeroCinematicIntro";
import { TrustBar } from "@/components/home/TrustBar";
import { ProcessTimeline } from "@/components/home/ProcessTimeline";
import { HeroCursor } from "@/components/HeroCursor";

const filmVideo1 = "/film-de-miel-2.mp4";
const filmVideo2 = "/film-de-miel-1.mp4";

type IntroMode = "skip" | "full" | "mobile-fade";

const HOME_LOCAL_BUSINESS_JSONLD = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://www.mariage-afro.com/#localbusiness",
  name: "Mariage Afro",
  url: "https://www.mariage-afro.com/",
  image: "https://www.mariage-afro.com/opengraph.jpg",
  logo: "https://www.mariage-afro.com/logo.svg",
  description:
    "Plateforme premium internationale dédiée aux mariages afro et mixtes : marketplace de prestataires vérifiés, espace client complet, coordination sur le Jour J.",
  priceRange: "€€-€€€€",
  address: {
    "@type": "PostalAddress",
    addressCountry: "BE",
    addressLocality: "Bruxelles",
    streetAddress: "Avenue Louise 231",
    postalCode: "1050",
  },
  areaServed: [
    { "@type": "Place", name: "Monde" },
    { "@type": "Country", name: "France" },
    { "@type": "Country", name: "Maroc" },
    { "@type": "Country", name: "Sénégal" },
    { "@type": "Country", name: "Côte d'Ivoire" },
    { "@type": "Country", name: "Portugal" },
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "info@mariage-afro.com",
    availableLanguage: ["French", "Dutch", "English"],
  },
  sameAs: [],
} as const;

export default function Home() {
  const { t } = useTranslation();

  // Intro cinématique : on détermine si on joue l'intro plein écran (desktop),
  // une simple version fade (mobile), ou si on saute (reduced motion / déjà vue).
  const [introMode, setIntroMode] = useState<IntroMode>("skip");
  const [introReady, setIntroReady] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let mode: IntroMode = "skip";
    try {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const seen = sessionStorage.getItem("mariageAfroIntroSeen") === "true";
      if (!reduced && !seen) {
        mode = window.innerWidth < 768 ? "mobile-fade" : "full";
      }
    } catch {
      mode = "skip";
    }
    setIntroMode(mode);
    setIntroReady(true);
  }, []);

  // Marque l'intro comme vue dès que l'utilisateur a scrollé une demi-fenêtre.
  useEffect(() => {
    if (!introReady || introMode === "skip") return;
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.5) {
        try {
          sessionStorage.setItem("mariageAfroIntroSeen", "true");
        } catch {}
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [introReady, introMode]);

  // Apparition synchronisée du texte du hero pour le mode "full".
  const { scrollY } = useScroll();
  const textProgress = useTransform(scrollY, (sy) => {
    if (introMode !== "full" || !introReady) return 1;
    const span = Math.max(window.innerHeight * 0.7, 320);
    return Math.min(Math.max(sy / span, 0), 1);
  });
  const textOpacity = useTransform(textProgress, [0.25, 0.85], [0, 1]);
  const textY = useTransform(textProgress, [0.25, 0.85], [40, 0]);
  const indicatorOpacity = useTransform(textProgress, [0.7, 1], [0, 1]);

  const showCinematic = introReady && introMode === "full";
  const showMobileFade = introReady && introMode === "mobile-fade";

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
    { icon: <Building2 className="w-7 h-7" />, label: t("home.partner1") },
    { icon: <ChefHat className="w-7 h-7" />, label: t("home.partner2") },
    { icon: <Wine className="w-7 h-7" />, label: t("home.partner3") },
    { icon: <GlassWater className="w-7 h-7" />, label: t("home.partner4") },
    { icon: <Users className="w-7 h-7" />, label: t("home.partner5") },
    { icon: <UserCheck className="w-7 h-7" />, label: t("home.partner6") },
    { icon: <SparklesIcon className="w-7 h-7" />, label: t("home.partner7") },
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
    },
    {
      num: t("platform.point4_num"),
      title: t("platform.point4_title"),
      desc: t("platform.point4_desc")
    }
  ];

  const testimonials = [
    {
      quote: t("testimonials.item1_quote"),
      name: t("testimonials.item1_name"),
      origin: t("testimonials.item1_origin"),
      date: t("testimonials.item1_date"),
      source: "google" as const
    },
    {
      quote: t("testimonials.item2_quote"),
      name: t("testimonials.item2_name"),
      origin: t("testimonials.item2_origin"),
      date: t("testimonials.item2_date"),
      source: "google" as const
    },
    {
      quote: t("testimonials.item3_quote"),
      name: t("testimonials.item3_name"),
      origin: t("testimonials.item3_origin"),
      date: t("testimonials.item3_date"),
      source: "google" as const
    },
    {
      quote: t("testimonials.item4_quote"),
      name: t("testimonials.item4_name"),
      origin: t("testimonials.item4_origin"),
      date: t("testimonials.item4_date"),
      source: "google" as const
    },
    {
      quote: t("testimonials.item5_quote"),
      name: t("testimonials.item5_name"),
      origin: t("testimonials.item5_origin"),
      date: t("testimonials.item5_date"),
      source: "instagram" as const
    },
    {
      quote: t("testimonials.item6_quote"),
      name: t("testimonials.item6_name"),
      origin: t("testimonials.item6_origin"),
      date: t("testimonials.item6_date"),
      source: "google" as const
    }
  ];

  return (
    <div className="w-full">
      <SEO title="Mariage Afro — Mariages Afro & Mixtes" description="La première plateforme premium dédiée aux mariages afro et mixtes. Trouvez vos prestataires vérifiés et organisez votre grand jour, partout en Europe et en Afrique." jsonLd={HOME_LOCAL_BUSINESS_JSONLD} />

      {/* Hero Section — Style lamangue : fond wine, titre serif éditorial, vidéo offset droite */}
      <section
        ref={heroRef}
        className="relative min-h-screen lg:h-[100svh] lg:min-h-[640px] bg-wine-deep text-cream overflow-hidden flex items-center pt-24 pb-10 lg:pt-28 lg:pb-14 lg:pl-16"
      >
        {/* Texture grain subtile (effet papier ancien) */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>\")"
          }}
        />

        <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center px-6 md:px-12 lg:pr-0">
          {/* Texte gauche */}
          <motion.div
            initial={showCinematic ? false : { opacity: 0, y: 30 }}
            animate={showCinematic ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.3 }}
            style={showCinematic ? { opacity: textOpacity, y: textY } : undefined}
            className="lg:col-span-7 xl:col-span-6 lg:pl-4"
          >
            <span className="inline-flex items-center gap-3 text-[10px] md:text-xs uppercase tracking-[0.4em] mb-5 md:mb-7 text-gold font-medium">
              <span className="block w-8 h-px bg-gold"></span>
              {t("hero.tagline")}
            </span>

            <h1 className="font-display uppercase font-medium leading-[0.95] tracking-[-0.01em] text-cream mb-6 md:mb-8 text-[2.2rem] sm:text-4xl md:text-5xl lg:text-[4.2rem] xl:text-[5.2rem]">
              {t("hero.title")}
            </h1>

            <p className="text-sm md:text-base text-cream/70 max-w-xl leading-relaxed mb-6 md:mb-9 font-light">
              {t("hero.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
              <Link to="/contact" className="group inline-flex items-center gap-3 bg-bordeaux hover:bg-bordeaux-light border border-bordeaux hover:border-bordeaux-light px-7 py-3.5 transition-all">
                <span className="text-[11px] uppercase tracking-[0.25em] text-cream font-medium">
                  {t("hero.cta_primary")}
                </span>
                <span className="block w-8 h-px bg-cream/60 transition-all group-hover:w-12"></span>
              </Link>
              <Link to="/plateforme" className="group inline-flex items-center gap-3 px-2 py-4 transition-all">
                <span className="text-[11px] uppercase tracking-[0.25em] text-cream/80 group-hover:text-gold font-medium transition-colors">
                  {t("hero.cta_secondary")}
                </span>
                <ArrowRight className="w-4 h-4 text-cream/60 group-hover:text-gold group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </motion.div>

          {/* Vidéo offset droite — sert aussi de cadre cible pour l'intro cinématique */}
          <motion.div
            initial={showCinematic ? false : { opacity: 0, scale: 0.96 }}
            animate={showCinematic ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, delay: 0.5, ease: "easeOut" }}
            className="lg:col-span-5 xl:col-span-6 lg:-mr-6 xl:-mr-12 relative"
          >
            <div ref={slotRef} className="relative aspect-[4/5] lg:aspect-[3/4] xl:aspect-[4/5] lg:max-h-[68vh] xl:max-h-[72vh] mx-auto w-full overflow-hidden shadow-2xl bg-wine-deep">
              {showCinematic ? (
                /* En mode cinématique : aucune vidéo dans le slot. L'unique <video> vit
                   dans HeroCinematicOverlay et reste positionnée en `fixed` glissant
                   parfaitement sur ce slot (top = docTop - scrollY) pour toute la
                   durée de la page. Une seule instance = un seul décodeur, pas de
                   restart de lecture. Le poster derrière évite le flash si l'overlay
                   tarde à mesurer le bbox. */
                <img
                  src={heroImage}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover opacity-0"
                />
              ) : (
                <video
                  src={videoSrc}
                  poster={heroImage}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  className="w-full h-full object-cover"
                  aria-hidden="true"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-wine-deep/40 via-transparent to-transparent pointer-events-none" />
            </div>
            {/* Petit accent gold flottant */}
            <div className="hidden lg:block absolute -bottom-6 -left-6 bg-wine-deep border border-gold/40 px-5 py-3 backdrop-blur-sm">
              <span className="text-[10px] uppercase tracking-[0.3em] text-gold/80 font-medium block">
                Europe · Afrique · 2026
              </span>
            </div>
          </motion.div>
        </div>

        {/* Indicateur scroll en bas centré */}
        <motion.div
          initial={showCinematic ? false : { opacity: 0 }}
          animate={showCinematic ? undefined : { opacity: 1 }}
          transition={{ delay: 1.6, duration: 1 }}
          style={showCinematic ? { opacity: indicatorOpacity } : undefined}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden md:block"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2 text-cream/40"
          >
            <span className="text-[9px] uppercase tracking-[0.4em]">{t("home.discover")}</span>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {showCinematic && (
        <HeroCinematicOverlay videoSrc={videoSrc} posterSrc={heroImage} slotRef={slotRef} />
      )}
      {showMobileFade && (
        <HeroMobileFadeOverlay videoSrc={videoSrc} posterSrc={heroImage} />
      )}

      {/* Custom cursor — desktop hero only */}
      <HeroCursor heroRef={heroRef} />

      {/* Trust bar — social proof metrics below hero */}
      <TrustBar />

      {/* Choix B2B / B2C — orientation immédiate du visiteur */}
      <section
        className="relative bg-cream py-20 md:py-28 border-t border-wine-deep/10"
        aria-label="Choisissez votre parcours"
        data-testid="section-audience-choice"
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <motion.div {...fadeIn} className="text-center mb-12 md:mb-16">
            <span className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.4em] text-gold-deep font-semibold mb-5">
              <span className="block w-8 h-px bg-gold-deep" />
              Vous êtes
              <span className="block w-8 h-px bg-gold-deep" />
            </span>
            <h2 className="font-display uppercase text-3xl md:text-4xl lg:text-5xl text-wine-deep tracking-tight leading-tight">
              Que recherchez-vous aujourd'hui&nbsp;?
            </h2>
            <p className="text-wine-deep/60 max-w-xl mx-auto mt-5 text-sm md:text-base font-light">
              Mariage Afro est à la fois une plateforme pour les couples qui se marient
              et un réseau de prestataires professionnels.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-wine-deep/10 border border-wine-deep/10">
            {/* B2C — Couples */}
            <motion.div {...fadeIn}>
              <Link
                to="/services"
                className="group relative block bg-cream hover:bg-wine-deep transition-colors duration-500 p-8 md:p-12 lg:p-14 h-full"
                data-testid="link-audience-b2c"
              >
                <div className="flex items-start justify-between mb-10 md:mb-14">
                  <span className="text-xs uppercase tracking-[0.3em] text-gold-deep group-hover:text-gold font-semibold transition-colors">
                    01 — Particulier
                  </span>
                  <Heart className="w-5 h-5 text-gold-deep group-hover:text-gold transition-all group-hover:scale-110" strokeWidth={1.5} />
                </div>
                <h3 className="font-display uppercase text-3xl md:text-4xl lg:text-5xl text-wine-deep group-hover:text-cream transition-colors leading-[1.05] tracking-tight mb-5">
                  Je me marie
                </h3>
                <p className="text-wine-deep/65 group-hover:text-cream/75 transition-colors text-sm md:text-base font-light leading-relaxed mb-10 max-w-md">
                  Découvrez nos formules d'accompagnement, accédez à un réseau de prestataires sélectionnés et organisez votre mariage afro ou mixte sur notre plateforme dédiée.
                </p>
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] font-semibold text-gold-deep group-hover:text-gold transition-colors">
                  <span>Voir nos services</span>
                  <span className="block w-8 h-px bg-gold-deep group-hover:bg-gold transition-all group-hover:w-14" />
                </div>
              </Link>
            </motion.div>

            {/* B2B — Prestataires */}
            <motion.div {...fadeIn} transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}>
              <Link
                to="/partenaires#become-partner"
                className="group relative block bg-bordeaux text-cream hover:bg-bordeaux-light transition-colors duration-500 p-8 md:p-12 lg:p-14 h-full"
                data-testid="link-audience-b2b"
              >
                <div className="flex items-start justify-between mb-10 md:mb-14">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium">
                    02 — Professionnel
                  </span>
                  <Briefcase className="w-5 h-5 text-gold transition-transform group-hover:scale-110" strokeWidth={1.5} />
                </div>
                <h3 className="font-display uppercase text-3xl md:text-4xl lg:text-5xl text-cream leading-[1.05] tracking-tight mb-5">
                  Je suis prestataire
                </h3>
                <p className="text-cream/70 text-sm md:text-base font-light leading-relaxed mb-10 max-w-md">
                  Photographes, traiteurs, lieux, DJs, fleuristes... Rejoignez le réseau Mariage Afro pour proposer vos services et recevoir des leads qualifiés de couples afro et mixtes à travers l'Europe et l'Afrique.
                </p>
                <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] font-medium text-gold">
                  <span>Devenir partenaire</span>
                  <span className="block w-8 h-px bg-gold transition-all group-hover:w-14" />
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Lien tertiaire — Espace client existant */}
          <motion.div {...fadeIn} className="text-center mt-10 md:mt-14">
            <Link
              to="/espace-client/login"
              className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-wine-deep hover:text-gold-deep hover:underline underline-offset-4 font-medium transition-colors"
              data-testid="link-audience-existing-client"
            >
              <span dangerouslySetInnerHTML={{ __html: t("home.already_client") }} />
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How it works — 3 steps */}
      <section className="py-24 md:py-36 bg-cream">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div {...fadeIn} className="text-center mb-20 max-w-3xl mx-auto">
            <span className="section-eyebrow mb-6">{t("home.how_label")}</span>
            <h2 className="section-title-editorial text-4xl md:text-6xl lg:text-7xl mt-4 mb-8">
              {t("home.how_title")}
            </h2>
            <p className="text-lg text-wine-deep/65 leading-relaxed font-light">
              {t("home.how_subtitle")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-wine-deep/10 border border-wine-deep/10 mb-16">
            {howSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="relative bg-cream p-10 md:p-12 flex flex-col"
              >
                <div className="flex items-baseline gap-4 mb-8">
                  <span className="font-display text-6xl md:text-7xl text-bordeaux leading-none">
                    {step.num}
                  </span>
                  <div className="h-px flex-grow bg-bordeaux/20"></div>
                </div>
                <h3 className="font-display uppercase text-2xl md:text-3xl tracking-tight text-wine-deep mb-5 leading-[1]">
                  {step.title}
                </h3>
                <p className="text-wine-deep/70 leading-relaxed text-sm md:text-base font-light">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/plateforme" className="btn-editorial-solid">
              {t("home.how_cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* Process Timeline — 5 étapes détaillées */}
      <ProcessTimeline />

      {/* Platform Differentiator Section */}
      <section className="py-28 md:py-40 bg-wine-deep text-cream relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>\")" }}
        />
        <div className="container relative z-10 mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="section-eyebrow section-eyebrow-left section-eyebrow-light mb-6">{t("platform.label")}</span>
              <h2 className="font-display uppercase text-cream text-4xl md:text-6xl lg:text-7xl mt-4 mb-8 leading-[0.95] tracking-tight">
                {t("platform.title")}
              </h2>
              <p className="text-lg text-cream/70 leading-relaxed mb-12 font-light">
                {t("platform.desc")}
              </p>
              <Link to="/contact" className="btn-editorial">
                {t("platform.cta")}
              </Link>
            </motion.div>

            <div className="grid grid-cols-1 gap-px bg-cream/10 border border-cream/10">
              {platformPoints.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="flex gap-6 items-start p-8 bg-wine-deep hover:bg-wine-mid transition-colors"
                >
                  <div className="flex-shrink-0">
                    <span className="font-display text-5xl text-gold leading-none">{point.num}</span>
                  </div>
                  <div>
                    <h3 className="font-display uppercase text-xl tracking-tight text-cream mb-2">{point.title}</h3>
                    <p className="text-cream/65 leading-relaxed text-sm font-light">{point.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="py-24 md:py-32 bg-cream">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div {...fadeIn} className="text-center mb-20">
            <h2 className="section-title-editorial text-4xl md:text-6xl lg:text-7xl">
              {t("value_props.title")}
            </h2>
            <div className="w-12 h-px bg-gold mx-auto mt-8"></div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {[1, 2, 3, 4].map((i, index) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="font-display text-5xl text-gold-deep mb-4 leading-none">0{i}</div>
                <div className="w-8 h-px bg-gold/40 mx-auto mb-6"></div>
                <h3 className="font-display uppercase text-xl tracking-tight text-wine-deep mb-4">{t(`value_props.item${i}_title`)}</h3>
                <p className="text-wine-deep/65 leading-relaxed text-sm font-light">
                  {t(`value_props.item${i}_desc`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-24 md:py-32 bg-white border-t border-wine-deep/10">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div {...fadeIn} className="text-center mb-20">
            <span className="section-eyebrow mb-6">{t("home.services_label")}</span>
            <h2 className="section-title-editorial text-4xl md:text-6xl lg:text-7xl mt-4">
              {t("home.services_title")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-wine-deep/10 border border-wine-deep/10">
            {serviceCards.map((card, index) => (
              <motion.div
                key={card.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.12 }}
                className="bg-white p-10 md:p-12 flex flex-col group"
              >
                <span className="font-display text-6xl text-gold-deep mb-6 leading-none">{card.num}</span>
                <h3 className="font-display uppercase text-2xl md:text-3xl tracking-tight text-wine-deep mb-5 leading-[1]">{card.title}</h3>
                <div className="w-8 h-px bg-gold mb-6"></div>
                <p className="text-wine-deep/70 leading-relaxed flex-grow mb-10 font-light text-sm md:text-base">{card.desc}</p>
                <Link to={card.href} className="btn-editorial-ghost self-start group-hover:text-gold">
                  {t("home.services_learn_more")} →
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link to="/services" className="btn-editorial-solid">
              {t("home.services_cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* Film de Miel — Sub-brand Section */}
      <section className="relative py-32 md:py-44 bg-wine-deep text-cream overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-30">
          <video
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-wine-deep/60" />
        <div className="container relative z-10 mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="mb-10">
              <span className="section-eyebrow section-eyebrow-light mb-8">{t("film_de_miel.label")}</span>
              <h3 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[0.9] mt-6 mb-3 text-gold italic">
                Film de Miel
              </h3>
              <span className="text-[10px] uppercase tracking-[0.4em] text-cream/75 font-medium">
                by Mariage Afro
              </span>
            </div>
            <p className="text-lg md:text-xl text-cream/80 leading-relaxed mb-10 font-light max-w-2xl mx-auto">
              {t("film_de_miel.desc")}
            </p>

            {/* Foreground video player grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {[filmVideo1, filmVideo2].map((src, idx) => (
                <div key={idx} className="relative overflow-hidden bg-black/30 border border-gold/20">
                  <video
                    src={src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full aspect-[9/16] sm:aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-wine-deep/40 via-transparent to-transparent pointer-events-none" />
                </div>
              ))}
            </div>

            <p className="text-[10px] uppercase tracking-[0.3em] text-cream/50 font-medium mb-8">
              {t("film_de_miel.credit")}
            </p>

            <Link to="/realisations" className="btn-editorial">
              {t("film_de_miel.cta")}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 md:py-36 bg-cream">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div {...fadeIn} className="text-center mb-20">
            <span className="section-eyebrow mb-6">{t("testimonials.label")}</span>
            <h2 className="section-title-editorial text-4xl md:text-6xl lg:text-7xl mt-4">
              {t("testimonials.title")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-wine-deep/10 border border-wine-deep/10">
            {testimonials.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-cream p-10 md:p-12 flex flex-col relative"
              >
                {/* Source badge */}
                <div className="flex items-center gap-2 mb-5">
                  {item.source === "google" ? (
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-label="Google">
                      <path fill="var(--color-google-blue)"   d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="var(--color-google-green)"  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="var(--color-google-yellow)" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="var(--color-google-red)"    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-label="Instagram">
                      <defs>
                        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%"   stopColor="var(--color-ig-1)"/>
                          <stop offset="25%"  stopColor="var(--color-ig-2)"/>
                          <stop offset="50%"  stopColor="var(--color-ig-3)"/>
                          <stop offset="75%"  stopColor="var(--color-ig-4)"/>
                          <stop offset="100%" stopColor="var(--color-ig-5)"/>
                        </linearGradient>
                      </defs>
                      <rect width="24" height="24" rx="6" fill="url(#ig-grad)"/>
                      <circle cx="12" cy="12" r="4.5" fill="none" stroke="white" strokeWidth="1.5"/>
                      <circle cx="17.5" cy="6.5" r="1" fill="white"/>
                    </svg>
                  )}
                  <span className="text-[10px] uppercase tracking-[0.25em] text-wine-deep/50 font-medium">
                    {item.source === "google" ? t("testimonials.source_google") : t("testimonials.source_instagram")}
                  </span>
                  <span className="ml-auto text-[10px] text-wine-deep/40">{item.date}</span>
                </div>

                {/* 5 stars */}
                <div className="flex gap-0.5 mb-5" aria-label="5 étoiles sur 5">
                  {[...Array(5)].map((_, s) => (
                    <svg key={s} className="w-4 h-4 text-gold-deep" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>

                <Quote className="w-8 h-8 text-gold/30 mb-4 flex-shrink-0" />
                <p className="text-base text-wine-deep/80 leading-relaxed italic flex-grow mb-8 font-light">
                  "{item.quote}"
                </p>
                <div className="border-t border-wine-deep/10 pt-5">
                  <p className="font-display uppercase text-sm tracking-tight text-wine-deep font-semibold">{item.name}</p>
                  <p className="text-xs text-gold-deep mt-1 uppercase tracking-[0.25em] font-medium">{item.origin}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Prestations Grid Preview */}
      <section className="py-24 md:py-32 bg-white border-t border-wine-deep/10">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div {...fadeIn} className="text-center mb-20">
            <span className="section-eyebrow mb-6">{t("home.prestations_label")}</span>
            <h2 className="section-title-editorial text-4xl md:text-6xl lg:text-7xl mt-4">
              {t("home.prestations_title")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-wine-deep/10 border border-wine-deep/10">
            {prestationsItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="group bg-white p-10 flex flex-col items-center justify-center text-center hover:bg-cream transition-colors cursor-pointer"
              >
                <div className="mb-5 text-gold-deep group-hover:scale-110 transition-transform">{item.icon}</div>
                <h3 className="font-display uppercase text-base tracking-tight text-wine-deep">{item.label}</h3>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link to="/partenaires" className="btn-editorial-solid">
              {t("home.prestations_cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-24 md:py-36 bg-cream">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <Picture
                src={aboutImage}
                alt="Cérémonie de mariage mixte"
                width={1200}
                height={1600}
                className="w-full h-[500px] md:h-[680px] object-cover"
                style={{ aspectRatio: "auto" }}
              />
              <div className="absolute -bottom-6 -right-6 hidden md:flex w-32 h-32 border border-gold-deep items-center justify-center bg-cream">
                <span className="font-display text-5xl text-gold-deep leading-none italic">M.A</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:pl-10"
            >
              <span className="section-eyebrow section-eyebrow-left mb-6">{t("home.about_label")}</span>
              <h2 className="font-display uppercase text-wine-deep text-4xl md:text-6xl lg:text-7xl mt-4 mb-10 leading-[0.95] tracking-tight">
                {t("home.about_title")}
              </h2>
              <p className="text-lg text-wine-deep/75 leading-relaxed mb-6 font-light">
                {t("home.about_text1")}
              </p>
              <p className="text-lg text-wine-deep/75 leading-relaxed mb-12 font-light">
                {t("home.about_text2")}
              </p>
              <Link to="/a-propos" className="btn-editorial-solid">
                {t("home.about_cta")}
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-32 md:py-40 bg-wine-deep text-cream relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>\")" }}
        />
        <div className="container relative z-10 mx-auto px-6 md:px-12 text-center max-w-4xl">
          <motion.div {...fadeIn}>
            <span className="section-eyebrow section-eyebrow-light mb-8">{t("home.cta_label")}</span>
            <h2 className="font-display uppercase text-cream text-4xl md:text-6xl lg:text-8xl mt-4 mb-10 leading-[0.9] tracking-tight">
              {t("home.cta_title")}
            </h2>
            <p className="text-lg md:text-xl text-cream/75 leading-relaxed mb-14 font-light max-w-2xl mx-auto">
              {t("home.cta_desc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/contact" className="btn-editorial w-full sm:w-auto justify-center">
                {t("home.cta_primary")}
              </Link>
              <Link to="/services" className="btn-editorial-ghost text-cream/80 hover:text-gold">
                {t("home.cta_secondary")} →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services image accent */}
      <section className="h-[200px] md:h-[400px] relative overflow-hidden">
        <Picture
          src={servicesImg}
          alt="Détails d'un mariage afro"
          width={2048}
          height={1365}
          className="w-full h-full object-cover"
          style={{ aspectRatio: "auto" }}
        />
        <div className="absolute inset-0 bg-black/20"></div>
      </section>
    </div>
  );
}
