import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Phone, Mail, MapPin } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Picture } from "@/components/Picture";

import contactImg from "@assets/MielMagGM-156of162.jpg_1776614313614.jpeg";
import { SEO } from "@/components/SEO";

const SERVICE_OPTIONS = [
  "wedding_planning",
  "decoration",
  "catering",
  "photo_video",
  "dj_music",
  "venue_search",
  "coordination",
  "other",
] as const;

const formSchema = z.object({
  name: z.string().min(2, { message: "Nom requis" }),
  email: z.string().email({ message: "Email invalide" }),
  phone: z.string().optional(),
  date: z.string().optional(),
  guestCount: z.string().optional(),
  budget: z.string().optional(),
  weddingType: z.string().min(1, { message: "Type requis" }),
  services: z.array(z.string()).default([]),
  message: z.string().min(10, { message: "Message requis (min 10 caractères)" })
});

type FormValues = z.infer<typeof formSchema>;

export default function Contact() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const prefillName = searchParams.get("name") ?? "";
  const prefillVenue = searchParams.get("venue") ?? "";
  const prefillDate = searchParams.get("date") ?? "";


  const rdvModes = [
    {
      icon: <Phone className="w-6 h-6 text-gold" />,
      title: t("contact.rdv_phone_title"),
      desc: t("contact.rdv_phone_desc"),
      action: t("contact.rdv_phone_cta"),
      href: `tel:${t("footer.phone")}`
    },
    {
      icon: <Mail className="w-6 h-6 text-gold" />,
      title: t("contact.rdv_email_title"),
      desc: t("contact.rdv_email_desc"),
      action: t("contact.rdv_email_cta"),
      href: `mailto:${t("footer.email")}`
    },
    {
      icon: <MapPin className="w-6 h-6 text-gold" />,
      title: t("contact.rdv_inperson_title"),
      desc: t("contact.rdv_inperson_desc"),
      action: t("contact.rdv_inperson_cta"),
      href: "#contact-form"
    }
  ];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: prefillName,
      email: "",
      phone: "",
      date: prefillDate,
      guestCount: "",
      budget: "",
      weddingType: "",
      services: [],
      message: prefillVenue ? `Lieu envisagé : ${prefillVenue}` : ""
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        weddingDate: data.date || null,
        guestCount: data.guestCount ? Number(data.guestCount) : null,
        budget: data.budget || null,
        weddingType: data.weddingType,
        services: data.services ?? [],
        message: data.message,
      };
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("contact.form.success"),
      });
      form.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t("contact.form.error"),
      });
    }
  });

  function onSubmit(values: FormValues) {
    mutation.mutate(values);
  }

  return (
    <div className="w-full">
      <SEO title="Contact" description="Contactez l'équipe Mariage Afro : conseils personnalisés, prise de rendez-vous, partenariats. Réponse sous 48h." />
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
            Parlons de votre mariage
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-display uppercase font-medium leading-[0.95] tracking-[-0.01em] mt-6 mb-8 text-cream text-5xl md:text-7xl lg:text-[6.5rem]"
          >
            {t("contact.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-cream/70 font-light max-w-2xl mx-auto leading-relaxed"
          >
            {t("contact.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* 3 RDV Modes */}
      <section className="py-24 md:py-32 bg-cream">
        <div className="container mx-auto px-6 md:px-12 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="section-eyebrow mb-6">{t("contact.rdv_label")}</span>
            <h2 className="section-title-editorial text-3xl md:text-5xl mt-4">
              {t("contact.rdv_title")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-wine-deep/10 border border-wine-deep/10">
            {rdvModes.map((mode, i) => (
              <motion.div
                key={mode.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="flex flex-col items-start bg-cream p-10 hover:bg-white transition-colors group"
              >
                <div className="w-14 h-14 border border-gold/40 flex items-center justify-center mb-8 text-gold group-hover:bg-gold group-hover:text-cream group-hover:border-gold transition-colors [&>svg]:!text-current">
                  {mode.icon}
                </div>
                <h3 className="font-display uppercase text-xl tracking-tight text-wine-deep mb-3">{mode.title}</h3>
                <p className="text-wine-deep/65 text-sm leading-relaxed flex-grow mb-8 font-light">{mode.desc}</p>
                <a href={mode.href} className="btn-editorial-ghost text-wine-deep">
                  {mode.action} →
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="py-24 md:py-32 bg-white border-t border-wine-deep/10">
        <div className="container mx-auto px-6 md:px-12 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card-editorial p-10 md:p-12"
            >
              <span className="section-eyebrow section-eyebrow-left mb-4">{t("contact.eyebrow_form")}</span>
              <h3 className="font-display uppercase text-3xl md:text-4xl tracking-tight text-wine-deep mt-3 mb-10 leading-[1]">{t("contact.form_title")}</h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("contact.form.name")}</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} className="bg-cream border-wine-deep/15 rounded-none focus-visible:ring-gold" data-testid="input-contact-name" />
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
                            <Input type="email" placeholder="john@example.com" {...field} className="bg-cream border-wine-deep/15 rounded-none focus-visible:ring-gold" data-testid="input-contact-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("contact.form.phone")}</FormLabel>
                          <FormControl>
                            <Input placeholder="+32 4XX XX XX XX" {...field} className="bg-cream border-wine-deep/15 rounded-none focus-visible:ring-gold" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("contact.form.date")}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-cream border-wine-deep/15 rounded-none focus-visible:ring-gold" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="guestCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("contact.form.guest_count")}</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} placeholder="120" {...field} className="bg-cream border-wine-deep/15 rounded-none focus-visible:ring-gold" data-testid="input-guest-count" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("contact.form.budget")}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-cream border-wine-deep/15 rounded-none focus-visible:ring-gold" data-testid="select-budget">
                                <SelectValue placeholder={t("contact.form.budget_placeholder")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="under_10k">{t("contact.form.budget_options.under_10k")}</SelectItem>
                              <SelectItem value="10k_25k">{t("contact.form.budget_options.10k_25k")}</SelectItem>
                              <SelectItem value="25k_50k">{t("contact.form.budget_options.25k_50k")}</SelectItem>
                              <SelectItem value="over_50k">{t("contact.form.budget_options.over_50k")}</SelectItem>
                              <SelectItem value="undecided">{t("contact.form.budget_options.undecided")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="weddingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("contact.form.wedding_type")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-cream border-wine-deep/15 rounded-none focus-visible:ring-gold" data-testid="select-wedding-type">
                              <SelectValue placeholder={t("contact.form.wedding_type_placeholder")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="afro">{t("contact.form.wedding_type_options.afro")}</SelectItem>
                            <SelectItem value="mixte">{t("contact.form.wedding_type_options.mixte")}</SelectItem>
                            <SelectItem value="traditional">{t("contact.form.wedding_type_options.traditional")}</SelectItem>
                            <SelectItem value="religious">{t("contact.form.wedding_type_options.religious")}</SelectItem>
                            <SelectItem value="other">{t("contact.form.wedding_type_options.other")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="services"
                    render={() => (
                      <FormItem>
                        <FormLabel>{t("contact.form.services")}</FormLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {SERVICE_OPTIONS.map((opt) => (
                            <FormField
                              key={opt}
                              control={form.control}
                              name="services"
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(opt) ?? false}
                                      onCheckedChange={(checked) => {
                                        const current = field.value ?? [];
                                        return checked
                                          ? field.onChange([...current, opt])
                                          : field.onChange(current.filter((v) => v !== opt));
                                      }}
                                      className="rounded-none border-wine-deep/30 data-[state=checked]:bg-wine-deep data-[state=checked]:border-wine-deep"
                                      data-testid={`checkbox-service-${opt}`}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {t(`contact.form.services_options.${opt}`)}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("contact.form.message")}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="..."
                            className="min-h-[150px] bg-cream border-wine-deep/15 rounded-none focus-visible:ring-gold resize-none"
                            {...field}
                            data-testid="textarea-contact-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="btn-editorial-solid w-full justify-center !h-14"
                      disabled={mutation.isPending}
                      data-testid="button-contact-submit"
                    >
                      {mutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {t("contact.form.submitting")}
                        </>
                      ) : (
                        t("contact.form.submit")
                      )}
                    </Button>
                  </div>

                  {mutation.isSuccess && (
                    <div className="p-5 bg-cream border border-gold/40 mt-4 text-center text-wine-deep text-sm uppercase tracking-[0.2em] font-medium">
                      {t("contact.form.success")}
                    </div>
                  )}
                </form>
              </Form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col justify-between"
            >
              <div className="mb-10 relative">
                <Picture
                  src={contactImg}
                  alt="Wedding Rings"
                  width={1200}
                  height={1500}
                  loading="lazy"
                  className="w-full h-[480px] object-cover"
                />
                <div className="absolute -bottom-4 -right-4 hidden md:flex w-24 h-24 border border-gold items-center justify-center bg-cream">
                  <span className="font-display text-3xl text-gold leading-none italic">M.A</span>
                </div>
              </div>
              <div className="card-editorial p-10 md:p-12 bg-wine-deep text-cream border-wine-deep">
                <span className="section-eyebrow section-eyebrow-left mb-4">{t("contact.eyebrow_contact")}</span>
                <h3 className="font-display uppercase text-2xl md:text-3xl tracking-tight text-cream mt-3 mb-8 leading-[1]">{t("contact.practical_title")}</h3>
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <Mail className="w-4 h-4 text-gold flex-shrink-0" />
                    <a href={`mailto:${t("footer.email")}`} className="text-cream/85 hover:text-gold transition-colors text-sm font-light">
                      {t("footer.email")}
                    </a>
                  </div>
                  <div className="flex items-center gap-4">
                    <Phone className="w-4 h-4 text-gold flex-shrink-0" />
                    <a href={`tel:${t("footer.phone")}`} className="text-cream/85 hover:text-gold transition-colors text-sm font-light">
                      {t("footer.phone")}
                    </a>
                  </div>
                  <div className="flex items-start gap-4">
                    <MapPin className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-cream/85 text-sm font-light">{t("footer.address")} — {t("contact.address_suffix")}</span>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-cream/15">
                  <p className="text-xs uppercase tracking-[0.25em] text-gold mb-2 font-medium">Horaires</p>
                  <p className="text-sm text-cream/70 font-light leading-relaxed">
                    {t("contact.practical_hours")}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
