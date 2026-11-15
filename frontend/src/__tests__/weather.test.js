import { describe, it, expect } from 'vitest';
import { describeWeatherCode, normalizeForecast, assessDay, formatDayName } from '../utils/weather.js';

describe('describeWeatherCode', () => {
  it.each([[0, 'Clear sky'], [3, 'Overcast'], [63, 'Rain'], [75, 'Snow'], [95, 'Thunderstorm']])('maps WMO %i to %s', (code, label) => {
    expect(describeWeatherCode(code).label).toBe(label);
  });
  it('falls back for unknown codes', () => {
    expect(describeWeatherCode(12345)).toEqual({ label: 'Unknown', icon: '❔' });
  });
});

describe('normalizeForecast', () => {
  const raw = { daily: { time: ['2026-11-15'], weather_code: [2], temperature_2m_max: [51.6], temperature_2m_min: [38.2], precipitation_probability_max: [40], wind_speed_10m_max: [11.7] } };
  it('turns column arrays into rounded day objects', () => {
    expect(normalizeForecast(raw)[0]).toMatchObject({ date: '2026-11-15', max: 52, min: 38, precipChance: 40, wind: 12, label: 'Partly cloudy' });
  });
  it('defaults missing precipitation to 0', () => {
    const copy = structuredClone(raw);
    delete copy.daily.precipitation_probability_max;
    expect(normalizeForecast(copy)[0].precipChance).toBe(0);
  });
  it('throws on malformed payloads', () => {
    expect(() => normalizeForecast({})).toThrow(/Unexpected/);
    expect(() => normalizeForecast(null)).toThrow();
  });
});

describe('assessDay', () => {
  const day = { code: 0, max: 70, min: 50, precipChance: 0, wind: 5 };
  it('is good in calm dry weather', () => expect(assessDay(day).level).toBe('good'));
  it('avoids thunderstorms, high wind and likely rain', () => {
    expect(assessDay({ ...day, code: 95 }).level).toBe('avoid');
    expect(assessDay({ ...day, wind: 30 }).level).toBe('avoid');
    expect(assessDay({ ...day, precipChance: 60 }).level).toBe('avoid');
  });
  it('cautions for cold, heat, gusts and showers', () => {
    expect(assessDay({ ...day, min: 20 }).level).toBe('caution');
    expect(assessDay({ ...day, max: 99 }).level).toBe('caution');
    expect(assessDay({ ...day, wind: 22 }).level).toBe('caution');
    expect(assessDay({ ...day, precipChance: 35 }).reason).toMatch(/35%/);
  });
  it('uses exact boundaries (29 mph is caution, 30 is avoid)', () => {
    expect(assessDay({ ...day, wind: 29 }).level).toBe('caution');
    expect(assessDay({ ...day, wind: 30 }).level).toBe('avoid');
  });
});

describe('formatDayName', () => {
  it('labels the first day Today', () => expect(formatDayName('2026-11-15', 0)).toBe('Today'));
  it('returns a short weekday afterwards', () => expect(formatDayName('2026-11-16', 1)).toMatch(/^\w{3}/));
});
