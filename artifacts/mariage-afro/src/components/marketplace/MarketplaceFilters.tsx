import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";

export interface FiltersValue {
  q: string;
  category: string;
  region: string[];
  priceTier: number[];
  culturalStyle: string[];
  spokenLanguage: string[];
  capacityMin: number | null;
}

export const REGION_VALUES = ["bruxelles", "wallonie", "flandre", "luxembourg"] as const;
export const CULTURAL_VALUES = ["senegalais", "congolais", "ivoirien", "ghaneen", "camerounais", "haitien", "mixte"] as const;
export const LANGUAGE_VALUES = ["fr", "nl", "en", "lingala", "wolof"] as const;

export const PRICE_TIERS = [
  { value: 1, label: "€" },
  { value: 2, label: "€€" },
  { value: 3, label: "€€€" },
  { value: 4, label: "€€€€" },
];

// Backwards-compat exports (old shape) — translated lazily by the component below
export const REGIONS = REGION_VALUES.map((value) => ({ value, label: value }));
export const CULTURAL_STYLES = CULTURAL_VALUES.map((value) => ({ value, label: value }));
export const SPOKEN_LANGUAGES = LANGUAGE_VALUES.map((value) => ({ value, label: value }));

export function readFiltersFromSearch(sp: URLSearchParams): FiltersValue {
  const list = (k: string) => (sp.get(k) || "").split(",").map((s) => s.trim()).filter(Boolean);
  const ints = (k: string) => list(k).map((s) => Number(s)).filter((n) => Number.isFinite(n));
  const cap = Number(sp.get("capacityMin") || "");
  return {
    q: sp.get("q") || "",
    category: sp.get("category") || "",
    region: list("region"),
    priceTier: ints("priceTier"),
    culturalStyle: list("culturalStyle"),
    spokenLanguage: list("spokenLanguage"),
    capacityMin: Number.isFinite(cap) && cap > 0 ? cap : null,
  };
}

export function buildSearchFromFilters(f: FiltersValue): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.category) sp.set("category", f.category);
  if (f.region.length) sp.set("region", f.region.join(","));
  if (f.priceTier.length) sp.set("priceTier", f.priceTier.join(","));
  if (f.culturalStyle.length) sp.set("culturalStyle", f.culturalStyle.join(","));
  if (f.spokenLanguage.length) sp.set("spokenLanguage", f.spokenLanguage.join(","));
  if (f.capacityMin) sp.set("capacityMin", String(f.capacityMin));
  return sp;
}

interface Props {
  showCategory?: boolean;
  categoryOptions?: string[];
  showCapacity?: boolean;
  totalResults?: number;
}

function ChipGroup<T extends string | number>({
  label,
  options,
  values,
  onToggle,
}: {
  label: string;
  options: { value: T; label: string }[];
  values: T[];
  onToggle: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = values.includes(o.value);
          return (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => onToggle(o.value)}
              className={`px-3 py-1.5 text-xs uppercase tracking-[0.15em] border transition-colors ${
                active
                  ? "bg-wine-deep text-cream border-wine-deep"
                  : "bg-cream text-wine-deep border-wine-deep/20 hover:border-wine-deep/60"
              }`}
              data-testid={`filter-${label.toLowerCase()}-${o.value}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MarketplaceFilters({
  showCategory = false,
  categoryOptions = [],
  showCapacity = false,
  totalResults,
}: Props) {
  const { t } = useTranslation();
  const [sp, setSp] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FiltersValue>(() => readFiltersFromSearch(sp));

  useEffect(() => {
    setDraft(readFiltersFromSearch(sp));
  }, [sp]);

  const apply = (next: FiltersValue) => {
    setDraft(next);
    setSp(buildSearchFromFilters(next), { replace: true });
  };

  const toggle = <K extends keyof FiltersValue>(k: K, v: FiltersValue[K] extends Array<infer U> ? U : never) => {
    const cur = draft[k] as unknown as Array<typeof v>;
    const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
    apply({ ...draft, [k]: next as unknown as FiltersValue[K] });
  };

  const clearAll = () => apply({
    q: "", category: "", region: [], priceTier: [], culturalStyle: [], spokenLanguage: [], capacityMin: null,
  });

  const activeCount =
    (draft.q ? 1 : 0) +
    (draft.category ? 1 : 0) +
    draft.region.length +
    draft.priceTier.length +
    draft.culturalStyle.length +
    draft.spokenLanguage.length +
    (draft.capacityMin ? 1 : 0);

  const regionOptions = REGION_VALUES.map((value) => ({ value, label: t(`marketplace.regions.${value}`) }));
  const culturalOptions = CULTURAL_VALUES.map((value) => ({ value, label: t(`marketplace.cultural.${value}`) }));
  const languageOptions = LANGUAGE_VALUES.map((value) => ({ value, label: t(`marketplace.languages.${value}`) }));

  return (
    <div className="bg-cream border-b border-wine-deep/10">
      <div className="container mx-auto px-4 md:px-12 py-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-wine-deep/50" />
          <input
            type="search"
            placeholder={t("marketplace.search_placeholder")}
            value={draft.q}
            onChange={(e) => apply({ ...draft, q: e.target.value })}
            className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-wine-deep/20 focus:outline-none focus:border-wine-deep transition"
            data-testid="filter-search"
          />
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="px-4 py-2.5 text-xs uppercase tracking-[0.2em] border border-wine-deep text-wine-deep hover:bg-wine-deep hover:text-cream transition"
          data-testid="filter-toggle"
        >
          {t("marketplace.filters_button")} {activeCount > 0 && <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] bg-wine-deep text-cream">{activeCount}</span>}
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-wine-deep/70 hover:text-wine-deep underline underline-offset-2 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> {t("marketplace.reset")}
          </button>
        )}

        {typeof totalResults === "number" && (
          <span className="ml-auto text-xs text-wine-deep/60 uppercase tracking-[0.2em]">
            {t(totalResults > 1 ? "marketplace.results_other" : "marketplace.results_one", { count: totalResults })}
          </span>
        )}
      </div>

      {open && (
        <div className="container mx-auto px-4 md:px-12 pb-6 space-y-5 border-t border-wine-deep/10 pt-5 bg-cream/60">
          {showCategory && categoryOptions.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium mb-2">{t("marketplace.category")}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => apply({ ...draft, category: "" })}
                  className={`px-3 py-1.5 text-xs uppercase tracking-[0.15em] border ${
                    !draft.category ? "bg-wine-deep text-cream border-wine-deep" : "bg-cream text-wine-deep border-wine-deep/20 hover:border-wine-deep/60"
                  }`}
                >
                  {t("marketplace.all")}
                </button>
                {categoryOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => apply({ ...draft, category: draft.category === c ? "" : c })}
                    className={`px-3 py-1.5 text-xs uppercase tracking-[0.15em] border ${
                      draft.category === c ? "bg-wine-deep text-cream border-wine-deep" : "bg-cream text-wine-deep border-wine-deep/20 hover:border-wine-deep/60"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ChipGroup label={t("marketplace.region")} options={regionOptions} values={draft.region} onToggle={(v) => toggle("region", v)} />
          <ChipGroup label={t("marketplace.budget")} options={PRICE_TIERS} values={draft.priceTier} onToggle={(v) => toggle("priceTier", v)} />
          <ChipGroup label={t("marketplace.cultural_style")} options={culturalOptions} values={draft.culturalStyle} onToggle={(v) => toggle("culturalStyle", v)} />
          <ChipGroup label={t("marketplace.spoken_language")} options={languageOptions} values={draft.spokenLanguage} onToggle={(v) => toggle("spokenLanguage", v)} />

          {showCapacity && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium mb-2">{t("marketplace.capacity_min")}</p>
              <input
                type="number"
                min={0}
                step={10}
                value={draft.capacityMin ?? ""}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  apply({ ...draft, capacityMin: Number.isFinite(n) && n > 0 ? n : null });
                }}
                placeholder={t("marketplace.capacity_placeholder")}
                className="w-40 px-3 py-2 text-sm bg-white border border-wine-deep/20 focus:outline-none focus:border-wine-deep"
                data-testid="filter-capacity"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
