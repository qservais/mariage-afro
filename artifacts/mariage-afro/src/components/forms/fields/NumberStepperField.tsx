import { useId } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BaseFieldProps } from "../types";

export interface NumberStepperFieldProps extends BaseFieldProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  decrementLabel: string;
  incrementLabel: string;
}

/**
 * NumberStepperField — entrée numérique avec boutons - / + accessibles.
 * Boutons ≥44px touch target.
 */
export function NumberStepperField({
  id,
  name,
  label,
  hint,
  error,
  required,
  disabled,
  className,
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  decrementLabel,
  incrementLabel,
  "data-testid": testId,
}: NumberStepperFieldProps) {
  const reactId = useId();
  const fieldId = id ?? `${reactId}-${name}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const dec = () => onChange(clamp(value - step));
  const inc = () => onChange(clamp(value + step));

  const btnBase =
    "w-11 h-11 flex items-center justify-center border border-wine-deep/20 bg-cream text-wine-deep " +
    "hover:bg-wine-deep hover:text-cream hover:border-wine-deep transition-colors " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream " +
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-cream disabled:hover:text-wine-deep";

  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={fieldId}
        className="block text-xs uppercase tracking-[0.18em] font-medium text-wine-deep/85"
      >
        {label}
        {required && <span className="text-gold-deep ml-1" aria-hidden="true">*</span>}
      </label>
      <div className="inline-flex items-stretch">
        <button
          type="button"
          onClick={dec}
          disabled={disabled || value <= min}
          aria-label={decrementLabel}
          className={btnBase}
          data-testid={testId ? `${testId}-dec` : undefined}
        >
          <Minus className="w-4 h-4" aria-hidden="true" />
        </button>
        <input
          id={fieldId}
          name={name}
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          required={required}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(clamp(n));
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          data-testid={testId}
          className={cn(
            "w-16 h-11 text-center bg-cream border-y border-wine-deep/20 rounded-none",
            "text-base font-medium text-wine-deep tabular-nums",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:relative focus-visible:z-10",
            "disabled:opacity-60",
            "[&::-webkit-inner-spin-button]:appearance-none [appearance:textfield]",
            error && "border-red-700",
          )}
        />
        <button
          type="button"
          onClick={inc}
          disabled={disabled || value >= max}
          aria-label={incrementLabel}
          className={btnBase}
          data-testid={testId ? `${testId}-inc` : undefined}
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      {hint && !error && (
        <p id={hintId} className="text-[11px] text-wine-deep/55 font-light">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-700 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
