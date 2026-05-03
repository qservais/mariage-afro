import type { ReactNode } from "react";
import type { z } from "zod";

export type FieldSize = "md" | "lg";

export interface BaseFieldProps {
  id?: string;
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  size?: FieldSize;
  className?: string;
  "data-testid"?: string;
}

export interface StepDefinition<TValues extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  schema?: z.ZodType<Partial<TValues>>;
  content: (ctx: StepContentContext<TValues>) => ReactNode;
  optional?: boolean;
}

export interface StepContentContext<TValues extends Record<string, unknown> = Record<string, unknown>> {
  values: TValues;
  setValue: <K extends keyof TValues>(name: K, value: TValues[K]) => void;
  setValues: (patch: Partial<TValues>) => void;
  errors: Partial<Record<keyof TValues, string>>;
  goNext: () => void;
  goPrev: () => void;
  stepIndex: number;
  totalSteps: number;
}

export type StepperLocale = {
  next: string;
  previous: string;
  submit: string;
  step: string;
  of: string;
  optional: string;
};
