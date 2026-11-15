import { normalizeForecast } from '../utils/weather.js';

// Open-Meteo needs no API key for standard endpoints.
const ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

// 7-day forecast for a pickup station. Throws on network/HTTP failure so the UI can show a retry.
export async function fetchForecast(latitude, longitude, signal) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    timezone: 'auto',
    forecast_days: '7',
  });
  const response = await fetch(`${ENDPOINT}?${params}`, { signal });
  if (!response.ok) throw new Error(`Weather service returned ${response.status}`);
  return normalizeForecast(await response.json());
}
