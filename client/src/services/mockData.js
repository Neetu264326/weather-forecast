/*
  Local mock of the Express API so the UI can be built, demoed and
  screenshotted without a backend or an OpenWeather key.
  Enabled with VITE_USE_MOCK=true in client/.env
*/

const CITIES = [
  { name: 'New Delhi', country: 'IN', lat: 28.61, lon: 77.21, base: 31 },
  { name: 'Delhi', country: 'IN', lat: 28.65, lon: 77.23, base: 31 },
  { name: 'Mumbai', country: 'IN', lat: 19.08, lon: 72.88, base: 29 },
  { name: 'Bengaluru', country: 'IN', lat: 12.97, lon: 77.59, base: 24 },
  { name: 'Noida', country: 'IN', lat: 28.57, lon: 77.32, base: 30 },
  { name: 'Agra', country: 'IN', lat: 27.18, lon: 78.01, base: 32 },
  { name: 'Pune', country: 'IN', lat: 18.52, lon: 73.86, base: 26 },
  { name: 'Kolkata', country: 'IN', lat: 22.57, lon: 88.36, base: 30 },
  { name: 'Chennai', country: 'IN', lat: 13.08, lon: 80.27, base: 33 },
  { name: 'Hyderabad', country: 'IN', lat: 17.39, lon: 78.49, base: 28 },
  { name: 'London', country: 'GB', lat: 51.51, lon: -0.13, base: 15 },
  { name: 'New York', country: 'US', lat: 40.71, lon: -74.01, base: 19 },
  { name: 'Tokyo', country: 'JP', lat: 35.68, lon: 139.69, base: 21 },
  { name: 'Paris', country: 'FR', lat: 48.86, lon: 2.35, base: 17 },
  { name: 'Dubai', country: 'AE', lat: 25.2, lon: 55.27, base: 36 },
  { name: 'Sydney', country: 'AU', lat: -33.87, lon: 151.21, base: 20 },
]

const CONDITION_POOL = [
  { id: 800, main: 'Clear' },
  { id: 801, main: 'Clouds' },
  { id: 802, main: 'Clouds' },
  { id: 803, main: 'Clouds' },
  { id: 804, main: 'Clouds' },
  { id: 500, main: 'Rain' },
  { id: 501, main: 'Rain' },
  { id: 200, main: 'Thunderstorm' },
  { id: 600, main: 'Snow' },
  { id: 741, main: 'Fog' },
]

const hash = (str = '') => {
  let h = 5381
  for (let i = 0; i < str.length; i += 1) h = ((h << 5) + h + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

const pick = (seed, arr) => arr[seed % arr.length]
const round1 = (n) => Math.round(n * 10) / 10
const delay = (ms) => new Promise((r) => setTimeout(r, ms))

const findCity = (query = '') => {
  const q = query.trim().toLowerCase()
  const hit = CITIES.find((c) => c.name.toLowerCase() === q)
  if (hit) return hit
  const partial = CITIES.find((c) => c.name.toLowerCase().includes(q) && q.length > 2)
  if (partial) return partial
  const seed = hash(q || 'unknown')
  return {
    name: query.trim() || 'Unknown',
    country: '--',
    lat: (seed % 140) - 60,
    lon: ((seed >> 3) % 340) - 170,
    base: 8 + (seed % 26),
  }
}

const iconFor = (id, hour) => {
  const night = hour < 6 || hour >= 19
  if (id >= 200 && id < 300) return night ? '11n' : '11d'
  if (id >= 300 && id < 400) return night ? '09n' : '09d'
  if (id >= 500 && id < 600) return night ? '10n' : '10d'
  if (id >= 600 && id < 700) return '13d'
  if (id >= 700 && id < 800) return night ? '50n' : '50d'
  if (id === 800) return night ? '01n' : '01d'
  if (id === 801) return night ? '02n' : '02d'
  return night ? '04n' : '04d'
}

const descriptions = {
  800: 'clear sky',
  801: 'few clouds',
  802: 'scattered clouds',
  803: 'broken clouds',
  804: 'overcast clouds',
  500: 'light rain',
  501: 'moderate rain',
  200: 'thunderstorm',
  600: 'light snow',
  741: 'fog',
}

function resolve(query) {
  const city = findCity(query)
  const seed = hash(city.name.toLowerCase())
  const now = Math.floor(Date.now() / 1000)
  const offset = Math.round(city.lon / 15) * 3600
  const localHour = Math.floor((((now + offset) % 86400) + 86400) % 86400 / 3600)

  const cond = pick(seed, CONDITION_POOL)
  const localDayStart = Math.floor((now + offset) / 86400) * 86400 - offset
  const sunrise = localDayStart + 6 * 3600 + (seed % 50) * 60
  const sunset = localDayStart + 18 * 3600 - (seed % 45) * 60
  const isDay = now >= sunrise && now <= sunset

  const temp = city.base + Math.round(Math.sin(((localHour - 4) / 24) * Math.PI * 2) * 4)
  const humidity = 40 + (seed % 45)
  const windSpeed = round1(4 + (seed % 18))

  return {
    city,
    seed,
    now,
    offset,
    localHour,
    cond,
    sunrise,
    sunset,
    isDay,
    temp,
    humidity,
    windSpeed,
  }
}

function buildWeather(query) {
  const r = resolve(query)
  const { city, seed, now, cond, sunrise, sunset, isDay, temp, humidity, windSpeed } = r

  return {
    city: {
      name: city.name,
      country: city.country,
      lat: city.lat,
      lon: city.lon,
      timezoneOffset: r.offset,
    },
    epoch: now,
    condition: {
      id: cond.id,
      main: cond.main,
      description: descriptions[cond.id] ?? cond.main.toLowerCase(),
      icon: iconFor(cond.id, r.localHour),
    },
    current: {
      temp,
      feelsLike: temp + ((seed % 7) - 3),
      humidity,
      pressure: 1004 + (seed % 20),
      visibility: 6 + (seed % 8),
      windSpeed,
      windDeg: (seed * 37) % 360,
      windGust: round1(windSpeed * 1.5),
      clouds: (seed % 5) * 20 + 8,
      dewPoint: round1(temp - (100 - humidity) / 5),
      uvi: isDay ? round1(((seed % 90) / 100) * 9) : 0,
    },
    temps: { min: temp - 4, max: temp + 3 },
    sun: { sunrise, sunset },
    isDay,
  }
}

function buildForecast(query) {
  const r = resolve(query)
  const { city, seed, now, offset } = r

  const start = Math.ceil(now / 10800) * 10800
  const hourly = []
  for (let i = 0; i < 40; i += 1) {
    const time = start + i * 10800
    const hour = Math.floor((((time + offset) % 86400) + 86400) % 86400 / 3600)
    const wave = Math.sin(((hour - 4) / 24) * Math.PI * 2)
    const drift = Math.sin((i + seed) / 7) * 2
    const temp = round1(r.temp + wave * 5 + drift - 2)
    const cond = i % 7 === 0 ? CONDITION_POOL[(seed + 3) % CONDITION_POOL.length] : r.cond
    const pop = Math.min(0.95, Math.max(0, ((Math.sin((i + seed) / 5) + 1) / 2) * (cond.id < 600 ? 0.9 : 0.35)))

    hourly.push({
      time,
      temp,
      feelsLike: round1(temp + ((seed % 5) - 2)),
      pop: round1(pop),
      windSpeed: r.windSpeed + (i % 5),
      condition: {
        id: cond.id,
        main: cond.main,
        description: descriptions[cond.id] ?? cond.main.toLowerCase(),
        icon: iconFor(cond.id, hour),
      },
    })
  }

  const buckets = new Map()
  hourly.forEach((h) => {
    const day = Math.floor((h.time + offset) / 86400)
    const list = buckets.get(day) ?? []
    list.push(h)
    buckets.set(day, list)
  })

  const daily = [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(0, 7)
    .map(([day, list]) => {
      const temps = list.map((h) => h.temp)
      const midday = list[Math.floor(list.length / 2)]
      const dayEpoch = day * 86400 - offset + 43200
      return {
        date: new Date((day * 86400 - offset) * 1000).toISOString().slice(0, 10),
        epoch: dayEpoch,
        dayName: new Date(dayEpoch * 1000).toLocaleDateString('en-GB', {
          weekday: 'short',
          timeZone: 'UTC',
        }),
        tempMin: Math.min(...temps),
        tempMax: Math.max(...temps),
        pop: round1(Math.max(...list.map((h) => h.pop))),
        condition: midday.condition,
      }
    })

  return {
    city: {
      name: city.name,
      country: city.country,
      lat: city.lat,
      lon: city.lon,
      timezoneOffset: offset,
    },
    hourly,
    daily,
  }
}

function buildAir(query) {
  const r = resolve(query)
  const aqi = (r.seed % 5) + 1
  return {
    aqi,
    pollutants: {
      pm2_5: round1(4 + (r.seed % 40)),
      pm10: round1(8 + (r.seed % 60)),
      o3: round1(20 + (r.seed % 60)),
      no2: round1(5 + (r.seed % 30)),
      so2: round1(1 + (r.seed % 12)),
      co: round1(0.2 + (r.seed % 15) / 10),
    },
    uvi: r.current?.uvi ?? (r.isDay ? round1(((r.seed % 90) / 100) * 9) : 0),
  }
}

function buildGeo(q = '') {
  const query = q.trim().toLowerCase()
  const hits = CITIES.filter((c) => c.name.toLowerCase().includes(query))
  const list = hits.length
    ? hits
    : [{ name: q.trim(), country: '--', lat: 0, lon: 0 }]
  return list.map((c) => ({
    name: c.name,
    country: c.country,
    state: '',
    lat: c.lat,
    lon: c.lon,
  }))
}

export async function mockRoute(path, params = {}) {
  await delay(280 + Math.random() * 260)

  if (path === '/api/health') return { ok: true, uptime: process?.uptime?.() ?? 0 }

  if (path === '/api/weather') {
    const q = String(params.city || '').trim()
    if (q.length < 2) {
      const err = new Error('Please enter a valid city name.')
      err.type = 'validation'
      throw err
    }
    return buildWeather(q)
  }

  if (path === '/api/weather/coordinates') {
    const nearest = CITIES.reduce(
      (best, c) =>
        Math.hypot(c.lat - params.lat, c.lon - params.lon) <
        Math.hypot(best.lat - params.lat, best.lon - params.lon)
          ? c
          : best,
      CITIES[0],
    )
    return buildWeather(nearest.name)
  }

  if (path === '/api/forecast') return buildForecast(String(params.city || 'New Delhi'))
  if (path === '/api/forecast/coordinates') {
    const w = await mockRoute('/api/weather/coordinates', params)
    return buildForecast(w.city.name)
  }

  if (path === '/api/air-quality') {
    const w = await mockRoute('/api/weather/coordinates', params)
    return buildAir(w.city.name)
  }

  if (path === '/api/geo') return buildGeo(params.q)

  if (path === '/api/compare') {
    const cities = String(params.cities || '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
      .slice(0, 4)
    return Promise.all(
      cities.map(async (name) => {
        const weather = await mockRoute('/api/weather', { city: name })
        return weather
      }),
    )
  }

  throw new Error('Unknown mock endpoint')
}
