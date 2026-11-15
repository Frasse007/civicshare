import { describe, it, expect, vi } from 'vitest';
import { request, ApiError } from '../api/client.js';
import { fetchForecast } from '../api/weatherApi.js';

const jsonResponse = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

describe('request', () => {
  it('sends cookies and JSON bodies to /api', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    await request('/auth/login', { method: 'POST', body: { a: 1 } });
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/auth/login');
    expect(opts).toMatchObject({ method: 'POST', credentials: 'include', body: '{"a":1}' });
    expect(opts.headers['Content-Type']).toBe('application/json');
  });

  it('returns null for 204 responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }));
    expect(await request('/auth/logout', { method: 'POST' })).toBeNull();
  });

  it('throws ApiError with status, message and field errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: { message: 'Validation failed', details: [{ field: 'email', message: 'Bad email' }] } }, 400)));
    const err = await request('/x').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.fieldErrors).toEqual({ email: 'Bad email' });
  });

  it('survives non-JSON error bodies', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => { throw new Error('html'); } }));
    await expect(request('/x')).rejects.toMatchObject({ status: 502, message: 'Request failed (502)' });
  });

  it('turns network failures into a friendly message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(request('/x')).rejects.toThrow(/Cannot reach the CivicShare server/);
  });

  it('rethrows aborts untouched so callers can ignore them', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'AbortError' })));
    await expect(request('/x')).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('fetchForecast', () => {
  const payload = { daily: { time: ['2026-11-15'], weather_code: [0], temperature_2m_max: [50], temperature_2m_min: [40], precipitation_probability_max: [0], wind_speed_10m_max: [5] } };

  it('calls Open-Meteo with coordinates and imperial units', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
    vi.stubGlobal('fetch', fetchMock);
    const days = await fetchForecast(41.88, -87.62);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(url.searchParams.get('latitude')).toBe('41.88');
    expect(url.searchParams.get('temperature_unit')).toBe('fahrenheit');
    expect(days).toHaveLength(1);
  });

  it('throws when the service responds with an error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(fetchForecast(1, 1)).rejects.toThrow(/500/);
  });
});
