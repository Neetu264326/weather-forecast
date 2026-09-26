import Icon from './Icon'
import { deriveInsights, getMood, groupFromIcon, groupLabel } from '../utils/weatherUtils'

export default function WeatherMood({ weather, forecast, className = 'col-5' }) {
  const { current, condition, isDay, city } = weather
  const group = groupFromIcon(condition.icon)
  const pop = forecast?.hourly?.[0]?.pop ?? 0

  const mood = getMood({
    tempC: current.temp,
    group,
    isDay,
    pop,
    humidity: current.humidity,
  })

  const insights = deriveInsights({ hourly: forecast?.hourly, daily: forecast?.daily, weather })

  return (
    <section className={`card ${className} reveal`} style={{ '--i': 2 }} aria-labelledby="mood-title">
      <div className="card__head">
        <h2 className="card__title" id="mood-title">
          <Icon name="sparkle" /> Weather mood &amp; insights
        </h2>
        <span className="card__hint">{groupLabel(group)}</span>
      </div>

      <div className="mood">
        <div className="mood__banner">
          <span className="mood__emoji" aria-hidden="true">
            {mood.emoji}
          </span>
          <div>
            <p className="mood__text">{mood.text}</p>
            <p className="mood__disclaimer">
              A light-hearted summary of {city.name} conditions — not safety or health advice.
            </p>
          </div>
        </div>

        {insights.length > 0 ? (
          <ul className="insights">
            {insights.map((text, i) => (
              <li key={text}>
                <Icon name={i % 2 === 0 ? 'trend' : 'sparkle'} />
                {text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted" style={{ fontSize: 13.5 }}>
            Insights appear once enough forecast data is loaded.
          </p>
        )}
      </div>
    </section>
  )
}
