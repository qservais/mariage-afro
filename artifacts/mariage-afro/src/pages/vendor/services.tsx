import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, X, Check, Eye, EyeOff } from "lucide-react";
import { vendorApi } from "@/lib/vendorApi";
import { CATEGORY_CONFIG } from "@/lib/vendorCategoryConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ServiceItem {
  name: string;
  price: number | null;
  currency: string | null;
  price_visible: boolean;
}

interface VendorProfile {
  id: number;
  category: string;
  services: ServiceItem[];
}

export default function VendorServicesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: vendor } = useQuery<VendorProfile>({
    queryKey: ["vendor", "profile"],
    queryFn: () => vendorApi.get<VendorProfile>("/api/vendor/profile"),
  });

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setServices(vendor?.services ?? []);
  }, [vendor]);

  const save = useMutation({
    mutationFn: (b: { services: ServiceItem[] }) => vendorApi.patch("/api/vendor/profile", b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor", "profile"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
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
        { name, price: null, currency: "EUR", price_visible: false },
      ]);
    }
  };

  const addCustomService = () => {
    const trimmed = draft.trim();
    if (!trimmed || selectedNames.has(trimmed)) return;
    setServices((prev) => [
      ...prev,
      { name: trimmed, price: null, currency: "EUR", price_visible: false },
    ]);
    setDraft("");
  };

  const removeService = (name: string) => {
    setServices((prev) => prev.filter((s) => s.name !== name));
  };

  const updateServicePrice = (name: string, price: string) => {
    const parsed = price === "" ? null : parseFloat(price);
    setServices((prev) =>
      prev.map((s) =>
        s.name === name ? { ...s, price: parsed !== null && !isNaN(parsed) ? parsed : null } : s,
      ),
    );
  };

  const togglePriceVisible = (name: string) => {
    setServices((prev) =>
      prev.map((s) => (s.name === name ? { ...s, price_visible: !s.price_visible } : s)),
    );
  };

  const customServices = services.filter((s) => !suggestedServices.includes(s.name));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-wine-deep">{t("vendor.services.title")}</h2>
        <p className="text-sm text-neutral-600 mt-1">{t("vendor.services.subtitle")}</p>
      </div>

      <div className="bg-white border border-neutral-200 p-6 space-y-6">

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
                        : "bg-white text-neutral-700 border-neutral-300 hover:border-wine-deep hover:text-wine-deep",
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

        {/* Active services list with price editing */}
        {services.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-neutral-700 uppercase tracking-wider">
              {t("vendor.services.active_label")}
            </p>
            <ul className="space-y-2" data-testid="list-services">
              {services.map((svc) => (
                <li
                  key={svc.name}
                  className="bg-cream/40 border border-neutral-200 px-3 py-2.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium flex-1 truncate">{svc.name}</span>
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
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-[160px]">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={svc.price ?? ""}
                        onChange={(e) => updateServicePrice(svc.name, e.target.value)}
                        placeholder={t("vendor.services.price_placeholder")}
                        className="pr-10 text-sm h-8"
                        data-testid={`input-price-${svc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 pointer-events-none">
                        €
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePriceVisible(svc.name)}
                      disabled={svc.price == null}
                      title={
                        svc.price_visible
                          ? t("vendor.services.hide_price")
                          : t("vendor.services.show_price")
                      }
                      className={[
                        "inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] border transition-colors",
                        svc.price_visible
                          ? "bg-wine-deep/10 text-wine-deep border-wine-deep/30"
                          : "bg-white text-neutral-500 border-neutral-300",
                        svc.price == null ? "opacity-40 cursor-not-allowed" : "hover:border-wine-deep/60",
                      ].join(" ")}
                      aria-pressed={svc.price_visible}
                      data-testid={`toggle-price-visible-${svc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    >
                      {svc.price_visible ? (
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      {svc.price_visible
                        ? t("vendor.services.price_public")
                        : t("vendor.services.price_hidden")}
                    </button>
                  </div>
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
            onClick={() => save.mutate({ services })}
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
