import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { useTranslation } from "react-i18next";
import * as z from "zod";
import { Briefcase } from "lucide-react";
import { vendorApi } from "@/lib/vendorApi";
import {
  FormShell,
  FormStepper,
  FormFieldGroup,
  TextField,
  PhoneField,
  TextareaField,
  SelectableCardGroup,
  type StepDefinition,
  type StepperLocale,
} from "@/components/forms";

interface AccountLike {
  businessName?: string;
  contactName?: string;
  email?: string;
  phone?: string | null;
  category?: string;
  city?: string;
  website?: string | null;
  description?: string;
  onboardedAt?: string | null;
}

interface Props {
  account: AccountLike | undefined;
  children: React.ReactNode;
}

const CATEGORY_VALUES = [
  "Photographie",
  "Vidéo",
  "DJ & Animation",
  "Décoration",
  "Traiteur",
  "Coiffure & Maquillage",
  "Robe de mariée",
  "Transport",
  "Invitations",
  "Lieu de réception",
  "Autre",
] as const;

interface VendorValues extends Record<string, unknown> {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
  city: string;
  website: string;
  description: string;
}

export default function VendorOnboardingGate({ account, children }: Props) {
  const { user } = useUser();
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();

  const needsOnboarding = account !== undefined && !account.onboardedAt;

  const [initialValues, setInitialValues] = useState<VendorValues>({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    category: CATEGORY_VALUES[0],
    city: "",
    website: "",
    description: "",
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!account) return;
    setInitialValues({
      businessName: account.businessName || "",
      contactName: account.contactName || user?.fullName || "",
      email: account.email || user?.primaryEmailAddress?.emailAddress || "",
      phone: account.phone || "",
      category: account.category || CATEGORY_VALUES[0],
      city: account.city || "",
      website: account.website || "",
      description: account.description || "",
    });
    setReady(true);
  }, [account, user]);

  const save = useMutation({
    mutationFn: (b: Record<string, unknown>) =>
      vendorApi.post("/api/vendor/onboarding", b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor", "me"] }),
  });

  const stepperLabels = useMemo(
    () => t("kit.stepper", { ns: "forms", returnObjects: true }) as StepperLocale,
    [t],
  );

  const categoryOptions = CATEGORY_VALUES.map((v) => ({
    value: v,
    label: t(`vendor.onboarding.categories.${v}`, { defaultValue: v }),
  }));

  const steps = useMemo<StepDefinition<VendorValues>[]>(
    () => [
      {
        id: "business",
        title: t("vendor.onboarding.steps.s1_title"),
        description: t("vendor.onboarding.steps.s1_desc"),
        schema: z.object({
          businessName: z
            .string()
            .min(2, t("kit.errors.name_required", { ns: "forms" })),
        }),
        content: ({ values, setValue, errors }) => (
          <TextField
            name="businessName"
            label={t("vendor.onboarding.business_name")}
            required
            value={values.businessName}
            onChange={(e) => setValue("businessName", e.target.value)}
            error={errors.businessName}
            data-testid="input-vendor-business-name"
          />
        ),
      },
      {
        id: "contact",
        title: t("vendor.onboarding.steps.s2_title"),
        description: t("vendor.onboarding.steps.s2_desc"),
        schema: z.object({
          contactName: z
            .string()
            .min(2, t("kit.errors.name_required", { ns: "forms" })),
          email: z.string().email(t("kit.errors.email_invalid", { ns: "forms" })),
        }),
        content: ({ values, setValue, errors }) => (
          <FormFieldGroup columns={2}>
            <TextField
              name="contactName"
              label={t("vendor.onboarding.contact_name")}
              required
              value={values.contactName}
              onChange={(e) => setValue("contactName", e.target.value)}
              error={errors.contactName}
              data-testid="input-vendor-contact-name"
            />
            <TextField
              name="email"
              type="email"
              label={t("vendor.onboarding.email")}
              required
              value={values.email}
              onChange={(e) => setValue("email", e.target.value)}
              error={errors.email}
              data-testid="input-vendor-email"
            />
          </FormFieldGroup>
        ),
      },
      {
        id: "category",
        title: t("vendor.onboarding.steps.s3_title"),
        description: t("vendor.onboarding.steps.s3_desc"),
        schema: z.object({
          category: z
            .string()
            .min(1, t("kit.errors.type_required", { ns: "forms" })),
        }),
        content: ({ values, setValue, errors }) => (
          <SelectableCardGroup
            name="category"
            value={values.category || null}
            onChange={(v) => setValue("category", v as string)}
            options={categoryOptions}
            columns={2}
            label={t("vendor.onboarding.category")}
            required
            error={errors.category}
            data-testid="cards-vendor-category"
          />
        ),
      },
      {
        id: "location",
        title: t("vendor.onboarding.steps.s4_title"),
        description: t("vendor.onboarding.steps.s4_desc"),
        schema: z.object({
          city: z.string().min(2, t("kit.errors.name_required", { ns: "forms" })),
        }),
        content: ({ values, setValue, errors }) => (
          <FormFieldGroup columns={2}>
            <TextField
              name="city"
              label={t("vendor.onboarding.city")}
              required
              value={values.city}
              onChange={(e) => setValue("city", e.target.value)}
              error={errors.city}
              data-testid="input-vendor-city"
            />
            <PhoneField
              name="phone"
              label={t("vendor.onboarding.phone")}
              value={values.phone}
              onChange={(e) => setValue("phone", e.target.value)}
              data-testid="input-vendor-phone"
            />
          </FormFieldGroup>
        ),
      },
      {
        id: "online",
        title: t("vendor.onboarding.steps.s5_title"),
        description: t("vendor.onboarding.steps.s5_desc"),
        optional: true,
        content: ({ values, setValue }) => (
          <TextField
            name="website"
            label={t("vendor.onboarding.website")}
            placeholder="https://"
            value={values.website}
            onChange={(e) => setValue("website", e.target.value)}
            data-testid="input-vendor-website"
          />
        ),
      },
      {
        id: "about",
        title: t("vendor.onboarding.steps.s6_title"),
        description: t("vendor.onboarding.steps.s6_desc"),
        content: ({ values, setValue }) => (
          <div className="space-y-5">
            <TextareaField
              name="description"
              label={t("vendor.onboarding.description")}
              rows={6}
              value={values.description}
              onChange={(e) => setValue("description", e.target.value)}
              data-testid="textarea-vendor-description"
            />
            <div className="bg-cream border border-gold/30 px-4 py-3 text-xs text-wine-deep/75 font-light leading-relaxed">
              {t("vendor.onboarding.review_notice")}
            </div>
          </div>
        ),
      },
    ],
    [t, categoryOptions],
  );

  if (!needsOnboarding) return <>{children}</>;
  if (!ready) return null;

  const locale = (i18n.language?.slice(0, 2) ?? "fr") as "fr" | "nl" | "en";

  return (
    <div className="fixed inset-0 z-50 bg-wine-deep/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-8">
        <FormShell
          variant="modal"
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-gold-deep" />{" "}
              {t("vendor.onboarding.eyebrow")}
            </span>
          }
          title={t("vendor.onboarding.title")}
          description={t("vendor.onboarding.subtitle")}
          data-testid="vendor-onboarding-shell"
        >
          <FormStepper
            formId="vendor-onboarding"
            steps={steps}
            initialValues={initialValues}
            submitting={save.isPending}
            labels={{
              ...stepperLabels,
              submit: save.isPending
                ? t("vendor.onboarding.saving")
                : t("vendor.onboarding.submit"),
            }}
            onSubmit={(v) =>
              new Promise<void>((resolve, reject) => {
                save.mutate(
                  {
                    businessName: v.businessName,
                    contactName: v.contactName,
                    email: v.email,
                    phone: v.phone || null,
                    category: v.category,
                    city: v.city,
                    website: v.website || null,
                    description: v.description,
                    locale,
                  },
                  { onSuccess: () => resolve(), onError: (err) => reject(err) },
                );
              })
            }
            data-testid="vendor-onboarding-stepper"
          />
          {save.isError && (
            <p
              className="text-sm text-red-700 mt-4"
              data-testid="text-onboarding-error"
            >
              {(save.error as Error).message}
            </p>
          )}
        </FormShell>
      </div>
    </div>
  );
}
