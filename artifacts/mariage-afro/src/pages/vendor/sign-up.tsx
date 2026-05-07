import { SignUp } from "@clerk/react";
import { useTranslation } from "react-i18next";
import { basePath, clerkAppearance } from "@/lib/clerk";

const vendorAppearance = {
  ...clerkAppearance,
  elements: {
    ...clerkAppearance.elements,
    card: "!shadow-none !border-0 !bg-white !rounded-none p-8",
    footer: "!shadow-none !border-0 !bg-white !rounded-none px-8 pb-6",
  },
};

export default function VendorSignUpPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-wine-deep px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gold mb-2 font-semibold">{t("auth.vendor.eyebrow")}</p>
          <h1 className="text-cream font-display text-3xl">{t("auth.vendor.title")}</h1>
          <p className="text-cream/70 text-sm mt-2">{t("auth.vendor.subtitle")}</p>
        </div>
        <SignUp
          routing="path"
          path={`${basePath}/espace-pro/register`}
          signInUrl={`${basePath}/espace-pro/login`}
          fallbackRedirectUrl="/espace-pro"
          appearance={vendorAppearance}
        />
      </div>
    </div>
  );
}
