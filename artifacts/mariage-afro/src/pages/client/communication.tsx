import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, MessageCircle, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { clientFetch } from "@/lib/clientApi";

interface Message {
  id: number;
  coupleId: number;
  authorRole: "couple" | "admin";
  content: string;
  readAt: string | null;
  createdAt: string;
}

export default function CommunicationPage() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["messages"],
    queryFn: () => clientFetch<Message[]>("/api/client/messages"),
    refetchInterval: 15000,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      clientFetch("/api/client/messages", { method: "POST", body: JSON.stringify({ content }) }),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const content = draft.trim();
    if (!content) return;
    sendMutation.mutate(content);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-180px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
        <MessageCircle className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-serif text-foreground">Communication</h1>
          <p className="text-sm text-muted-foreground">
            Échangez directement avec l'équipe Mariage Afro
          </p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1">
          <ShieldCheck className="w-3 h-3" />
          Conversation sécurisée
        </span>
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {isLoading && (
          <p className="text-center text-muted-foreground py-12 text-sm">
            Chargement des messages…
          </p>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <MessageCircle className="w-16 h-16 text-muted-foreground/30" />
            <div>
              <p className="text-muted-foreground font-medium mb-1">Aucun message pour l'instant</p>
              <p className="text-muted-foreground/70 text-sm max-w-xs mx-auto">
                Posez vos questions, partagez vos idées ou demandez un rendez-vous. L'équipe vous
                répond rapidement.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isCouple = msg.authorRole === "couple";
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
                  isCouple
                    ? "bg-primary text-white"
                    : "bg-white border border-border text-foreground",
                )}
              >
                {msg.content}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {new Date(msg.createdAt).toLocaleString("fr-BE", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {isCouple && !msg.readAt && (
                  <span className="text-primary ml-1">· Envoyé</span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <div className="mt-4 border-t border-border pt-4">
        <div className="flex gap-3 items-end">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez votre message… (Ctrl+Entrée pour envoyer)"
            className="resize-none rounded-none min-h-[80px] flex-1 border-border"
            rows={3}
          />
          <Button
            onClick={handleSend}
            disabled={!draft.trim() || sendMutation.isPending}
            className="rounded-none bg-primary hover:bg-primary/90 h-[80px] px-5"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Ctrl+Entrée pour envoyer · Réponse habituelle sous 24h
        </p>
      </div>
    </div>
  );
}
