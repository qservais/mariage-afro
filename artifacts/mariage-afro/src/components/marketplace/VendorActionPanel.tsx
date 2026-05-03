import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Heart,
  Loader2,
  Send,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { comparator } from "@/lib/comparator";

export type VendorActionType = "quote" | "availability" | "booking" | "zoom" | "rdv";

interface VendorLite {
  id: number;
  name: string;
}

interface VendorActionPanelProps {
  vendor: VendorLite;
}

const ACTIONS: Array<{ key: VendorActionType; Icon: typeof Send }> = [
  { key: "quote", Icon: ClipboardList },
  { key: "availability", Icon: CalendarCheck2 },
  { key: "booking", Icon: CheckCircle2 },
  { key: "zoom", Icon: Video },
  { key: "rdv", Icon: CalendarCheck2 },
];

export default function VendorActionPanel({ vendor }: VendorActionPanelProps) {
  const { t } = useTranslation();
  const [activeAction, setActiveAction] = useState<VendorActionType | null>(null);
  const [inProject, setInProject] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    setInProject(comparator.has("vendor", vendor.id));
    function onChange(e: Event) {
      const detail = (e as CustomEvent).detail as { kind?: string; ids?: number[] } | undefined;
      if (!detail || detail.kind !== "vendor") return;
      setInProject((detail.ids ?? []).includes(vendor.id));
    }
    window.addEventListener("comparator:changed", onChange);
    return () => window.removeEventListener("comparator:changed", onChange);
  }, [vendor.id]);

  function toggleProject() {
    const { ids, reachedMax } = comparator.toggle("vendor", vendor.id);
    if (reachedMax) {
      toast({
        variant: "destructive",
        title: t("partners.add_to_project_max", { defaultValue: "Limite atteinte (3 prestataires max)" }),
      });
      return;
    }
    setInProject(ids.includes(vendor.id));
  }

  return (
    <>
      <div
        className="bg-white p-5 border border-wine-deep/10 rounded-sm space-y-2"
        data-testid="vendor-action-panel"
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-3">
          {t("vendor_detail.actions_title", { defaultValue: "Contacter ce prestataire" })}
        </p>
        <div className="grid grid-cols-1 gap-2">
          {ACTIONS.map(({ key, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveAction(key)}
              className="flex items-center gap-2.5 px-4 py-3 border border-wine-deep/15 text-wine-deep text-sm hover:bg-wine-deep hover:text-cream hover:border-wine-deep transition-colors text-left"
              data-testid={`vendor-action-${key}`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="font-medium">{t(`partners.actions.${key}.button`)}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggleProject}
          className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 text-sm border transition-colors ${
            inProject
              ? "bg-gold-deep text-cream border-gold-deep hover:bg-wine-deep hover:border-wine-deep"
              : "bg-cream text-wine-deep border-gold-deep hover:bg-gold-deep hover:text-cream"
          }`}
          data-testid="vendor-action-add-to-project"
          aria-pressed={inProject}
        >
          <Heart className={`w-4 h-4 ${inProject ? "fill-current" : ""}`} aria-hidden="true" />
          <span className="font-medium">
            {inProject
              ? t("partners.in_my_project", { defaultValue: "Dans mon projet" })
              : t("partners.add_to_project")}
          </span>
        </button>
      </div>

      {activeAction && (
        <VendorActionModal
          action={activeAction}
          vendor={vendor}
          onClose={() => setActiveAction(null)}
        />
      )}
    </>
  );
}

interface VendorActionModalProps {
  action: VendorActionType;
  vendor: VendorLite;
  onClose: () => void;
}

function VendorActionModal({ action, vendor, onClose }: VendorActionModalProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const k = useMemo(() => `partners.actions.${action}` as const, [action]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/vendor-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: String(vendor.id),
          vendorName: vendor.name,
          requestType: action,
          name,
          email,
          phone: phone || null,
          weddingDate: weddingDate || null,
          message: message || null,
          locale: i18n.language,
        }),
      });
      if (!res.ok) throw new Error("bad_status");
      setSubmitted(true);
      toast({ title: t("partners.success_title") });
    } catch {
      toast({
        variant: "destructive",
        title: t("multi_devis.error", { defaultValue: "Une erreur est survenue, réessayez." }),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-wine-deep/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`vendor-action-${action}-title`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl bg-white border border-gold-deep shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-wine-deep/60 hover:text-wine-deep p-1 z-10"
          aria-label={t("popup.close", { defaultValue: "Fermer" })}
          data-testid="vendor-action-modal-close"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {!submitted ? (
          <form onSubmit={onSubmit} className="p-8 md:p-10 space-y-5">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-gold-deep">
                {vendor.name}
              </span>
              <h2
                id={`vendor-action-${action}-title`}
                className="font-display text-2xl md:text-3xl text-wine-deep mt-2 leading-tight"
              >
                {t(`${k}.modal_title`)}
              </h2>
              <p className="text-sm text-wine-deep/70 mt-2">
                {t(`${k}.modal_subtitle`, { vendor: vendor.name })}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`va-name-${action}`} className="text-xs uppercase tracking-wide">
                  {t("tools.budget.form_name", { defaultValue: "Nom & Prénom" })}
                </Label>
                <Input
                  id={`va-name-${action}`}
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-cream border-wine-deep/15 rounded-none mt-1"
                  data-testid="vendor-action-name"
                />
              </div>
              <div>
                <Label htmlFor={`va-email-${action}`} className="text-xs uppercase tracking-wide">
                  {t("tools.budget.form_email", { defaultValue: "Email" })}
                </Label>
                <Input
                  id={`va-email-${action}`}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-cream border-wine-deep/15 rounded-none mt-1"
                  data-testid="vendor-action-email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`va-phone-${action}`} className="text-xs uppercase tracking-wide">
                  {t("multi_devis.phone", { defaultValue: "Téléphone" })}
                </Label>
                <Input
                  id={`va-phone-${action}`}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+32 ..."
                  className="bg-cream border-wine-deep/15 rounded-none mt-1"
                  data-testid="vendor-action-phone"
                />
              </div>
              <div>
                <Label htmlFor={`va-date-${action}`} className="text-xs uppercase tracking-wide">
                  {t("multi_devis.wedding_date", { defaultValue: "Date du mariage" })}
                </Label>
                <Input
                  id={`va-date-${action}`}
                  type="date"
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="bg-cream border-wine-deep/15 rounded-none mt-1"
                  data-testid="vendor-action-date"
                />
              </div>
            </div>

            <div>
              <Label htmlFor={`va-message-${action}`} className="text-xs uppercase tracking-wide">
                {t(`${k}.message_label`)}
              </Label>
              <Textarea
                id={`va-message-${action}`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t(`${k}.message_placeholder`)}
                className="bg-cream border-wine-deep/15 rounded-none mt-1 min-h-[120px] resize-none"
                data-testid="vendor-action-message"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full btn-editorial-solid !h-12"
              data-testid="vendor-action-submit"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("tools.budget.email_submitting", { defaultValue: "Envoi..." })}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t(`${k}.submit`)}
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="p-10 text-center" data-testid="vendor-action-success">
            <CheckCircle2 className="w-14 h-14 text-gold-deep mx-auto mb-4" />
            <h3 className="font-display text-2xl text-wine-deep mb-2">
              {t("partners.success_title")}
            </h3>
            <p className="text-sm text-wine-deep/70 mb-6">
              {t("partners.success_desc")}
            </p>
            <Button
              type="button"
              onClick={onClose}
              className="bg-wine-deep text-cream hover:bg-wine-deep/90 rounded-none"
              data-testid="vendor-action-success-close"
            >
              {t("partners.success_close")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
