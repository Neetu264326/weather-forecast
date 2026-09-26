import { useRef } from 'react'
import Icon from './Icon'
import WeatherIcon from './WeatherIcon'
import { formatHour, formatTemp, isSameHour } from '../utils/weatherUtils'

export default function HourlyForecast({ forecast, weather, unit, className = 'col-12' }) {
  const trackRef = useRef(null)
  const hours = forecast?.hourly ?? []
  const offset = weather?.city?.timezoneOffset ?? 0
  const nowEpoch = weather?.epoch

  const scrollBy = (dir) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.7), behavior: 'smooth' })
  }

  return (
    <section className={`card ${className} reveal`} style={{ '--i': 3 }} aria-labelledby="hourly-title">
      <div className="card__head">
        <h2 className="card__title" id="hourly-title">
          <Icon name="clock" /> Hourly forecast
        </h2>
        <span className="card__hint">
          {hours.length ? `3-hour steps · next ${Math.round((hours.length * 3) / 24)} days` : ''}
        </span>
      </div>

      <div className="hourly__wrap">
        <button
          type="button"
          className="hourly__nav hourly__nav--l"
          onClick={() => scrollBy(-1)}
          aria-label="Scroll hourly forecast left"
        >
          <Icon name="chevronLeft" size={16} />
        </button>

        <ul className="hourly__track scroll-x" ref={trackRef}>
          {hours.map((h) => {
            const now = isSameHour(h.time, nowEpoch)
            const pop = Math.round((h.pop ?? 0) * 100)
            return (
              <li key={h.time}>
                <article className={`hour-card${now ? ' is-now' : ''}`}>
                  <p className="hour-card__time">{now ? 'Now' : formatHour(h.time, offset)}</p>
                  <WeatherIcon
                    icon={h.condition.icon}
                    size={34}
                    title={h.condition.description}
                  />
                  <p className="hour-card__temp">{formatTemp(h.temp, unit)}</p>
                  <p className="hour-card__pop">{pop}%</p>
                  <div className="pop-bar" aria-hidden="true">
                    <i style={{ width: `${pop}%` }} />
                  </div>
                </article>
              </li>
            )
          })}
        </ul>

        <button
          type="button"
          className="hourly__nav hourly__nav--r"
          onClick={() => scrollBy(1)}
          aria-label="Scroll hourly forecast right"
        >
          <Icon name="chevronRight" size={16} />
        </button>
      </div>
    </section>
  )
}
