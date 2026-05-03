import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, X, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface VendorLite {
  id: number;
  name: string;
}

interface MultiDevisFormProps {
  open: boolean;
  onClose: () => void;
  vendors: VendorLite[];
  onSuccess?: () => void;
}

export default function MultiDevisForm({ open, onClose, vendors, onSuccess }: MultiDevisFormProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (vendors.length === 0) {
      toast({ variant: "destructive", title: t("multi_devis.no_vendors") });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads/multi-devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorIds: vendors.map((v) => v.id),
          name,
          email,
          phone: phone || null,
          weddingDate: weddingDate || null,
          message: message || null,
          locale: i18n.language,
        }),
      });
      if (!res.ok) throw new Error("Bad status");
      setSubmitted(true);
      toast({ title: t("multi_devis.success_title") });
      onSuccess?.();
    } catch {
      toast({ variant: "destructive", title: t("multi_devis.error") });
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setSubmitted(false);
    setName(""); setEmail(""); setPhone(""); setWeddingDate(""); setMessage("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-wine-deep/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="multi-devis-title"
    >
      <div className="relative w-full max-w-2xl bg-white border border-gold-deep shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 text-wine-deep/60 hover:text-wine-deep p-1 z-10"
          aria-label={t("popup.close")}
          data-testid="multi-devis-close"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {!submitted ? (
          <div className="p-8 md:p-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 border border-gold-deep flex items-center justify-center text-gold-deep">
                <Send className="w-5 h-5" />
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-wine-deep/60 font-medium">
                {t("multi_devis.eyebrow")}
              </span>
            </div>
            <h2 id="multi-devis-title" className="font-display text-2xl md:text-3xl text-wine-deep mb-3 leading-tight">
              {t("multi_devis.title")}
            </h2>
            <p className="text-sm text-wine-deep/70 mb-6">
              {t("multi_devis.desc", { count: vendors.length })}
            </p>

            <div className="bg-cream border border-wine-deep/10 p-4 mb-6">
              <div className="text-xs uppercase tracking-wide text-wine-deep/60 mb-2">
                {t("multi_devis.recipients")} ({vendors.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {vendors.map((v) => (
                  <span
                    key={v.id}
                    className="inline-block bg-white border border-wine-deep/20 px-3 py-1 text-xs text-wine-deep"
                    data-testid={`multi-devis-vendor-${v.id}`}
                  >
                    {v.name}
                  </span>
                ))}
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wide">{t("tools.budget.form_name")}</Label>
                  <Input
                    required minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-cream border-wine-deep/15 rounded-none mt-1"
                    data-testid="multi-devis-name"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide">{t("tools.budget.form_email")}</Label>
                  <Input
                    type="email" required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-cream border-wine-deep/15 rounded-none mt-1"
                    data-testid="multi-devis-email"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wide">{t("multi_devis.phone")}</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+32 ..."
                    className="bg-cream border-wine-deep/15 rounded-none mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide">{t("multi_devis.wedding_date")}</Label>
                  <Input
                    type="date"
                    value={weddingDate}
                    onChange={(e) => setWeddingDate(e.target.value)}
                    className="bg-cream border-wine-deep/15 rounded-none mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide">{t("multi_devis.message_label")}</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("multi_devis.message_placeholder")}
                  className="bg-cream border-wine-deep/15 rounded-none mt-1 min-h-[120px] resize-none"
                  data-testid="multi-devis-message"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting || vendors.length === 0}
                className="w-full btn-editorial-solid !h-12"
                data-testid="multi-devis-submit"
              >
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("tools.budget.email_submitting")}</> : t("multi_devis.cta", { count: vendors.length })}
              </Button>
              <p className="text-[11px] text-wine-deep/50 text-center">
                {t("multi_devis.privacy_note")}
              </p>
            </form>
          </div>
        ) : (
          <div className="p-10 text-center" data-testid="multi-devis-success">
            <CheckCircle2 className="w-14 h-14 text-gold-deep mx-auto mb-4" />
            <h3 className="font-display text-2xl text-wine-deep mb-2">{t("multi_devis.success_title")}</h3>
            <p className="text-sm text-wine-deep/70 mb-4">
              {t("multi_devis.success_desc", { count: vendors.length })}
            </p>
            <div className="bg-cream border border-wine-deep/10 p-4 mb-6">
              <div className="flex flex-wrap gap-2 justify-center">
                {vendors.map((v) => (
                  <span key={v.id} className="inline-block bg-white border border-wine-deep/20 px-3 py-1 text-xs text-wine-deep">
                    {v.name}
                  </span>
                ))}
              </div>
            </div>
            <Button
              type="button"
              onClick={handleClose}
              className="bg-wine-deep text-cream hover:bg-wine-deep/90 rounded-none"
              data-testid="multi-devis-success-close"
            >
              {t("popup.close")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
