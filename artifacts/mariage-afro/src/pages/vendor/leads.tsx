import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Phone, Calendar, MessageSquare, X, LayoutGrid, List } from "lucide-react";
import { vendorApi } from "@/lib/vendorApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface VendorSettingsResp { autoFollowupEnabled: boolean; customLeadTags: string[] }

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
  status: "new" | "seen" | "contacted" | "devis_envoye" | "won" | "lost" | string;
  tags: string[];
  internalNote: string | null;
  seenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// 5-column Kanban (per spec). "seen" is auto-set when a vendor opens a "new" lead and is not a manual column.
const KANBAN_STATUSES = ["new", "contacted", "devis_envoye", "won", "lost"] as const;
const STATUSES = ["new", "seen", "contacted", "devis_envoye", "won", "lost"] as const;
const TYPES = ["quote", "availability", "booking", "zoom", "rdv"] as const;
const LEAD_TAGS = ["hot", "vip", "follow_up", "negotiation", "cold"] as const;

const STATUS_BADGE: Record<string, string> = {
  new: "bg-amber-100 text-amber-800 border-amber-200",
  seen: "bg-blue-100 text-blue-800 border-blue-200",
  contacted: "bg-violet-100 text-violet-800 border-violet-200",
  devis_envoye: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
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
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  const { data: leads = [], isLoading } = useQuery<VendorLead[]>({
    queryKey: ["vendor", "leads"],
    queryFn: () => vendorApi.get<VendorLead[]>("/api/vendor/leads"),
  });

  const { data: vendorSettings } = useQuery<VendorSettingsResp>({
    queryKey: ["vendor", "settings"],
    queryFn: () => vendorApi.get<VendorSettingsResp>("/api/vendor/settings"),
  });
  const customTags = vendorSettings?.customLeadTags ?? [];

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
    mutationFn: (vars: { id: number; status?: string; internalNote?: string | null; tags?: string[]; markSeen?: boolean }) =>
      vendorApi.patch<VendorLead>(`/api/vendor/leads/${vars.id}`, {
        status: vars.status,
        internalNote: vars.internalNote,
        tags: vars.tags,
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

  function toggleTag(lead: VendorLead, tag: string) {
    const current = lead.tags ?? [];
    const next = current.includes(tag) ? current.filter((tt) => tt !== tag) : [...current, tag];
    updateMutation.mutate({ id: lead.id, tags: next });
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
        <div className="inline-flex border border-neutral-300 bg-white" role="tablist" aria-label="View toggle">
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-2 text-xs uppercase tracking-wider flex items-center gap-1.5 ${viewMode === "table" ? "bg-wine-deep text-cream" : "text-wine-deep"}`}
            data-testid="button-view-table"
            aria-pressed={viewMode === "table"}
          >
            <List className="w-3.5 h-3.5" /> {t("vendor.leads.view_table")}
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`px-3 py-2 text-xs uppercase tracking-wider flex items-center gap-1.5 border-l border-neutral-300 ${viewMode === "kanban" ? "bg-wine-deep text-cream" : "text-wine-deep"}`}
            data-testid="button-view-kanban"
            aria-pressed={viewMode === "kanban"}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> {t("vendor.leads.view_kanban")}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        {viewMode === "kanban" ? (
          <div className="overflow-x-auto" data-testid="kanban-board">
            <div className="grid grid-flow-col auto-cols-[15rem] gap-3">
              {KANBAN_STATUSES.map((s) => {
                const col = filtered.filter((l) => l.status === s || (s === "new" && l.status === "seen"));
                return (
                  <div
                    key={s}
                    className="bg-neutral-50 border border-neutral-200 p-2 min-h-[20rem]"
                    data-testid={`kanban-col-${s}`}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const id = Number(e.dataTransfer.getData("text/plain"));
                      const lead = leads.find((l) => l.id === id);
                      if (lead && lead.status !== s) updateMutation.mutate({ id, status: s });
                    }}
                  >
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className={`inline-block text-[10px] uppercase tracking-widest border px-2 py-1 ${STATUS_BADGE[s] ?? ""}`}>
                        {t(`vendor.leads.status.${s}`)}
                      </span>
                      <span className="text-xs text-neutral-500">{col.length}</span>
                    </div>
                    <div className="space-y-2">
                      {col.map((lead) => (
                        <button
                          key={lead.id}
                          onClick={() => openLead(lead)}
                          draggable
                          onDragStart={(e) => { e.dataTransfer.setData("text/plain", String(lead.id)); e.dataTransfer.effectAllowed = "move"; }}
                          className={`w-full text-left bg-white border p-2.5 hover:border-wine-deep transition-colors cursor-grab active:cursor-grabbing ${selectedId === lead.id ? "border-wine-deep" : "border-neutral-200"}`}
                          data-testid={`kanban-card-${lead.id}`}
                        >
                          <p className="text-xs text-neutral-500">{formatDate(lead.createdAt)}</p>
                          <p className="text-sm font-medium text-wine-deep mt-0.5">{lead.name}</p>
                          <p className="text-[11px] text-neutral-500 mt-1">{t(`vendor.leads.type.${lead.requestType}`)}</p>
                          {(lead.tags ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {(lead.tags ?? []).map((tag) => (
                                <span key={tag} className="text-[10px] bg-gold/15 text-wine-deep px-1.5 py-0.5">
                                  {t(`vendor.leads.tags.${tag}`, tag)}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
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
        )}

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
                  aria-label={t("vendor.leads.close", { defaultValue: "Fermer" })}
                  className="p-1 text-neutral-400 hover:text-wine-deep"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
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
                  {t("vendor.leads.tags_label")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {LEAD_TAGS.map((tag) => {
                    const active = (selected.tags ?? []).includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(selected, tag)}
                        disabled={updateMutation.isPending}
                        className={`text-[11px] uppercase tracking-wider px-2.5 py-1 border transition-colors ${
                          active
                            ? "bg-gold/20 border-gold text-wine-deep"
                            : "bg-white border-neutral-300 text-neutral-600 hover:border-gold"
                        }`}
                        data-testid={`button-tag-${tag}`}
                      >
                        {t(`vendor.leads.tags.${tag}`)}
                      </button>
                    );
                  })}
                  {customTags.map((tag) => {
                    const active = (selected.tags ?? []).includes(tag);
                    return (
                      <button
                        key={`custom-${tag}`}
                        onClick={() => toggleTag(selected, tag)}
                        disabled={updateMutation.isPending}
                        className={`text-[11px] uppercase tracking-wider px-2.5 py-1 border transition-colors ${
                          active
                            ? "bg-gold/30 border-gold text-wine-deep"
                            : "bg-white border-gold/40 text-wine-deep/80 hover:border-gold"
                        }`}
                        data-testid={`button-custom-tag-${tag}`}
                        title={t("vendor.settings.custom_tags_title")}
                      >
                        {tag}
                      </button>
                    );
                  })}
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
