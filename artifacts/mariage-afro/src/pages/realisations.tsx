import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

import img1 from "@assets/GM-00756.jpg_1776614313614.jpeg";
import img2 from "@assets/GM-00679.jpg_1776614313614.jpeg";
import img3 from "@assets/GM-00719.jpg_1776614313614.jpeg";
import img4 from "@assets/GM-01293.jpg_1776614313614.jpeg";
import img5 from "@assets/DSC05396.jpg_1776614313613.jpeg";
import img6 from "@assets/MielMagGM-156of162.jpg_1776614313614.jpeg";
import img7 from "@assets/New-Project-42.jpg_1776614313615.jpeg";
import img8 from "@assets/MielmagMS-70of267.jpg_1776614313615.jpeg";

type Category = "tous" | "photo" | "video";

const galleryImages = [img1, img2, img3, img4, img5, img6, img7, img8];
const galleryCategories: ("photo" | "video")[] = [
  "photo", "photo", "photo", "video", "photo", "video", "photo", "video"
];

export default function Realisations() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Category>("tous");

  useEffect(() => {
    document.title = `${t("nav.realisations")} — Mariage Afro`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", t("realisations.subtitle"));
    }
  }, [t]);

  const gallery = galleryImages.map((src, i) => ({
    src,
    alt: t(`realisations.img${i + 1}_alt`),
    category: galleryCategories[i]
  }));

  const tabs = [
    { id: "tous" as Category, label: t("realisations.filter_all") },
    { id: "photo" as Category, label: t("realisations.filter_photo") },
    { id: "video" as Category, label: t("realisations.filter_video") }
  ];

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
            {t("realisations.subtitle")}
          </motion.p>

          {/* Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex border border-border"
            role="tablist"
            aria-label={t("nav.realisations")}
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
                      {t("realisations.filter_video")}
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
