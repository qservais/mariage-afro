import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FormSubmitButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  loading?: boolean;
  loadingLabel?: ReactNode;
  variant?: "primary" | "ghost" | "wine";
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_CLASS: Record<NonNullable<FormSubmitButtonProps["variant"]>, string> = {
  primary: "btn-editorial-solid",
  wine: "bg-wine-deep text-cream hover:bg-wine-deep/90",
  ghost: "btn-editorial-ghost text-wine-deep border border-wine-deep/30",
};

/**
 * FormSubmitButton
 * Bouton primaire harmonisé : spinner, focus ring gold, taille touch ≥44px.
 */
export function FormSubmitButton({
  loading = false,
  loadingLabel,
  variant = "primary",
  fullWidth = true,
  className,
  disabled,
  type = "submit",
  children,
  ...rest
}: FormSubmitButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-6 h-12 min-h-[44px]",
        "uppercase tracking-[0.18em] text-xs font-medium rounded-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
        "disabled:opacity-60 disabled:cursor-not-allowed transition-colors",
        fullWidth && "w-full",
        VARIANT_CLASS[variant],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>{loadingLabel ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
