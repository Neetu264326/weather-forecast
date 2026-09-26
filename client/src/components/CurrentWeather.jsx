import Icon from './Icon'
import WeatherIcon from './WeatherIcon'
import {
  conditionLabel,
  formatFullDate,
  formatTime,
  formatTemp,
} from '../utils/weatherUtils'

export default function CurrentWeather({ weather, unit, isFavorite, onToggleFavorite }) {
  const { city, current, condition, sun, epoch, isDay } = weather
  const offset = city.timezoneOffset

  return (
    <section className="card col-7 reveal" style={{ '--i': 0 }} aria-labelledby="now-title">
      <div className="hero">
        <div className="hero__top">
          <div>
            <h1 className="hero__place" id="now-title">
              {city.name}
              {city.country && city.country !== '--' ? `, ${city.country}` : ''}
            </h1>
            <p className="hero__sub">
              {formatFullDate(epoch, offset)} · {formatTime(epoch, offset)} local
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="icon-btn"
              onClick={onToggleFavorite}
              aria-pressed={isFavorite}
              aria-label={
                isFavorite ? `Remove ${city.name} from favorites` : `Save ${city.name} to favorites`
              }
              title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
            >
              <Icon name="star" filled={isFavorite} />
            </button>
          </div>
        </div>

        <div className="hero__main">
          <div>
            <p className="hero__temp mono" aria-label={`Temperature ${Math.round(current.temp)} degrees Celsius`}>
              {formatTemp(current.temp, unit, { round: true })}
              <span>{unit === 'F' ? 'F' : 'C'}</span>
            </p>
            <p className="hero__cond">{conditionLabel(condition)}</p>
            <p className="hero__feels">
              Feels like <strong>{formatTemp(current.feelsLike, unit)}</strong>
              {' · '}
              {isDay ? 'Daytime' : 'Night'}
            </p>
          </div>

          <div className="hero__art">
            <WeatherIcon icon={condition.icon} title={conditionLabel(condition)} />
          </div>
        </div>

        <div className="hero__chips">
          <span className="chip">
            <Icon name="arrowUp" /> High <b>{formatTemp(weather.temps.max, unit)}</b>
          </span>
          <span className="chip">
            <Icon name="arrowDown" /> Low <b>{formatTemp(weather.temps.min, unit)}</b>
          </span>
          <span className="chip">
            <Icon name="drop" /> Humidity <b>{current.humidity}%</b>
          </span>
          <span className="chip">
            <Icon name="wind" /> <b>{Math.round(current.windSpeed)}</b> km/h
          </span>
          <span className="chip">
            <Icon name="sunrise" /> <b>{formatTime(sun.sunrise, offset)}</b>
          </span>
          <span className="chip">
            <Icon name="sunset" /> <b>{formatTime(sun.sunset, offset)}</b>
          </span>
        </div>
      </div>
    </section>
  )
}
