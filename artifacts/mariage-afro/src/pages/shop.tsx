import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mail, Sparkles, Layout, BookOpen, Globe, ArrowRight } from "lucide-react";

import img1 from "@assets/pexels-darina-belonogova-7193167_1776285262172.jpg";
import img2 from "@assets/pexels-rimiscky-34747069_1776285262172.jpg";
import img3 from "@assets/pexels-darina-belonogova-7193204_1776285262172.jpg";
import img4 from "@assets/pexels-pavel-danilyuk-8815279_1776285262172.jpg";
import img5 from "@assets/pexels-nudethephotographer-34543838_1776285262172.jpg";

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
    <div className="w-full pt-28">
      {/* Hero */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6 md:px-12 text-center max-w-3xl">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-5"
          >
            {t("shop.tagline")}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold font-serif mb-6 text-foreground"
          >
            {t("shop.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mx-auto"
          >
            {t("shop.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6 md:px-12 space-y-16 md:space-y-24">
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
                className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${reversed ? "lg:[&>*:first-child]:order-2" : ""}`}
              >
                {/* Image */}
                <div className="relative h-72 md:h-96 overflow-hidden">
                  <img src={cat.image} alt={cat.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/25" />
                  <div className="absolute top-5 left-5 w-14 h-14 bg-primary text-white flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="absolute bottom-5 left-5 text-[11px] font-bold uppercase tracking-widest text-white/80">
                    0{i + 1} / 0{categories.length}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h2 className="text-2xl md:text-4xl font-bold font-serif text-foreground mb-5 leading-tight">
                    {cat.title}
                  </h2>
                  <div className="w-12 h-1 bg-primary mb-6"></div>
                  <p className="text-muted-foreground leading-relaxed mb-8">
                    {cat.desc}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {cat.items.map((item, j) => (
                      <li
                        key={j}
                        className="flex items-center justify-between gap-4 border-b border-border pb-3"
                      >
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                        <span className="text-sm font-bold text-primary whitespace-nowrap">
                          {t("shop.from_label")} {item.price}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/contact">
                    <Button
                      variant="outline"
                      className="rounded-none border-primary text-primary hover:bg-primary hover:text-white uppercase tracking-wider text-xs h-11 px-7 gap-2"
                    >
                      {t("shop.cta_quote")}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Banner */}
      <section className="py-24 bg-foreground text-white">
        <div className="container mx-auto px-6 md:px-12 text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold font-serif mb-6 leading-tight">
              {t("shop.banner_title")}
            </h2>
            <p className="text-lg text-white/80 leading-relaxed mb-10">
              {t("shop.banner_desc")}
            </p>
            <Link to="/contact">
              <Button className="bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-14 px-10">
                {t("shop.banner_cta")}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
