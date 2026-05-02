import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const submit = useMutation({
    mutationFn: () =>
      clientApi.post("/api/client/reviews", { vendorId: vendor.id, rating, title, comment }),
    onSuccess: () => {
      toast({
        title: t("review_modal.success_title"),
        description: t("review_modal.success_desc"),
      });
      setTitle("");
      setComment("");
      setRating(5);
      onSubmitted?.();
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Error";
      toast({ title: t("review_modal.error_title"), description: msg, variant: "destructive" });
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
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium">{t("review_modal.eyebrow")}</p>
            <h3 id="review-modal-title" className="font-display uppercase text-xl text-wine-deep">{vendor.name}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label={t("review_modal.close_aria")} className="p-2 text-wine-deep/60 hover:text-wine-deep">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (comment.trim().length < 10) {
              toast({ title: t("review_modal.too_short_title"), description: t("review_modal.too_short_desc"), variant: "destructive" });
              return;
            }
            submit.mutate();
          }}
          className="px-6 py-5 space-y-5"
        >
          <div>
            <label className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium block mb-2">{t("review_modal.rating")}</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div>
            <label htmlFor="review-title" className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium block mb-2">{t("review_modal.title_label")}</label>
            <input
              id="review-title"
              type="text"
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("review_modal.title_placeholder")}
              className="w-full px-3 py-2.5 text-sm bg-white border border-wine-deep/20 focus:outline-none focus:border-wine-deep"
              data-testid="review-title"
            />
          </div>
          <div>
            <label htmlFor="review-comment" className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium block mb-2">{t("review_modal.comment_label")}</label>
            <textarea
              id="review-comment"
              required
              minLength={10}
              maxLength={4000}
              rows={6}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("review_modal.comment_placeholder")}
              className="w-full px-3 py-2.5 text-sm bg-white border border-wine-deep/20 focus:outline-none focus:border-wine-deep"
              data-testid="review-comment"
            />
            <p className="text-[11px] text-wine-deep/50 mt-1">{t("review_modal.char_count", { current: comment.length, max: 4000, min: 10 })}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-xs uppercase tracking-[0.2em] border border-wine-deep/20 text-wine-deep/70 hover:border-wine-deep">
              {t("review_modal.cancel")}
            </button>
            <button
              type="submit"
              disabled={submit.isPending}
              className="px-5 py-2.5 text-xs uppercase tracking-[0.2em] bg-wine-deep text-cream hover:bg-wine-deep/90 inline-flex items-center gap-2"
              data-testid="review-submit"
            >
              {submit.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t("review_modal.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
