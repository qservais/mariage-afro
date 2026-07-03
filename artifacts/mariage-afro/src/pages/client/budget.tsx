import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Check, Info, AlertTriangle, Pencil, X as XIcon, Save } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BudgetItem as Item, BudgetItemCreate, BudgetItemPatch, ClientVendor } from "@/lib/clientTypes";
import { useCouple } from "@/components/client/ClientLayout";
import { useToast } from "@/hooks/use-toast";
import { getBudgetChartColors } from "@/lib/brand-colors";

const LOCALE_MAP: Record<string, string> = { fr: "fr-BE", nl: "nl-BE", en: "en-GB" };


interface EditRow {
  id: number;
  category: string;
  vendor: string;
  planned: string;
  actual: string;
}

export default function BudgetPage() {
  const COLORS = getBudgetChartColors();
  const { t, i18n } = useTranslation();
  const SUGGESTED_CATEGORIES = t("budget.suggested_categories", { returnObjects: true }) as string[];
  const lang = (i18n.resolvedLanguage || i18n.language || "fr").split("-")[0];
  const locale = LOCALE_MAP[lang] || "fr-BE";

  const fmt = (cents: number) => `${(cents / 100).toLocaleString(locale)} €`;
  const fmtEur = (euros: number) => `${euros.toLocaleString(locale)} €`;

  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: couple, error: coupleError } = useCouple();
  const budgetMode = couple?.budgetMode ?? "libre";

  const totalBudgetEuros = couple?.budget ?? 0;
  const totalBudgetCents = totalBudgetEuros * 100;

  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [editRow, setEditRow] = useState<EditRow | null>(null);

  const { data: items = [], error: itemsError } = useQuery<Item[]>({
    queryKey: ["client", "budget"],
    queryFn: () => clientApi.get<Item[]>("/api/client/budget"),
  });

  const { data: clientVendors = [] } = useQuery<ClientVendor[]>({
    queryKey: ["client", "vendors"],
    queryFn: () => clientApi.get<ClientVendor[]>("/api/client/vendors"),
  });
  const vendorNames = [...new Set(clientVendors.map((v) => v.name).filter(Boolean))];

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
    mutationFn: ({ id, body }: { id: number; body: BudgetItemPatch }) =>
      clientApi.patch<Item>(`/api/client/budget/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", "budget"] });
      setEditRow(null);
    },
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

  const updateBudget = useMutation({
    mutationFn: (budget: number) => clientApi.patch("/api/client/me", { budget }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", "me"] });
      setEditingBudget(false);
      toast({ title: t("budget.budget_saved", { defaultValue: "Budget global mis à jour" }) });
    },
    onError: (err: Error) => toast({ title: t("budget.error_mode", { defaultValue: "Impossible de mettre à jour le budget" }), description: err.message, variant: "destructive" }),
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

  const startEditBudget = () => {
    setBudgetInput(totalBudgetEuros > 0 ? String(totalBudgetEuros) : "");
    setEditingBudget(true);
  };

  const saveBudget = () => {
    const val = Math.round(Number(budgetInput));
    if (!budgetInput || isNaN(val) || val < 0) return;
    updateBudget.mutate(val);
  };

  const startEditRow = (it: Item) => {
    setEditRow({
      id: it.id,
      category: it.category,
      vendor: it.vendor ?? "",
      planned: String(it.planned / 100),
      actual: String(it.actual / 100),
    });
  };

  const saveEditRow = () => {
    if (!editRow) return;
    update.mutate({
      id: editRow.id,
      body: {
        category: editRow.category,
        vendor: editRow.vendor || null,
        planned: Math.round(Number(editRow.planned || 0) * 100),
        actual: Math.round(Number(editRow.actual || 0) * 100),
      },
    });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header + mode toggle */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-2xl">{t("budget.title")}</h2>
          <p className="text-sm text-neutral-600">{t("budget.subtitle")}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-neutral-500">{t("budget.mode_label")} :</span>
            <div className="inline-flex border border-neutral-300 text-xs uppercase tracking-wider">
              {(["libre", "global"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => updateMode.mutate(m)}
                  disabled={!!coupleError || updateMode.isPending}
                  className={`px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${budgetMode === m ? "bg-primary text-white" : "bg-cream-soft text-neutral-700 hover:bg-cream"}`}
                  data-testid={`budget-mode-${m}`}
                >
                  {t(`budget.mode_${m}`)}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-neutral-500 italic">
            {t(`budget.mode_${budgetMode}_desc`)}
          </p>
        </div>
      </div>

      {/* Estimation warning */}
      <div className="flex items-start gap-3 bg-wine-deep/5 border border-gold/30 px-4 py-3 text-sm text-wine-deep">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gold-deep" aria-hidden="true" />
        <p>{t("budget.warning_estimate")}</p>
      </div>

      {/* Error banners */}
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

      {/* Global budget section */}
      {budgetMode === "global" && (
        <div className="bg-cream p-6 border border-neutral-200 space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase text-neutral-500 tracking-widest">{t("budget.total_budget")}</p>
              {editingBudget ? (
                <form
                  className="flex items-center gap-2 mt-2"
                  onSubmit={(e) => { e.preventDefault(); saveBudget(); }}
                >
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      placeholder="ex: 25000"
                      className="rounded-none w-44 pr-8"
                      autoFocus
                      data-testid="input-global-budget"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-neutral-500">€</span>
                  </div>
                  <Button type="submit" size="sm" className="rounded-none uppercase tracking-wider text-xs" disabled={updateBudget.isPending}>
                    {t("budget.save_budget", { defaultValue: "Enregistrer" })}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setEditingBudget(false)}
                    className="p-1 text-neutral-400 hover:text-neutral-700"
                    aria-label={t("budget.cancel")}
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </form>
              ) : totalBudgetEuros > 0 ? (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xl font-bold">{fmtEur(totalBudgetEuros)}</p>
                  <button
                    onClick={startEditBudget}
                    className="text-neutral-400 hover:text-primary transition-colors"
                    aria-label={t("budget.edit_budget", { defaultValue: "Modifier le budget" })}
                    data-testid="btn-edit-global-budget"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-sm text-neutral-500 mb-2">{t("budget.no_budget_set", { defaultValue: "Aucun budget global défini." })}</p>
                  <Button size="sm" variant="outline" className="rounded-none uppercase tracking-wider text-xs" onClick={startEditBudget} data-testid="btn-set-global-budget">
                    {t("budget.set_budget", { defaultValue: "Définir mon budget" })}
                  </Button>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs uppercase text-neutral-500 tracking-widest">{t("budget.total_committed")}</p>
              <p className="text-xl font-bold">{fmt(totalCommitted)}</p>
              {totalBudgetEuros > 0 && (
                <p className={`text-sm font-semibold mt-1 ${remaining < 0 ? "text-wine-deep" : "text-gold-deep"}`}>
                  {remaining < 0
                    ? `${t("budget.over_budget_text")} ${fmt(Math.abs(remaining))}`
                    : `${t("budget.remaining")} : ${fmt(remaining)}`}
                </p>
              )}
            </div>
          </div>

          {totalBudgetEuros > 0 && (
            <div className="space-y-2">
              <div className="w-full bg-neutral-100 h-4 overflow-hidden">
                <div
                  className={`h-4 transition-all duration-500 ${progressPct >= 100 ? "bg-wine-deep" : progressPct >= 80 ? "bg-gold-deep" : "bg-primary"}`}
                  style={{ width: `${progressPct}%` }}
                  role="progressbar"
                  aria-valuenow={progressPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t("budget.progress_label", { pct: progressPct })}
                />
              </div>
              <p className="text-sm text-neutral-600">{t("budget.progress_label", { pct: progressPct })}</p>
            </div>
          )}
        </div>
      )}

      {/* Pie chart */}
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

      {/* Datalists for autocomplete */}
      <datalist id="budget-categories">
        {SUGGESTED_CATEGORIES.map((c) => <option key={c} value={c} />)}
      </datalist>
      <datalist id="budget-vendors">
        {vendorNames.map((n) => <option key={n} value={n} />)}
      </datalist>

      {/* Add item form */}
      <form
        className="bg-cream p-4 border border-neutral-200 grid grid-cols-2 lg:grid-cols-5 gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.category) return;
          create.mutate({
            category: form.category,
            vendor: form.vendor || null,
            planned: Math.round(Number(form.planned || 0) * 100),
            actual: Math.round(Number(form.actual || 0) * 100),
          });
        }}
      >
        <div>
          <label htmlFor="budget-category" className="sr-only">{t("budget.category")}</label>
          <Input
            id="budget-category"
            list="budget-categories"
            placeholder={t("budget.category")}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
            data-testid="input-budget-category"
          />
        </div>
        <div>
          <label htmlFor="budget-vendor" className="sr-only">{t("budget.vendor")}</label>
          <Input
            id="budget-vendor"
            list="budget-vendors"
            placeholder={t("budget.vendor")}
            value={form.vendor}
            onChange={(e) => setForm({ ...form, vendor: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="budget-planned" className="sr-only">{t("budget.planned_eur")}</label>
          <Input id="budget-planned" placeholder={t("budget.planned_eur")} type="number" min="0" step="0.01" value={form.planned} onChange={(e) => setForm({ ...form, planned: e.target.value })} />
        </div>
        <div>
          <label htmlFor="budget-actual" className="sr-only">{t("budget.actual_eur")}</label>
          <Input id="budget-actual" placeholder={t("budget.actual_eur")} type="number" min="0" step="0.01" value={form.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })} />
        </div>
        <Button type="submit" className="rounded-none uppercase tracking-wider text-xs gap-2" disabled={create.isPending}>
          <Plus className="w-3 h-3" aria-hidden="true" /> {t("budget.add")}
        </Button>
      </form>

      {/* Items table */}
      <div className="bg-cream border border-neutral-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-background/40">
            <tr className="text-left text-xs uppercase tracking-widest text-neutral-600">
              <th className="px-4 py-3">{t("budget.category")}</th>
              <th className="px-4 py-3">{t("budget.vendor")}</th>
              <th className="px-4 py-3 text-right">{t("budget.th_amount_planned")}</th>
              <th className="px-4 py-3 text-right">{t("budget.th_amount_actual")}</th>
              <th className="px-4 py-3 text-center">{t("budget.th_paid")}</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) =>
              editRow?.id === it.id ? (
                /* ── Inline edit row ── */
                <tr key={it.id} className="border-t border-neutral-100 bg-cream-soft">
                  <td className="px-2 py-2">
                    <Input
                      list="budget-categories"
                      value={editRow.category}
                      onChange={(e) => setEditRow({ ...editRow, category: e.target.value })}
                      className="h-8 text-sm rounded-none"
                      autoFocus
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      list="budget-vendors"
                      value={editRow.vendor}
                      onChange={(e) => setEditRow({ ...editRow, vendor: e.target.value })}
                      className="h-8 text-sm rounded-none"
                      placeholder="—"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editRow.planned}
                      onChange={(e) => setEditRow({ ...editRow, planned: e.target.value })}
                      className="h-8 text-sm rounded-none text-right"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editRow.actual}
                      onChange={(e) => setEditRow({ ...editRow, actual: e.target.value })}
                      className="h-8 text-sm rounded-none text-right"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={() => update.mutate({ id: it.id, body: { paid: !it.paid } })}
                      className={`w-6 h-6 inline-flex items-center justify-center border ${it.paid ? "bg-primary border-primary text-white" : "border-neutral-300"}`}
                      aria-label={t("budget.toggle_paid")}
                    >
                      {it.paid && <Check className="w-3 h-3" />}
                    </button>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={saveEditRow}
                        disabled={update.isPending}
                        className="p-1.5 text-primary hover:bg-primary/10 transition-colors"
                        aria-label={t("budget.save")}
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditRow(null)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 transition-colors"
                        aria-label={t("budget.cancel")}
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                /* ── Read row ── */
                <tr key={it.id} className="border-t border-neutral-100 hover:bg-cream-soft/60 transition-colors group">
                  <td className="px-4 py-3 font-medium">{it.category}</td>
                  <td className="px-4 py-3 text-neutral-600">{it.vendor || "—"}</td>
                  <td className="px-4 py-3 text-right">{fmt(it.planned)}</td>
                  <td className="px-4 py-3 text-right">{fmt(it.actual)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => update.mutate({ id: it.id, body: { paid: !it.paid } })}
                      className={`w-6 h-6 inline-flex items-center justify-center border transition-colors ${it.paid ? "bg-primary border-primary text-white" : "border-neutral-300 hover:border-primary"}`}
                      aria-label={t("budget.toggle_paid")}
                    >
                      {it.paid && <Check className="w-3 h-3" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditRow(it)}
                        className="p-1 text-neutral-400 hover:text-primary transition-colors"
                        aria-label={t("budget.edit")}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => del.mutate(it.id)}
                        className="p-1 text-neutral-400 hover:text-primary transition-colors"
                        aria-label={t("budget.delete", { defaultValue: "Supprimer" })}
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-neutral-400">
                  <p className="mb-1">{t("budget.empty")}</p>
                  <p className="text-xs">{t("budget.empty_hint", { defaultValue: "Ajoutez vos premiers postes de dépenses ci-dessus." })}</p>
                </td>
              </tr>
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot className="bg-background/40 border-t-2 border-neutral-200">
              <tr className="text-xs uppercase tracking-widest text-neutral-600 font-bold">
                <td className="px-4 py-3" colSpan={2}>{t("budget.total", { defaultValue: "Total" })}</td>
                <td className="px-4 py-3 text-right">{fmt(totalPlanned)}</td>
                <td className="px-4 py-3 text-right">{fmt(totalActual)}</td>
                <td className="px-4 py-3 text-center text-primary">{fmt(totalPaid)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
