import Icon from './Icon'
import { windDir } from '../utils/weatherUtils'

export default function WindDial({ weather, className = 'col-3' }) {
  const { current } = weather
  const deg = current.windDeg ?? 0
  const speed = Math.round(current.windSpeed)
  const gust = current.windGust ? Math.round(current.windGust) : null

  /* weather wind direction is "blowing FROM"; the needle points where it goes */
  const needleRotation = deg + 180

  return (
    <section className={`card ${className} reveal`} style={{ '--i': 7 }} aria-labelledby="wind-title">
      <div className="card__head">
        <h2 className="card__title" id="wind-title">
          <Icon name="wind" /> Wind
        </h2>
        <span className="card__hint">{windDir(deg)}</span>
      </div>

      <svg
        className="wind__dial"
        viewBox="0 0 180 180"
        role="img"
        aria-label={`Wind ${speed} kilometres per hour from ${windDir(deg)}`}
      >
        <circle cx="90" cy="90" r="70" className="wind__ring" />
        <circle cx="90" cy="90" r="56" className="wind__ring" opacity="0.5" />

        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i * 22.5 * Math.PI) / 180
          const major = i % 4 === 0
          const r1 = major ? 58 : 64
          const r2 = 70
          return (
            <line
              key={i}
              className="wind__tick"
              x1={90 + Math.sin(a) * r1}
              y1={90 - Math.cos(a) * r1}
              x2={90 + Math.sin(a) * r2}
              y2={90 - Math.cos(a) * r2}
              opacity={major ? 0.9 : 0.4}
            />
          )
        })}

        {[
          ['N', 90, 26],
          ['E', 158, 94],
          ['S', 90, 163],
          ['W', 22, 94],
        ].map(([t, x, y]) => (
          <text key={t} x={x} y={y} className="wind__cardinal">
            {t}
          </text>
        ))}

        <g className="wind__needle" style={{ transform: `rotate(${needleRotation}deg)` }}>
          <path
            d="M90 34 L100 96 L90 88 L80 96 Z"
            fill="var(--wx-a)"
            stroke="var(--wx-a)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M90 146 L96 104 L90 110 L84 104 Z" fill="var(--surface-3)" opacity="0.9" />
        </g>

        <circle cx="90" cy="90" r="17" fill="var(--bg-1)" stroke="var(--wx-a)" strokeWidth="2" />
        <text x="90" y="88" textAnchor="middle" className="wind__cardinal" fill="var(--text)" fontSize="13">
          {speed}
        </text>
        <text x="90" y="99" textAnchor="middle" className="wind__cardinal" fontSize="7">
          km/h
        </text>
      </svg>

      <div className="wind__stats">
        <div className="pollutant">
          <b>{windDir(deg)}</b>
          <span>Direction</span>
        </div>
        <div className="pollutant">
          <b>{gust ?? '--'}</b>
          <span>Gusts km/h</span>
        </div>
      </div>
    </section>
  )
}
