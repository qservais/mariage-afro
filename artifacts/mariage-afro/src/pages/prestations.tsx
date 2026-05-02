import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@clerk/react";
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
  PlusCircle,
  ChevronDown,
  ChevronUp,
  List as ListIcon,
  Map as MapIcon,
  Scale,
} from "lucide-react";

import VendorAvailabilityCalendar from "@/components/VendorAvailabilityCalendar";
import MarketplaceFilters, { buildSearchFromFilters, readFiltersFromSearch } from "@/components/marketplace/MarketplaceFilters";
import MarketplaceMap from "@/components/marketplace/MarketplaceMap";
import ComparatorBar, { useComparator } from "@/components/marketplace/ComparatorBar";
import { ReviewStars } from "@/components/marketplace/ReviewStars";
import { comparator, MAX_COMPARE } from "@/lib/comparator";

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

import img1 from "@assets/pexels-nudethephotographer-34543838_1776285262172.jpg";
import img2 from "@assets/pexels-darina-belonogova-7193204_1776285262172.jpg";
import img3 from "@assets/pexels-darina-belonogova-7193167_1776285262172.jpg";
import img4 from "@assets/pexels-pavel-danilyuk-8815279_1776285262172.jpg";
import img5 from "@assets/pexels-is0-shot-2150184196-31518214_1776285262172.jpg";
import img6 from "@assets/pexels-innocent-kapesa-760824113-18751317_1776285262172.jpg";
import img7 from "@assets/pexels-angel-ayala-321556-28976221_1776285262171.jpg";
import img8 from "@assets/pexels-rimiscky-34747069_1776285262172.jpg";
import bannerImg from "@assets/New-Project-12_1776614330308.png";

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

interface DisplayVendor {
  id: number;
  name: string;
  city: string;
  category: string;
  tagline: string;
  services: string[];
  rating: number;
  image: string;
  gallery: string[];
  verified: boolean;
  averageRating?: number;
  reviewCount?: number;
  latitude?: string | null;
  longitude?: string | null;
  region?: string | null;
  priceTier?: number | null;
  culturalStyles?: string[];
  spokenLanguages?: string[];
}

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
    <section id="service-request" className="py-24 md:py-32 bg-cream border-t border-wine-deep/10">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <div className="text-center mb-12">
          <span className="section-eyebrow section-eyebrow-left mb-4">
            {t("partners.service_request.label")}
          </span>
          <h2 className="font-display uppercase text-3xl md:text-5xl tracking-tight text-wine-deep mt-3 mb-6 leading-[1]">
            {t("partners.service_request.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("partners.service_request.subtitle")}
          </p>
        </div>

        {submitted ? (
          <div className="card-editorial p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-gold mx-auto mb-6" />
            <h3 className="font-display uppercase text-2xl tracking-tight text-wine-deep mb-3">
              {t("partners.success_title")}
            </h3>
            <p className="text-wine-deep/70 mb-8 font-light">{t("partners.success_desc")}</p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="btn-editorial-compact"
            >
              {t("partners.service_request.new_request")}
            </button>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
              className="card-editorial p-6 md:p-10 space-y-6"
            >
              <FormField
                control={form.control}
                name="services"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-[0.2em] text-wine-deep font-medium">
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
                                    className="mt-0.5 rounded-none border-wine-deep/30 data-[state=checked]:bg-wine-deep data-[state=checked]:border-wine-deep"
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
                className="btn-editorial-solid w-full justify-center !h-14"
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
    <section id="become-partner" className="py-24 md:py-32 bg-cream border-t border-wine-deep/10">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <div className="text-center mb-12">
          <span className="section-eyebrow section-eyebrow-left mb-4">
            {t("partners.become.label")}
          </span>
          <h2 className="font-display uppercase text-3xl md:text-5xl tracking-tight text-wine-deep mt-3 mb-6 leading-[1]">
            {t("partners.become.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("partners.become.subtitle")}
          </p>
        </div>

        {submitted ? (
          <div className="card-editorial p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-gold mx-auto mb-6" />
            <h3 className="font-display uppercase text-2xl tracking-tight text-wine-deep mb-3">
              {t("partners.become.success_title")}
            </h3>
            <p className="text-wine-deep/70 mb-8 font-light">{t("partners.become.success_desc")}</p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="btn-editorial-compact"
            >
              {t("partners.become.new_request")}
            </button>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
              className="card-editorial p-6 md:p-10 space-y-5"
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
                className="btn-editorial-solid w-full justify-center !h-14"
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
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<{
    vendor: { id: number; name: string };
    action: VendorAction;
  } | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [expandedAvailability, setExpandedAvailability] = useState<number | null>(null);

  const categories = t("prestations.items", { returnObjects: true }) as string[];
  const [searchParams] = useSearchParams();
  const apiQueryString = searchParams.toString();
  const filters = useMemo(() => readFiltersFromSearch(searchParams), [searchParams]);
  const [view, setView] = useState<"list" | "map">("list");

  const { data: apiVendors = [] } = useQuery<DisplayVendor[]>({
    queryKey: ["marketplace-vendors", apiQueryString],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/vendors${apiQueryString ? `?${apiQueryString}` : ""}`);
      if (!res.ok) return [];
      const rows = await res.json();
      return rows.map((v: Record<string, unknown>) => ({
        id: v.id as number,
        name: v.name as string,
        city: v.city as string,
        category: v.category as string,
        tagline: v.tagline as string,
        services: v.services as string[],
        rating: v.rating as number,
        image: (v.coverImage as string | null) || ((v.images as string[]) ?? [])[0] || img1,
        gallery: ((v.images as string[]) ?? []).slice(0, 3),
        verified: v.verified as boolean,
        averageRating: typeof v.averageRating === "number" ? v.averageRating : 0,
        reviewCount: typeof v.reviewCount === "number" ? v.reviewCount : 0,
        latitude: (v.latitude as string | null) ?? null,
        longitude: (v.longitude as string | null) ?? null,
        region: (v.region as string | null) ?? null,
        priceTier: (v.priceTier as number | null) ?? null,
        culturalStyles: (v.culturalStyles as string[] | undefined) ?? [],
        spokenLanguages: (v.spokenLanguages as string[] | undefined) ?? [],
      }));
    },
  });

  const usingApi = apiVendors.length > 0;
  const displayVendors: DisplayVendor[] = useMemo(() => {
    if (usingApi) return apiVendors;
    return VENDORS.map((v) => ({ ...v, category: categories[v.categoryIndex] ?? "" }));
  }, [apiVendors, categories, usingApi]);

  const uniqueCategories = useMemo(
    () => [...new Set(displayVendors.map((v) => v.category))].filter(Boolean),
    [displayVendors],
  );

  useEffect(() => {
    document.title = `${t("prestations.title")} — Mariage Afro`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("prestations.subtitle"));
  }, [t]);

  // Quand on a l'API, le filtrage est server-side ; en fallback on filtre sur la catégorie locale.
  const filtered = usingApi
    ? displayVendors
    : (filters.category ? displayVendors.filter((v) => v.category === filters.category) : displayVendors);

  // JSON-LD ItemList des prestataires affichés (l'AggregateRating est désormais sur la fiche détail)
  const jsonLdString = useMemo(() => {
    if (filtered.length === 0) return "";
    const list = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: filtered.slice(0, 20).map((v, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url:
          typeof window !== "undefined"
            ? `${window.location.origin}/partenaires/${v.id}`
            : `/partenaires/${v.id}`,
        name: v.name,
      })),
    };
    return JSON.stringify(list)
      .replace(/<\/(script)/gi, "<\\/$1")
      .replace(/<!--/g, "<\\!--")
      .replace(/\u2028|\u2029/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
  }, [filtered]);

  // Comparator state — déclenche un re-render lorsqu'on coche/décoche
  const { ids: compareIds } = useComparator("vendor");
  const handleToggleCompare = (id: number) => {
    const r = comparator.toggle("vendor", id);
    if (r.reachedMax) {
      toast({ title: `Maximum ${MAX_COMPARE} prestataires`, description: "Retirez-en un avant d'en ajouter un autre.", variant: "destructive" });
    }
  };

  async function handleAddToProject(vendor: DisplayVendor) {
    if (!isSignedIn) {
      navigate("/espace-client/login");
      return;
    }
    setAddingId(vendor.id);
    try {
      const res = await fetch(`/api/marketplace/vendors/${vendor.id}/add-to-project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: `${vendor.name} ajouté à votre projet !` });
      } else {
        toast({ title: "Erreur lors de l'ajout", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur réseau", variant: "destructive" });
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className="w-full">
      {/* Hero éditorial — wine-deep style lamangue */}
      <section className="relative bg-wine-deep text-cream pt-40 pb-24 md:pt-48 md:pb-32 lg:pl-16 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>\")" }}
        />
        <div className="relative z-10 container mx-auto px-6 md:px-12 text-center max-w-5xl">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-3 text-[10px] md:text-xs uppercase tracking-[0.4em] text-gold font-medium mb-8"
          >
            <span className="block w-8 h-px bg-gold"></span>
            {t("nav.partners")}
            <span className="block w-8 h-px bg-gold"></span>
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display uppercase font-medium leading-[0.95] tracking-[-0.01em] mb-8 text-cream text-5xl md:text-7xl lg:text-[6rem]"
          >
            {t("prestations.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-cream/70 font-light max-w-2xl mx-auto leading-relaxed"
          >
            {t("prestations.subtitle")}
          </motion.p>
        </div>
      </section>

      {jsonLdString && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString }} />
      )}

      <div className="sticky top-[62px] lg:top-[72px] z-30">
        <MarketplaceFilters
          showCategory
          categoryOptions={uniqueCategories}
          totalResults={filtered.length}
        />
        <div className="bg-cream border-b border-wine-deep/10">
          <div className="container mx-auto px-4 md:px-12 py-2 flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`px-3 py-2 text-xs uppercase tracking-[0.2em] inline-flex items-center gap-1.5 border ${view === "list" ? "bg-wine-deep text-cream border-wine-deep" : "border-wine-deep/20 text-wine-deep hover:border-wine-deep/60"}`}
              data-testid="view-list"
            >
              <ListIcon className="w-3.5 h-3.5" /> Liste
            </button>
            <button
              type="button"
              onClick={() => setView("map")}
              className={`px-3 py-2 text-xs uppercase tracking-[0.2em] inline-flex items-center gap-1.5 border ${view === "map" ? "bg-wine-deep text-cream border-wine-deep" : "border-wine-deep/20 text-wine-deep hover:border-wine-deep/60"}`}
              data-testid="view-map"
            >
              <MapIcon className="w-3.5 h-3.5" /> Carte
            </button>
          </div>
        </div>
      </div>

      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-6 md:px-12">
          {view === "map" ? (
            <MarketplaceMap
              points={filtered.map((v) => ({
                id: v.id,
                name: v.name,
                city: v.city,
                category: v.category,
                latitude: v.latitude ?? null,
                longitude: v.longitude ?? null,
                href: `/partenaires?focus=${v.id}`,
                image: v.image,
                averageRating: v.averageRating,
                reviewCount: v.reviewCount,
              }))}
              height={640}
            />
          ) : (
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
                  className="card-editorial overflow-hidden flex flex-col"
                >
                  <div className="relative h-64 md:h-72 overflow-hidden">
                    <img
                      src={vendor.image}
                      alt={vendor.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-wine-deep/85 via-wine-deep/30 to-transparent" />
                    <span className="badge-editorial-dark absolute top-4 left-4">
                      {vendor.category}
                    </span>
                    <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                      {vendor.verified && (
                        <span className="badge-editorial bg-cream/95 backdrop-blur-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          {t("prestations.verified_badge")}
                        </span>
                      )}
                      <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-cream/95 backdrop-blur-sm text-[10px] uppercase tracking-[0.2em] text-wine-deep cursor-pointer hover:bg-cream">
                        <input
                          type="checkbox"
                          checked={compareIds.includes(vendor.id)}
                          onChange={() => handleToggleCompare(vendor.id)}
                          className="accent-wine-deep"
                          data-testid={`compare-${vendor.id}`}
                        />
                        <Scale className="w-3 h-3" /> Comparer
                      </label>
                    </div>
                    <div className="absolute bottom-5 left-5 right-5 text-cream">
                      <h3 className="font-display uppercase text-2xl md:text-3xl tracking-tight leading-[1] mb-2">
                        <Link
                          to={`/partenaires/${vendor.id}`}
                          className="hover:text-gold transition-colors"
                          data-testid={`vendor-link-${vendor.id}`}
                        >
                          {vendor.name}
                        </Link>
                      </h3>
                      <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] flex-wrap">
                        <span className="flex items-center gap-1.5 text-cream/80">
                          <MapPin className="w-3 h-3" />
                          {vendor.city}
                        </span>
                        {(vendor.reviewCount ?? 0) > 0 && (vendor.averageRating ?? 0) > 0 ? (
                          <span className="flex items-center gap-1.5 text-cream/90">
                            <ReviewStars rating={vendor.averageRating!} size={12} />
                            <span>{vendor.averageRating!.toFixed(1)} ({vendor.reviewCount})</span>
                          </span>
                        ) : (
                          <StarRating count={vendor.rating} />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 p-1 bg-wine-deep/5">
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

                  <div className="p-7 md:p-8 flex flex-col flex-grow">
                    <p className="text-wine-deep/70 text-sm leading-relaxed mb-7 font-light italic">
                      {vendor.tagline}
                    </p>

                    <div className="mb-8">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium mb-3">
                        {t("partners.services_offered")}
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                        {vendor.services.map((s) => (
                          <li
                            key={s}
                            className="flex items-start gap-2 text-sm text-wine-deep/85 font-light"
                          >
                            <span className="block w-3 h-px bg-gold flex-shrink-0 mt-2.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-auto space-y-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedAvailability((cur) => (cur === vendor.id ? null : vendor.id))
                        }
                        className="w-full flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-wine-deep/80 border-t border-wine-deep/10 pt-3"
                        data-testid={`toggle-availability-${vendor.id}`}
                      >
                        <span className="flex items-center gap-2">
                          <CalendarCheck className="w-3.5 h-3.5" />
                          {t("marketplace.availability.toggle")}
                        </span>
                        {expandedAvailability === vendor.id ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {expandedAvailability === vendor.id && (
                        <VendorAvailabilityCalendar vendorId={vendor.id} months={6} />
                      )}
                      <button
                        onClick={() => handleAddToProject(vendor)}
                        disabled={addingId === vendor.id}
                        className="btn-editorial-compact-solid w-full"
                      >
                        {addingId === vendor.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <PlusCircle className="w-3.5 h-3.5" />
                        )}
                        {t("partners.add_to_project")}
                      </button>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                        {ACTIONS.map(({ key, icon: Icon }) => (
                          <button
                            key={key}
                            onClick={() =>
                              setActiveModal({
                                vendor: { id: vendor.id, name: vendor.name },
                                action: key,
                              })
                            }
                            className="btn-editorial-compact"
                          >
                            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">
                              {t(`partners.actions.${key}.button`)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </AnimatePresence>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-24 text-muted-foreground">
              <p className="text-lg">{t("partners.empty")}</p>
            </div>
          )}
        </div>
      </section>

      <ComparatorBar
        kind="vendor"
        vendors={displayVendors.map((v) => ({ id: v.id, name: v.name, category: v.category, city: v.city, image: v.image }))}
      />

      <ServiceRequestSection />
      <BecomePartnerSection />

      <section className="py-32 md:py-40 relative flex items-center justify-center text-center">
        <div className="absolute inset-0 z-0">
          <img src={bannerImg} alt="Wedding" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-wine-deep/80" />
        </div>
        <div className="relative z-10 container mx-auto px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-eyebrow mb-8">{t("nav.partners")}</span>
            <h2 className="font-display uppercase text-cream text-4xl md:text-6xl lg:text-7xl mb-8 leading-[0.95] tracking-tight">
              {t("prestations.banner_title")}
            </h2>
            <p className="text-cream/75 text-base md:text-lg leading-relaxed mb-12 max-w-xl mx-auto font-light">
              {t("prestations.banner_desc")}
            </p>
            <a href="#service-request" className="btn-editorial">
              {t("prestations.banner_cta")}
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
