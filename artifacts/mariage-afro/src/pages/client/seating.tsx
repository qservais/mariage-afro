import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resolveColor } from "@/lib/brand-colors";
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Plus, Trash2, Search, Download, X, Pencil, FileText } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Guest, GuestTable, GuestTableCreate, GuestTablePatch } from "@/lib/clientTypes";

interface DraggableGuestProps {
  guest: Guest;
  inTable?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
  onToggleArrived?: () => void;
  arrivedLabel?: string;
}

function DraggableGuest({ guest, inTable, onRemove, removeLabel, onToggleArrived, arrivedLabel }: DraggableGuestProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `guest-${guest.id}`,
    data: { guestId: guest.id },
  });
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex items-center justify-between gap-2 px-3 py-2 text-sm bg-cream border border-wine-deep/10 cursor-grab active:cursor-grabbing select-none ${inTable ? "" : "hover:border-primary"}`}
      data-testid={`guest-card-${guest.id}`}
    >
      {onToggleArrived && (
        <input
          type="checkbox"
          checked={guest.arrived}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => { e.stopPropagation(); onToggleArrived(); }}
          className="w-3.5 h-3.5 shrink-0 accent-primary cursor-pointer"
          aria-label={arrivedLabel}
          title={arrivedLabel}
          data-testid={`arrived-${guest.id}`}
        />
      )}
      <span className={`truncate flex-1 ${guest.arrived ? "line-through text-wine-deep/40" : ""}`}>
        {guest.firstName} {guest.lastName}
      </span>
      {inTable && onRemove && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="text-wine-deep/40 hover:text-primary"
          aria-label={removeLabel ?? "Remove"}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

interface DroppableTableProps {
  table: GuestTable;
  seated: Guest[];
  onRename: (name: string) => void;
  onCapacity: (capacity: number) => void;
  onShape: (shape: GuestTable["shape"]) => void;
  onDelete: () => void;
  onRemoveGuest: (guestId: number) => void;
  onToggleArrived: (guestId: number, arrived: boolean) => void;
  shapeLabels: Record<GuestTable["shape"], string>;
  labels: {
    full: string;
    free: (n: number) => string;
    deleteTable: string;
    capacity: string;
    dropHere: string;
    chairFree: string;
    chairsAria: (s: number, c: number) => string;
    remove: string;
    arrived: string;
  };
}

function DroppableTable({ table, seated, onRename, onCapacity, onShape, onDelete, onRemoveGuest, onToggleArrived, shapeLabels, labels }: DroppableTableProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `table-${table.id}`,
    data: { tableId: table.id },
  });
  const [editing, setEditing] = useState(false);
  const free = Math.max(0, table.capacity - seated.length);
  const full = seated.length >= table.capacity;
  const shapeClass =
    table.shape === "round"
      ? "rounded-full"
      : table.shape === "square"
        ? "rounded-md aspect-square"
        : "rounded-md";

  return (
    <div
      ref={setNodeRef}
      className={`bg-cream border-2 ${isOver ? "border-primary" : full ? "border-rose-300" : "border-wine-deep/10"} p-4 transition-colors`}
      data-testid={`table-${table.id}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              defaultValue={table.name}
              onBlur={(e) => { onRename(e.target.value || table.name); setEditing(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              className="font-semibold text-base border-b border-primary outline-none w-full"
            />
          ) : (
            <button onClick={() => setEditing(true)} className="font-semibold text-base text-left flex items-center gap-2 hover:text-primary">
              {table.name} <Pencil className="w-3 h-3 opacity-40" />
            </button>
          )}
          <p className="text-xs text-wine-deep/50 mt-0.5">
            {shapeLabels[table.shape]} · {seated.length}/{table.capacity} {full ? labels.full : labels.free(free)}
          </p>
        </div>
        <button onClick={onDelete} className="text-wine-deep/40 hover:text-primary" aria-label={labels.deleteTable}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 mb-3 text-xs">
        <select
          value={table.shape}
          onChange={(e) => onShape(e.target.value as GuestTable["shape"])}
          className="border border-wine-deep/20 px-2 py-1 text-xs"
        >
          <option value="round">{shapeLabels.round}</option>
          <option value="rect">{shapeLabels.rect}</option>
          <option value="square">{shapeLabels.square}</option>
        </select>
        <input
          type="number"
          min={1}
          max={40}
          defaultValue={table.capacity}
          onBlur={(e) => {
            const v = Math.max(1, Math.min(40, Number(e.target.value) || table.capacity));
            if (v !== table.capacity) onCapacity(v);
          }}
          className="border border-wine-deep/20 px-2 py-1 text-xs w-20"
          aria-label={labels.capacity}
        />
      </div>

      <div
        className={`min-h-[140px] p-3 ${shapeClass} bg-background/40 border border-dashed border-wine-deep/20 flex flex-col gap-1.5`}
      >
        {seated.map((g) => (
          <DraggableGuest
            key={g.id}
            guest={g}
            inTable
            onRemove={() => onRemoveGuest(g.id)}
            removeLabel={labels.remove}
            onToggleArrived={() => onToggleArrived(g.id, !g.arrived)}
            arrivedLabel={labels.arrived}
          />
        ))}
        {seated.length === 0 && (
          <p className="text-xs text-wine-deep/40 text-center my-auto">{labels.dropHere}</p>
        )}
      </div>

      <div
        className="mt-3 flex flex-wrap gap-1.5 justify-center"
        aria-label={labels.chairsAria(seated.length, table.capacity)}
        data-testid={`chairs-${table.id}`}
      >
        {Array.from({ length: table.capacity }).map((_, i) => {
          const occupied = i < seated.length;
          return (
            <span
              key={i}
              title={occupied ? seated[i] && `${seated[i].firstName} ${seated[i].lastName}` : labels.chairFree}
              className={`w-3 h-3 rounded-full border ${occupied ? "bg-primary border-primary" : "bg-cream border-wine-deep/20"}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function UnassignedDropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned", data: { tableId: null } });
  return (
    <div
      ref={setNodeRef}
      className={`bg-cream border-2 ${isOver ? "border-primary" : "border-wine-deep/10"} p-3 min-h-[100px]`}
    >
      {children}
    </div>
  );
}

export default function SeatingPage() {
  const { t } = useTranslation();
  const SHAPE_LABEL: Record<GuestTable["shape"], string> = {
    round: t("seating.shape_round"),
    rect: t("seating.shape_rect"),
    square: t("seating.shape_square"),
  };
  const tableLabels = {
    full: t("seating.full"),
    free: (n: number) => t("seating.free", { count: n, defaultValue: `(${n} free)` }),
    deleteTable: t("seating.delete_table"),
    capacity: t("seating.capacity"),
    dropHere: t("seating.drop_here"),
    chairFree: t("seating.chair_free"),
    chairsAria: (s: number, c: number) => t("seating.chairs_aria", { seated: s, capacity: c }),
    remove: t("seating.remove"),
    arrived: t("seating.arrived", { defaultValue: "Arrivé" }),
  };
  const qc = useQueryClient();
  const { data: tables = [] } = useQuery<GuestTable[]>({
    queryKey: ["client", "tables"],
    queryFn: () => clientApi.get<GuestTable[]>("/api/client/tables"),
  });
  const { data: guests = [] } = useQuery<Guest[]>({
    queryKey: ["client", "guests"],
    queryFn: () => clientApi.get<Guest[]>("/api/client/guests"),
  });

  const [search, setSearch] = useState("");
  const [newTable, setNewTable] = useState<GuestTableCreate>({ name: "", shape: "round", capacity: 8 });
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const createTable = useMutation({
    mutationFn: (b: GuestTableCreate) => clientApi.post<GuestTable>("/api/client/tables", b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", "tables"] });
      setNewTable({ name: "", shape: "round", capacity: 8 });
    },
  });
  const updateTable = useMutation({
    mutationFn: ({ id, body }: { id: number; body: GuestTablePatch }) =>
      clientApi.patch<GuestTable>(`/api/client/tables/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", "tables"] });
      qc.invalidateQueries({ queryKey: ["client", "guests"] });
    },
    onError: (e: Error) => setError(e.message),
  });
  const deleteTable = useMutation({
    mutationFn: (id: number) => clientApi.del(`/api/client/tables/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", "tables"] });
      qc.invalidateQueries({ queryKey: ["client", "guests"] });
    },
  });
  const assignGuest = useMutation({
    mutationFn: ({ guestId, tableId }: { guestId: number; tableId: number | null }) =>
      clientApi.patch<Guest>(`/api/client/guests/${guestId}`, { tableId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "guests"] }),
    onError: (e: Error) => setError(e.message.includes("409") ? t("seating.table_full_error") : e.message),
  });
  const setArrived = useMutation({
    mutationFn: ({ guestId, arrived }: { guestId: number; arrived: boolean }) =>
      clientApi.patch<Guest>(`/api/client/guests/${guestId}`, { arrived }),
    onMutate: async ({ guestId, arrived }) => {
      await qc.cancelQueries({ queryKey: ["client", "guests"] });
      const prev = qc.getQueryData<Guest[]>(["client", "guests"]);
      qc.setQueryData<Guest[]>(["client", "guests"], (old) =>
        (old ?? []).map((g) => (g.id === guestId ? { ...g, arrived } : g)),
      );
      return { prev };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["client", "guests"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["client", "guests"] }),
  });

  const confirmedGuests = useMemo(() => guests.filter((g) => g.rsvp === "confirmed"), [guests]);
  const unassigned = useMemo(
    () =>
      confirmedGuests
        .filter((g) => g.tableId == null)
        .filter((g) =>
          search ? `${g.firstName} ${g.lastName}`.toLowerCase().includes(search.toLowerCase()) : true,
        ),
    [confirmedGuests, search],
  );
  const guestsByTable = useMemo(() => {
    const m = new Map<number, Guest[]>();
    for (const g of confirmedGuests) {
      if (g.tableId != null) {
        if (!m.has(g.tableId)) m.set(g.tableId, []);
        m.get(g.tableId)!.push(g);
      }
    }
    return m;
  }, [confirmedGuests]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    setError(null);
    const guestId = event.active.data.current?.guestId as number | undefined;
    const tableId = event.over?.data.current?.tableId as number | null | undefined;
    if (guestId == null || tableId === undefined) return;
    const guest = guests.find((g) => g.id === guestId);
    if (!guest) return;
    if (guest.tableId === tableId) return;
    assignGuest.mutate({ guestId, tableId });
  };

  const handleExportCsv = () => {
    const yes = t("seating.arrived_yes", { defaultValue: "Oui" });
    const no = t("seating.arrived_no", { defaultValue: "Non" });
    const notPlaced = t("seating.not_placed", { defaultValue: "Non placés" });
    const cell = (v: string | number) => {
      const s = String(v ?? "");
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows: string[] = [
      [t("seating.csv_table"), t("seating.csv_shape"), t("seating.csv_capacity"), t("seating.csv_first_name"), t("seating.csv_last_name"), t("seating.csv_arrived")].map(cell).join(","),
    ];
    for (const table of tables) {
      const shape = SHAPE_LABEL[table.shape];
      const seated = guestsByTable.get(table.id) ?? [];
      if (seated.length === 0) {
        rows.push([table.name, shape, table.capacity, "", "", ""].map(cell).join(","));
      } else {
        for (const g of seated) {
          rows.push(
            [table.name, shape, table.capacity, g.firstName, g.lastName, g.arrived ? yes : no]
              .map(cell)
              .join(","),
          );
        }
      }
    }
    const unassignedGuests = confirmedGuests.filter((g) => g.tableId == null);
    if (unassignedGuests.length > 0) {
      rows.push("");
      for (const g of unassignedGuests) {
        rows.push(
          [notPlaced, "", "", g.firstName, g.lastName, g.arrived ? yes : no].map(cell).join(","),
        );
      }
    }
    const blob = new Blob(["\uFEFF" + rows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `plan-de-table-${new Date().toISOString().slice(0, 10)}.csv`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    if (!canvasRef.current) return;
    const canvas = await html2canvas(canvasRef.current, { backgroundColor: resolveColor("--color-white"), scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const orientation = canvas.width >= canvas.height ? "landscape" : "portrait";
    const pdf = new jsPDF({ orientation, unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 24;
    const availW = pageW - margin * 2;
    const availH = pageH - margin * 2;
    const ratio = Math.min(availW / canvas.width, availH / canvas.height);
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;
    pdf.addImage(imgData, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
    pdf.save(`plan-de-table-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTable.name.trim()) return;
    createTable.mutate({
      name: newTable.name.trim(),
      shape: newTable.shape,
      capacity: newTable.capacity,
    });
  };

  const seatedCount = confirmedGuests.filter((g) => g.tableId != null).length;
  const totalCapacity = tables.reduce((s, t) => s + t.capacity, 0);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-2xl">{t("seating.title")}</h2>
          <p className="text-sm text-wine-deep/70">
            {t("seating.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-none uppercase tracking-wider text-xs gap-2"
            onClick={handleExportCsv}
            disabled={tables.length === 0 && confirmedGuests.length === 0}
            data-testid="button-export-csv"
          >
            <Download className="w-3 h-3" /> {t("seating.export_list", { defaultValue: "Liste" })}
          </Button>
          <Button
            variant="outline"
            className="rounded-none uppercase tracking-wider text-xs gap-2"
            onClick={handleExportPdf}
            disabled={tables.length === 0}
            data-testid="button-export-pdf"
          >
            <FileText className="w-3 h-3" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-cream p-4 border border-wine-deep/10">
          <p className="text-xs uppercase text-wine-deep/50 tracking-widest">{t("seating.tables")}</p>
          <p className="text-2xl font-bold">{tables.length}</p>
        </div>
        <div className="bg-cream p-4 border border-wine-deep/10">
          <p className="text-xs uppercase text-wine-deep/50 tracking-widest">{t("seating.total_capacity")}</p>
          <p className="text-2xl font-bold">{totalCapacity}</p>
        </div>
        <div className="bg-cream p-4 border border-wine-deep/10">
          <p className="text-xs uppercase text-wine-deep/50 tracking-widest">{t("seating.seated")}</p>
          <p className="text-2xl font-bold text-gold-deep">{seatedCount}</p>
        </div>
        <div className="bg-cream p-4 border border-wine-deep/10">
          <p className="text-xs uppercase text-wine-deep/50 tracking-widest">{t("seating.to_place")}</p>
          <p className="text-2xl font-bold text-wine-deep">
            {confirmedGuests.length - seatedCount}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleAddTable}
        className="bg-cream p-4 border border-wine-deep/10 grid grid-cols-2 lg:grid-cols-5 gap-3"
      >
        <Input
          placeholder={t("seating.name_placeholder")}
          value={newTable.name}
          onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
          required
          data-testid="input-table-name"
        />
        <select
          className="border border-wine-deep/20 px-3 text-sm h-10"
          value={newTable.shape}
          onChange={(e) => setNewTable({ ...newTable, shape: e.target.value as GuestTable["shape"] })}
        >
          <option value="round">{SHAPE_LABEL.round}</option>
          <option value="rect">{SHAPE_LABEL.rect}</option>
          <option value="square">{SHAPE_LABEL.square}</option>
        </select>
        <Input
          type="number"
          min={1}
          max={40}
          placeholder={t("seating.capacity")}
          value={newTable.capacity}
          onChange={(e) => setNewTable({ ...newTable, capacity: Number(e.target.value) || 1 })}
        />
        <Button
          type="submit"
          className="rounded-none uppercase tracking-wider text-xs gap-2 col-span-2 lg:col-span-2"
          data-testid="button-add-table"
        >
          <Plus className="w-3 h-3" /> {t("seating.add_table")}
        </Button>
      </form>

      {error && (
        <div className="bg-primary/5 border border-primary/20 text-primary px-4 py-2 text-sm flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label={t("seating.dismiss_error", { defaultValue: "Fermer" })}>
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Mobile fallback: vertical list with selects */}
      <div className="lg:hidden space-y-4">
        <div className="bg-cream p-4 border border-wine-deep/10">
          <p className="text-xs uppercase tracking-widest text-wine-deep/50 mb-2">{t("seating.to_place")}</p>
          {unassigned.length === 0 ? (
            <p className="text-sm text-wine-deep/40">{t("seating.all_seated")}</p>
          ) : (
            <div className="space-y-2">
              {unassigned.map((g) => (
                <div key={g.id} className="flex items-center justify-between gap-2 text-sm">
                  <label className="flex items-center gap-1.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={g.arrived}
                      onChange={() => setArrived.mutate({ guestId: g.id, arrived: !g.arrived })}
                      className="w-3.5 h-3.5 shrink-0 accent-primary cursor-pointer"
                      aria-label={t("seating.arrived", { defaultValue: "Arrivé" })}
                    />
                    <span className={`truncate ${g.arrived ? "line-through text-wine-deep/40" : ""}`}>{g.firstName} {g.lastName}</span>
                  </label>
                  <select
                    className="border border-wine-deep/20 px-2 py-1 text-xs"
                    value=""
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) assignGuest.mutate({ guestId: g.id, tableId: Number(v) });
                    }}
                    data-testid={`select-assign-${g.id}`}
                  >
                    <option value="">{t("seating.assign_placeholder")}</option>
                    {tables.map((tb) => {
                      const seated = guestsByTable.get(tb.id)?.length ?? 0;
                      return (
                        <option key={tb.id} value={tb.id} disabled={seated >= tb.capacity}>
                          {tb.name} ({seated}/{tb.capacity})
                        </option>
                      );
                    })}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
        {tables.map((tb) => {
          const seated = guestsByTable.get(tb.id) ?? [];
          return (
            <div key={tb.id} className="bg-cream p-4 border border-wine-deep/10">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{tb.name}</p>
                  <p className="text-xs text-wine-deep/50">
                    {SHAPE_LABEL[tb.shape]} · {seated.length}/{tb.capacity}
                  </p>
                </div>
                <button onClick={() => deleteTable.mutate(tb.id)} className="text-wine-deep/40" aria-label={t("seating.delete_table")}>
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              {seated.length === 0 ? (
                <p className="text-xs text-wine-deep/40">{t("seating.no_assigned")}</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {seated.map((g) => (
                    <li key={g.id} className="flex justify-between items-center gap-2">
                      <label className="flex items-center gap-1.5 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={g.arrived}
                          onChange={() => setArrived.mutate({ guestId: g.id, arrived: !g.arrived })}
                          className="w-3.5 h-3.5 shrink-0 accent-primary cursor-pointer"
                          aria-label={t("seating.arrived", { defaultValue: "Arrivé" })}
                        />
                        <span className={`truncate ${g.arrived ? "line-through text-wine-deep/40" : ""}`}>{g.firstName} {g.lastName}</span>
                      </label>
                      <button
                        onClick={() => assignGuest.mutate({ guestId: g.id, tableId: null })}
                        className="text-wine-deep/40"
                        aria-label={t("seating.remove")}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: drag-and-drop layout */}
      <div className="hidden lg:block">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-[280px_1fr] gap-6">
            {/* Left: unassigned guests */}
            <div className="space-y-3">
              <div className="bg-cream p-3 border border-wine-deep/10">
                <div className="flex items-center gap-2 mb-3">
                  <Search className="w-4 h-4 text-wine-deep/40" />
                  <input
                    placeholder={t("seating.search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="text-sm outline-none flex-1"
                    data-testid="input-guest-search"
                  />
                </div>
                <p className="text-xs uppercase tracking-widest text-wine-deep/50 mb-2">
                  {t("seating.to_place_count", { count: unassigned.length })}
                </p>
                <UnassignedDropZone>
                  {unassigned.length === 0 ? (
                    <p className="text-xs text-wine-deep/40 text-center py-4">
                      {confirmedGuests.length === 0
                        ? t("seating.none_confirmed")
                        : t("seating.all_placed")}
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {unassigned.map((g) => (
                        <DraggableGuest
                          key={g.id}
                          guest={g}
                          onToggleArrived={() => setArrived.mutate({ guestId: g.id, arrived: !g.arrived })}
                          arrivedLabel={t("seating.arrived", { defaultValue: "Arrivé" })}
                        />
                      ))}
                    </div>
                  )}
                </UnassignedDropZone>
              </div>
            </div>

            {/* Right: tables canvas */}
            <div ref={canvasRef} className="bg-background/30 p-4 border border-wine-deep/10">
              {tables.length === 0 ? (
                <p className="text-center text-wine-deep/40 py-12">
                  {t("seating.create_first")}
                </p>
              ) : (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                  {tables.map((tb) => (
                    <DroppableTable
                      key={tb.id}
                      table={tb}
                      seated={guestsByTable.get(tb.id) ?? []}
                      onRename={(name) => updateTable.mutate({ id: tb.id, body: { name } })}
                      onCapacity={(capacity) => updateTable.mutate({ id: tb.id, body: { capacity } })}
                      onShape={(shape) => updateTable.mutate({ id: tb.id, body: { shape } })}
                      onDelete={() => {
                        if (confirm(t("seating.confirm_delete", { name: tb.name }))) {
                          deleteTable.mutate(tb.id);
                        }
                      }}
                      onRemoveGuest={(guestId) => assignGuest.mutate({ guestId, tableId: null })}
                      onToggleArrived={(guestId, arrived) => setArrived.mutate({ guestId, arrived })}
                      shapeLabels={SHAPE_LABEL}
                      labels={tableLabels}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </DndContext>
      </div>
    </div>
  );
}
