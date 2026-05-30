import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FormShellProps {
  variant?: "page" | "modal";
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  stickyFooter?: boolean;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  "data-testid"?: string;
}

/**
 * FormShell
 * Wrapper responsive harmonisé pour tout formulaire (page entière ou modale).
 * - Padding mobile/desktop cohérent
 * - Scroll interne sur mobile pour les formulaires longs
 * - Sticky footer optionnel pour le CTA principal
 */
export function FormShell({
  variant = "page",
  eyebrow,
  title,
  description,
  footer,
  stickyFooter = false,
  children,
  className,
  contentClassName,
  "data-testid": testId,
}: FormShellProps) {
  const isModal = variant === "modal";

  return (
    <div
      data-testid={testId}
      className={cn(
        "flex flex-col bg-cream text-wine-deep",
        isModal
          ? "max-h-[90vh] w-full max-w-2xl border border-gold-deep shadow-2xl"
          : "card-editorial",
        className,
      )}
    >
      {(eyebrow || title || description) && (
        <header
          className={cn(
            "border-b border-wine-deep/10",
            isModal ? "px-6 py-5 md:px-8 md:py-6" : "p-8 md:p-10 pb-6",
          )}
        >
          {eyebrow && (
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep font-medium mb-3">
              {eyebrow}
            </p>
          )}
          {title && (
            <h2 className="font-display text-2xl md:text-3xl text-wine-deep leading-tight">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-wine-deep/70 mt-3 leading-relaxed">{description}</p>
          )}
        </header>
      )}

      <div
        className={cn(
          "flex-1 overflow-y-auto",
          isModal ? "px-6 py-6 md:px-8 md:py-8" : "p-8 md:p-10",
          contentClassName,
        )}
      >
        {children}
      </div>

      {footer && (
        <footer
          className={cn(
            "border-t border-wine-deep/10 bg-cream/40 px-6 py-4 md:px-8",
            stickyFooter && "sticky bottom-0",
          )}
        >
          {footer}
        </footer>
      )}
    </div>
  );
}
