import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BaseFieldProps } from "../types";

export interface SelectFieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps
  extends BaseFieldProps,
    Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name" | "size"> {
  options: SelectFieldOption[];
  placeholder?: string;
}

/**
 * SelectField — native <select> harmonisé.
 * Choisi volontairement sur Radix Select pour garantir un fonctionnement
 * mobile natif (gros bottom-sheet OS) et l'accessibilité minimale par défaut.
 */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  {
    id,
    name,
    label,
    hint,
    error,
    required,
    disabled,
    options,
    placeholder,
    size = "md",
    className,
    "data-testid": testId,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const fieldId = id ?? `${reactId}-${name}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const heightClass = size === "lg" ? "h-12 text-base" : "h-11 text-sm";

  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={fieldId}
        className="block text-xs uppercase tracking-[0.18em] font-medium text-wine-deep/85"
      >
        {label}
        {required && <span className="text-gold-deep ml-1" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          name={name}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          data-testid={testId}
          className={cn(
            "w-full bg-cream border border-wine-deep/15 pl-3 pr-10 rounded-none appearance-none",
            "text-wine-deep",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:border-gold",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            heightClass,
            error && "border-red-700 focus-visible:ring-red-700",
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wine-deep/50 pointer-events-none"
          aria-hidden="true"
        />
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
});
