import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, X, Check } from "lucide-react";
import { vendorApi } from "@/lib/vendorApi";
import { CATEGORY_CONFIG } from "@/lib/vendorCategoryConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface VendorProfile {
  id: number;
  category: string;
  services: string[];
}

export default function VendorServicesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: vendor } = useQuery<VendorProfile>({
    queryKey: ["vendor", "profile"],
    queryFn: () => vendorApi.get<VendorProfile>("/api/vendor/profile"),
  });

  const [services, setServices] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setServices(vendor?.services ?? []);
  }, [vendor]);

  const save = useMutation({
    mutationFn: (b: { services: string[] }) => vendorApi.patch("/api/vendor/profile", b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor", "profile"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const suggestedServices: string[] =
    vendor?.category ? (CATEGORY_CONFIG[vendor.category]?.suggestedServices ?? []) : [];

  const toggleSuggested = (service: string) => {
    setServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service],
    );
  };

  const addCustomService = () => {
    const trimmed = draft.trim();
    if (!trimmed || services.includes(trimmed)) return;
    setServices([...services, trimmed]);
    setDraft("");
  };

  const removeService = (s: string) => {
    setServices(services.filter((x) => x !== s));
  };

  const customServices = services.filter((s) => !suggestedServices.includes(s));

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
              {suggestedServices.map((s) => {
                const active = services.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSuggested(s)}
                    aria-pressed={active}
                    data-testid={`suggested-${s.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    className={[
                      "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border transition-colors",
                      active
                        ? "bg-wine-deep text-cream border-wine-deep"
                        : "bg-white text-neutral-700 border-neutral-300 hover:border-wine-deep hover:text-wine-deep",
                    ].join(" ")}
                  >
                    {active && <Check className="w-3 h-3" aria-hidden="true" />}
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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

          {customServices.length > 0 && (
            <ul className="space-y-2" data-testid="list-services">
              {customServices.map((s) => (
                <li
                  key={s}
                  className="flex items-center justify-between bg-cream/40 px-3 py-2 border border-neutral-200"
                >
                  <span className="text-sm">{s}</span>
                  <button
                    type="button"
                    onClick={() => removeService(s)}
                    className="text-neutral-400 hover:text-red-600"
                    aria-label={t("vendor.services.remove", { defaultValue: "Supprimer" })}
                    data-testid={`button-service-remove-${s.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

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
