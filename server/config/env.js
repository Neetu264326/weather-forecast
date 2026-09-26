import 'dotenv/config'

const num = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const list = (value, fallback) =>
  String(value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

/**
 * Every piece of configuration lives here — nothing else in the app
 * touches process.env, so the surface area for a leaked secret is tiny.
 */
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: num(process.env.PORT, 5000),
  apiKey: String(process.env.OPENWEATHER_API_KEY ?? '').trim(),
  clientUrls: list(process.env.CLIENT_URL, 'http://localhost:5173'),
  rateWindowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateMax: num(process.env.RATE_LIMIT_MAX, 300),
  upstreamTimeoutMs: num(process.env.UPSTREAM_TIMEOUT_MS, 8000),
  /* 'live' calls OpenWeather · 'fixtures' serves local OpenWeather-shaped data */
  upstreamMode: (process.env.UPSTREAM_MODE === 'fixtures' ? 'fixtures' : 'live'),
}

export const hasApiKey = () => Boolean(env.apiKey) && env.apiKey !== 'your_api_key'

export const isFixtures = () => env.upstreamMode === 'fixtures'

export function reportEnv() {
  const where = env.nodeEnv === 'production' ? 'production' : 'development'
  if (env.upstreamMode === 'fixtures') {
    console.log('[env] upstream: FIXTURES (no API key needed — set UPSTREAM_MODE=live + a key for real data)')
  } else if (!hasApiKey()) {
    console.warn('[env] OPENWEATHER_API_KEY is not set — /api/weather* will answer 503.')
  }
  console.log(
    `[env] ${where} · port ${env.port} · CORS ${env.clientUrls.join(', ') || '(none)'} · limit ${env.rateMax}/${env.rateWindowMs}ms`,
  )
}
