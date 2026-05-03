import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import type { BaseFieldProps } from "../types";

export interface TextFieldProps
  extends BaseFieldProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "size"> {}

const SIZE_CLASS = {
  md: "h-11 text-sm",
  lg: "h-12 text-base",
} as const;

/**
 * TextField — Input harmonisé charte Mariage Afro.
 * - Label empilé, hint, error inline
 * - Touch-friendly (≥44px)
 * - Focus ring gold, border wine-deep/15
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    id,
    name,
    label,
    hint,
    error,
    required,
    disabled,
    size = "md",
    className,
    type = "text",
    "data-testid": testId,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const fieldId = id ?? `${reactId}-${name}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={fieldId}
        className="block text-xs uppercase tracking-[0.18em] font-medium text-wine-deep/85"
      >
        {label}
        {required && <span className="text-gold-deep ml-1" aria-hidden="true">*</span>}
      </label>
      <input
        ref={ref}
        id={fieldId}
        name={name}
        type={type}
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        data-testid={testId}
        className={cn(
          "w-full bg-cream border border-wine-deep/15 px-3 rounded-none",
          "text-wine-deep placeholder:text-wine-deep/35",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:border-gold",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          SIZE_CLASS[size],
          error && "border-red-700 focus-visible:ring-red-700",
        )}
        {...rest}
      />
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
