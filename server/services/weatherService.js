import { env, hasApiKey, isFixtures } from '../config/env.js'
import { OPENWEATHER_BASE, HttpError, fetchJson, withKey } from '../utils/apiClient.js'
import { serveFixture } from '../fixtures/index.js'

/* ------------------------------------------------------------------ *
 * Upstream response cache — one Map, TTL per resource.
 * Keeps a page refresh from re-hitting OpenWeather for identical data
 * and protects the shared API key under bursts of traffic.
 * ------------------------------------------------------------------ */
const cache = new Map()

const TTL = {
  weather: 5 * 60 * 1000,
  forecast: 5 * 60 * 1000,
  air: 30 * 60 * 1000,
  geo: 60 * 60 * 1000,
}

async function cached(key, ttl, producer) {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.t < ttl) return hit.v
  const value = await producer()
  cache.set(key, { t: Date.now(), v: value })
  if (cache.size > 400) {
    const oldest = cache.keys().next().value
    cache.delete(oldest)
  }
  return value
}

export const clearCache = () => cache.clear()

const requireKey = () => {
  if (isFixtures()) return
  if (!hasApiKey()) {
    throw new HttpError(503, 'Weather API key is not configured on the server.', {
      code: 'config',
    })
  }
}

/** One entry point for upstream data: live OpenWeather or local fixtures. */
const getJson = (url) => (isFixtures() ? serveFixture(url) : fetchJson(url))

/* ------------------------------------------------------------------ *
 * Small science helpers (exported so they can be unit-tested)
 * ------------------------------------------------------------------ */
const RAD = Math.PI / 180
const r1 = (n) => Math.round(n * 10) / 10

/** Magnus formula — OpenWeather's current-conditions payload has no dew point. */
export function dewPoint(tempC, humidity) {
  const rh = Math.min(100, Math.max(1, humidity))
  const a = 17.27
  const b = 237.7
  const g = (a * tempC) / (b + tempC) + Math.log(rh / 100)
  return (b * g) / (a - g)
}

/** Solar elevation angle in degrees for a lat/lon at a given instant. */
export function solarElevation(lat, lon, dateMs) {
  const jd = dateMs / 86400000 + 2440587.5
  const n = jd - 2451545.0
  const meanLon = (280.46 + 0.9856474 * n) % 360
  const meanAnom = ((357.528 + 0.9856003 * n) % 360) * RAD
  const lambda = (meanLon + 1.915 * Math.sin(meanAnom) + 0.02 * Math.sin(2 * meanAnom)) * RAD
  const obliquity = (23.439 - 0.0000004 * n) * RAD
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(lambda))
  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(lambda),
    Math.cos(lambda),
  )
  const gmstHours = (18.697374558 + 24.06570982441908 * n) % 24
  const localSidereal = ((gmstHours + lon / 15) * 15) * RAD
  const hourAngle = localSidereal - rightAscension
  const latR = lat * RAD
  const elevation = Math.asin(
    Math.sin(latR) * Math.sin(declination) +
      Math.cos(latR) * Math.cos(declination) * Math.cos(hourAngle),
  )
  return elevation / RAD
}

/**
 * Clear-sky UV scaled by sun height and cloud cover.
 * Free-tier OpenWeather does not expose a UV field, so we model it and
 * label it "estimated" in the UI rather than pretending it is measured.
 */
export function estimateUvi({ lat, lon, dateMs = Date.now(), cloudCover = 0 }) {
  const elevation = solarElevation(lat, lon, dateMs)
  if (elevation <= 0) return 0
  const clearSky = 11 * Math.pow(Math.sin(elevation * RAD), 1.2)
  const cloudFactor = 1 - 0.75 * (Math.min(100, Math.max(0, cloudCover)) / 100)
  return Math.max(0, Math.min(11, r1(clearSky * cloudFactor)))
}

const kmh = (metresPerSecond) => r1((metresPerSecond ?? 0) * 3.6)

const conditionOf = (entry) => ({
  id: entry.weather[0].id,
  main: entry.weather[0].main,
  description: entry.weather[0].description,
  icon: entry.weather[0].icon,
})

/* ------------------------------------------------------------------ *
 * Payload shaping — React only ever sees this shape
 * ------------------------------------------------------------------ */
export function toWeatherPayload(raw) {
  const { sys, main, wind, clouds, coord } = raw
  const dt = raw.dt ?? Math.floor(Date.now() / 1000)

  return {
    city: {
      name: raw.name,
      country: sys?.country ?? '--',
      lat: coord.lat,
      lon: coord.lon,
      timezoneOffset: raw.timezone ?? 0,
    },
    epoch: dt,
    condition: conditionOf(raw),
    current: {
      temp: r1(main.temp),
      feelsLike: r1(main.feels_like),
      humidity: main.humidity,
      pressure: main.pressure,
      visibility: Math.round((raw.visibility ?? 10000) / 100) / 10,
      windSpeed: kmh(wind?.speed),
      windDeg: wind?.deg ?? 0,
      windGust: wind?.gust ? kmh(wind.gust) : null,
      clouds: clouds?.all ?? 0,
      dewPoint: r1(dewPoint(main.temp, main.humidity)),
      uvi: estimateUvi({
        lat: coord.lat,
        lon: coord.lon,
        dateMs: dt * 1000,
        cloudCover: clouds?.all ?? 0,
      }),
    },
    temps: {
      min: r1(main.temp_min ?? main.temp),
      max: r1(main.temp_max ?? main.temp),
    },
    sun: { sunrise: sys?.sunrise ?? dt, sunset: sys?.sunset ?? dt },
    isDay: Boolean(sys) && dt >= sys.sunrise && dt < sys.sunset,
  }
}

export function toForecastPayload(raw) {
  const offset = raw.city?.timezone ?? 0

  const hourly = raw.list.slice(0, 24).map((entry) => ({
    time: entry.dt,
    temp: r1(entry.main.temp),
    feelsLike: r1(entry.main.feels_like),
    pop: r1(entry.pop ?? 0),
    windSpeed: kmh(entry.wind?.speed),
    condition: conditionOf(entry),
  }))

  const buckets = new Map()
  raw.list.forEach((entry) => {
    const localDate = new Date((entry.dt + offset) * 1000).toISOString().slice(0, 10)
    const bucket = buckets.get(localDate)
    if (bucket) bucket.push(entry)
    else buckets.set(localDate, [entry])
  })

  const daily = [...buckets.entries()].map(([date, entries]) => {
    const temps = entries.map((entry) => entry.main.temp)
    const midday = entries.reduce((closest, entry) => {
      const hour = Math.floor((((entry.dt + offset) % 86400) + 86400) % 86400 / 3600)
      const closestHour = Math.floor((((closest.dt + offset) % 86400) + 86400) % 86400 / 3600)
      return Math.abs(hour - 12) < Math.abs(closestHour - 12) ? entry : closest
    }, entries[0])

    return {
      date,
      dayName: new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', {
        weekday: 'short',
        timeZone: 'UTC',
      }),
      tempMin: r1(Math.min(...temps)),
      tempMax: r1(Math.max(...temps)),
      pop: r1(Math.max(...entries.map((entry) => entry.pop ?? 0))),
      condition: conditionOf(midday),
    }
  })

  return {
    city: {
      name: raw.city.name,
      country: raw.city.country,
      lat: raw.city.coord.lat,
      lon: raw.city.coord.lon,
      timezoneOffset: offset,
    },
    hourly,
    daily,
  }
}

/* ------------------------------------------------------------------ *
 * Public service API
 * ------------------------------------------------------------------ */
const currentUrl = ({ city, lat, lon }) =>
  withKey(
    city
      ? `${OPENWEATHER_BASE}/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric`
      : `${OPENWEATHER_BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric`,
  )

const forecastUrl = ({ city, lat, lon }) =>
  withKey(
    city
      ? `${OPENWEATHER_BASE}/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric`
      : `${OPENWEATHER_BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric`,
  )

export async function getCurrentByCity(city) {
  requireKey()
  const raw = await cached(
    `w:city:${city.toLowerCase()}`,
    TTL.weather,
    () => getJson(currentUrl({ city })),
  )
  return toWeatherPayload(raw)
}

export async function getCurrentByCoords(lat, lon) {
  requireKey()
  const raw = await cached(
    `w:coords:${lat}:${lon}`,
    TTL.weather,
    () => getJson(currentUrl({ lat, lon })),
  )
  return toWeatherPayload(raw)
}

export async function getForecastByCity(city) {
  requireKey()
  const raw = await cached(
    `f:city:${city.toLowerCase()}`,
    TTL.forecast,
    () => getJson(forecastUrl({ city })),
  )
  return toForecastPayload(raw)
}

export async function getForecastByCoords(lat, lon) {
  requireKey()
  const raw = await cached(
    `f:coords:${lat}:${lon}`,
    TTL.forecast,
    () => getJson(forecastUrl({ lat, lon })),
  )
  return toForecastPayload(raw)
}

export async function getAirQuality(lat, lon) {
  requireKey()
  const raw = await cached(
    `a:${lat}:${lon}`,
    TTL.air,
    () =>
      getJson(
        withKey(`${OPENWEATHER_BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}`),
      ),
  )

  const entry = raw.list?.[0]
  if (!entry) {
    throw new HttpError(502, 'Air quality data is unavailable for that location.', {
      code: 'upstream',
    })
  }

  /* cloud cover makes the UV estimate realistic; best effort only */
  let cloudCover = 0
  try {
    const weather = await getCurrentByCoords(lat, lon)
    cloudCover = weather.current.clouds
  } catch {
    cloudCover = 0
  }

  const c = entry.components ?? {}
  return {
    aqi: entry.main?.aqi ?? 1,
    pollutants: {
      pm2_5: r1(c.pm2_5 ?? 0),
      pm10: r1(c.pm10 ?? 0),
      o3: r1(c.o3 ?? 0),
      no2: r1(c.no2 ?? 0),
      so2: r1(c.so2 ?? 0),
      co: r1(c.co ?? 0),
    },
    uvi: estimateUvi({ lat, lon, dateMs: Date.now(), cloudCover }),
  }
}

export async function getSuggestions(query) {
  requireKey()
  const raw = await cached(
    `geo:${query.toLowerCase()}`,
    TTL.geo,
    () =>
      getJson(
        withKey(
          `${OPENWEATHER_BASE}/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=6`,
        ),
      ),
  )

  if (!Array.isArray(raw)) return []
  return raw.map((place) => ({
    name: place.name,
    country: place.country ?? '--',
    state: place.state ?? '',
    lat: place.lat,
    lon: place.lon,
  }))
}

/** Server-side fan-out: N cities, one HTTP request from the browser. */
export async function getComparison(cities) {
  return Promise.all(cities.map((city) => getCurrentByCity(city)))
}
