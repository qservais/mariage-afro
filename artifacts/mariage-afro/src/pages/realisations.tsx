import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

import img1 from "@assets/pexels-angel-ayala-321556-28976221_1776285262171.jpg";
import img2 from "@assets/pexels-pavel-danilyuk-8815279_1776285262172.jpg";
import img3 from "@assets/pexels-rimiscky-34747069_1776285262172.jpg";
import img4 from "@assets/pexels-darina-belonogova-7193167_1776285262172.jpg";
import img5 from "@assets/pexels-darina-belonogova-7193204_1776285262172.jpg";
import img6 from "@assets/pexels-is0-shot-2150184196-31518214_1776285262172.jpg";
import img7 from "@assets/pexels-innocent-kapesa-760824113-18751317_1776285262172.jpg";
import img8 from "@assets/pexels-nudethephotographer-34543838_1776285262172.jpg";

type Category = "tous" | "photo" | "video";

const gallery: { src: string; alt: string; category: "photo" | "video" }[] = [
  { src: img1, alt: "Cérémonie de mariage afro", category: "photo" },
  { src: img2, alt: "Couple mixte célébrant leur union", category: "photo" },
  { src: img3, alt: "Moment de tendresse en noir et blanc", category: "photo" },
  { src: img4, alt: "Détail de robe de mariée", category: "video" },
  { src: img5, alt: "Portrait de la mariée", category: "photo" },
  { src: img6, alt: "Couple en pleine nature", category: "video" },
  { src: img7, alt: "Alliances et détails de cérémonie", category: "photo" },
  { src: img8, alt: "Moment romantique en soirée", category: "video" },
];

const tabs: { id: Category; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "photo", label: "Photo" },
  { id: "video", label: "Vidéo" },
];

export default function Realisations() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Category>("tous");

  useEffect(() => {
    document.title = "Réalisations — Mariage Afro";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Découvrez nos plus belles réalisations de mariages afro et mixtes en Belgique à travers notre galerie photo et vidéo.");
    }
  }, []);

  const filtered = activeTab === "tous" ? gallery : gallery.filter(img => img.category === activeTab);

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
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12"
          >
            Découvrez nos plus belles histoires d'amour à travers une sélection de moments inoubliables.
          </motion.p>

          {/* Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-0 border border-border inline-flex mx-auto"
            role="tablist"
            aria-label="Filtrer les réalisations"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-3 uppercase tracking-widest text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-white"
                    : "bg-white text-muted-foreground hover:text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6"
            >
              {filtered.map((item, i) => (
                <motion.div
                  key={`${activeTab}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
                  className="break-inside-avoid overflow-hidden rounded-sm relative group cursor-pointer"
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                  />
                  {item.category === "video" && (
                    <div className="absolute top-4 right-4 bg-primary text-white text-xs uppercase tracking-widest px-2 py-1">
                      Vidéo
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500"></div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
