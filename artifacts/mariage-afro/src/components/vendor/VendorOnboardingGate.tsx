import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { useTranslation } from "react-i18next";
import { vendorApi } from "@/lib/vendorApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Briefcase } from "lucide-react";

interface AccountLike {
  businessName?: string;
  contactName?: string;
  email?: string;
  phone?: string | null;
  category?: string;
  city?: string;
  website?: string | null;
  description?: string;
  onboardedAt?: string | null;
}

interface Props {
  account: AccountLike | undefined;
  children: React.ReactNode;
}

const CATEGORIES = [
  "Photographie",
  "Vidéo",
  "DJ & Animation",
  "Décoration",
  "Traiteur",
  "Coiffure & Maquillage",
  "Robe de mariée",
  "Transport",
  "Invitations",
  "Lieu de réception",
  "Autre",
];

export default function VendorOnboardingGate({ account, children }: Props) {
  const { user } = useUser();
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();

  const needsOnboarding = account !== undefined && !account.onboardedAt;

  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!account) return;
    setBusinessName(account.businessName || "");
    setContactName(account.contactName || user?.fullName || "");
    setEmail(account.email || user?.primaryEmailAddress?.emailAddress || "");
    setPhone(account.phone || "");
    setCategory(account.category || CATEGORIES[0]);
    setCity(account.city || "");
    setWebsite(account.website || "");
    setDescription(account.description || "");
  }, [account, user]);

  const save = useMutation({
    mutationFn: (b: Record<string, unknown>) => vendorApi.post("/api/vendor/onboarding", b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor", "me"] }),
  });

  if (!needsOnboarding) return <>{children}</>;

  const locale = (i18n.language?.slice(0, 2) ?? "fr") as "fr" | "nl" | "en";

  return (
    <div className="fixed inset-0 z-50 bg-wine-deep/90 flex items-center justify-center p-4 overflow-y-auto">
      <form
        className="bg-white max-w-2xl w-full p-8 border border-gold/30 space-y-6 my-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (!businessName || !contactName || !email || !category || !city) return;
          save.mutate({
            businessName,
            contactName,
            email,
            phone: phone || null,
            category,
            city,
            website: website || null,
            description,
            locale,
          });
        }}
      >
        <div className="flex items-center gap-2 text-gold-deep font-bold tracking-widest text-sm uppercase">
          <Briefcase className="w-4 h-4" />
          <span className="text-wine-deep">{t("vendor.onboarding.eyebrow")}</span>
        </div>
        <div>
          <h2 className="font-bold text-2xl text-wine-deep">{t("vendor.onboarding.title")}</h2>
          <p className="text-sm text-neutral-600 mt-1">{t("vendor.onboarding.subtitle")}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">
              {t("vendor.onboarding.business_name")} <span className="text-primary">*</span>
            </label>
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required data-testid="input-vendor-business-name" />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">
              {t("vendor.onboarding.contact_name")} <span className="text-primary">*</span>
            </label>
            <Input value={contactName} onChange={(e) => setContactName(e.target.value)} required data-testid="input-vendor-contact-name" />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">
              {t("vendor.onboarding.email")} <span className="text-primary">*</span>
            </label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="input-vendor-email" />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">
              {t("vendor.onboarding.category")} <span className="text-primary">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full border border-input bg-background px-3 py-2 text-sm"
              data-testid="select-vendor-category"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">
              {t("vendor.onboarding.city")} <span className="text-primary">*</span>
            </label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} required data-testid="input-vendor-city" />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">
              {t("vendor.onboarding.phone")}
            </label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-vendor-phone" />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">
              {t("vendor.onboarding.website")}
            </label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" data-testid="input-vendor-website" />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">
              {t("vendor.onboarding.description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-input bg-background px-3 py-2 text-sm"
              data-testid="textarea-vendor-description"
            />
          </div>
        </div>

        <div className="bg-cream border border-gold/30 px-4 py-3 text-xs text-neutral-700">
          {t("vendor.onboarding.review_notice")}
        </div>

        <Button
          type="submit"
          className="w-full rounded-none uppercase tracking-wider text-xs bg-wine-deep text-cream hover:bg-wine-deep/90"
          disabled={save.isPending}
          data-testid="button-vendor-onboarding-submit"
        >
          {save.isPending ? t("vendor.onboarding.saving") : t("vendor.onboarding.submit")}
        </Button>
        {save.isError && (
          <p className="text-sm text-red-600" data-testid="text-onboarding-error">
            {(save.error as Error).message}
          </p>
        )}
      </form>
    </div>
  );
}
