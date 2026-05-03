import {
  type ReactNode,
  useCallback,
  useId,
  useMemo,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { FormSubmitButton } from "./FormSubmitButton";
import { usePersistedFormState } from "./usePersistedFormState";
import type { StepDefinition, StepperLocale } from "./types";

export interface FormStepperProps<TValues extends Record<string, unknown>> {
  formId: string;
  steps: StepDefinition<TValues>[];
  initialValues: TValues;
  onSubmit: (values: TValues) => Promise<void> | void;
  submitting?: boolean;
  persist?: boolean;
  labels: StepperLocale;
  className?: string;
  "data-testid"?: string;
}

function flattenZodErrors<TValues extends Record<string, unknown>>(
  err: z.ZodError,
): Partial<Record<keyof TValues, string>> {
  const out: Partial<Record<keyof TValues, string>> = {};
  for (const issue of err.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) {
      (out as Record<string, string>)[key] = issue.message;
    }
  }
  return out;
}

/**
 * FormStepper
 * Multi-step accessible avec barre de progression, validation Zod par étape,
 * persistance sessionStorage namespacée par formId.
 */
export function FormStepper<TValues extends Record<string, unknown>>({
  formId,
  steps,
  initialValues,
  onSubmit,
  submitting = false,
  persist = true,
  labels,
  className,
  "data-testid": testId,
}: FormStepperProps<TValues>) {
  const titleId = useId();
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof TValues, string>>>({});

  const { values, setValue, setValues, clear } = usePersistedFormState<TValues>({
    formId: `stepper:${formId}`,
    initial: initialValues,
    enabled: persist,
  });

  const totalSteps = steps.length;
  const isLast = stepIndex === totalSteps - 1;
  const currentStep = steps[stepIndex];

  const validateCurrent = useCallback((): boolean => {
    const schema = currentStep.schema;
    if (!schema) {
      setErrors({});
      return true;
    }
    const result = schema.safeParse(values);
    if (!result.success) {
      setErrors(flattenZodErrors<TValues>(result.error));
      return false;
    }
    setErrors({});
    return true;
  }, [currentStep, values]);

  const goNext = useCallback(() => {
    if (!validateCurrent()) return;
    if (stepIndex < totalSteps - 1) setStepIndex((i) => i + 1);
  }, [validateCurrent, stepIndex, totalSteps]);

  const goPrev = useCallback(() => {
    setErrors({});
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateCurrent()) return;
      if (!isLast) {
        goNext();
        return;
      }
      await onSubmit(values);
      if (persist) clear();
    },
    [validateCurrent, isLast, goNext, onSubmit, values, persist, clear],
  );

  const ctx = useMemo(
    () => ({
      values,
      setValue,
      setValues,
      errors,
      goNext,
      goPrev,
      stepIndex,
      totalSteps,
    }),
    [values, setValue, setValues, errors, goNext, goPrev, stepIndex, totalSteps],
  );

  const progressPct = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <form
      onSubmit={handleSubmit}
      data-testid={testId}
      aria-labelledby={titleId}
      className={cn("space-y-8", className)}
    >
      <div data-testid="stepper-progress">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-wine-deep/65 font-medium mb-3">
          <span id={titleId}>
            {labels.step} {stepIndex + 1} {labels.of} {totalSteps}
            {currentStep.optional && (
              <span className="ml-2 text-wine-deep/40 normal-case tracking-normal text-[10px]">
                ({labels.optional})
              </span>
            )}
          </span>
          <span aria-hidden="true">{Math.round(progressPct)}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalSteps}
          aria-valuenow={stepIndex + 1}
          className="h-1 bg-wine-deep/10 overflow-hidden"
        >
          <div
            className="h-full bg-gold-deep transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <ol className="flex items-center gap-2 mt-4 overflow-x-auto" aria-label={labels.step}>
          {steps.map((s, i) => {
            const active = i === stepIndex;
            const done = i < stepIndex;
            return (
              <li
                key={s.id}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] flex-shrink-0",
                  active
                    ? "text-wine-deep font-semibold"
                    : done
                      ? "text-gold-deep"
                      : "text-wine-deep/35",
                )}
              >
                <span
                  className={cn(
                    "w-5 h-5 flex items-center justify-center text-[10px] border",
                    active
                      ? "border-wine-deep bg-wine-deep text-cream"
                      : done
                        ? "border-gold-deep bg-gold-deep text-cream"
                        : "border-wine-deep/20",
                  )}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="hidden sm:inline">{s.title}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div
        key={currentStep.id}
        role="group"
        aria-labelledby={`${titleId}-${currentStep.id}`}
        className="space-y-5"
      >
        <header>
          <h3
            id={`${titleId}-${currentStep.id}`}
            className="font-display text-xl md:text-2xl text-wine-deep tracking-tight"
          >
            {currentStep.title}
          </h3>
          {currentStep.description && (
            <p className="text-sm text-wine-deep/65 mt-2 font-light leading-relaxed">
              {currentStep.description}
            </p>
          )}
        </header>
        {currentStep.content(ctx)}
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-between gap-3 pt-4 border-t border-wine-deep/10">
        <button
          type="button"
          onClick={goPrev}
          disabled={stepIndex === 0 || submitting}
          data-testid="stepper-prev"
          className={cn(
            "inline-flex items-center justify-center gap-2 h-12 min-h-[44px] px-5",
            "uppercase tracking-[0.18em] text-xs font-medium rounded-none",
            "border border-wine-deep/30 text-wine-deep hover:bg-wine-deep/5 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          {labels.previous}
        </button>

        <FormSubmitButton
          loading={submitting && isLast}
          fullWidth={false}
          data-testid={isLast ? "stepper-submit" : "stepper-next"}
          className="sm:min-w-[180px]"
        >
          {isLast ? labels.submit : labels.next}
          {!isLast && <ChevronRight className="w-4 h-4" aria-hidden="true" />}
        </FormSubmitButton>
      </div>
    </form>
  );
}
