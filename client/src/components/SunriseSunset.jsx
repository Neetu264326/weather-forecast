import { useId } from 'react'
import Icon from './Icon'
import { daylight, formatTime, sunProgress } from '../utils/weatherUtils'

export default function SunriseSunset({ weather, className = 'col-4' }) {
  const id = useId()
  const { sun, epoch, city } = weather
  const offset = city.timezoneOffset
  const progress = sunProgress(sun.sunrise, sun.sunset, epoch)
  const isNight = epoch < sun.sunrise || epoch > sun.sunset

  /* point on the arc for the current moment */
  const x = 120 - 110 * Math.cos(Math.PI * progress)
  const y = 110 - 110 * Math.sin(Math.PI * progress)

  return (
    <section className={`card ${className} reveal`} style={{ '--i': 5 }} aria-labelledby="sun-title">
      <div className="card__head">
        <h2 className="card__title" id="sun-title">
          <Icon name="sunrise" /> Sun path
        </h2>
        <span className="card__hint">{isNight ? 'Night' : 'Daylight'}</span>
      </div>

      <svg
        className="sunpath__arc"
        viewBox="0 0 240 130"
        role="img"
        aria-label={`Sunrise ${formatTime(sun.sunrise, offset)}, sunset ${formatTime(sun.sunset, offset)}`}
      >
        <defs>
          <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--wx-a)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--wx-a)" stopOpacity="1" />
          </linearGradient>
        </defs>

        <line x1="6" y1="110" x2="234" y2="110" className="sunpath__track" />
        <path d="M10 110 A110 110 0 0 1 230 110" className="sunpath__track" />
        <path
          d="M10 110 A110 110 0 0 1 230 110"
          className="sunpath__done"
          pathLength="100"
          stroke={`url(#${id}-fade)`}
          strokeDasharray="100"
          strokeDashoffset={100 - progress * 100}
        />

        {!isNight && <circle cx={x} cy={y} r="9" className="sunpath__dot" />}
        {isNight && (
          <circle
            cx={progress < 0.5 ? 16 : 224}
            cy="118"
            r="8"
            fill="#cfdcff"
            opacity="0.9"
          />
        )}

        <text x="14" y="126" className="chart__lbl" textAnchor="start">
          {formatTime(sun.sunrise, offset)}
        </text>
        <text x="226" y="126" className="chart__lbl" textAnchor="end">
          {formatTime(sun.sunset, offset)}
        </text>
      </svg>

      <div className="sunpath__stats">
        <div className="sunpath__stat">
          <b>{formatTime(sun.sunrise, offset)}</b>
          <span>Sunrise</span>
        </div>
        <div className="sunpath__stat">
          <b>{daylight(sun.sunrise, sun.sunset)}</b>
          <span>Daylight</span>
        </div>
        <div className="sunpath__stat">
          <b>{formatTime(sun.sunset, offset)}</b>
          <span>Sunset</span>
        </div>
      </div>
    </section>
  )
}
