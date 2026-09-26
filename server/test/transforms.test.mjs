/**
 * Pure-function tests: solar/UV maths, dew point, and both transformers.
 * Runs with no server and no network:  npm test
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  dewPoint,
  estimateUvi,
  solarElevation,
  toForecastPayload,
  toWeatherPayload,
} from '../services/weatherService.js'

const NOW = Math.floor(Date.UTC(2026, 8, 26, 12, 0, 0) / 1000) // 2026-09-26 12:00 UTC
const OFFSET = 19800 // UTC+5:30

const weatherRaw = {
  coord: { lon: 77.21, lat: 28.61 },
  weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
  base: 'stations',
  main: {
    temp: 31.4,
    feels_like: 33.2,
    temp_min: 27.1,
    temp_max: 33.8,
    pressure: 1011,
    humidity: 45,
  },
  visibility: 8000,
  wind: { speed: 4.6, deg: 290, gust: 7.1 },
  clouds: { all: 20 },
  dt: NOW,
  sys: { country: 'IN', sunrise: NOW - 6 * 3600, sunset: NOW + 6 * 3600 },
  timezone: OFFSET,
  name: 'New Delhi',
  cod: 200,
}

const condition = { id: 500, main: 'Rain', description: 'light rain', icon: '10d' }
const list = Array.from({ length: 40 }, (_, i) => {
  const dt = NOW + i * 10800
  const hour = Math.floor((((dt + OFFSET) % 86400) + 86400) % 86400 / 3600)
  return {
    dt,
    main: {
      temp: 24 + Math.sin(((hour - 4) / 24) * Math.PI * 2) * 6,
      feels_like: 25,
      humidity: 60,
      pressure: 1010,
    },
    weather: [condition],
    clouds: { all: 40 },
    wind: { speed: 3 },
    pop: i % 5 === 0 ? 0.8 : 0.1,
  }
})

const forecastRaw = {
  cod: '200',
  message: 0,
  cnt: 40,
  list,
  city: {
    id: 1273294,
    name: 'New Delhi',
    coord: { lat: 28.61, lon: 77.21 },
    country: 'IN',
    population: 1000000,
    timezone: OFFSET,
    sunrise: NOW - 6 * 3600,
    sunset: NOW + 6 * 3600,
  },
}

test('dew point is below air temperature and responds to humidity', () => {
  const dry = dewPoint(30, 20)
  const humid = dewPoint(30, 90)
  assert.ok(dry < 30, `dry dew point ${dry} should be < 30`)
  assert.ok(humid > dry, `humid ${humid} should exceed dry ${dry}`)
  assert.ok(humid < 30, `humid dew point ${humid} should still be < 30`)
})

test('solar elevation is positive at local noon and negative at local midnight', () => {
  const noon = Date.UTC(2026, 8, 26, 6, 30) // 12:00 IST
  const midnight = Date.UTC(2026, 8, 26, 18, 30) // 00:00 IST
  const day = solarElevation(28.61, 77.21, noon)
  const night = solarElevation(28.61, 77.21, midnight)
  assert.ok(day > 40, `expected high noon elevation, got ${day}`)
  assert.ok(night < 0, `expected negative midnight elevation, got ${night}`)
})

test('UV estimate is 0 at night, higher under clear skies than overcast', () => {
  const midnight = Date.UTC(2026, 8, 26, 18, 30)
  const noon = Date.UTC(2026, 8, 26, 6, 30)
  const nightUv = estimateUvi({ lat: 28.61, lon: 77.21, dateMs: midnight, cloudCover: 0 })
  const clearNoon = estimateUvi({ lat: 28.61, lon: 77.21, dateMs: noon, cloudCover: 0 })
  const cloudyNoon = estimateUvi({ lat: 28.61, lon: 77.21, dateMs: noon, cloudCover: 100 })
  assert.equal(nightUv, 0)
  assert.ok(clearNoon > 4 && clearNoon <= 11, `clear UV ${clearNoon} out of range`)
  assert.ok(cloudyNoon < clearNoon, 'clouds must reduce UV')
})

test('UV is clamped to the 0–11 index scale', () => {
  for (const cloudCover of [0, 50, 100]) {
    const uv = estimateUvi({
      lat: 0,
      lon: 0,
      dateMs: Date.UTC(2026, 5, 21, 12, 0),
      cloudCover,
    })
    assert.ok(uv >= 0 && uv <= 11, `uv ${uv} outside 0–11`)
  }
})

test('weather payload matches the contract React expects', () => {
  const payload = toWeatherPayload(weatherRaw)
  assert.equal(payload.city.name, 'New Delhi')
  assert.equal(payload.city.timezoneOffset, OFFSET)
  assert.equal(payload.condition.icon, '01d')
  assert.equal(payload.current.windSpeed, 16.6) // 4.6 m/s → 16.6 km/h
  assert.equal(payload.current.visibility, 8) // 8000 m → 8 km
  assert.ok(payload.current.dewPoint < weatherRaw.main.temp)
  assert.equal(typeof payload.current.uvi, 'number')
  assert.equal(payload.isDay, true)
  assert.deepEqual(Object.keys(payload).sort(), [
    'city',
    'condition',
    'current',
    'epoch',
    'isDay',
    'sun',
    'temps',
  ])
})

test('forecast payload aggregates 40 slots into hourly + daily', () => {
  const payload = toForecastPayload(forecastRaw)
  assert.equal(payload.hourly.length, 24)
  assert.ok(payload.daily.length >= 5, `expected >=5 days, got ${payload.daily.length}`)
  assert.ok(payload.daily.length <= 7, `expected <=7 days, got ${payload.daily.length}`)

  for (const day of payload.daily) {
    assert.match(day.date, /^\d{4}-\d{2}-\d{2}$/)
    assert.ok(day.tempMin <= day.tempMax, `min > max on ${day.date}`)
    assert.ok(day.pop >= 0 && day.pop <= 1, `pop out of range on ${day.date}`)
    assert.equal(typeof day.dayName, 'string')
    assert.equal(typeof day.condition.icon, 'string')
  }

  assert.equal(payload.city.timezoneOffset, OFFSET)
  assert.equal(payload.hourly[0].time, list[0].dt)
})
