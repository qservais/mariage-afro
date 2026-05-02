import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Send, MessageCircle, Clock, ShieldCheck, Plus, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { clientApi, clientFetch } from "@/lib/clientApi";

interface Message {
  id: number;
  coupleId: number;
  conversationId: number | null;
  authorRole: "couple" | "admin" | "vendor";
  vendorAuthorId: number | null;
  content: string;
  readAt: string | null;
  createdAt: string;
}

interface Conversation {
  id: number;
  vendorId: number | null;
  kind: "admin" | "vendor";
  vendor: null | { id: number; name: string; category: string; city: string; coverImage: string | null };
  lastMessageAt: string;
  lastMessage: string | null;
  lastMessageAuthor: string | null;
  unread: number;
}

interface MarketplaceVendor {
  id: number;
  name: string;
  category: string;
  city: string;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("fr-BE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function CommunicationPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"admin" | "vendors">("admin");
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [pickerVendorId, setPickerVendorId] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // ---- Conversations (all) ----
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["client", "conversations"],
    queryFn: () => clientApi.get<Conversation[]>("/api/client/conversations"),
    refetchInterval: 5000,
  });

  const adminConv = useMemo(() => conversations.find((c) => c.kind === "admin") ?? null, [conversations]);
  const vendorConvs = useMemo(() => conversations.filter((c) => c.kind === "vendor"), [conversations]);

  // Auto-select active conversation when tab changes
  useEffect(() => {
    if (tab === "admin") {
      if (adminConv && activeConvId !== adminConv.id) setActiveConvId(adminConv.id);
    } else {
      if (!activeConvId || !vendorConvs.find((c) => c.id === activeConvId)) {
        setActiveConvId(vendorConvs[0]?.id ?? null);
      }
    }
  }, [tab, adminConv, vendorConvs, activeConvId]);

  // ---- Messages of active conversation ----
  const { data: messages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ["client", "conversation", activeConvId, "messages"],
    queryFn: () => clientApi.get<Message[]>(`/api/client/conversations/${activeConvId}/messages`),
    enabled: activeConvId != null,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      clientFetch(`/api/client/conversations/${activeConvId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["client", "conversation", activeConvId, "messages"] });
      qc.invalidateQueries({ queryKey: ["client", "conversations"] });
    },
  });

  // ---- Vendor picker (start new conversation) ----
  const { data: marketplaceVendors = [] } = useQuery<MarketplaceVendor[]>({
    queryKey: ["marketplace", "vendors"],
    queryFn: () => clientApi.get<MarketplaceVendor[]>("/api/marketplace/vendors"),
    enabled: showPicker,
  });

  const startConv = useMutation({
    mutationFn: (vendorId: number) =>
      clientApi.post<Conversation>("/api/client/conversations", { vendorId }),
    onSuccess: (conv) => {
      setShowPicker(false);
      setPickerVendorId("");
      setActiveConvId(conv.id);
      qc.invalidateQueries({ queryKey: ["client", "conversations"] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeConvId]);

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? null;

  function handleSend() {
    const content = draft.trim();
    if (!content || activeConvId == null) return;
    sendMutation.mutate(content);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  const adminUnread = adminConv?.unread ?? 0;
  const vendorsUnread = vendorConvs.reduce((acc, c) => acc + c.unread, 0);

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-180px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
        <MessageCircle className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-serif text-foreground">{t("client.conversations.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("client.conversations.subtitle")}</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1">
          <ShieldCheck className="w-3 h-3" />
          {t("client.conversations.secure")}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-4">
        <button
          type="button"
          onClick={() => setTab("admin")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2",
            tab === "admin" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
          data-testid="tab-conversations-admin"
        >
          {t("client.conversations.tab_admin")}
          {adminUnread > 0 && (
            <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">{adminUnread}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("vendors")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2",
            tab === "vendors" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
          data-testid="tab-conversations-vendors"
        >
          {t("client.conversations.tab_vendors")}
          {vendorsUnread > 0 && (
            <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">{vendorsUnread}</span>
          )}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 min-h-0">
        {/* LEFT — list (only on vendors tab; admin tab uses a fixed conv) */}
        {tab === "vendors" && (
          <div className="flex flex-col border border-border bg-white min-h-0">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("vendor.messages.list_title")}</span>
              <button
                type="button"
                onClick={() => setShowPicker((v) => !v)}
                className="text-primary text-xs flex items-center gap-1 hover:underline"
                data-testid="button-start-conversation"
              >
                <Plus className="w-3.5 h-3.5" /> {t("client.conversations.start_conversation")}
              </button>
            </div>
            {showPicker && (
              <div className="p-3 border-b border-border space-y-2 bg-amber-50/40">
                <p className="text-[11px] text-muted-foreground">{t("client.conversations.pick_vendor_help")}</p>
                <select
                  value={pickerVendorId}
                  onChange={(e) => setPickerVendorId(e.target.value)}
                  className="w-full border border-border px-2 py-1.5 text-sm bg-white"
                  data-testid="select-vendor-picker"
                >
                  <option value="">{t("client.conversations.pick_vendor_placeholder")}</option>
                  {marketplaceVendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} — {v.category}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  className="rounded-none w-full"
                  disabled={!pickerVendorId || startConv.isPending}
                  onClick={() => pickerVendorId && startConv.mutate(Number(pickerVendorId))}
                  data-testid="button-start-conversation-confirm"
                >
                  {t("client.conversations.start")}
                </Button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {vendorConvs.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4 text-center">{t("client.conversations.vendors_empty")}</p>
              ) : (
                vendorConvs.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveConvId(c.id)}
                    className={cn(
                      "w-full text-left px-3 py-3 border-b border-border hover:bg-cream/40 transition-colors",
                      activeConvId === c.id && "bg-cream/60",
                    )}
                    data-testid={`conversation-item-${c.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">{c.vendor?.name ?? "—"}</span>
                      {c.unread > 0 && (
                        <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">{c.unread}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{c.vendor?.category}</p>
                    {c.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate mt-1">{c.lastMessage}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* RIGHT — thread */}
        <div className={cn(
          "flex flex-col border border-border bg-white min-h-0",
          tab === "admin" ? "md:col-span-2" : "",
        )}>
          {tab === "vendors" && activeConv && (
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveConvId(null)}
                className="md:hidden text-muted-foreground"
                aria-label="Back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <p className="font-semibold text-sm">{activeConv.vendor?.name}</p>
                <p className="text-[11px] text-muted-foreground">{activeConv.vendor?.category} · {activeConv.vendor?.city}</p>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!activeConvId && (
              <p className="text-center text-muted-foreground py-12 text-sm">
                {t("client.conversations.select_conversation")}
              </p>
            )}
            {activeConvId && loadingMessages && (
              <p className="text-center text-muted-foreground py-12 text-sm">
                {t("client.conversations.loading")}
              </p>
            )}
            {activeConvId && !loadingMessages && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
                <MessageCircle className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-muted-foreground/70 text-sm max-w-xs">
                  {t("client.conversations.no_messages")}
                </p>
              </div>
            )}
            {messages.map((msg) => {
              const isCouple = msg.authorRole === "couple";
              const authorLabel = isCouple
                ? t("client.conversations.you")
                : msg.authorRole === "vendor"
                ? t("client.conversations.vendor")
                : t("client.conversations.team");
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[78%]",
                    isCouple ? "ml-auto items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                      isCouple ? "bg-primary text-white" : "bg-cream/60 border border-border text-foreground",
                    )}
                  >
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{authorLabel}</span>
                    <span>·</span>
                    <span>{fmtTime(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Compose */}
          {activeConvId && (
            <div className="border-t border-border p-3">
              <div className="flex gap-3 items-end">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("client.conversations.placeholder")}
                  className="resize-none rounded-none min-h-[70px] flex-1 border-border"
                  rows={2}
                  data-testid="textarea-message"
                />
                <Button
                  onClick={handleSend}
                  disabled={!draft.trim() || sendMutation.isPending}
                  className="rounded-none bg-primary hover:bg-primary/90 h-[70px] px-5"
                  data-testid="button-send-message"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
