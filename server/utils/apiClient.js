import { env } from '../config/env.js'

export const OPENWEATHER_BASE = 'https://api.openweathermap.org'

/**
 * Error with an HTTP status and a message we are happy to show a user.
 * `expose: false` means "log it, but send a generic message to the client".
 */
export class HttpError extends Error {
  constructor(status, message, { code = 'error', expose = true, cause } = {}) {
    super(message, cause ? { cause } : undefined)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.expose = expose
  }
}

export const withKey = (url) =>
  `${url}${url.includes('?') ? '&' : '?'}appid=${encodeURIComponent(env.apiKey)}`

/**
 * fetch with a hard timeout and OpenWeather-aware error mapping.
 * Native fetch keeps the dependency list short (Node 18+).
 */
export async function fetchJson(url, { timeout = env.upstreamTimeoutMs } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  let response
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new HttpError(504, 'The weather service took too long to respond.', {
        code: 'network',
        expose: true,
        cause: err,
      })
    }
    throw new HttpError(502, 'Unable to reach the weather service.', {
      code: 'network',
      expose: true,
      cause: err,
    })
  } finally {
    clearTimeout(timer)
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw mapUpstreamError(response, body)
  }

  return body
}

function mapUpstreamError(response, body) {
  const upstreamStatus = Number(body?.cod) || response.status
  const upstreamMessage = typeof body?.message === 'string' ? body.message : ''

  if (upstreamStatus === 404) {
    return new HttpError(404, "We couldn't find that city. Check the spelling and try again.", {
      code: 'notfound',
    })
  }
  if (upstreamStatus === 401) {
    return new HttpError(503, 'Weather service credentials are invalid.', {
      code: 'config',
    })
  }
  if (upstreamStatus === 429) {
    return new HttpError(503, 'Weather service is busy — please try again shortly.', {
      code: 'limit',
    })
  }
  if (upstreamStatus === 400) {
    return new HttpError(400, upstreamMessage || 'The weather service rejected that request.', {
      code: 'validation',
    })
  }

  return new HttpError(502, 'Weather service is temporarily unavailable.', {
    code: 'upstream',
    expose: false,
    cause: new Error(`Upstream ${response.status}: ${upstreamMessage}`),
  })
}
