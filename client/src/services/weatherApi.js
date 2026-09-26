/*
  Single place where the React app talks to the outside world.
  - Development: relative /api paths go through the Vite proxy → Express.
  - Production: VITE_API_URL points at the deployed Express server.
  - VITE_USE_MOCK=true renders everything locally (no backend, no key).
  - Responses are memoised for 5 minutes so revisiting a city costs 0 requests.
*/

import { mockRoute } from './mockData'

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

if (import.meta.env.PROD && !USE_MOCK && !BASE) {
  console.warn(
    '[WeatherIQ] VITE_API_URL is not set — /api calls stay on this domain. Correct when the API is deployed alongside the client; otherwise set VITE_API_URL to the API origin before building.',
  )
}

const CACHE_TTL = 5 * 60 * 1000
const cache = new Map()

export const MESSAGES = {
  network: 'Unable to connect. Please try again.',
  notfound: "We couldn't find that city. Check the spelling and try again.",
  api: 'Weather service is temporarily unavailable.',
  validation: 'Please enter a valid city name.',
  limit: 'Too many requests. Wait a moment and try again.',
  location: 'Unable to access your location.',
}

export class ApiError extends Error {
  constructor(message, type = 'api', status = 0) {
    super(message)
    this.name = 'ApiError'
    this.type = type
    this.status = status
  }
}

/* Express error codes → the UI states ErrorMessage knows about */
const CODE_TO_TYPE = {
  validation: 'validation',
  notfound: 'notfound',
  not_found: 'notfound',
  limit: 'limit',
  network: 'network',
  config: 'api',
  upstream: 'api',
  error: 'api',
}

const buildQuery = (params) => {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  })
  const str = qs.toString()
  return str ? `?${str}` : ''
}

async function request(path, params = {}, signal) {
  if (USE_MOCK) {
    try {
      return await mockRoute(path, params)
    } catch (err) {
      if (err instanceof ApiError) throw err
      throw new ApiError(err.message || MESSAGES.api, err.type || 'api')
    }
  }

  let res
  try {
    res = await fetch(`${BASE}${path}${buildQuery(params)}`, {
      signal,
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError(MESSAGES.network, 'network')
  }

  let body = null
  try {
    body = await res.json()
  } catch {
    body = null
  }

  if (!res.ok) {
    const fallback =
      res.status === 404 ? 'notfound' : res.status === 429 ? 'limit' : 'api'
    const type = CODE_TO_TYPE[body?.code] ?? fallback
    throw new ApiError(body?.message || MESSAGES[type] || MESSAGES.api, type, res.status)
  }

  if (body?.success === false) {
    const type = CODE_TO_TYPE[body.code] ?? 'api'
    throw new ApiError(body.message || MESSAGES[type] || MESSAGES.api, type, res.status)
  }

  return body?.data ?? body
}

function memo(key, producer) {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.t < CACHE_TTL) return hit.v

  /* cache the in-flight promise so concurrent callers share one request;
     failed promises are evicted immediately so errors are never memoised */
  const promise = producer().then(
    (value) => {
      cache.set(key, { t: Date.now(), v: Promise.resolve(value) })
      return value
    },
    (err) => {
      cache.delete(key)
      throw err
    },
  )
  cache.set(key, { t: Date.now(), v: promise })
  return promise
}

export const invalidateCache = () => cache.clear()

export const weatherApi = {
  currentByCity: (city, signal) =>
    memo(`w:${city.toLowerCase()}`, () => request('/api/weather', { city }, signal)),

  currentByCoords: (lat, lon, signal) =>
    memo(`w:${lat.toFixed(2)},${lon.toFixed(2)}`, () =>
      request('/api/weather/coordinates', { lat, lon }, signal),
    ),

  forecastByCity: (city, signal) =>
    memo(`f:${city.toLowerCase()}`, () => request('/api/forecast', { city }, signal)),

  forecastByCoords: (lat, lon, signal) =>
    memo(`f:${lat.toFixed(2)},${lon.toFixed(2)}`, () =>
      request('/api/forecast/coordinates', { lat, lon }, signal),
    ),

  airQuality: (lat, lon, signal) =>
    memo(`a:${lat.toFixed(2)},${lon.toFixed(2)}`, () =>
      request('/api/air-quality', { lat, lon }, signal),
    ),

  /* debounced city suggestions (OpenWeather geocoding through our proxy) */
  suggestions: (q, signal) => request('/api/geo', { q }, signal),

  compare: (cities, signal) =>
    memo(`c:${cities.map((c) => c.toLowerCase()).join('|')}`, () =>
      request('/api/compare', { cities: cities.join(',') }, signal),
    ),

  health: () => request('/api/health'),
}
