import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Guest, GuestCreate, GuestPatch } from "@/lib/clientTypes";

const RSVP_COLORS: Record<string, string> = { pending: "bg-amber-100 text-amber-800", confirmed: "bg-emerald-100 text-emerald-800", declined: "bg-rose-100 text-rose-800" };

export default function GuestsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: guests = [] } = useQuery<Guest[]>({
    queryKey: ["client", "guests"],
    queryFn: () => clientApi.get<Guest[]>("/api/client/guests"),
  });
  const [form, setForm] = useState({ firstName: "", lastName: "", side: "partner1", table: "" });

  const RSVP_LABELS = useMemo<Record<string, string>>(() => ({
    pending: t("invites.rsvp_pending"),
    confirmed: t("invites.rsvp_confirmed"),
    declined: t("invites.rsvp_declined"),
  }), [t]);
  const SIDE_LABELS = useMemo<Record<string, string>>(() => ({
    partner1: t("invites.side_partner1"),
    partner2: t("invites.side_partner2"),
    shared: t("invites.side_shared"),
  }), [t]);

  const create = useMutation({
    mutationFn: (b: GuestCreate) => clientApi.post<Guest>("/api/client/guests", b),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client", "guests"] }); setForm({ firstName: "", lastName: "", side: "partner1", table: "" }); },
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: GuestPatch }) => clientApi.patch<Guest>(`/api/client/guests/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "guests"] }),
  });
  const del = useMutation({
    mutationFn: (id: number) => clientApi.del(`/api/client/guests/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "guests"] }),
  });

  const importCsv = useMutation({
    mutationFn: (rows: GuestCreate[]) => clientApi.post<Guest[]>("/api/client/guests", rows),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "guests"] }),
  });

  const handleCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const rows = lines.slice(lines[0].toLowerCase().includes("prenom") || lines[0].toLowerCase().includes("first") || lines[0].toLowerCase().includes("voornaam") ? 1 : 0)
      .map((line) => {
        const [firstName, lastName, side, table] = line.split(/[,;]/).map((s) => s.trim());
        return { firstName: firstName || "?", lastName: lastName || "", side: side || "partner1", table: table || null };
      })
      .filter((r) => r.firstName && r.firstName !== "?");
    if (rows.length) importCsv.mutate(rows);
  };

  const total = guests.length;
  const confirmed = guests.filter((g) => g.rsvp === "confirmed").length;
  const declined = guests.filter((g) => g.rsvp === "declined").length;
  const pending = total - confirmed - declined;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-2xl">{t("invites.title")}</h2>
          <p className="text-sm text-neutral-600">{t("invites.subtitle")}</p>
        </div>
        <label className="cursor-pointer text-xs uppercase tracking-wider border border-neutral-300 px-4 py-2 hover:border-primary">
          {t("invites.import_csv")}
          <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleCsv(e.target.files[0])} />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-neutral-200"><p className="text-xs uppercase text-neutral-500 tracking-widest">{t("invites.total")}</p><p className="text-2xl font-bold">{total}</p></div>
        <div className="bg-white p-4 border border-neutral-200"><p className="text-xs uppercase text-neutral-500 tracking-widest">{t("invites.confirmed")}</p><p className="text-2xl font-bold text-emerald-700">{confirmed}</p></div>
        <div className="bg-white p-4 border border-neutral-200"><p className="text-xs uppercase text-neutral-500 tracking-widest">{t("invites.pending")}</p><p className="text-2xl font-bold text-amber-700">{pending}</p></div>
        <div className="bg-white p-4 border border-neutral-200"><p className="text-xs uppercase text-neutral-500 tracking-widest">{t("invites.declined")}</p><p className="text-2xl font-bold text-rose-700">{declined}</p></div>
      </div>

      <form
        className="bg-white p-4 border border-neutral-200 grid grid-cols-2 lg:grid-cols-5 gap-3"
        onSubmit={(e) => { e.preventDefault(); if (!form.firstName) return; create.mutate({ ...form, table: form.table || null }); }}
      >
        <Input placeholder={t("invites.first_name")} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required data-testid="input-guest-firstname" />
        <Input placeholder={t("invites.last_name")} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        <select className="border border-neutral-300 px-3 text-sm h-10" value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value })}>
          <option value="partner1">{SIDE_LABELS.partner1}</option>
          <option value="partner2">{SIDE_LABELS.partner2}</option>
          <option value="shared">{SIDE_LABELS.shared}</option>
        </select>
        <Input placeholder={t("invites.table")} value={form.table} onChange={(e) => setForm({ ...form, table: e.target.value })} />
        <Button type="submit" className="rounded-none uppercase tracking-wider text-xs gap-2"><Plus className="w-3 h-3" /> {t("invites.add")}</Button>
      </form>

      <div className="bg-white border border-neutral-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-background/40">
            <tr className="text-left text-xs uppercase tracking-widest text-neutral-600">
              <th className="px-4 py-3">{t("invites.th_name")}</th>
              <th className="px-4 py-3">{t("invites.th_side")}</th>
              <th className="px-4 py-3">{t("invites.th_table")}</th>
              <th className="px-4 py-3">{t("invites.th_rsvp")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {guests.map((g) => (
              <tr key={g.id} className="border-t border-neutral-100">
                <td className="px-4 py-3 font-medium">{g.firstName} {g.lastName}</td>
                <td className="px-4 py-3 text-neutral-600">{SIDE_LABELS[g.side] || g.side}</td>
                <td className="px-4 py-3 text-neutral-600">{g.table || "—"}</td>
                <td className="px-4 py-3">
                  <select
                    value={g.rsvp}
                    onChange={(e) => update.mutate({ id: g.id, body: { rsvp: e.target.value } })}
                    className={`text-xs px-2 py-1 ${RSVP_COLORS[g.rsvp]}`}
                  >
                    {Object.entries(RSVP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => del.mutate(g.id)} className="text-neutral-400 hover:text-primary"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {guests.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">{t("invites.empty")}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
