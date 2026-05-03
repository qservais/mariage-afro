import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Check } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BudgetItem as Item, BudgetItemCreate, BudgetItemPatch } from "@/lib/clientTypes";

const COLORS = ["#68191e", "#a04144", "#c97679", "#e0a3a6", "#f1c5c8", "#8b3a3e", "#5a1518"];
const LOCALE_MAP: Record<string, string> = { fr: "fr-BE", nl: "nl-BE", en: "en-GB" };

export default function BudgetPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || "fr").split("-")[0];
  const locale = LOCALE_MAP[lang] || "fr-BE";
  const fmt = (cents: number) => `${(cents / 100).toLocaleString(locale)} €`;

  const qc = useQueryClient();
  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["client", "budget"],
    queryFn: () => clientApi.get<Item[]>("/api/client/budget"),
  });
  const [form, setForm] = useState({ category: "", vendor: "", planned: "", actual: "" });

  const create = useMutation({
    mutationFn: (b: BudgetItemCreate) => clientApi.post<Item>("/api/client/budget", b),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client", "budget"] }); setForm({ category: "", vendor: "", planned: "", actual: "" }); },
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: BudgetItemPatch }) => clientApi.patch<Item>(`/api/client/budget/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "budget"] }),
  });
  const del = useMutation({
    mutationFn: (id: number) => clientApi.del(`/api/client/budget/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "budget"] }),
  });

  const totalPlanned = items.reduce((s, i) => s + i.planned, 0);
  const totalActual = items.reduce((s, i) => s + i.actual, 0);
  const totalPaid = items.filter((i) => i.paid).reduce((s, i) => s + i.actual, 0);

  const chartData = items.reduce<{ name: string; value: number }[]>((acc, i) => {
    const ex = acc.find((x) => x.name === i.category);
    if (ex) ex.value += i.planned; else acc.push({ name: i.category, value: i.planned });
    return acc;
  }, []).filter((x) => x.value > 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="font-bold text-2xl">{t("budget.title")}</h2>
        <p className="text-sm text-neutral-600">{t("budget.subtitle")}</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-neutral-200">
          <p className="text-xs uppercase text-neutral-500 tracking-widest">{t("budget.planned")}</p>
          <p className="text-2xl font-bold mt-1">{fmt(totalPlanned)}</p>
        </div>
        <div className="bg-white p-4 border border-neutral-200">
          <p className="text-xs uppercase text-neutral-500 tracking-widest">{t("budget.actual")}</p>
          <p className="text-2xl font-bold mt-1">{fmt(totalActual)}</p>
        </div>
        <div className="bg-white p-4 border border-neutral-200">
          <p className="text-xs uppercase text-neutral-500 tracking-widest">{t("budget.paid")}</p>
          <p className="text-2xl font-bold mt-1 text-primary">{fmt(totalPaid)}</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white p-6 border border-neutral-200">
          <p className="text-sm font-bold uppercase tracking-widest mb-4">{t("budget.by_category")}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={90} label={(e) => e.name}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number | string) => fmt(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <form
        className="bg-white p-4 border border-neutral-200 grid grid-cols-2 lg:grid-cols-5 gap-3"
        onSubmit={(e) => { e.preventDefault(); if (!form.category) return; create.mutate({ category: form.category, vendor: form.vendor || null, planned: Math.round(Number(form.planned || 0) * 100), actual: Math.round(Number(form.actual || 0) * 100) }); }}
      >
        <Input placeholder={t("budget.category")} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required data-testid="input-budget-category" />
        <Input placeholder={t("budget.vendor")} value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
        <Input placeholder={t("budget.planned_eur")} type="number" min="0" value={form.planned} onChange={(e) => setForm({ ...form, planned: e.target.value })} />
        <Input placeholder={t("budget.actual_eur")} type="number" min="0" value={form.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })} />
        <Button type="submit" className="rounded-none uppercase tracking-wider text-xs gap-2"><Plus className="w-3 h-3" /> {t("budget.add")}</Button>
      </form>

      <div className="bg-white border border-neutral-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-background/40">
            <tr className="text-left text-xs uppercase tracking-widest text-neutral-600">
              <th className="px-4 py-3">{t("budget.category")}</th>
              <th className="px-4 py-3">{t("budget.vendor")}</th>
              <th className="px-4 py-3 text-right">{t("budget.th_amount_planned")}</th>
              <th className="px-4 py-3 text-right">{t("budget.th_amount_actual")}</th>
              <th className="px-4 py-3 text-center">{t("budget.th_paid")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-neutral-100">
                <td className="px-4 py-3 font-medium">{it.category}</td>
                <td className="px-4 py-3 text-neutral-600">{it.vendor || "—"}</td>
                <td className="px-4 py-3 text-right">{fmt(it.planned)}</td>
                <td className="px-4 py-3 text-right">{fmt(it.actual)}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => update.mutate({ id: it.id, body: { paid: !it.paid } })}
                    className={`w-6 h-6 inline-flex items-center justify-center border ${it.paid ? "bg-primary border-primary text-white" : "border-neutral-300"}`}
                    aria-label={t("budget.toggle_paid")}
                  >
                    {it.paid && <Check className="w-3 h-3" />}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => del.mutate(it.id)} className="text-neutral-400 hover:text-primary" aria-label={t("budget.delete", { defaultValue: "Supprimer" })}><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">{t("budget.empty")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
