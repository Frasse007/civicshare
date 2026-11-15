import { request } from './client.js';

// Builds a query string, skipping empty filters so URLs stay clean.
export function buildToolsQuery(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const fetchTools = (filters, signal) => request(`/tools${buildToolsQuery(filters)}`, { signal });
export const fetchTool = (id, signal) => request(`/tools/${id}`, { signal }).then((r) => r.data);
export const updateToolStatus = (id, status) => request(`/tools/${id}/status`, { method: 'PATCH', body: { status } }).then((r) => r.data);
