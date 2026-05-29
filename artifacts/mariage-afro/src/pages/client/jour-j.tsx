import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Check, QrCode, ExternalLink, Globe, GlobeLock } from "lucide-react";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { JourJEvent, JourJEventCreate, JourJEventPatch, ClientVendor } from "@/lib/clientTypes";

interface Ev { id: number; time: string; title: string; responsible: string | null; done: boolean; notes: string | null }

interface JourJPublicConfig {
  weddingWebsiteId?: number;
  slug?: string;
  enabled: boolean;
  menuText: string;
  timeline: { time: string; label: string }[];
  bioPartner1: string;
  bioPartner2: string;
  driveUrl: string | null;
  photoAlbumUrl: string | null;
  qrDataUrl?: string;
}

export default function JourJPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();

  // ---- Internal timeline ----
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

  // ---- Public Jour-J Page ----
  const { data: publicCfg } = useQuery<JourJPublicConfig | null>({
    queryKey: ["client", "wedding-jour-j"],
    queryFn: () => clientApi.get<JourJPublicConfig | null>("/api/client/wedding-jour-j"),
  });

  const [pubForm, setPubForm] = useState<JourJPublicConfig | null>(null);
  const [pubEditing, setPubEditing] = useState(false);
  const [newStep, setNewStep] = useState({ time: "10:00", label: "" });

  const savePublic = useMutation({
    mutationFn: (b: Partial<JourJPublicConfig>) => clientApi.patch<JourJPublicConfig>("/api/client/wedding-jour-j", b),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["client", "wedding-jour-j"] });
      setPubEditing(false);
      setPubForm(null);
      toast({ title: t("jour_j_public.saved") });
    },
  });

  const toggleEnabled = useMutation({
    mutationFn: (enabled: boolean) => clientApi.patch<JourJPublicConfig>("/api/client/wedding-jour-j", { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "wedding-jour-j"] }),
  });

  const startEdit = () => {
    if (!publicCfg) return;
    setPubForm({ ...publicCfg });
    setPubEditing(true);
  };

  const addStep = () => {
    if (!pubForm || !newStep.label) return;
    setPubForm({ ...pubForm, timeline: [...pubForm.timeline, { time: newStep.time, label: newStep.label }] });
    setNewStep({ time: "10:00", label: "" });
  };

  const removeStep = (i: number) => {
    if (!pubForm) return;
    setPubForm({ ...pubForm, timeline: pubForm.timeline.filter((_, idx) => idx !== i) });
  };

  const publicUrl = publicCfg?.slug ? `/mariage/${publicCfg.slug}/jour-j` : null;
  const qrDataUrl = publicCfg?.qrDataUrl ?? null;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="font-bold text-2xl">{t("jour_j.title")}</h2>
        <p className="text-sm text-neutral-600">{t("jour_j.subtitle")}</p>
      </div>

      <form
        className="bg-cream p-4 border border-neutral-200 grid grid-cols-1 lg:grid-cols-4 gap-3"
        onSubmit={(e) => { e.preventDefault(); if (!form.title) return; create.mutate({ time: form.time, title: form.title, responsible: form.responsible || null }); }}
      >
        <div>
          <label htmlFor="event-time" className="sr-only">{t("jour_j.time_label", { defaultValue: "Heure" })}</label>
          <Input id="event-time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
        </div>
        <div className="lg:col-span-2">
          <label htmlFor="event-title" className="sr-only">{t("jour_j.event")}</label>
          <Input id="event-title" placeholder={t("jour_j.event")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required data-testid="input-event-title" />
        </div>
        <div>
          <label htmlFor="event-responsible" className="sr-only">{t("jour_j.responsible")}</label>
          <Input id="event-responsible" placeholder={t("jour_j.responsible")} value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
        </div>
        <Button type="submit" className="rounded-none uppercase tracking-wider text-xs gap-2 lg:col-span-4"><Plus className="w-3 h-3" aria-hidden="true" /> {t("jour_j.add_to_timeline")}</Button>
      </form>

      <div className="bg-cream border border-neutral-200">
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
            <button onClick={() => del.mutate(ev.id)} className="text-neutral-400 hover:text-primary" aria-label={t("jour_j.delete", { defaultValue: "Supprimer" })}><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
          </div>
        ))}
        {events.length === 0 && <p className="px-4 py-8 text-center text-neutral-400 text-sm">{t("jour_j.no_event")}</p>}
      </div>

      <div className="bg-cream border border-neutral-200">
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

      {/* ---- PUBLIC JOUR-J PAGE ---- */}
      <div className="bg-cream border border-neutral-200">
        <div className="px-4 py-3 bg-background/40 border-b border-neutral-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-primary" />
            <span className="text-xs uppercase tracking-widest font-bold">{t("jour_j_public.title")}</span>
          </div>
          {publicCfg && (
            <span className={`text-xs font-bold px-2 py-0.5 ${publicCfg.enabled ? "bg-gold/10 text-gold-deep" : "bg-neutral-100 text-neutral-500"}`}>
              {publicCfg.enabled ? t("jour_j_public.enabled_badge") : t("jour_j_public.disabled_badge")}
            </span>
          )}
        </div>

        {publicCfg === undefined ? (
          <p className="px-4 py-6 text-sm text-neutral-400">{t("jour_j_public.no_site")}</p>
        ) : publicCfg === null ? (
          <p className="px-4 py-6 text-sm text-neutral-400">{t("jour_j_public.no_site")}</p>
        ) : !pubEditing ? (
          <div className="p-4 space-y-4">
            <p className="text-sm text-neutral-600">{t("jour_j_public.subtitle")}</p>

            {/* QR Code + controls */}
            <div className="flex flex-wrap gap-6 items-start">
              {qrDataUrl && (
                <div className="shrink-0 text-center">
                  <img src={qrDataUrl} alt={t("jour_j_public.qr_alt", { defaultValue: "QR code vers la page Jour-J publique" })} className="w-[140px] h-[140px] border border-neutral-200" />
                  <p className="text-xs text-neutral-500 mt-2">{t("jour_j_public.qr_desc")}</p>
                </div>
              )}
              <div className="flex flex-col gap-3 flex-1 min-w-[180px]">
                {publicUrl && (
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-primary underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {t("jour_j_public.view_page")}
                  </a>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none uppercase tracking-wider text-xs gap-2"
                    onClick={() => toggleEnabled.mutate(!publicCfg.enabled)}
                    disabled={toggleEnabled.isPending}
                  >
                    {publicCfg.enabled
                      ? <><GlobeLock className="w-3 h-3" />{t("jour_j_public.toggle_off")}</>
                      : <><Globe className="w-3 h-3" />{t("jour_j_public.toggle_on")}</>
                    }
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none uppercase tracking-wider text-xs"
                    onClick={startEdit}
                  >
                    {t("jour_j_public.save")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Summary of configured content */}
            {(publicCfg.menuText || publicCfg.timeline.length > 0 || publicCfg.bioPartner1 || publicCfg.bioPartner2 || publicCfg.photoAlbumUrl || publicCfg.driveUrl) && (
              <div className="grid sm:grid-cols-2 gap-3 text-xs text-neutral-600 border-t border-neutral-100 pt-4">
                {publicCfg.menuText && <div><span className="font-semibold text-neutral-800">{t("jour_j_public.section_menu")} :</span> {publicCfg.menuText.slice(0, 60)}{publicCfg.menuText.length > 60 ? "…" : ""}</div>}
                {publicCfg.timeline.length > 0 && <div><span className="font-semibold text-neutral-800">{t("jour_j_public.section_timeline")} :</span> {publicCfg.timeline.length} étape(s)</div>}
                {publicCfg.bioPartner1 && <div><span className="font-semibold text-neutral-800">{t("jour_j_public.section_bio1")} :</span> {publicCfg.bioPartner1.slice(0, 40)}…</div>}
                {(publicCfg.photoAlbumUrl || publicCfg.driveUrl) && <div><span className="font-semibold text-neutral-800">{t("jour_j_public.section_photo_album")} :</span> ✓</div>}
              </div>
            )}
            <Button size="sm" className="rounded-none uppercase tracking-wider text-xs mt-2" onClick={startEdit}>
              {t("jour_j_public.edit_content")}
            </Button>
          </div>
        ) : pubForm ? (
          <form
            className="p-4 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              savePublic.mutate({
                menuText: pubForm.menuText,
                bioPartner1: pubForm.bioPartner1,
                bioPartner2: pubForm.bioPartner2,
                driveUrl: pubForm.driveUrl,
                photoAlbumUrl: pubForm.photoAlbumUrl,
                timeline: pubForm.timeline,
              });
            }}
          >
            {/* Menu */}
            <div>
              <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("jour_j_public.section_menu")}</label>
              <Textarea
                value={pubForm.menuText}
                onChange={(e) => setPubForm({ ...pubForm, menuText: e.target.value })}
                placeholder={t("jour_j_public.section_menu_ph")}
                rows={5}
              />
            </div>

            {/* Timeline */}
            <div>
              <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-2">{t("jour_j_public.section_timeline")}</label>
              <div className="space-y-2 mb-3">
                {pubForm.timeline.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 bg-neutral-50 px-3 py-2 border border-neutral-200">
                    <span className="font-bold tabular-nums text-sm text-primary w-12 shrink-0">{step.time}</span>
                    <span className="text-sm flex-1">{step.label}</span>
                    <button type="button" onClick={() => removeStep(i)} className="text-neutral-400 hover:text-primary text-xs">
                      {t("jour_j_public.timeline_remove")}
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <Input
                  type="time"
                  value={newStep.time}
                  onChange={(e) => setNewStep({ ...newStep, time: e.target.value })}
                  className="w-28 shrink-0"
                />
                <Input
                  value={newStep.label}
                  onChange={(e) => setNewStep({ ...newStep, label: e.target.value })}
                  placeholder={t("jour_j_public.timeline_label_ph")}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" className="rounded-none shrink-0" onClick={addStep}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Bio */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("jour_j_public.section_bio1")}</label>
                <Textarea
                  value={pubForm.bioPartner1}
                  onChange={(e) => setPubForm({ ...pubForm, bioPartner1: e.target.value })}
                  placeholder={t("jour_j_public.section_bio1_ph")}
                  rows={4}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("jour_j_public.section_bio2")}</label>
                <Textarea
                  value={pubForm.bioPartner2}
                  onChange={(e) => setPubForm({ ...pubForm, bioPartner2: e.target.value })}
                  placeholder={t("jour_j_public.section_bio2_ph")}
                  rows={4}
                />
              </div>
            </div>

            {/* Photo album URL */}
            <div>
              <label className="text-xs uppercase tracking-wider text-neutral-600 block mb-1">{t("jour_j_public.section_photo_album")}</label>
              <Input
                type="url"
                value={pubForm.photoAlbumUrl || ""}
                onChange={(e) => setPubForm({ ...pubForm, photoAlbumUrl: e.target.value || null })}
                placeholder={t("jour_j_public.section_photo_album_ph")}
              />
              <p className="text-xs text-neutral-400 mt-1">{t("jour_j_public.section_photo_album_hint")}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-none uppercase tracking-wider text-xs" disabled={savePublic.isPending}>
                {savePublic.isPending ? t("jour_j_public.saving") : t("jour_j_public.save")}
              </Button>
              <Button type="button" variant="outline" className="rounded-none uppercase tracking-wider text-xs" onClick={() => { setPubEditing(false); setPubForm(null); }}>
                {t("jour_j_public.cancel")}
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
