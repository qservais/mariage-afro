import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { X, Scale, Send } from "lucide-react";
import { comparator, MAX_COMPARE, type CompareKind } from "@/lib/comparator";
import MultiDevisForm from "@/components/MultiDevisForm";

interface VendorLite {
  id: number;
  name: string;
  category?: string;
  city?: string;
  image?: string | null;
}

export function useComparator(kind: CompareKind): { ids: number[] } {
  const [ids, setIds] = useState<number[]>(() => comparator.get(kind));
  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<{ kind: CompareKind; ids: number[] }>).detail;
      if (!detail || detail.kind !== kind) return;
      setIds(detail.ids);
    };
    window.addEventListener("comparator:changed", onChange);
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.includes(`comparator.vendorIds:${kind}`)) {
        setIds(comparator.get(kind));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("comparator:changed", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [kind]);
  return { ids };
}

export default function ComparatorBar({
  kind = "vendor",
  vendors,
}: {
  kind?: CompareKind;
  vendors: VendorLite[];
}) {
  const { t } = useTranslation();
  const { ids } = useComparator(kind);
  const [multiDevisOpen, setMultiDevisOpen] = useState(false);
  if (ids.length === 0) return null;
  const selected = ids
    .map((id) => vendors.find((v) => v.id === id))
    .filter((v): v is VendorLite => !!v);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-wine-deep text-cream shadow-[0_-8px_24px_rgba(31,20,22,0.25)]">
        <div className="container mx-auto px-4 md:px-8 py-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold font-medium mr-2">
            <Scale className="w-4 h-4" />
            {t("comparator_bar.label", { count: ids.length, max: MAX_COMPARE })}
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[200px] overflow-x-auto">
            {selected.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-2 bg-cream/10 border border-cream/20 px-3 py-1.5 text-xs whitespace-nowrap"
              >
                <span className="font-medium">{v.name}</span>
                <button
                  type="button"
                  onClick={() => comparator.remove(kind, v.id)}
                  aria-label={t("comparator_bar.remove_aria", { name: v.name })}
                  className="hover:text-gold"
                  data-testid={`comparator-remove-${v.id}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {Array.from({ length: MAX_COMPARE - ids.length }).map((_, i) => (
              <div key={`ph-${i}`} className="px-3 py-1.5 text-xs border border-dashed border-cream/20 text-cream/40">
                {t("comparator_bar.add")}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => comparator.clear(kind)}
            className="text-xs text-cream/80 hover:text-cream uppercase tracking-[0.2em] underline-offset-2 hover:underline"
          >
            {t("comparator_bar.clear")}
          </button>
          <button
            type="button"
            onClick={() => setMultiDevisOpen(true)}
            className="px-4 py-2.5 bg-cream/10 border border-cream/30 text-cream text-xs uppercase tracking-[0.2em] font-medium hover:bg-cream hover:text-wine-deep transition flex items-center gap-2"
            data-testid="comparator-multi-devis"
          >
            <Send className="w-3.5 h-3.5" />
            {t("comparator_bar.multi_devis")}
          </button>
          <Link
            to={`/comparateur?ids=${ids.join(",")}`}
            className="px-5 py-2.5 bg-gold text-wine-deep text-xs uppercase tracking-[0.2em] font-bold hover:bg-cream transition"
            data-testid="comparator-go"
          >
            {t("comparator_bar.compare")}
          </Link>
        </div>
      </div>
      <MultiDevisForm
        open={multiDevisOpen}
        onClose={() => setMultiDevisOpen(false)}
        vendors={selected.map((v) => ({ id: v.id, name: v.name }))}
        onSuccess={() => comparator.clear(kind)}
      />
    </>
  );
}
