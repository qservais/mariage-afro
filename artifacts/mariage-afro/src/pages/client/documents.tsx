import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, ExternalLink, FileText, UploadCloud, Loader2 } from "lucide-react";
import { clientApi, clientProxyUpload } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Doc {
  id: number;
  name: string;
  url: string;
  fileType: string | null;
  size: number;
  category: string;
  createdAt: string;
}

interface DocCreate {
  name: string;
  url: string;
  category: string;
  fileType?: string | null;
  size?: number;
}

const LOCALE_MAP: Record<string, string> = { fr: "fr-BE", nl: "nl-BE", en: "en-GB" };

export default function DocumentsPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || "fr").split("-")[0];
  const locale = LOCALE_MAP[lang] || "fr-BE";

  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: docs = [] } = useQuery<Doc[]>({
    queryKey: ["client", "documents"],
    queryFn: () => clientApi.get<Doc[]>("/api/client/documents"),
  });
  const [form, setForm] = useState({ name: "", url: "", category: "contrat" });
  const docFileRef = useRef<HTMLInputElement>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: (b: DocCreate) => clientApi.post<Doc>("/api/client/documents", b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", "documents"] });
      setForm({ name: "", url: "", category: "contrat" });
    },
  });
  const del = useMutation({
    mutationFn: (id: number) => clientApi.del(`/api/client/documents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "documents"] }),
  });

  const isStoredObject = (url: string) => url.startsWith("/objects/");
  const servingUrl = (d: Doc) => (isStoredObject(d.url) ? `/api/storage${d.url}` : d.url);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="font-bold text-2xl">{t("documents.title")}</h2>
        <p className="text-sm text-neutral-600">{t("documents.subtitle")}</p>
      </div>

      <div className="bg-cream p-4 border border-neutral-200 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer rounded-none uppercase tracking-wider text-xs h-10 px-4">
            {docUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            {t("documents.upload")}
            <input
              ref={docFileRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.zip"
              className="hidden"
              disabled={docUploading}
              onChange={async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                setDocUploadError(null);
                setDocUploading(true);
                try {
                  for (const file of Array.from(files)) {
                    const { objectPath } = await clientProxyUpload(file);
                    await create.mutateAsync({
                      name: file.name,
                      url: objectPath,
                      category: form.category,
                      fileType: file.type || null,
                      size: file.size,
                    });
                  }
                  toast({ title: t("documents.uploaded") });
                } catch (err) {
                  setDocUploadError((err as Error).message);
                  toast({ title: t("documents.upload_error"), variant: "destructive" });
                } finally {
                  setDocUploading(false);
                  if (docFileRef.current) docFileRef.current.value = "";
                }
              }}
            />
          </label>
          {docUploadError && <p className="text-[11px] text-red-600">{docUploadError}</p>}
          <select
            className="border border-neutral-300 px-3 text-sm h-10"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            aria-label={t("documents.category")}
          >
            <option value="contrat">{t("documents.cat_contract")}</option>
            <option value="devis">{t("documents.cat_quote")}</option>
            <option value="inspiration">{t("documents.cat_inspiration")}</option>
            <option value="administratif">{t("documents.cat_admin")}</option>
            <option value="misc">{t("documents.cat_other")}</option>
          </select>
          <span className="text-xs text-neutral-500">{t("documents.cat_applies")}</span>
        </div>

        <div className="border-t pt-4">
          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">{t("documents.or_external")}</p>
          <form
            className="grid grid-cols-1 lg:grid-cols-3 gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.name || !form.url) return;
              create.mutate({ name: form.name, url: form.url, category: form.category });
            }}
          >
            <div>
              <label htmlFor="doc-name" className="sr-only">{t("documents.name")}</label>
              <Input
                id="doc-name"
                placeholder={t("documents.name")}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                data-testid="input-doc-name"
              />
            </div>
            <div>
              <label htmlFor="doc-url" className="sr-only">URL</label>
              <Input
                id="doc-url"
                placeholder="URL (https://...)"
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>
            <Button type="submit" className="rounded-none uppercase tracking-wider text-xs">
              {t("documents.add_link")}
            </Button>
          </form>
        </div>
      </div>

      <div className="bg-cream border border-neutral-200">
        {docs.map((d) => (
          <div key={d.id} className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 last:border-0">
            <FileText className="w-5 h-5 text-neutral-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{d.name}</p>
              <p className="text-xs text-neutral-500">
                {d.category}
                {d.size ? ` · ${(d.size / 1024).toFixed(0)} ${t("documents.ko")}` : ""} · {new Date(d.createdAt).toLocaleDateString(locale)}
              </p>
            </div>
            <a
              href={servingUrl(d)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-xs uppercase tracking-wider flex items-center gap-1"
            >
              {isStoredObject(d.url) ? t("documents.download") : t("documents.open")} <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => del.mutate(d.id)}
              className="text-neutral-400 hover:text-primary"
              aria-label={t("documents.delete")}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {docs.length === 0 && (
          <p className="px-4 py-8 text-center text-neutral-400 text-sm">{t("documents.empty")}</p>
        )}
      </div>
    </div>
  );
}
