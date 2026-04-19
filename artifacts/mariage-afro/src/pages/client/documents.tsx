import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, ExternalLink, FileText, UploadCloud } from "lucide-react";
import { ObjectUploader } from "@workspace/object-storage-web";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

export default function DocumentsPage() {
  const qc = useQueryClient();
  const { data: docs = [] } = useQuery<Doc[]>({
    queryKey: ["client", "documents"],
    queryFn: () => clientApi.get<Doc[]>("/api/client/documents"),
  });
  const [form, setForm] = useState({ name: "", url: "", category: "contrat" });
  const objectPathsRef = useRef<Map<string, string>>(new Map());

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
        <h2 className="font-bold text-2xl">Documents</h2>
        <p className="text-sm text-neutral-600">
          Téléversez vos contrats, devis et inspirations directement, ou ajoutez un lien externe.
        </p>
      </div>

      <div className="bg-white p-4 border border-neutral-200 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <ObjectUploader
            buttonClassName="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase tracking-wider text-xs h-10 px-4"
            maxNumberOfFiles={5}
            maxFileSize={20 * 1024 * 1024}
            onGetUploadParameters={async (file) => {
              const res = await clientApi.post<{ uploadURL: string; objectPath: string }>(
                "/api/storage/uploads/request-url",
                { name: file.name, size: file.size, contentType: file.type },
              );
              if (file.id) objectPathsRef.current.set(file.id, res.objectPath);
              return {
                method: "PUT" as const,
                url: res.uploadURL,
                headers: { "Content-Type": file.type },
              };
            }}
            onComplete={async (result) => {
              for (const f of result.successful ?? []) {
                const meta = (f.meta ?? {}) as { name?: string; type?: string; size?: number };
                const objectPath = f.id ? objectPathsRef.current.get(f.id) : undefined;
                if (!objectPath) continue;
                await create.mutateAsync({
                  name: meta.name ?? f.name ?? "Document",
                  url: objectPath,
                  category: form.category,
                  fileType: meta.type ?? null,
                  size: meta.size ?? 0,
                });
                if (f.id) objectPathsRef.current.delete(f.id);
              }
            }}
          >
            <UploadCloud className="w-4 h-4" /> Téléverser un fichier
          </ObjectUploader>
          <select
            className="border border-neutral-300 px-3 text-sm h-10"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            aria-label="Catégorie"
          >
            <option value="contrat">Contrat</option>
            <option value="devis">Devis</option>
            <option value="inspiration">Inspiration</option>
            <option value="administratif">Administratif</option>
            <option value="misc">Autre</option>
          </select>
          <span className="text-xs text-neutral-500">Catégorie appliquée aux téléversements</span>
        </div>

        <div className="border-t pt-4">
          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Ou ajouter un lien externe</p>
          <form
            className="grid grid-cols-1 lg:grid-cols-3 gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.name || !form.url) return;
              create.mutate({ name: form.name, url: form.url, category: form.category });
            }}
          >
            <Input
              placeholder="Nom du document"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              data-testid="input-doc-name"
            />
            <Input
              placeholder="URL (https://...)"
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
            <Button type="submit" className="rounded-none uppercase tracking-wider text-xs">
              Ajouter le lien
            </Button>
          </form>
        </div>
      </div>

      <div className="bg-white border border-neutral-200">
        {docs.map((d) => (
          <div key={d.id} className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 last:border-0">
            <FileText className="w-5 h-5 text-neutral-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{d.name}</p>
              <p className="text-xs text-neutral-500">
                {d.category}
                {d.size ? ` · ${(d.size / 1024).toFixed(0)} Ko` : ""} · {new Date(d.createdAt).toLocaleDateString("fr-BE")}
              </p>
            </div>
            <a
              href={servingUrl(d)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-xs uppercase tracking-wider flex items-center gap-1"
            >
              {isStoredObject(d.url) ? "Télécharger" : "Ouvrir"} <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => del.mutate(d.id)}
              className="text-neutral-400 hover:text-primary"
              aria-label="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {docs.length === 0 && (
          <p className="px-4 py-8 text-center text-neutral-400 text-sm">Aucun document</p>
        )}
      </div>
    </div>
  );
}
