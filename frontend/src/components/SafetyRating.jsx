// 5-pip rating. Higher = easier/safer to operate. Exposed to screen readers as text.
export default function SafetyRating({ rating }) {
  return (
    <span className="rating" role="img" aria-label={`Safety rating ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`rating__pip ${n <= rating ? 'rating__pip--on' : ''}`} />
      ))}
    </span>
  );
}
