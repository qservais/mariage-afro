import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Heart, Images, ChevronLeft, ChevronRight, X } from "lucide-react";

import img1 from "@assets/WhatsApp-Image-2025-10-30-at-17.42.50_1776614313615.jpeg";
import img2 from "@assets/GM-00679.jpg_1776614313614.jpeg";
import img3 from "@assets/GM-00719.jpg_1776614313614.jpeg";
import img4 from "@assets/GM-01293.jpg_1776614313614.jpeg";
import img5 from "@assets/DSC05396.jpg_1776614313613.jpeg";
import img6 from "@assets/New-Project-42.jpg_1776614313615.jpeg";
import img7 from "@assets/MielmagMS-48of267.jpg_1776614313615.jpeg";
import img8 from "@assets/MielmagMS-70of267.jpg_1776614313615.jpeg";

const FALLBACK_IMAGES = [img1, img2, img3, img4, img5, img6, img7, img8];

interface Realisation {
  id: number;
  coupleName: string;
  weddingDate: string | null;
  location: string | null;
  type: string | null;
  story: string | null;
  coverImage: string | null;
  gallery: string[];
  videoUrl: string | null;
  featured: boolean;
}

function GalleryModal({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx(i => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIdx(i => (i - 1 + images.length) % images.length);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        onClick={onClose}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white z-10">
          <X className="w-8 h-8" />
        </button>
        <button
          onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }}
          className="absolute left-4 text-white/70 hover:text-white"
        >
          <ChevronLeft className="w-10 h-10" />
        </button>
        <motion.img
          key={idx}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          src={images[idx]}
          alt=""
          className="max-w-[90vw] max-h-[85vh] object-contain"
          onClick={e => e.stopPropagation()}
        />
        <button
          onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }}
          className="absolute right-4 text-white/70 hover:text-white"
        >
          <ChevronRight className="w-10 h-10" />
        </button>
        <p className="absolute bottom-5 text-white/50 text-sm">
          {idx + 1} / {images.length}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}

function RealisationCard({ r, index }: { r: Realisation; index: number }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStart, setModalStart] = useState(0);
  const galleryImages = r.gallery?.length ? r.gallery : r.coverImage ? [r.coverImage] : [];
  const cover = r.coverImage || galleryImages[0] || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  const isReversed = index % 2 === 1;

  const formattedDate = r.weddingDate
    ? new Date(r.weddingDate).toLocaleDateString("fr-BE", { month: "long", year: "numeric" })
    : null;

  function openGallery(i: number) {
    setModalStart(i);
    setModalOpen(true);
  }

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white border border-border overflow-hidden"
      >
        {/* Image side */}
        <div
          className={`relative h-72 lg:h-auto min-h-[360px] overflow-hidden cursor-pointer group ${isReversed ? "lg:order-2" : ""}`}
          onClick={() => galleryImages.length > 0 && openGallery(0)}
        >
          <img
            src={cover}
            alt={r.coupleName}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          {/* Featured badge */}
          {r.featured && (
            <span className="absolute top-4 left-4 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
              À la une
            </span>
          )}

          {/* Gallery count */}
          {galleryImages.length > 1 && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/50 text-white/80 text-xs px-2.5 py-1.5 backdrop-blur-sm">
              <Images className="w-3.5 h-3.5" />
              {galleryImages.length} photos
            </div>
          )}
        </div>

        {/* Story side */}
        <div className={`flex flex-col p-8 md:p-10 ${isReversed ? "lg:order-1" : ""}`}>
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {r.type && (
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary border border-primary/40 px-2.5 py-1">
                {r.type}
              </span>
            )}
            {formattedDate && (
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                {formattedDate}
              </span>
            )}
            {r.location && (
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {r.location}
              </span>
            )}
          </div>

          {/* Names */}
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-4 h-4 text-primary flex-shrink-0" />
            <h3 className="text-2xl md:text-3xl font-bold font-serif text-foreground leading-tight">
              {r.coupleName}
            </h3>
          </div>

          {/* Story */}
          {r.story ? (
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base flex-grow">
              {r.story}
            </p>
          ) : (
            <p className="text-muted-foreground/60 italic text-sm flex-grow">
              Une histoire d'amour unique, célébrée avec élégance.
            </p>
          )}

          {/* Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="mt-8 grid grid-cols-4 gap-2">
              {galleryImages.slice(0, 4).map((img, i) => (
                <button
                  key={i}
                  onClick={() => openGallery(i)}
                  className="aspect-square overflow-hidden bg-muted hover:opacity-80 transition-opacity"
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Video link */}
          {r.videoUrl && (
            <a
              href={r.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline"
            >
              ▶ Voir le film de mariage
            </a>
          )}
        </div>
      </motion.article>

      {modalOpen && galleryImages.length > 0 && (
        <GalleryModal images={galleryImages} startIndex={modalStart} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}

export default function Realisations() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("nav.realisations")} — Mariage Afro`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("realisations.subtitle"));
  }, [t]);

  const { data: apiRealisations = [] } = useQuery({
    queryKey: ["marketplace-realisations"],
    queryFn: async () => {
      const res = await fetch("/api/marketplace/realisations");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const realisations: Realisation[] = useMemo(() => {
    if (apiRealisations.length > 0) return apiRealisations;
    return FALLBACK_IMAGES.map((img, i) => ({
      id: i + 1,
      coupleName: ["Amina & Kévin", "Fatou & Thomas", "Léa & Ibrahim", "Nadia & Marc",
        "Blessing & Julien", "Aïcha & Pierre", "Mariame & Sébastien", "Coumba & Antoine"][i] || `Couple ${i + 1}`,
      weddingDate: null,
      location: ["Bruxelles", "Liège", "Gand", "Anvers", "Namur", "Bruxelles", "Mons", "Louvain"][i],
      type: ["Afro-européen", "Mixte", "Traditionnel", "Contemporain"][i % 4],
      story: null,
      coverImage: img,
      gallery: [img],
      videoUrl: null,
      featured: i === 0,
    }));
  }, [apiRealisations]);

  return (
    <div className="w-full pt-28">
      {/* Header */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6 md:px-12 text-center max-w-3xl">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-5"
          >
            {t("realisations.badge")}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold font-serif mb-6 text-foreground"
          >
            {t("realisations.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground"
          >
            {t("realisations.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Stories */}
      <section className="py-16 md:py-20 bg-[#faf9f7]">
        <div className="container mx-auto px-6 md:px-12 max-w-6xl space-y-8 md:space-y-12">
          {realisations.map((r, i) => (
            <RealisationCard key={r.id} r={r} index={i} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-foreground text-center">
        <div className="container mx-auto px-6 max-w-2xl">
          <Heart className="w-10 h-10 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-white mb-4">
            {t("realisations.cta_title")}
          </h2>
          <p className="text-white/70 mb-8">{t("realisations.cta_subtitle")}</p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold uppercase tracking-wider px-8 py-3 hover:bg-primary/90 transition-colors text-sm"
          >
            {t("realisations.cta_btn")}
          </a>
        </div>
      </section>
    </div>
  );
}
