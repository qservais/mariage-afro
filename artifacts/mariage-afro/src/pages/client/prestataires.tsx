import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Star, MessageSquarePlus, CheckCircle2,
  Building2, UserPlus, MessageCircle, Search, X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { clientApi } from "@/lib/clientApi";
import { storageUrl as coverUrl } from "@/lib/storage-url";
import { ImgWithFallback } from "@/components/Picture";
import { MobileFormSheet } from "@/components/forms/MobileFormSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClientVendor, ClientVendorCreate, ClientVendorPatch } from "@/lib/clientTypes";
import { useCouple } from "@/components/client/ClientLayout";
import ReviewModal from "@/components/marketplace/ReviewModal";
import { ReviewStars } from "@/components/marketplace/ReviewStars";
import { useToast } from "@/hooks/use-toast";

// ── Types ────────────────────────────────────────────────────────────────────

interface ConversationVendor {
  id: number;
  name: string;
  category: string;
  city: string;
  coverImage: string | null;
  active: boolean | null;
  verified: boolean | null;
}
interface Conversation {
  id: number;
  vendorId: number | null;
  kind: "admin" | "vendor";
  lastMessageAt: string | null;
  vendor: ConversationVendor | null;
}
interface MarketplaceVendor {
  id: number;
  name: string;
  category: string;
  city: string;
  tagline: string;
  coverImage: string | null;
}
interface VendorsPage {
  vendors: MarketplaceVendor[];
  total: number;
}
interface ExternalVendor {
  id: number;
  category: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  amount: number;
  status: string;
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

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  contacted:   "bg-neutral-100 text-neutral-600",
  negotiating: "bg-gold/10 text-gold-deep",
  booked:      "bg-wine-deep/5 text-wine-deep",
  paid:        "bg-gold/15 text-gold-deep",
};
const LOCALE_MAP: Record<string, string> = { fr: "fr-BE", nl: "nl-BE", en: "en-GB" };

// ── Vendor Picker Modal ───────────────────────────────────────────────────────

function VendorPickerModal({
  open, onClose, onSelect, loading, vendors,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (v: MarketplaceVendor) => void;
  loading: boolean;
  vendors: MarketplaceVendor[];
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(vendors.map((v) => v.category))).sort(),
    [vendors],
  );
  const filtered = useMemo(
    () =>
      vendors.filter(
        (v) =>
          (!cat || v.category === cat) &&
          (!search ||
            v.name.toLowerCase().includes(search.toLowerCase()) ||
            v.city.toLowerCase().includes(search.toLowerCase())),
      ),
    [vendors, cat, search],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-cream border border-wine-deep/15 w-full max-w-lg max-h-[82dvh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-wine-deep/10">
          <h3 className="font-display text-lg text-wine-deep">{t("vendors_page.pick_vendor")}</h3>
          <button
            onClick={onClose}
            className="text-wine-deep/40 hover:text-wine-deep transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-wine-deep/10 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wine-deep/30" aria-hidden="true" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("vendors_page.pick_vendor_placeholder")}
              className="w-full pl-9 pr-3 py-2 border border-wine-deep/15 bg-cream text-sm focus:outline-none focus:border-wine-deep/40 text-wine-deep placeholder:text-wine-deep/30"
            />
          </div>
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCat("")}
                className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border transition-colors ${!cat ? "bg-wine-deep text-cream border-wine-deep" : "border-wine-deep/15 text-wine-deep/50 hover:border-wine-deep/30"}`}
              >
                Tout
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(cat === c ? "" : c)}
                  className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border transition-colors ${cat === c ? "bg-wine-deep text-cream border-wine-deep" : "border-wine-deep/15 text-wine-deep/50 hover:border-wine-deep/30"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 divide-y divide-wine-deep/5">
          {filtered.map((v) => {
            const img = coverUrl(v.coverImage);
            return (
              <button
                key={v.id}
                onClick={() => { if (!loading) onSelect(v); }}
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-wine-deep/[0.03] transition-colors disabled:opacity-50"
              >
                {img ? (
                  <ImgWithFallback src={img} alt="" className="w-10 h-10 object-cover shrink-0 border border-wine-deep/10" aria-hidden="true" />
                ) : (
                  <div className="w-10 h-10 bg-wine-deep/5 border border-wine-deep/10 flex items-center justify-center shrink-0" aria-hidden="true">
                    <Building2 className="w-4 h-4 text-wine-deep/25" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-wine-deep truncate">{v.name}</p>
                  <p className="text-[10px] uppercase tracking-wider text-wine-deep/45">{v.category} · {v.city}</p>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-wine-deep/40 py-10">{t("vendors_page.pick_vendor_empty")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function VendorsPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || "fr").split("-")[0];
  const locale = LOCALE_MAP[lang] || "fr-BE";

  const [activeTab, setActiveTab] = useState<"platform" | "external">("platform");
  const [showPicker, setShowPicker] = useState(false);
  const [showExternalForm, setShowExternalForm] = useState(false);
  const [form, setForm] = useState({
    category: "", name: "", contactName: "", contactEmail: "", contactPhone: "", amount: "",
  });
  const [reviewTarget, setReviewTarget] = useState<{ id: number; name: string } | null>(null);

  const STATUS_LABELS = useMemo<Record<string, string>>(
    () => ({
      contacted:   t("vendors_page.s_contacted"),
      negotiating: t("vendors_page.s_negotiating"),
      booked:      t("vendors_page.s_booked"),
      paid:        t("vendors_page.s_paid"),
    }),
    [t],
  );
  const REVIEW_STATUS_LABEL = useMemo<Record<string, string>>(
    () => ({
      pending:   t("vendors_page.review_pending"),
      published: t("vendors_page.review_published"),
      rejected:  t("vendors_page.review_rejected"),
    }),
    [t],
  );

  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: couple, refetch: refetchCouple } = useCouple();
  const coupleStatus = (couple as unknown as { status?: string } | undefined)?.status ?? "planning";
  const isCompleted = coupleStatus === "completed";
  const isValidated = !!(couple as unknown as { validatedAt?: string } | undefined)?.validatedAt;

  // ── Conversations (platform vendors) ────────────────────────────────────────
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["client", "conversations"],
    queryFn: () => clientApi.get<Conversation[]>("/api/client/conversations"),
  });
  const platformVendors = useMemo(
    () => conversations.filter((c) => c.kind === "vendor" && c.vendor != null && c.vendor.active === true && c.vendor.verified === true),
    [conversations],
  );

  // ── External vendors ─────────────────────────────────────────────────────────
  const { data: externalVendors = [] } = useQuery<ExternalVendor[]>({
    queryKey: ["client", "vendors"],
    queryFn: () => clientApi.get<ExternalVendor[]>("/api/client/vendors"),
  });

  // ── Marketplace vendors for picker ──────────────────────────────────────────
  const { data: marketplaceVendors = [] } = useQuery<MarketplaceVendor[]>({
    queryKey: ["marketplace", "vendors", "picker"],
    queryFn: () =>
      clientApi
        .get<VendorsPage>("/api/marketplace/vendors?limit=200")
        .then((r) => r.vendors ?? []),
    enabled: showPicker && isValidated,
    staleTime: 5 * 60 * 1000,
  });

  // ── Reviews ──────────────────────────────────────────────────────────────────
  const { data: myReviews = [] } = useQuery<MyReview[]>({
    queryKey: ["client", "reviews"],
    queryFn: () => clientApi.get<MyReview[]>("/api/client/reviews"),
  });
  const reviewByVendorId = useMemo(
    () => new Map(myReviews.map((r) => [r.vendorId, r] as const)),
    [myReviews],
  );

  const matchVendorByName = (name: string): ConversationVendor | null =>
    conversations
      .filter((c) => c.kind === "vendor")
      .find((c) => c.vendor?.name.trim().toLowerCase() === name.trim().toLowerCase())
      ?.vendor ?? null;

  // ── Mutations ────────────────────────────────────────────────────────────────

  const startConv = useMutation({
    mutationFn: (vendorId: number) =>
      clientApi.post<{ id: number }>("/api/client/conversations", { vendorId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", "conversations"] });
      setShowPicker(false);
      toast({ title: t("vendors_page.conv_started") });
    },
    onError: (err) => toast({ title: (err as Error).message, variant: "destructive" }),
  });

  const create = useMutation({
    mutationFn: (b: ClientVendorCreate) => clientApi.post<ClientVendor>("/api/client/vendors", b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", "vendors"] });
      setForm({ category: "", name: "", contactName: "", contactEmail: "", contactPhone: "", amount: "" });
      setShowExternalForm(false);
    },
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: ClientVendorPatch }) =>
      clientApi.patch<ClientVendor>(`/api/client/vendors/${id}`, body),
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

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page header */}
      <div>
        <h2 className="font-bold text-2xl">{t("vendors_page.title")}</h2>
        <p className="text-sm text-neutral-600">{t("vendors_page.subtitle")}</p>
      </div>

      {/* Wedding status toggle */}
      <section className="bg-cream p-4 border border-neutral-200 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">
            {t("vendors_page.status_label")}
          </p>
          <p className="text-sm">
            {isCompleted ? (
              <span className="inline-flex items-center gap-2 text-gold-deep font-medium">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                {t("vendors_page.completed_msg")}
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

      {/* Tabs */}
      <div className="border-b border-wine-deep/10 flex gap-0">
        {(["platform", "external"] as const).map((tab) => {
          const count = tab === "platform" ? platformVendors.length : externalVendors.length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              aria-current={activeTab === tab ? "page" : undefined}
              className={`px-5 py-3 text-sm font-medium uppercase tracking-widest border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-wine-deep text-wine-deep"
                  : "border-transparent text-neutral-400 hover:text-wine-deep/70"
              }`}
            >
              {t(`vendors_page.tab_${tab}`)}
              {count > 0 && (
                <span className="ml-2 text-[10px] bg-wine-deep text-cream px-1.5 py-0.5 align-middle">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── PLATFORM TAB ─────────────────────────────────────────────────────── */}
      {activeTab === "platform" && (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <p className="text-sm text-neutral-500 max-w-prose">
              {t("vendors_page.platform_subtitle")}
            </p>
            {isValidated ? (
              <Button
                onClick={() => setShowPicker(true)}
                className="rounded-none uppercase tracking-wider text-xs shrink-0"
                variant="default"
              >
                <UserPlus className="w-4 h-4 mr-2" aria-hidden="true" />
                {t("vendors_page.new_contact")}
              </Button>
            ) : (
              <p className="text-xs text-wine-deep/60 border border-wine-deep/20 px-3 py-2 bg-wine-deep/[0.03] max-w-xs">
                {t("vendors_page.not_validated_warning")}
              </p>
            )}
          </div>

          {platformVendors.length === 0 ? (
            <div className="border border-wine-deep/10 bg-cream p-12 text-center">
              <Building2 className="w-8 h-8 text-wine-deep/20 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm text-neutral-500 mb-5">{t("vendors_page.no_platform_vendors")}</p>
              {isValidated && (
                <Button
                  onClick={() => setShowPicker(true)}
                  variant="default"
                  className="rounded-none uppercase tracking-wider text-xs"
                >
                  <UserPlus className="w-4 h-4 mr-2" aria-hidden="true" />
                  {t("vendors_page.new_contact")}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {platformVendors.map((c) => {
                const v = c.vendor!;
                const myReview = reviewByVendorId.get(v.id);
                const img = coverUrl(v.coverImage);
                return (
                  <article key={c.id} className="bg-cream border border-wine-deep/10 flex flex-col">
                    {img ? (
                      <div className="h-36 overflow-hidden">
                        <img
                          src={img}
                          alt=""
                          aria-hidden="true"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div
                        className="h-36 bg-wine-deep/[0.04] flex items-center justify-center border-b border-wine-deep/10"
                        aria-hidden="true"
                      >
                        <Building2 className="w-8 h-8 text-wine-deep/15" />
                      </div>
                    )}

                    <div className="p-4 flex flex-col flex-1 gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-wine-deep/45 mb-0.5">
                          {v.category} · {v.city}
                        </p>
                        <h3 className="font-semibold text-wine-deep">{v.name}</h3>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-gold-deep bg-gold/10 border border-gold/20 px-2 py-0.5">
                          <MessageCircle className="w-3 h-3" aria-hidden="true" />
                          {t("vendors_page.in_discussion")}
                        </span>
                        {myReview && (
                          <div
                            className="flex items-center gap-1"
                            aria-label={t("vendors_page.rating_label", { rating: myReview.rating })}
                          >
                            <ReviewStars rating={myReview.rating} size={11} />
                          </div>
                        )}
                      </div>

                      <Link
                        to="/espace-client/communication"
                        className="mt-auto inline-flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wider font-medium border border-wine-deep text-wine-deep hover:bg-wine-deep hover:text-cream transition-colors py-2 px-3"
                      >
                        <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        {t("vendors_page.view_messages")}
                      </Link>

                      {isCompleted && !myReview && (
                        <button
                          type="button"
                          onClick={() => setReviewTarget({ id: v.id, name: v.name })}
                          className="inline-flex items-center gap-1 text-[11px] text-wine-deep hover:underline"
                          data-testid={`review-vendor-${v.id}`}
                        >
                          <MessageSquarePlus className="w-3 h-3" aria-hidden="true" />
                          {t("vendors_page.leave_review")}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* My reviews */}
          {myReviews.length > 0 && (
            <section className="bg-cream p-4 border border-neutral-200">
              <h3 className="font-medium mb-3">{t("vendors_page.my_reviews")}</h3>
              <ul className="space-y-3">
                {myReviews.map((r) => (
                  <li key={r.id} className="border-b border-neutral-100 pb-3 last:border-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="font-medium text-sm">{r.vendorName}</div>
                      <div className="text-[10px] uppercase tracking-widest text-neutral-500">
                        {REVIEW_STATUS_LABEL[r.status]}
                      </div>
                    </div>
                    <ReviewStars rating={r.rating} size={12} />
                    {r.title && <div className="text-sm font-medium mt-1">{r.title}</div>}
                    <div className="text-xs text-neutral-600 mt-1 whitespace-pre-wrap">{r.comment}</div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* ── EXTERNAL TAB ─────────────────────────────────────────────────────── */}
      {activeTab === "external" && (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <p className="text-sm text-neutral-500">{t("vendors_page.external_subtitle")}</p>
            <Button
              onClick={() => setShowExternalForm(true)}
              className="rounded-none uppercase tracking-wider text-xs shrink-0"
              variant="default"
              data-testid="add-external-vendor-btn"
            >
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              {t("vendors_page.add_btn")}
            </Button>
          </div>

          <MobileFormSheet
            open={showExternalForm}
            onOpenChange={setShowExternalForm}
            title={t("vendors_page.add_external_vendor")}
            closeLabel={t("common.close")}
            footer={
              <Button
                type="submit"
                form="external-vendor-form"
                className="w-full rounded-none uppercase tracking-wider text-xs"
                disabled={create.isPending}
              >
                {t("vendors_page.add_btn")}
              </Button>
            }
          >
            <form
              id="external-vendor-form"
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.category || !form.name) return;
                create.mutate({
                  category: form.category,
                  name: form.name,
                  contactName: form.contactName || null,
                  contactEmail: form.contactEmail || null,
                  contactPhone: form.contactPhone || null,
                  amount: Math.round(Number(form.amount || 0) * 100),
                });
              }}
            >
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-neutral-500">
                  {t("vendors_page.category")} *
                </label>
                <Input
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder={t("vendors_page.category")}
                  data-testid="input-vendor-category"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-neutral-500">
                  {t("vendors_page.name")} *
                </label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("vendors_page.name")}
                  data-testid="input-vendor-name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-neutral-500">
                  {t("vendors_page.contact")}
                </label>
                <Input
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  placeholder={t("vendors_page.contact")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-neutral-500">
                  {t("vendors_page.email")}
                </label>
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  placeholder={t("vendors_page.email")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-neutral-500">
                  {t("vendors_page.phone")}
                </label>
                <Input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder={t("vendors_page.phone")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-neutral-500">
                  {t("vendors_page.th_amount")}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="€"
                />
              </div>
            </form>
          </MobileFormSheet>

          {/* Table */}
          <div className="bg-cream border border-neutral-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background/40">
                <tr className="text-left text-xs uppercase tracking-widest text-neutral-600">
                  <th className="px-4 py-3">{t("vendors_page.category")}</th>
                  <th className="px-4 py-3">{t("vendors_page.name")}</th>
                  <th className="px-4 py-3">{t("vendors_page.contact")}</th>
                  <th className="px-4 py-3 text-right">{t("vendors_page.th_amount")}</th>
                  <th className="px-4 py-3">{t("vendors_page.th_status")}</th>
                  <th className="px-4 py-3">{t("vendors_page.th_review")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {externalVendors.map((v) => {
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
                      <td className="px-4 py-3 text-right">
                        {(v.amount / 100).toLocaleString(locale)} €
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={v.status}
                          onChange={(e) =>
                            update.mutate({ id: v.id, body: { status: e.target.value } })
                          }
                          className={`text-xs px-2 py-1 ${STATUS_COLORS[v.status] ?? ""}`}
                        >
                          {Object.entries(STATUS_LABELS).map(([k, l]) => (
                            <option key={k} value={k}>{l}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {!matched ? (
                          <span className="text-neutral-400">—</span>
                        ) : myReview ? (
                          <div>
                            <div
                              className="flex items-center gap-1"
                              aria-label={t("vendors_page.rating_label", { rating: myReview.rating })}
                            >
                              <ReviewStars rating={myReview.rating} size={12} />
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">
                              {REVIEW_STATUS_LABEL[myReview.status]}
                            </div>
                          </div>
                        ) : isCompleted ? (
                          <button
                            type="button"
                            onClick={() => setReviewTarget({ id: matched.id, name: matched.name })}
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                            data-testid={`review-vendor-${matched.id}`}
                          >
                            <MessageSquarePlus className="w-3.5 h-3.5" aria-hidden="true" />
                            {t("vendors_page.leave_review")}
                          </button>
                        ) : (
                          <span className="text-neutral-400 inline-flex items-center gap-1">
                            <Star className="w-3 h-3" aria-hidden="true" />
                            {t("vendors_page.after_wedding")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => del.mutate(v.id)}
                          className="text-neutral-400 hover:text-primary transition-colors"
                          aria-label={t("prestataires.delete", { defaultValue: "Supprimer" })}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {externalVendors.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-neutral-400">
                      {t("vendors_page.empty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Picker modal */}
      <VendorPickerModal
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={(v) => startConv.mutate(v.id)}
        loading={startConv.isPending}
        vendors={marketplaceVendors}
      />

      {/* Review modal */}
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
