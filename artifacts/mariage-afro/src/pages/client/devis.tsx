import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, FileText, CheckCircle2, XCircle, X } from "lucide-react";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface QuoteService { label: string; qty: number; unitPrice: number }
interface ClientQuote {
  id: number;
  vendorAccountId: number;
  recipientEmail: string;
  recipientName: string;
  services: QuoteService[];
  amountHt: number;
  amountTtc: number;
  vatRate: number;
  validityDays: number;
  subject: string;
  message: string;
  status: "sent" | "accepted" | "refused" | "expired" | string;
  sentAt: string | null;
  respondedAt: string | null;
  respondMessage: string | null;
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  sent: "bg-blue-100 text-blue-700 border-blue-200",
  accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  refused: "bg-rose-100 text-rose-700 border-rose-200",
  expired: "bg-stone-100 text-stone-600 border-stone-200",
};

function fmtEur(cents: number) {
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("fr-BE", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return iso; }
}

export default function ClientDevisPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [replyMsg, setReplyMsg] = useState("");
  const [responding, setResponding] = useState<"accept" | "refuse" | null>(null);

  const { data: quotes = [], isLoading } = useQuery<ClientQuote[]>({
    queryKey: ["client", "quotes"],
    queryFn: () => clientApi.get<ClientQuote[]>("/api/client/quotes"),
  });

  const selected = quotes.find((q) => q.id === selectedId) ?? null;

  const respondMutation = useMutation({
    mutationFn: ({ id, action, message }: { id: number; action: "accept" | "refuse"; message?: string }) =>
      clientApi.post<ClientQuote>(`/api/client/quotes/${id}/respond`, { action, message }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["client", "quotes"] });
      setResponding(null);
      setReplyMsg("");
      toast({ title: updated.status === "accepted" ? t("devis.accepted_toast") : t("devis.refused_toast") });
    },
    onError: () => toast({ title: t("devis.error"), variant: "destructive" }),
  });

  function handleRespond(action: "accept" | "refuse") {
    if (!selected) return;
    respondMutation.mutate({ id: selected.id, action, message: replyMsg || undefined });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="font-display text-2xl md:text-3xl text-wine-deep">{t("devis.title")}</h1>
        <p className="text-sm text-neutral-600 mt-1">{t("devis.subtitle")}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="bg-white border border-neutral-200 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-neutral-500"><Loader2 className="w-5 h-5 mx-auto animate-spin" /></div>
          ) : quotes.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">
              <FileText className="w-8 h-8 mx-auto mb-3 text-neutral-300" />
              <p>{t("devis.empty")}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr className="text-left text-xs uppercase tracking-widest text-neutral-500">
                  <th className="px-4 py-3">{t("devis.col_date")}</th>
                  <th className="px-4 py-3">{t("devis.col_subject")}</th>
                  <th className="px-4 py-3">{t("devis.col_amount")}</th>
                  <th className="px-4 py-3">{t("devis.col_status")}</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => setSelectedId(q.id === selectedId ? null : q.id)}
                    className={`border-b border-neutral-100 cursor-pointer hover:bg-amber-50/40 transition-colors ${selectedId === q.id ? "bg-amber-50/60" : ""} ${q.status === "sent" ? "font-semibold" : ""}`}
                    data-testid={`row-devis-${q.id}`}
                  >
                    <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{fmtDate(q.createdAt)}</td>
                    <td className="px-4 py-3 text-wine-deep">
                      <div>{q.subject || t("devis.no_subject")}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-wine-deep">{fmtEur(q.amountTtc)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] uppercase tracking-widest border px-2 py-1 font-normal ${STATUS_BADGE[q.status] ?? ""}`}>
                        {t(`devis.status.${q.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside className="bg-white border border-neutral-200 p-6 self-start sticky top-6">
          {!selected ? (
            <p className="text-sm text-neutral-500 text-center py-8">{t("devis.detail_empty")}</p>
          ) : (
            <div className="space-y-4" data-testid="panel-devis-detail">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`inline-block text-[10px] uppercase tracking-widest border px-2 py-1 mb-2 font-normal ${STATUS_BADGE[selected.status] ?? ""}`}>
                    {t(`devis.status.${selected.status}`)}
                  </span>
                  <h3 className="font-display text-lg text-wine-deep">{selected.subject || t("devis.no_subject")}</h3>
                </div>
                <button onClick={() => setSelectedId(null)} className="p-1 text-neutral-400 hover:text-wine-deep">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selected.services.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2">{t("devis.services")}</p>
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
                      <span>{t("devis.total_ht")}</span><span>{fmtEur(selected.amountHt)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-wine-deep">
                      <span>{t("devis.total_ttc")}</span><span>{fmtEur(selected.amountTtc)}</span>
                    </div>
                  </div>
                </div>
              )}

              {selected.message && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">{t("devis.message")}</p>
                  <p className="text-sm bg-neutral-50 p-3 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                </div>
              )}

              {selected.respondMessage && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">{t("devis.your_reply")}</p>
                  <p className="text-sm bg-amber-50 border border-amber-200 p-3 whitespace-pre-wrap">{selected.respondMessage}</p>
                </div>
              )}

              <div className="text-xs text-neutral-400 space-y-1 pt-2 border-t border-neutral-100">
                <p>{t("devis.received_on")}: {fmtDate(selected.createdAt)}</p>
                <p>{t("devis.validity")}: {selected.validityDays} {t("devis.days")}</p>
                {selected.respondedAt && <p>{t("devis.responded_at")}: {fmtDate(selected.respondedAt)}</p>}
              </div>

              {selected.status === "sent" && (
                <div className="space-y-3 pt-2 border-t border-neutral-100">
                  <p className="text-xs uppercase tracking-widest text-neutral-500">{t("devis.your_response")}</p>
                  <Textarea
                    rows={3}
                    value={replyMsg}
                    onChange={(e) => setReplyMsg(e.target.value)}
                    placeholder={t("devis.reply_ph")}
                    className="rounded-none"
                    data-testid="textarea-reply"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleRespond("accept")}
                      disabled={respondMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-none uppercase tracking-wider text-xs gap-1.5"
                      data-testid="button-accept"
                    >
                      {respondMutation.isPending && responding === "accept" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {t("devis.accept")}
                    </Button>
                    <Button
                      onClick={() => handleRespond("refuse")}
                      disabled={respondMutation.isPending}
                      variant="outline"
                      className="border-rose-300 text-rose-600 hover:bg-rose-50 rounded-none uppercase tracking-wider text-xs gap-1.5"
                      data-testid="button-refuse"
                    >
                      {respondMutation.isPending && responding === "refuse" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      {t("devis.refuse")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
