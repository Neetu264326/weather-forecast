import { env, hasApiKey } from '../config/env.js'
import * as service from '../services/weatherService.js'

const ok = (res, data) => res.json({ success: true, data })

export function health(req, res) {
  ok(res, {
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: Date.now(),
    upstream: env.upstreamMode,
    apiKey: hasApiKey() ? 'configured' : 'missing',
  })
}

export async function getWeatherByCity(req, res) {
  ok(res, await service.getCurrentByCity(req.query.city))
}

export async function getWeatherByCoords(req, res) {
  ok(res, await service.getCurrentByCoords(Number(req.query.lat), Number(req.query.lon)))
}

export async function getForecastByCity(req, res) {
  ok(res, await service.getForecastByCity(req.query.city))
}

export async function getForecastByCoords(req, res) {
  ok(res, await service.getForecastByCoords(Number(req.query.lat), Number(req.query.lon)))
}

export async function getAirQuality(req, res) {
  ok(res, await service.getAirQuality(Number(req.query.lat), Number(req.query.lon)))
}

export async function getGeoSuggestions(req, res) {
  ok(res, await service.getSuggestions(req.query.q))
}

export async function getCompare(req, res) {
  const cities = String(req.query.cities)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
  ok(res, await service.getComparison(cities))
}
