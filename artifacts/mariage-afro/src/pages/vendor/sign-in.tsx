import { SignIn } from "@clerk/react";
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

export default function VendorSignInPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-wine-deep px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gold mb-2 font-semibold">{t("auth.vendor.eyebrow")}</p>
          <h1 className="text-cream font-display text-3xl">{t("auth.vendor.title")}</h1>
        </div>
        <SignIn
          routing="path"
          path={`${basePath}/espace-pro/login`}
          signUpUrl={`${basePath}/espace-pro/register`}
          fallbackRedirectUrl="/espace-pro"
          appearance={vendorAppearance}
        />
      </div>
    </div>
  );
}
