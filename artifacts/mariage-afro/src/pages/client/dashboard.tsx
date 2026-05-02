import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Wallet, Users, ListChecks, Briefcase, FileText, Sparkles, UserCircle } from "lucide-react";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCouple } from "@/components/client/ClientLayout";

interface TileDef {
  to: string;
  labelKey: string;
  icon: typeof Wallet;
  color: string;
}

const TILES: TileDef[] = [
  { to: "/espace-client/budget", labelKey: "client_dashboard.tile.budget", icon: Wallet, color: "bg-rose-50" },
  { to: "/espace-client/invites", labelKey: "client_dashboard.tile.invites", icon: Users, color: "bg-amber-50" },
  { to: "/espace-client/planning", labelKey: "client_dashboard.tile.planning", icon: ListChecks, color: "bg-emerald-50" },
  { to: "/espace-client/prestataires", labelKey: "client_dashboard.tile.vendors", icon: Briefcase, color: "bg-blue-50" },
  { to: "/espace-client/documents", labelKey: "client_dashboard.tile.documents", icon: FileText, color: "bg-purple-50" },
  { to: "/espace-client/jour-j", labelKey: "client_dashboard.tile.day", icon: Sparkles, color: "bg-orange-50" },
  { to: "/espace-client/profil", labelKey: "client_dashboard.tile.profile", icon: UserCircle, color: "bg-teal-50" },
];

interface Task { id: number; title: string; done: boolean; dueDate: string | null }

const LOCALE_MAP: Record<string, string> = { fr: "fr-BE", nl: "nl-BE", en: "en-GB" };

export default function ClientDashboard() {
  const { t, i18n } = useTranslation();
  const dateLocale = LOCALE_MAP[(i18n.resolvedLanguage || i18n.language || "fr").split("-")[0]] || "fr-BE";
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
  const done = tasks.filter((task) => task.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const nextTask = tasks.find((task) => !task.done);

  const startEdit = () => {
    setP1(couple?.partner1Name || "");
    setP2(couple?.partner2Name || "");
    setDate(couple?.weddingDate || "");
    setEditing(true);
  };

  const formattedWeddingDate = couple?.weddingDate
    ? new Date(couple.weddingDate).toLocaleDateString(dateLocale, { day: "2-digit", month: "long", year: "numeric" })
    : t("client_dashboard.to_be_defined");

  return (
    <div className="space-y-8 max-w-6xl">
      <section className="bg-white p-6 border border-neutral-200">
        {!editing ? (
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-neutral-500">{t("client_dashboard.your_project")}</p>
              <p className="text-lg font-medium mt-1">
                {couple?.partner1Name || "—"} & {couple?.partner2Name || "—"}
              </p>
              <p className="text-sm text-neutral-600 mt-1">
                {t("client_dashboard.wedding_planned_on", { date: formattedWeddingDate })}
              </p>
            </div>
            <Button variant="outline" className="rounded-none uppercase tracking-wider text-xs" onClick={startEdit}>
              {t("client_dashboard.edit")}
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); updateCouple.mutate({ partner1Name: p1, partner2Name: p2, weddingDate: date }); }}
            className="space-y-4"
          >
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("client_dashboard.partner1")}</label>
                <Input value={p1} onChange={(e) => setP1(e.target.value)} placeholder={t("client_dashboard.name_placeholder")} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("client_dashboard.partner2")}</label>
                <Input value={p2} onChange={(e) => setP2(e.target.value)} placeholder={t("client_dashboard.name_placeholder")} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("client_dashboard.wedding_date")}</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="rounded-none uppercase tracking-wider text-xs">{t("client_dashboard.save")}</Button>
              <Button type="button" variant="outline" className="rounded-none uppercase tracking-wider text-xs" onClick={() => setEditing(false)}>{t("client_dashboard.cancel")}</Button>
            </div>
          </form>
        )}
      </section>

      <section className="bg-white p-6 border border-neutral-200">
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs uppercase tracking-widest text-neutral-500">{t("client_dashboard.progress_title")}</p>
          <p className="text-sm font-bold text-primary">{t("client_dashboard.progress_count", { pct, done, total })}</p>
        </div>
        <div className="h-2 bg-neutral-100 overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        {nextTask && (
          <p className="text-sm text-neutral-600 mt-3">
            <span className="font-medium">{t("client_dashboard.next_task")}</span> {nextTask.title}
            {nextTask.dueDate ? t("client_dashboard.next_task_due", { date: nextTask.dueDate }) : ""}
          </p>
        )}
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          const label = t(tile.labelKey);
          return (
            <Link
              key={tile.to}
              to={tile.to}
              className="bg-white p-6 border border-neutral-200 hover:border-primary transition-colors group"
              data-testid={`tile-${tile.to.split("/").pop()}`}
            >
              <div className={`w-12 h-12 ${tile.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <p className="font-bold text-lg group-hover:text-primary">{label}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
