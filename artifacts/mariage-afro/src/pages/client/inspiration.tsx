import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ImagePlus, Mail, Loader2, X } from "lucide-react";
import { clientApi, clientFetch } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MoodImage {
  id: number;
  boardId: number;
  url: string;
  caption: string;
  position: number;
}
interface MoodBoard {
  id: number;
  title: string;
  description: string;
  position: number;
  images: MoodImage[];
}
interface Collaborator {
  id: number;
  email: string;
  name: string;
  role: "viewer" | "editor";
  invitedAt: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function uploadFile(file: File): Promise<string> {
  const meta = await clientApi.post<{ uploadURL: string; objectPath: string }>(
    "/storage/uploads/request-url",
    { name: file.name, size: file.size, contentType: file.type },
  );
  const put = await fetch(meta.uploadURL, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!put.ok) throw new Error(`Upload failed: ${put.status}`);
  return meta.objectPath;
}

function objectUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("/objects/")) return `${BASE}/storage${path}`;
  return path;
}

export default function InspirationPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeBoardId, setActiveBoardId] = useState<number | null>(null);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ email: "", name: "", role: "viewer" as "viewer" | "editor" });

  const { data: boards = [], isLoading } = useQuery<MoodBoard[]>({
    queryKey: ["client", "mood-boards"],
    queryFn: () => clientApi.get<MoodBoard[]>("/api/client/mood-boards"),
  });
  const { data: collaborators = [] } = useQuery<Collaborator[]>({
    queryKey: ["client", "mood-board-collaborators"],
    queryFn: () => clientApi.get<Collaborator[]>("/api/client/mood-board-collaborators"),
  });

  const activeBoard = useMemo(
    () => boards.find((b) => b.id === activeBoardId) ?? boards[0],
    [boards, activeBoardId],
  );

  const createBoard = useMutation({
    mutationFn: (title: string) => clientApi.post<MoodBoard>("/api/client/mood-boards", { title }),
    onSuccess: (b) => { setNewBoardTitle(""); setActiveBoardId(b.id); qc.invalidateQueries({ queryKey: ["client", "mood-boards"] }); },
  });
  const deleteBoard = useMutation({
    mutationFn: (id: number) => clientApi.del(`/api/client/mood-boards/${id}`),
    onSuccess: () => { setActiveBoardId(null); qc.invalidateQueries({ queryKey: ["client", "mood-boards"] }); },
  });
  const addImage = useMutation({
    mutationFn: ({ boardId, file }: { boardId: number; file: File }) =>
      uploadFile(file).then((url) =>
        clientApi.post("/api/client/mood-board-images", { boardId, url }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "mood-boards"] }),
  });
  const deleteImage = useMutation({
    mutationFn: (id: number) => clientApi.del(`/api/client/mood-board-images/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "mood-boards"] }),
  });
  const updateImage = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<MoodImage> }) =>
      clientFetch(`/api/client/mood-board-images/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "mood-boards"] }),
  });
  const inviteCollab = useMutation({
    mutationFn: () => clientApi.post("/api/client/mood-board-collaborators", { ...invite, boardTitle: activeBoard?.title || "Inspiration" }),
    onSuccess: () => { setInvite({ email: "", name: "", role: "viewer" }); setInviteOpen(false); qc.invalidateQueries({ queryKey: ["client", "mood-board-collaborators"] }); },
  });
  const deleteCollab = useMutation({
    mutationFn: (id: number) => clientApi.del(`/api/client/mood-board-collaborators/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", "mood-board-collaborators"] }),
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || !activeBoard) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      addImage.mutate({ boardId: activeBoard.id, file });
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  if (isLoading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-2xl">{t("inspiration.title")}</h2>
          <p className="text-sm text-neutral-600">{t("inspiration.subtitle")}</p>
        </div>
        <Button variant="outline" className="rounded-none uppercase tracking-wider text-xs gap-2" onClick={() => setInviteOpen(true)} data-testid="btn-invite-collab">
          <Mail className="w-3.5 h-3.5" /> {t("inspiration.invite")}
        </Button>
      </div>

      {/* Board tabs */}
      <div className="flex flex-wrap gap-2 items-center bg-white border border-neutral-200 p-3">
        {boards.map((b) => (
          <button
            key={b.id}
            onClick={() => setActiveBoardId(b.id)}
            className={`text-xs px-3 py-2 border ${activeBoard?.id === b.id ? "border-primary bg-primary text-white" : "border-neutral-300 hover:border-primary"}`}
            data-testid={`tab-board-${b.id}`}
          >
            {b.title} <span className="opacity-60">({b.images.length})</span>
          </button>
        ))}
        <form
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); if (newBoardTitle.trim()) createBoard.mutate(newBoardTitle.trim()); }}
        >
          <Input
            value={newBoardTitle}
            onChange={(e) => setNewBoardTitle(e.target.value)}
            placeholder={t("inspiration.new_board_placeholder")}
            className="rounded-none h-8 text-xs w-44"
            data-testid="input-new-board"
          />
          <Button type="submit" size="sm" className="rounded-none uppercase tracking-wider text-xs gap-1 h-8">
            <Plus className="w-3 h-3" /> {t("inspiration.add_board")}
          </Button>
        </form>
      </div>

      {!activeBoard ? (
        <div className="bg-white border border-dashed border-neutral-300 p-12 text-center text-neutral-500">
          <ImagePlus className="w-10 h-10 mx-auto mb-3 text-neutral-400" />
          <p>{t("inspiration.no_board")}</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-neutral-200 p-4 flex items-center justify-between">
            <h3 className="font-medium">{activeBoard.title}</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-none gap-1 text-xs" onClick={() => fileInputRef.current?.click()} data-testid="btn-upload-image">
                <ImagePlus className="w-3.5 h-3.5" /> {t("inspiration.add_image")}
              </Button>
              <Button size="sm" variant="ghost" className="rounded-none text-xs text-rose-600" onClick={() => confirm(t("inspiration.confirm_delete_board")) && deleteBoard.mutate(activeBoard.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="bg-white border border-dashed border-neutral-300 p-4 min-h-[300px]"
          >
            {activeBoard.images.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <ImagePlus className="w-10 h-10 mx-auto mb-3 text-neutral-400" />
                <p>{t("inspiration.drop_hint")}</p>
              </div>
            ) : (
              <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
                {activeBoard.images.map((img) => (
                  <div key={img.id} className="mb-3 break-inside-avoid relative group">
                    <img src={objectUrl(img.url)} alt={img.caption} loading="lazy" decoding="async" className="w-full block" />
                    <button
                      onClick={() => deleteImage.mutate(img.id)}
                      className="absolute top-2 right-2 bg-white/90 p-1 opacity-0 group-hover:opacity-100 hover:bg-primary hover:text-white"
                      title={t("inspiration.delete_image")}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <input
                      defaultValue={img.caption}
                      onBlur={(e) => e.target.value !== img.caption && updateImage.mutate({ id: img.id, body: { caption: e.target.value } })}
                      placeholder={t("inspiration.caption_placeholder")}
                      className="w-full text-xs px-2 py-1 border-t border-neutral-200 bg-neutral-50 focus:outline-none focus:bg-white"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Collaborators */}
      <div className="bg-white border border-neutral-200 p-5">
        <h3 className="font-bold text-sm uppercase tracking-wider mb-3">{t("inspiration.collaborators")}</h3>
        {collaborators.length === 0 ? (
          <p className="text-sm text-neutral-500">{t("inspiration.no_collaborators")}</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {collaborators.map((c) => (
              <li key={c.id} className="py-2 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{c.name || c.email}</span>
                  <span className="text-neutral-500 ml-2 text-xs">{c.email} · {t(`inspiration.role_${c.role}`)}</span>
                </div>
                <button onClick={() => deleteCollab.mutate(c.id)} className="text-neutral-400 hover:text-primary"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Invite modal */}
      {inviteOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setInviteOpen(false)}>
          <div className="bg-white max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg">{t("inspiration.invite_modal_title")}</h3>
            <div className="space-y-3">
              <div>
                <Label>{t("inspiration.invite_email")}</Label>
                <Input type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} className="rounded-none" data-testid="input-invite-email" />
              </div>
              <div>
                <Label>{t("inspiration.invite_name")}</Label>
                <Input value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} className="rounded-none" />
              </div>
              <div>
                <Label>{t("inspiration.invite_role")}</Label>
                <select value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value as "viewer" | "editor" })} className="w-full border border-neutral-300 px-3 h-10 text-sm">
                  <option value="viewer">{t("inspiration.role_viewer")}</option>
                  <option value="editor">{t("inspiration.role_editor")}</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="rounded-none" onClick={() => setInviteOpen(false)}>{t("inspiration.cancel")}</Button>
              <Button className="rounded-none" disabled={!invite.email || inviteCollab.isPending} onClick={() => inviteCollab.mutate()} data-testid="btn-send-invite">
                {inviteCollab.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {t("inspiration.send_invite")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

