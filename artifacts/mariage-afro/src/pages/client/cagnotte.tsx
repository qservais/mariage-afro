import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit2, ImagePlus, Loader2, ExternalLink } from "lucide-react";
import QRCode from "qrcode";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Cagnotte {
  id: number;
  title: string;
  description: string;
  photo: string | null;
  iban: string | null;
  externalUrl: string | null;
  position: number;
  active: boolean;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
function objectUrl(path: string | null): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("/objects/")) return `${BASE}/storage${path}`;
  return path;
}

async function uploadFile(file: File): Promise<string> {
  const meta = await clientApi.post<{ uploadURL: string; objectPath: string }>(
    "/storage/uploads/request-url",
    { name: file.name, size: file.size, contentType: file.type },
  );
  const put = await fetch(meta.uploadURL, { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
  if (!put.ok) throw new Error("Upload failed");
  return meta.objectPath;
}

const empty = { title: "", description: "", iban: "", externalUrl: "", photo: null as string | null, active: true };

function QrPreview({ value }: { value: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(value, { margin: 1, width: 160 }).then(setSrc).catch(() => setSrc(""));
  }, [value]);
  return src ? <img src={src} alt="QR code IBAN" width={128} height={128} loading="lazy" decoding="async" className="w-32 h-32 border border-neutral-200" /> : null;
}

export default function CagnottePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(empty);

  const { data: cagnottes = [] } = useQuery<Cagnotte[]>({
    queryKey: ["client", "cagnottes"],
    queryFn: () => clientApi.get<Cagnotte[]>("/api/client/cagnottes"),
  });

  const create = useMutation({
    mutationFn: () => clientApi.post("/api/client/cagnottes", form),
    onSuccess: () => { setForm(empty); setEditing(null); qc.invalidateQueries({ queryKey: ["client", "cagnottes"] }); },
  });
  const update = useMutation({
    mutationFn: () => clientApi.patch(`/api/client/cagnottes/${editing}`, form),
    onSuccess: () => { setForm(empty); setEditing(null); qc.invalidateQueries({ queryKey: ["client", "cagnottes"] }); },
  });
  const del = useMutation({
    mutationFn: (id: number) => clientApi.del(`/api/client/cagnottes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "cagnottes"] }),
  });
  const upload = useMutation({
    mutationFn: (file: File) => uploadFile(file),
    onSuccess: (path) => setForm((f) => ({ ...f, photo: path })),
  });

  const startEdit = (c: Cagnotte) => {
    setEditing(c.id);
    setForm({
      title: c.title,
      description: c.description,
      iban: c.iban ?? "",
      externalUrl: c.externalUrl ?? "",
      photo: c.photo,
      active: c.active,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-bold text-2xl">{t("cagnotte.title")}</h2>
        <p className="text-sm text-neutral-600">{t("cagnotte.subtitle")}</p>
      </div>

      {/* Form */}
      <form
        className="bg-white border border-neutral-200 p-5 space-y-4"
        onSubmit={(e) => { e.preventDefault(); if (!form.title.trim()) return; (editing ? update : create).mutate(); }}
      >
        <h3 className="font-bold text-sm uppercase tracking-wider">{editing ? t("cagnotte.edit_title") : t("cagnotte.create_title")}</h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("cagnotte.field_title")}</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("cagnotte.title_placeholder")} required className="rounded-none" data-testid="input-cagnotte-title" />
          </div>
          <div className="space-y-2">
            <Label>{t("cagnotte.field_iban")}</Label>
            <Input value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} placeholder="BE68 5390 0754 7034" className="rounded-none" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("cagnotte.field_external")}</Label>
          <Input type="url" value={form.externalUrl} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} placeholder="https://lydia.me/..." className="rounded-none" />
        </div>

        <div className="space-y-2">
          <Label>{t("cagnotte.field_description")}</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="rounded-none resize-none" />
        </div>

        <div className="space-y-2">
          <Label>{t("cagnotte.field_photo")}</Label>
          <div className="flex items-center gap-3">
            {form.photo && <img src={objectUrl(form.photo)} alt="Aperçu" width={64} height={64} loading="lazy" decoding="async" className="w-16 h-16 object-cover" />}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload.mutate(e.target.files[0])} />
            <Button type="button" variant="outline" className="rounded-none" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
              {upload.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ImagePlus className="w-4 h-4 mr-2" />}
              {t("cagnotte.upload_photo")}
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {editing && (
            <Button type="button" variant="outline" className="rounded-none" onClick={() => { setEditing(null); setForm(empty); }}>
              {t("cagnotte.cancel")}
            </Button>
          )}
          <Button type="submit" className="rounded-none gap-2" disabled={create.isPending || update.isPending}>
            <Plus className="w-4 h-4" /> {editing ? t("cagnotte.save") : t("cagnotte.create")}
          </Button>
        </div>
      </form>

      {/* List */}
      <div className="space-y-3">
        {cagnottes.length === 0 && (
          <div className="bg-white border border-dashed border-neutral-300 p-10 text-center text-neutral-500 text-sm">
            {t("cagnotte.empty")}
          </div>
        )}
        {cagnottes.map((c) => (
          <div key={c.id} className="bg-white border border-neutral-200 p-5 flex flex-col sm:flex-row gap-5">
            {c.photo && <img src={objectUrl(c.photo)} alt={c.title} width={300} height={128} loading="lazy" decoding="async" className="w-full sm:w-32 h-32 object-cover" />}
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold">{c.title}</h3>
                  <p className="text-sm text-neutral-600 mt-1">{c.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(c)} className="text-neutral-400 hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => confirm(t("cagnotte.confirm_delete")) && del.mutate(c.id)} className="text-neutral-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {c.iban && <p className="text-xs text-neutral-500">IBAN: <span className="font-mono">{c.iban}</span></p>}
              {c.externalUrl && (
                <a href={c.externalUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> {c.externalUrl}
                </a>
              )}
            </div>
            {c.iban && <QrPreview value={`BCD\n002\n1\nSCT\n\n${c.iban.replace(/\s/g, "")}`} />}
          </div>
        ))}
      </div>
    </div>
  );
}
