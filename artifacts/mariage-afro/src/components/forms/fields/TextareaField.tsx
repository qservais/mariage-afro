import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import type { BaseFieldProps } from "../types";

export interface TextareaFieldProps
  extends BaseFieldProps,
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "size"> {}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField(
    {
      id,
      name,
      label,
      hint,
      error,
      required,
      disabled,
      className,
      "data-testid": testId,
      rows = 4,
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
        <textarea
          ref={ref}
          id={fieldId}
          name={name}
          rows={rows}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          data-testid={testId}
          className={cn(
            "w-full bg-cream border border-wine-deep/15 px-3 py-3 rounded-none resize-none",
            "text-sm text-wine-deep placeholder:text-wine-deep/35",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:border-gold",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            "min-h-[120px]",
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
  },
);
