/**
 * Fixture-upstream tests: URL dispatch, city matching, shape of every
 * OpenWeather-shaped payload the service layer consumes.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { serveFixture } from '../fixtures/index.js'
import { HttpError } from '../utils/apiClient.js'
import { toForecastPayload, toWeatherPayload } from '../services/weatherService.js'

const url = (path, params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return `https://api.openweathermap.org${path}${qs ? `?${qs}` : ''}`
}

test('weather fixture by city alias resolves through the real transformer', () => {
  const raw = serveFixture(url('/data/2.5/weather', { q: 'Delhi', units: 'metric' }))
  const payload = toWeatherPayload(raw)
  assert.equal(payload.city.name, 'New Delhi')
  assert.equal(payload.city.country, 'IN')
  assert.equal(typeof payload.current.temp, 'number')
  assert.match(payload.condition.icon, /^\d{2}[dn]$/)
  assert.equal(raw.base, 'fixtures')
})

test('weather fixture by coordinates picks the nearest city', () => {
  const raw = serveFixture(url('/data/2.5/weather', { lat: 28.65, lon: 77.2 }))
  assert.equal(raw.name, 'New Delhi')
})

test('unknown city resolves to a deterministic demo city', () => {
  const raw = serveFixture(url('/data/2.5/weather', { q: 'Zzzzznotacity' }))
  const payload = toWeatherPayload(raw)
  assert.equal(payload.city.name, 'Zzzzznotacity')
  assert.equal(payload.city.country, '')
  assert.equal(typeof payload.current.temp, 'number')
  const again = serveFixture(url('/data/2.5/weather', { q: 'Zzzzznotacity' }))
  assert.equal(again.name, raw.name)
  assert.equal(again.coord.lat, raw.coord.lat)
  assert.equal(again.coord.lon, raw.coord.lon)
})

test('forecast fixture has 40 slots and aggregates into days', () => {
  const raw = serveFixture(url('/data/2.5/forecast', { q: 'Mumbai' }))
  assert.equal(raw.list.length, 40)
  assert.equal(raw.city.timezone, 19800)
  const payload = toForecastPayload(raw)
  assert.equal(payload.hourly.length, 24)
  assert.ok(payload.daily.length >= 5)
  assert.equal(payload.city.name, 'Mumbai')
  for (const slot of payload.hourly) {
    assert.ok(slot.pop >= 0 && slot.pop <= 1)
    assert.ok(slot.windSpeed > 0)
  }
})

test('air fixture exposes aqi 1–5 with pollutants', () => {
  const raw = serveFixture(url('/data/2.5/air_pollution', { lat: 19.08, lon: 72.88 }))
  assert.ok(raw.list[0].main.aqi >= 1 && raw.list[0].main.aqi <= 5)
  assert.ok(raw.list[0].components.pm2_5 > 0)
  assert.ok(raw.list[0].components.pm10 > 0)
})

test('geo fixture matches partial queries and suggests a demo city otherwise', () => {
  const berlin = serveFixture(url('/geo/1.0/direct', { q: 'ber' }))
  assert.ok(berlin.length >= 1)
  assert.equal(berlin[0].name, 'Berlin')
  assert.equal(typeof berlin[0].lat, 'number')

  const synth = serveFixture(url('/geo/1.0/direct', { q: 'qqqqzzzz' }))
  assert.equal(synth.length, 1)
  assert.equal(synth[0].name, 'Qqqqzzzz')
  const weather = serveFixture(url('/data/2.5/weather', { q: synth[0].name }))
  assert.equal(weather.coord.lat, synth[0].lat)
  assert.equal(weather.coord.lon, synth[0].lon)
})

test('fixture dispatch 404s for unknown upstream paths', () => {
  assert.throws(
    () => serveFixture(url('/data/2.5/onecall', { lat: 1, lon: 2 })),
    (err) => err instanceof HttpError && err.status === 404,
  )
})
