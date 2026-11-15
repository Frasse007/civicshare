import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import SafetyRating from './SafetyRating.jsx';

// Presentational card: all data arrives through props (no context, no fetching).
export default function ToolCard({ tool }) {
  return (
    <article className={`tool-card ${tool.status === 'maintenance' ? 'tool-card--muted' : ''}`}>
      <Link to={`/tools/${tool.id}`} className="tool-card__link" aria-label={`${tool.name}, ${tool.category}`}>
        <div className="tool-card__art" aria-hidden="true">{tool.emoji}</div>
        <div className="tool-card__body">
          <p className="tool-card__category">{tool.category}</p>
          <h3>{tool.name}</h3>
          <div className="tool-card__row">
            <StatusBadge status={tool.status} />
            <span className="tool-card__condition">{tool.condition}</span>
          </div>
          <div className="tool-card__row tool-card__row--end">
            <SafetyRating rating={tool.safetyRating} />
            <span className="tool-card__station">📍 {tool.pickupStation}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
