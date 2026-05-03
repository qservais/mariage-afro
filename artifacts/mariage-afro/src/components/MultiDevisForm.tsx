import { useCallback, useMemo, useState } from "react";
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
  category?: string;
  imageUrl?: string;
}

interface MultiDevisFormProps {
  open: boolean;
  onClose: () => void;
  vendors: VendorLite[];
  onSuccess?: () => void;
}

interface MdValues extends Record<string, unknown> {
  selectedIds: number[];
  name: string;
  email: string;
  phone: string;
  weddingDate: string;
  message: string;
}

export default function MultiDevisForm({ open, onClose, vendors, onSuccess }: MultiDevisFormProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const initialValues = useMemo<MdValues>(
    () => ({
      selectedIds: vendors.map((v) => v.id),
      name: "",
      email: "",
      phone: "",
      weddingDate: "",
      message: "",
    }),
    [vendors],
  );

  const stepperLabels = t("kit.stepper", { ns: "forms", returnObjects: true }) as StepperLocale;
  const closeLabel = t("kit.actions.close", { ns: "forms" });

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  const VendorPicker = ({
    values,
    setValue,
    errors,
  }: {
    values: MdValues;
    setValue: <K extends keyof MdValues>(name: K, value: MdValues[K]) => void;
    errors: Partial<Record<keyof MdValues, string>>;
  }) => {
    const selected = new Set(values.selectedIds);
    const toggle = (id: number) => {
      const next = new Set(selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setValue("selectedIds", Array.from(next));
    };
    return (
      <div className="space-y-3" data-testid="multi-devis-vendor-list">
        {errors.selectedIds && (
          <p className="text-sm text-red-700" data-testid="multi-devis-selection-error">
            {errors.selectedIds}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {vendors.map((v) => {
            const isOn = selected.has(v.id);
            return (
              <label
                key={v.id}
                data-testid={`multi-devis-vendor-${v.id}`}
                data-state={isOn ? "selected" : "unselected"}
                className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                  isOn
                    ? "border-wine-deep bg-cream"
                    : "border-wine-deep/15 bg-white hover:border-wine-deep/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={() => toggle(v.id)}
                  className="sr-only"
                  data-testid={`multi-devis-vendor-${v.id}-checkbox`}
                />
                {v.imageUrl ? (
                  <img
                    src={v.imageUrl}
                    alt=""
                    className="w-12 h-12 object-cover border border-wine-deep/10"
                  />
                ) : (
                  <span className="w-12 h-12 bg-wine-deep/10 flex items-center justify-center text-[10px] uppercase text-wine-deep/60">
                    {v.name.slice(0, 2)}
                  </span>
                )}
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-wine-deep font-medium truncate">
                    {v.name}
                  </span>
                  {v.category && (
                    <span className="block text-[11px] uppercase tracking-[0.16em] text-wine-deep/55">
                      {v.category}
                    </span>
                  )}
                </span>
                <span className="text-[11px] uppercase tracking-[0.18em] text-gold-deep shrink-0">
                  {isOn ? t("multi_devis.vendor_remove") : t("multi_devis.vendor_keep")}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const steps: StepDefinition<MdValues>[] = [
    {
      id: "vendors",
      title: t("multi_devis.steps.s1_title"),
      description: t("multi_devis.steps.s1_desc"),
      schema: z.object({
        selectedIds: z.array(z.number()).min(1, t("multi_devis.selection_required")),
      }),
      content: ({ values, setValue, errors }) => (
        <VendorPicker values={values} setValue={setValue} errors={errors} />
      ),
    },
    {
      id: "coords",
      title: t("multi_devis.steps.s2_title"),
      description: t("multi_devis.steps.s2_desc"),
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
            data-testid="multi-devis-phone"
          />
          <DateField
            name="weddingDate"
            label={t("multi_devis.wedding_date")}
            value={values.weddingDate}
            onChange={(e) => setValue("weddingDate", e.target.value)}
            data-testid="multi-devis-date"
          />
        </FormFieldGroup>
      ),
    },
    {
      id: "message",
      title: t("multi_devis.steps.s3_title"),
      description: t("multi_devis.steps.s3_desc"),
      content: ({ values, setValue }) => {
        const recipients = vendors.filter((v) => values.selectedIds.includes(v.id));
        return (
          <div className="space-y-5">
            <TextareaField
              name="message"
              label={t("multi_devis.message_label")}
              placeholder={t("multi_devis.message_placeholder")}
              rows={6}
              value={values.message}
              onChange={(e) => setValue("message", e.target.value)}
              data-testid="multi-devis-message"
            />
            <div
              className="bg-cream border border-wine-deep/10 p-4"
              data-testid="multi-devis-recipients-summary"
            >
              <div className="text-[11px] uppercase tracking-[0.18em] text-wine-deep/60 mb-2 font-medium">
                {t("multi_devis.recipients_count", { count: recipients.length })}
              </div>
              <div className="flex flex-wrap gap-2">
                {recipients.map((v) => (
                  <span
                    key={v.id}
                    className="inline-block bg-white border border-wine-deep/20 px-3 py-1 text-xs text-wine-deep"
                  >
                    {v.name}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-wine-deep/55 text-center">
              {t("multi_devis.privacy_note")}
            </p>
          </div>
        );
      },
    },
  ];

  async function onSubmit(values: MdValues) {
    if (values.selectedIds.length === 0) {
      toast({ variant: "destructive", title: t("multi_devis.no_vendors") });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads/multi-devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorIds: values.selectedIds,
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
          <p className="text-sm text-wine-deep/70 mb-6">
            {t("multi_devis.success_desc", { count: vendors.length })}
          </p>
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
        <StickyCounterStepper
          steps={steps}
          initialValues={initialValues}
          onSubmit={onSubmit}
          submitting={submitting}
          labels={{ ...stepperLabels, submit: t("multi_devis.cta", { count: vendors.length }) }}
        />
      )}
    </MobileFormSheet>
  );
}

/** Wrapper that observes selectedIds via FormStepper.onValuesChange and renders sticky footer count. */
function StickyCounterStepper({
  steps,
  initialValues,
  onSubmit,
  submitting,
  labels,
}: {
  steps: StepDefinition<MdValues>[];
  initialValues: MdValues;
  onSubmit: (v: MdValues) => Promise<void> | void;
  submitting: boolean;
  labels: StepperLocale & { submit: string };
}) {
  const { t } = useTranslation();
  const [count, setCount] = useState(initialValues.selectedIds.length);

  const handleValues = useCallback((v: MdValues) => {
    setCount(v.selectedIds.length);
  }, []);

  return (
    <div className="relative pb-16">
      <FormStepper
        formId="public-multi-devis"
        steps={steps}
        initialValues={initialValues}
        onSubmit={onSubmit}
        submitting={submitting}
        persist={false}
        labels={labels}
        onValuesChange={handleValues}
        data-testid="multi-devis-stepper"
      />
      <div
        className="sticky bottom-0 left-0 right-0 -mb-px bg-cream/95 backdrop-blur border-t border-wine-deep/10 px-4 py-3 text-center text-[11px] uppercase tracking-[0.18em] text-wine-deep font-medium"
        data-testid="multi-devis-sticky-counter"
      >
        {t("multi_devis.selected_count", { count })}
      </div>
    </div>
  );
}
