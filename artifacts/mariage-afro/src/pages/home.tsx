import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

import heroImage from "@assets/pexels-angel-ayala-321556-28976221_1776285262171.jpg";
import aboutImage from "@assets/pexels-pavel-danilyuk-8815279_1776285262172.jpg";
import videoSrc from "@assets/8247047-hd_1920_1080_25fps_1776285295920.mp4";

export default function Home() {
  const { t } = useTranslation();

  const fadeIn = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }
  };

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
          <motion.div {...fadeIn} className="max-w-3xl bg-black/60 backdrop-blur-sm p-12 md:p-16 border border-white/10">
            <span className="inline-block text-primary uppercase tracking-widest text-sm font-bold mb-4">
              {t("film_de_miel.label")}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold font-serif mb-6">
              {t("film_de_miel.title")}
            </h2>
            <p className="text-lg text-white/80 leading-relaxed mb-10">
              {t("film_de_miel.desc")}
            </p>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white rounded-none uppercase tracking-wider h-12 px-8 bg-transparent">
              {t("film_de_miel.cta")}
            </Button>
          </motion.div>
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
    </div>
  );
}