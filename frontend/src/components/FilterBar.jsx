import { useEffect, useState } from 'react';
import { useInventory } from '../hooks/useInventory.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';

const SAFETY_OPTIONS = [
  { value: '', label: 'Any rating' },
  { value: '2', label: '2+ of 5' },
  { value: '3', label: '3+ of 5' },
  { value: '4', label: '4+ of 5' },
  { value: '5', label: '5 of 5 only' },
];

const STATUS_LABELS = { available: 'Available now', borrowed: 'On loan', maintenance: 'Under maintenance' };

/**
 * Multi-parameter search. The text box keeps a local draft (useState) that is debounced
 * into global context state, while dropdowns write to context immediately.
 */
export default function FilterBar() {
  const { filters, options, setFilters, resetFilters } = useInventory();
  const [draft, setDraft] = useState(filters.search);
  const debounced = useDebouncedValue(draft, 300);

  useEffect(() => {
    if (debounced.trim() !== filters.search) setFilters({ search: debounced.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced text
  }, [debounced]);

  const onSelect = (key) => (e) => setFilters({ [key]: e.target.value });
  const hasFilters = Boolean(filters.search || filters.category || filters.condition || filters.status || filters.minSafety);

  function clearAll() {
    setDraft('');
    resetFilters();
  }

  return (
    <form className="filters" role="search" aria-label="Filter tools" onSubmit={(e) => e.preventDefault()}>
      <div className="filters__search">
        <label htmlFor="f-search" className="sr-only">Search tools</label>
        <input id="f-search" className="filters__input" type="search" placeholder="Search tools, e.g. ladder, sander…" value={draft} onChange={(e) => setDraft(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="f-category">Category</label>
        <select id="f-category" value={filters.category} onChange={onSelect('category')}>
          <option value="">All</option>
          {options.categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-condition">Condition</label>
        <select id="f-condition" value={filters.condition} onChange={onSelect('condition')}>
          <option value="">Any</option>
          {options.conditions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-status">Availability</label>
        <select id="f-status" value={filters.status} onChange={onSelect('status')}>
          <option value="">Any</option>
          {options.statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-safety">Safety rating</label>
        <select id="f-safety" value={filters.minSafety} onChange={onSelect('minSafety')}>
          {SAFETY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-sort">Sort by</label>
        <select id="f-sort" value={filters.sort} onChange={onSelect('sort')}>
          <option value="name">Name (A-Z)</option>
          <option value="safety">Safest first</option>
          <option value="newest">Newest</option>
        </select>
      </div>
      <button type="button" className="btn btn--ghost btn--sm filters__clear" onClick={clearAll} disabled={!hasFilters}>
        Clear filters
      </button>
    </form>
  );
}
