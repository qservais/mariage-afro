import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ExternalLink, FileText } from "lucide-react";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Doc { id: number; name: string; url: string; fileType: string | null; size: number; category: string; createdAt: string }

export default function DocumentsPage() {
  const qc = useQueryClient();
  const { data: docs = [] } = useQuery<Doc[]>({
    queryKey: ["client", "documents"],
    queryFn: () => clientApi.get<Doc[]>("/api/client/documents"),
  });
  const [form, setForm] = useState({ name: "", url: "", category: "contrat" });

  const create = useMutation({
    mutationFn: (b: any) => clientApi.post("/api/client/documents", b),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client", "documents"] }); setForm({ name: "", url: "", category: "contrat" }); },
  });
  const del = useMutation({
    mutationFn: (id: number) => clientApi.del(`/api/client/documents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "documents"] }),
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="font-bold text-2xl">Documents</h2>
        <p className="text-sm text-neutral-600">Centralisez contrats, devis et inspirations. Ajoutez le lien vers vos documents (cloud, drive...).</p>
      </div>

      <form
        className="bg-white p-4 border border-neutral-200 grid grid-cols-1 lg:grid-cols-4 gap-3"
        onSubmit={(e) => { e.preventDefault(); if (!form.name || !form.url) return; create.mutate(form); }}
      >
        <Input placeholder="Nom du document" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="input-doc-name" />
        <Input placeholder="URL (https://...)" type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
        <select className="border border-neutral-300 px-3 text-sm h-10" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="contrat">Contrat</option>
          <option value="devis">Devis</option>
          <option value="inspiration">Inspiration</option>
          <option value="administratif">Administratif</option>
          <option value="misc">Autre</option>
        </select>
        <Button type="submit" className="rounded-none uppercase tracking-wider text-xs gap-2"><Plus className="w-3 h-3" /> Ajouter</Button>
      </form>

      <div className="bg-white border border-neutral-200">
        {docs.map((d) => (
          <div key={d.id} className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 last:border-0">
            <FileText className="w-5 h-5 text-neutral-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{d.name}</p>
              <p className="text-xs text-neutral-500">{d.category} · {new Date(d.createdAt).toLocaleDateString("fr-BE")}</p>
            </div>
            <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs uppercase tracking-wider flex items-center gap-1">
              Ouvrir <ExternalLink className="w-3 h-3" />
            </a>
            <button onClick={() => del.mutate(d.id)} className="text-neutral-400 hover:text-primary"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {docs.length === 0 && <p className="px-4 py-8 text-center text-neutral-400 text-sm">Aucun document</p>}
      </div>
    </div>
  );
}
