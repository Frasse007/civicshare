import { fetchForecast } from '../api/weatherApi.js';
import { useAsyncResource } from '../hooks/useAsyncResource.js';
import { assessDay, formatDayName } from '../utils/weather.js';

// Open-Meteo 7-day outlook for the tool's pickup station, with a go / caution / avoid hint per day.
export default function WeatherForecast({ latitude, longitude, station }) {
  const { status, data: days, error, retry } = useAsyncResource(
    (signal) => fetchForecast(latitude, longitude, signal),
    `${latitude},${longitude}`,
  );

  return (
    <section className="panel" aria-labelledby="weather-title">
      <h2 id="weather-title" className="panel__title">Weather near {station}</h2>
      <p className="muted panel__sub">Outdoor tool - check the forecast before you borrow. Data: Open-Meteo.</p>

      {status === 'loading' && <p className="muted" aria-live="polite">Loading forecast…</p>}
      {status === 'error' && (
        <div className="alert alert--error" role="alert">
          <p>Could not load the forecast. {error.message}</p>
          <button type="button" className="btn btn--ghost btn--sm" onClick={retry}>Retry</button>
        </div>
      )}
      {status === 'success' && (
        <ul className="forecast">
          {days.map((day, i) => {
            const advice = assessDay(day);
            return (
              <li key={day.date} className={`forecast__day forecast__day--${advice.level}`}>
                <p className="forecast__name">{formatDayName(day.date, i)}</p>
                <p className="forecast__icon" role="img" aria-label={day.label}>{day.icon}</p>
                <p className="forecast__temp">{day.max}° <span>/ {day.min}°</span></p>
                <p className="forecast__meta">💧 {day.precipChance}% · 💨 {day.wind} mph</p>
                <p className="forecast__advice">{advice.reason}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}