import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Phone, Mail, MapPin, CheckCircle2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { Picture } from "@/components/Picture";
import { SEO } from "@/components/SEO";
import {
  FormShell,
  FormStepper,
  FormFieldGroup,
  TextField,
  PhoneField,
  DateField,
  SelectField,
  TextareaField,
  SelectableCardGroup,
  type StepDefinition,
  type StepperLocale,
} from "@/components/forms";

import contactImg from "@assets/MielMagGM-156of162.jpg_1776614313614.jpeg";

interface ContactValues extends Record<string, unknown> {
  name: string;
  email: string;
  phone: string;
  date: string;
  weddingType: string;
  guestCount: string;
  budget: string;
  services: string[];
  message: string;
}

const SERVICE_KEYS = [
  "wedding_planning",
  "decoration",
  "catering",
  "photo_video",
  "dj_music",
  "venue_search",
  "coordination",
  "other",
] as const;

const WEDDING_TYPE_KEYS = ["afro", "mixte", "traditional", "religious", "other"] as const;

export default function Contact() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const prefillName = searchParams.get("name") ?? "";
  const prefillVenue = searchParams.get("venue") ?? "";
  const prefillDate = searchParams.get("date") ?? "";

  const stepperLabels = t("kit.stepper", { ns: "forms", returnObjects: true }) as StepperLocale;

  const rdvModes = [
    {
      icon: <Phone className="w-6 h-6 text-gold" />,
      title: t("contact.rdv_phone_title"),
      desc: t("contact.rdv_phone_desc"),
      action: t("contact.rdv_phone_cta"),
      href: `tel:${t("footer.phone")}`,
    },
    {
      icon: <Mail className="w-6 h-6 text-gold" />,
      title: t("contact.rdv_email_title"),
      desc: t("contact.rdv_email_desc"),
      action: t("contact.rdv_email_cta"),
      href: `mailto:${t("footer.email")}`,
    },
    {
      icon: <MapPin className="w-6 h-6 text-gold" />,
      title: t("contact.rdv_inperson_title"),
      desc: t("contact.rdv_inperson_desc"),
      action: t("contact.rdv_inperson_cta"),
      href: "#contact-form",
    },
  ];

  const initialValues = useMemo<ContactValues>(
    () => ({
      name: prefillName,
      email: "",
      phone: "",
      date: prefillDate,
      weddingType: "",
      guestCount: "",
      budget: "",
      services: [],
      message: prefillVenue ? `${t("contact.summary.message")} : ${prefillVenue}` : "",
    }),
    [prefillName, prefillDate, prefillVenue, t],
  );

  const mutation = useMutation({
    mutationFn: async (data: ContactValues) => {
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
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    },
    onSuccess: () => toast({ title: t("contact.form.success") }),
    onError: () =>
      toast({ variant: "destructive", title: t("contact.form.error") }),
  });

  const weddingTypeOptions = WEDDING_TYPE_KEYS.map((k) => ({
    value: k,
    label: t(`contact.form.wedding_type_options.${k}`),
  }));

  const serviceOptions = SERVICE_KEYS.map((k) => ({
    value: k,
    label: t(`contact.form.services_options.${k}`),
  }));

  const budgetOptions = (["under_10k", "10k_25k", "25k_50k", "over_50k", "undecided"] as const).map(
    (k) => ({ value: k, label: t(`contact.form.budget_options.${k}`) }),
  );

  const steps: StepDefinition<ContactValues>[] = [
    {
      id: "coords",
      title: t("contact.steps.s1_title"),
      description: t("contact.steps.s1_desc"),
      schema: z.object({
        name: z.string().min(2, t("kit.errors.name_required", { ns: "forms" })),
        email: z.string().email(t("kit.errors.email_invalid", { ns: "forms" })),
      }),
      content: ({ values, setValue, errors }) => (
        <FormFieldGroup columns={2}>
          <TextField
            name="name"
            label={t("contact.form.name")}
            required
            value={values.name}
            onChange={(e) => setValue("name", e.target.value)}
            error={errors.name}
            data-testid="input-contact-name"
          />
          <TextField
            name="email"
            type="email"
            label={t("contact.form.email")}
            required
            value={values.email}
            onChange={(e) => setValue("email", e.target.value)}
            error={errors.email}
            data-testid="input-contact-email"
          />
          <PhoneField
            name="phone"
            label={t("contact.form.phone")}
            placeholder="+32 4XX XX XX XX"
            value={values.phone}
            onChange={(e) => setValue("phone", e.target.value)}
          />
          <DateField
            name="date"
            label={t("contact.form.date")}
            value={values.date}
            onChange={(e) => setValue("date", e.target.value)}
          />
        </FormFieldGroup>
      ),
    },
    {
      id: "type",
      title: t("contact.steps.s2_title"),
      description: t("contact.steps.s2_desc"),
      schema: z.object({
        weddingType: z.string().min(1, t("kit.errors.type_required", { ns: "forms" })),
      }),
      content: ({ values, setValue, errors }) => (
        <SelectableCardGroup
          name="weddingType"
          value={values.weddingType || null}
          onChange={(v) => setValue("weddingType", v as string)}
          options={weddingTypeOptions}
          columns={2}
          label={t("contact.form.wedding_type")}
          required
          error={errors.weddingType}
          data-testid="cards-wedding-type"
        />
      ),
    },
    {
      id: "details",
      title: t("contact.steps.s3_title"),
      description: t("contact.steps.s3_desc"),
      content: ({ values, setValue }) => (
        <div className="space-y-6">
          <FormFieldGroup columns={2}>
            <TextField
              name="guestCount"
              type="number"
              min={0}
              label={t("contact.form.guest_count")}
              placeholder="120"
              value={values.guestCount}
              onChange={(e) => setValue("guestCount", e.target.value)}
              data-testid="input-guest-count"
            />
            <SelectField
              name="budget"
              label={t("contact.form.budget")}
              placeholder={t("contact.form.budget_placeholder")}
              options={budgetOptions}
              value={values.budget}
              onChange={(e) => setValue("budget", e.target.value)}
              data-testid="select-budget"
            />
          </FormFieldGroup>
          <SelectableCardGroup
            name="services"
            multiple
            value={values.services}
            onChange={(v) => setValue("services", v as string[])}
            options={serviceOptions}
            columns={2}
            label={t("contact.form.services")}
            data-testid="cards-services"
          />
        </div>
      ),
      optional: true,
    },
    {
      id: "message",
      title: t("contact.steps.s4_title"),
      description: t("contact.steps.s4_desc"),
      schema: z.object({
        message: z.string().min(10, t("contact.form.error")),
      }),
      content: ({ values, setValue, errors }) => (
        <div className="space-y-6">
          <TextareaField
            name="message"
            label={t("contact.form.message")}
            required
            rows={6}
            value={values.message}
            onChange={(e) => setValue("message", e.target.value)}
            error={errors.message}
            data-testid="textarea-contact-message"
          />
          <SummaryCard values={values} />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <SEO
        title="Contact"
        description="Contactez l'équipe Mariage Afro : conseils personnalisés, prise de rendez-vous, partenariats. Réponse sous 48h."
      />

      <section className="relative bg-wine-deep text-cream pt-40 pb-24 md:pt-48 md:pb-32 overflow-hidden">
        <div className="relative z-10 container mx-auto px-6 md:px-12 max-w-5xl text-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="section-eyebrow section-eyebrow-light mb-8"
          >
            {t("contact.subtitle")}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display uppercase font-medium leading-[0.95] tracking-[-0.01em] mt-6 mb-8 text-cream text-5xl md:text-7xl lg:text-[6.5rem]"
          >
            {t("contact.title")}
          </motion.h1>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-cream">
        <div className="container mx-auto px-6 md:px-12 max-w-5xl">
          <div className="text-center mb-20">
            <span className="section-eyebrow mb-6">{t("contact.rdv_label")}</span>
            <h2 className="section-title-editorial text-3xl md:text-5xl mt-4">
              {t("contact.rdv_title")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-wine-deep/10 border border-wine-deep/10">
            {rdvModes.map((mode) => (
              <div
                key={mode.title}
                className="flex flex-col items-start bg-cream p-10 hover:bg-white transition-colors group"
              >
                <div className="w-14 h-14 border border-gold/40 flex items-center justify-center mb-8 text-gold group-hover:bg-gold group-hover:text-cream transition-colors [&>svg]:!text-current">
                  {mode.icon}
                </div>
                <h3 className="font-display uppercase text-xl tracking-tight text-wine-deep mb-3">
                  {mode.title}
                </h3>
                <p className="text-wine-deep/65 text-sm leading-relaxed flex-grow mb-8 font-light">
                  {mode.desc}
                </p>
                <a href={mode.href} className="btn-editorial-ghost text-wine-deep">
                  {mode.action} →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="contact-form"
        className="py-24 md:py-32 bg-white border-t border-wine-deep/10"
      >
        <div className="container mx-auto px-6 md:px-12 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <FormShell
              eyebrow={t("contact.eyebrow_form")}
              title={t("contact.form_title")}
              description={t("contact.subtitle")}
              data-testid="contact-form-shell"
            >
              <FormStepper
                formId="public-contact"
                steps={steps}
                initialValues={initialValues}
                onSubmit={(v) => mutation.mutateAsync(v).then(() => undefined)}
                submitting={mutation.isPending}
                labels={stepperLabels}
                data-testid="contact-stepper"
              />
              {mutation.isSuccess && (
                <div
                  className="mt-6 p-5 bg-cream border border-gold/40 text-center text-wine-deep text-sm uppercase tracking-[0.2em] font-medium flex items-center justify-center gap-2"
                  data-testid="contact-success"
                >
                  <CheckCircle2 className="w-4 h-4 text-gold-deep" />
                  {t("contact.form.success")}
                </div>
              )}
            </FormShell>

            <div className="flex flex-col justify-between">
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
                <span className="section-eyebrow section-eyebrow-light section-eyebrow-left mb-4">
                  {t("contact.eyebrow_contact")}
                </span>
                <h3 className="font-display uppercase text-2xl md:text-3xl tracking-tight text-cream mt-3 mb-8 leading-[1]">
                  {t("contact.practical_title")}
                </h3>
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <Mail className="w-4 h-4 text-gold flex-shrink-0" />
                    <a
                      href={`mailto:${t("footer.email")}`}
                      className="text-cream/85 hover:text-gold transition-colors text-sm font-light"
                    >
                      {t("footer.email")}
                    </a>
                  </div>
                  <div className="flex items-center gap-4">
                    <Phone className="w-4 h-4 text-gold flex-shrink-0" />
                    <a
                      href={`tel:${t("footer.phone")}`}
                      className="text-cream/85 hover:text-gold transition-colors text-sm font-light"
                    >
                      {t("footer.phone")}
                    </a>
                  </div>
                  <div className="flex items-start gap-4">
                    <MapPin className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-cream/85 text-sm font-light">
                      {t("footer.address")} — {t("contact.address_suffix")}
                    </span>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-cream/15">
                  <p className="text-xs uppercase tracking-[0.25em] text-gold mb-2 font-medium">
                    {t("contact.practical_title")}
                  </p>
                  <p className="text-sm text-cream/70 font-light leading-relaxed">
                    {t("contact.practical_hours")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ values }: { values: ContactValues }) {
  const { t } = useTranslation();
  const rows: { label: string; value: string }[] = [
    { label: t("contact.summary.name"), value: values.name },
    { label: t("contact.summary.email"), value: values.email },
    { label: t("contact.summary.phone"), value: values.phone },
    { label: t("contact.summary.date"), value: values.date },
    {
      label: t("contact.summary.wedding_type"),
      value: values.weddingType
        ? t(`contact.form.wedding_type_options.${values.weddingType}`)
        : "",
    },
    { label: t("contact.summary.guest_count"), value: values.guestCount },
    {
      label: t("contact.summary.budget"),
      value: values.budget ? t(`contact.form.budget_options.${values.budget}`) : "",
    },
    {
      label: t("contact.summary.services"),
      value: values.services
        .map((s) => t(`contact.form.services_options.${s}`))
        .join(", "),
    },
  ];
  return (
    <div className="bg-cream border border-wine-deep/10 p-5">
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep font-medium mb-3">
        {t("contact.summary.title")}
      </p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {rows
          .filter((r) => r.value)
          .map((r) => (
            <div key={r.label} className="flex flex-col">
              <dt className="text-[11px] uppercase tracking-[0.18em] text-wine-deep/55 font-medium">
                {r.label}
              </dt>
              <dd className="text-wine-deep font-light">{r.value}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}
