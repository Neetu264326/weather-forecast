import Icon from './Icon'
import { DETAIL_ICONS } from '../utils/constants'
import { formatTemp, uvLevel, windDir } from '../utils/weatherUtils'

export default function WeatherDetails({ weather, unit, air }) {
  const { current, city } = weather
  const uv = air?.uvi ?? current.uvi ?? null
  const uvInfo = uvLevel(uv ?? 0)

  const items = [
    {
      key: 'humidity',
      label: 'Humidity',
      value: `${current.humidity}%`,
      sub: current.humidity > 75 ? 'Muggy' : current.humidity < 40 ? 'Dry' : 'Comfortable',
      meter: current.humidity,
    },
    {
      key: 'wind',
      label: 'Wind',
      value: `${Math.round(current.windSpeed)} km/h`,
      sub: `${windDir(current.windDeg)}${current.windGust ? ` · gusts ${Math.round(current.windGust)}` : ''}`,
      meter: Math.min(100, (current.windSpeed / 60) * 100),
    },
    {
      key: 'pressure',
      label: 'Pressure',
      value: `${current.pressure} hPa`,
      sub: current.pressure > 1013 ? 'Above average' : 'Below average',
      meter: ((current.pressure - 970) / 80) * 100,
    },
    {
      key: 'visibility',
      label: 'Visibility',
      value: `${current.visibility} km`,
      sub: current.visibility >= 8 ? 'Clear views' : 'Reduced',
      meter: (current.visibility / 10) * 100,
    },
    {
      key: 'uv',
      label: 'UV index',
      value: uv === null ? '--' : uv.toFixed(1),
      sub: uv === null ? 'Unavailable' : uvInfo.label,
      meter: uv === null ? 0 : (uv / 11) * 100,
    },
    {
      key: 'clouds',
      label: 'Cloud cover',
      value: `${current.clouds}%`,
      sub: current.clouds > 70 ? 'Mostly cloudy' : current.clouds > 30 ? 'Partly cloudy' : 'Mostly clear',
      meter: current.clouds,
    },
    {
      key: 'dew',
      label: 'Dew point',
      value: formatTemp(current.dewPoint ?? 0, unit),
      sub: current.dewPoint >= 18 ? 'Sticky feel' : 'Pleasant feel',
      meter: Math.min(100, ((current.dewPoint ?? 0) + 10) * 3),
    },
  ]

  return (
    <section className="card col-12 reveal" style={{ '--i': 1 }} aria-labelledby="details-title">
      <div className="card__head">
        <h2 className="card__title" id="details-title">
          <Icon name="layers" /> Weather details
        </h2>
        <span className="card__hint">
          {city.name} · updated {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="details">
        {items.map((item) => (
          <article className="detail" key={item.key}>
            <p className="detail__label">
              <Icon name={DETAIL_ICONS[item.key]} />
              {item.label}
            </p>
            <p className="detail__value">{item.value}</p>
            <p className="detail__sub">{item.sub}</p>
            <div className="meter" aria-hidden="true">
              <i style={{ width: `${Math.max(4, Math.min(100, item.meter))}%` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
