import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { vendorApi } from "@/lib/vendorApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface VendorProfile {
  id: number;
  name: string;
  category: string;
  city: string;
  tagline: string;
  description: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  services: string[];
}

const CATEGORIES = [
  "Photographie", "Vidéo", "DJ & Animation", "Décoration", "Traiteur",
  "Coiffure & Maquillage", "Robe de mariée", "Transport", "Invitations",
  "Lieu de réception", "Autre",
];

export default function VendorProfilePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: vendor } = useQuery<VendorProfile>({
    queryKey: ["vendor", "profile"],
    queryFn: () => vendorApi.get<VendorProfile>("/api/vendor/profile"),
  });

  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [city, setCity] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!vendor) return;
    setName(vendor.name || "");
    setCategory(vendor.category || CATEGORIES[0]);
    setCity(vendor.city || "");
    setTagline(vendor.tagline || "");
    setDescription(vendor.description || "");
    setWebsite(vendor.website || "");
    setPhone(vendor.phone || "");
    setEmail(vendor.email || "");
  }, [vendor]);

  const save = useMutation({
    mutationFn: (b: Record<string, unknown>) => vendorApi.patch("/api/vendor/profile", b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor", "profile"] });
      qc.invalidateQueries({ queryKey: ["vendor", "me"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-wine-deep">{t("vendor.profile.title")}</h2>
        <p className="text-sm text-neutral-600 mt-1">{t("vendor.profile.subtitle")}</p>
      </div>

      <form
        className="bg-white border border-neutral-200 p-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({
            name, category, city, tagline, description,
            website: website || null,
            phone: phone || null,
            email: email || undefined,
          });
        }}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.name")}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-profile-name" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.category")}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-input bg-background px-3 py-2 text-sm"
              data-testid="select-profile-category"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.city")}</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} data-testid="input-profile-city" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.tagline")}</label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder={t("vendor.profile.tagline_placeholder")} data-testid="input-profile-tagline" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.description")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full border border-input bg-background px-3 py-2 text-sm"
              data-testid="textarea-profile-description"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.email")}</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-profile-email" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.phone")}</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-profile-phone" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("vendor.profile.website")}</label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" data-testid="input-profile-website" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            type="submit"
            className="rounded-none uppercase tracking-wider text-xs bg-wine-deep text-cream hover:bg-wine-deep/90"
            disabled={save.isPending}
            data-testid="button-profile-save"
          >
            {save.isPending ? t("vendor.profile.saving") : t("vendor.profile.save")}
          </Button>
          {saved && <p className="text-sm text-emerald-700">{t("vendor.profile.saved")}</p>}
          {save.isError && <p className="text-sm text-red-600">{(save.error as Error).message}</p>}
        </div>
      </form>
    </div>
  );
}
