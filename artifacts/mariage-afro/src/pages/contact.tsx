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

import contactImg from "@assets/pexels-innocent-kapesa-760824113-18751317_1776285262172.jpg";

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

  useEffect(() => {
    document.title = `${t("contact.title")} — Mariage Afro`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", t("contact.subtitle"));
    }
  }, [t]);

  const rdvModes = [
    {
      icon: <Phone className="w-6 h-6 text-primary" />,
      title: t("contact.rdv_phone_title"),
      desc: t("contact.rdv_phone_desc"),
      action: t("contact.rdv_phone_cta"),
      href: `tel:${t("footer.phone")}`
    },
    {
      icon: <Mail className="w-6 h-6 text-primary" />,
      title: t("contact.rdv_email_title"),
      desc: t("contact.rdv_email_desc"),
      action: t("contact.rdv_email_cta"),
      href: `mailto:${t("footer.email")}`
    },
    {
      icon: <MapPin className="w-6 h-6 text-primary" />,
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
    <div className="w-full pt-28">
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold font-serif mb-6 text-foreground"
          >
            {t("contact.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            {t("contact.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* 3 RDV Modes */}
      <section className="py-20 bg-white border-b border-border">
        <div className="container mx-auto px-6 md:px-12 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">{t("contact.rdv_label")}</span>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
              {t("contact.rdv_title")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {rdvModes.map((mode, i) => (
              <motion.div
                key={mode.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="flex flex-col items-start bg-background border border-border p-8 hover:border-primary transition-colors group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  {mode.icon}
                </div>
                <h3 className="text-lg font-bold font-serif text-foreground mb-3">{mode.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed flex-grow mb-6">{mode.desc}</p>
                <a
                  href={mode.href}
                  className="inline-block text-xs uppercase tracking-widest font-bold text-primary border-b border-primary pb-0.5 hover:border-transparent transition-all"
                >
                  {mode.action}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="py-20 bg-white">
        <div className="container mx-auto px-6 md:px-12 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card p-10 border border-border shadow-sm"
            >
              <h3 className="text-2xl font-serif font-bold mb-8 text-foreground">{t("contact.form_title")}</h3>
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
                            <Input placeholder="John Doe" {...field} className="bg-white border-border rounded-none focus-visible:ring-primary" data-testid="input-contact-name" />
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
                            <Input type="email" placeholder="john@example.com" {...field} className="bg-white border-border rounded-none focus-visible:ring-primary" data-testid="input-contact-email" />
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
                            <Input placeholder="+32 4XX XX XX XX" {...field} className="bg-white border-border rounded-none focus-visible:ring-primary" />
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
                            <Input type="date" {...field} className="bg-white border-border rounded-none focus-visible:ring-primary" />
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
                            <Input type="number" min={0} placeholder="120" {...field} className="bg-white border-border rounded-none focus-visible:ring-primary" data-testid="input-guest-count" />
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
                              <SelectTrigger className="bg-white border-border rounded-none focus-visible:ring-primary" data-testid="select-budget">
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
                            <SelectTrigger className="bg-white border-border rounded-none focus-visible:ring-primary" data-testid="select-wedding-type">
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
                                      className="rounded-none border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
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
                            className="min-h-[150px] bg-white border-border rounded-none focus-visible:ring-primary resize-none"
                            {...field}
                            data-testid="textarea-contact-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-14"
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

                  {mutation.isSuccess && (
                    <div className="p-4 bg-green-50 text-green-800 border border-green-200 mt-4 text-center font-medium">
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
              <div className="mb-10">
                <img
                  src={contactImg}
                  alt="Wedding Rings"
                  className="w-full h-[400px] object-cover rounded-sm shadow-md"
                />
              </div>
              <div className="bg-background p-10 border border-border">
                <h3 className="text-2xl font-serif font-bold mb-6 text-foreground">{t("contact.practical_title")}</h3>
                <div className="space-y-5 text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                    <a href={`mailto:${t("footer.email")}`} className="hover:text-primary transition-colors">
                      {t("footer.email")}
                    </a>
                  </div>
                  <div className="flex items-center gap-4">
                    <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                    <a href={`tel:${t("footer.phone")}`} className="hover:text-primary transition-colors">
                      {t("footer.phone")}
                    </a>
                  </div>
                  <div className="flex items-start gap-4">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{t("footer.address")} — {t("contact.address_suffix")}</span>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-border">
                  <p className="text-sm text-muted-foreground">
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
