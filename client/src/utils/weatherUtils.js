import { AQI_LEVELS, CONDITION_GROUPS, GROUP_LABELS, UNITS, UV_LEVELS } from './constants.js'

/* ------------------------------------------------------------------
   Temperature — everything is stored in °C, converted only for display
------------------------------------------------------------------ */
export const toUnit = (c, unit) =>
  unit === UNITS.F ? (c * 9) / 5 + 32 : c

export const formatTemp = (c, unit, { degree = true, round = true } = {}) => {
  if (c === null || c === undefined || Number.isNaN(c)) return '--'
  const v = toUnit(c, unit)
  const out = round ? Math.round(v) : v.toFixed(1)
  return degree ? `${out}°` : `${out}`
}

export const unitLabel = (unit) => `°${unit}`

/* ------------------------------------------------------------------
   Condition helpers
------------------------------------------------------------------ */
export const conditionGroup = (id = 800) =>
  CONDITION_GROUPS.find((c) => id <= c.max)?.group ?? 'clouds'

export const isNightIcon = (icon = '') => icon.endsWith('n')

export const iconKey = (icon = '01d') => {
  const night = icon.endsWith('n')
  const code = icon.slice(0, 2)
  switch (code) {
    case '01':
      return night ? 'clear-night' : 'clear-day'
    case '02':
      return night ? 'partly-night' : 'partly-day'
    case '03':
    case '04':
      return code === '04' ? 'overcast' : 'cloudy'
    case '09':
      return 'rain'
    case '10':
      return night ? 'rain-night' : 'rain-day'
    case '11':
      return night ? 'thunder-night' : 'thunder-day'
    case '13':
      return 'snow'
    case '50':
      return night ? 'mist-night' : 'mist-day'
    default:
      return 'cloudy'
  }
}

export const groupFromIcon = (icon = '') => {
  const code = icon.slice(0, 2)
  if (code === '01') return 'clear'
  if (code === '02' || code === '03' || code === '04') return 'clouds'
  if (code === '09' || code === '10') return 'rain'
  if (code === '11') return 'thunderstorm'
  if (code === '13') return 'snow'
  if (code === '50') return 'mist'
  return 'clouds'
}

export const conditionLabel = (condition) =>
  condition?.description ||
  GROUP_LABELS[condition?.main?.toLowerCase()] ||
  condition?.main ||
  '—'

export const groupLabel = (group) => GROUP_LABELS[group] ?? 'Weather'

/* ------------------------------------------------------------------
   Time — API returns UTC epochs + a timezone offset in seconds.
   Adding the offset and reading with getUTC* gives local wall-clock.
------------------------------------------------------------------ */
const at = (epoch, offset = 0) => new Date((epoch + (offset || 0)) * 1000)

export const formatTime = (epoch, offset, { seconds = false } = {}) => {
  if (!epoch) return '--:--'
  const d = at(epoch, offset)
  const opts = { hour: '2-digit', minute: '2-digit', hour12: false }
  if (seconds) opts.second = '2-digit'
  return d.toLocaleTimeString('en-GB', { ...opts, timeZone: 'UTC' })
}

export const formatHour = (epoch, offset) =>
  at(epoch, offset).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })

export const formatWeekday = (epoch, offset, short = true) =>
  at(epoch, offset).toLocaleDateString('en-GB', {
    weekday: short ? 'short' : 'long',
    timeZone: 'UTC',
  })

export const formatFullDate = (epoch, offset) =>
  at(epoch, offset).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

export const formatDayMonth = (epoch, offset) =>
  at(epoch, offset).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })

export const isSameHour = (a, b) => {
  if (!a || !b) return false
  return Math.abs(a - b) < 3600
}

/* ------------------------------------------------------------------
   Wind
------------------------------------------------------------------ */
const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']

export const windDir = (deg = 0) => COMPASS[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16]

export const windSummary = (deg = 0) => `from the ${windDir(deg)}`

/* ------------------------------------------------------------------
   Air quality + UV
------------------------------------------------------------------ */
export const aqiLevel = (aqi) =>
  AQI_LEVELS.find((l) => aqi >= l.min && aqi <= l.max) ?? AQI_LEVELS[0]

export const uvLevel = (uvi = 0) => UV_LEVELS.find((l) => uvi <= l.max) ?? UV_LEVELS.at(-1)

export const aqiToPercent = (aqi = 1) => Math.min(100, Math.max(6, ((aqi - 1) / 4) * 100))

/* ------------------------------------------------------------------
   Sun path
------------------------------------------------------------------ */
export const sunProgress = (sunrise, sunset, now) => {
  if (!sunrise || !sunset || now <= sunrise) return 0
  if (now >= sunset) return 1
  return (now - sunrise) / (sunset - sunrise)
}

export const daylight = (sunrise, sunset) => {
  if (!sunrise || !sunset) return '--'
  const mins = Math.round((sunset - sunrise) / 60)
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`
}

/* ------------------------------------------------------------------
   Range bar for the weekly forecast
------------------------------------------------------------------ */
export const rangeStyle = (min, max, globalMin, globalMax) => {
  const span = Math.max(1, globalMax - globalMin)
  const left = ((min - globalMin) / span) * 100
  const width = Math.max(8, ((max - min) / span) * 100)
  return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }
}

/* ------------------------------------------------------------------
   Weather mood — plain, friendly copy. Not safety or medical advice.
------------------------------------------------------------------ */
export const getMood = ({ tempC, group, isDay, pop = 0, humidity = 50 }) => {
  const t = Math.round(tempC ?? 20)
  const wet = Math.max(pop, group === 'rain' || group === 'drizzle' ? 0.7 : 0)

  if (group === 'thunderstorm')
    return { emoji: '⛈️', text: 'Stormy skies — plan indoor time today.' }
  if (wet >= 0.6)
    return { emoji: '🌧️', text: 'Carry an umbrella today.' }
  if (group === 'snow')
    return { emoji: '❄️', text: 'Bundle up — dress warm for the cold.' }
  if (group === 'mist')
    return { emoji: '🌫️', text: 'Hazy conditions — leave a little extra travel time.' }

  if (t >= 34) return { emoji: '🔥', text: 'Scorching out there — hydrate often.' }
  if (t <= 5) return { emoji: '🧊', text: 'Bitterly cold — layers are your friend.' }
  if (t >= 26 && humidity >= 75)
    return { emoji: '💧', text: 'Warm and sticky — a breezy spot will feel better.' }

  if (group === 'clouds')
    return { emoji: '⛅', text: 'Soft, cloudy skies — great for a long walk.' }

  if (isDay && t >= 21 && t <= 30)
    return { emoji: '🌤️', text: 'Perfect afternoon for outdoor plans.' }
  if (!isDay && t >= 16 && t <= 26 && wet < 0.3)
    return { emoji: '🌙', text: 'Perfect evening for a walk.' }
  if (t >= 14 && t <= 32)
    return { emoji: isDay ? '☀️' : '🌙', text: 'Comfortable conditions all around.' }

  return { emoji: isDay ? '🌤️' : '🌙', text: 'A steady, ordinary day of weather.' }
}

/* ------------------------------------------------------------------
   Data-driven insights — only built from values we actually have.
------------------------------------------------------------------ */
export const deriveInsights = ({ hourly = [], daily = [], weather }) => {
  const out = []
  if (!hourly.length && !daily.length) return out

  const off = weather?.city?.timezoneOffset ?? 0

  if (hourly.length >= 4) {
    const peak = hourly.reduce((a, b) => (b.temp > a.temp ? b : a), hourly[0])
    out.push(`Temperature peaks near ${formatHour(peak.time, off)} at ${Math.round(peak.temp)}°.`)

    const evening = hourly.filter((h) => {
      const hour = at(h.time, off).getUTCHours()
      return hour >= 17 && hour <= 23
    })
    if (evening.length) {
      const maxPop = Math.max(...evening.map((h) => h.pop ?? 0))
      const nowPop = hourly[0].pop ?? 0
      if (maxPop >= 0.4 && maxPop > nowPop + 0.15)
        out.push(`Rain chance climbs in the evening — up to ${Math.round(maxPop * 100)}%.`)
      else if (maxPop < 0.25)
        out.push('Rain is unlikely for the rest of today.')
    }

    const windTrend = hourly.at(-1)?.windSpeed
    if (windTrend && weather?.current?.windSpeed) {
      const diff = Math.round(windTrend - weather.current.windSpeed)
      if (diff >= 6) out.push(`Winds strengthen later — up to ${Math.round(windTrend)} km/h.`)
      else if (diff <= -6) out.push('Winds ease off compared with right now.')
    }

    const first = hourly[0]
    const later = hourly[Math.min(3, hourly.length - 1)]
    const feel = Math.round(later.temp - first.temp)
    if (Math.abs(feel) >= 3)
      out.push(
        `${feel > 0 ? 'Warm-up' : 'Cool-down'} ahead: ${Math.abs(feel)}° ${
          feel > 0 ? 'warmer' : 'cooler'
        } within the next few hours.`,
      )
  }

  if (daily.length >= 2) {
    const [today, tomorrow] = daily
    const diff = Math.round(tomorrow.tempMax - today.tempMax)
    if (diff !== 0)
      out.push(
        `${tomorrow.dayName} will be ${Math.abs(diff)}° ${diff > 0 ? 'warmer' : 'cooler'} than ${today.dayName}.`,
      )
    const wettest = daily.reduce((a, b) => (b.pop > a.pop ? b : a), daily[0])
    if (wettest.pop >= 0.5)
      out.push(`Wettest day this week: ${wettest.dayName} (${Math.round(wettest.pop * 100)}% chance).`)
  }

  return out.slice(0, 4)
}

export const avg = (arr, key) => {
  if (!arr?.length) return 0
  return arr.reduce((s, x) => s + (key ? x[key] : x), 0) / arr.length
}
