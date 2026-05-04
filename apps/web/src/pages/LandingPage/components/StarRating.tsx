const StarSVG = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

interface StarRatingProps {
  count?: number;
  hasHalf?: boolean;
}

export function StarRating({ count = 5, hasHalf = false }: StarRatingProps) {
  const fullStars = hasHalf ? count - 1 : count;
  return (
    <div className="testimonial-card__stars">
      {Array.from({ length: fullStars }).map((_, i) => (
        <span key={i} className="testimonial-card__star"><StarSVG /></span>
      ))}
      {hasHalf && (
        <span className="testimonial-card__star testimonial-card__star--half"><StarSVG /></span>
      )}
    </div>
  );
}
