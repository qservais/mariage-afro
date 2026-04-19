import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Check } from "lucide-react";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Task { id: number; title: string; dueDate: string | null; assignee: string | null; done: boolean; category: string }

export default function PlanningPage() {
  const qc = useQueryClient();
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["client", "planning"],
    queryFn: () => clientApi.get<Task[]>("/api/client/planning"),
  });
  const [form, setForm] = useState({ title: "", dueDate: "", assignee: "" });

  const create = useMutation({
    mutationFn: (b: any) => clientApi.post("/api/client/planning", b),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client", "planning"] }); setForm({ title: "", dueDate: "", assignee: "" }); },
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) => clientApi.patch(`/api/client/planning/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "planning"] }),
  });
  const del = useMutation({
    mutationFn: (id: number) => clientApi.del(`/api/client/planning/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "planning"] }),
  });

  const sorted = [...tasks].sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="font-bold text-2xl">Planning</h2>
        <p className="text-sm text-neutral-600">Vos tâches de préparation avec dates cibles et responsables.</p>
      </div>

      <form
        className="bg-white p-4 border border-neutral-200 grid grid-cols-1 lg:grid-cols-4 gap-3"
        onSubmit={(e) => { e.preventDefault(); if (!form.title) return; create.mutate({ title: form.title, dueDate: form.dueDate || null, assignee: form.assignee || null }); }}
      >
        <Input placeholder="Tâche" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required data-testid="input-task-title" />
        <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        <Input placeholder="Responsable" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} />
        <Button type="submit" className="rounded-none uppercase tracking-wider text-xs gap-2"><Plus className="w-3 h-3" /> Ajouter</Button>
      </form>

      <div className="bg-white border border-neutral-200">
        {sorted.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 last:border-0">
            <button
              onClick={() => update.mutate({ id: t.id, body: { done: !t.done } })}
              className={`w-6 h-6 flex items-center justify-center border flex-shrink-0 ${t.done ? "bg-primary border-primary text-white" : "border-neutral-300"}`}
              aria-label="Toggle done"
            >
              {t.done && <Check className="w-3 h-3" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${t.done ? "line-through text-neutral-400" : ""}`}>{t.title}</p>
              <p className="text-xs text-neutral-500">
                {t.dueDate && <>échéance {new Date(t.dueDate).toLocaleDateString("fr-BE")}</>}
                {t.assignee && <> · {t.assignee}</>}
              </p>
            </div>
            <button onClick={() => del.mutate(t.id)} className="text-neutral-400 hover:text-primary"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {sorted.length === 0 && <p className="px-4 py-8 text-center text-neutral-400 text-sm">Aucune tâche</p>}
      </div>
    </div>
  );
}
