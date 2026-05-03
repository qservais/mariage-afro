import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Phone, Mail, MapPin, CheckCircle2, Pencil } from "lucide-react";

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
  TextareaField,
  SelectableCardGroup,
  type StepDefinition,
  type StepperLocale,
  type StepContentContext,
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
const BUDGET_KEYS = ["under_10k", "10k_25k", "25k_50k", "over_50k", "undecided"] as const;

export default function Contact() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const prefillName = searchParams.get("name") ?? "";
  const prefillVenue = searchParams.get("venue") ?? "";
  const prefillDate = searchParams.get("date") ?? "";
  const [stepperKey, setStepperKey] = useState(0);

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

  const budgetOptions = BUDGET_KEYS.map((k) => ({
    value: k,
    label: t(`contact.form.budget_options.${k}`),
  }));

  const steps: StepDefinition<ContactValues>[] = [
    {
      id: "project",
      title: t("contact.steps.s1_title"),
      description: t("contact.steps.s1_desc"),
      schema: z.object({
        weddingType: z.string().min(1, t("kit.errors.type_required", { ns: "forms" })),
      }),
      content: ({ values, setValue, errors }: StepContentContext<ContactValues>) => (
        <div className="space-y-6">
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
          <FormFieldGroup columns={2}>
            <DateField
              name="date"
              label={t("contact.form.date")}
              value={values.date}
              onChange={(e) => setValue("date", e.target.value)}
              data-testid="input-contact-date"
            />
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
          </FormFieldGroup>
        </div>
      ),
    },
    {
      id: "needs",
      title: t("contact.steps.s2_title"),
      description: t("contact.steps.s2_desc"),
      content: ({ values, setValue }: StepContentContext<ContactValues>) => (
        <div className="space-y-8">
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
          <SelectableCardGroup
            name="budget"
            value={values.budget || null}
            onChange={(v) => setValue("budget", v as string)}
            options={budgetOptions}
            columns={2}
            label={t("contact.form.budget")}
            data-testid="cards-budget"
          />
        </div>
      ),
      optional: true,
    },
    {
      id: "coords",
      title: t("contact.steps.s3_title"),
      description: t("contact.steps.s3_desc"),
      schema: z.object({
        name: z.string().min(2, t("kit.errors.name_required", { ns: "forms" })),
        email: z.string().email(t("kit.errors.email_invalid", { ns: "forms" })),
      }),
      content: ({ values, setValue, errors }: StepContentContext<ContactValues>) => (
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
            data-testid="input-contact-phone"
          />
        </FormFieldGroup>
      ),
    },
    {
      id: "message",
      title: t("contact.steps.s4_title"),
      description: t("contact.steps.s4_desc"),
      schema: z.object({
        message: z.string().min(10, t("contact.form.error")),
      }),
      content: ({ values, setValue, errors, goTo }: StepContentContext<ContactValues>) => (
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
          <SummaryCard values={values} goTo={goTo} weddingTypeOptions={weddingTypeOptions} budgetOptions={budgetOptions} serviceOptions={serviceOptions} />
        </div>
      ),
    },
  ];

  return (
    <div className="bg-cream">
      <SEO
        title={t("contact.seo_title", { defaultValue: "Contact" })}
        description={t("contact.subtitle")}
      />

      <section className="relative bg-wine-deep text-cream py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <Picture
            src={contactImg}
            alt=""
            width={1200}
            height={1500}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative container mx-auto px-6 md:px-12 max-w-5xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display text-5xl md:text-7xl tracking-tight mb-6"
          >
            {t("contact.hero_title")}
          </motion.h1>
          <p className="text-cream/80 text-lg max-w-2xl mx-auto font-light leading-relaxed">
            {t("contact.hero_subtitle")}
          </p>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-cream">
        <div className="container mx-auto px-6 md:px-12 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                key={stepperKey}
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
                  <button
                    type="button"
                    className="ml-3 underline text-xs"
                    onClick={() => {
                      mutation.reset();
                      try { sessionStorage.removeItem("form:public-contact"); } catch {}
                      setStepperKey((k) => k + 1);
                    }}
                  >
                    {t("kit.actions.reset", { ns: "forms", defaultValue: "Recommencer" })}
                  </button>
                </div>
              )}
            </FormShell>

            <aside className="bg-cream p-10 self-start">
              <h3 className="font-display uppercase text-xl tracking-tight text-wine-deep mb-6">
                {t("contact.info_title")}
              </h3>
              <div className="space-y-5 text-sm font-light text-wine-deep/80">
                <p className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-gold-deep shrink-0 mt-1" />
                  <a href={`tel:${t("footer.phone")}`} className="hover:text-wine-deep">
                    {t("footer.phone")}
                  </a>
                </p>
                <p className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-gold-deep shrink-0 mt-1" />
                  <a href={`mailto:${t("footer.email")}`} className="hover:text-wine-deep">
                    {t("footer.email")}
                  </a>
                </p>
                <p className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gold-deep shrink-0 mt-1" />
                  <span>{t("contact.info_address")}</span>
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  values,
  goTo,
  weddingTypeOptions,
  budgetOptions,
  serviceOptions,
}: {
  values: ContactValues;
  goTo: (i: number) => void;
  weddingTypeOptions: { value: string; label: string }[];
  budgetOptions: { value: string; label: string }[];
  serviceOptions: { value: string; label: string }[];
}) {
  const { t } = useTranslation();
  const lookup = (opts: { value: string; label: string }[], v: string) =>
    opts.find((o) => o.value === v)?.label || t("contact.summary.no_value");
  const lookupMulti = (opts: { value: string; label: string }[], v: string[]) =>
    v.length === 0
      ? t("contact.summary.no_services")
      : v.map((x) => opts.find((o) => o.value === x)?.label || x).join(" · ");

  return (
    <div
      className="bg-cream border border-wine-deep/10 p-5 space-y-4 text-sm"
      data-testid="contact-summary"
    >
      <div className="flex items-center justify-between border-b border-wine-deep/10 pb-2">
        <h4 className="font-display uppercase text-xs tracking-[0.2em] text-wine-deep">
          {t("contact.summary.title")}
        </h4>
      </div>
      <SummaryRow
        label={t("contact.summary.wedding_type")}
        value={lookup(weddingTypeOptions, values.weddingType)}
        onEdit={() => goTo(0)}
        testId="summary-edit-project"
      />
      <SummaryRow
        label={`${t("contact.summary.date")} · ${t("contact.summary.guest_count")}`}
        value={`${values.date || "—"} · ${values.guestCount || "—"}`}
        onEdit={() => goTo(0)}
        testId="summary-edit-project-details"
      />
      <SummaryRow
        label={`${t("contact.summary.services")} · ${t("contact.summary.budget")}`}
        value={`${lookupMulti(serviceOptions, values.services)} — ${
          values.budget ? lookup(budgetOptions, values.budget) : t("contact.summary.no_value")
        }`}
        onEdit={() => goTo(1)}
        testId="summary-edit-needs"
      />
      <SummaryRow
        label={`${t("contact.summary.name")} · ${t("contact.summary.email")} · ${t("contact.summary.phone")}`}
        value={`${values.name || "—"} · ${values.email || "—"} · ${values.phone || "—"}`}
        onEdit={() => goTo(2)}
        testId="summary-edit-coords"
      />
    </div>
  );
}

function SummaryRow({
  label,
  value,
  onEdit,
  testId,
}: {
  label: string;
  value: string;
  onEdit: () => void;
  testId: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <dt className="text-[10px] uppercase tracking-[0.2em] text-wine-deep/55 font-medium">
          {label}
        </dt>
        <dd className="text-wine-deep font-light truncate">{value}</dd>
      </div>
      <button
        type="button"
        onClick={onEdit}
        data-testid={testId}
        className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-gold-deep hover:text-wine-deep transition-colors shrink-0"
      >
        <Pencil className="w-3 h-3" /> {t("contact.summary.modify")}
      </button>
    </div>
  );
}
