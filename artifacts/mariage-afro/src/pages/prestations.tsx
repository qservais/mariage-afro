import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  MapPin,
  CheckCircle2,
  Star,
  FileText,
  CalendarCheck,
  BookmarkCheck,
  Video,
  CalendarClock,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

import VendorActionModal, { type VendorAction } from "@/components/VendorActionModal";

import img1 from "@assets/GM-01293.jpg_1776614313614.jpeg";
import img2 from "@assets/MielmagMS-48of267.jpg_1776614313615.jpeg";
import img3 from "@assets/New-Project-12_1776614330308.png";
import img4 from "@assets/MielmagMS-70of267.jpg_1776614313615.jpeg";
import img5 from "@assets/GM-00756.jpg_1776614313614.jpeg";
import img6 from "@assets/DSC05396.jpg_1776614313613.jpeg";
import img7 from "@assets/GM-00679.jpg_1776614313614.jpeg";
import img8 from "@assets/MielMagGM-156of162.jpg_1776614313614.jpeg";
import bannerImg from "@assets/GM-01293.jpg_1776614313614.jpeg";

const VENDORS = [
  {
    id: 1,
    name: "Aminata Photography",
    city: "Bruxelles",
    categoryIndex: 0,
    tagline:
      "Spécialiste des mariages afro et mixtes depuis 8 ans. Portraits authentiques chargés d'émotion et de couleurs.",
    services: ["Reportage cérémonie", "Séance couple", "Album premium", "Tirages fine art"],
    rating: 5,
    image: img1,
    gallery: [img2, img4, img7],
    verified: true,
  },
  {
    id: 2,
    name: "Film de Miel",
    city: "Bruxelles · Anvers",
    categoryIndex: 1,
    tagline:
      "Films cinématographiques de mariage d'exception. Chaque image raconte une histoire unique et intemporelle.",
    services: ["Film highlight 5 min", "Documentaire 30 min", "Drone 4K", "Live multicam"],
    rating: 5,
    image: img2,
    gallery: [img4, img8, img1],
    verified: true,
  },
  {
    id: 3,
    name: "DJ Koffi",
    city: "Liège · Bruxelles",
    categoryIndex: 2,
    tagline:
      "Ambiances afrobeats, coupe-décalé, afropop et afrotrap. Des sets sur mesure pour vos mariages mixtes.",
    services: ["DJ set 6h", "MC bilingue", "Sono & lumières", "Animation cérémonie"],
    rating: 5,
    image: img3,
    gallery: [img5, img6, img8],
    verified: true,
  },
  {
    id: 4,
    name: "Fleurs d'Afrique",
    city: "Bruxelles",
    categoryIndex: 3,
    tagline:
      "Compositions florales inspirées des traditions africaines. Couleurs vibrantes, textures riches, élégance contemporaine.",
    services: ["Bouquet mariée", "Décor cérémonie", "Centre de table", "Arche florale"],
    rating: 5,
    image: img4,
    gallery: [img1, img7, img5],
    verified: true,
  },
  {
    id: 5,
    name: "Saveurs du Monde",
    city: "Gand · Bruxelles",
    categoryIndex: 4,
    tagline:
      "Cuisine fusion afro-européenne raffinée. Cocktails dinatoires, buffets et repas assis pour vos réceptions.",
    services: ["Buffet afro-fusion", "Repas assis 5 services", "Cocktail dinatoire", "Bar mixologie"],
    rating: 4,
    image: img5,
    gallery: [img6, img2, img4],
    verified: true,
  },
  {
    id: 6,
    name: "Beauty by Ama",
    city: "Bruxelles",
    categoryIndex: 5,
    tagline:
      "Coiffures afro, tresses, chignons élaborés et maquillage de mariée. Sublimez votre beauté naturelle.",
    services: ["Coiffure mariée", "Maquillage HD", "Essai inclus", "Retouches journée"],
    rating: 5,
    image: img6,
    gallery: [img1, img8, img7],
    verified: true,
  },
  {
    id: 7,
    name: "Domaine des Palmes",
    city: "Waterloo · Namur",
    categoryIndex: 6,
    tagline:
      "Domaine de prestige pour 50 à 500 invités. Espaces modulables, jardins et décoration premium inclus.",
    services: ["Salle 500 invités", "Jardin & terrasse", "Hébergement 30 pers.", "Parking 200 places"],
    rating: 4,
    image: img7,
    gallery: [img4, img5, img1],
    verified: true,
  },
  {
    id: 8,
    name: "Elite Prestige",
    city: "Bruxelles",
    categoryIndex: 7,
    tagline:
      "Limousines, berlines de luxe et bus décoré pour cortège nuptial. Ponctualité et élégance garanties.",
    services: ["Limousine mariés", "Berline témoins", "Bus 50 invités", "Décor véhicule"],
    rating: 5,
    image: img8,
    gallery: [img3, img6, img2],
    verified: false,
  },
];

const ACTIONS: { key: VendorAction; icon: typeof FileText }[] = [
  { key: "quote", icon: FileText },
  { key: "availability", icon: CalendarCheck },
  { key: "booking", icon: BookmarkCheck },
  { key: "zoom", icon: Video },
  { key: "rdv", icon: CalendarClock },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} étoiles sur 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= count
              ? "text-amber-400 fill-amber-400"
              : "text-muted-foreground/30 fill-muted-foreground/10"
          }`}
        />
      ))}
    </div>
  );
}

const SERVICE_REQUEST_OPTIONS = [
  "dj",
  "catering",
  "photo",
  "decoration",
  "flowers",
  "transport",
  "venue",
  "beauty",
  "video",
  "animation",
] as const;

type ServiceRequestValues = {
  name: string;
  email: string;
  phone?: string;
  weddingDate?: string;
  budget?: string;
  services: string[];
  message?: string;
};

function ServiceRequestSection() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, { message: t("partners.validation.name") }),
        email: z.string().email({ message: t("partners.validation.email") }),
        phone: z.string().optional(),
        weddingDate: z.string().optional(),
        budget: z.string().optional(),
        services: z.array(z.string()).min(1, {
          message: t("partners.validation.services"),
        }),
        message: z.string().optional(),
      }),
    [t],
  );

  const form = useForm<ServiceRequestValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      weddingDate: "",
      budget: "",
      services: [],
      message: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ServiceRequestValues) => {
      const message = [values.budget && `Budget: ${values.budget}`, values.message]
        .filter(Boolean)
        .join("\n\n");
      const res = await fetch("/api/service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.phone,
          weddingDate: values.weddingDate,
          services: values.services,
          message,
        }),
      });
      if (!res.ok) throw new Error("send_failed");
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      form.reset();
    },
    onError: () =>
      toast({ title: t("contact.form.error"), variant: "destructive" }),
  });

  return (
    <section id="service-request" className="py-20 md:py-28 bg-secondary/30 border-t border-border">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <div className="text-center mb-12">
          <span className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">
            {t("partners.service_request.label")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground mb-4">
            {t("partners.service_request.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("partners.service_request.subtitle")}
          </p>
        </div>

        {submitted ? (
          <div className="bg-white border border-border p-10 text-center">
            <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold font-serif text-foreground mb-2">
              {t("partners.success_title")}
            </h3>
            <p className="text-muted-foreground mb-6">{t("partners.success_desc")}</p>
            <Button
              onClick={() => setSubmitted(false)}
              variant="outline"
              className="rounded-none border-primary text-primary hover:bg-primary hover:text-white uppercase tracking-wider h-11 px-8"
            >
              {t("partners.service_request.new_request")}
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
              className="bg-white border border-border p-6 md:p-10 space-y-6"
            >
              <FormField
                control={form.control}
                name="services"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-base font-bold">
                      {t("partners.service_request.services_label")}
                    </FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                      {SERVICE_REQUEST_OPTIONS.map((opt) => (
                        <FormField
                          key={opt}
                          control={form.control}
                          name="services"
                          render={({ field }) => {
                            const checked = field.value?.includes(opt);
                            return (
                              <FormItem className="flex items-start gap-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(c) => {
                                      const next = c
                                        ? [...(field.value ?? []), opt]
                                        : (field.value ?? []).filter((v) => v !== opt);
                                      field.onChange(next);
                                    }}
                                    className="mt-0.5 rounded-none data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal cursor-pointer leading-snug">
                                  {t(`partners.service_request.services.${opt}`)}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("contact.form.name")}</FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("contact.form.email")}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} className="rounded-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("contact.form.phone")}</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} className="rounded-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weddingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("contact.form.date")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="rounded-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("contact.form.budget")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("partners.service_request.budget_placeholder")}
                        className="rounded-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("partners.service_request.message_label")}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        {...field}
                        placeholder={t("partners.service_request.message_placeholder")}
                        className="rounded-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-12"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t("contact.form.submitting")}
                  </>
                ) : (
                  t("partners.service_request.submit")
                )}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </section>
  );
}

type BecomePartnerValues = {
  businessName: string;
  category: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  description: string;
};

function BecomePartnerSection() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        businessName: z.string().min(2, { message: t("partners.validation.business_name") }),
        category: z.string().min(2, { message: t("partners.validation.category") }),
        contactName: z.string().min(2, { message: t("partners.validation.name") }),
        email: z.string().email({ message: t("partners.validation.email") }),
        phone: z.string().optional(),
        website: z.string().optional(),
        description: z.string().min(20, { message: t("partners.validation.description") }),
      }),
    [t],
  );

  const form = useForm<BecomePartnerValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: "",
      category: "",
      contactName: "",
      email: "",
      phone: "",
      website: "",
      description: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: BecomePartnerValues) => {
      const res = await fetch("/api/become-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("send_failed");
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      form.reset();
    },
    onError: () =>
      toast({ title: t("contact.form.error"), variant: "destructive" }),
  });

  return (
    <section id="become-partner" className="py-20 md:py-28 bg-white border-t border-border">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <div className="text-center mb-12">
          <span className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">
            {t("partners.become.label")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground mb-4">
            {t("partners.become.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("partners.become.subtitle")}
          </p>
        </div>

        {submitted ? (
          <div className="bg-secondary/30 border border-border p-10 text-center">
            <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold font-serif text-foreground mb-2">
              {t("partners.become.success_title")}
            </h3>
            <p className="text-muted-foreground mb-6">{t("partners.become.success_desc")}</p>
            <Button
              onClick={() => setSubmitted(false)}
              variant="outline"
              className="rounded-none border-primary text-primary hover:bg-primary hover:text-white uppercase tracking-wider h-11 px-8"
            >
              {t("partners.become.new_request")}
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
              className="bg-secondary/30 border border-border p-6 md:p-10 space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("partners.become.business_name")}</FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("partners.become.category")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("partners.become.category_placeholder")}
                          className="rounded-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("partners.become.contact_name")}</FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("contact.form.email")}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} className="rounded-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("contact.form.phone")}</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} className="rounded-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("partners.become.website")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://"
                          className="rounded-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("partners.become.description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={5}
                        {...field}
                        placeholder={t("partners.become.description_placeholder")}
                        className="rounded-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-12"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t("contact.form.submitting")}
                  </>
                ) : (
                  t("partners.become.submit")
                )}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </section>
  );
}

export default function Prestations() {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<number | null>(null);
  const [activeModal, setActiveModal] = useState<{
    vendor: { id: number; name: string };
    action: VendorAction;
  } | null>(null);

  const categories = t("prestations.items", { returnObjects: true }) as string[];

  useEffect(() => {
    document.title = `${t("prestations.title")} — Mariage Afro`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("prestations.subtitle"));
  }, [t]);

  const filtered =
    activeFilter === null ? VENDORS : VENDORS.filter((v) => v.categoryIndex === activeFilter);

  const filters = [
    { label: t("prestations.filter_all"), value: null },
    ...categories.map((cat, i) => ({ label: cat, value: i })),
  ];

  return (
    <div className="w-full pt-28">
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-5"
          >
            {t("nav.partners")}
          </motion.span>
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
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            {t("prestations.subtitle")}
          </motion.p>
        </div>
      </section>

      <section className="bg-white border-y border-border py-6 sticky top-[62px] lg:top-[72px] z-30">
        <div className="container mx-auto px-4 md:px-12">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
            {filters.map((filter) => (
              <button
                key={String(filter.value)}
                onClick={() => setActiveFilter(filter.value)}
                className={`flex-shrink-0 snap-start px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                  activeFilter === filter.value
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-foreground border-border hover:border-primary hover:text-primary"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-6 md:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={String(activeFilter)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {filtered.map((vendor, i) => (
                <motion.article
                  key={vendor.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="bg-white border border-border overflow-hidden flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="relative h-64 md:h-72 overflow-hidden">
                    <img
                      src={vendor.image}
                      alt={vendor.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <span className="absolute top-4 left-4 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
                      {categories[vendor.categoryIndex]}
                    </span>
                    {vendor.verified && (
                      <span className="absolute top-4 right-4 bg-white/95 text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {t("prestations.verified_badge")}
                      </span>
                    )}
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="text-xl md:text-2xl font-bold font-serif leading-tight mb-1">
                        {vendor.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1.5 uppercase tracking-wider">
                          <MapPin className="w-3 h-3" />
                          {vendor.city}
                        </span>
                        <StarRating count={vendor.rating} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 p-1 bg-secondary/30">
                    {vendor.gallery.slice(0, 3).map((g, idx) => (
                      <div key={idx} className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={g}
                          alt={`${vendor.name} ${idx + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="p-6 md:p-7 flex flex-col flex-grow">
                    <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                      {vendor.tagline}
                    </p>

                    <div className="mb-6">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold mb-2">
                        {t("partners.services_offered")}
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                        {vendor.services.map((s) => (
                          <li
                            key={s}
                            className="flex items-start gap-1.5 text-sm text-foreground/80"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-auto grid grid-cols-2 lg:grid-cols-3 gap-2">
                      {ACTIONS.map(({ key, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() =>
                            setActiveModal({
                              vendor: { id: vendor.id, name: vendor.name },
                              action: key,
                            })
                          }
                          className="flex items-center justify-center gap-1.5 border border-primary/40 text-primary hover:bg-primary hover:text-white text-[11px] font-bold uppercase tracking-wider py-2.5 px-2 transition-colors"
                        >
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">
                            {t(`partners.actions.${key}.button`)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-24 text-muted-foreground">
              <p className="text-lg">{t("partners.empty")}</p>
            </div>
          )}
        </div>
      </section>

      <ServiceRequestSection />
      <BecomePartnerSection />

      <section className="py-32 relative flex items-center justify-center text-center">
        <div className="absolute inset-0 z-0">
          <img src={bannerImg} alt="Wedding" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <div className="relative z-10 container mx-auto px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-white mb-6">
              {t("prestations.banner_title")}
            </h2>
            <p className="text-white/75 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
              {t("prestations.banner_desc")}
            </p>
            <a href="#service-request">
              <Button className="bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-14 px-10 text-sm">
                {t("prestations.banner_cta")}
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {activeModal && (
        <VendorActionModal
          open={!!activeModal}
          onClose={() => setActiveModal(null)}
          vendor={activeModal.vendor}
          action={activeModal.action}
        />
      )}
    </div>
  );
}
