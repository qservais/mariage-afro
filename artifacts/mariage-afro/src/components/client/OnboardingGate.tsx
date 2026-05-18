import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { useTranslation } from "react-i18next";
import * as z from "zod";
import { Heart } from "lucide-react";
import { clientApi } from "@/lib/clientApi";
import {
  FormShell,
  FormStepper,
  FormFieldGroup,
  TextField,
  DateField,
  SelectableCardGroup,
  type StepDefinition,
  type StepperLocale,
} from "@/components/forms";

interface CoupleLike {
  partner1Name?: string;
  partner2Name?: string;
  weddingDate?: string | null;
  budget?: number | null;
  onboardedAt?: string | null;
}

interface Props {
  couple: CoupleLike | undefined;
  children: React.ReactNode;
}

interface CoupleValues extends Record<string, unknown> {
  partner1Name: string;
  partner2Name: string;
  weddingDate: string;
  weddingType: string;
  ambiance: string;
  stage: string;
  budgetTier: string;
}

const WEDDING_TYPE_KEYS = ["afro", "mixte", "traditional", "religious", "laique", "civil", "other"] as const;
const AMBIANCE_KEYS = ["chic_intime", "grand_celebration", "traditionnel", "moderne_mixte", "non_decide"] as const;
const STAGE_KEYS = ["tres_debut", "en_cours", "finalisation"] as const;
const BUDGET_KEYS = ["under_15k", "15k_30k", "30k_50k", "over_50k", "undecided"] as const;

const BUDGET_TO_NUMBER: Record<string, number | null> = {
  under_15k: 12000,
  "15k_30k": 22000,
  "30k_50k": 40000,
  over_50k: 60000,
  undecided: null,
};

export default function OnboardingGate({ couple, children }: Props) {
  const { t } = useTranslation();
  const { user } = useUser();
  const qc = useQueryClient();

  const needsOnboarding = couple !== undefined && !couple.onboardedAt;

  const [initialValues, setInitialValues] = useState<CoupleValues>({
    partner1Name: "",
    partner2Name: "",
    weddingDate: "",
    weddingType: "",
    ambiance: "",
    stage: "",
    budgetTier: "",
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!couple) return;
    setInitialValues((prev) => ({
      ...prev,
      partner1Name: couple.partner1Name || user?.firstName || "",
      partner2Name: couple.partner2Name || "",
      weddingDate: couple.weddingDate ? couple.weddingDate.slice(0, 10) : "",
    }));
    setReady(true);
  }, [couple, user]);

  const save = useMutation({
    mutationFn: (b: {
      partner1Name: string;
      partner2Name: string;
      weddingDate: string | null;
      budget: number | null;
      onboarded: true;
    }) => clientApi.patch("/api/client/me", b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "me"] }),
  });

  const stepperLabels = useMemo(
    () => t("kit.stepper", { ns: "forms", returnObjects: true }) as StepperLocale,
    [t],
  );

  const weddingTypeOptions = WEDDING_TYPE_KEYS.map((k) => ({
    value: k,
    label: t(`contact.form.wedding_type_options.${k}`, { ns: "public" }),
  }));
  const ambianceOptions = AMBIANCE_KEYS.map((k) => ({
    value: k,
    label: t(`onboarding.ambiance_options.${k}`),
  }));
  const stageOptions = STAGE_KEYS.map((k) => ({
    value: k,
    label: t(`onboarding.stage_options.${k}`),
  }));
  const budgetOptions = BUDGET_KEYS.map((k) => ({
    value: k,
    label: t(`onboarding.budget_options.${k}`),
  }));

  const steps = useMemo<StepDefinition<CoupleValues>[]>(
    () => [
      {
        id: "names",
        title: t("onboarding.steps.s1_title"),
        description: t("onboarding.steps.s1_desc"),
        schema: z.object({
          partner1Name: z
            .string()
            .min(1, t("kit.errors.name_required", { ns: "forms" })),
        }),
        content: ({ values, setValue, errors }) => (
          <FormFieldGroup columns={2}>
            <TextField
              name="partner1Name"
              label={t("onboarding.your_name")}
              required
              placeholder={t("onboarding.name_placeholder")}
              value={values.partner1Name}
              onChange={(e) => setValue("partner1Name", e.target.value)}
              error={errors.partner1Name}
              data-testid="input-onboarding-partner1"
            />
            <TextField
              name="partner2Name"
              label={t("onboarding.partner_name")}
              placeholder={t("onboarding.name_placeholder")}
              value={values.partner2Name}
              onChange={(e) => setValue("partner2Name", e.target.value)}
              data-testid="input-onboarding-partner2"
            />
          </FormFieldGroup>
        ),
      },
      {
        id: "date",
        title: t("onboarding.steps.s2_title"),
        description: t("onboarding.steps.s2_desc"),
        schema: z.object({
          weddingDate: z.string().min(1, t("onboarding.date_help")),
        }),
        content: ({ values, setValue, errors }) => (
          <DateField
            name="weddingDate"
            label={t("onboarding.wedding_date")}
            required
            hint={t("onboarding.date_help")}
            value={values.weddingDate}
            onChange={(e) => setValue("weddingDate", e.target.value)}
            error={errors.weddingDate}
            data-testid="input-onboarding-date"
          />
        ),
      },
      {
        id: "type",
        title: t("onboarding.steps.s3_title"),
        description: t("onboarding.steps.s3_desc"),
        optional: true,
        content: ({ values, setValue }) => (
          <div className="space-y-6">
            <SelectableCardGroup
              name="weddingType"
              value={values.weddingType || null}
              onChange={(v) => setValue("weddingType", v as string)}
              options={weddingTypeOptions}
              columns={2}
              label={t("onboarding.wedding_type_label")}
              data-testid="cards-onboarding-type"
            />
            <SelectableCardGroup
              name="ambiance"
              value={values.ambiance || null}
              onChange={(v) => setValue("ambiance", v as string)}
              options={ambianceOptions}
              columns={2}
              label={t("onboarding.ambiance_label")}
              data-testid="cards-onboarding-ambiance"
            />
          </div>
        ),
      },
      {
        id: "stage",
        title: t("onboarding.steps.s4_title"),
        description: t("onboarding.steps.s4_desc"),
        optional: true,
        content: ({ values, setValue }) => (
          <SelectableCardGroup
            name="stage"
            value={values.stage || null}
            onChange={(v) => setValue("stage", v as string)}
            options={stageOptions}
            columns={1}
            label={t("onboarding.stage_label")}
            data-testid="cards-onboarding-stage"
          />
        ),
      },
      {
        id: "budget",
        title: t("onboarding.steps.s5_title"),
        description: t("onboarding.steps.s5_desc"),
        optional: true,
        content: ({ values, setValue }) => (
          <SelectableCardGroup
            name="budgetTier"
            value={values.budgetTier || null}
            onChange={(v) => setValue("budgetTier", v as string)}
            options={budgetOptions}
            columns={2}
            label={t("onboarding.budget_label")}
            data-testid="cards-onboarding-budget"
          />
        ),
      },
    ],
    [t, weddingTypeOptions, ambianceOptions, stageOptions, budgetOptions],
  );

  if (!needsOnboarding) return <>{children}</>;
  if (!ready) return null;

  return (
    <div className="fixed inset-0 z-50 bg-wine-deep/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-8">
        <FormShell
          variant="modal"
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 fill-gold-deep text-gold-deep" /> Mariage Afro
            </span>
          }
          title={t("onboarding.title")}
          description={t("onboarding.subtitle")}
          data-testid="onboarding-shell"
        >
          <FormStepper
            formId="client-onboarding"
            steps={steps}
            initialValues={initialValues}
            submitting={save.isPending}
            labels={{
              ...stepperLabels,
              submit: save.isPending ? t("onboarding.saving") : t("onboarding.submit"),
            }}
            onSubmit={(v) =>
              new Promise<void>((resolve, reject) => {
                save.mutate(
                  {
                    partner1Name: v.partner1Name,
                    partner2Name: v.partner2Name,
                    weddingDate: v.weddingDate || null,
                    budget: v.budgetTier ? BUDGET_TO_NUMBER[v.budgetTier] ?? null : null,
                    onboarded: true,
                  },
                  { onSuccess: () => resolve(), onError: (err) => reject(err) },
                );
                try {
                  if (v.weddingType || v.ambiance || v.stage) {
                    localStorage.setItem(
                      "couple:preferences",
                      JSON.stringify({
                        weddingType: v.weddingType || null,
                        ambiance: v.ambiance || null,
                        stage: v.stage || null,
                      }),
                    );
                  }
                } catch {}
              })
            }
            data-testid="onboarding-stepper"
          />
        </FormShell>
      </div>
    </div>
  );
}
