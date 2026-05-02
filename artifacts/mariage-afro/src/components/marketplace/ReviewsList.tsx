import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ReviewStars } from "./ReviewStars";

interface Review {
  id: number;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  authorName: string;
}

const LOCALE_MAP: Record<string, string> = { fr: "fr-BE", nl: "nl-BE", en: "en-GB" };

export default function ReviewsList({ vendorId, limit }: { vendorId: number; limit?: number }) {
  const { t, i18n } = useTranslation();
  const dateLocale = LOCALE_MAP[(i18n.resolvedLanguage || i18n.language || "fr").split("-")[0]] || "fr-BE";

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ["vendor-reviews", vendorId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/vendors/${vendorId}/reviews`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (isLoading) return <p className="text-sm text-wine-deep/60">{t("reviews_list.loading")}</p>;
  if (reviews.length === 0)
    return (
      <p className="text-sm text-wine-deep/60 italic">
        {t("reviews_list.empty")}
      </p>
    );

  const visible = typeof limit === "number" ? reviews.slice(0, limit) : reviews;

  return (
    <ul className="space-y-5">
      {visible.map((r) => (
        <li key={r.id} className="border-b border-wine-deep/10 pb-5 last:border-0">
          <div className="flex items-center gap-3 mb-2">
            <ReviewStars rating={r.rating} />
            <span className="text-xs text-wine-deep/60 uppercase tracking-[0.15em]">
              {new Date(r.createdAt).toLocaleDateString(dateLocale, { year: "numeric", month: "long" })}
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
