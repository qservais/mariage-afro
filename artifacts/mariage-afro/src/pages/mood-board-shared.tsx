import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ImagePlus } from "lucide-react";

const BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
const storageUrl = (path: string) => path?.startsWith("/objects/") ? `${BASE}/storage${path}` : path;

type Image = { id: number; boardId: number; url: string; caption: string | null };
type Board = { id: number; title: string; description: string | null; images: Image[] };
type SharedData = { role: "viewer" | "editor"; name: string | null; couple: { name: string }; boards: Board[] };

export default function MoodBoardSharedPage() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeBoardId, setActiveBoardId] = useState<number | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data, isLoading, error } = useQuery<SharedData>({
    queryKey: ["shared-board", token],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/mood-board/shared/${token}`);
      if (!res.ok) throw new Error("invalid");
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  const addImage = useMutation({
    mutationFn: async ({ boardId, file }: { boardId: number; file: File }) => {
      setUploading(true);
      try {
        const intent = await fetch(`${BASE}/api/mood-board/shared/${token}/upload-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
        }).then((r) => r.json());
        if (!intent.uploadURL) throw new Error("no_url");
        const up = await fetch(intent.uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        if (!up.ok) throw new Error("upload_failed");
        const res = await fetch(`${BASE}/api/mood-board/shared/${token}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ boardId, url: intent.objectPath, caption }),
        });
        if (!res.ok) throw new Error("save_failed");
        return res.json();
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      toast({ title: t("shared_board.added") });
      setCaption("");
      setActiveBoardId(null);
      qc.invalidateQueries({ queryKey: ["shared-board", token] });
    },
    onError: () => toast({ title: t("shared_board.upload_failed"), variant: "destructive" }),
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7] p-8">
        <p className="text-lg text-foreground">{t("shared_board.invalid_link")}</p>
      </div>
    );
  }

  const isEditor = data.role === "editor";

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="bg-foreground text-cream py-10 text-center">
        <p className="uppercase tracking-[0.3em] text-xs text-[#c9a96e]">{data.couple.name}</p>
        <h1 className="font-serif text-4xl mt-3" data-testid="text-shared-title">{t("shared_board.title")}</h1>
        <p className="mt-3 text-cream/80">
          {isEditor ? t("shared_board.subtitle_editor") : t("shared_board.subtitle_viewer")}
        </p>
      </header>

      <main className="container max-w-6xl mx-auto py-10 space-y-12">
        {data.boards.length === 0 && (
          <p className="text-center text-muted-foreground">{t("shared_board.empty")}</p>
        )}
        {data.boards.map((b) => (
          <section key={b.id} data-testid={`board-${b.id}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-2xl">{b.title}</h2>
                {b.description && <p className="text-sm text-muted-foreground">{b.description}</p>}
              </div>
              {isEditor && (
                <Button
                  variant="outline"
                  className="rounded-none"
                  onClick={() => setActiveBoardId(b.id)}
                  data-testid={`button-add-${b.id}`}
                >
                  <ImagePlus className="w-4 h-4 mr-2" /> {t("shared_board.add_image")}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {b.images.map((im) => (
                <Card key={im.id} className="rounded-none overflow-hidden">
                  <img src={storageUrl(im.url)} alt={im.caption || "Inspiration"} width={400} height={192} loading="lazy" decoding="async" className="w-full h-48 object-cover" style={{ aspectRatio: "25 / 12" }} />
                  {im.caption && <div className="p-2 text-sm">{im.caption}</div>}
                </Card>
              ))}
            </div>

            {isEditor && activeBoardId === b.id && (
              <Card className="mt-4 p-4 rounded-none border-2 border-dashed">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>{t("shared_board.caption")}</Label>
                    <Input value={caption} onChange={(e) => setCaption(e.target.value)} className="rounded-none" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) addImage.mutate({ boardId: b.id, file });
                    }}
                    data-testid={`input-file-${b.id}`}
                  />
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                </div>
              </Card>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
