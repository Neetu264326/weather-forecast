/**
 * End-to-end smoke test against a running server:  npm run smoke
 * Validates every endpoint and its response shape.
 *   local:   npm run smoke
 *   deployed: SMOKE_BASE=https://weatheriq-api.onrender.com npm run smoke
 * In live mode (UPSTREAM_MODE=live) the server needs OPENWEATHER_API_KEY.
 */
import assert from 'node:assert/strict'

const port = process.env.PORT || 5000
const base = process.env.SMOKE_BASE || `http://localhost:${port}`

const results = []
async function check(name, fn) {
  try {
    await fn()
    results.push(`  ok   ${name}`)
  } catch (err) {
    results.push(`  FAIL ${name}\n       ${err.message}`)
    process.exitCode = 1
  }
}

const get = async (path) => {
  const res = await fetch(`${base}${path}`)
  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

const hasKeys = (obj, keys, label) => {
  for (const key of keys) {
    const path = key.split('.')
    let cur = obj
    for (const seg of path) cur = cur?.[seg]
    assert.notEqual(cur, undefined, `${label} missing "${key}"`)
  }
}

console.log('\nserver smoke test (upstream: live OpenWeather or fixtures)')

const health0 = await get('/api/health').catch(() => null)
const mode = health0?.body?.data?.upstream
if (mode === 'live' && health0?.body?.data?.apiKey !== 'configured') {
  console.log('  SKIP  OPENWEATHER_API_KEY is not set and UPSTREAM_MODE is live\n')
  process.exit(0)
}
if (mode === 'fixtures') console.log('  mode: fixtures (local OpenWeather-shaped data)')
else console.log('  mode: live (real OpenWeather key)')

await check('health reports an upstream mode', async () => {
  const { status, body } = await get('/api/health')
  assert.equal(status, 200)
  assert.ok(['live', 'fixtures'].includes(body.data.upstream), `mode ${body.data.upstream}`)
  if (body.data.upstream === 'live') assert.equal(body.data.apiKey, 'configured')
})

let lat
let lon

await check('current weather by city', async () => {
  const { status, body } = await get('/api/weather?city=Delhi')
  assert.equal(status, 200, `HTTP ${status}: ${body?.message}`)
  assert.equal(body.success, true)
  hasKeys(body.data, [
    'city.name',
    'city.country',
    'city.lat',
    'city.lon',
    'city.timezoneOffset',
    'condition.icon',
    'condition.description',
    'current.temp',
    'current.feelsLike',
    'current.humidity',
    'current.windSpeed',
    'current.visibility',
    'current.dewPoint',
    'current.uvi',
    'temps.min',
    'temps.max',
    'sun.sunrise',
    'sun.sunset',
  ], 'weather payload')
  assert.equal(typeof body.data.isDay, 'boolean')
  lat = body.data.city.lat
  lon = body.data.city.lon
})

await check('current weather by coordinates', async () => {
  const { status, body } = await get(`/api/weather/coordinates?lat=${lat}&lon=${lon}`)
  assert.equal(status, 200, `HTTP ${status}: ${body?.message}`)
  assert.match(String(body.data.city.name), /Delhi/i)
})

await check('forecast by city (hourly + daily)', async () => {
  const { status, body } = await get('/api/forecast?city=Delhi')
  assert.equal(status, 200, `HTTP ${status}: ${body?.message}`)
  assert.equal(body.data.hourly.length, 24)
  assert.ok(body.data.daily.length >= 5 && body.data.daily.length <= 7)
  hasKeys(body.data.daily[0], ['date', 'dayName', 'tempMin', 'tempMax', 'pop', 'condition.icon'], 'daily[0]')
  hasKeys(body.data.hourly[0], ['time', 'temp', 'pop', 'condition.icon'], 'hourly[0]')
})

await check('forecast by coordinates', async () => {
  const { status, body } = await get(`/api/forecast/coordinates?lat=${lat}&lon=${lon}`)
  assert.equal(status, 200, `HTTP ${status}: ${body?.message}`)
  assert.ok(body.data.hourly.length > 0)
})

await check('air quality (aqi + pollutants + estimated uv)', async () => {
  const { status, body } = await get(`/api/air-quality?lat=${lat}&lon=${lon}`)
  assert.equal(status, 200, `HTTP ${status}: ${body?.message}`)
  assert.ok(body.data.aqi >= 1 && body.data.aqi <= 5, `aqi ${body.data.aqi}`)
  assert.ok(body.data.pollutants.pm2_5 >= 0)
  assert.ok(body.data.uvi >= 0 && body.data.uvi <= 11)
})

await check('geocoding suggestions', async () => {
  const { status, body } = await get('/api/geo?q=Berlin')
  assert.equal(status, 200, `HTTP ${status}: ${body?.message}`)
  assert.ok(Array.isArray(body.data) && body.data.length > 0, 'empty suggestions')
  hasKeys(body.data[0], ['name', 'country', 'lat', 'lon'], 'suggestion[0]')
})

await check('comparison fan-out (3 cities)', async () => {
  const { status, body } = await get('/api/compare?cities=Delhi,Mumbai,Bengaluru')
  assert.equal(status, 200, `HTTP ${status}: ${body?.message}`)
  assert.equal(body.data.length, 3)
  const names = body.data.map((row) => String(row.city.name))
  assert.equal(names.length, 3)
  assert.match(names[0], /Delhi/i, `names[0]=${names[0]}`)
  assert.match(names[1], /Mumbai/i, `names[1]=${names[1]}`)
  assert.match(names[2], /Bengaluru|Bangalore/i, `names[2]=${names[2]}`)
})

await check('unknown city → demo city (fixtures) / 404 notfound (live)', async () => {
  const { status, body } = await get('/api/weather?city=Zzzzznotacity')
  if (mode === 'fixtures') {
    assert.equal(status, 200, `HTTP ${status}`)
    assert.equal(body.data.city.name, 'Zzzzznotacity')
  } else {
    assert.equal(status, 404, `HTTP ${status}`)
    assert.equal(body.code, 'notfound')
  }
})

await check('invalid latitude → 400 validation', async () => {
  const { status, body } = await get('/api/weather/coordinates?lat=999&lon=0')
  assert.equal(status, 400)
  assert.equal(body.code, 'validation')
})

await check('responses are cache-hits on repeat (fast)', async () => {
  const start = Date.now()
  await get('/api/weather?city=Delhi')
  const elapsed = Date.now() - start
  assert.ok(elapsed < 500, `repeat call took ${elapsed}ms (cache miss?)`)
})

console.log(results.join('\n'))
console.log(process.exitCode ? '\nFAILED\n' : '\nall smoke tests passed\n')
