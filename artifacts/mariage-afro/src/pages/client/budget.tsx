import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Check } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Item { id: number; category: string; vendor: string | null; planned: number; actual: number; paid: boolean }

const COLORS = ["#68191e", "#a04144", "#c97679", "#e0a3a6", "#f1c5c8", "#8b3a3e", "#5a1518"];
const fmt = (cents: number) => `${(cents / 100).toLocaleString("fr-BE")} €`;

export default function BudgetPage() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["client", "budget"],
    queryFn: () => clientApi.get<Item[]>("/api/client/budget"),
  });
  const [form, setForm] = useState({ category: "", vendor: "", planned: "", actual: "" });

  const create = useMutation({
    mutationFn: (b: any) => clientApi.post("/api/client/budget", b),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client", "budget"] }); setForm({ category: "", vendor: "", planned: "", actual: "" }); },
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) => clientApi.patch(`/api/client/budget/${id}`, body),
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
        <h2 className="font-bold text-2xl">Budget</h2>
        <p className="text-sm text-neutral-600">Suivez vos dépenses et paiements pour chaque poste.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-neutral-200">
          <p className="text-xs uppercase text-neutral-500 tracking-widest">Prévu</p>
          <p className="text-2xl font-bold mt-1">{fmt(totalPlanned)}</p>
        </div>
        <div className="bg-white p-4 border border-neutral-200">
          <p className="text-xs uppercase text-neutral-500 tracking-widest">Réel</p>
          <p className="text-2xl font-bold mt-1">{fmt(totalActual)}</p>
        </div>
        <div className="bg-white p-4 border border-neutral-200">
          <p className="text-xs uppercase text-neutral-500 tracking-widest">Payé</p>
          <p className="text-2xl font-bold mt-1 text-primary">{fmt(totalPaid)}</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white p-6 border border-neutral-200">
          <p className="text-sm font-bold uppercase tracking-widest mb-4">Répartition par catégorie</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={90} label={(e) => e.name}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => fmt(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <form
        className="bg-white p-4 border border-neutral-200 grid grid-cols-2 lg:grid-cols-5 gap-3"
        onSubmit={(e) => { e.preventDefault(); if (!form.category) return; create.mutate({ category: form.category, vendor: form.vendor || null, planned: Math.round(Number(form.planned || 0) * 100), actual: Math.round(Number(form.actual || 0) * 100) }); }}
      >
        <Input placeholder="Catégorie" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required data-testid="input-budget-category" />
        <Input placeholder="Prestataire" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
        <Input placeholder="Prévu €" type="number" min="0" value={form.planned} onChange={(e) => setForm({ ...form, planned: e.target.value })} />
        <Input placeholder="Réel €" type="number" min="0" value={form.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })} />
        <Button type="submit" className="rounded-none uppercase tracking-wider text-xs gap-2"><Plus className="w-3 h-3" /> Ajouter</Button>
      </form>

      <div className="bg-white border border-neutral-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-background/40">
            <tr className="text-left text-xs uppercase tracking-widest text-neutral-600">
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Prestataire</th>
              <th className="px-4 py-3 text-right">Prévu</th>
              <th className="px-4 py-3 text-right">Réel</th>
              <th className="px-4 py-3 text-center">Payé</th>
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
                    aria-label="Toggle paid"
                  >
                    {it.paid && <Check className="w-3 h-3" />}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => del.mutate(it.id)} className="text-neutral-400 hover:text-primary"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">Aucun poste budgétaire</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
