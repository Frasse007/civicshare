// Shared loading / error / empty presentations so every view handles async states consistently.
export function LoadingGrid({ count = 6 }) {
  return (
    <div className="tool-grid" aria-busy="true" aria-label="Loading tools">
      {Array.from({ length: count }, (_, i) => <div key={i} className="skeleton" />)}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="alert alert--error state-box" role="alert">
      <p><strong>Something went wrong.</strong> {message}</p>
      {onRetry && <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="state-box state-box--empty">
      <p className="state-box__emoji" aria-hidden="true">🧰</p>
      <h3>{title}</h3>
      <p className="muted">{children}</p>
    </div>
  );
}
