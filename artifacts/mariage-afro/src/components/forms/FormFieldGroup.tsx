import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FormFieldGroupProps {
  title?: ReactNode;
  description?: ReactNode;
  columns?: 1 | 2 | 3;
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
}

const COL_CLASS: Record<1 | 2 | 3, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
};

/**
 * FormFieldGroup
 * Bloc « titre + description + grille de champs ».
 */
export function FormFieldGroup({
  title,
  description,
  columns = 1,
  children,
  className,
  "data-testid": testId,
}: FormFieldGroupProps) {
  return (
    <section data-testid={testId} className={cn("space-y-4", className)}>
      {(title || description) && (
        <header className="space-y-1">
          {title && (
            <h3 className="font-display text-lg md:text-xl text-wine-deep tracking-tight">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-xs md:text-sm text-wine-deep/65 leading-relaxed font-light">
              {description}
            </p>
          )}
        </header>
      )}
      <div className={cn("grid gap-4 md:gap-5", COL_CLASS[columns])}>{children}</div>
    </section>
  );
}
