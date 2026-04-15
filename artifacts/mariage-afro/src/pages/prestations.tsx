import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Camera, Video, Music, Flower2, Utensils, Scissors, MapPin, Car } from "lucide-react";
import { Button } from "@/components/ui/button";

import bannerImg from "@assets/pexels-is0-shot-2150184196-31518214_1776285262172.jpg";

export default function Prestations() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = "Prestataires — Mariage Afro";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Photographes, vidéastes, traiteurs, fleuristes : trouvez les meilleurs prestataires pour votre mariage afro ou mixte en Belgique.");
    }
  }, []);

  const vendorCategories = t("prestations.items", { returnObjects: true }) as string[];

  const icons = [
    <Camera className="w-8 h-8 text-primary" />,
    <Video className="w-8 h-8 text-primary" />,
    <Music className="w-8 h-8 text-primary" />,
    <Flower2 className="w-8 h-8 text-primary" />,
    <Utensils className="w-8 h-8 text-primary" />,
    <Scissors className="w-8 h-8 text-primary" />,
    <MapPin className="w-8 h-8 text-primary" />,
    <Car className="w-8 h-8 text-primary" />
  ];

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
            {t("prestations.title")}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            {t("prestations.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {vendorCategories.map((category, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group border border-border p-8 flex flex-col items-center justify-center text-center hover:bg-background transition-colors cursor-pointer"
              >
                <div className="mb-6 p-4 rounded-full bg-background group-hover:bg-white transition-colors">
                  {icons[i]}
                </div>
                <h3 className="font-bold text-lg">{category}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner */}
      <section className="py-32 relative flex items-center justify-center text-center">
        <div className="absolute inset-0 z-0">
          <img 
            src={bannerImg} 
            alt="Couple" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        <div className="relative z-10 container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold font-serif text-white mb-8">
            Trouvez les prestataires parfaits pour votre grand jour
          </h2>
          <Link href="/contact">
            <Button className="bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-14 px-8 text-lg">
              Demander le catalogue
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}