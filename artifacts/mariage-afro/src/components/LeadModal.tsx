import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  MobileFormSheet,
  FormStepper,
  FormFieldGroup,
  TextField,
  PhoneField,
  DateField,
  TextareaField,
  SelectableCardGroup,
  type StepDefinition,
  type StepperLocale,
} from "@/components/forms";

interface LeadModalProps {
  open: boolean;
  onClose: () => void;
}

interface LeadValues extends Record<string, unknown> {
  weddingType: string;
  message: string;
  name: string;
  email: string;
  phone: string;
  date: string;
}

const INITIAL: LeadValues = {
  weddingType: "",
  message: "",
  name: "",
  email: "",
  phone: "",
  date: "",
};

const WEDDING_TYPES = ["afro", "mixte", "traditional", "religious", "other"] as const;

export default function LeadModal({ open, onClose }: LeadModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const stepperLabels = t("kit.stepper", { ns: "forms", returnObjects: true }) as StepperLocale;
  const closeLabel = t("kit.actions.close", { ns: "forms" });

  const submit = useMutation({
    mutationFn: async (values: LeadValues) => {
      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone || null,
        weddingDate: values.date || null,
        guestCount: null,
        budget: null,
        weddingType: values.weddingType || null,
        services: [],
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
      toast({ title: t("contact.form.success") });
    },
    onError: () =>
      toast({ variant: "destructive", title: t("contact.form.error") }),
  });

  const weddingTypeOptions = WEDDING_TYPES.map((k) => ({
    value: k,
    label: t(`contact.form.wedding_type_options.${k}`),
  }));

  const steps: StepDefinition<LeadValues>[] = [
    {
      id: "project",
      title: t("lead_modal.steps.s1_title"),
      description: t("lead_modal.steps.s1_desc"),
      schema: z.object({
        weddingType: z.string().min(1, t("kit.errors.type_required", { ns: "forms" })),
        message: z.string().min(10, t("contact.form.error")),
      }),
      content: ({ values, setValue, errors }) => (
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
            data-testid="lead-modal-cards-type"
          />
          <TextareaField
            name="message"
            label={t("contact.form.message")}
            required
            rows={5}
            value={values.message}
            onChange={(e) => setValue("message", e.target.value)}
            error={errors.message}
            data-testid="lead-modal-message"
          />
        </div>
      ),
    },
    {
      id: "coords",
      title: t("lead_modal.steps.s2_title"),
      description: t("lead_modal.steps.s2_desc"),
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
            data-testid="lead-modal-name"
          />
          <TextField
            name="email"
            type="email"
            label={t("contact.form.email")}
            required
            value={values.email}
            onChange={(e) => setValue("email", e.target.value)}
            error={errors.email}
            data-testid="lead-modal-email"
          />
          <PhoneField
            name="phone"
            label={t("contact.form.phone")}
            placeholder="+32 4XX XX XX XX"
            value={values.phone}
            onChange={(e) => setValue("phone", e.target.value)}
            data-testid="lead-modal-phone"
          />
          <DateField
            name="date"
            label={t("contact.form.date")}
            value={values.date}
            onChange={(e) => setValue("date", e.target.value)}
            data-testid="lead-modal-date"
          />
        </FormFieldGroup>
      ),
    },
  ];

  function handleClose(o: boolean) {
    if (!o) {
      setSubmitted(false);
      submit.reset();
      onClose();
    }
  }

  return (
    <MobileFormSheet
      open={open}
      onOpenChange={handleClose}
      title={t("lead_modal.title")}
      description={t("lead_modal.desc")}
      closeLabel={closeLabel}
      data-testid="lead-modal-sheet"
    >
      {submitted ? (
        <div className="text-center py-8" data-testid="lead-modal-success">
          <CheckCircle2 className="w-14 h-14 text-gold-deep mx-auto mb-4" />
          <p className="text-lg text-wine-deep mb-6">{t("contact.form.success")}</p>
          <button
            type="button"
            onClick={() => handleClose(false)}
            className="bg-wine-deep text-cream px-6 h-12 uppercase tracking-[0.18em] text-xs font-medium rounded-none hover:bg-wine-deep/90"
            data-testid="lead-modal-success-close"
          >
            {closeLabel}
          </button>
        </div>
      ) : (
        <FormStepper
          formId="public-lead"
          steps={steps}
          initialValues={INITIAL}
          onSubmit={(v) => submit.mutateAsync(v).then(() => undefined)}
          submitting={submit.isPending}
          persist
          labels={stepperLabels}
          data-testid="lead-modal-stepper"
        />
      )}
    </MobileFormSheet>
  );
}
