import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Download, ArrowUp, ArrowDown, Mail, X, Check } from "lucide-react";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Guest, GuestCreate, GuestPatch } from "@/lib/clientTypes";

const RSVP_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  declined: "bg-rose-100 text-rose-800",
};
const RSVP_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
};
const SOURCE_BADGE: Record<string, string> = {
  personal_invite: "bg-primary/10 text-primary",
  from_rsvp: "bg-blue-50 text-blue-700",
};

interface RsvpQuestion { id: number; label: string; type: "text" | "yesno" | "choice"; options: string[]; required: boolean; position: number; }
interface PublicRsvp { id: number; name: string; firstName: string; lastName: string; email: string | null; attending: boolean; guestCount: number; companionFirstName: string | null; companionLastName: string | null; message: string | null; status: "pending" | "accepted" | "rejected"; createdAt: string; }
interface RsvpsView { rsvps: PublicRsvp[]; answers: Record<number, { questionId: number; answer: string }[]>; }

type PublicFilter = "all" | "attending" | "declined";

export default function GuestsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: guests = [] } = useQuery<Guest[]>({
    queryKey: ["client", "guests"],
    queryFn: () => clientApi.get<Guest[]>("/api/client/guests"),
  });
  const { data: questions = [] } = useQuery<RsvpQuestion[]>({
    queryKey: ["client", "rsvp-questions"],
    queryFn: () => clientApi.get<RsvpQuestion[]>("/api/client/rsvp-questions"),
  });
  const { data: rsvpsView } = useQuery<RsvpsView>({
    queryKey: ["client", "rsvps"],
    queryFn: () => clientApi.get<RsvpsView>("/api/client/rsvps"),
  });

  const [form, setForm] = useState({ firstName: "", lastName: "", side: "partner1", table: "" });
  const [inviteForm, setInviteForm] = useState({ firstName: "", lastName: "", email: "", side: "partner1" });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [qForm, setQForm] = useState({ label: "", type: "text" as "text" | "yesno" | "choice", options: "", required: false });
  const [publicFilter, setPublicFilter] = useState<PublicFilter>("all");

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
  const sendInvite = useMutation({
    mutationFn: (body: { firstName: string; lastName: string; email?: string | null; side: string }) =>
      clientApi.post<Guest>("/api/client/guests/invite", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", "guests"] });
      setInviteSent(true);
      setTimeout(() => { setInviteOpen(false); setInviteSent(false); setInviteForm({ firstName: "", lastName: "", email: "", side: "partner1" }); }, 1500);
    },
  });
  const approveRsvp = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "accepted" | "rejected" }) =>
      clientApi.patch<PublicRsvp>(`/api/client/rsvps/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client", "rsvps"] }); qc.invalidateQueries({ queryKey: ["client", "guests"] }); },
  });

  const createQ = useMutation({
    mutationFn: () => clientApi.post("/api/client/rsvp-questions", {
      label: qForm.label, type: qForm.type, required: qForm.required,
      options: qForm.options.split(",").map((s) => s.trim()).filter(Boolean),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client", "rsvp-questions"] }); setQForm({ label: "", type: "text", options: "", required: false }); },
  });
  const delQ = useMutation({
    mutationFn: (id: number) => clientApi.del(`/api/client/rsvp-questions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "rsvp-questions"] }),
  });
  const patchQ = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<RsvpQuestion> }) =>
      clientApi.patch(`/api/client/rsvp-questions/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "rsvp-questions"] }),
  });

  const moveQuestion = (idx: number, direction: -1 | 1) => {
    const sorted = [...questions].sort((a, b) => a.position - b.position);
    const target = idx + direction;
    if (target < 0 || target >= sorted.length) return;
    const a = sorted[idx]; const b = sorted[target];
    patchQ.mutate({ id: a.id, body: { position: b.position } });
    patchQ.mutate({ id: b.id, body: { position: a.position } });
  };

  const handleCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const rows = lines.slice(lines[0].toLowerCase().includes("prenom") || lines[0].toLowerCase().includes("first") || lines[0].toLowerCase().includes("voornaam") ? 1 : 0)
      .map((line) => {
        const [firstName, lastName, side, table] = line.split(/[,;]/).map((s) => s.trim());
        return { firstName: firstName || "?", lastName: lastName || "", side: side || "partner1", table: table || null };
      }).filter((r) => r.firstName && r.firstName !== "?");
    if (rows.length) importCsv.mutate(rows);
  };

  const exportRsvpCsv = () => {
    const v = rsvpsView; if (!v || v.rsvps.length === 0) return;
    const escape = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
    const header = ["Date", "Nom", "Email", "Présent", "Pers.", "Statut", "Message", ...questions.map((q) => q.label)];
    const lines = [header.map(escape).join(",")];
    for (const r of v.rsvps) {
      const ansMap = new Map((v.answers[r.id] || []).map((a) => [a.questionId, a.answer]));
      const row = [
        new Date(r.createdAt).toLocaleString(), r.name, r.email || "",
        r.attending ? t("invites.yes") : t("invites.no"),
        String(r.guestCount), r.status,
        r.message || "", ...questions.map((q) => ansMap.get(q.id) || ""),
      ];
      lines.push(row.map(escape).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `rsvp-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // --- Stats ---
  const confirmed = guests.filter((g) => g.rsvp === "confirmed").length;
  const declined = guests.filter((g) => g.rsvp === "declined").length;
  const pending = guests.length - confirmed - declined;

  // New 3 counters
  const linkGuests = guests.filter((g) => g.source === "from_rsvp").length;
  const personalGuests = guests.filter((g) => g.source === "personal_invite").length;
  const totalNewGuests = linkGuests + personalGuests;

  const sortedQuestions = [...questions].sort((a, b) => a.position - b.position);
  const allRsvps = rsvpsView?.rsvps || [];
  const pubAttending = allRsvps.filter((r) => r.attending);
  const pubDeclined = allRsvps.filter((r) => !r.attending);
  const pubGuestSum = pubAttending.reduce((s, r) => s + (r.guestCount || 0), 0);
  const filteredRsvps = publicFilter === "all" ? allRsvps : publicFilter === "attending" ? pubAttending : pubDeclined;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-2xl">{t("invites.title")}</h2>
          <p className="text-sm text-neutral-600">{t("invites.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            className="rounded-none gap-2 text-xs uppercase tracking-wider"
            onClick={() => setInviteOpen(true)}
          >
            <Mail className="w-3.5 h-3.5" aria-hidden="true" />
            {t("invites.invite_personal")}
          </Button>
          <label className="cursor-pointer text-xs uppercase tracking-wider border border-neutral-300 px-4 py-2 hover:border-primary">
            {t("invites.import_csv")}
            <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleCsv(e.target.files[0])} />
          </label>
        </div>
      </div>

      {/* 3 new counters */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-neutral-200">
          <p className="text-xs uppercase text-neutral-500 tracking-widest">{t("invites.stat_link_guests")}</p>
          <p className="text-2xl font-bold text-blue-700">{linkGuests}</p>
        </div>
        <div className="bg-white p-4 border border-neutral-200">
          <p className="text-xs uppercase text-neutral-500 tracking-widest">{t("invites.stat_personal_guests")}</p>
          <p className="text-2xl font-bold text-primary">{personalGuests}</p>
        </div>
        <div className="bg-white p-4 border border-neutral-200">
          <p className="text-xs uppercase text-neutral-500 tracking-widest">{t("invites.stat_total_guests")}</p>
          <p className="text-2xl font-bold">{totalNewGuests}</p>
        </div>
      </div>

      {/* Internal RSVP stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-neutral-200"><p className="text-xs uppercase text-neutral-500 tracking-widest">{t("invites.total")}</p><p className="text-2xl font-bold">{guests.length}</p></div>
        <div className="bg-white p-4 border border-neutral-200"><p className="text-xs uppercase text-neutral-500 tracking-widest">{t("invites.confirmed")}</p><p className="text-2xl font-bold text-emerald-700">{confirmed}</p></div>
        <div className="bg-white p-4 border border-neutral-200"><p className="text-xs uppercase text-neutral-500 tracking-widest">{t("invites.pending")}</p><p className="text-2xl font-bold text-amber-700">{pending}</p></div>
        <div className="bg-white p-4 border border-neutral-200"><p className="text-xs uppercase text-neutral-500 tracking-widest">{t("invites.declined")}</p><p className="text-2xl font-bold text-rose-700">{declined}</p></div>
      </div>

      {/* Manual add form */}
      <form
        className="bg-white p-4 border border-neutral-200 grid grid-cols-2 lg:grid-cols-5 gap-3"
        onSubmit={(e) => { e.preventDefault(); if (!form.firstName) return; create.mutate({ ...form, table: form.table || null }); }}
      >
        <div>
          <label htmlFor="guest-firstname" className="sr-only">{t("invites.first_name")}</label>
          <Input id="guest-firstname" placeholder={t("invites.first_name")} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required data-testid="input-guest-firstname" />
        </div>
        <div>
          <label htmlFor="guest-lastname" className="sr-only">{t("invites.last_name")}</label>
          <Input id="guest-lastname" placeholder={t("invites.last_name")} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        </div>
        <div>
          <label htmlFor="guest-side" className="sr-only">{t("invites.th_side")}</label>
          <select id="guest-side" aria-label={t("invites.th_side")} className="border border-neutral-300 px-3 text-sm h-10 w-full" value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value })}>
            <option value="partner1">{SIDE_LABELS.partner1}</option>
            <option value="partner2">{SIDE_LABELS.partner2}</option>
            <option value="shared">{SIDE_LABELS.shared}</option>
          </select>
        </div>
        <div>
          <label htmlFor="guest-table" className="sr-only">{t("invites.table")}</label>
          <Input id="guest-table" placeholder={t("invites.table")} value={form.table} onChange={(e) => setForm({ ...form, table: e.target.value })} />
        </div>
        <Button type="submit" className="rounded-none uppercase tracking-wider text-xs gap-2"><Plus className="w-3 h-3" aria-hidden="true" /> {t("invites.add")}</Button>
      </form>

      {/* Guest list table */}
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
                <td className="px-4 py-3 font-medium">
                  <span>{g.firstName} {g.lastName}</span>
                  {g.source !== "manual" && (
                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 ${SOURCE_BADGE[g.source] || ""}`}>
                      {g.source === "personal_invite" ? t("invites.badge_personal") : t("invites.badge_from_rsvp")}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-600">{SIDE_LABELS[g.side] || g.side}</td>
                <td className="px-4 py-3 text-neutral-600">{g.table || "—"}</td>
                <td className="px-4 py-3">
                  <select
                    value={g.rsvp}
                    onChange={(e) => update.mutate({ id: g.id, body: { rsvp: e.target.value } })}
                    className={`text-xs px-2 py-1 ${RSVP_COLORS[g.rsvp]}`}
                    aria-label={t("invites.rsvp_for", { name: `${g.firstName} ${g.lastName}` })}
                  >
                    {Object.entries(RSVP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => del.mutate(g.id)} className="text-neutral-400 hover:text-primary" aria-label={t("invites.delete", { defaultValue: "Supprimer" })}><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
                </td>
              </tr>
            ))}
            {guests.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">{t("invites.empty")}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* RSVP custom questions */}
      <div className="bg-white border border-neutral-200 p-5 space-y-4">
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider">{t("invites.custom_questions")}</h3>
          <p className="text-xs text-neutral-500 mt-1">{t("invites.custom_questions_desc")}</p>
        </div>
        <form className="grid sm:grid-cols-12 gap-2" onSubmit={(e) => { e.preventDefault(); if (qForm.label.trim()) createQ.mutate(); }}>
          <Input placeholder={t("invites.question_label")} value={qForm.label} onChange={(e) => setQForm({ ...qForm, label: e.target.value })} className="sm:col-span-5 rounded-none" data-testid="input-question-label" />
          <select value={qForm.type} onChange={(e) => setQForm({ ...qForm, type: e.target.value as "text" | "yesno" | "choice" })} className="sm:col-span-2 border border-neutral-300 h-10 px-2 text-sm">
            <option value="text">{t("invites.q_type_text")}</option>
            <option value="yesno">{t("invites.q_type_yesno")}</option>
            <option value="choice">{t("invites.q_type_choice")}</option>
          </select>
          <Input placeholder={t("invites.options_csv")} value={qForm.options} onChange={(e) => setQForm({ ...qForm, options: e.target.value })} className="sm:col-span-3 rounded-none" disabled={qForm.type !== "choice"} />
          <label className="flex items-center gap-1 text-xs sm:col-span-1"><input type="checkbox" checked={qForm.required} onChange={(e) => setQForm({ ...qForm, required: e.target.checked })} /> {t("invites.required")}</label>
          <Button type="submit" className="sm:col-span-1 rounded-none gap-1"><Plus className="w-3 h-3" /></Button>
        </form>
        <ul className="divide-y divide-neutral-100">
          {sortedQuestions.map((q, idx) => (
            <li key={q.id} className="py-2 flex items-center justify-between text-sm gap-2" data-testid={`question-row-${q.id}`}>
              <span className="flex-1"><strong>{q.label}</strong> <span className="text-neutral-500">— {t(`invites.q_type_${q.type}`)}{q.required ? " · " + t("invites.required") : ""}</span></span>
              <div className="flex items-center gap-1">
                <button onClick={() => moveQuestion(idx, -1)} disabled={idx === 0 || patchQ.isPending} className="p-1 text-neutral-500 hover:text-primary disabled:opacity-30" aria-label={t("invites.move_up")} data-testid={`button-up-${q.id}`}><ArrowUp className="w-4 h-4" /></button>
                <button onClick={() => moveQuestion(idx, 1)} disabled={idx === sortedQuestions.length - 1 || patchQ.isPending} className="p-1 text-neutral-500 hover:text-primary disabled:opacity-30" aria-label={t("invites.move_down")} data-testid={`button-down-${q.id}`}><ArrowDown className="w-4 h-4" /></button>
                <button onClick={() => delQ.mutate(q.id)} className="p-1 text-neutral-400 hover:text-primary" aria-label={t("invites.delete", { defaultValue: "Supprimer" })}><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
              </div>
            </li>
          ))}
          {sortedQuestions.length === 0 && <li className="py-4 text-sm text-neutral-400 text-center">{t("invites.no_questions")}</li>}
        </ul>
      </div>

      {/* Public RSVPs with approval */}
      <div className="bg-white border border-neutral-200 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider">{t("invites.public_rsvps")}</h3>
            <p className="text-xs text-neutral-500 mt-1">{t("invites.public_rsvps_desc")}</p>
          </div>
          <Button variant="outline" className="rounded-none gap-2 text-xs" disabled={!allRsvps.length} onClick={exportRsvpCsv}>
            <Download className="w-3.5 h-3.5" /> {t("invites.export_csv")}
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-background/40 p-3 border border-neutral-200"><p className="text-[10px] uppercase text-neutral-500 tracking-widest">{t("invites.total_rsvps")}</p><p className="text-xl font-bold" data-testid="stat-total-rsvps">{allRsvps.length}</p></div>
          <div className="bg-background/40 p-3 border border-neutral-200"><p className="text-[10px] uppercase text-neutral-500 tracking-widest">{t("invites.attending")}</p><p className="text-xl font-bold text-emerald-700" data-testid="stat-attending">{pubAttending.length}</p></div>
          <div className="bg-background/40 p-3 border border-neutral-200"><p className="text-[10px] uppercase text-neutral-500 tracking-widest">{t("invites.declined")}</p><p className="text-xl font-bold text-rose-700" data-testid="stat-declined">{pubDeclined.length}</p></div>
          <div className="bg-background/40 p-3 border border-neutral-200"><p className="text-[10px] uppercase text-neutral-500 tracking-widest">{t("invites.guest_total")}</p><p className="text-xl font-bold" data-testid="stat-guest-total">{pubGuestSum}</p></div>
        </div>

        <div className="flex gap-2 text-xs">
          {(["all", "attending", "declined"] as PublicFilter[]).map((k) => (
            <button
              key={k}
              onClick={() => setPublicFilter(k)}
              className={`px-3 py-1.5 border ${publicFilter === k ? "border-primary bg-primary text-white" : "border-neutral-300 hover:border-primary"}`}
              data-testid={`filter-${k}`}
            >
              {t(`invites.filter_${k}`)}
            </button>
          ))}
        </div>

        {!filteredRsvps.length ? (
          <p className="text-sm text-neutral-500">{t("invites.no_rsvps")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background/40">
                <tr className="text-left text-xs uppercase tracking-widest text-neutral-600">
                  <th className="px-3 py-2">{t("invites.th_date")}</th>
                  <th className="px-3 py-2">{t("invites.th_name")}</th>
                  <th className="px-3 py-2">{t("invites.th_email")}</th>
                  <th className="px-3 py-2">{t("invites.th_attending")}</th>
                  <th className="px-3 py-2">{t("invites.th_guests")}</th>
                  <th className="px-3 py-2">{t("invites.th_status")}</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRsvps.map((r) => (
                  <tr key={r.id} className={`border-t border-neutral-100 align-top ${r.status === "rejected" ? "opacity-50" : ""}`}>
                    <td className="px-3 py-2 text-xs text-neutral-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 font-medium">
                      {r.firstName ? `${r.firstName} ${r.lastName}`.trim() : r.name}
                      {r.companionFirstName && (
                        <div className="text-xs text-neutral-500 mt-0.5">
                          + {[r.companionFirstName, r.companionLastName].filter(Boolean).join(" ")}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-neutral-600">{r.email || "—"}</td>
                    <td className="px-3 py-2"><span className={`text-xs px-2 py-1 ${r.attending ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>{r.attending ? t("invites.yes") : t("invites.no")}</span></td>
                    <td className="px-3 py-2">{r.guestCount}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-1 ${RSVP_STATUS_COLORS[r.status] || "bg-neutral-100 text-neutral-600"}`}>
                        {t(`invites.rsvp_status_${r.status}`)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {r.status === "pending" && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => approveRsvp.mutate({ id: r.id, status: "accepted" })}
                            disabled={approveRsvp.isPending}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 disabled:opacity-50"
                            aria-label={t("invites.rsvp_accept")}
                            title={t("invites.rsvp_accept")}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => approveRsvp.mutate({ id: r.id, status: "rejected" })}
                            disabled={approveRsvp.isPending}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 disabled:opacity-50"
                            aria-label={t("invites.rsvp_reject")}
                            title={t("invites.rsvp_reject")}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Personal invitation modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) setInviteOpen(false); }}>
          <div className="bg-white w-full max-w-md mx-4 p-6 space-y-5 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg">{t("invites.invite_modal_title")}</h3>
                <p className="text-xs text-neutral-500 mt-1">{t("invites.invite_modal_desc")}</p>
              </div>
              <button onClick={() => setInviteOpen(false)} className="text-neutral-400 hover:text-neutral-700 p-1"><X className="w-5 h-5" /></button>
            </div>

            {inviteSent ? (
              <div className="flex flex-col items-center gap-3 py-6 text-emerald-700">
                <Check className="w-10 h-10" />
                <p className="font-medium text-sm">{t("invites.invite_success")}</p>
              </div>
            ) : (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!inviteForm.firstName) return;
                  sendInvite.mutate({
                    firstName: inviteForm.firstName,
                    lastName: inviteForm.lastName || undefined,
                    email: inviteForm.email || null,
                    side: inviteForm.side,
                  });
                }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-neutral-500 mb-1 block">{t("invites.first_name")} *</label>
                    <Input value={inviteForm.firstName} onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })} required />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-neutral-500 mb-1 block">{t("invites.last_name")}</label>
                    <Input value={inviteForm.lastName} onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-neutral-500 mb-1 block">{t("invites.th_email")}</label>
                  <Input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="email@exemple.com (optionnel)" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-neutral-500 mb-1 block">{t("invites.th_side")}</label>
                  <select className="border border-neutral-300 px-3 text-sm h-10 w-full" value={inviteForm.side} onChange={(e) => setInviteForm({ ...inviteForm, side: e.target.value })}>
                    <option value="partner1">{SIDE_LABELS.partner1}</option>
                    <option value="partner2">{SIDE_LABELS.partner2}</option>
                    <option value="shared">{SIDE_LABELS.shared}</option>
                  </select>
                </div>
                <Button type="submit" className="w-full rounded-none uppercase tracking-wider text-xs gap-2" disabled={sendInvite.isPending}>
                  <Mail className="w-3.5 h-3.5" />
                  {t("invites.invite_btn_send")}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
