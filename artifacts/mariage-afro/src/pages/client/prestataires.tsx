import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Star, MessageSquarePlus, CheckCircle2 } from "lucide-react";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClientVendor, ClientVendorCreate, ClientVendorPatch } from "@/lib/clientTypes";
import { useCouple } from "@/components/client/ClientLayout";
import ReviewModal from "@/components/marketplace/ReviewModal";
import { ReviewStars } from "@/components/marketplace/ReviewStars";
import { useToast } from "@/hooks/use-toast";

interface V {
  id: number;
  category: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  amount: number;
  status: string;
}

interface MarketplaceVendor {
  id: number;
  name: string;
}

interface MyReview {
  id: number;
  vendorId: number;
  rating: number;
  title: string;
  comment: string;
  status: "pending" | "published" | "rejected";
  vendorName: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = { contacted: "bg-neutral-100", negotiating: "bg-amber-100 text-amber-800", booked: "bg-blue-100 text-blue-800", paid: "bg-emerald-100 text-emerald-800" };
const LOCALE_MAP: Record<string, string> = { fr: "fr-BE", nl: "nl-BE", en: "en-GB" };

export default function VendorsPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || "fr").split("-")[0];
  const locale = LOCALE_MAP[lang] || "fr-BE";

  const STATUS_LABELS = useMemo<Record<string, string>>(() => ({
    contacted: t("vendors_page.s_contacted"),
    negotiating: t("vendors_page.s_negotiating"),
    booked: t("vendors_page.s_booked"),
    paid: t("vendors_page.s_paid"),
  }), [t]);
  const REVIEW_STATUS_LABEL = useMemo<Record<string, string>>(() => ({
    pending: t("vendors_page.review_pending"),
    published: t("vendors_page.review_published"),
    rejected: t("vendors_page.review_rejected"),
  }), [t]);

  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: couple, refetch: refetchCouple } = useCouple();
  const coupleStatus = (couple as unknown as { status?: string } | undefined)?.status ?? "planning";
  const isCompleted = coupleStatus === "completed";

  const { data: vendors = [] } = useQuery<V[]>({
    queryKey: ["client", "vendors"],
    queryFn: () => clientApi.get<V[]>("/api/client/vendors"),
  });
  const { data: marketplaceVendors = [] } = useQuery<MarketplaceVendor[]>({
    queryKey: ["marketplace-vendors-light"],
    queryFn: async () => {
      const res = await fetch("/api/marketplace/vendors");
      if (!res.ok) return [];
      const rows = await res.json();
      return rows.map((v: Record<string, unknown>) => ({ id: v.id as number, name: v.name as string }));
    },
  });
  const { data: myReviews = [] } = useQuery<MyReview[]>({
    queryKey: ["client", "reviews"],
    queryFn: () => clientApi.get<MyReview[]>("/api/client/reviews"),
  });

  const [form, setForm] = useState({ category: "", name: "", contactName: "", contactEmail: "", contactPhone: "", amount: "" });
  const [reviewTarget, setReviewTarget] = useState<{ id: number; name: string } | null>(null);

  const create = useMutation({
    mutationFn: (b: ClientVendorCreate) => clientApi.post<ClientVendor>("/api/client/vendors", b),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client", "vendors"] }); setForm({ category: "", name: "", contactName: "", contactEmail: "", contactPhone: "", amount: "" }); },
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: ClientVendorPatch }) => clientApi.patch<ClientVendor>(`/api/client/vendors/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "vendors"] }),
  });
  const del = useMutation({
    mutationFn: (id: number) => clientApi.del(`/api/client/vendors/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "vendors"] }),
  });
  const setCoupleStatus = useMutation({
    mutationFn: (status: "planning" | "completed") => clientApi.patch("/api/client/me", { status }),
    onSuccess: () => {
      refetchCouple();
      qc.invalidateQueries({ queryKey: ["client", "me"] });
      toast({ title: t("vendors_page.status_updated") });
    },
  });

  const matchVendorByName = (name: string): MarketplaceVendor | null =>
    marketplaceVendors.find((mv) => mv.name.trim().toLowerCase() === name.trim().toLowerCase()) ?? null;

  const reviewByVendorId = new Map(myReviews.map((r) => [r.vendorId, r] as const));

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="font-bold text-2xl">{t("vendors_page.title")}</h2>
        <p className="text-sm text-neutral-600">{t("vendors_page.subtitle")}</p>
      </div>

      <section className="bg-white p-4 border border-neutral-200 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">{t("vendors_page.status_label")}</p>
          <p className="text-sm">
            {isCompleted ? (
              <span className="inline-flex items-center gap-2 text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4" /> {t("vendors_page.completed_msg")}
              </span>
            ) : (
              <span className="text-neutral-700">{t("vendors_page.planning_msg")}</span>
            )}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setCoupleStatus.mutate(isCompleted ? "planning" : "completed")}
          disabled={setCoupleStatus.isPending}
          className="rounded-none uppercase tracking-wider text-xs"
          variant={isCompleted ? "outline" : "default"}
          data-testid="couple-status-toggle"
        >
          {isCompleted ? t("vendors_page.back_to_planning") : t("vendors_page.mark_completed")}
        </Button>
      </section>

      <form
        className="bg-white p-4 border border-neutral-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3"
        onSubmit={(e) => { e.preventDefault(); if (!form.category || !form.name) return; create.mutate({ category: form.category, name: form.name, contactName: form.contactName || null, contactEmail: form.contactEmail || null, contactPhone: form.contactPhone || null, amount: Math.round(Number(form.amount || 0) * 100) }); }}
      >
        <Input placeholder={t("vendors_page.category")} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required data-testid="input-vendor-category" />
        <Input placeholder={t("vendors_page.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="input-vendor-name" />
        <Input placeholder={t("vendors_page.contact")} value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
        <Input placeholder={t("vendors_page.email")} value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
        <Input placeholder={t("vendors_page.phone")} value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
        <div className="flex gap-2">
          <Input placeholder="€" type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Button type="submit" className="rounded-none px-3"><Plus className="w-4 h-4" /></Button>
        </div>
      </form>

      <div className="bg-white border border-neutral-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-background/40">
            <tr className="text-left text-xs uppercase tracking-widest text-neutral-600">
              <th className="px-4 py-3">{t("vendors_page.category")}</th>
              <th className="px-4 py-3">{t("vendors_page.name")}</th>
              <th className="px-4 py-3">{t("vendors_page.contact")}</th>
              <th className="px-4 py-3 text-right">{t("vendors_page.th_amount")}</th>
              <th className="px-4 py-3">{t("vendors_page.th_status")}</th>
              <th className="px-4 py-3">{t("vendors_page.th_review")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => {
              const matched = matchVendorByName(v.name);
              const myReview = matched ? reviewByVendorId.get(matched.id) : undefined;
              return (
                <tr key={v.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 text-neutral-600">{v.category}</td>
                  <td className="px-4 py-3 font-medium">{v.name}</td>
                  <td className="px-4 py-3 text-neutral-600 text-xs">
                    {v.contactName && <div>{v.contactName}</div>}
                    {v.contactEmail && <div>{v.contactEmail}</div>}
                    {v.contactPhone && <div>{v.contactPhone}</div>}
                  </td>
                  <td className="px-4 py-3 text-right">{(v.amount / 100).toLocaleString(locale)} €</td>
                  <td className="px-4 py-3">
                    <select
                      value={v.status}
                      onChange={(e) => update.mutate({ id: v.id, body: { status: e.target.value } })}
                      className={`text-xs px-2 py-1 ${STATUS_COLORS[v.status] || ""}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {!matched ? (
                      <span className="text-neutral-400">—</span>
                    ) : myReview ? (
                      <div>
                        <div className="flex items-center gap-1" aria-label={t("vendors_page.rating_label", { rating: myReview.rating })}>
                          <ReviewStars rating={myReview.rating} size={12} />
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">{REVIEW_STATUS_LABEL[myReview.status]}</div>
                      </div>
                    ) : isCompleted ? (
                      <button
                        type="button"
                        onClick={() => setReviewTarget({ id: matched.id, name: matched.name })}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        data-testid={`review-vendor-${matched.id}`}
                      >
                        <MessageSquarePlus className="w-3.5 h-3.5" />
                        {t("vendors_page.leave_review")}
                      </button>
                    ) : (
                      <span className="text-neutral-400 inline-flex items-center gap-1">
                        <Star className="w-3 h-3" /> {t("vendors_page.after_wedding")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => del.mutate(v.id)} className="text-neutral-400 hover:text-primary" aria-label={t("prestataires.delete", { defaultValue: "Supprimer" })}><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
                  </td>
                </tr>
              );
            })}
            {vendors.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">{t("vendors_page.empty")}</td></tr>}
          </tbody>
        </table>
      </div>

      {myReviews.length > 0 && (
        <section className="bg-white p-4 border border-neutral-200">
          <h3 className="font-medium mb-3">{t("vendors_page.my_reviews")}</h3>
          <ul className="space-y-3">
            {myReviews.map((r) => (
              <li key={r.id} className="border-b border-neutral-100 pb-3 last:border-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="font-medium text-sm">{r.vendorName}</div>
                  <div className="text-[10px] uppercase tracking-widest text-neutral-500">{REVIEW_STATUS_LABEL[r.status]}</div>
                </div>
                <ReviewStars rating={r.rating} size={12} />
                {r.title && <div className="text-sm font-medium mt-1">{r.title}</div>}
                <div className="text-xs text-neutral-600 mt-1 whitespace-pre-wrap">{r.comment}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {reviewTarget && (
        <ReviewModal
          open
          onClose={() => setReviewTarget(null)}
          vendor={reviewTarget}
          onSubmitted={() => qc.invalidateQueries({ queryKey: ["client", "reviews"] })}
        />
      )}
    </div>
  );
}
