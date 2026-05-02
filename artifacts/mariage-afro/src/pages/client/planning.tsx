import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PlanningTask, PlanningTaskCreate, PlanningTaskPatch } from "@/lib/clientTypes";

type ViewMode = "list" | "week" | "month";

const LOCALE_MAP: Record<string, string> = { fr: "fr-BE", nl: "nl-BE", en: "en-GB" };

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function PlanningPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || "fr").split("-")[0];
  const locale = LOCALE_MAP[lang] || "fr-BE";
  const days = (t("planning.days", { returnObjects: true }) as unknown as string[]) || ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  const qc = useQueryClient();
  const { data: tasks = [] } = useQuery<PlanningTask[]>({
    queryKey: ["client", "planning"],
    queryFn: () => clientApi.get<PlanningTask[]>("/api/client/planning"),
  });
  const [form, setForm] = useState({ title: "", dueDate: "", assignee: "" });
  const [view, setView] = useState<ViewMode>("list");
  const [cursor, setCursor] = useState(() => new Date());

  const create = useMutation({
    mutationFn: (b: PlanningTaskCreate) => clientApi.post<PlanningTask>("/api/client/planning", b),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client", "planning"] }); setForm({ title: "", dueDate: "", assignee: "" }); },
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: PlanningTaskPatch }) => clientApi.patch<PlanningTask>(`/api/client/planning/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "planning"] }),
  });
  const del = useMutation({
    mutationFn: (id: number) => clientApi.del(`/api/client/planning/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "planning"] }),
  });

  const tasksByDate = useMemo(() => {
    const m = new Map<string, PlanningTask[]>();
    for (const tk of tasks) {
      if (!tk.dueDate) continue;
      const key = tk.dueDate.slice(0, 10);
      const list = m.get(key) ?? [];
      list.push(tk);
      m.set(key, list);
    }
    return m;
  }, [tasks]);

  const sorted = [...tasks].sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

  const weekStart = startOfWeek(cursor);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthStart = startOfMonth(cursor);
  const monthGridStart = startOfWeek(monthStart);
  const monthDays = Array.from({ length: 42 }, (_, i) => addDays(monthGridStart, i));
  const currentMonth = cursor.getMonth();

  const shift = (units: number) => {
    const d = new Date(cursor);
    if (view === "week") d.setDate(d.getDate() + units * 7);
    else if (view === "month") d.setMonth(d.getMonth() + units);
    setCursor(d);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-2xl">{t("planning.title")}</h2>
          <p className="text-sm text-neutral-600">{t("planning.subtitle")}</p>
        </div>
        <div className="inline-flex border border-neutral-300 text-xs uppercase tracking-wider" role="tablist">
          {(["list", "week", "month"] as ViewMode[]).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`px-3 py-2 ${view === v ? "bg-primary text-white" : "bg-white"}`}
              data-testid={`tab-view-${v}`}
            >
              {v === "list" ? t("planning.view_list") : v === "week" ? t("planning.view_week") : t("planning.view_month")}
            </button>
          ))}
        </div>
      </div>

      <form
        className="bg-white p-4 border border-neutral-200 grid grid-cols-1 lg:grid-cols-4 gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title) return;
          create.mutate({
            title: form.title,
            dueDate: form.dueDate || null,
            assignee: form.assignee || null,
            done: false,
            category: "preparation",
            notes: null,
          });
        }}
      >
        <Input placeholder={t("planning.task")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required data-testid="input-task-title" />
        <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        <Input placeholder={t("planning.assignee")} value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} />
        <Button type="submit" className="rounded-none uppercase tracking-wider text-xs gap-2"><Plus className="w-3 h-3" /> {t("planning.add")}</Button>
      </form>

      {view !== "list" && (
        <div className="flex items-center justify-between bg-white border border-neutral-200 px-4 py-2">
          <button onClick={() => shift(-1)} className="p-1 hover:text-primary" aria-label={t("planning.previous")}><ChevronLeft className="w-4 h-4" /></button>
          <p className="text-sm font-bold uppercase tracking-widest">
            {view === "week"
              ? t("planning.week_of", { date: weekStart.toLocaleDateString(locale, { day: "numeric", month: "long" }) })
              : cursor.toLocaleDateString(locale, { month: "long", year: "numeric" })}
          </p>
          <button onClick={() => shift(1)} className="p-1 hover:text-primary" aria-label={t("planning.next")}><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}

      {view === "list" && (
        <div className="bg-white border border-neutral-200">
          {sorted.map((tk) => (
            <div key={tk.id} className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 last:border-0">
              <button
                onClick={() => update.mutate({ id: tk.id, body: { done: !tk.done } })}
                className={`w-6 h-6 flex items-center justify-center border flex-shrink-0 ${tk.done ? "bg-primary border-primary text-white" : "border-neutral-300"}`}
                aria-label={t("planning.toggle_done")}
              >
                {tk.done && <Check className="w-3 h-3" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${tk.done ? "line-through text-neutral-400" : ""}`}>{tk.title}</p>
                <p className="text-xs text-neutral-500">
                  {tk.dueDate && <>{t("planning.due", { date: new Date(tk.dueDate).toLocaleDateString(locale) })}</>}
                  {tk.assignee && <> · {tk.assignee}</>}
                </p>
              </div>
              <button onClick={() => del.mutate(tk.id)} className="text-neutral-400 hover:text-primary" aria-label={t("planning.delete")}><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {sorted.length === 0 && <p className="px-4 py-8 text-center text-neutral-400 text-sm">{t("planning.empty")}</p>}
        </div>
      )}

      {view === "week" && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {weekDays.map((d, i) => {
            const list = tasksByDate.get(ymd(d)) ?? [];
            return (
              <div key={i} className="bg-white border border-neutral-200 min-h-32 p-2">
                <p className="text-xs uppercase tracking-widest text-neutral-500">{days[i]} {d.getDate()}</p>
                <div className="mt-2 space-y-1">
                  {list.map((tk) => (
                    <div key={tk.id} className={`text-xs px-2 py-1 ${tk.done ? "bg-emerald-50 line-through text-neutral-400" : "bg-rose-50"}`}>
                      {tk.title}
                    </div>
                  ))}
                  {list.length === 0 && <p className="text-xs text-neutral-300">—</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "month" && (
        <div>
          <div className="grid grid-cols-7 gap-px bg-neutral-200 border border-neutral-200">
            {days.map((d) => (
              <div key={d} className="bg-background/40 px-2 py-1 text-xs uppercase tracking-widest text-neutral-600">{d}</div>
            ))}
            {monthDays.map((d, i) => {
              const list = tasksByDate.get(ymd(d)) ?? [];
              const inMonth = d.getMonth() === currentMonth;
              return (
                <div key={i} className={`bg-white min-h-24 p-1 ${inMonth ? "" : "opacity-40"}`}>
                  <p className="text-xs text-neutral-500">{d.getDate()}</p>
                  <div className="mt-1 space-y-0.5">
                    {list.slice(0, 3).map((tk) => (
                      <div key={tk.id} className={`text-[10px] truncate px-1 ${tk.done ? "bg-emerald-50 text-neutral-400 line-through" : "bg-rose-50"}`}>{tk.title}</div>
                    ))}
                    {list.length > 3 && <p className="text-[10px] text-neutral-500">+{list.length - 3}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
