import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Heart, Users, Sparkles, Camera, Music, Cake, Flower2 } from "lucide-react";

import {
  FormShell,
  FormFieldGroup,
  FormStepper,
  FormSubmitButton,
  MobileFormSheet,
  SelectableCardGroup,
  TextField,
  TextareaField,
  SelectField,
  DateField,
  PhoneField,
  NumberStepperField,
  type StepDefinition,
  type StepperLocale,
} from "@/components/forms";

interface DemoValues extends Record<string, unknown> {
  name: string;
  email: string;
  phone: string;
  weddingType: string;
  guests: number;
}

export default function FormsKitDemo() {
  const { t } = useTranslation("forms");

  const [single, setSingle] = useState<string | null>(null);
  const [multi, setMulti] = useState<string[]>([]);
  const [guests, setGuests] = useState(80);
  const [select, setSelect] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitted, setSubmitted] = useState<DemoValues | null>(null);

  const stepperLabels: StepperLocale = {
    next: t("kit.stepper.next"),
    previous: t("kit.stepper.previous"),
    submit: t("kit.stepper.submit"),
    step: t("kit.stepper.step"),
    of: t("kit.stepper.of"),
    optional: t("kit.stepper.optional"),
  };

  const cardOptions = [
    {
      value: "intimate",
      label: t("kit.demo.card_intimate_title"),
      description: t("kit.demo.card_intimate_desc"),
      icon: <Heart className="w-4 h-4" />,
    },
    {
      value: "classic",
      label: t("kit.demo.card_classic_title"),
      description: t("kit.demo.card_classic_desc"),
      icon: <Users className="w-4 h-4" />,
    },
    {
      value: "grand",
      label: t("kit.demo.card_grand_title"),
      description: t("kit.demo.card_grand_desc"),
      icon: <Sparkles className="w-4 h-4" />,
    },
  ];

  const multiOptions = [
    { value: "photo", label: t("kit.demo.service_photo"), icon: <Camera className="w-4 h-4" /> },
    { value: "dj", label: t("kit.demo.service_dj"), icon: <Music className="w-4 h-4" /> },
    { value: "cake", label: t("kit.demo.service_cake"), icon: <Cake className="w-4 h-4" /> },
    { value: "flowers", label: t("kit.demo.service_flowers"), icon: <Flower2 className="w-4 h-4" /> },
  ];

  const steps: StepDefinition<DemoValues>[] = [
    {
      id: "contact",
      title: t("kit.demo.step1_title"),
      description: t("kit.demo.step1_desc"),
      schema: z.object({
        name: z.string().min(2, t("kit.errors.name_required")),
        email: z.string().email(t("kit.errors.email_invalid")),
      }) as z.ZodType<Partial<DemoValues>>,
      content: ({ values, setValue, errors }) => (
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            name="name"
            label={t("kit.demo.name_label")}
            value={values.name}
            onChange={(e) => setValue("name", e.target.value)}
            error={errors.name}
            required
            autoComplete="name"
            data-testid="kit-step-name"
          />
          <TextField
            name="email"
            type="email"
            label={t("kit.demo.email_label")}
            value={values.email}
            onChange={(e) => setValue("email", e.target.value)}
            error={errors.email}
            required
            autoComplete="email"
            data-testid="kit-step-email"
          />
          <PhoneField
            name="phone"
            label={t("kit.demo.phone_label")}
            value={values.phone}
            onChange={(e) => setValue("phone", e.target.value)}
            className="md:col-span-2"
          />
        </div>
      ),
    },
    {
      id: "project",
      title: t("kit.demo.step2_title"),
      description: t("kit.demo.step2_desc"),
      schema: z.object({
        weddingType: z.string().min(1, t("kit.errors.type_required")),
      }) as z.ZodType<Partial<DemoValues>>,
      content: ({ values, setValue, errors }) => (
        <div className="space-y-6">
          <SelectableCardGroup
            name="weddingType"
            value={values.weddingType || null}
            onChange={(v) => setValue("weddingType", v as string)}
            label={t("kit.demo.wedding_type_label")}
            options={cardOptions}
            columns={3}
            required
            error={errors.weddingType}
            data-testid="kit-step-type"
          />
          <NumberStepperField
            name="guests"
            label={t("kit.demo.guests_label")}
            value={values.guests}
            onChange={(n) => setValue("guests", n)}
            min={0}
            max={500}
            step={10}
            decrementLabel={t("kit.actions.decrement")}
            incrementLabel={t("kit.actions.increment")}
            data-testid="kit-step-guests"
          />
        </div>
      ),
    },
    {
      id: "summary",
      title: t("kit.demo.step3_title"),
      description: t("kit.demo.step3_desc"),
      content: ({ values }) => (
        <dl className="grid gap-3 text-sm" data-testid="kit-step-summary">
          <p className="text-xs text-wine-deep/60 uppercase tracking-[0.18em]">
            {t("kit.demo.summary_intro")}
          </p>
          {(["name", "email", "phone", "weddingType", "guests"] as const).map((k) => (
            <div key={k} className="flex justify-between border-b border-wine-deep/10 py-1.5">
              <dt className="text-wine-deep/60">{k}</dt>
              <dd className="text-wine-deep font-medium">{String(values[k] ?? "—")}</dd>
            </div>
          ))}
        </dl>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <main className="max-w-5xl mx-auto px-5 py-12 md:px-8 md:py-16 space-y-12">
        <header className="border-b border-wine-deep/15 pb-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep font-medium mb-2">
            /_dev/forms-kit
          </p>
          <h1 className="font-display text-3xl md:text-5xl text-wine-deep tracking-tight">
            {t("kit.demo.page_title")}
          </h1>
          <p className="text-sm md:text-base text-wine-deep/70 mt-3 max-w-2xl font-light leading-relaxed">
            {t("kit.demo.intro")}
          </p>
        </header>

        {/* FormShell */}
        <FormShell
          eyebrow={t("kit.demo.shell_title")}
          title={t("kit.demo.fields_title")}
          description={t("kit.demo.fields_desc")}
        >
          <FormFieldGroup columns={2}>
            <TextField
              name="demo-text"
              label={t("kit.demo.name_label")}
              placeholder={t("kit.demo.name_placeholder")}
              required
            />
            <TextField
              name="demo-email"
              type="email"
              label={t("kit.demo.email_label")}
              placeholder={t("kit.demo.email_placeholder")}
              hint={t("kit.demo.hint_example")}
            />
            <SelectField
              name="demo-select"
              label={t("kit.demo.wedding_type_label")}
              value={select}
              onChange={(e) => setSelect(e.target.value)}
              placeholder={t("kit.demo.select_placeholder")}
              options={cardOptions.map((c) => ({
                value: c.value,
                label:
                  typeof c.label === "string" ? c.label : String(c.label),
              }))}
            />
            <DateField name="demo-date" label={t("kit.demo.date_label")} />
            <PhoneField name="demo-phone" label={t("kit.demo.phone_label")} />
            <NumberStepperField
              name="demo-guests"
              label={t("kit.demo.guests_label")}
              value={guests}
              onChange={setGuests}
              min={0}
              max={500}
              step={5}
              decrementLabel={t("kit.actions.decrement")}
              incrementLabel={t("kit.actions.increment")}
              data-testid="demo-guests-stepper"
            />
          </FormFieldGroup>
          <div className="mt-6">
            <TextareaField
              name="demo-message"
              label={t("kit.demo.message_label")}
              placeholder="…"
              hint={t("kit.demo.message_hint")}
            />
          </div>
        </FormShell>

        {/* SelectableCard single */}
        <FormShell
          eyebrow={t("kit.demo.cards_title")}
          title={t("kit.demo.cards_title")}
          description={t("kit.demo.cards_desc")}
        >
          <SelectableCardGroup
            name="demo-single"
            value={single}
            onChange={(v) => setSingle(v as string)}
            options={cardOptions}
            columns={3}
            label={t("kit.demo.wedding_type_label")}
          />
        </FormShell>

        {/* SelectableCard multi */}
        <FormShell
          eyebrow={t("kit.demo.cards_multi_title")}
          title={t("kit.demo.cards_multi_title")}
          description={t("kit.demo.cards_multi_desc")}
        >
          <SelectableCardGroup
            name="demo-multi"
            value={multi}
            onChange={(v) => setMulti(v as string[])}
            multiple
            options={multiOptions}
            columns={2}
            label={t("kit.demo.services_label")}
          />
        </FormShell>

        {/* FormStepper */}
        <FormShell
          eyebrow={t("kit.demo.stepper_title")}
          title={t("kit.demo.stepper_title")}
          description={t("kit.demo.stepper_desc")}
        >
          <FormStepper<DemoValues>
            formId="demo-stepper"
            steps={steps}
            initialValues={{
              name: "",
              email: "",
              phone: "",
              weddingType: "",
              guests: 80,
            }}
            onSubmit={(v) => {
              setSubmitted(v);
              return Promise.resolve();
            }}
            labels={stepperLabels}
            data-testid="kit-stepper"
          />
          {submitted && (
            <div
              className="mt-6 p-4 bg-cream border border-gold-deep text-xs text-wine-deep"
              data-testid="kit-submitted"
              role="status"
            >
              <pre className="whitespace-pre-wrap break-all font-mono">
                {JSON.stringify(submitted, null, 2)}
              </pre>
            </div>
          )}
        </FormShell>

        {/* MobileFormSheet */}
        <FormShell
          eyebrow={t("kit.demo.sheet_title")}
          title={t("kit.demo.sheet_title")}
          description={t("kit.demo.sheet_desc")}
        >
          <FormSubmitButton
            type="button"
            fullWidth={false}
            onClick={() => setSheetOpen(true)}
            data-testid="kit-open-sheet"
          >
            {t("kit.demo.open_sheet")}
          </FormSubmitButton>

          <MobileFormSheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            title={t("kit.demo.sheet_title")}
            description={t("kit.demo.sheet_desc")}
            closeLabel={t("kit.actions.close")}
            data-testid="kit-sheet"
            footer={
              <FormSubmitButton type="button" onClick={() => setSheetOpen(false)}>
                {t("kit.actions.close")}
              </FormSubmitButton>
            }
          >
            <p className="text-sm text-wine-deep/70 leading-relaxed">
              {t("kit.demo.sheet_desc")}
            </p>
          </MobileFormSheet>
        </FormShell>
      </main>
    </div>
  );
}
