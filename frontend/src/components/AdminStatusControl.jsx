import { useState } from 'react';
import { updateToolStatus } from '../api/toolsApi.js';

/**
 * Inventory-manager control (rendered only for admins, the API enforces it again server-side).
 * Marking a tool "Under maintenance" prevents new reservations.
 */
export default function AdminStatusControl({ tool, onUpdated }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function change(status) {
    setSaving(true);
    setError('');
    try {
      onUpdated(await updateToolStatus(tool.id, status));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel panel--admin" aria-labelledby="admin-title">
      <h2 id="admin-title" className="panel__title">Inventory manager</h2>
      <div className="admin-actions">
        {tool.status === 'maintenance' ? (
          <button type="button" className="btn btn--primary btn--sm" disabled={saving} onClick={() => change('available')}>Return to service</button>
        ) : (
          <button type="button" className="btn btn--danger btn--sm" disabled={saving} onClick={() => change('maintenance')}>Mark under maintenance</button>
        )}
        {tool.status !== 'borrowed' && tool.status !== 'maintenance' && (
          <button type="button" className="btn btn--ghost btn--sm" disabled={saving} onClick={() => change('borrowed')}>Mark on loan</button>
        )}
        {tool.status === 'borrowed' && (
          <button type="button" className="btn btn--ghost btn--sm" disabled={saving} onClick={() => change('available')}>Mark returned</button>
        )}
      </div>
      {error && <p className="alert alert--error" role="alert">{error}</p>}
    </section>
  );
}
