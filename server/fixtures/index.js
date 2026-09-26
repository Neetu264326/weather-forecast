/**
 * Fixtures upstream — serves OpenWeather-shaped payloads locally so the
 * entire pipeline (validation → service → transforms → cache → React) runs
 * without an API key.  Activated with UPSTREAM_MODE=fixtures in .env.
 *
 * Flip to UPSTREAM_MODE=live (or set OPENWEATHER_API_KEY) to hit the real
 * OpenWeather API — nothing else in the app changes.
 */
import { HttpError } from '../utils/apiClient.js'

const HOUR = 3600
const r1 = (n) => Math.round(n * 10) / 10

const CLEAR = { id: 800, main: 'Clear', description: 'clear sky', icon: '01' }
const FEW = { id: 801, main: 'Clouds', description: 'few clouds', icon: '02' }
const SCATTERED = { id: 802, main: 'Clouds', description: 'scattered clouds', icon: '03' }
const OVERCAST = { id: 804, main: 'Clouds', description: 'overcast clouds', icon: '04' }
const LIGHT_RAIN = { id: 500, main: 'Rain', description: 'light rain', icon: '10' }
const MODERATE_RAIN = { id: 501, main: 'Rain', description: 'moderate rain', icon: '10' }
const MIST = { id: 701, main: 'Mist', description: 'mist', icon: '50' }

/** City registry: climate numbers approximate seasonal normals. */
const CITIES = [
  { name: 'New Delhi', country: 'IN', lat: 28.61, lon: 77.21, tz: 19800,
    aliases: ['delhi', 'new delhi'], temp: [24, 34], humidity: 45, wind: 12, deg: 290,
    cond: CLEAR, alt: FEW, pop: 0.1, aqi: 4, pm25: 62, pm10: 118 },
  { name: 'Mumbai', country: 'IN', lat: 19.08, lon: 72.88, tz: 19800,
    aliases: ['mumbai', 'bombay'], temp: [26, 31], humidity: 78, wind: 18, deg: 250,
    cond: MODERATE_RAIN, alt: OVERCAST, pop: 0.7, aqi: 3, pm25: 38, pm10: 71 },
  { name: 'Bengaluru', country: 'IN', lat: 12.97, lon: 77.59, tz: 19800,
    aliases: ['bengaluru', 'bangalore'], temp: [19, 27], humidity: 62, wind: 14, deg: 120,
    cond: FEW, alt: LIGHT_RAIN, pop: 0.3, aqi: 2, pm25: 24, pm10: 46 },
  { name: 'London', country: 'GB', lat: 51.51, lon: -0.13, tz: 0,
    aliases: ['london'], temp: [10, 17], humidity: 74, wind: 22, deg: 230,
    cond: LIGHT_RAIN, alt: OVERCAST, pop: 0.6, aqi: 2, pm25: 12, pm10: 22 },
  { name: 'New York', country: 'US', lat: 40.71, lon: -74.01, tz: -18000,
    aliases: ['new york', 'nyc', 'new york city'], temp: [15, 23], humidity: 58, wind: 16, deg: 300,
    cond: SCATTERED, alt: LIGHT_RAIN, pop: 0.3, aqi: 2, pm25: 9, pm10: 18 },
  { name: 'Tokyo', country: 'JP', lat: 35.68, lon: 139.69, tz: 32400,
    aliases: ['tokyo'], temp: [20, 27], humidity: 70, wind: 11, deg: 180,
    cond: OVERCAST, alt: LIGHT_RAIN, pop: 0.4, aqi: 2, pm25: 14, pm10: 26 },
  { name: 'Sydney', country: 'AU', lat: -33.87, lon: 151.21, tz: 36000,
    aliases: ['sydney'], temp: [14, 21], humidity: 65, wind: 20, deg: 60,
    cond: FEW, alt: SCATTERED, pop: 0.2, aqi: 1, pm25: 7, pm10: 15 },
  { name: 'Paris', country: 'FR', lat: 48.86, lon: 2.35, tz: 7200,
    aliases: ['paris'], temp: [11, 19], humidity: 71, wind: 15, deg: 210,
    cond: SCATTERED, alt: LIGHT_RAIN, pop: 0.4, aqi: 2, pm25: 15, pm10: 27 },
  { name: 'Dubai', country: 'AE', lat: 25.2, lon: 55.27, tz: 14400,
    aliases: ['dubai'], temp: [29, 38], humidity: 52, wind: 13, deg: 310,
    cond: CLEAR, alt: MIST, pop: 0.0, aqi: 4, pm25: 55, pm10: 96 },
  { name: 'Berlin', country: 'DE', lat: 52.52, lon: 13.41, tz: 7200,
    aliases: ['berlin'], temp: [9, 17], humidity: 68, wind: 17, deg: 250,
    cond: OVERCAST, alt: LIGHT_RAIN, pop: 0.5, aqi: 1, pm25: 10, pm10: 19 },
]

const CLOUD_BY_ID = { 800: 5, 801: 20, 802: 50, 804: 88, 500: 85, 501: 92, 701: 90 }

const roundTo3h = (now) => Math.ceil(now / 10800) * 10800
const localHour = (dt, tz) => Math.floor((((dt + tz) % 86400) + 86400) % 86400 / HOUR)

const sunTimes = (city, now) => {
  const dayStart = Math.floor(now / 86400) * 86400
  return {
    sunrise: dayStart + 6 * HOUR + 15 * 60 - city.tz,
    sunset: dayStart + 18 * HOUR + 45 * 60 - city.tz,
  }
}

const dayFactor = (hour) => (hour >= 6 && hour <= 18 ? Math.sin(((hour - 6) / 12) * Math.PI) : 0)
const icon = (base, isDay) => `${base}${isDay ? 'd' : 'n'}`

const matchCity = (query) => {
  const q = String(query).toLowerCase().trim()
  if (!q) return undefined
  return (
    CITIES.find(
      (c) => c.aliases.includes(q) || c.name.toLowerCase() === q || c.name.toLowerCase().includes(q),
    ) ?? synthCity(q)
  )
}

const nearestCity = (lat, lon) =>
  CITIES.reduce((best, c) => {
    const d = (c.lat - lat) ** 2 + (c.lon - lon) ** 2
    return !best || d < best.d ? { city: c, d } : best
  }, null)?.city

const requireCity = (city) => {
  if (!city) {
    throw new HttpError(404, "We couldn't find that city. Check the spelling and try again.", {
      code: 'notfound',
    })
  }
  return city
}

const CONDS = [CLEAR, FEW, SCATTERED, OVERCAST, LIGHT_RAIN, MODERATE_RAIN, MIST]

const hash = (str) => {
  let h = 5381
  for (let i = 0; i < str.length; i += 1) h = ((h << 5) + h + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

const titleCase = (str) =>
  str
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

const aqiFor = (pm25) => (pm25 > 55 ? 4 : pm25 > 35 ? 3 : pm25 > 20 ? 2 : 1)

/**
 * Demo city for any query the registry does not know: deterministic weather
 * derived from a hash of the name, so the same search always answers the same.
 */
const synthCity = (query) => {
  const name = titleCase(String(query).trim())
  const h = hash(name.toLowerCase())
  const tMin = 6 + (h % 22)
  const pm25 = 8 + ((h >>> 13) % 60)
  return {
    name,
    country: '',
    lat: Math.round((((h % 13000) / 100) - 60) * 10) / 10,
    lon: Math.round(((((h >>> 7) % 36000) / 100) - 180) * 10) / 10,
    tz: (((h >>> 4) % 27) - 12) * HOUR,
    temp: [tMin, tMin + 6 + ((h >>> 3) % 8)],
    humidity: 35 + ((h >>> 9) % 50),
    wind: 6 + ((h >>> 11) % 20),
    deg: (h >>> 17) % 360,
    cond: CONDS[(h >>> 19) % CONDS.length],
    alt: CONDS[(h >>> 21) % CONDS.length],
    pop: ((h >>> 23) % 6) / 10,
    aqi: aqiFor(pm25),
    pm25,
    pm10: Math.round(pm25 * 1.7),
  }
}

const synthAir = (lat, lon) => {
  const h = hash(`${lat.toFixed(2)},${lon.toFixed(2)}`)
  const pm25 = 8 + ((h >>> 5) % 60)
  return { lat, lon, aqi: aqiFor(pm25), pm25, pm10: Math.round(pm25 * 1.7) }
}

function buildWeather(city, now) {
  const { sunrise, sunset } = sunTimes(city, now)
  const isDay = now >= sunrise && now < sunset
  const h = localHour(now, city.tz)
  const [tMin, tMax] = city.temp
  const temp = r1(tMin + (tMax - tMin) * (0.3 + 0.7 * dayFactor(h)))
  const isRain = city.cond.icon === '10'

  return {
    coord: { lon: city.lon, lat: city.lat },
    weather: [
      {
        id: city.cond.id,
        main: city.cond.main,
        description: city.cond.description,
        icon: icon(city.cond.icon, isDay),
      },
    ],
    base: 'fixtures',
    main: {
      temp,
      feels_like: r1(temp + (city.humidity > 70 ? 2.5 : 1)),
      temp_min: tMin,
      temp_max: tMax,
      pressure: 1013,
      humidity: city.humidity,
    },
    visibility: isRain ? 6000 : 10000,
    wind: { speed: r1(city.wind / 3.6), deg: city.deg, gust: r1((city.wind * 1.4) / 3.6) },
    clouds: { all: CLOUD_BY_ID[city.cond.id] ?? 40 },
    dt: now,
    sys: {
      type: 1,
      id: 9000,
      country: city.country,
      sunrise,
      sunset,
    },
    timezone: city.tz,
    name: city.name,
    cod: 200,
  }
}

function buildForecast(city, now) {
  const { sunrise, sunset } = sunTimes(city, now)
  const start = roundTo3h(now)
  const [tMin, tMax] = city.temp

  const list = Array.from({ length: 40 }, (_, i) => {
    const dt = start + i * 10800
    const h = localHour(dt, city.tz)
    const useAlt = i % 7 === 3
    const cond = useAlt ? city.alt : city.cond
    const isDay = dt >= sunrise && dt < sunset
    const temp = r1(tMin + (tMax - tMin) * (0.25 + 0.75 * dayFactor(h)))

    return {
      dt,
      main: {
        temp,
        feels_like: r1(temp + 1.2),
        temp_min: r1(temp - 1.5),
        temp_max: r1(temp + 1.5),
        pressure: 1013,
        humidity: Math.min(95, city.humidity + (cond.icon === '10' ? 10 : 0)),
      },
      weather: [
        {
          id: cond.id,
          main: cond.main,
          description: cond.description,
          icon: icon(cond.icon, isDay),
        },
      ],
      clouds: { all: CLOUD_BY_ID[cond.id] ?? 40 },
      visibility: 10000,
      wind: { speed: r1(city.wind / 3.6), deg: city.deg },
      pop: r1(Math.min(0.95, city.pop + (cond.icon === '10' ? 0.25 : 0))),
      dt_txt: new Date(dt * 1000).toISOString().replace('T', ' ').slice(0, 19),
    }
  })

  return {
    cod: '200',
    message: 0,
    cnt: list.length,
    list,
    city: {
      id: 0,
      name: city.name,
      coord: { lat: city.lat, lon: city.lon },
      country: city.country,
      population: 0,
      timezone: city.tz,
      sunrise,
      sunset,
    },
  }
}

function buildAir(city, now) {
  return {
    coord: { lon: city.lon, lat: city.lat },
    list: [
      {
        main: { aqi: city.aqi },
        components: {
          co: 230.5,
          no: 0.4,
          no2: r1(city.pm25 / 8),
          o3: r1(60 + city.aqi * 5),
          so2: r1(city.pm10 / 14),
          pm2_5: city.pm25,
          pm10: city.pm10,
          nh3: 1.2,
        },
        dt: now,
      },
    ],
  }
}

function buildGeo(query) {
  const q = String(query).toLowerCase().trim()
  const curated = CITIES.filter(
    (c) => c.aliases.some((a) => a.includes(q) || q.includes(a)) || c.name.toLowerCase().includes(q),
  )
    .slice(0, 6)
    .map((c) => ({ name: c.name, country: c.country, state: '', lat: c.lat, lon: c.lon }))
  if (curated.length > 0 || !q) return curated
  const s = synthCity(q)
  return [{ name: s.name, country: s.country, state: '', lat: s.lat, lon: s.lon }]
}

/** URL → fixture dispatch (mimics fetchJson for the same routes). */
export function serveFixture(rawUrl) {
  const url = new URL(rawUrl)
  const path = url.pathname
  const param = (key) => url.searchParams.get(key)
  const now = Math.floor(Date.now() / 1000)

  if (path.endsWith('/data/2.5/weather')) {
    const city = param('q') ? matchCity(param('q')) : nearestCity(+param('lat'), +param('lon'))
    return buildWeather(requireCity(city), now)
  }

  if (path.endsWith('/data/2.5/forecast')) {
    const city = param('q') ? matchCity(param('q')) : nearestCity(+param('lat'), +param('lon'))
    return buildForecast(requireCity(city), now)
  }

  if (path.endsWith('/data/2.5/air_pollution')) {
    const lat = +param('lat')
    const lon = +param('lon')
    const curated = CITIES.find((c) => Math.abs(c.lat - lat) <= 0.5 && Math.abs(c.lon - lon) <= 0.5)
    return buildAir(curated ?? synthAir(lat, lon), now)
  }

  if (path.endsWith('/geo/1.0/direct')) {
    return buildGeo(param('q') ?? '')
  }

  throw new HttpError(404, `No fixture for ${path}`, { code: 'not_found' })
}

export const FIXTURE_CITIES = CITIES.map((c) => c.name)
