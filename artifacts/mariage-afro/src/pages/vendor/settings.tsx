import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X, ExternalLink } from "lucide-react";
import { useVendorMe } from "@/components/vendor/VendorLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { vendorApi } from "@/lib/vendorApi";
import { useToast } from "@/hooks/use-toast";

interface VendorSettingsResp {
  autoFollowupEnabled: boolean;
  customLeadTags: string[];
}

export default function VendorSettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data } = useVendorMe();
  const account = data?.account;

  const { data: settings } = useQuery<VendorSettingsResp>({
    queryKey: ["vendor", "settings"],
    queryFn: () => vendorApi.get<VendorSettingsResp>("/api/vendor/settings"),
  });

  const [autoFollowup, setAutoFollowup] = useState<boolean>(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState<string>("");

  useEffect(() => {
    if (settings) {
      setAutoFollowup(settings.autoFollowupEnabled);
      setTags(settings.customLeadTags ?? []);
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: (body: Partial<VendorSettingsResp>) =>
      vendorApi.patch<VendorSettingsResp>("/api/vendor/settings", body),
    onSuccess: (resp) => {
      qc.setQueryData(["vendor", "settings"], resp);
      toast({ title: t("vendor.settings.saved") });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  function toggleAutoFollowup() {
    const next = !autoFollowup;
    setAutoFollowup(next);
    save.mutate({ autoFollowupEnabled: next });
  }

  function addTag() {
    const v = tagDraft.trim();
    if (!v) return;
    if (tags.some((t) => t.toLowerCase() === v.toLowerCase())) {
      setTagDraft("");
      return;
    }
    const next = [...tags, v];
    setTags(next);
    setTagDraft("");
    save.mutate({ customLeadTags: next });
  }

  function removeTag(tag: string) {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    save.mutate({ customLeadTags: next });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-wine-deep">{t("vendor.settings.title")}</h2>
        <p className="text-sm text-neutral-600 mt-1">{t("vendor.settings.subtitle")}</p>
      </div>

      <section className="bg-cream border border-neutral-200 p-6 space-y-3">
        <h3 className="text-sm uppercase tracking-widest text-neutral-500">{t("vendor.settings.account")}</h3>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between">
            <dt className="text-neutral-500">{t("vendor.settings.email")}</dt>
            <dd className="font-medium">{user?.email || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">{t("vendor.settings.name")}</dt>
            <dd className="font-medium">{account?.contactName || "—"}</dd>
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
            onClick={async () => { await logout(); navigate("/"); }}
            data-testid="button-vendor-settings-signout"
          >
            {t("vendor.settings.signout")}
          </Button>
        </div>
      </section>

      {/* Auto follow-up toggle */}
      <section className="bg-cream border border-neutral-200 p-6 space-y-3" data-testid="section-auto-followup">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm uppercase tracking-widest text-neutral-500">{t("vendor.settings.auto_followup_title")}</h3>
            <p className="text-sm text-neutral-600 mt-1">{t("vendor.settings.auto_followup_desc")}</p>
          </div>
          <button
            type="button"
            onClick={toggleAutoFollowup}
            disabled={save.isPending}
            role="switch"
            aria-checked={autoFollowup}
            data-testid="toggle-auto-followup"
            className={`relative inline-flex h-7 w-12 shrink-0 items-center transition-colors ${
              autoFollowup ? "bg-wine-deep" : "bg-neutral-300"
            }`}
          >
            <span className={`inline-block h-5 w-5 bg-cream shadow transition-transform ${autoFollowup ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        <p className="text-xs uppercase tracking-widest text-neutral-500">
          {autoFollowup ? t("vendor.settings.auto_followup_on") : t("vendor.settings.auto_followup_off")}
        </p>
      </section>

      {/* Custom tags */}
      <section className="bg-cream border border-neutral-200 p-6 space-y-3" data-testid="section-custom-tags">
        <h3 className="text-sm uppercase tracking-widest text-neutral-500">{t("vendor.settings.custom_tags_title")}</h3>
        <p className="text-sm text-neutral-600">{t("vendor.settings.custom_tags_desc")}</p>
        <div className="flex gap-2">
          <Input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            placeholder={t("vendor.settings.custom_tags_placeholder")}
            maxLength={40}
            className="rounded-none"
            data-testid="input-custom-tag"
          />
          <Button
            type="button"
            onClick={addTag}
            disabled={!tagDraft.trim() || save.isPending}
            className="rounded-none uppercase tracking-wider text-xs bg-wine-deep text-cream hover:bg-wine-deep/90"
            data-testid="button-add-custom-tag"
          >
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("vendor.settings.custom_tags_add")}
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider px-2.5 py-1 border border-gold/40 bg-gold/10 text-wine-deep"
                data-testid={`chip-custom-tag-${tag}`}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={t("vendor.settings.custom_tags_remove")}
                  className="hover:text-wine-deep/70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Public profile URL */}
      {data?.account?.vendorId && (
        <section className="bg-cream border border-neutral-200 p-6 space-y-3" data-testid="section-public-url">
          <h3 className="text-sm uppercase tracking-widest text-neutral-500">{t("vendor.settings.public_url_title")}</h3>
          <p className="text-sm text-neutral-600">{t("vendor.settings.public_url_desc")}</p>
          <div className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200">
            <span className="flex-1 text-sm font-mono text-neutral-700 truncate">
              {window.location.origin}/partenaires/{data.account.vendorId}
            </span>
            <a
              href={`/partenaires/${data.account.vendorId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-wine-deep hover:text-wine-deep/70 transition-colors shrink-0"
              data-testid="link-settings-public-profile"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t("vendor.settings.public_url_open")}
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
