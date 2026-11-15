/**
 * Pure helpers for the Open-Meteo integration (https://open-meteo.com/en/docs).
 * Kept separate from the fetching code so they are trivial to unit test.
 */

// WMO weather interpretation codes -> label + emoji.
const WMO = [
  [[0], 'Clear sky', '☀️'],
  [[1], 'Mainly clear', '🌤️'],
  [[2], 'Partly cloudy', '⛅'],
  [[3], 'Overcast', '☁️'],
  [[45, 48], 'Fog', '🌫️'],
  [[51, 53, 55, 56, 57], 'Drizzle', '🌦️'],
  [[61, 63, 65, 66, 67], 'Rain', '🌧️'],
  [[71, 73, 75, 77], 'Snow', '🌨️'],
  [[80, 81, 82], 'Rain showers', '🌧️'],
  [[85, 86], 'Snow showers', '🌨️'],
  [[95, 96, 99], 'Thunderstorm', '⛈️'],
];

export function describeWeatherCode(code) {
  const hit = WMO.find(([codes]) => codes.includes(code));
  return hit ? { label: hit[1], icon: hit[2] } : { label: 'Unknown', icon: '❔' };
}

// Converts Open-Meteo's column-oriented `daily` block into an array of day objects.
export function normalizeForecast(raw) {
  const d = raw?.daily;
  if (!d || !Array.isArray(d.time)) throw new Error('Unexpected forecast response');
  return d.time.map((date, i) => ({
    date,
    code: d.weather_code[i],
    max: Math.round(d.temperature_2m_max[i]),
    min: Math.round(d.temperature_2m_min[i]),
    precipChance: d.precipitation_probability_max?.[i] ?? 0,
    wind: Math.round(d.wind_speed_10m_max[i]),
    ...describeWeatherCode(d.weather_code[i]),
  }));
}

export function assessDay({ code, max, min, precipChance, wind }) {
  if (code >= 95) return { level: 'avoid', reason: 'Thunderstorms forecast' };
  if (wind >= 30) return { level: 'avoid', reason: `Very windy (${wind} mph)` };
  if (precipChance >= 60) return { level: 'avoid', reason: `Likely rain (${precipChance}%)` };
  if (min <= 25) return { level: 'caution', reason: 'Freezing temperatures' };
  if (max >= 95) return { level: 'caution', reason: 'Extreme heat - take breaks' };
  if (wind >= 20) return { level: 'caution', reason: `Gusty (${wind} mph)` };
  if (precipChance >= 30) return { level: 'caution', reason: `Chance of rain (${precipChance}%)` };
  return { level: 'good', reason: 'Good conditions' };
}

export function formatDayName(isoDate, index) {
  if (index === 0) return 'Today';
  // Parse as local noon to avoid off-by-one-day shifts from timezone conversion.
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' });
}
