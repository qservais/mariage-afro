import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Heart, Images, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Picture } from "@/components/Picture";

import img1 from "@assets/WhatsApp-Image-2025-10-30-at-17.42.50_1776614313615.jpeg";
import img2 from "@assets/GM-00679.jpg_1776614313614.jpeg";
import img3 from "@assets/GM-00719.jpg_1776614313614.jpeg";
import img4 from "@assets/GM-01293.jpg_1776614313614.jpeg";
import img5 from "@assets/DSC05396.jpg_1776614313613.jpeg";
import img6 from "@assets/New-Project-42.jpg_1776614313615.jpeg";
import img7 from "@assets/MielmagMS-48of267.jpg_1776614313615.jpeg";
import img8 from "@assets/MielmagMS-70of267.jpg_1776614313615.jpeg";
import { SEO } from "@/components/SEO";

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
        <button onClick={onClose} aria-label="Fermer la galerie" className="absolute top-4 right-4 text-white/70 hover:text-white z-10">
          <X className="w-8 h-8" aria-hidden="true" />
        </button>
        <button
          onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }}
          aria-label="Image précédente"
          className="absolute left-4 text-white/70 hover:text-white"
        >
          <ChevronLeft className="w-10 h-10" aria-hidden="true" />
        </button>
        <motion.img
          key={idx}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          src={images[idx]}
          alt={`Photo de mariage ${idx + 1} sur ${images.length}`}
          className="max-w-[90vw] max-h-[85vh] object-contain"
          onClick={e => e.stopPropagation()}
        />
        <button
          onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }}
          aria-label="Image suivante"
          className="absolute right-4 text-white/70 hover:text-white"
        >
          <ChevronRight className="w-10 h-10" aria-hidden="true" />
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
        className="grid grid-cols-1 lg:grid-cols-2 gap-0 card-editorial overflow-hidden"
      >
        {/* Image side */}
        <div
          className={`relative h-80 lg:h-auto min-h-[420px] overflow-hidden cursor-pointer group ${isReversed ? "lg:order-2" : ""}`}
          onClick={() => galleryImages.length > 0 && openGallery(0)}
        >
          <Picture
            src={cover}
            alt={r.coupleName}
            width={1200}
            height={1500}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-wine-deep/60 via-wine-deep/10 to-transparent" />

          {/* Featured badge */}
          {r.featured && (
            <span className="badge-editorial-dark absolute top-4 left-4">
              À la une
            </span>
          )}

          {/* Gallery count */}
          {galleryImages.length > 1 && (
            <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-wine-deep/70 text-cream text-[10px] uppercase tracking-[0.25em] px-3 py-2 backdrop-blur-sm font-medium">
              <Images className="w-3 h-3" />
              {galleryImages.length} photos
            </div>
          )}
        </div>

        {/* Story side */}
        <div className={`flex flex-col p-10 md:p-14 bg-cream ${isReversed ? "lg:order-1" : ""}`}>
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-8">
            {r.type && (
              <span className="badge-editorial">
                {r.type}
              </span>
            )}
            {formattedDate && (
              <span className="text-[10px] uppercase tracking-[0.3em] text-wine-deep/55 font-medium">
                {formattedDate}
              </span>
            )}
            {r.location && (
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-wine-deep/55 font-medium">
                <MapPin className="w-3 h-3" />
                {r.location}
              </span>
            )}
          </div>

          {/* Names */}
          <h3 className="font-display uppercase text-3xl md:text-5xl tracking-tight leading-[0.95] text-wine-deep mb-3">
            {r.coupleName}
          </h3>
          <div className="flex items-center gap-2 mb-8">
            <span className="block w-8 h-px bg-gold"></span>
            <Heart className="w-3 h-3 text-gold flex-shrink-0" />
            <span className="block w-8 h-px bg-gold"></span>
          </div>

          {/* Story */}
          {r.story ? (
            <p className="text-wine-deep/70 leading-relaxed text-sm md:text-base flex-grow font-light italic">
              "{r.story}"
            </p>
          ) : (
            <p className="text-wine-deep/55 italic text-sm flex-grow font-light">
              "Une histoire d'amour unique, célébrée avec élégance."
            </p>
          )}

          {/* Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="mt-10 grid grid-cols-4 gap-1.5">
              {galleryImages.slice(0, 4).map((img, i) => (
                <button
                  key={i}
                  onClick={() => openGallery(i)}
                  aria-label={`Ouvrir la galerie — photo ${i + 1}`}
                  className="aspect-square overflow-hidden hover:opacity-80 transition-opacity"
                >
                  <Picture src={img} alt="" role="presentation" width={400} height={400} loading="lazy" className="w-full h-full object-cover" />
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
              className="mt-6 btn-editorial-ghost text-wine-deep self-start"
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
    <div className="w-full">
      <SEO title="Nos réalisations" description="Galerie de mariages afro et mixtes célébrés en Belgique : inspirations, photos, témoignages de couples." />
      {/* Hero éditorial — wine-deep style lamangue */}
      <section className="relative bg-wine-deep text-cream pt-40 pb-24 md:pt-48 md:pb-32 lg:pl-16 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>\")" }}
        />
        <div className="relative z-10 container mx-auto px-6 md:px-12 max-w-5xl text-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-3 text-[10px] md:text-xs uppercase tracking-[0.4em] text-gold font-medium mb-8"
          >
            <span className="block w-8 h-px bg-gold"></span>
            {t("realisations.badge")}
            <span className="block w-8 h-px bg-gold"></span>
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display uppercase font-medium leading-[0.95] tracking-[-0.01em] mb-8 text-cream text-5xl md:text-7xl lg:text-[6rem]"
          >
            {t("realisations.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-cream/70 font-light max-w-2xl mx-auto leading-relaxed"
          >
            {t("realisations.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Stories */}
      <section className="py-20 md:py-32 bg-cream">
        <div className="container mx-auto px-6 md:px-12 max-w-6xl space-y-10 md:space-y-16">
          {realisations.map((r, i) => (
            <RealisationCard key={r.id} r={r} index={i} />
          ))}
        </div>
      </section>

      {/* CTA — wine deep editorial */}
      <section className="py-32 md:py-44 bg-wine-deep text-center text-cream relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>\")" }}
        />
        <div className="relative z-10 container mx-auto px-6 max-w-3xl">
          <Heart className="w-6 h-6 text-gold mx-auto mb-8" />
          <h2 className="font-display uppercase font-medium text-cream text-4xl md:text-6xl lg:text-7xl mb-8 leading-[0.95] tracking-tight">
            {t("realisations.cta_title")}
          </h2>
          <p className="text-cream/75 mb-12 font-light leading-relaxed text-base md:text-lg">{t("realisations.cta_subtitle")}</p>
          <a href="/contact" className="btn-editorial">
            {t("realisations.cta_btn")}
          </a>
        </div>
      </section>
    </div>
  );
}
