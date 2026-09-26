import Icon from './Icon'
import WeatherIcon from './WeatherIcon'
import { formatTemp, rangeStyle } from '../utils/weatherUtils'

export default function WeeklyForecast({ forecast, unit, className = 'col-4' }) {
  const days = forecast?.daily ?? []
  const mins = days.map((d) => d.tempMin)
  const maxs = days.map((d) => d.tempMax)
  const globalMin = mins.length ? Math.min(...mins) : 0
  const globalMax = maxs.length ? Math.max(...maxs) : 1

  return (
    <section className={`card ${className} reveal`} style={{ '--i': 4 }} aria-labelledby="weekly-title">
      <div className="card__head">
        <h2 className="card__title" id="weekly-title">
          <Icon name="calendar" /> {days.length}-day forecast
        </h2>
      </div>

      <ul className="weekly">
        {days.map((d, i) => {
          const pop = Math.round((d.pop ?? 0) * 100)
          return (
            <li className="day-row" key={d.date}>
              <p className="day-row__name">
                {i === 0 ? 'Today' : d.dayName}
                <small>{d.date.slice(5)}</small>
              </p>
              <WeatherIcon icon={d.condition.icon} size={30} title={d.condition.description} />
              <div className="day-row__bar" aria-hidden="true">
                <i style={rangeStyle(d.tempMin, d.tempMax, globalMin, globalMax)} />
              </div>
              <p className="day-row__range">
                <span className="lo">{formatTemp(d.tempMin, unit)}</span>
                <span className="hi">{formatTemp(d.tempMax, unit)}</span>
                <span className="day-row__rain">{pop >= 20 ? `${pop}%` : ''}</span>
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
