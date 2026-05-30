import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Send, X, ChevronDown, ChevronUp, FileText, Eye } from "lucide-react";
import { vendorApi } from "@/lib/vendorApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface QuoteService { label: string; qty: number; unitPrice: number }
interface VendorQuote {
  id: number;
  vendorAccountId: number;
  coupleId: number | null;
  leadId: number | null;
  recipientEmail: string;
  recipientName: string;
  services: QuoteService[];
  amountHt: number;
  amountTtc: number;
  vatRate: number;
  validityDays: number;
  subject: string;
  message: string;
  status: "draft" | "sent" | "accepted" | "refused" | "expired" | string;
  sentAt: string | null;
  respondedAt: string | null;
  respondMessage: string | null;
  viewToken: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-600 border-neutral-200",
  sent: "bg-wine-deep/5 text-wine-deep border-wine-deep/20",
  accepted: "bg-gold/10 text-gold-deep border-gold/30",
  refused: "bg-primary/5 text-primary border-primary/20",
  expired: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

function fmtEur(cents: number) {
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("fr-BE", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return iso; }
}

const EMPTY_FORM = {
  recipientEmail: "",
  recipientName: "",
  subject: "",
  message: "",
  vatRate: 21,
  validityDays: 30,
  services: [{ label: "", qty: 1, unitPrice: 0 }] as QuoteService[],
};

export default function VendorQuotesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [priceInputs, setPriceInputs] = useState<string[]>([""]);
  const [prefillLeadId, setPrefillLeadId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Prefill form when navigated from the Leads page (?email=&name=&leadId=)
  useEffect(() => {
    const email = searchParams.get("email");
    const name = searchParams.get("name");
    const leadId = searchParams.get("leadId");
    if (email) {
      setForm((f) => ({ ...f, recipientEmail: email, recipientName: name ?? f.recipientName }));
      if (leadId) setPrefillLeadId(Number(leadId));
      setShowForm(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: quotes = [], isLoading } = useQuery<VendorQuote[]>({
    queryKey: ["vendor", "quotes"],
    queryFn: () => vendorApi.get<VendorQuote[]>("/api/vendor/quotes"),
  });

  const selected = useMemo(() => quotes.find((q) => q.id === selectedId) ?? null, [quotes, selectedId]);

  const amountHt = form.services.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const amountTtc = Math.round(amountHt * (1 + form.vatRate / 100));

  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) => vendorApi.post<VendorQuote>("/api/vendor/quotes", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor", "quotes"] });
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
      setPriceInputs([""]);
      setPrefillLeadId(null);
      toast({ title: t("vendor.quotes.created") });
    },
    onError: () => toast({ title: t("vendor.quotes.error"), variant: "destructive" }),
  });

  const sendMutation = useMutation({
    mutationFn: (id: number) => vendorApi.post<VendorQuote>(`/api/vendor/quotes/${id}/send`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor", "quotes"] });
      toast({ title: t("vendor.quotes.sent") });
    },
    onError: () => toast({ title: t("vendor.quotes.error"), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => vendorApi.del(`/api/vendor/quotes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor", "quotes"] });
      if (selectedId !== null) setSelectedId(null);
      toast({ title: t("vendor.quotes.deleted") });
    },
    onError: () => toast({ title: t("vendor.quotes.error"), variant: "destructive" }),
  });

  function updateService(idx: number, field: keyof QuoteService, value: string | number) {
    setForm((f) => {
      const services = f.services.map((s, i) => i === idx ? { ...s, [field]: value } : s);
      return { ...f, services };
    });
  }

  function addService() {
    setForm((f) => ({ ...f, services: [...f.services, { label: "", qty: 1, unitPrice: 0 }] }));
    setPriceInputs((p) => [...p, ""]);
  }

  function removeService(idx: number) {
    setForm((f) => ({ ...f, services: f.services.filter((_, i) => i !== idx) }));
    setPriceInputs((p) => p.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const hasEmptyLabel = form.services.some((s) => !s.label.trim());
    if (hasEmptyLabel) {
      toast({ title: t("vendor.quotes.service_label_required", { defaultValue: "Chaque prestation doit avoir un intitulé." }), variant: "destructive" });
      return;
    }
    createMutation.mutate({ ...form, leadId: prefillLeadId ?? undefined } as typeof EMPTY_FORM & { leadId?: number });
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-wine-deep">{t("vendor.quotes.title")}</h1>
          <p className="text-sm text-neutral-600 mt-1">{t("vendor.quotes.subtitle")}</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-wine-deep text-cream hover:bg-wine-deep/90 rounded-none uppercase tracking-wider gap-2"
          data-testid="button-new-quote"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {t("vendor.quotes.new")}
        </Button>
      </header>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-cream border border-neutral-200 p-6 space-y-5"
          data-testid="form-new-quote"
        >
          <h2 className="font-semibold text-wine-deep text-lg">{t("vendor.quotes.form_title")}</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-neutral-500 block mb-1">{t("vendor.quotes.recipient_email")} *</label>
              <Input
                type="email"
                required
                value={form.recipientEmail}
                onChange={(e) => setForm((f) => ({ ...f, recipientEmail: e.target.value }))}
                className="rounded-none"
                data-testid="input-recipient-email"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-neutral-500 block mb-1">{t("vendor.quotes.recipient_name")}</label>
              <Input
                value={form.recipientName}
                onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
                className="rounded-none"
                data-testid="input-recipient-name"
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-neutral-500 block mb-1">{t("vendor.quotes.subject")}</label>
            <Input
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className="rounded-none"
              data-testid="input-subject"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-neutral-500 block mb-1">{t("vendor.quotes.services_label")}</label>
            <div className="space-y-2">
              {form.services.map((svc, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_5rem_7rem_2rem] gap-2 items-center">
                  <Input
                    placeholder={t("vendor.quotes.service_label_ph")}
                    value={svc.label}
                    onChange={(e) => updateService(idx, "label", e.target.value)}
                    className="rounded-none text-sm"
                    data-testid={`input-service-label-${idx}`}
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="Qté"
                    value={svc.qty}
                    onChange={(e) => updateService(idx, "qty", Math.max(1, Number(e.target.value)))}
                    className="rounded-none text-sm"
                    data-testid={`input-service-qty-${idx}`}
                  />
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={priceInputs[idx] ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setPriceInputs((p) => { const n = [...p]; n[idx] = raw; return n; });
                      const euros = parseFloat(raw.replace(/\s/g, "").replace(",", "."));
                      updateService(idx, "unitPrice", isNaN(euros) || euros < 0 ? 0 : Math.round(euros * 100));
                    }}
                    onBlur={() => {
                      const cents = form.services[idx]?.unitPrice ?? 0;
                      setPriceInputs((p) => {
                        const n = [...p];
                        n[idx] = cents > 0 ? (cents / 100).toFixed(2).replace(".", ",") : "";
                        return n;
                      });
                    }}
                    className="rounded-none text-sm"
                    data-testid={`input-service-price-${idx}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeService(idx)}
                    disabled={form.services.length <= 1}
                    aria-label={t("vendor.quotes.remove_service", { defaultValue: "Supprimer la ligne" })}
                    className="p-1 text-neutral-400 hover:text-primary disabled:opacity-30"
                    data-testid={`button-remove-service-${idx}`}
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">{t("vendor.quotes.price_hint", { defaultValue: "" })}</p>
            <button
              type="button"
              onClick={addService}
              className="mt-2 text-xs text-wine-deep underline uppercase tracking-wider"
              data-testid="button-add-service"
            >
              + {t("vendor.quotes.add_service")}
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-neutral-500 block mb-1">{t("vendor.quotes.vat_rate")} (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.vatRate}
                onChange={(e) => setForm((f) => ({ ...f, vatRate: Number(e.target.value) }))}
                className="rounded-none"
                data-testid="input-vat-rate"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-neutral-500 block mb-1">{t("vendor.quotes.validity_days")}</label>
              <Input
                type="number"
                min={1}
                max={365}
                value={form.validityDays}
                onChange={(e) => setForm((f) => ({ ...f, validityDays: Number(e.target.value) }))}
                className="rounded-none"
                data-testid="input-validity-days"
              />
            </div>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 px-4 py-3 flex justify-between items-center text-sm">
            <span className="text-neutral-600">{t("vendor.quotes.total_ht")}</span>
            <span className="font-semibold">{fmtEur(amountHt)}</span>
          </div>
          <div className="bg-wine-deep/5 border border-wine-deep/20 px-4 py-3 flex justify-between items-center text-sm">
            <span className="text-wine-deep font-semibold">{t("vendor.quotes.total_ttc")} (TVA {form.vatRate}%)</span>
            <span className="font-bold text-wine-deep text-lg">{fmtEur(amountTtc)}</span>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-neutral-500 block mb-1">{t("vendor.quotes.message")}</label>
            <Textarea
              rows={4}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder={t("vendor.quotes.message_ph")}
              className="rounded-none"
              data-testid="textarea-message"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={createMutation.isPending || !form.recipientEmail}
              className="bg-wine-deep text-cream hover:bg-wine-deep/90 rounded-none uppercase tracking-wider"
              data-testid="button-create-quote"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("vendor.quotes.save_draft")}
            </Button>
            <Button type="button" variant="outline" className="rounded-none uppercase tracking-wider" onClick={() => setShowForm(false)}>
              {t("vendor.quotes.cancel")}
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="bg-cream border border-neutral-200 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-neutral-500"><Loader2 className="w-5 h-5 mx-auto animate-spin" /></div>
          ) : quotes.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">
              <FileText className="w-8 h-8 mx-auto mb-3 text-neutral-300" />
              <p>{t("vendor.quotes.empty")}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr className="text-left text-xs uppercase tracking-widest text-neutral-500">
                  <th className="px-4 py-3">{t("vendor.quotes.col_date")}</th>
                  <th className="px-4 py-3">{t("vendor.quotes.col_recipient")}</th>
                  <th className="px-4 py-3">{t("vendor.quotes.col_amount")}</th>
                  <th className="px-4 py-3">{t("vendor.quotes.col_status")}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => setSelectedId(q.id === selectedId ? null : q.id)}
                    className={`border-b border-neutral-100 cursor-pointer hover:bg-cream-soft transition-colors ${selectedId === q.id ? "bg-gold/5" : ""}`}
                    data-testid={`row-quote-${q.id}`}
                  >
                    <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{fmtDate(q.createdAt)}</td>
                    <td className="px-4 py-3 text-wine-deep">
                      <div>{q.recipientName || q.recipientEmail}</div>
                      {q.recipientName && <div className="text-xs text-neutral-500">{q.recipientEmail}</div>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-wine-deep">{fmtEur(q.amountTtc)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] uppercase tracking-widest border px-2 py-1 ${STATUS_BADGE[q.status] ?? ""}`}>
                        {t(`vendor.quotes.status.${q.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        {q.status === "draft" && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); sendMutation.mutate(q.id); }}
                              disabled={sendMutation.isPending}
                              aria-label={t("vendor.quotes.send_btn")}
                              className="p-1.5 border border-wine-deep text-wine-deep hover:bg-wine-deep hover:text-cream transition-colors"
                              data-testid={`button-send-${q.id}`}
                            >
                              <Send className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); if (confirm(t("vendor.quotes.delete_confirm"))) deleteMutation.mutate(q.id); }}
                              disabled={deleteMutation.isPending}
                              aria-label={t("vendor.quotes.delete_btn")}
                              className="p-1.5 border border-neutral-300 text-neutral-500 hover:border-primary hover:text-primary transition-colors"
                              data-testid={`button-delete-${q.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside className="bg-cream border border-neutral-200 p-6 self-start sticky top-6">
          {!selected ? (
            <p className="text-sm text-neutral-500 text-center py-8">{t("vendor.quotes.detail_empty")}</p>
          ) : (
            <div className="space-y-4" data-testid="panel-quote-detail">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`inline-block text-[10px] uppercase tracking-widest border px-2 py-1 mb-2 ${STATUS_BADGE[selected.status] ?? ""}`}>
                    {t(`vendor.quotes.status.${selected.status}`)}
                  </span>
                  <h3 className="font-display text-lg text-wine-deep">{selected.recipientName || selected.recipientEmail}</h3>
                  {selected.recipientName && <p className="text-xs text-neutral-500">{selected.recipientEmail}</p>}
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  aria-label={t("vendor.quotes.close", { defaultValue: "Fermer" })}
                  className="p-1 text-neutral-400 hover:text-wine-deep"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {selected.subject && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">{t("vendor.quotes.subject")}</p>
                  <p className="text-sm font-medium">{selected.subject}</p>
                </div>
              )}

              {selected.services.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2">{t("vendor.quotes.services_label")}</p>
                  <table className="w-full text-xs">
                    <tbody>
                      {selected.services.map((s, i) => (
                        <tr key={i} className="border-b border-neutral-100">
                          <td className="py-1.5 text-neutral-700">{s.label}</td>
                          <td className="py-1.5 text-neutral-500 text-right whitespace-nowrap">{s.qty} × {fmtEur(s.unitPrice)}</td>
                          <td className="py-1.5 text-right font-semibold whitespace-nowrap">{fmtEur(s.qty * s.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="border-t border-neutral-200 mt-2 pt-2 space-y-1">
                    <div className="flex justify-between text-xs text-neutral-600">
                      <span>{t("vendor.quotes.total_ht")}</span><span>{fmtEur(selected.amountHt)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-wine-deep">
                      <span>{t("vendor.quotes.total_ttc")}</span><span>{fmtEur(selected.amountTtc)}</span>
                    </div>
                  </div>
                </div>
              )}

              {selected.message && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">{t("vendor.quotes.message")}</p>
                  <p className="text-sm bg-neutral-50 p-3 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                </div>
              )}

              {selected.respondMessage && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">{t("vendor.quotes.respond_message")}</p>
                  <p className="text-sm bg-cream-soft border border-gold/30 p-3 whitespace-pre-wrap">{selected.respondMessage}</p>
                </div>
              )}

              <div className="text-xs text-neutral-400 space-y-1 pt-2 border-t border-neutral-100">
                <p>{t("vendor.quotes.col_date")}: {fmtDate(selected.createdAt)}</p>
                {selected.sentAt && <p>{t("vendor.quotes.sent_at")}: {fmtDate(selected.sentAt)}</p>}
                {selected.respondedAt && <p>{t("vendor.quotes.responded_at")}: {fmtDate(selected.respondedAt)}</p>}
                <p>{t("vendor.quotes.validity")}: {selected.validityDays} {t("vendor.quotes.days")}</p>
              </div>

              {selected.status === "draft" && (
                <Button
                  onClick={() => sendMutation.mutate(selected.id)}
                  disabled={sendMutation.isPending}
                  className="w-full bg-wine-deep text-cream hover:bg-wine-deep/90 rounded-none uppercase tracking-wider gap-2"
                  data-testid="button-send-detail"
                >
                  {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> {t("vendor.quotes.send_btn")}</>}
                </Button>
              )}
              {selected.viewToken && selected.status !== "draft" && (
                <a
                  href={`/devis/${selected.viewToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full border border-wine-deep text-wine-deep hover:bg-wine-deep hover:text-cream transition-colors px-4 py-2 text-xs uppercase tracking-wider"
                  data-testid="button-view-quote"
                >
                  <Eye className="w-4 h-4" />
                  {t("vendor.quotes.view_btn", { defaultValue: "Voir le devis" })}
                </a>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
