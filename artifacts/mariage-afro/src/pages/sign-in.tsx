import { SignIn } from "@clerk/react";
import { useTranslation } from "react-i18next";
import { basePath } from "@/lib/clerk";

export default function SignInPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary mb-2">{t("auth.client.eyebrow")}</p>
          <h1 className="font-display text-3xl">{t("auth.client.title")}</h1>
        </div>
        <SignIn
          routing="path"
          path={`${basePath}/espace-client/login`}
          signUpUrl={`${basePath}/espace-client/register`}
          fallbackRedirectUrl="/espace-client"
        />
      </div>
    </div>
  );
}
