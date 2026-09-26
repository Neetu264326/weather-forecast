import { useId } from 'react'
import { iconKey } from '../utils/weatherUtils'

/* Small shared pieces — kept inside the file so the icon set is self-contained */
const CLOUD_D = 'M18 10a5 5 0 0 0-9.6-1.5A4 4 0 1 0 7 18h11a4 4 0 0 0 0-8z'

const Cloud = ({ x = 4, y = 16, s = 2, className = 'wi-cloud', fill = '#e8eefc' }) => (
  <path
    d={CLOUD_D}
    className={className}
    transform={`translate(${x} ${y}) scale(${s})`}
    fill={fill}
  />
)

const Sun = ({ cx = 24, cy = 18, r = 9, fill = 'url(#wx-sun)' }) => (
  <g className="wi-sun" style={{ transformOrigin: `${cx}px ${cy}px` }}>
    <circle cx={cx} cy={cy} r={r + 7} fill={fill} opacity="0.35" />
    <circle cx={cx} cy={cy} r={r} fill={fill} />
    {Array.from({ length: 8 }).map((_, i) => (
      <line
        key={i}
        x1={cx + Math.cos((i * Math.PI) / 4) * (r + 10)}
        y1={cy + Math.sin((i * Math.PI) / 4) * (r + 10)}
        x2={cx + Math.cos((i * Math.PI) / 4) * (r + 15)}
        y2={cy + Math.sin((i * Math.PI) / 4) * (r + 15)}
        stroke={fill}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />
    ))}
  </g>
)

const Moon = ({ x = 14, y = 8, s = 2, fill = '#cfdcff' }) => (
  <g>
    <path
      className="wi-cloud"
      d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"
      transform={`translate(${x} ${y}) scale(${s})`}
      fill={fill}
    />
    <path
      className="wi-night-star"
      d="M52 14l1.6 4.4L58 20l-4.4 1.6L52 26l-1.6-4.4L46 20l4.4-1.6z"
      fill="#fff"
      opacity="0.9"
    />
  </g>
)

const Drops = ({ color = '#7dd3fc' }) => (
  <g stroke={color} strokeWidth="3.4" strokeLinecap="round">
    {[22, 32, 42].map((x, i) => (
      <line
        key={x}
        className="wi-drop"
        x1={x}
        y1={50}
        x2={x}
        y2={57}
        style={{ animationDelay: `${i * 0.24}s` }}
      />
    ))}
  </g>
)

const Flakes = ({ color = '#e0f2fe' }) => (
  <g stroke={color} strokeWidth="2.6" strokeLinecap="round">
    {[22, 33, 44].map((x, i) => (
      <g
        key={x}
        className="wi-flake"
        style={{ transformOrigin: `${x}px 54px`, animationDelay: `${i * 0.6}s` }}
      >
        <path d={`M${x} 50v8M${x - 4} 54h8M${x - 3} 51l6 6M${x + 3} 51l-6 6`} />
      </g>
    ))}
  </g>
)

const Bolt = () => (
  <path
    className="wi-bolt"
    d="M35 44 26 58h9l-2 12 13-17h-9z"
    fill="#fde047"
    stroke="#facc15"
    strokeWidth="1.5"
    strokeLinejoin="round"
  />
)

const MistLines = ({ color = '#cbd5e1' }) => (
  <g stroke={color} strokeWidth="3.4" strokeLinecap="round" opacity="0.85">
    <path d="M16 50h30" />
    <path d="M22 57h26" />
    <path d="M18 63h20" />
  </g>
)

/**
 * Animated weather glyph.
 * `icon` is the OpenWeather icon code (e.g. "10d"), mapped locally to a
 * hand-drawn SVG scene — no icon font, no external images.
 */
export default function WeatherIcon({ icon = '01d', size = 40, className = '', title }) {
  const id = useId()
  const key = iconKey(icon)
  const sunId = `${id}-sun`

  const scene = () => {
    switch (key) {
      case 'clear-day':
        return <Sun cx={32} cy={30} r={13} fill={`url(#${sunId})`} />
      case 'clear-night':
        return <Moon x={12} y={6} s={2.2} />
      case 'partly-day':
        return (
          <>
            <Sun cx={44} cy={17} r={8} fill={`url(#${sunId})`} />
            <Cloud x={4} y={22} s={1.9} />
          </>
        )
      case 'partly-night':
        return (
          <>
            <Moon x={26} y={4} s={1.5} />
            <Cloud x={2} y={22} s={1.9} />
          </>
        )
      case 'cloudy':
        return (
          <>
            <Cloud x={16} y={8} s={1.2} fill="#c7d3ea" className="wi-cloud-sm" />
            <Cloud x={4} y={22} s={1.9} />
          </>
        )
      case 'overcast':
        return (
          <>
            <Cloud x={14} y={4} s={1.1} fill="#93a4c4" className="wi-cloud-sm" />
            <Cloud x={4} y={18} s={1.7} fill="#cbd6ec" />
            <Cloud x={16} y={30} s={1.3} fill="#aebbd6" className="wi-cloud-sm" />
          </>
        )
      case 'rain-day':
        return (
          <>
            <Sun cx={48} cy={14} r={7} fill={`url(#${sunId})`} />
            <Cloud x={4} y={18} s={1.8} />
            <Drops />
          </>
        )
      case 'rain-night':
        return (
          <>
            <Moon x={30} y={2} s={1.3} />
            <Cloud x={4} y={18} s={1.8} />
            <Drops />
          </>
        )
      case 'rain':
        return (
          <>
            <Cloud x={4} y={16} s={1.9} />
            <Drops />
          </>
        )
      case 'drizzle':
        return (
          <>
            <Cloud x={4} y={16} s={1.9} />
            <Drops color="#93c5fd" />
          </>
        )
      case 'thunder-day':
        return (
          <>
            <Cloud x={4} y={10} s={1.9} fill="#9aa9c9" />
            <Bolt />
          </>
        )
      case 'thunder-night':
        return (
          <>
            <Moon x={30} y={2} s={1.3} />
            <Cloud x={4} y={12} s={1.8} fill="#8b98ba" />
            <Bolt />
          </>
        )
      case 'snow':
        return (
          <>
            <Cloud x={4} y={16} s={1.9} />
            <Flakes />
          </>
        )
      case 'mist-day':
        return (
          <>
            <Cloud x={8} y={12} s={1.6} fill="#d8e0f0" />
            <MistLines />
          </>
        )
      case 'mist-night':
        return (
          <>
            <Moon x={28} y={4} s={1.3} />
            <Cloud x={8} y={14} s={1.6} fill="#aab6d0" />
            <MistLines color="#9aa7c2" />
          </>
        )
      default:
        return <Cloud x={4} y={16} s={1.9} />
    }
  }

  return (
    <svg
      className={`weather-ico ${className}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
    >
      <defs>
        <radialGradient id={sunId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="55%" stopColor="#ffce4a" />
          <stop offset="100%" stopColor="#ff9f1c" />
        </radialGradient>
      </defs>
      {scene()}
    </svg>
  )
}
