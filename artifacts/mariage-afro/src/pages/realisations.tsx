import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

import img1 from "@assets/pexels-angel-ayala-321556-28976221_1776285262171.jpg";
import img2 from "@assets/pexels-pavel-danilyuk-8815279_1776285262172.jpg";
import img3 from "@assets/pexels-rimiscky-34747069_1776285262172.jpg";
import img4 from "@assets/pexels-darina-belonogova-7193167_1776285262172.jpg";
import img5 from "@assets/pexels-darina-belonogova-7193204_1776285262172.jpg";
import img6 from "@assets/pexels-is0-shot-2150184196-31518214_1776285262172.jpg";
import img7 from "@assets/pexels-innocent-kapesa-760824113-18751317_1776285262172.jpg";
import img8 from "@assets/pexels-nudethephotographer-34543838_1776285262172.jpg";

export default function Realisations() {
  const { t } = useTranslation();

  const images = [img1, img2, img3, img4, img5, img6, img7, img8];

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
            {t("nav.realisations")}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Découvrez nos plus belles histoires d'amour à travers une sélection de moments inoubliables.
          </motion.p>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {images.map((src, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.1 }}
                className="break-inside-avoid overflow-hidden rounded-sm relative group cursor-pointer"
              >
                <img 
                  src={src} 
                  alt={`Wedding moment ${i + 1}`} 
                  className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}