import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  MobileFormSheet,
  FormStepper,
  FormFieldGroup,
  TextField,
  PhoneField,
  DateField,
  TextareaField,
  type StepDefinition,
  type StepperLocale,
} from "@/components/forms";

interface VendorLite {
  id: number;
  name: string;
}

interface MultiDevisFormProps {
  open: boolean;
  onClose: () => void;
  vendors: VendorLite[];
  onSuccess?: () => void;
}

interface MdValues extends Record<string, unknown> {
  name: string;
  email: string;
  phone: string;
  weddingDate: string;
  message: string;
}

const INITIAL: MdValues = { name: "", email: "", phone: "", weddingDate: "", message: "" };

export default function MultiDevisForm({ open, onClose, vendors, onSuccess }: MultiDevisFormProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const stepperLabels = t("kit.stepper", { ns: "forms", returnObjects: true }) as StepperLocale;
  const closeLabel = t("kit.actions.close", { ns: "forms" });

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  const recipientsBlock = useMemo(
    () => (
      <div className="bg-cream border border-wine-deep/10 p-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-wine-deep/60 mb-2 font-medium">
          {t("multi_devis.recipients_count", { count: vendors.length })}
        </div>
        <div className="flex flex-wrap gap-2">
          {vendors.map((v) => (
            <span
              key={v.id}
              className="inline-block bg-white border border-wine-deep/20 px-3 py-1 text-xs text-wine-deep"
              data-testid={`multi-devis-vendor-${v.id}`}
            >
              {v.name}
            </span>
          ))}
        </div>
      </div>
    ),
    [vendors, t],
  );

  const steps: StepDefinition<MdValues>[] = [
    {
      id: "coords",
      title: t("multi_devis.steps.s1_title"),
      description: t("multi_devis.steps.s1_desc"),
      schema: z.object({
        name: z.string().min(2, t("kit.errors.name_required", { ns: "forms" })),
        email: z.string().email(t("kit.errors.email_invalid", { ns: "forms" })),
      }),
      content: ({ values, setValue, errors }) => (
        <FormFieldGroup columns={2}>
          <TextField
            name="name"
            label={t("multi_devis.name")}
            required
            value={values.name}
            onChange={(e) => setValue("name", e.target.value)}
            error={errors.name}
            data-testid="multi-devis-name"
          />
          <TextField
            name="email"
            type="email"
            label={t("multi_devis.email")}
            required
            value={values.email}
            onChange={(e) => setValue("email", e.target.value)}
            error={errors.email}
            data-testid="multi-devis-email"
          />
          <PhoneField
            name="phone"
            label={t("multi_devis.phone")}
            placeholder="+32 ..."
            value={values.phone}
            onChange={(e) => setValue("phone", e.target.value)}
          />
          <DateField
            name="weddingDate"
            label={t("multi_devis.wedding_date")}
            value={values.weddingDate}
            onChange={(e) => setValue("weddingDate", e.target.value)}
          />
        </FormFieldGroup>
      ),
    },
    {
      id: "project",
      title: t("multi_devis.steps.s2_title"),
      description: t("multi_devis.steps.s2_desc"),
      content: ({ values, setValue }) => (
        <TextareaField
          name="message"
          label={t("multi_devis.message_label")}
          placeholder={t("multi_devis.message_placeholder")}
          rows={6}
          value={values.message}
          onChange={(e) => setValue("message", e.target.value)}
          data-testid="multi-devis-message"
        />
      ),
      optional: true,
    },
    {
      id: "recap",
      title: t("multi_devis.steps.s3_title"),
      description: t("multi_devis.steps.s3_desc"),
      content: ({ values }) => (
        <div className="space-y-5">
          {recipientsBlock}
          <div className="bg-cream border border-wine-deep/10 p-5 space-y-2 text-sm">
            <p>
              <span className="text-[11px] uppercase tracking-[0.18em] text-wine-deep/55 font-medium block">
                {t("multi_devis.name")}
              </span>
              <span className="text-wine-deep">{values.name}</span>
            </p>
            <p>
              <span className="text-[11px] uppercase tracking-[0.18em] text-wine-deep/55 font-medium block">
                {t("multi_devis.email")}
              </span>
              <span className="text-wine-deep">{values.email}</span>
            </p>
            {values.message && (
              <p>
                <span className="text-[11px] uppercase tracking-[0.18em] text-wine-deep/55 font-medium block">
                  {t("multi_devis.message_label")}
                </span>
                <span className="text-wine-deep font-light whitespace-pre-line">
                  {values.message}
                </span>
              </p>
            )}
          </div>
          <p className="text-[11px] text-wine-deep/55 text-center">
            {t("multi_devis.privacy_note")}
          </p>
        </div>
      ),
    },
  ];

  async function onSubmit(values: MdValues) {
    if (vendors.length === 0) {
      toast({ variant: "destructive", title: t("multi_devis.no_vendors") });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads/multi-devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorIds: vendors.map((v) => v.id),
          name: values.name,
          email: values.email,
          phone: values.phone || null,
          weddingDate: values.weddingDate || null,
          message: values.message || null,
          locale: i18n.language,
        }),
      });
      if (!res.ok) throw new Error("Bad status");
      setSubmitted(true);
      toast({ title: t("multi_devis.success_title") });
      onSuccess?.();
    } catch {
      toast({ variant: "destructive", title: t("multi_devis.error") });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MobileFormSheet
      open={open}
      onOpenChange={(o) => (o ? null : handleClose())}
      title={t("multi_devis.title", { count: vendors.length })}
      description={t("multi_devis.desc", { count: vendors.length })}
      closeLabel={closeLabel}
      data-testid="multi-devis-sheet"
    >
      {submitted ? (
        <div className="text-center py-8" data-testid="multi-devis-success">
          <CheckCircle2 className="w-14 h-14 text-gold-deep mx-auto mb-4" />
          <h3 className="font-display text-2xl text-wine-deep mb-2">
            {t("multi_devis.success_title")}
          </h3>
          <p className="text-sm text-wine-deep/70 mb-4">
            {t("multi_devis.success_desc", { count: vendors.length })}
          </p>
          <div className="bg-cream border border-wine-deep/10 p-4 mb-6">
            <div className="flex flex-wrap gap-2 justify-center">
              {vendors.map((v) => (
                <span
                  key={v.id}
                  className="inline-block bg-white border border-wine-deep/20 px-3 py-1 text-xs text-wine-deep"
                >
                  {v.name}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="bg-wine-deep text-cream px-6 h-12 uppercase tracking-[0.18em] text-xs font-medium rounded-none hover:bg-wine-deep/90"
            data-testid="multi-devis-success-close"
          >
            {closeLabel}
          </button>
        </div>
      ) : (
        <FormStepper
          formId="public-multi-devis"
          steps={steps}
          initialValues={INITIAL}
          onSubmit={onSubmit}
          submitting={submitting}
          persist={false}
          labels={{ ...stepperLabels, submit: t("multi_devis.cta", { count: vendors.length }) }}
          data-testid="multi-devis-stepper"
        />
      )}
    </MobileFormSheet>
  );
}
