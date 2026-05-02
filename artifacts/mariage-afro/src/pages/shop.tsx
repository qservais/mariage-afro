import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Sparkles, Layout, BookOpen, Globe } from "lucide-react";

import img1 from "@assets/New-Project-12_1776614330308.png";
import img2 from "@assets/GM-00719.jpg_1776614313614.jpeg";
import img3 from "@assets/MielmagMS-70of267.jpg_1776614313615.jpeg";
import img4 from "@assets/New-Project-42.jpg_1776614313615.jpeg";
import img5 from "@assets/DSC05396.jpg_1776614313613.jpeg";

const CATEGORIES = [
  { icon: Mail, image: img1 },
  { icon: Sparkles, image: img2 },
  { icon: Layout, image: img3 },
  { icon: BookOpen, image: img4 },
  { icon: Globe, image: img5 },
];

export default function Shop() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("nav.shop")} — Mariage Afro`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", t("shop.subtitle"));
    }
  }, [t]);

  const categories = CATEGORIES.map((cat, i) => {
    const idx = i + 1;
    return {
      Icon: cat.icon,
      image: cat.image,
      title: t(`shop.category${idx}_title`),
      desc: t(`shop.category${idx}_desc`),
      items: [1, 2, 3].map((j) => ({
        name: t(`shop.category${idx}_item${j}`),
        price: t(`shop.category${idx}_item${j}_price`),
      })),
    };
  });

  return (
    <div className="w-full">
      {/* Hero éditorial */}
      <section className="relative bg-wine-deep text-cream pt-40 pb-24 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>\")" }}
        />
        <div className="relative z-10 container mx-auto px-6 md:px-12 max-w-5xl text-center">
          <motion.span
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="section-eyebrow mb-8"
          >
            {t("shop.tagline")}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-display uppercase font-medium leading-[0.95] tracking-[-0.01em] mt-6 mb-8 text-cream text-5xl md:text-7xl lg:text-[6.5rem]"
          >
            {t("shop.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-cream/70 font-light max-w-2xl mx-auto leading-relaxed"
          >
            {t("shop.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 md:py-32 bg-cream">
        <div className="container mx-auto px-6 md:px-12 space-y-24 md:space-y-32">
          {categories.map((cat, i) => {
            const Icon = cat.Icon;
            const reversed = i % 2 === 1;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6 }}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${reversed ? "lg:[&>*:first-child]:order-2" : ""}`}
              >
                {/* Image */}
                <div className="relative h-80 md:h-[480px] overflow-hidden">
                  <img src={cat.image} alt={cat.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-wine-deep/30" />
                  <div className="absolute top-6 left-6 w-14 h-14 border border-gold bg-cream/95 text-wine-deep flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-6 left-6 font-display text-xl text-cream tracking-tight">
                    0{i + 1} <span className="text-cream/50 text-sm font-sans uppercase tracking-[0.25em] align-middle ml-2">/ 0{categories.length}</span>
                  </span>
                </div>

                {/* Content */}
                <div>
                  <span className="section-eyebrow section-eyebrow-left mb-4">Catégorie 0{i + 1}</span>
                  <h2 className="font-display uppercase text-3xl md:text-5xl tracking-tight text-wine-deep mt-3 mb-8 leading-[1]">
                    {cat.title}
                  </h2>
                  <p className="text-wine-deep/70 leading-relaxed mb-10 font-light">
                    {cat.desc}
                  </p>

                  <ul className="space-y-0 mb-10 border-t border-wine-deep/15">
                    {cat.items.map((item, j) => (
                      <li
                        key={j}
                        className="flex items-baseline justify-between gap-4 border-b border-wine-deep/15 py-4"
                      >
                        <span className="text-sm font-medium text-wine-deep tracking-tight">{item.name}</span>
                        <span className="text-xs uppercase tracking-[0.2em] text-gold whitespace-nowrap font-medium">
                          {t("shop.from_label")} {item.price}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/contact" className="btn-editorial">
                    {t("shop.cta_quote")}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Banner */}
      <section className="py-32 md:py-40 bg-wine-deep text-cream relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>\")" }}
        />
        <div className="container relative z-10 mx-auto px-6 md:px-12 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-eyebrow mb-8">Sur mesure</span>
            <h2 className="font-display uppercase text-cream text-4xl md:text-6xl lg:text-7xl mt-4 mb-10 leading-[0.95] tracking-tight">
              {t("shop.banner_title")}
            </h2>
            <p className="text-lg text-cream/75 leading-relaxed mb-14 font-light max-w-2xl mx-auto">
              {t("shop.banner_desc")}
            </p>
            <Link to="/contact" className="btn-editorial">
              {t("shop.banner_cta")}
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
