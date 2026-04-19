import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Wallet, Users, ListChecks, Briefcase, FileText, Sparkles } from "lucide-react";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCouple } from "@/components/client/ClientLayout";

const TILES = [
  { to: "/espace-client/budget", label: "Budget", icon: Wallet, color: "bg-rose-50" },
  { to: "/espace-client/invites", label: "Invités", icon: Users, color: "bg-amber-50" },
  { to: "/espace-client/planning", label: "Planning", icon: ListChecks, color: "bg-emerald-50" },
  { to: "/espace-client/prestataires", label: "Prestataires", icon: Briefcase, color: "bg-blue-50" },
  { to: "/espace-client/documents", label: "Documents", icon: FileText, color: "bg-purple-50" },
  { to: "/espace-client/jour-j", label: "Jour J", icon: Sparkles, color: "bg-orange-50" },
];

interface Task { id: number; title: string; done: boolean; dueDate: string | null }

export default function ClientDashboard() {
  const { data: couple } = useCouple();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [date, setDate] = useState("");

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["client", "planning"],
    queryFn: () => clientApi.get<Task[]>("/api/client/planning"),
  });

  const updateCouple = useMutation({
    mutationFn: (b: { partner1Name?: string; partner2Name?: string; weddingDate?: string }) =>
      clientApi.patch("/api/client/me", b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", "me"] });
      setEditing(false);
    },
  });

  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const nextTask = tasks.find((t) => !t.done);

  const startEdit = () => {
    setP1(couple?.partner1Name || "");
    setP2(couple?.partner2Name || "");
    setDate(couple?.weddingDate || "");
    setEditing(true);
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Profile card */}
      <section className="bg-white p-6 border border-neutral-200">
        {!editing ? (
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-neutral-500">Votre projet</p>
              <p className="text-lg font-medium mt-1">
                {couple?.partner1Name || "—"} & {couple?.partner2Name || "—"}
              </p>
              <p className="text-sm text-neutral-600 mt-1">
                Mariage prévu le {couple?.weddingDate ? new Date(couple.weddingDate).toLocaleDateString("fr-BE", { day: "2-digit", month: "long", year: "numeric" }) : "à définir"}
              </p>
            </div>
            <Button variant="outline" className="rounded-none uppercase tracking-wider text-xs" onClick={startEdit}>
              Modifier
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); updateCouple.mutate({ partner1Name: p1, partner2Name: p2, weddingDate: date }); }}
            className="space-y-4"
          >
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">Partenaire 1</label>
                <Input value={p1} onChange={(e) => setP1(e.target.value)} placeholder="Prénom" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">Partenaire 2</label>
                <Input value={p2} onChange={(e) => setP2(e.target.value)} placeholder="Prénom" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">Date du mariage</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="rounded-none uppercase tracking-wider text-xs">Enregistrer</Button>
              <Button type="button" variant="outline" className="rounded-none uppercase tracking-wider text-xs" onClick={() => setEditing(false)}>Annuler</Button>
            </div>
          </form>
        )}
      </section>

      {/* Progress */}
      <section className="bg-white p-6 border border-neutral-200">
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs uppercase tracking-widest text-neutral-500">Progression globale</p>
          <p className="text-sm font-bold text-primary">{pct}% — {done}/{total} tâches</p>
        </div>
        <div className="h-2 bg-neutral-100 overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        {nextTask && (
          <p className="text-sm text-neutral-600 mt-3">
            <span className="font-medium">Prochaine tâche :</span> {nextTask.title}
            {nextTask.dueDate ? ` — d'ici le ${nextTask.dueDate}` : ""}
          </p>
        )}
      </section>

      {/* Tiles */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TILES.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className="bg-white p-6 border border-neutral-200 hover:border-primary transition-colors group"
              data-testid={`tile-${t.label.toLowerCase()}`}
            >
              <div className={`w-12 h-12 ${t.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <p className="font-bold text-lg group-hover:text-primary">{t.label}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
