export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => onChange(page - 1)} disabled={page <= 1}>← Previous</button>
      <span aria-current="page">Page {page} of {totalPages}</span>
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>Next →</button>
    </nav>
  );
}
