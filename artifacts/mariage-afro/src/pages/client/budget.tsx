import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Check, Info, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BudgetItem as Item, BudgetItemCreate, BudgetItemPatch } from "@/lib/clientTypes";
import { useCouple } from "@/components/client/ClientLayout";
import { useToast } from "@/hooks/use-toast";

import { getBudgetChartColors } from "@/lib/brand-colors";
const LOCALE_MAP: Record<string, string> = { fr: "fr-BE", nl: "nl-BE", en: "en-GB" };

export default function BudgetPage() {
  const COLORS = getBudgetChartColors();
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || "fr").split("-")[0];
  const locale = LOCALE_MAP[lang] || "fr-BE";
  const fmt = (cents: number) => `${(cents / 100).toLocaleString(locale)} €`;

  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: couple, error: coupleError } = useCouple();
  const budgetMode = couple?.budgetMode ?? "libre";
  const totalBudgetCents = couple?.budget ?? 0;

  const { data: items = [], error: itemsError } = useQuery<Item[]>({
    queryKey: ["client", "budget"],
    queryFn: () => clientApi.get<Item[]>("/api/client/budget"),
  });
  const [form, setForm] = useState({ category: "", vendor: "", planned: "", actual: "" });

  const create = useMutation({
    mutationFn: (b: BudgetItemCreate) => clientApi.post<Item>("/api/client/budget", b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", "budget"] });
      setForm({ category: "", vendor: "", planned: "", actual: "" });
      toast({ title: t("budget.item_added") });
    },
    onError: (err: Error) => toast({ title: t("budget.error_add", { defaultValue: "Impossible d'ajouter l'élément" }), description: err.message, variant: "destructive" }),
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: BudgetItemPatch }) => clientApi.patch<Item>(`/api/client/budget/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "budget"] }),
    onError: (err: Error) => toast({ title: t("budget.error_update", { defaultValue: "Impossible de modifier l'élément" }), description: err.message, variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: (id: number) => clientApi.del(`/api/client/budget/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "budget"] }),
    onError: (err: Error) => toast({ title: t("budget.error_delete", { defaultValue: "Impossible de supprimer l'élément" }), description: err.message, variant: "destructive" }),
  });
  const updateMode = useMutation({
    mutationFn: (mode: "libre" | "global") => clientApi.patch("/api/client/me", { budgetMode: mode }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "me"] }),
    onError: (err: Error) => toast({ title: t("budget.error_mode", { defaultValue: "Impossible de changer le mode" }), description: err.message, variant: "destructive" }),
  });

  const totalPlanned = items.reduce((s, i) => s + i.planned, 0);
  const totalActual = items.reduce((s, i) => s + i.actual, 0);
  const totalPaid = items.filter((i) => i.paid).reduce((s, i) => s + i.actual, 0);
  const totalCommitted = totalPlanned;

  const progressPct = budgetMode === "global" && totalBudgetCents > 0
    ? Math.min(100, Math.round((totalCommitted / totalBudgetCents) * 100))
    : 0;
  const remaining = totalBudgetCents - totalCommitted;

  const chartData = items.reduce<{ name: string; value: number }[]>((acc, i) => {
    const ex = acc.find((x) => x.name === i.category);
    if (ex) ex.value += i.planned; else acc.push({ name: i.category, value: i.planned });
    return acc;
  }, []).filter((x) => x.value > 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-2xl">{t("budget.title")}</h2>
          <p className="text-sm text-neutral-600">{t("budget.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-neutral-500">{t("budget.mode_label")} :</span>
          <div className="inline-flex border border-neutral-300 text-xs uppercase tracking-wider">
            {(["libre", "global"] as const).map((m) => (
              <button
                key={m}
                onClick={() => updateMode.mutate(m)}
                disabled={!!coupleError || updateMode.isPending}
                className={`px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed ${budgetMode === m ? "bg-primary text-white" : "bg-cream-soft text-neutral-700"}`}
                data-testid={`budget-mode-${m}`}
              >
                {t(`budget.mode_${m}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Estimation warning */}
      <div className="flex items-start gap-3 bg-wine-deep/5 border border-gold/30 px-4 py-3 text-sm text-wine-deep">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gold-deep" aria-hidden="true" />
        <p>{t("budget.warning_estimate")}</p>
      </div>

      {/* Load error banners */}
      {coupleError && (
        <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-primary" role="alert">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p>{t("budget.error_profile", { defaultValue: "Impossible de charger votre profil — le mode budget ne peut pas être modifié." })} — {(coupleError as Error).message}</p>
        </div>
      )}
      {itemsError && (
        <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-primary" role="alert">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p>{t("budget.error_load", { defaultValue: "Impossible de charger les postes budgétaires." })} — {(itemsError as Error).message}</p>
        </div>
      )}

      {/* Vendor sync info */}
      <div className="flex items-start gap-3 bg-cream-soft border border-gold/30 px-4 py-3 text-sm text-wine-deep">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-gold-deep" aria-hidden="true" />
        <p>{t("budget.vendor_sync_note")}</p>
      </div>

      {/* Stats cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-cream p-4 border border-neutral-200">
          <p className="text-xs uppercase text-neutral-500 tracking-widest">{t("budget.planned")}</p>
          <p className="text-2xl font-bold mt-1">{fmt(totalPlanned)}</p>
        </div>
        <div className="bg-cream p-4 border border-neutral-200">
          <p className="text-xs uppercase text-neutral-500 tracking-widest">{t("budget.actual")}</p>
          <p className="text-2xl font-bold mt-1">{fmt(totalActual)}</p>
        </div>
        <div className="bg-cream p-4 border border-neutral-200">
          <p className="text-xs uppercase text-neutral-500 tracking-widest">{t("budget.paid")}</p>
          <p className="text-2xl font-bold mt-1 text-primary">{fmt(totalPaid)}</p>
        </div>
      </div>

      {/* Global budget progress bar */}
      {budgetMode === "global" && (
        <div className="bg-cream p-6 border border-neutral-200 space-y-4">
          <div className="flex justify-between items-baseline flex-wrap gap-2">
            <div>
              <p className="text-xs uppercase text-neutral-500 tracking-widest">{t("budget.total_committed")}</p>
              <p className="text-xl font-bold">{fmt(totalCommitted)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase text-neutral-500 tracking-widest">{t("budget.total_budget")}</p>
              <p className="text-xl font-bold">{fmt(totalBudgetCents)}</p>
            </div>
          </div>
          <div className="w-full bg-neutral-100 h-4 overflow-hidden">
            <div
              className={`h-4 transition-all ${progressPct >= 100 ? "bg-rose-500" : progressPct >= 80 ? "bg-amber-400" : "bg-primary"}`}
              style={{ width: `${progressPct}%` }}
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={progressPct >= 100 ? t("budget.progress_over_budget") : t("budget.progress_label", { pct: progressPct })}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">{t("budget.progress_label", { pct: progressPct })}</span>
            <span className={`font-semibold ${remaining < 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {t("budget.remaining")}: {fmt(Math.abs(remaining))}
              {remaining < 0 && <span className="ml-1 font-bold">{t("budget.over_budget_text")}</span>}
            </span>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="bg-cream p-6 border border-neutral-200">
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
        className="bg-cream p-4 border border-neutral-200 grid grid-cols-2 lg:grid-cols-5 gap-3"
        onSubmit={(e) => { e.preventDefault(); if (!form.category) return; create.mutate({ category: form.category, vendor: form.vendor || null, planned: Math.round(Number(form.planned || 0) * 100), actual: Math.round(Number(form.actual || 0) * 100) }); }}
      >
        <div>
          <label htmlFor="budget-category" className="sr-only">{t("budget.category")}</label>
          <Input id="budget-category" placeholder={t("budget.category")} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required data-testid="input-budget-category" />
        </div>
        <div>
          <label htmlFor="budget-vendor" className="sr-only">{t("budget.vendor")}</label>
          <Input id="budget-vendor" placeholder={t("budget.vendor")} value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
        </div>
        <div>
          <label htmlFor="budget-planned" className="sr-only">{t("budget.planned_eur")}</label>
          <Input id="budget-planned" placeholder={t("budget.planned_eur")} type="number" min="0" value={form.planned} onChange={(e) => setForm({ ...form, planned: e.target.value })} />
        </div>
        <div>
          <label htmlFor="budget-actual" className="sr-only">{t("budget.actual_eur")}</label>
          <Input id="budget-actual" placeholder={t("budget.actual_eur")} type="number" min="0" value={form.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })} />
        </div>
        <Button type="submit" className="rounded-none uppercase tracking-wider text-xs gap-2"><Plus className="w-3 h-3" aria-hidden="true" /> {t("budget.add")}</Button>
      </form>

      <div className="bg-cream border border-neutral-200 overflow-x-auto">
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
