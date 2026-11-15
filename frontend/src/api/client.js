/**
 * Thin fetch wrapper used by every API module (single place for base URL, cookies, errors).
 * `credentials: 'include'` sends the HTTP-only session cookie, the SPA never touches the JWT.
 */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status = 0, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  // Turns the server's [{field, message}] list into { field: message } for forms.
  get fieldErrors() {
    return Object.fromEntries((this.details ?? []).map((d) => [d.field, d.message]));
  }
}

export async function request(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}/api${path}`, {
      method,
      credentials: 'include',
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Cannot reach the CivicShare server. Check your connection and try again.');
  }

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(payload?.error?.message || `Request failed (${response.status})`, {
      status: response.status,
      details: payload?.error?.details,
    });
  }
  return payload;
}
