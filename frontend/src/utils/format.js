export const STATUS_META = {
  available: { label: 'Available', tone: 'ok' },
  borrowed: { label: 'On loan', tone: 'warn' },
  maintenance: { label: 'Under maintenance', tone: 'bad' },
};

export function statusMeta(status) {
  return STATUS_META[status] ?? { label: status, tone: 'warn' };
}
