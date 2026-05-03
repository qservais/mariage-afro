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
  TextField,
  DateField,
  type StepDefinition,
  type StepperLocale,
} from "@/components/forms";

interface CoupleLike {
  partner1Name?: string;
  partner2Name?: string;
  weddingDate?: string | null;
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
}

export default function OnboardingGate({ couple, children }: Props) {
  const { t } = useTranslation();
  const { user } = useUser();
  const qc = useQueryClient();

  const needsOnboarding = couple !== undefined && !couple.onboardedAt;

  const [initialValues, setInitialValues] = useState<CoupleValues>({
    partner1Name: "",
    partner2Name: "",
    weddingDate: "",
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!couple) return;
    setInitialValues({
      partner1Name: couple.partner1Name || user?.firstName || "",
      partner2Name: couple.partner2Name || "",
      weddingDate: couple.weddingDate ? couple.weddingDate.slice(0, 10) : "",
    });
    setReady(true);
  }, [couple, user]);

  const save = useMutation({
    mutationFn: (b: {
      partner1Name: string;
      partner2Name: string;
      weddingDate: string | null;
      onboarded: true;
    }) => clientApi.patch("/api/client/me", b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "me"] }),
  });

  const stepperLabels = useMemo(
    () => t("kit.stepper", { ns: "forms", returnObjects: true }) as StepperLocale,
    [t],
  );

  const steps = useMemo<StepDefinition<CoupleValues>[]>(
    () => [
      {
        id: "welcome",
        title: t("onboarding.steps.s1_title"),
        description: t("onboarding.steps.s1_desc"),
        content: () => (
          <div className="space-y-3">
            <p className="text-sm text-wine-deep font-light leading-relaxed">
              {t("onboarding.welcome_lead")}
            </p>
            <p className="text-sm text-wine-deep/70 font-light leading-relaxed">
              {t("onboarding.welcome_body")}
            </p>
          </div>
        ),
      },
      {
        id: "you",
        title: t("onboarding.steps.s2_title"),
        description: t("onboarding.steps.s2_desc"),
        schema: z.object({
          partner1Name: z
            .string()
            .min(1, t("kit.errors.name_required", { ns: "forms" })),
        }),
        content: ({ values, setValue, errors }) => (
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
        ),
      },
      {
        id: "partner",
        title: t("onboarding.steps.s3_title"),
        description: t("onboarding.steps.s3_desc"),
        optional: true,
        content: ({ values, setValue }) => (
          <TextField
            name="partner2Name"
            label={t("onboarding.partner_name")}
            placeholder={t("onboarding.name_placeholder")}
            value={values.partner2Name}
            onChange={(e) => setValue("partner2Name", e.target.value)}
            data-testid="input-onboarding-partner2"
          />
        ),
      },
      {
        id: "date",
        title: t("onboarding.steps.s4_title"),
        description: t("onboarding.steps.s4_desc"),
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
        id: "summary",
        title: t("onboarding.steps.s5_title"),
        description: t("onboarding.steps.s5_desc"),
        content: ({ values }) => (
          <dl className="bg-cream border border-wine-deep/10 p-5 space-y-3 text-sm">
            <Row label={t("onboarding.summary_partner1")} value={values.partner1Name} />
            <Row
              label={t("onboarding.summary_partner2")}
              value={values.partner2Name || t("onboarding.summary_partner2_empty")}
            />
            <Row label={t("onboarding.summary_date")} value={values.weddingDate} />
          </dl>
        ),
      },
    ],
    [t],
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
                    weddingDate: v.weddingDate,
                    onboarded: true,
                  },
                  { onSuccess: () => resolve(), onError: (err) => reject(err) },
                );
              })
            }
            data-testid="onboarding-stepper"
          />
        </FormShell>
      </div>
    </div>
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
