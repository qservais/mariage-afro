import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { X, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { fetchVendorAvailabilityStatus } from "@/components/VendorAvailabilityCalendar";

import { clientApi } from "@/lib/clientApi";
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export type VendorAction = "quote" | "availability" | "booking" | "zoom" | "rdv";

type FormValues = {
  name: string;
  email: string;
  phone?: string;
  weddingDate?: string;
  message: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  vendor: { id: number; name: string };
  action: VendorAction;
}

export default function VendorActionModal({ open, onClose, vendor, action }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const formSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, { message: t("partners.validation.name") }),
        email: z.string().email({ message: t("partners.validation.email") }),
        phone: z.string().optional(),
        weddingDate: z.string().optional(),
        message: z.string().min(10, { message: t("partners.validation.message") }),
      }),
    [t],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", phone: "", weddingDate: "", message: "" },
  });

  const watchedDate = form.watch("weddingDate");
  const [dateStatus, setDateStatus] = useState<"blocked" | "booked" | null>(null);
  const [checkingDate, setCheckingDate] = useState(false);

  useEffect(() => {
    if (!open) {
      setSubmitted(false);
      setDateStatus(null);
      form.reset();
    }
  }, [open, form]);

  useEffect(() => {
    if (!open || !watchedDate || !/^\d{4}-\d{2}-\d{2}$/.test(watchedDate)) {
      setDateStatus(null);
      return;
    }
    let cancelled = false;
    setCheckingDate(true);
    fetchVendorAvailabilityStatus(vendor.id, watchedDate)
      .then((status) => {
        if (!cancelled) setDateStatus(status);
      })
      .finally(() => {
        if (!cancelled) setCheckingDate(false);
      });
    return () => { cancelled = true; };
  }, [watchedDate, vendor.id, open]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      clientApi.post(`/api/marketplace/vendors/${vendor.id}/lead`, {
        requestType: action,
        name: values.name,
        email: values.email,
        phone: values.phone,
        weddingDate: values.weddingDate,
        message: values.message,
      }),
    onSuccess: () => setSubmitted(true),
    onError: () =>
      toast({
        title: t("contact.form.error"),
        variant: "destructive",
      }),
  });

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  const title = t(`partners.actions.${action}.modal_title`);
  const subtitle = t(`partners.actions.${action}.modal_subtitle`, { vendor: vendor.name });
  const cta = t(`partners.actions.${action}.submit`);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-6 py-4 bg-primary text-white">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] opacity-75 mb-1">
                  {vendor.name}
                </p>
                <h2 className="text-xl md:text-2xl font-bold font-serif">{title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("partners.success_close")}
                className="p-1 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitted ? (
              <div className="p-10 text-center">
                <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold font-serif text-foreground mb-2">
                  {t("partners.success_title")}
                </h3>
                <p className="text-muted-foreground mb-8">{t("partners.success_desc")}</p>
                <Button
                  onClick={onClose}
                  className="bg-primary text-white hover:bg-primary/90 rounded-none uppercase tracking-wider h-11 px-8"
                >
                  {t("partners.success_close")}
                </Button>
              </div>
            ) : (
              <div className="p-6 md:p-8">
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{subtitle}</p>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
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
                          {watchedDate && !checkingDate && dateStatus && (
                            <div
                              className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900"
                              data-testid="warning-date-unavailable"
                            >
                              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{t("marketplace.availability.warning_unavailable")}</span>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t(`partners.actions.${action}.message_label`)}</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={5}
                              {...field}
                              placeholder={t(`partners.actions.${action}.message_placeholder`)}
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
                        cta
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
