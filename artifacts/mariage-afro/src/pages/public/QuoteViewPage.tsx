import { useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Loader2, Printer, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface QuoteService { label: string; qty: number; unitPrice: number }
interface PublicQuote {
  id: number;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  message: string;
  services: QuoteService[];
  amountHt: number;
  amountTtc: number;
  vatRate: number;
  validityDays: number;
  status: string;
  sentAt: string | null;
  respondedAt: string | null;
  respondMessage: string | null;
  createdAt: string;
}
interface VendorInfo { businessName: string; email: string; phone: string | null }

function fmtEur(cents: number) {
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(cents / 100);
}
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-BE", { day: "2-digit", month: "long", year: "numeric" });
}

export default function QuoteViewPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuery<{ quote: PublicQuote; vendor: VendorInfo | null }>({
    queryKey: ["quote-public", token],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/quotes/view/${token}`);
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    document.title = data?.quote ? `Devis — ${data.vendor?.businessName ?? "Mariage Afro"}` : "Devis";
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff4e4]">
        <Loader2 className="w-8 h-8 animate-spin text-[#68191e]" />
      </div>
    );
  }

  if (error || !data) {
    const code = error instanceof Error ? error.message : "404";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fff4e4] gap-4 p-8 text-center">
        <p className="font-display text-2xl text-[#68191e]">
          {code === "403" ? t("quote_view.not_sent", { defaultValue: "Ce devis n'est pas encore disponible." })
            : t("quote_view.not_found", { defaultValue: "Devis introuvable." })}
        </p>
        <Link to="/" className="text-sm text-[#68191e] underline">{t("quote_view.back_home", { defaultValue: "Retour à l'accueil" })}</Link>
      </div>
    );
  }

  const { quote, vendor } = data;
  const isAccepted = quote.status === "accepted";
  const isRefused = quote.status === "refused";

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-area { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-[#fff4e4] py-10 px-4">
        <div className="no-print max-w-2xl mx-auto mb-6 flex items-center justify-between gap-4 flex-wrap">
          <Link to="/">
            <span className="font-display text-[#68191e] text-lg tracking-wide">♥ Mariage Afro</span>
          </Link>
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="rounded-none uppercase tracking-widest text-xs border-[#68191e] text-[#68191e] hover:bg-[#68191e] hover:text-[#fff4e4] gap-2"
          >
            <Printer className="w-4 h-4" />
            {t("quote_view.download_pdf", { defaultValue: "Télécharger PDF" })}
          </Button>
        </div>

        <div ref={printRef} className="print-area max-w-2xl mx-auto bg-white shadow-md border border-neutral-200 p-8 space-y-7">
          <header className="border-b border-neutral-200 pb-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-1">Devis</p>
              <h1 className="font-display text-2xl text-[#68191e]">{vendor?.businessName ?? "Prestataire"}</h1>
              {vendor?.email && <p className="text-xs text-neutral-500 mt-1">{vendor.email}</p>}
              {vendor?.phone && <p className="text-xs text-neutral-500">{vendor.phone}</p>}
            </div>
            <div className="text-right text-xs text-neutral-500 space-y-0.5">
              <p>{t("quote_view.date", { defaultValue: "Date" })} : {fmtDate(quote.sentAt ?? quote.createdAt)}</p>
              <p>{t("quote_view.validity", { defaultValue: "Valable" })} {quote.validityDays} {t("quote_view.days", { defaultValue: "jours" })}</p>
              <p className="font-mono text-[10px] text-neutral-400">#{quote.id}</p>
            </div>
          </header>

          <section>
            <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">{t("quote_view.recipient", { defaultValue: "Destinataire" })}</p>
            <p className="font-medium text-neutral-800">{quote.recipientName || quote.recipientEmail}</p>
            {quote.recipientName && <p className="text-xs text-neutral-500">{quote.recipientEmail}</p>}
          </section>

          {quote.subject && (
            <section>
              <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">{t("quote_view.subject", { defaultValue: "Objet" })}</p>
              <p className="font-medium text-neutral-800">{quote.subject}</p>
            </section>
          )}

          {quote.message && (
            <section>
              <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">{t("quote_view.message", { defaultValue: "Message" })}</p>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed bg-neutral-50 border border-neutral-100 p-3">{quote.message}</p>
            </section>
          )}

          <section>
            <p className="text-xs uppercase tracking-widest text-neutral-500 mb-3">{t("quote_view.services", { defaultValue: "Prestations" })}</p>
            <table className="w-full text-sm border border-neutral-200">
              <thead>
                <tr className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200">
                  <th className="px-4 py-2 text-left">{t("quote_view.col_label", { defaultValue: "Prestation" })}</th>
                  <th className="px-4 py-2 text-center">{t("quote_view.col_qty", { defaultValue: "Qté" })}</th>
                  <th className="px-4 py-2 text-right">{t("quote_view.col_unit", { defaultValue: "P.U. HT" })}</th>
                  <th className="px-4 py-2 text-right">{t("quote_view.col_total", { defaultValue: "Total HT" })}</th>
                </tr>
              </thead>
              <tbody>
                {quote.services.map((s, i) => (
                  <tr key={i} className="border-b border-neutral-100">
                    <td className="px-4 py-2.5 text-neutral-800">{s.label}</td>
                    <td className="px-4 py-2.5 text-center text-neutral-600">{s.qty}</td>
                    <td className="px-4 py-2.5 text-right text-neutral-600">{fmtEur(s.unitPrice)}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{fmtEur(s.qty * s.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 space-y-1 text-sm text-right">
              <div className="flex justify-end gap-8 text-neutral-600">
                <span>{t("quote_view.total_ht", { defaultValue: "Total HT" })}</span>
                <span className="w-28">{fmtEur(quote.amountHt)}</span>
              </div>
              <div className="flex justify-end gap-8 text-neutral-600">
                <span>TVA ({quote.vatRate}%)</span>
                <span className="w-28">{fmtEur(quote.amountTtc - quote.amountHt)}</span>
              </div>
              <div className="flex justify-end gap-8 font-bold text-[#68191e] text-base border-t border-neutral-200 pt-1.5">
                <span>{t("quote_view.total_ttc", { defaultValue: "Total TTC" })}</span>
                <span className="w-28">{fmtEur(quote.amountTtc)}</span>
              </div>
            </div>
          </section>

          {(isAccepted || isRefused) && (
            <section className={`flex items-start gap-3 p-4 border ${isAccepted ? "border-gold/30 bg-gold/10 text-gold-deep" : "border-primary/20 bg-primary/5 text-primary"}`}>
              {isAccepted ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
              <div>
                <p className="font-semibold text-sm">
                  {isAccepted ? t("quote_view.accepted", { defaultValue: "Devis accepté" }) : t("quote_view.refused", { defaultValue: "Devis refusé" })}
                  {quote.respondedAt && <span className="font-normal text-xs ml-2">— {fmtDate(quote.respondedAt)}</span>}
                </p>
                {quote.respondMessage && <p className="text-xs mt-1 italic">{quote.respondMessage}</p>}
              </div>
            </section>
          )}

          <footer className="border-t border-neutral-100 pt-4 text-[10px] text-neutral-400 text-center">
            {t("quote_view.footer", { defaultValue: "Devis généré via Mariage Afro — mariage-afro.com" })}
          </footer>
        </div>
      </div>
    </>
  );
}
