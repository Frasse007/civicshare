import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge.jsx';
import SafetyRating from '../components/SafetyRating.jsx';
import WeatherForecast from '../components/WeatherForecast.jsx';
import AdminStatusControl from '../components/AdminStatusControl.jsx';
import { ErrorState } from '../components/StateMessage.jsx';
import { fetchTool } from '../api/toolsApi.js';
import { useAsyncResource } from '../hooks/useAsyncResource.js';
import { useAuth } from '../hooks/useAuth.js';
import { useInventory } from '../hooks/useInventory.js';
import { buildSafetySheet, safetySheetFilename } from '../utils/safetySheet.js';

export default function ToolDetailPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { replaceTool } = useInventory();
  const { status, data: tool, error, retry, setData: setTool } = useAsyncResource((signal) => fetchTool(id, signal), id);

  // Admin changed the status: update this view AND the shared catalog list (global state).
  const handleUpdated = useCallback((updated) => {
    setTool(updated);
    replaceTool(updated);
  }, [setTool, replaceTool]);

  function downloadSheet() {
    const blob = new Blob([buildSafetySheet(tool)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safetySheetFilename(tool);
    a.click();
    URL.revokeObjectURL(url);
  }

  if (status === 'loading') return <p className="muted" aria-live="polite">Loading tool…</p>;

  if (status === 'error') {
    return error.status === 404 || error.status === 400 ? (
      <section className="center-card">
        <p className="center-card__emoji" aria-hidden="true">🔍</p>
        <h1>Tool not found</h1>
        <p>That tool does not exist or was removed.</p>
        <Link to="/catalog" className="btn btn--primary">Back to catalog</Link>
      </section>
    ) : (
      <ErrorState message={error.message} onRetry={retry} />
    );
  }

  const unavailable = tool.status === 'maintenance';

  return (
    <article className="detail">
      <Link to="/catalog" className="back-link">← Back to catalog</Link>

      <header className="detail__head">
        <div className="detail__emoji" aria-hidden="true">{tool.emoji}</div>
        <div>
          <p className="tool-card__category">{tool.category}</p>
          <h1>{tool.name}</h1>
          <div className="detail__badges">
            <StatusBadge status={tool.status} />
            <span className="pill">Condition: {tool.condition}</span>
            <SafetyRating rating={tool.safetyRating} />
          </div>
        </div>
      </header>

      {unavailable && (
        <p className="alert alert--error" role="status">
          This tool is under maintenance and cannot be reserved until an inventory manager returns it to service.
        </p>
      )}

      <p className="detail__desc">{tool.description}</p>
      <p className="muted">📍 Pickup: {tool.pickupStation}</p>

      <div className="detail__grid">
        <section className="panel" aria-labelledby="gear-title">
          <h2 id="gear-title" className="panel__title">Required safety gear</h2>
          {tool.safetyGear.length === 0 ? <p className="muted">No special gear needed.</p> : (
            <ul className="checklist">{tool.safetyGear.map((g) => <li key={g}>{g}</li>)}</ul>
          )}
        </section>
        <section className="panel" aria-labelledby="rules-title">
          <h2 id="rules-title" className="panel__title">Operating guidelines</h2>
          <ol className="rules">{tool.safetyGuidelines.map((g) => <li key={g}>{g}</li>)}</ol>
        </section>
      </div>

      <div className="detail__actions">
        <button type="button" className="btn btn--ghost" onClick={downloadSheet}>⬇ Download safety sheet</button>
        <button type="button" className="btn btn--primary" disabled title="Reservations arrive in Sprint 2">
          Reserve (coming in Sprint 2)
        </button>
      </div>

      {tool.weatherSensitive && <WeatherForecast latitude={tool.latitude} longitude={tool.longitude} station={tool.pickupStation} />}
      {isAdmin && <AdminStatusControl tool={tool} onUpdated={handleUpdated} />}
    </article>
  );
}
