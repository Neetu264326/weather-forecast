import Icon from './Icon'
import { aqiLevel, aqiToPercent, uvLevel } from '../utils/weatherUtils'

const POLLUTANTS = [
  { key: 'pm2_5', label: 'PM2.5' },
  { key: 'pm10', label: 'PM10' },
  { key: 'o3', label: 'O₃' },
  { key: 'no2', label: 'NO₂' },
  { key: 'so2', label: 'SO₂' },
  { key: 'co', label: 'CO' },
]

export default function AirQuality({ air, weather, error, className = 'col-4' }) {
  if (!air && !error) {
    return (
      <section className={`card ${className} reveal`} style={{ '--i': 6 }} aria-labelledby="aqi-title">
        <div className="card__head">
          <h2 className="card__title" id="aqi-title">
            <Icon name="shield" /> Air quality
          </h2>
        </div>
        <div className="sk" style={{ height: 62, marginBottom: 12 }} />
        <div className="aqi__grid">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div className="sk" key={i} style={{ height: 54 }} />
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className={`card ${className} reveal`} style={{ '--i': 6 }} aria-labelledby="aqi-title">
        <div className="card__head">
          <h2 className="card__title" id="aqi-title">
            <Icon name="shield" /> Air quality
          </h2>
        </div>
        <p className="muted" style={{ fontSize: 13.5 }}>
          Air quality data is unavailable right now. {error}
        </p>
      </section>
    )
  }

  const level = aqiLevel(air.aqi)
  const pct = aqiToPercent(air.aqi)
  const uvi = air.uvi ?? weather?.current?.uvi ?? 0
  const uvInfo = uvLevel(uvi)

  return (
    <section className={`card ${className} reveal`} style={{ '--i': 6 }} aria-labelledby="aqi-title">
      <div className="card__head">
        <h2 className="card__title" id="aqi-title">
          <Icon name="shield" /> Air quality
        </h2>
        <span className="card__hint">OpenWeather AQI</span>
      </div>

      <div className="aqi__top">
        <svg
          className="aqi__gauge"
          viewBox="0 0 120 68"
          role="img"
          aria-label={`Air quality index ${air.aqi}, ${level.label}`}
          style={{ '--aqi-color': level.color }}
        >
          <path d="M10 60 A50 50 0 0 1 110 60" className="aqi__arc-bg" pathLength="100" />
          <path
            d="M10 60 A50 50 0 0 1 110 60"
            className="aqi__arc-fill"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 - pct}
            stroke={level.color}
          />
        </svg>

        <div>
          <p className="aqi__value" style={{ color: level.color }}>
            {air.aqi}
          </p>
          <p className="aqi__cat" style={{ color: level.color }}>
            {level.label}
          </p>
          <p className="aqi__note">{level.note}</p>
        </div>
      </div>

      <div className="aqi__grid">
        {POLLUTANTS.map((p) => (
          <div className="pollutant" key={p.key}>
            <b>{air.pollutants?.[p.key] ?? '--'}</b>
            <span>{p.label}</span>
          </div>
        ))}
      </div>

      <div className="uv-row">
        <span>
          <Icon name="sun" size={14} /> UV index (estimated)
        </span>
        <b style={{ color: uvInfo.color }}>
          {uvi.toFixed(1)} · {uvInfo.label}
        </b>
      </div>
    </section>
  )
}
