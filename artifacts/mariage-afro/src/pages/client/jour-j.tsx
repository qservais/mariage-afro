import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Check } from "lucide-react";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { JourJEvent, JourJEventCreate, JourJEventPatch, ClientVendor } from "@/lib/clientTypes";

interface Ev { id: number; time: string; title: string; responsible: string | null; done: boolean; notes: string | null }

export default function JourJPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: events = [] } = useQuery<Ev[]>({
    queryKey: ["client", "jour-j"],
    queryFn: () => clientApi.get<Ev[]>("/api/client/jour-j"),
  });
  const { data: vendors = [] } = useQuery<{ id: number; name: string; category: string; contactPhone: string | null }[]>({
    queryKey: ["client", "vendors"],
    queryFn: () => clientApi.get<ClientVendor[]>("/api/client/vendors"),
  });
  const [form, setForm] = useState({ time: "10:00", title: "", responsible: "" });

  const create = useMutation({
    mutationFn: (b: JourJEventCreate) => clientApi.post<JourJEvent>("/api/client/jour-j", b),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client", "jour-j"] }); setForm({ time: "10:00", title: "", responsible: "" }); },
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: JourJEventPatch }) => clientApi.patch<JourJEvent>(`/api/client/jour-j/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "jour-j"] }),
  });
  const del = useMutation({
    mutationFn: (id: number) => clientApi.del(`/api/client/jour-j/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "jour-j"] }),
  });

  const emergencyContacts = vendors.filter((v) => v.contactPhone);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="font-bold text-2xl">{t("jour_j.title")}</h2>
        <p className="text-sm text-neutral-600">{t("jour_j.subtitle")}</p>
      </div>

      <form
        className="bg-white p-4 border border-neutral-200 grid grid-cols-1 lg:grid-cols-4 gap-3"
        onSubmit={(e) => { e.preventDefault(); if (!form.title) return; create.mutate({ time: form.time, title: form.title, responsible: form.responsible || null }); }}
      >
        <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
        <Input placeholder={t("jour_j.event")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="lg:col-span-2" data-testid="input-event-title" />
        <Input placeholder={t("jour_j.responsible")} value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
        <Button type="submit" className="rounded-none uppercase tracking-wider text-xs gap-2 lg:col-span-4"><Plus className="w-3 h-3" /> {t("jour_j.add_to_timeline")}</Button>
      </form>

      <div className="bg-white border border-neutral-200">
        <div className="px-4 py-3 bg-background/40 text-xs uppercase tracking-widest font-bold border-b border-neutral-200">{t("jour_j.timeline")}</div>
        {events.map((ev) => (
          <div key={ev.id} className="flex items-center gap-4 px-4 py-3 border-b border-neutral-100 last:border-0">
            <div className="font-bold text-primary tabular-nums w-14">{ev.time}</div>
            <button
              onClick={() => update.mutate({ id: ev.id, body: { done: !ev.done } })}
              className={`w-6 h-6 flex items-center justify-center border flex-shrink-0 ${ev.done ? "bg-primary border-primary text-white" : "border-neutral-300"}`}
            >
              {ev.done && <Check className="w-3 h-3" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${ev.done ? "line-through text-neutral-400" : ""}`}>{ev.title}</p>
              {ev.responsible && <p className="text-xs text-neutral-500">{t("jour_j.responsible_label", { name: ev.responsible })}</p>}
            </div>
            <button onClick={() => del.mutate(ev.id)} className="text-neutral-400 hover:text-primary"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {events.length === 0 && <p className="px-4 py-8 text-center text-neutral-400 text-sm">{t("jour_j.no_event")}</p>}
      </div>

      <div className="bg-white border border-neutral-200">
        <div className="px-4 py-3 bg-background/40 text-xs uppercase tracking-widest font-bold border-b border-neutral-200">{t("jour_j.emergency")}</div>
        {emergencyContacts.map((v) => (
          <div key={v.id} className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 last:border-0">
            <div>
              <p className="text-sm font-medium">{v.name}</p>
              <p className="text-xs text-neutral-500">{v.category}</p>
            </div>
            <a href={`tel:${v.contactPhone}`} className="text-primary font-bold text-sm">{v.contactPhone}</a>
          </div>
        ))}
        {emergencyContacts.length === 0 && <p className="px-4 py-6 text-center text-neutral-400 text-sm">{t("jour_j.no_contacts")}</p>}
      </div>
    </div>
  );
}
