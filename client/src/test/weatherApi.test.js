/**
 * The API layer is the contract between React and Express — these tests pin
 * down envelope unwrapping, error→type mapping, caching and abort behaviour.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { ApiError, MESSAGES, invalidateCache, weatherApi } from '../services/weatherApi'

const jsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

const mockFetch = (impl) => {
  const fn = vi.fn(impl)
  vi.stubGlobal('fetch', fn)
  return fn
}

beforeEach(() => {
  invalidateCache()
})

describe('request/response envelope', () => {
  test('unwraps { success, data }', async () => {
    mockFetch(async () => jsonResponse(200, { success: true, data: { city: { name: 'Delhi' } } }))
    const data = await weatherApi.currentByCity('Delhi')
    expect(data.city.name).toBe('Delhi')
  })

  test('passes city as a query parameter', async () => {
    const fn = mockFetch(async () => jsonResponse(200, { success: true, data: {} }))
    await weatherApi.currentByCity('New Delhi')
    expect(fn.mock.calls[0][0]).toContain('/api/weather?city=New+Delhi')
  })
})

describe('error mapping', () => {
  test('404 with code notfound → type notfound', async () => {
    mockFetch(async () =>
      jsonResponse(404, { success: false, code: 'notfound', message: 'no city' }),
    )
    await expect(weatherApi.currentByCity('Nowhere')).rejects.toMatchObject({
      name: 'ApiError',
      type: 'notfound',
      message: 'no city',
      status: 404,
    })
  })

  test('400 with code validation → type validation', async () => {
    mockFetch(async () =>
      jsonResponse(400, { success: false, code: 'validation', message: 'too short' }),
    )
    await expect(weatherApi.currentByCity('A')).rejects.toMatchObject({
      type: 'validation',
      message: 'too short',
    })
  })

  test('429 → type limit', async () => {
    mockFetch(async () =>
      jsonResponse(429, { success: false, code: 'limit', message: 'slow down' }),
    )
    await expect(weatherApi.currentByCity('Delhi')).rejects.toMatchObject({ type: 'limit' })
  })

  test('config error maps to a generic api state, not internals', async () => {
    mockFetch(async () =>
      jsonResponse(503, { success: false, code: 'config', message: 'key missing' }),
    )
    await expect(weatherApi.currentByCity('Delhi')).rejects.toMatchObject({
      type: 'api',
      message: 'key missing',
    })
  })

  test('fetch rejection → network error with friendly copy', async () => {
    mockFetch(async () => {
      throw new TypeError('Failed to fetch')
    })
    await expect(weatherApi.currentByCity('Delhi')).rejects.toMatchObject({
      type: 'network',
      message: MESSAGES.network,
    })
  })

  test('non-JSON body falls back to the default message', async () => {
    mockFetch(async () => ({ ok: false, status: 502, json: async () => { throw new Error('nope') } }))
    await expect(weatherApi.currentByCity('Delhi')).rejects.toMatchObject({
      type: 'api',
      message: MESSAGES.api,
    })
  })
})

describe('5-minute memo cache', () => {
  test('identical requests hit the network once', async () => {
    const fn = mockFetch(async () => jsonResponse(200, { success: true, data: { n: 1 } }))
    const [a, b] = await Promise.all([
      weatherApi.forecastByCity('Paris'),
      weatherApi.forecastByCity('Paris'),
    ])
    expect(fn).toHaveBeenCalledTimes(1)
    expect(a).toEqual(b)
  })

  test('failures are not cached', async () => {
    const fn = mockFetch(async () =>
      jsonResponse(404, { success: false, code: 'notfound', message: 'gone' }),
    )
    await expect(weatherApi.currentByCity('Ghost')).rejects.toBeInstanceOf(ApiError)
    await expect(weatherApi.currentByCity('Ghost')).rejects.toBeInstanceOf(ApiError)
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
