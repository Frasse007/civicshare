import { statusMeta } from '../utils/format.js';

export default function StatusBadge({ status }) {
  const { label, tone } = statusMeta(status);
  return <span className={`badge badge--${tone}`}>{label}</span>;
}
