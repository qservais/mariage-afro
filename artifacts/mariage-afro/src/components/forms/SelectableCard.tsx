import {
  type ReactNode,
  createContext,
  useContext,
  useId,
  useMemo,
  useCallback,
} from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectableCardOption<TValue extends string = string> {
  value: TValue;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
}

interface GroupCtxValue<TValue extends string = string> {
  name: string;
  selectedValues: TValue[];
  multiple: boolean;
  onToggle: (value: TValue) => void;
  groupId: string;
}

const GroupCtx = createContext<GroupCtxValue<string> | null>(null);

export interface SelectableCardGroupProps<TValue extends string = string> {
  name: string;
  value: TValue | TValue[] | null;
  onChange: (value: TValue | TValue[]) => void;
  multiple?: boolean;
  options?: SelectableCardOption<TValue>[];
  columns?: 1 | 2 | 3;
  label?: ReactNode;
  description?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  children?: ReactNode;
  "data-testid"?: string;
}

const COL_CLASS: Record<1 | 2 | 3, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
};

/**
 * SelectableCardGroup
 * Group sélectionnable single (radiogroup) ou multi (group of checkboxes).
 * Render via `options` prop OR composition with `<SelectableCard>` children.
 */
export function SelectableCardGroup<TValue extends string = string>({
  name,
  value,
  onChange,
  multiple = false,
  options,
  columns = 2,
  label,
  description,
  error,
  required,
  className,
  children,
  "data-testid": testId,
}: SelectableCardGroupProps<TValue>) {
  const groupId = useId();
  const selectedValues = useMemo<TValue[]>(() => {
    if (value === null || value === undefined) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  const onToggle = useCallback(
    (next: TValue) => {
      if (multiple) {
        const set = new Set<TValue>(selectedValues);
        if (set.has(next)) set.delete(next);
        else set.add(next);
        onChange(Array.from(set));
      } else {
        onChange(next);
      }
    },
    [multiple, onChange, selectedValues],
  );

  const ctxValue = useMemo<GroupCtxValue<string>>(
    () => ({
      name,
      selectedValues: selectedValues as string[],
      multiple,
      onToggle: (v: string) => onToggle(v as TValue),
      groupId,
    }),
    [name, selectedValues, multiple, onToggle, groupId],
  );

  const errorId = error ? `${groupId}-error` : undefined;
  const descId = description ? `${groupId}-desc` : undefined;

  return (
    <fieldset
      data-testid={testId}
      className={cn("space-y-3", className)}
      aria-describedby={[descId, errorId].filter(Boolean).join(" ") || undefined}
      aria-invalid={error ? true : undefined}
    >
      {label && (
        <legend className="block text-xs uppercase tracking-[0.18em] font-medium text-wine-deep/85">
          {label}
          {required && <span className="text-gold-deep ml-1" aria-hidden="true">*</span>}
        </legend>
      )}
      {description && (
        <p id={descId} className="text-xs text-wine-deep/60 font-light leading-relaxed -mt-1">
          {description}
        </p>
      )}

      <div
        role={multiple ? "group" : "radiogroup"}
        aria-required={required || undefined}
        className={cn("grid gap-3 md:gap-4", COL_CLASS[columns])}
      >
        <GroupCtx.Provider value={ctxValue}>
          {options
            ? options.map((opt) => (
                <SelectableCard
                  key={String(opt.value)}
                  value={opt.value}
                  label={opt.label}
                  description={opt.description}
                  icon={opt.icon}
                  badge={opt.badge}
                  disabled={opt.disabled}
                />
              ))
            : children}
        </GroupCtx.Provider>
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-700 font-medium">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export interface SelectableCardProps<TValue extends string = string> {
  value: TValue;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * SelectableCard
 * Card sélectionnable utilisée à l'intérieur d'un SelectableCardGroup.
 * Accessible clavier (Enter / Space), focus visible gold, état hover/selected.
 */
export function SelectableCard<TValue extends string = string>({
  value,
  label,
  description,
  icon,
  badge,
  disabled = false,
  className,
}: SelectableCardProps<TValue>) {
  const ctx = useContext(GroupCtx) as GroupCtxValue<TValue> | null;
  if (!ctx) {
    throw new Error("<SelectableCard> must be used inside <SelectableCardGroup>");
  }

  const selected = ctx.selectedValues.includes(value);
  const inputId = `${ctx.groupId}-${String(value)}`;

  return (
    <label
      htmlFor={inputId}
      data-testid={`selectable-card-${String(value)}`}
      data-selected={selected || undefined}
      className={cn(
        "group relative flex flex-col gap-2 cursor-pointer p-4 md:p-5",
        "border bg-cream transition-colors min-h-[88px]",
        "focus-within:ring-2 focus-within:ring-gold focus-within:ring-offset-2 focus-within:ring-offset-cream",
        selected
          ? "border-wine-deep border-2 bg-cream/60"
          : "border-wine-deep/15 hover:border-wine-deep/40 hover:bg-cream/30",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className,
      )}
    >
      <input
        id={inputId}
        type={ctx.multiple ? "checkbox" : "radio"}
        name={ctx.name}
        value={value}
        checked={selected}
        disabled={disabled}
        onChange={() => ctx.onToggle(value)}
        className="sr-only"
      />

      <div className="flex items-start gap-3">
        {icon && (
          <span
            className={cn(
              "flex-shrink-0 w-9 h-9 flex items-center justify-center border transition-colors",
              selected
                ? "border-wine-deep bg-wine-deep text-cream"
                : "border-wine-deep/25 text-gold-deep group-hover:border-wine-deep/50",
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="block font-display text-base md:text-lg text-wine-deep leading-tight">
              {label}
            </span>
            {badge && (
              <span className="text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 bg-gold-deep/10 text-gold-deep border border-gold-deep/30 font-medium">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs md:text-sm text-wine-deep/65 mt-1 leading-relaxed font-light">
              {description}
            </p>
          )}
        </div>
        <span
          className={cn(
            "flex-shrink-0 w-5 h-5 border flex items-center justify-center transition-colors",
            ctx.multiple ? "" : "rounded-full",
            selected
              ? "border-wine-deep bg-wine-deep text-cream"
              : "border-wine-deep/30 bg-cream",
          )}
          aria-hidden="true"
        >
          {selected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
        </span>
      </div>
    </label>
  );
}
