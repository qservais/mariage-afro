import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { X, Loader2 } from "lucide-react";

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
  message: z.string().min(10, { message: "Message requis (min 10 caractères)" }),
});

type FormValues = z.infer<typeof formSchema>;

interface LeadModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LeadModal({ open, onClose }: LeadModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      date: "",
      guestCount: "",
      budget: "",
      weddingType: "",
      services: [],
      message: "",
    },
  });

  useEffect(() => {
    if (!open) {
      setSubmitted(false);
      form.reset();
    }
  }, [open, form]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const submit = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone || null,
        weddingDate: values.date || null,
        guestCount: values.guestCount || null,
        budget: values.budget || null,
        weddingType: values.weddingType || null,
        services: values.services,
        message: values.message,
      };
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: t("contact.success_title"),
        description: t("contact.success_desc"),
      });
    },
    onError: () => {
      toast({
        title: t("contact.error_title"),
        description: t("contact.error_desc"),
        variant: "destructive",
      });
    },
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={t("nav.cta")}
        >
          <motion.div
            className="bg-cream w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between bg-primary text-cream px-6 py-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-80 mb-1">
                  Mariage Afro
                </p>
                <h2 className="text-xl md:text-2xl font-bold">
                  {t("contact.form_title")}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-1 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8">
              {submitted ? (
                <div className="text-center py-8">
                  <h3 className="text-2xl font-bold text-primary mb-3">
                    {t("contact.success_title")}
                  </h3>
                  <p className="text-charcoal/70 mb-6">
                    {t("contact.success_desc")}
                  </p>
                  <Button onClick={onClose} className="bg-primary text-cream rounded-none">
                    {t("contact.close") ?? "Fermer"}
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((v) => submit.mutate(v))}
                    className="space-y-5"
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("contact.name")} *</FormLabel>
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
                            <FormLabel>{t("contact.email")} *</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} className="rounded-none" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("contact.phone")}</FormLabel>
                            <FormControl>
                              <Input {...field} className="rounded-none" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("contact.date")}</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} className="rounded-none" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="guestCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("contact.guest_count")}</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} className="rounded-none" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("contact.budget")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="rounded-none">
                                  <SelectValue placeholder="—" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="<10k">&lt; 10k €</SelectItem>
                                <SelectItem value="10-20k">10–20k €</SelectItem>
                                <SelectItem value="20-40k">20–40k €</SelectItem>
                                <SelectItem value="40-60k">40–60k €</SelectItem>
                                <SelectItem value="60k+">60k €+</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="weddingType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("contact.wedding_type")} *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="rounded-none">
                                  <SelectValue placeholder="—" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="afro">{t("contact.wt_afro")}</SelectItem>
                                <SelectItem value="mixed">{t("contact.wt_mixed")}</SelectItem>
                                <SelectItem value="traditional">{t("contact.wt_traditional")}</SelectItem>
                                <SelectItem value="civil">{t("contact.wt_civil")}</SelectItem>
                                <SelectItem value="religious">{t("contact.wt_religious")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="services"
                      render={() => (
                        <FormItem>
                          <FormLabel>{t("contact.services")}</FormLabel>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                            {SERVICE_OPTIONS.map((s) => (
                              <FormField
                                key={s}
                                control={form.control}
                                name="services"
                                render={({ field }) => (
                                  <FormItem className="flex items-center gap-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(s)}
                                        onCheckedChange={(checked) => {
                                          const next = checked
                                            ? [...(field.value ?? []), s]
                                            : (field.value ?? []).filter((v) => v !== s);
                                          field.onChange(next);
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-xs font-normal cursor-pointer">
                                      {t(`contact.svc_${s}`)}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("contact.message")} *</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} className="rounded-none" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={submit.isPending}
                      className="w-full bg-primary text-cream rounded-none uppercase tracking-widest text-xs font-bold py-6"
                    >
                      {submit.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        t("contact.submit")
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
