import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface V { id: number; category: string; name: string; contactName: string | null; contactEmail: string | null; contactPhone: string | null; amount: number; status: string }

const STATUS_LABELS: Record<string, string> = { contacted: "Contacté", negotiating: "En discussion", booked: "Réservé", paid: "Payé" };
const STATUS_COLORS: Record<string, string> = { contacted: "bg-neutral-100", negotiating: "bg-amber-100 text-amber-800", booked: "bg-blue-100 text-blue-800", paid: "bg-emerald-100 text-emerald-800" };

export default function VendorsPage() {
  const qc = useQueryClient();
  const { data: vendors = [] } = useQuery<V[]>({
    queryKey: ["client", "vendors"],
    queryFn: () => clientApi.get<V[]>("/api/client/vendors"),
  });
  const [form, setForm] = useState({ category: "", name: "", contactName: "", contactEmail: "", contactPhone: "", amount: "" });

  const create = useMutation({
    mutationFn: (b: any) => clientApi.post("/api/client/vendors", b),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client", "vendors"] }); setForm({ category: "", name: "", contactName: "", contactEmail: "", contactPhone: "", amount: "" }); },
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) => clientApi.patch(`/api/client/vendors/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "vendors"] }),
  });
  const del = useMutation({
    mutationFn: (id: number) => clientApi.del(`/api/client/vendors/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "vendors"] }),
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="font-bold text-2xl">Prestataires</h2>
        <p className="text-sm text-neutral-600">Vos prestataires sélectionnés et le statut de leur contrat.</p>
      </div>

      <form
        className="bg-white p-4 border border-neutral-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3"
        onSubmit={(e) => { e.preventDefault(); if (!form.category || !form.name) return; create.mutate({ category: form.category, name: form.name, contactName: form.contactName || null, contactEmail: form.contactEmail || null, contactPhone: form.contactPhone || null, amount: Math.round(Number(form.amount || 0) * 100) }); }}
      >
        <Input placeholder="Catégorie" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required data-testid="input-vendor-category" />
        <Input placeholder="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="input-vendor-name" />
        <Input placeholder="Contact" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
        <Input placeholder="Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
        <Input placeholder="Téléphone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
        <div className="flex gap-2">
          <Input placeholder="€" type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Button type="submit" className="rounded-none px-3"><Plus className="w-4 h-4" /></Button>
        </div>
      </form>

      <div className="bg-white border border-neutral-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-background/40">
            <tr className="text-left text-xs uppercase tracking-widest text-neutral-600">
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Prestataire</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3 text-right">Montant</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="border-t border-neutral-100">
                <td className="px-4 py-3 text-neutral-600">{v.category}</td>
                <td className="px-4 py-3 font-medium">{v.name}</td>
                <td className="px-4 py-3 text-neutral-600 text-xs">
                  {v.contactName && <div>{v.contactName}</div>}
                  {v.contactEmail && <div>{v.contactEmail}</div>}
                  {v.contactPhone && <div>{v.contactPhone}</div>}
                </td>
                <td className="px-4 py-3 text-right">{(v.amount / 100).toLocaleString("fr-BE")} €</td>
                <td className="px-4 py-3">
                  <select
                    value={v.status}
                    onChange={(e) => update.mutate({ id: v.id, body: { status: e.target.value } })}
                    className={`text-xs px-2 py-1 ${STATUS_COLORS[v.status] || ""}`}
                  >
                    {Object.entries(STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => del.mutate(v.id)} className="text-neutral-400 hover:text-primary"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {vendors.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">Aucun prestataire</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
