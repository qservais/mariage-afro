import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, X, Check } from "lucide-react";
import { vendorApi } from "@/lib/vendorApi";
import { CATEGORY_CONFIG } from "@/lib/vendorCategoryConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type PriceUnit = "forfait" | "pers" | "heure" | "nuit" | "table";

interface ServiceItem {
  name: string;
  price: number | null;
  price_unit: PriceUnit;
  price_visible: boolean;
}

type ServiceItemWithId = ServiceItem & { _id: number };

interface VendorProfile {
  id: number;
  category: string;
  services: ServiceItem[];
}

const PRICE_UNITS: PriceUnit[] = ["forfait", "pers", "heure", "nuit", "table"];

export default function VendorServicesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const idRef = useRef(0);

  const { data: vendor } = useQuery<VendorProfile>({
    queryKey: ["vendor", "profile"],
    queryFn: () => vendorApi.get<VendorProfile>("/api/vendor/profile"),
  });

  const [services, setServices] = useState<ServiceItemWithId[]>([]);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setServices(
      (vendor?.services ?? []).map((s) => ({
        ...s,
        _id: ++idRef.current,
        price_unit: (s.price_unit as PriceUnit) ?? "forfait",
      })),
    );
  }, [vendor]);

  const save = useMutation({
    mutationFn: (b: { services: ServiceItem[] }) => vendorApi.patch("/api/vendor/profile", b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor", "profile"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: t("vendor.services.saved") });
    },
    onError: () => toast({ title: t("vendor.services.save_error", { defaultValue: "Impossible d'enregistrer les services" }), variant: "destructive" }),
  });

  const suggestedServices: string[] =
    vendor?.category ? (CATEGORY_CONFIG[vendor.category]?.suggestedServices ?? []) : [];

  const selectedNames = new Set(services.map((s) => s.name));

  const toggleSuggested = (name: string) => {
    if (selectedNames.has(name)) {
      setServices((prev) => prev.filter((s) => s.name !== name));
    } else {
      setServices((prev) => [
        ...prev,
        { name, price: null, price_unit: "forfait", price_visible: false, _id: ++idRef.current },
      ]);
    }
  };

  const addCustomService = () => {
    const trimmed = draft.trim();
    if (!trimmed || selectedNames.has(trimmed)) return;
    setServices((prev) => [
      ...prev,
      { name: trimmed, price: null, price_unit: "forfait", price_visible: false, _id: ++idRef.current },
    ]);
    setDraft("");
  };

  const removeService = (name: string) => {
    setServices((prev) => prev.filter((s) => s.name !== name));
  };

  const updateServiceName = (oldName: string, newName: string) => {
    setServices((prev) =>
      prev.map((s) => (s.name === oldName ? { ...s, name: newName } : s)),
    );
  };

  const updateServicePrice = (name: string, value: string) => {
    const parsed = value === "" ? null : parseFloat(value);
    setServices((prev) =>
      prev.map((s) =>
        s.name === name
          ? { ...s, price: parsed !== null && !isNaN(parsed) ? parsed : null }
          : s,
      ),
    );
  };

  const updateServiceUnit = (name: string, unit: PriceUnit) => {
    setServices((prev) => prev.map((s) => (s.name === name ? { ...s, price_unit: unit } : s)));
  };

  /** Toggle whether this service shows a price publicly. When enabled, price_visible=true
   *  and the price/unit fields become visible. When disabled, price is cleared. */
  const toggleShowPrice = (name: string) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.name !== name) return s;
        if (s.price_visible) {
          return { ...s, price: null, price_visible: false };
        }
        return { ...s, price_visible: true };
      }),
    );
  };

  const customServices = services.filter((s) => !suggestedServices.includes(s.name));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-wine-deep">{t("vendor.services.title")}</h2>
        <p className="text-sm text-neutral-600 mt-1">{t("vendor.services.subtitle")}</p>
      </div>

      <div className="bg-cream border border-neutral-200 p-6 space-y-6">

        {suggestedServices.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-neutral-700 uppercase tracking-wider">
              {t("vendor.services.suggested_label")}
            </p>
            <div className="flex flex-wrap gap-2" data-testid="suggested-services">
              {suggestedServices.map((name) => {
                const active = selectedNames.has(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleSuggested(name)}
                    aria-pressed={active}
                    data-testid={`suggested-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    className={[
                      "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border transition-colors",
                      active
                        ? "bg-wine-deep text-cream border-wine-deep"
                        : "bg-cream-soft text-neutral-700 border-neutral-300 hover:border-wine-deep hover:text-wine-deep",
                    ].join(" ")}
                  >
                    {active && <Check className="w-3 h-3" aria-hidden="true" />}
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active services list with editable names and toggle-driven price fields */}
        {services.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-neutral-700 uppercase tracking-wider">
              {t("vendor.services.active_label")}
            </p>
            <ul className="space-y-3" data-testid="list-services">
              {services.map((svc) => (
                <li
                  key={svc._id}
                  className="bg-cream/40 border border-neutral-200 px-3 py-3 space-y-2"
                >
                  {/* Row 1: editable name + remove */}
                  <div className="flex items-center gap-2">
                    <Input
                      value={svc.name}
                      onChange={(e) => updateServiceName(svc.name, e.target.value)}
                      className="text-sm h-8 flex-1"
                      data-testid={`input-name-${svc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeService(svc.name)}
                      className="text-neutral-400 hover:text-red-600 shrink-0"
                      aria-label={t("vendor.services.remove")}
                      data-testid={`button-service-remove-${svc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Row 2: show-price toggle */}
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={svc.price_visible}
                      onChange={() => toggleShowPrice(svc.name)}
                      className="w-3.5 h-3.5 accent-wine-deep"
                      data-testid={`toggle-price-visible-${svc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    />
                    <span className="text-xs text-neutral-600">{t("vendor.services.show_price")}</span>
                  </label>

                  {/* Row 3: price + unit — only shown when price_visible is ON */}
                  {svc.price_visible && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative w-[120px]">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={svc.price ?? ""}
                          onChange={(e) => updateServicePrice(svc.name, e.target.value)}
                          placeholder={t("vendor.services.price_placeholder")}
                          className="pr-8 text-sm h-8"
                          data-testid={`input-price-${svc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 pointer-events-none">
                          €
                        </span>
                      </div>
                      <select
                        value={svc.price_unit}
                        onChange={(e) => updateServiceUnit(svc.name, e.target.value as PriceUnit)}
                        className="h-8 text-xs border border-neutral-300 bg-white px-2 py-0 text-neutral-700"
                        data-testid={`select-unit-${svc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      >
                        {PRICE_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {t(`vendor.services.unit_${u}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {services.length === 0 && (
          <p className="text-sm text-neutral-400 italic">{t("vendor.services.empty")}</p>
        )}

        {/* Add custom service */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-neutral-700 uppercase tracking-wider">
            {t("vendor.services.custom_label")}
          </p>
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomService();
                }
              }}
              placeholder={t("vendor.services.add_placeholder")}
              data-testid="input-service-draft"
            />
            <Button
              type="button"
              onClick={addCustomService}
              className="rounded-none uppercase tracking-wider text-xs bg-wine-deep text-cream hover:bg-wine-deep/90"
              data-testid="button-service-add"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {customServices.length === 0 && (
            <p className="text-sm text-neutral-400 italic">{t("vendor.services.custom_empty")}</p>
          )}
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-neutral-200">
          <Button
            type="button"
            onClick={() => save.mutate({ services: services.map(({ name, price, price_unit, price_visible }) => ({ name, price, price_unit, price_visible })) })}
            className="rounded-none uppercase tracking-wider text-xs bg-wine-deep text-cream hover:bg-wine-deep/90"
            disabled={save.isPending}
            data-testid="button-services-save"
          >
            {save.isPending ? t("vendor.services.saving") : t("vendor.services.save")}
          </Button>
          {saved && <p className="text-sm text-emerald-700">{t("vendor.services.saved")}</p>}
        </div>
      </div>
    </div>
  );
}
