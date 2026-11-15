import Reveal from '../components/Reveal.jsx';
import ToolCard from '../components/ToolCard.jsx';
import FilterBar from '../components/FilterBar.jsx';
import Pagination from '../components/Pagination.jsx';
import { LoadingGrid, ErrorState, EmptyState } from '../components/StateMessage.jsx';
import { useInventory } from '../hooks/useInventory.js';

export default function CatalogPage() {
  const { tools, meta, status, error, filters, setFilters, resetFilters, retry } = useInventory();
  const firstLoad = status === 'loading' && tools.length === 0;

  return (
    <>
      <header className="page-head">
        <h1>Tool catalog</h1>
        <p className="muted">Search what your neighbors are sharing. Safety rating: 5 = beginner-friendly, 1 = experienced users only.</p>
      </header>

      <FilterBar />

      <p className="result-count" aria-live="polite">
        {meta ? `${meta.total} ${meta.total === 1 ? 'tool' : 'tools'} found` : ' '}
      </p>

      {status === 'error' && <ErrorState message={error} onRetry={retry} />}
      {firstLoad && <LoadingGrid />}

      {status !== 'error' && !firstLoad && tools.length === 0 && (
        <EmptyState title="No tools match those filters">
          Try a different search, or <button type="button" className="link-btn" onClick={resetFilters}>clear all filters</button>.
        </EmptyState>
      )}

      {tools.length > 0 && status !== 'error' && (
        <div className={`tool-grid ${status === 'loading' ? 'tool-grid--refreshing' : ''}`}>
          {tools.map((tool, i) => (
            <Reveal key={tool.id} delay={(i % 3) * 70}>
              <ToolCard tool={tool} />
            </Reveal>
          ))}
        </div>
      )}

      {meta && <Pagination page={filters.page} totalPages={meta.totalPages} onChange={(page) => setFilters({ page })} />}
    </>
  );
}
