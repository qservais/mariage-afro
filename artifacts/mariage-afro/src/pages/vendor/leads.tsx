import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Phone, Calendar, MessageSquare, X } from "lucide-react";
import { vendorApi } from "@/lib/vendorApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface VendorLead {
  id: number;
  vendorId: number;
  vendorAccountId: number | null;
  requestType: "quote" | "availability" | "booking" | "zoom" | "rdv" | string;
  name: string;
  email: string;
  phone: string | null;
  weddingDate: string | null;
  message: string | null;
  status: "new" | "seen" | "contacted" | "won" | "lost" | string;
  internalNote: string | null;
  seenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUSES = ["new", "seen", "contacted", "won", "lost"] as const;
const TYPES = ["quote", "availability", "booking", "zoom", "rdv"] as const;

const STATUS_BADGE: Record<string, string> = {
  new: "bg-amber-100 text-amber-800 border-amber-200",
  seen: "bg-blue-100 text-blue-800 border-blue-200",
  contacted: "bg-violet-100 text-violet-800 border-violet-200",
  won: "bg-emerald-100 text-emerald-800 border-emerald-200",
  lost: "bg-stone-100 text-stone-700 border-stone-200",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function VendorLeadsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>("");

  const { data: leads = [], isLoading } = useQuery<VendorLead[]>({
    queryKey: ["vendor", "leads"],
    queryFn: () => vendorApi.get<VendorLead[]>("/api/vendor/leads"),
  });

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (typeFilter !== "all" && l.requestType !== typeFilter) return false;
      return true;
    });
  }, [leads, statusFilter, typeFilter]);

  const selected = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? null,
    [leads, selectedId],
  );

  useEffect(() => {
    setNoteDraft(selected?.internalNote ?? "");
  }, [selected?.id, selected?.internalNote]);

  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; status?: string; internalNote?: string | null; markSeen?: boolean }) =>
      vendorApi.patch<VendorLead>(`/api/vendor/leads/${vars.id}`, {
        status: vars.status,
        internalNote: vars.internalNote,
        markSeen: vars.markSeen,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor", "leads"] });
      qc.invalidateQueries({ queryKey: ["vendor", "leads", "unseen"] });
    },
    onError: () => toast({ title: t("vendor.leads.error"), variant: "destructive" }),
  });

  function openLead(lead: VendorLead) {
    setSelectedId(lead.id);
    if (lead.status === "new") {
      updateMutation.mutate({ id: lead.id, markSeen: true });
    }
  }

  function setStatus(lead: VendorLead, status: string) {
    updateMutation.mutate({ id: lead.id, status });
  }

  function saveNote() {
    if (!selected) return;
    updateMutation.mutate(
      { id: selected.id, internalNote: noteDraft },
      { onSuccess: () => toast({ title: t("vendor.leads.note_saved") }) },
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <header>
        <h1 className="font-display text-2xl md:text-3xl text-wine-deep">{t("vendor.leads.title")}</h1>
        <p className="text-sm text-neutral-600 mt-1">{t("vendor.leads.subtitle")}</p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs uppercase tracking-widest text-neutral-500">
            {t("vendor.leads.filter_status")}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-neutral-300 px-3 py-2 text-sm rounded-none bg-white"
            data-testid="select-leads-status-filter"
          >
            <option value="all">{t("vendor.leads.all")}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{t(`vendor.leads.status.${s}`)}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs uppercase tracking-widest text-neutral-500">
            {t("vendor.leads.filter_type")}
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-neutral-300 px-3 py-2 text-sm rounded-none bg-white"
            data-testid="select-leads-type-filter"
          >
            <option value="all">{t("vendor.leads.all")}</option>
            {TYPES.map((s) => (
              <option key={s} value={s}>{t(`vendor.leads.type.${s}`)}</option>
            ))}
          </select>
        </div>
        <span className="text-xs text-neutral-500 ml-auto">
          {t("vendor.leads.count", { count: filtered.length })}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        {/* Table */}
        <div className="bg-white border border-neutral-200 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-neutral-500">
              <Loader2 className="w-5 h-5 mx-auto animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">
              <p>{t("vendor.leads.empty")}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr className="text-left text-xs uppercase tracking-widest text-neutral-500">
                  <th className="px-4 py-3">{t("vendor.leads.col_date")}</th>
                  <th className="px-4 py-3">{t("vendor.leads.col_name")}</th>
                  <th className="px-4 py-3">{t("vendor.leads.col_type")}</th>
                  <th className="px-4 py-3">{t("vendor.leads.col_status")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => openLead(lead)}
                    className={`border-b border-neutral-100 cursor-pointer hover:bg-amber-50/40 transition-colors ${
                      selectedId === lead.id ? "bg-amber-50/60" : ""
                    } ${lead.status === "new" ? "font-semibold" : ""}`}
                    data-testid={`row-lead-${lead.id}`}
                  >
                    <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-wine-deep">
                      <div>{lead.name}</div>
                      <div className="text-xs text-neutral-500 font-normal">{lead.email}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {t(`vendor.leads.type.${lead.requestType}`)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] uppercase tracking-widest border px-2 py-1 ${STATUS_BADGE[lead.status] ?? ""}`}>
                        {t(`vendor.leads.status.${lead.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        <aside className="bg-white border border-neutral-200 p-6 self-start sticky top-6">
          {!selected ? (
            <p className="text-sm text-neutral-500 text-center py-8">
              {t("vendor.leads.detail_empty")}
            </p>
          ) : (
            <div className="space-y-5" data-testid="panel-lead-detail">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-widest text-neutral-500">
                    {t(`vendor.leads.type.${selected.requestType}`)}
                  </p>
                  <h3 className="font-display text-xl text-wine-deep mt-1">{selected.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  aria-label="Close"
                  className="p-1 text-neutral-400 hover:text-wine-deep"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-wine-deep hover:underline">
                  <Mail className="w-4 h-4" /> {selected.email}
                </a>
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-wine-deep hover:underline">
                    <Phone className="w-4 h-4" /> {selected.phone}
                  </a>
                )}
                {selected.weddingDate && (
                  <div className="flex items-center gap-2 text-neutral-700">
                    <Calendar className="w-4 h-4" /> {selected.weddingDate}
                  </div>
                )}
              </div>

              {selected.message && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> {t("vendor.leads.message_label")}
                  </p>
                  <p className="text-sm bg-neutral-50 p-3 whitespace-pre-wrap leading-relaxed">
                    {selected.message}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2">
                  {t("vendor.leads.status_label")}
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(selected, s)}
                      disabled={updateMutation.isPending && updateMutation.variables?.id === selected.id}
                      className={`text-xs uppercase tracking-wider px-2 py-2 border transition-colors ${
                        selected.status === s
                          ? "bg-wine-deep text-cream border-wine-deep"
                          : "bg-white text-neutral-700 border-neutral-300 hover:border-wine-deep"
                      }`}
                      data-testid={`button-status-${s}`}
                    >
                      {t(`vendor.leads.status.${s}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2">
                  {t("vendor.leads.internal_note")}
                </p>
                <Textarea
                  rows={4}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder={t("vendor.leads.note_placeholder")}
                  className="rounded-none"
                  data-testid="textarea-internal-note"
                />
                <Button
                  onClick={saveNote}
                  disabled={updateMutation.isPending || (noteDraft ?? "") === (selected.internalNote ?? "")}
                  className="mt-2 w-full bg-wine-deep text-cream hover:bg-wine-deep/90 rounded-none uppercase tracking-wider"
                  data-testid="button-save-note"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t("vendor.leads.save_note")
                  )}
                </Button>
              </div>

              <p className="text-[10px] uppercase tracking-widest text-neutral-400 pt-2 border-t border-neutral-100">
                {t("vendor.leads.received_on")} {formatDate(selected.createdAt)}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
