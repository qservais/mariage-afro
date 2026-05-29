import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Send, MessageCircle, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { vendorApi, vendorFetch } from "@/lib/vendorApi";

interface VendorMessage {
  id: number;
  coupleId: number;
  conversationId: number | null;
  authorRole: "couple" | "admin" | "vendor";
  vendorAuthorId: number | null;
  content: string;
  readAt: string | null;
  createdAt: string;
}

interface VendorConversation {
  id: number;
  coupleId: number;
  couple: { partner1Name: string | null; partner2Name: string | null };
  lastMessageAt: string;
  lastMessage: string | null;
  lastMessageAuthor: string | null;
  unread: number;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("fr-BE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function coupleLabel(c: VendorConversation): string {
  const a = c.couple.partner1Name?.trim();
  const b = c.couple.partner2Name?.trim();
  if (a && b) return `${a} & ${b}`;
  return a || b || `Couple #${c.coupleId}`;
}

export default function VendorMessagesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery<VendorConversation[]>({
    queryKey: ["vendor", "conversations"],
    queryFn: () => vendorApi.get<VendorConversation[]>("/api/vendor/conversations"),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!activeId && conversations.length > 0) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  const { data: messages = [], isLoading: loadingMessages } = useQuery<VendorMessage[]>({
    queryKey: ["vendor", "conversation", activeId, "messages"],
    queryFn: () => vendorApi.get<VendorMessage[]>(`/api/vendor/conversations/${activeId}/messages`),
    enabled: activeId != null,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      vendorFetch(`/api/vendor/conversations/${activeId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["vendor", "conversation", activeId, "messages"] });
      qc.invalidateQueries({ queryKey: ["vendor", "conversations"] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeId]);

  const activeConv = useMemo(() => conversations.find((c) => c.id === activeId) ?? null, [conversations, activeId]);

  function handleSend() {
    const content = draft.trim();
    if (!content || activeId == null) return;
    sendMutation.mutate(content);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="max-w-6xl mx-auto min-h-[420px] h-[calc(100vh-220px)] flex flex-col">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-200">
        <MessageCircle className="w-6 h-6 text-wine-deep" />
        <div>
          <h1 className="text-2xl font-bold text-wine-deep">{t("vendor.messages.title")}</h1>
          <p className="text-sm text-neutral-600">{t("vendor.messages.subtitle")}</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1">
          <ShieldCheck className="w-3 h-3" />
          {t("vendor.messages.secure")}
        </span>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 min-h-0">
        {/* List */}
        <div className="flex flex-col border border-neutral-200 bg-cream min-h-0">
          <div className="px-3 py-2 border-b border-neutral-200">
            <span className="text-xs uppercase tracking-widest text-neutral-500">{t("vendor.messages.list_title")}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-xs text-neutral-500 p-4 text-center">{t("vendor.messages.empty_list")}</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "w-full text-left px-3 py-3 border-b border-neutral-100 hover:bg-cream/40 transition-colors",
                    activeId === c.id && "bg-cream/60",
                  )}
                  data-testid={`vendor-conversation-item-${c.id}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{coupleLabel(c)}</span>
                    {c.unread > 0 && (
                      <span className="bg-wine-deep text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">{c.unread}</span>
                    )}
                  </div>
                  {c.lastMessage && (
                    <p className="text-xs text-neutral-500 truncate mt-1">{c.lastMessage}</p>
                  )}
                  <p className="text-[10px] text-neutral-400 mt-1">{fmtTime(c.lastMessageAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="flex flex-col border border-neutral-200 bg-cream min-h-0">
          {activeConv && (
            <div className="px-4 py-3 border-b border-neutral-200">
              <p className="font-semibold text-sm text-wine-deep">{coupleLabel(activeConv)}</p>
              <p className="text-[11px] text-neutral-500">{t("vendor.messages.couple")}</p>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!activeId && (
              <p className="text-center text-neutral-500 py-12 text-sm">
                {t("vendor.messages.select_conversation")}
              </p>
            )}
            {activeId && loadingMessages && (
              <p className="text-center text-neutral-500 py-12 text-sm">{t("vendor.messages.loading")}</p>
            )}
            {activeId && !loadingMessages && messages.length === 0 && (
              <p className="text-center text-neutral-500 py-12 text-sm">{t("vendor.messages.no_messages")}</p>
            )}
            {messages.map((msg) => {
              const isVendor = msg.authorRole === "vendor";
              const authorLabel = isVendor
                ? t("vendor.messages.you")
                : msg.authorRole === "couple"
                ? t("vendor.messages.couple")
                : "Mariage Afro";
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[78%]",
                    isVendor ? "ml-auto items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                      isVendor ? "bg-wine-deep text-cream" : "bg-cream/60 border border-neutral-200 text-neutral-800",
                    )}
                  >
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-500">
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

          {activeId && (
            <div className="border-t border-neutral-200 p-3">
              <div className="flex gap-3 items-end">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("vendor.messages.placeholder")}
                  className="resize-none rounded-none min-h-[70px] flex-1 border-neutral-300"
                  rows={2}
                  data-testid="vendor-textarea-message"
                />
                <Button
                  onClick={handleSend}
                  disabled={!draft.trim() || sendMutation.isPending}
                  aria-label={t("vendor.messages.send_label", { defaultValue: "Envoyer le message" })}
                  className="rounded-none bg-wine-deep hover:bg-wine-deep/90 h-[70px] px-5 text-cream"
                  data-testid="vendor-button-send-message"
                >
                  <Send className="w-5 h-5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
