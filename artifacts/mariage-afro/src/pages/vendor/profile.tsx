import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Loader2, Upload, X } from "lucide-react";
import { vendorApi } from "@/lib/vendorApi";
import { prepareImageForUpload, ACCEPTED_IMAGE_ATTR } from "@/lib/image-compress";
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
  logoUrl: string | null;
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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
    setLogoUrl(vendor.logoUrl || null);
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

  async function pickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    setLogoError(null);
    setLogoUploading(true);
    try {
      const { file, error } = await prepareImageForUpload(raw, {
        maxWidth: 600, maxHeight: 600, quality: 0.88, mimeType: "image/jpeg",
      });
      if (error) { setLogoError(error); return; }
      const intent = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!intent.ok) throw new Error(`HTTP ${intent.status}`);
      const { uploadURL, objectPath } = await intent.json();
      const put = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("Upload failed");
      setLogoUrl(objectPath);
    } catch (err) {
      setLogoError((err as Error).message);
    } finally {
      setLogoUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

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
            logoUrl: logoUrl || null,
          });
        }}
      >
        {/* Logo */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">
            {t("vendor.profile.logo")}
          </label>
          <p className="text-xs text-neutral-500 -mt-1">{t("vendor.profile.logo_help")}</p>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 border border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="logo" className="w-full h-full object-cover" data-testid="logo-preview" />
              ) : (
                <span className="text-[10px] uppercase tracking-wider text-neutral-400">{t("vendor.profile.logo_empty")}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED_IMAGE_ATTR}
                onChange={pickLogo}
                className="hidden"
                data-testid="input-logo-file"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-none uppercase tracking-wider text-xs"
                disabled={logoUploading}
                onClick={() => fileRef.current?.click()}
                data-testid="button-logo-upload"
              >
                {logoUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {logoUrl ? t("vendor.profile.logo_replace") : t("vendor.profile.logo_upload")}
              </Button>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl(null)}
                  className="text-xs text-neutral-500 hover:text-red-600 flex items-center gap-1 self-start"
                  data-testid="button-logo-remove"
                >
                  <X className="w-3 h-3" /> {t("vendor.profile.logo_remove")}
                </button>
              )}
              {logoError && <p className="text-xs text-red-600">{logoError}</p>}
            </div>
          </div>
        </div>

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
