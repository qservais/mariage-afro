import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { clientApi } from "@/lib/clientApi";
import { useToast } from "@/hooks/use-toast";
import { StarPicker } from "./ReviewStars";

interface Props {
  open: boolean;
  onClose: () => void;
  vendor: { id: number; name: string };
  onSubmitted?: () => void;
}

export default function ReviewModal({ open, onClose, vendor, onSubmitted }: Props) {
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const submit = useMutation({
    mutationFn: () =>
      clientApi.post("/api/client/reviews", { vendorId: vendor.id, rating, title, comment }),
    onSuccess: () => {
      toast({
        title: "Merci pour votre avis !",
        description: "Il sera publié après une rapide vérification par notre équipe.",
      });
      setTitle("");
      setComment("");
      setRating(5);
      onSubmitted?.();
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur";
      toast({ title: "Impossible d'envoyer l'avis", description: msg, variant: "destructive" });
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-wine-deep/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-cream w-full max-w-lg max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="review-modal-title"
      >
        <div className="px-6 py-4 border-b border-wine-deep/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium">Laisser un avis</p>
            <h3 id="review-modal-title" className="font-display uppercase text-xl text-wine-deep">{vendor.name}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="p-2 text-wine-deep/60 hover:text-wine-deep">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (comment.trim().length < 10) {
              toast({ title: "Avis trop court", description: "Au moins 10 caractères, merci.", variant: "destructive" });
              return;
            }
            submit.mutate();
          }}
          className="px-6 py-5 space-y-5"
        >
          <div>
            <label className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium block mb-2">Note</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div>
            <label htmlFor="review-title" className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium block mb-2">Titre (optionnel)</label>
            <input
              id="review-title"
              type="text"
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex : Une équipe d'exception"
              className="w-full px-3 py-2.5 text-sm bg-white border border-wine-deep/20 focus:outline-none focus:border-wine-deep"
              data-testid="review-title"
            />
          </div>
          <div>
            <label htmlFor="review-comment" className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium block mb-2">Votre avis</label>
            <textarea
              id="review-comment"
              required
              minLength={10}
              maxLength={4000}
              rows={6}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Racontez votre expérience…"
              className="w-full px-3 py-2.5 text-sm bg-white border border-wine-deep/20 focus:outline-none focus:border-wine-deep"
              data-testid="review-comment"
            />
            <p className="text-[11px] text-wine-deep/50 mt-1">{comment.length}/4000 — minimum 10 caractères</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-xs uppercase tracking-[0.2em] border border-wine-deep/20 text-wine-deep/70 hover:border-wine-deep">
              Annuler
            </button>
            <button
              type="submit"
              disabled={submit.isPending}
              className="px-5 py-2.5 text-xs uppercase tracking-[0.2em] bg-wine-deep text-cream hover:bg-wine-deep/90 inline-flex items-center gap-2"
              data-testid="review-submit"
            >
              {submit.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Envoyer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
