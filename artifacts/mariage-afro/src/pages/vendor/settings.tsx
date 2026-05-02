import { useUser, useClerk } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useVendorMe } from "@/components/vendor/VendorLayout";
import { Button } from "@/components/ui/button";

export default function VendorSettingsPage() {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data } = useVendorMe();
  const account = data?.account;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-wine-deep">{t("vendor.settings.title")}</h2>
        <p className="text-sm text-neutral-600 mt-1">{t("vendor.settings.subtitle")}</p>
      </div>

      <section className="bg-white border border-neutral-200 p-6 space-y-3">
        <h3 className="text-sm uppercase tracking-widest text-neutral-500">{t("vendor.settings.account")}</h3>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between">
            <dt className="text-neutral-500">{t("vendor.settings.email")}</dt>
            <dd className="font-medium">{user?.primaryEmailAddress?.emailAddress || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">{t("vendor.settings.name")}</dt>
            <dd className="font-medium">{user?.fullName || account?.contactName || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">{t("vendor.settings.business")}</dt>
            <dd className="font-medium">{account?.businessName || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">{t("vendor.settings.status")}</dt>
            <dd className="font-medium uppercase tracking-wider text-xs">{account?.status || "—"}</dd>
          </div>
        </dl>
        <div className="pt-3 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-none uppercase tracking-wider text-xs"
            onClick={() => openUserProfile()}
            data-testid="button-manage-account"
          >
            {t("vendor.settings.manage_account")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-none uppercase tracking-wider text-xs"
            onClick={async () => { await signOut(); navigate("/"); }}
            data-testid="button-vendor-settings-signout"
          >
            {t("vendor.settings.signout")}
          </Button>
        </div>
      </section>
    </div>
  );
}
