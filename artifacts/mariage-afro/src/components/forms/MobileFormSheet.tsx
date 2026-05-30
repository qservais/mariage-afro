import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

export interface MobileFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  closeLabel: string;
  footer?: ReactNode;
  children: ReactNode;
  /**
   * Sur desktop, le composant rend un Dialog centré classique.
   * Sur mobile (<sm), bascule en bottom-sheet plein écran avec header sticky + CTA collant.
   */
  variant?: "auto" | "always-sheet";
  className?: string;
  "data-testid"?: string;
}

/**
 * MobileFormSheet
 * Wrapper Radix Dialog qui devient bottom-sheet plein écran sur mobile,
 * avec header sticky et footer (CTA) collant.
 */
export function MobileFormSheet({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  footer,
  children,
  variant = "auto",
  className,
  "data-testid": testId,
}: MobileFormSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const isAlwaysSheet = variant === "always-sheet";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[100] bg-wine-deep/70 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        />
        <Dialog.Content
          data-testid={testId}
          className={cn(
            "fixed z-[101] bg-cream text-wine-deep flex flex-col",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            // Mobile: bottom-sheet full-height
            isAlwaysSheet
              ? "inset-x-0 bottom-0 top-0 max-h-screen rounded-none border-t border-gold-deep"
              : [
                  "inset-x-0 bottom-0 top-0 max-h-screen rounded-none border-t border-gold-deep",
                  // Desktop: centered modal
                  "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
                  "sm:max-w-2xl sm:w-full sm:max-h-[90vh] sm:border sm:border-gold-deep sm:shadow-2xl",
                ],
            className,
          )}
        >
          <header className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-cream border-b border-wine-deep/10 px-5 py-4 sm:px-6 sm:py-5">
            <div className="min-w-0">
              <Dialog.Title className="font-display text-xl sm:text-2xl text-wine-deep leading-tight truncate">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-xs sm:text-sm text-wine-deep/65 mt-1 font-light">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label={closeLabel}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-wine-deep/60 hover:text-wine-deep hover:bg-cream transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">{children}</div>

          {footer && (
            <footer className="sticky bottom-0 bg-cream border-t border-wine-deep/10 px-5 py-4 sm:px-6">
              {footer}
            </footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
