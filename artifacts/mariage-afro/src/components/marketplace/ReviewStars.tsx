import { Star } from "lucide-react";

export function ReviewStars({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={i <= full ? "fill-gold text-gold" : "text-wine-deep/20"}
        />
      ))}
    </span>
  );
}

export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Note">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          onClick={() => onChange(i)}
          className="p-1"
          data-testid={`star-${i}`}
        >
          <Star
            width={28}
            height={28}
            className={i <= value ? "fill-gold text-gold" : "text-wine-deep/20 hover:text-gold/60"}
          />
        </button>
      ))}
    </div>
  );
}
