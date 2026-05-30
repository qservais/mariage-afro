import { Fragment, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Phone, Calendar, MessageSquare, X, LayoutGrid, List, FileText, Tag, GripVertical } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import type { KeyboardCoordinateGetter, SensorContext } from "@dnd-kit/core";
import { vendorApi } from "@/lib/vendorApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CATEGORY_CONFIG } from "@/lib/vendorCategoryConfig";

/** Build a flat key→French-label map from CATEGORY_CONFIG for structured field display. */
const FIELD_LABEL_MAP: Record<string, string> = Object.values(CATEGORY_CONFIG).reduce(
  (acc, cfg) => {
    for (const f of cfg.quoteFields) {
      if (!acc[f.key]) acc[f.key] = f.labelFr;
    }
    return acc;
  },
  {} as Record<string, string>,
);

/**
 * Split a message field into the couple's free-text message and the
 * structured category-specific fields appended by the API.
 */
function parseCategoryFields(message: string | null): {
  mainMessage: string | null;
  fields: Array<[string, string]>;
} {
  if (!message) return { mainMessage: null, fields: [] };
  const SEP = "--- Informations spécifiques ---";
  const idx = message.indexOf(SEP);
  if (idx === -1) return { mainMessage: message.trim() || null, fields: [] };
  const mainMessage = message.slice(0, idx).trim() || null;
  const fieldsPart = message.slice(idx + SEP.length).trim();
  const fields: Array<[string, string]> = fieldsPart
    .split("\n")
    .filter(Boolean)
    .flatMap((line) => {
      const colon = line.indexOf(": ");
      if (colon === -1) return [];
      return [[line.slice(0, colon).trim(), line.slice(colon + 2).trim()] as [string, string]];
    });
  return { mainMessage, fields };
}

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
  new: "bg-gold/10 text-gold-deep border-gold/30",
  seen: "bg-wine-deep/5 text-wine-deep border-wine-deep/20",
  contacted: "bg-wine-deep/10 text-wine-deep border-wine-deep/30",
  devis_envoye: "bg-gold/15 text-gold-deep border-gold/40",
  won: "bg-gold/20 text-gold-deep border-gold/40",
  lost: "bg-neutral-100 text-neutral-500 border-neutral-200",
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

/**
 * Custom keyboard coordinate getter for column-to-column kanban navigation.
 * ArrowLeft/ArrowRight move the dragged card to adjacent columns.
 */
const kanbanKeyboardCoordinateGetter: KeyboardCoordinateGetter = (
  event: KeyboardEvent,
  { context: { droppableRects, over, active } }: { active: string | number; currentCoordinates: { x: number; y: number }; context: SensorContext },
) => {
  if (!["ArrowLeft", "ArrowRight"].includes(event.code)) return undefined;
  event.preventDefault();

  const columns = [...KANBAN_STATUSES] as string[];
  const currentId =
    (over?.id as string | undefined) ??
    (active?.data?.current?.currentStatus as string | undefined);
  const currentIdx = currentId ? columns.indexOf(currentId) : -1;

  let targetIdx = currentIdx;
  if (event.code === "ArrowLeft") targetIdx = Math.max(0, currentIdx <= 0 ? 0 : currentIdx - 1);
  if (event.code === "ArrowRight")
    targetIdx = Math.min(columns.length - 1, currentIdx < 0 ? 0 : currentIdx + 1);

  if (targetIdx === currentIdx && currentIdx !== -1) return undefined;
  const effectiveIdx = targetIdx < 0 ? 0 : targetIdx;

  const rect = droppableRects.get(columns[effectiveIdx]);
  if (!rect) return undefined;
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

// ─── Sub-components for Kanban ────────────────────────────────────────────────

interface KanbanCardProps {
  lead: VendorLead;
  selectedId: number | null;
  colStatus: string;
  colIndex: number;
  colTotal: number;
  onOpen: (lead: VendorLead) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

function KanbanCard({ lead, selectedId, colStatus, colIndex, colTotal, onOpen, t }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(lead.id),
    data: { leadId: lead.id, currentStatus: colStatus },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
    : undefined;

  const cardAriaLabel = `${lead.name} — ${t(`vendor.leads.status.${colStatus}`)}, position ${colIndex + 1} sur ${colTotal}`;
  const handleAriaLabel = `${t("vendor.leads.drag_handle", { defaultValue: "Déplacer" })} ${lead.name} — ${t(`vendor.leads.status.${colStatus}`)}, ${colIndex + 1}/${colTotal}. Espace pour saisir, flèches pour changer de colonne, Échap pour annuler.`;

  return (
    <div
      role="listitem"
      style={style}
      aria-label={cardAriaLabel}
      className={`relative bg-cream border transition-colors ${isDragging ? "opacity-40 border-wine-deep" : selectedId === lead.id ? "border-wine-deep" : "border-neutral-200"}`}
      data-testid={`kanban-card-${lead.id}`}
    >
      {/* Drag handle — keyboard-focusable, activates @dnd-kit drag */}
      <button
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        aria-label={handleAriaLabel}
        className="absolute top-2 left-1.5 p-0.5 text-neutral-300 hover:text-neutral-600 cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-deep focus-visible:ring-offset-1"
        tabIndex={0}
      >
        <GripVertical className="w-3 h-3" aria-hidden="true" />
      </button>

      {/* Card body — opens detail panel */}
      <button
        onClick={() => onOpen(lead)}
        className="w-full text-left pl-6 pr-2.5 py-2.5 hover:bg-cream-soft focus:outline-none focus-visible:bg-cream-soft"
        tabIndex={0}
        aria-label={`${t("vendor.leads.open_lead", { defaultValue: "Ouvrir" })} ${lead.name}`}
      >
        <p className="text-xs text-neutral-500">{formatDate(lead.createdAt)}</p>
        <p className="text-sm font-medium text-wine-deep mt-0.5">{lead.name}</p>
        <p className="text-[11px] text-neutral-500 mt-1">{t(`vendor.leads.type.${lead.requestType}`)}</p>
        {(lead.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {(lead.tags ?? []).map((tag) => (
              <span key={tag} className="text-[10px] bg-gold/15 text-wine-deep px-1.5 py-0.5">
                {t(`vendor.leads.tags.${tag}`, { defaultValue: tag })}
              </span>
            ))}
          </div>
        )}
      </button>
    </div>
  );
}

interface KanbanColumnProps {
  status: string;
  leads: VendorLead[];
  selectedId: number | null;
  onOpen: (lead: VendorLead) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

function KanbanColumn({ status, leads, selectedId, onOpen, t }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      role="list"
      aria-label={`${t(`vendor.leads.status.${status}`)} — ${leads.length} carte${leads.length !== 1 ? "s" : ""}`}
      className={`bg-neutral-50 border p-2 min-h-[20rem] transition-colors ${isOver ? "border-wine-deep/60 bg-wine-deep/5" : "border-neutral-200"}`}
      data-testid={`kanban-col-${status}`}
    >
      <div className="flex items-center justify-between mb-2 px-1">
        <span className={`inline-block text-[10px] uppercase tracking-widest border px-2 py-1 ${STATUS_BADGE[status] ?? ""}`}>
          {t(`vendor.leads.status.${status}`)}
        </span>
        <span className="text-xs text-neutral-500" aria-hidden="true">{leads.length}</span>
      </div>
      <div className="space-y-2">
        {leads.map((lead, i) => (
          <KanbanCard
            key={lead.id}
            lead={lead}
            selectedId={selectedId}
            colStatus={status}
            colIndex={i}
            colTotal={leads.length}
            onOpen={onOpen}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VendorLeadsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

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

  // dnd-kit sensors: pointer (mouse/touch) + keyboard
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: kanbanKeyboardCoordinateGetter }),
  );

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;
    const leadId = Number(active.id);
    const newStatus = over.id as string;
    const lead = leads.find((l) => l.id === leadId);
    if (lead && lead.status !== newStatus) {
      updateMutation.mutate({ id: leadId, status: newStatus });
    }
  }

  const activeDragLead = activeDragId ? leads.find((l) => l.id === Number(activeDragId)) ?? null : null;

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
            className="border border-neutral-300 px-3 py-2 text-sm rounded-none bg-cream"
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
            className="border border-neutral-300 px-3 py-2 text-sm rounded-none bg-cream"
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
        <div className="inline-flex border border-neutral-300 bg-cream" role="group" aria-label={t("vendor.leads.view_toggle_label", { defaultValue: "Changer la vue" })}>
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
          <DndContext
            sensors={sensors}
            onDragStart={(e) => setActiveDragId(String(e.active.id))}
            onDragCancel={() => setActiveDragId(null)}
            onDragEnd={handleDragEnd}
          >
            <div className="overflow-x-auto" data-testid="kanban-board">
              <div className="grid grid-flow-col auto-cols-[15rem] gap-3">
                {KANBAN_STATUSES.map((s) => {
                  const col = filtered.filter((l) => l.status === s || (s === "new" && l.status === "seen"));
                  return (
                    <KanbanColumn
                      key={s}
                      status={s}
                      leads={col}
                      selectedId={selectedId}
                      onOpen={openLead}
                      t={t as (key: string, opts?: Record<string, unknown>) => string}
                    />
                  );
                })}
              </div>
            </div>

            {/* Overlay shown while dragging (mouse) */}
            <DragOverlay>
              {activeDragLead ? (
                <div className="bg-cream border border-wine-deep shadow-lg p-2.5 w-[14rem] opacity-95 rotate-1">
                  <p className="text-xs text-neutral-500">{formatDate(activeDragLead.createdAt)}</p>
                  <p className="text-sm font-medium text-wine-deep mt-0.5">{activeDragLead.name}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">{t(`vendor.leads.type.${activeDragLead.requestType}`)}</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
        <div className="bg-cream border border-neutral-200 overflow-hidden">
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
                    className={`border-b border-neutral-100 cursor-pointer hover:bg-cream-soft transition-colors ${
                      selectedId === lead.id ? "bg-gold/5" : ""
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
        <aside className="bg-cream border border-neutral-200 p-6 self-start sticky top-6">
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

              {(() => {
                const { mainMessage, fields } = parseCategoryFields(selected.message);
                return (
                  <>
                    {mainMessage && (
                      <div>
                        <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" /> {t("vendor.leads.message_label")}
                        </p>
                        <p className="text-sm bg-neutral-50 p-3 whitespace-pre-wrap leading-relaxed">
                          {mainMessage}
                        </p>
                      </div>
                    )}
                    {fields.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" /> Informations spécifiques
                        </p>
                        <dl className="bg-neutral-50 p-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                          {fields.map(([key, value]) => (
                            <Fragment key={key}>
                              <dt className="text-neutral-500 font-medium whitespace-nowrap">
                                {FIELD_LABEL_MAP[key] ?? key}
                              </dt>
                              <dd className="text-neutral-800">
                                {value}
                              </dd>
                            </Fragment>
                          ))}
                        </dl>
                      </div>
                    )}
                  </>
                );
              })()}

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
                      aria-pressed={selected.status === s}
                      className={`text-xs uppercase tracking-wider px-2 py-2 border transition-colors ${
                        selected.status === s
                          ? "bg-wine-deep text-cream border-wine-deep"
                          : "bg-cream-soft text-neutral-700 border-neutral-300 hover:border-wine-deep"
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
                        aria-pressed={active}
                        className={`text-[11px] uppercase tracking-wider px-2.5 py-1 border transition-colors ${
                          active
                            ? "bg-gold/20 border-gold text-wine-deep"
                            : "bg-cream-soft border-neutral-300 text-neutral-600 hover:border-gold"
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
                        aria-pressed={active}
                        className={`text-[11px] uppercase tracking-wider px-2.5 py-1 border transition-colors ${
                          active
                            ? "bg-gold/30 border-gold text-wine-deep"
                            : "bg-cream-soft border-gold/40 text-wine-deep/80 hover:border-gold"
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

              <div className="pt-2 border-t border-neutral-100">
                <Button
                  onClick={() => {
                    const params = new URLSearchParams({ email: selected.email, name: selected.name, leadId: String(selected.id) });
                    navigate(`/espace-pro/devis?${params.toString()}`);
                  }}
                  className="w-full bg-wine-deep text-cream hover:bg-wine-deep/90 rounded-none uppercase tracking-wider gap-2 text-xs"
                  data-testid="button-send-quote"
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  {t("vendor.leads.send_quote", { defaultValue: "Envoyer un devis" })}
                </Button>
              </div>

              <p className="text-[10px] uppercase tracking-widest text-neutral-400 border-t border-neutral-100 pt-2">
                {t("vendor.leads.received_on")} {formatDate(selected.createdAt)}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
