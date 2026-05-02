import { useQuery } from "@tanstack/react-query";
import { ReviewStars } from "./ReviewStars";

interface Review {
  id: number;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  authorName: string;
}

export default function ReviewsList({ vendorId }: { vendorId: number }) {
  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ["vendor-reviews", vendorId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/vendors/${vendorId}/reviews`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (isLoading) return <p className="text-sm text-wine-deep/60">Chargement des avis…</p>;
  if (reviews.length === 0)
    return (
      <p className="text-sm text-wine-deep/60 italic">
        Pas encore d'avis publié — soyez le premier couple à partager votre expérience.
      </p>
    );

  return (
    <ul className="space-y-5">
      {reviews.map((r) => (
        <li key={r.id} className="border-b border-wine-deep/10 pb-5 last:border-0">
          <div className="flex items-center gap-3 mb-2">
            <ReviewStars rating={r.rating} />
            <span className="text-xs text-wine-deep/60 uppercase tracking-[0.15em]">
              {new Date(r.createdAt).toLocaleDateString("fr-BE", { year: "numeric", month: "long" })}
            </span>
          </div>
          {r.title && <p className="font-display text-lg text-wine-deep mb-1">{r.title}</p>}
          <p className="text-sm text-wine-deep/80 leading-relaxed whitespace-pre-wrap">{r.comment}</p>
          <p className="text-xs text-wine-deep/50 mt-2">— {r.authorName}</p>
        </li>
      ))}
    </ul>
  );
}
