import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Heart, Images, ChevronLeft, ChevronRight, X, Play, Film } from "lucide-react";
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
  videoCouple: string | null;
  videoTeaser: string | null;
  featured: boolean;
}

/* ─── VideoPlayer ─────────────────────────────────────────────────────────── */

function toEmbedUrl(url: string): string | null {
  if (url.includes("/embed/") || url.includes("player.vimeo")) return url;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
  const vmMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`;
  return null;
}

function isEmbed(url: string): boolean {
  return !!(
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("vimeo.com") ||
    url.includes("dailymotion.com") ||
    url.includes("/embed/") ||
    url.includes("player.")
  );
}

interface VideoPlayerProps {
  url: string;
  label: string;
  className?: string;
}

function VideoPlayer({ url, label, className = "" }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const embedSrc = isEmbed(url) ? (toEmbedUrl(url) ?? url) : null;

  function handleHoverIn() {
    if (videoRef.current && !playing) videoRef.current.play().catch(() => {});
  }
  function handleHoverOut() {
    if (videoRef.current && !playing) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }
  function handleClick() {
    if (!videoRef.current) return;
    setPlaying(true);
    videoRef.current.muted = false;
    videoRef.current.controls = true;
    videoRef.current.play();
  }

  if (embedSrc) {
    return (
      <div className={`relative w-full bg-wine-deep overflow-hidden ${className}`}>
        <div className="absolute top-2 left-3 z-10 text-[10px] uppercase tracking-[0.2em] text-cream/50 font-medium pointer-events-none">
          {label}
        </div>
        <iframe
          src={embedSrc}
          title={label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full bg-wine-deep overflow-hidden cursor-pointer group ${className}`}
      onMouseEnter={handleHoverIn}
      onMouseLeave={handleHoverOut}
      onClick={handleClick}
      aria-label={label}
    >
      <div className="absolute top-2 left-3 z-10 text-[10px] uppercase tracking-[0.2em] text-cream/50 font-medium pointer-events-none">
        {label}
      </div>
      <video
        ref={videoRef}
        src={url}
        muted
        playsInline
        loop
        preload="metadata"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center bg-wine-deep/40 group-hover:bg-wine-deep/20 transition-colors">
          <div className="w-12 h-12 rounded-full bg-gold/90 flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-wine-deep fill-wine-deep ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── GalleryModal ────────────────────────────────────────────────────────── */

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

/* ─── RealisationCard ─────────────────────────────────────────────────────── */

function RealisationCard({ r, index }: { r: Realisation; index: number }) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStart, setModalStart] = useState(0);
  const [storyExpanded, setStoryExpanded] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const galleryImages = r.gallery?.length ? r.gallery : r.coverImage ? [r.coverImage] : [];
  const cover = r.coverImage || galleryImages[0] || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  const isReversed = index % 2 === 1;

  // Double-video mode: both videoCouple AND videoTeaser are set
  const hasDoubleVideo = !!(r.videoCouple && r.videoTeaser);
  // Single-video fallback (legacy videoUrl or only one of the two fields)
  const singleVideoUrl = r.videoUrl || (!hasDoubleVideo ? (r.videoCouple || r.videoTeaser) : null) || null;

  const formattedDate = r.weddingDate
    ? new Date(r.weddingDate).toLocaleDateString("fr-BE", { month: "long", year: "numeric" })
    : null;

  const STORY_TRUNCATE = 180;
  const storyText = r.story || null;
  const storyIsTruncatable = storyText && storyText.length > STORY_TRUNCATE;
  const displayedStory = storyText && !storyExpanded && storyIsTruncatable
    ? storyText.slice(0, STORY_TRUNCATE) + "…"
    : storyText;

  function openGallery(i: number) {
    setModalStart(i);
    setModalOpen(true);
  }

  function handleVideoClick() {
    if (!videoRef.current) return;
    setVideoPlaying(true);
    videoRef.current.muted = false;
    videoRef.current.controls = true;
    videoRef.current.play();
  }
  function handleVideoHoverIn() {
    if (videoRef.current && !videoPlaying) videoRef.current.play().catch(() => {});
  }
  function handleVideoHoverOut() {
    if (videoRef.current && !videoPlaying) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }

  /* Shared story panel content */
  const storyPanel = (
    <div className={`flex flex-col p-10 md:p-14 bg-cream ${!hasDoubleVideo && isReversed ? "lg:order-1" : ""}`}>
      {/* Meta pills */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-8">
        {r.type && <span className="badge-editorial">{r.type}</span>}
        {formattedDate && (
          <span className="flex items-center gap-1.5 text-xs uppercase tracking-[0.3em] text-wine-deep/75 font-semibold">
            <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span className="text-wine-deep/50 font-normal normal-case tracking-normal mr-0.5">{t("realisations.date_label")} ·</span>
            {formattedDate}
          </span>
        )}
        {r.location && (
          <span className="flex items-center gap-1.5 text-xs uppercase tracking-[0.3em] text-wine-deep/75 font-semibold">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="text-wine-deep/50 font-normal normal-case tracking-normal mr-0.5">{t("realisations.location_label")} ·</span>
            {r.location}
          </span>
        )}
        {hasDoubleVideo && (
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-gold-deep font-semibold">
            <Film className="w-3 h-3" />
            Film
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

      {/* Story — expandable */}
      <div className="flex-grow mb-6">
        {displayedStory ? (
          <>
            <p className="text-wine-deep/70 leading-relaxed text-sm md:text-base font-light italic">
              "{displayedStory}"
            </p>
            {storyIsTruncatable && (
              <button
                onClick={() => setStoryExpanded(v => !v)}
                className="mt-3 text-xs uppercase tracking-[0.25em] text-gold-deep font-semibold hover:text-wine-deep transition-colors"
              >
                {storyExpanded ? t("realisations.read_less") : t("realisations.read_more")}
              </button>
            )}
          </>
        ) : (
          <p className="text-wine-deep/55 italic text-sm font-light">
            "Une histoire d'amour unique, célébrée avec élégance."
          </p>
        )}
      </div>

      {/* Thumbnails — only when no videos */}
      {!hasDoubleVideo && !singleVideoUrl && galleryImages.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-1.5">
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

      {/* No-video placeholder */}
      {!hasDoubleVideo && !singleVideoUrl && (
        <div className="mt-6 flex items-center gap-2 text-wine-deep/30">
          <Film className="w-4 h-4" />
          <span className="text-xs uppercase tracking-[0.2em] font-medium">{t("realisations.video_placeholder")}</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="card-editorial overflow-hidden"
      >
        {hasDoubleVideo ? (
          /* ── Double video layout ─────────────────────────────────────────── *
           * Desktop: two videos side-by-side (left = couple, right = teaser)  *
           *          story panel below at full width                           *
           * Mobile:  videoCouple → videoTeaser → story, each full-width       */
          <div className="flex flex-col">
            <div className="relative flex flex-col sm:flex-row">
              <VideoPlayer
                url={r.videoCouple!}
                label={t("realisations.video_couple_label")}
                className="flex-1 aspect-video"
              />
              <VideoPlayer
                url={r.videoTeaser!}
                label={t("realisations.video_teaser_label")}
                className="flex-1 aspect-video"
              />
              {/* Preserve featured badge parity with single-media layout */}
              {r.featured && (
                <span className="badge-editorial-dark absolute top-4 left-4 z-10">
                  À la une
                </span>
              )}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-wine-deep/70 text-cream text-[10px] uppercase tracking-[0.25em] px-3 py-2 backdrop-blur-sm font-medium z-10">
                <Film className="w-3 h-3" />
                Film
              </div>
            </div>
            {storyPanel}
          </div>
        ) : (
          /* ── Original layout: single media left / story right ─────────── */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Media side */}
            <div className={`relative h-80 lg:h-auto min-h-[420px] overflow-hidden group ${isReversed ? "lg:order-2" : ""}`}>
              {singleVideoUrl ? (
                /* Legacy single-video using the original inline player for direct files,
                   or the new VideoPlayer for embeds */
                isEmbed(singleVideoUrl) ? (
                  <VideoPlayer
                    url={singleVideoUrl}
                    label={t("realisations.video_couple_label")}
                    className="w-full h-full"
                  />
                ) : (
                  <div
                    className="relative w-full h-full cursor-pointer"
                    onMouseEnter={handleVideoHoverIn}
                    onMouseLeave={handleVideoHoverOut}
                    onClick={handleVideoClick}
                    aria-label={t("realisations.play_video")}
                  >
                    <video
                      ref={videoRef}
                      src={singleVideoUrl}
                      muted
                      playsInline
                      loop
                      preload="metadata"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {!videoPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-wine-deep/30 group-hover:bg-wine-deep/10 transition-colors">
                        <div className="w-14 h-14 rounded-full bg-gold/90 flex items-center justify-center shadow-lg">
                          <Play className="w-6 h-6 text-wine-deep fill-wine-deep ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : (
                /* Photo cover */
                <div
                  className="relative w-full h-full cursor-pointer"
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
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-wine-deep/60 via-wine-deep/10 to-transparent pointer-events-none" />

              {r.featured && (
                <span className="badge-editorial-dark absolute top-4 left-4 z-10">À la une</span>
              )}
              {singleVideoUrl && (
                <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-wine-deep/70 text-cream text-[10px] uppercase tracking-[0.25em] px-3 py-2 backdrop-blur-sm font-medium z-10">
                  <Film className="w-3 h-3" />
                  Film
                </div>
              )}
              {!singleVideoUrl && galleryImages.length > 1 && (
                <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-wine-deep/70 text-cream text-[10px] uppercase tracking-[0.25em] px-3 py-2 backdrop-blur-sm font-medium z-10">
                  <Images className="w-3 h-3" />
                  {galleryImages.length} photos
                </div>
              )}
            </div>

            {/* Story side */}
            {storyPanel}
          </div>
        )}
      </motion.article>

      {modalOpen && galleryImages.length > 0 && (
        <GalleryModal images={galleryImages} startIndex={modalStart} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

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
      videoCouple: null,
      videoTeaser: null,
      featured: i === 0,
    }));
  }, [apiRealisations]);

  return (
    <div className="w-full">
      <SEO title="Nos réalisations" description="Galerie de mariages afro et mixtes célébrés à travers le monde : inspirations, photos, témoignages de couples." />
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
