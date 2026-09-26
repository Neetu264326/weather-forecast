/**
 * useWeather is the dashboard state machine: loading, success, section
 * degradation and error handling (including the abort-safe promise guard).
 */
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../services/weatherApi', () => {
  class ApiError extends Error {
    constructor(message, type = 'api', status = 0) {
      super(message)
      this.name = 'ApiError'
      this.type = type
      this.status = status
    }
  }
  return {
    ApiError,
    MESSAGES: {
      network: 'Unable to connect. Please try again.',
      notfound: "We couldn't find that city. Check the spelling and try again.",
      api: 'Weather service is temporarily unavailable.',
      validation: 'Please enter a valid city name.',
      limit: 'Too many requests. Wait a moment and try again.',
      location: 'Unable to access your location.',
    },
    invalidateCache: vi.fn(),
    weatherApi: {
      currentByCity: vi.fn(),
      currentByCoords: vi.fn(),
      forecastByCity: vi.fn(),
      forecastByCoords: vi.fn(),
      airQuality: vi.fn(),
      suggestions: vi.fn(),
      compare: vi.fn(),
      health: vi.fn(),
    },
  }
})

const { weatherApi, ApiError } = await import('../services/weatherApi')
const { default: useWeather } = await import('../hooks/useWeather')

const weatherPayload = {
  city: { name: 'New Delhi', country: 'IN', lat: 28.6, lon: 77.2, timezoneOffset: 19800 },
  condition: { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' },
  current: { temp: 31, feelsLike: 33, humidity: 45 },
  isDay: true,
}
const forecastPayload = { city: { name: 'New Delhi' }, hourly: [], daily: [] }
const airPayload = { aqi: 3, pollutants: { pm2_5: 40 }, uvi: 5 }

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  weatherApi.currentByCity.mockResolvedValue(weatherPayload)
  weatherApi.forecastByCity.mockResolvedValue(forecastPayload)
  weatherApi.airQuality.mockResolvedValue(airPayload)
  weatherApi.currentByCoords.mockResolvedValue(weatherPayload)
  weatherApi.forecastByCoords.mockResolvedValue(forecastPayload)
})

describe('useWeather', () => {
  test('loads the default city end to end', async () => {
    const { result } = renderHook(() => useWeather())

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.weather.city.name).toBe('New Delhi')
    expect(result.current.forecast).toEqual(forecastPayload)
    expect(result.current.air).toEqual(airPayload)
    expect(result.current.error).toBeNull()
    expect(weatherApi.currentByCity).toHaveBeenCalledWith('New Delhi', expect.anything())
  })

  test('current weather failure surfaces a typed error and clears loading', async () => {
    weatherApi.currentByCity.mockRejectedValue(new ApiError('nope', 'notfound', 404))

    const { result } = renderHook(() => useWeather())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toEqual({ message: 'nope', type: 'notfound' })
    expect(result.current.weather).toBeNull()
  })

  test('forecast failure degrades to a section error, dashboard stays up', async () => {
    weatherApi.forecastByCity.mockRejectedValue(new ApiError('slow', 'api', 502))

    const { result } = renderHook(() => useWeather())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.weather).not.toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.sectionError.forecast).toBe('slow')
    expect(result.current.sectionError.air).toBeNull()
  })

  test('searchCity validates short input before hitting the API', async () => {
    const { result } = renderHook(() => useWeather())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.searchCity('x')
    })

    expect(result.current.error.type).toBe('validation')
    expect(weatherApi.currentByCity).toHaveBeenCalledTimes(1) // only the initial load
  })

  test('searchCity loads a new city and remembers it', async () => {
    weatherApi.currentByCity.mockResolvedValue({
      ...weatherPayload,
      city: { ...weatherPayload.city, name: 'Tokyo' },
    })

    const { result } = renderHook(() => useWeather())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.searchCity('Tokyo')
    })

    await waitFor(() => expect(result.current.weather.city.name).toBe('Tokyo'))
    expect(result.current.recent).toContain('Tokyo')
    expect(JSON.parse(localStorage.getItem('weatheriq.lastCity'))).toBe('Tokyo')
  })
})
