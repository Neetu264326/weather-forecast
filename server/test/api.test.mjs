/**
 * Integration tests: the real Express app (fixtures upstream) on an ephemeral
 * port — happy paths, validation, error envelope, CORS.
 */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'

process.env.NODE_ENV = 'test'
process.env.UPSTREAM_MODE = 'fixtures'
process.env.RATE_LIMIT_MAX = '1000'
process.env.CLIENT_URL = 'http://allowed.test'

const { default: app } = await import('../server.js')

let server
let base

const get = async (path, headers = {}) => {
  const res = await fetch(`${base}${path}`, { headers })
  const body = await res.json().catch(() => null)
  return { status: res.status, headers: res.headers, body }
}

before(async () => {
  server = app.listen(0)
  await new Promise((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })
  base = `http://127.0.0.1:${server.address().port}`
})

after(() => new Promise((resolve) => server.close(resolve)))

test('health reports status and upstream mode', async () => {
  const { status, body } = await get('/api/health')
  assert.equal(status, 200)
  assert.equal(body.success, true)
  assert.equal(body.data.status, 'ok')
  assert.equal(body.data.upstream, 'fixtures')
})

test('current weather by city satisfies the frontend contract', async () => {
  const { status, body } = await get('/api/weather?city=Delhi')
  assert.equal(status, 200)
  assert.equal(body.success, true)
  const { city, condition, current, temps, sun, isDay } = body.data
  assert.equal(city.name, 'New Delhi')
  assert.equal(city.country, 'IN')
  assert.match(condition.icon, /^\d{2}[dn]$/)
  assert.equal(typeof current.temp, 'number')
  assert.equal(typeof current.windSpeed, 'number')
  assert.equal(typeof current.dewPoint, 'number')
  assert.ok(temps.min <= temps.max)
  assert.ok(sun.sunrise < sun.sunset)
  assert.equal(typeof isDay, 'boolean')
})

test('current weather by coordinates', async () => {
  const { status, body } = await get('/api/weather/coordinates?lat=28.61&lon=77.21')
  assert.equal(status, 200)
  assert.equal(body.data.city.name, 'New Delhi')
})

test('forecast returns 24 hourly slots and 5–7 daily rows', async () => {
  const { status, body } = await get('/api/forecast?city=Mumbai')
  assert.equal(status, 200)
  assert.equal(body.data.hourly.length, 24)
  assert.ok(body.data.daily.length >= 5 && body.data.daily.length <= 7)
  assert.equal(body.data.city.name, 'Mumbai')
  assert.ok(typeof body.data.daily[0].tempMin === 'number')
  assert.ok(body.data.daily[0].pop >= 0 && body.data.daily[0].pop <= 1)
})

test('forecast by coordinates', async () => {
  const { status, body } = await get('/api/forecast/coordinates?lat=19.08&lon=72.88')
  assert.equal(status, 200)
  assert.ok(body.data.hourly.length > 0)
})

test('air quality returns aqi, pollutants and an estimated uv', async () => {
  const { status, body } = await get('/api/air-quality?lat=19.08&lon=72.88')
  assert.equal(status, 200)
  assert.ok(body.data.aqi >= 1 && body.data.aqi <= 5)
  assert.ok(body.data.pollutants.pm2_5 > 0)
  assert.ok(body.data.uvi >= 0 && body.data.uvi <= 11)
})

test('geocoding suggestions', async () => {
  const { status, body } = await get('/api/geo?q=Berlin')
  assert.equal(status, 200)
  assert.ok(Array.isArray(body.data) && body.data.length > 0)
  assert.equal(body.data[0].name, 'Berlin')
  assert.equal(typeof body.data[0].lat, 'number')
})

test('compare fans out to multiple cities in one request', async () => {
  const { status, body } = await get('/api/compare?cities=Delhi,Mumbai,Bengaluru')
  assert.equal(status, 200)
  assert.deepEqual(
    body.data.map((row) => row.city.name),
    ['New Delhi', 'Mumbai', 'Bengaluru'],
  )
})

test('validation: short city name → 400 validation', async () => {
  const { status, body } = await get('/api/weather?city=A')
  assert.equal(status, 400)
  assert.equal(body.success, false)
  assert.equal(body.code, 'validation')
  assert.ok(body.message.length > 0)
})

test('validation: missing city → 400', async () => {
  const { status, body } = await get('/api/weather')
  assert.equal(status, 400)
  assert.equal(body.code, 'validation')
})

test('validation: latitude out of range → 400', async () => {
  const { status, body } = await get('/api/weather/coordinates?lat=999&lon=10')
  assert.equal(status, 400)
  assert.match(body.message, /Latitude/)
})

test('validation: compare needs 2–4 cities', async () => {
  const one = await get('/api/compare?cities=Delhi')
  assert.equal(one.status, 400)
  const five = await get('/api/compare?cities=A1,B1,C1,D1,E1')
  assert.equal(five.status, 400)
})

test('validation: short geocoding query → 400', async () => {
  const { status } = await get('/api/geo?q=a')
  assert.equal(status, 400)
})

test('unknown city answers a demo city in fixtures mode', async () => {
  const { status, body } = await get('/api/weather?city=Zzzzznotacity')
  assert.equal(status, 200)
  assert.equal(body.success, true)
  assert.equal(body.data.city.name, 'Zzzzznotacity')
  assert.equal(typeof body.data.current.temp, 'number')
})

test('unknown endpoint → 404 not_found', async () => {
  const { status, body } = await get('/api/nope')
  assert.equal(status, 404)
  assert.equal(body.code, 'not_found')
})

test('CORS allows the configured origin and rejects others', async () => {
  const allowed = await get('/api/health', { Origin: 'http://allowed.test' })
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://allowed.test')

  const blocked = await get('/api/health', { Origin: 'http://evil.test' })
  assert.equal(blocked.headers.get('access-control-allow-origin'), null)
})

test('rate-limit headers are exposed on limited routes (draft-7)', async () => {
  /* /api/health is deliberately exempt — probe a limited route instead */
  const { headers } = await get('/api/weather?city=Delhi')
  assert.ok(headers.get('ratelimit') || headers.get('ratelimit-limit'))
})
