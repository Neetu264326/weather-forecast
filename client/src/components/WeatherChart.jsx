import { useId } from 'react'
import Icon from './Icon'
import { formatHour, formatTemp } from '../utils/weatherUtils'

const W = 600
const H = 220
const PAD = { top: 30, right: 18, bottom: 34, left: 34 }

export default function WeatherChart({ hourly = [], unit, offset = 0, type = 'temp', className = 'col-6', title }) {
  const id = useId()
  const n = hourly.length
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const stepX = n > 1 ? innerW / (n - 1) : 0
  const labelEvery = Math.max(1, Math.ceil(n / 8))

  const xAt = (i) => PAD.left + i * stepX

  if (type === 'temp') {
    const temps = hourly.map((h) => h.temp)
    const rawMin = Math.min(...temps)
    const rawMax = Math.max(...temps)
    const pad = Math.max(2, (rawMax - rawMin) * 0.25)
    const min = rawMin - pad
    const max = rawMax + pad
    const yAt = (v) => PAD.top + ((max - v) / (max - min)) * innerH

    const points = hourly.map((h, i) => [xAt(i), yAt(h.temp)])
    const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
    const area = `${line} L${points.at(-1)?.[0] ?? 0} ${H - PAD.bottom} L${PAD.left} ${H - PAD.bottom} Z`
    const gridVals = [max - pad * 0.4, (max + min) / 2, min + pad * 0.4]

    return (
      <section className={`card ${className} reveal`} style={{ '--i': 8 }} aria-labelledby="chart-temp">
        <div className="card__head">
          <h2 className="card__title" id="chart-temp">
            <Icon name="trend" /> {title ?? 'Temperature trend'}
          </h2>
          <span className="card__hint">next {n * 3}h</span>
        </div>

        <svg className="chart__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Temperature trend chart">
          <defs>
            <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--wx-a)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--wx-a)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridVals.map((v, i) => (
            <g key={i}>
              <line
                className="chart__grid"
                x1={PAD.left}
                x2={W - PAD.right}
                y1={yAt(v)}
                y2={yAt(v)}
              />
              <text className="chart__lbl" x={PAD.left - 8} y={yAt(v) + 3} textAnchor="end">
                {Math.round(v)}°
              </text>
            </g>
          ))}

          <path className="chart__area" d={area} fill={`url(#${id}-area)`} />
          <path className="chart__line" d={line} pathLength="1000" />

          {points.map(([x, y], i) =>
            i % labelEvery === 0 ? (
              <g key={i}>
                <circle className="chart__dot" cx={x} cy={y} r="4" />
                <text className="chart__val" x={x} y={y - 12}>
                  {formatTemp(hourly[i].temp, unit)}
                </text>
                <text className="chart__lbl" x={x} y={H - 12}>
                  {formatHour(hourly[i].time, offset)}
                </text>
              </g>
            ) : null,
          )}
        </svg>
      </section>
    )
  }

  /* rain probability bars */
  const barW = Math.max(6, (innerW / Math.max(1, n)) * 0.6)
  const yAt = (v) => PAD.top + (1 - v) * innerH

  return (
    <section className={`card ${className} reveal`} style={{ '--i': 9 }} aria-labelledby="chart-rain">
      <div className="card__head">
        <h2 className="card__title" id="chart-rain">
          <Icon name="umbrella" /> {title ?? 'Rain probability'}
        </h2>
        <span className="card__hint">hourly</span>
      </div>

      <svg className="chart__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Rain probability chart">
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line className="chart__grid" x1={PAD.left} x2={W - PAD.right} y1={yAt(v)} y2={yAt(v)} />
            <text className="chart__lbl" x={PAD.left - 8} y={yAt(v) + 3} textAnchor="end">
              {Math.round(v * 100)}%
            </text>
          </g>
        ))}

        {hourly.map((h, i) => {
          const pop = h.pop ?? 0
          const x = xAt(i) - barW / 2
          const y = yAt(pop)
          return (
            <g key={h.time}>
              <rect
                className="chart__bar"
                x={x}
                y={y}
                width={barW}
                height={Math.max(2, PAD.top + innerH - y)}
                rx="5"
                opacity={0.35 + pop * 0.65}
              >
                <title>{`${formatHour(h.time, offset)} · ${Math.round(pop * 100)}%`}</title>
              </rect>
              {i % labelEvery === 0 && (
                <text className="chart__lbl" x={xAt(i)} y={H - 12}>
                  {formatHour(h.time, offset)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </section>
  )
}
