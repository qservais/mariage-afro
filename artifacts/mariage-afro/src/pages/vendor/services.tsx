import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { vendorApi } from "@/lib/vendorApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface VendorProfile {
  id: number;
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

  const addService = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setServices([...services, trimmed]);
    setDraft("");
  };

  const removeService = (i: number) => {
    setServices(services.filter((_, idx) => idx !== i));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-wine-deep">{t("vendor.services.title")}</h2>
        <p className="text-sm text-neutral-600 mt-1">{t("vendor.services.subtitle")}</p>
      </div>

      <div className="bg-white border border-neutral-200 p-6 space-y-4">
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addService(); } }}
            placeholder={t("vendor.services.add_placeholder")}
            data-testid="input-service-draft"
          />
          <Button
            type="button"
            onClick={addService}
            className="rounded-none uppercase tracking-wider text-xs bg-wine-deep text-cream hover:bg-wine-deep/90"
            data-testid="button-service-add"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <ul className="space-y-2" data-testid="list-services">
          {services.length === 0 && (
            <li className="text-sm text-neutral-500 italic">{t("vendor.services.empty")}</li>
          )}
          {services.map((s, i) => (
            <li key={i} className="flex items-center justify-between bg-cream/40 px-3 py-2 border border-neutral-200">
              <span className="text-sm">{s}</span>
              <button
                type="button"
                onClick={() => removeService(i)}
                className="text-neutral-400 hover:text-red-600"
                aria-label={t("vendor.services.remove", { defaultValue: "Supprimer" })}
                data-testid={`button-service-remove-${i}`}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>

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
