import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { useTranslation } from "react-i18next";
import * as z from "zod";
import { Briefcase, Upload } from "lucide-react";
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
  "Coordinateur de mariage",
  "Wedding Designer",
  "Autre",
] as const;

const REGION_KEYS = ["bruxelles", "wallonie", "flandre", "luxembourg"] as const;
const PRICE_KEYS = ["tier_1", "tier_2", "tier_3", "tier_4"] as const;
const SPECIALTY_KEYS = [
  "afro",
  "mixte",
  "traditionnel",
  "religieux",
  "destination",
  "luxe",
  "intime",
  "grand_format",
] as const;

interface VendorValues extends Record<string, unknown> {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
  regions: string[];
  priceRange: string;
  specialties: string[];
  photoPath: string;
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
    regions: [],
    priceRange: "",
    specialties: [],
    photoPath: "",
    website: "",
    description: "",
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!account) return;
    setInitialValues((prev) => ({
      ...prev,
      businessName: account.businessName || "",
      contactName: account.contactName || user?.fullName || "",
      email: account.email || user?.primaryEmailAddress?.emailAddress || "",
      phone: account.phone || "",
      category: account.category || CATEGORY_VALUES[0],
      regions: account.city ? account.city.split(",").map((s) => s.trim()).filter(Boolean) : [],
      website: account.website || "",
      description: account.description || "",
    }));
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
  const regionOptions = REGION_KEYS.map((k) => ({
    value: k,
    label: t(`vendor.onboarding.regions.${k}`),
  }));
  const priceOptions = PRICE_KEYS.map((k) => ({
    value: k,
    label: t(`vendor.onboarding.price_options.${k}`),
  }));
  const specialtyOptions = SPECIALTY_KEYS.map((k) => ({
    value: k,
    label: t(`vendor.onboarding.specialty_options.${k}`),
  }));

  const steps = useMemo<StepDefinition<VendorValues>[]>(
    () => [
      {
        id: "business",
        title: t("vendor.onboarding.steps.s1_title"),
        description: t("vendor.onboarding.steps.s1_desc"),
        schema: z.object({
          businessName: z.string().min(2, t("kit.errors.name_required", { ns: "forms" })),
          contactName: z.string().min(2, t("kit.errors.name_required", { ns: "forms" })),
          email: z.string().email(t("kit.errors.email_invalid", { ns: "forms" })),
        }),
        content: ({ values, setValue, errors }) => (
          <FormFieldGroup columns={2}>
            <TextField
              name="businessName"
              label={t("vendor.onboarding.business_name")}
              required
              value={values.businessName}
              onChange={(e) => setValue("businessName", e.target.value)}
              error={errors.businessName}
              data-testid="input-vendor-business-name"
            />
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
        id: "category",
        title: t("vendor.onboarding.steps.s2_title"),
        description: t("vendor.onboarding.steps.s2_desc"),
        schema: z.object({
          category: z.string().min(1, t("kit.errors.type_required", { ns: "forms" })),
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
        id: "regions",
        title: t("vendor.onboarding.steps.s3_title"),
        description: t("vendor.onboarding.steps.s3_desc"),
        schema: z.object({
          regions: z.array(z.string()).min(1, t("kit.errors.type_required", { ns: "forms" })),
        }),
        content: ({ values, setValue, errors }) => (
          <SelectableCardGroup
            name="regions"
            multiple
            value={values.regions}
            onChange={(v) => setValue("regions", v as string[])}
            options={regionOptions}
            columns={2}
            label={t("vendor.onboarding.regions_label")}
            required
            error={errors.regions as string | undefined}
            data-testid="cards-vendor-regions"
          />
        ),
      },
      {
        id: "price",
        title: t("vendor.onboarding.steps.s4_title"),
        description: t("vendor.onboarding.steps.s4_desc"),
        optional: true,
        content: ({ values, setValue }) => (
          <SelectableCardGroup
            name="priceRange"
            value={values.priceRange || null}
            onChange={(v) => setValue("priceRange", v as string)}
            options={priceOptions}
            columns={2}
            label={t("vendor.onboarding.price_range_label")}
            data-testid="cards-vendor-price"
          />
        ),
      },
      {
        id: "specialties",
        title: t("vendor.onboarding.steps.s5_title"),
        description: t("vendor.onboarding.steps.s5_desc"),
        optional: true,
        content: ({ values, setValue }) => (
          <SelectableCardGroup
            name="specialties"
            multiple
            value={values.specialties}
            onChange={(v) => setValue("specialties", v as string[])}
            options={specialtyOptions}
            columns={2}
            label={t("vendor.onboarding.specialties_label")}
            data-testid="cards-vendor-specialties"
          />
        ),
      },
      {
        id: "about",
        title: t("vendor.onboarding.steps.s6_title"),
        description: t("vendor.onboarding.steps.s6_desc"),
        content: ({ values, setValue }) => (
          <div className="space-y-6">
            <PhotoUploadField
              value={values.photoPath}
              onChange={(p) => setValue("photoPath", p)}
            />
            <TextField
              name="website"
              label={t("vendor.onboarding.website")}
              placeholder="https://"
              value={values.website}
              onChange={(e) => setValue("website", e.target.value)}
              data-testid="input-vendor-website"
            />
            <TextareaField
              name="description"
              label={t("vendor.onboarding.description")}
              rows={5}
              value={values.description}
              onChange={(e) => setValue("description", e.target.value)}
              data-testid="textarea-vendor-description"
            />
            <SummaryBlock values={values} options={{ categoryOptions, regionOptions, priceOptions, specialtyOptions }} />
            <div className="bg-cream border border-gold/30 px-4 py-3 text-xs text-wine-deep/75 font-light leading-relaxed">
              {t("vendor.onboarding.review_notice")}
            </div>
          </div>
        ),
      },
    ],
    [t, categoryOptions, regionOptions, priceOptions, specialtyOptions],
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
                const cityField = v.regions.length > 0
                  ? v.regions
                      .map((r) => t(`vendor.onboarding.regions.${r}`, { defaultValue: r }))
                      .join(", ")
                  : "Belgique";
                const enrichedDescription = [
                  v.description,
                  v.priceRange ? `\n\n${t("vendor.onboarding.summary_price")}: ${t(`vendor.onboarding.price_options.${v.priceRange}`)}` : "",
                  v.specialties.length > 0
                    ? `\n${t("vendor.onboarding.summary_specialties")}: ${v.specialties.map((s) => t(`vendor.onboarding.specialty_options.${s}`)).join(", ")}`
                    : "",
                ].join("");
                save.mutate(
                  {
                    businessName: v.businessName,
                    contactName: v.contactName,
                    email: v.email,
                    phone: v.phone || null,
                    category: v.category,
                    city: cityField,
                    website: v.website || null,
                    description: enrichedDescription,
                    locale,
                    photoPath: v.photoPath || null,
                    regions: v.regions,
                    specialties: v.specialties,
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

function PhotoUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (path: string) => void;
}) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${BASE}/api/storage/uploads/proxy-upload`, {
        method: "POST",
        credentials: "include",
        headers: { "x-content-type": file.type || "image/jpeg" },
        body: file,
      });
      if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
      const { objectPath } = await res.json();
      onChange(objectPath);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3" data-testid="vendor-photo-upload">
      <label className="block text-[11px] uppercase tracking-[0.18em] text-wine-deep/60 font-medium">
        {t("vendor.onboarding.photo_label")}
      </label>
      <div className="flex items-center gap-4">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            className="w-20 h-20 object-cover border border-wine-deep/15"
            data-testid="vendor-photo-preview"
          />
        ) : (
          <div className="w-20 h-20 bg-cream border border-dashed border-wine-deep/20 flex items-center justify-center">
            <Upload className="w-5 h-5 text-wine-deep/40" />
          </div>
        )}
        <label className="inline-flex items-center gap-2 px-4 h-10 border border-wine-deep text-wine-deep cursor-pointer hover:bg-wine-deep hover:text-cream transition-colors uppercase tracking-[0.18em] text-[11px] font-medium">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={pick}
            className="sr-only"
            data-testid="vendor-photo-input"
          />
          {value ? t("vendor.onboarding.photo_change") : t("vendor.onboarding.photo_choose")}
        </label>
        {uploading && (
          <span className="text-xs text-wine-deep/60" data-testid="vendor-photo-uploading">
            {t("vendor.onboarding.photo_uploading")}
          </span>
        )}
        {value && !uploading && (
          <span className="text-xs text-gold-deep" data-testid="vendor-photo-uploaded">
            {t("vendor.onboarding.photo_uploaded")}
          </span>
        )}
      </div>
      {err && <p className="text-xs text-red-700">{err}</p>}
      <p className="text-[11px] text-wine-deep/55 font-light">
        {t("vendor.onboarding.photo_help")} · {t("vendor.onboarding.photo_skip")}
      </p>
    </div>
  );
}

function SummaryBlock({
  values,
  options,
}: {
  values: VendorValues;
  options: {
    categoryOptions: { value: string; label: string }[];
    regionOptions: { value: string; label: string }[];
    priceOptions: { value: string; label: string }[];
    specialtyOptions: { value: string; label: string }[];
  };
}) {
  const { t } = useTranslation();
  const find = (opts: { value: string; label: string }[], v: string) =>
    opts.find((o) => o.value === v)?.label ?? "—";
  const findMulti = (opts: { value: string; label: string }[], arr: string[]) =>
    arr.length === 0 ? "—" : arr.map((v) => find(opts, v)).join(" · ");

  return (
    <dl
      className="bg-cream border border-wine-deep/10 p-5 space-y-2 text-sm"
      data-testid="vendor-onboarding-summary"
    >
      <Row label={t("vendor.onboarding.summary_business")} value={values.businessName} />
      <Row label={t("vendor.onboarding.summary_category")} value={find(options.categoryOptions, values.category)} />
      <Row label={t("vendor.onboarding.summary_regions")} value={findMulti(options.regionOptions, values.regions)} />
      <Row label={t("vendor.onboarding.summary_price")} value={values.priceRange ? find(options.priceOptions, values.priceRange) : "—"} />
      <Row label={t("vendor.onboarding.summary_specialties")} value={findMulti(options.specialtyOptions, values.specialties)} />
    </dl>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] uppercase tracking-[0.18em] text-wine-deep/55 font-medium">
        {label}
      </dt>
      <dd className="text-wine-deep font-light">{value || "—"}</dd>
    </div>
  );
}
