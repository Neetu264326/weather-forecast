import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_CITY, LS_KEYS } from '../utils/constants'
import { ApiError, MESSAGES, invalidateCache, weatherApi } from '../services/weatherApi'
import useLocalStorage from './useLocalStorage'

const toErrorState = (err) => ({
  message: err?.message || MESSAGES.api,
  type: err?.type || (err instanceof ApiError ? 'api' : 'api'),
})

/**
 * Single source of truth for the dashboard:
 * loading · weather · forecast · air quality · errors · search · refresh.
 *
 * Current weather is required; forecast and air quality degrade to
 * per-section errors so one slow endpoint never blanks the screen.
 */
export default function useWeather() {
  const [recent, setRecent] = useLocalStorage(LS_KEYS.recent, [])
  const [lastCity, setLastCity] = useLocalStorage(LS_KEYS.lastCity, DEFAULT_CITY)

  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [air, setAir] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sectionError, setSectionError] = useState({ forecast: null, air: null })

  const abortRef = useRef(null)
  const queryRef = useRef({ city: lastCity })
  const lastCityRef = useRef(lastCity)

  const load = useCallback(async (target, { keep = false } = {}) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const signal = controller.signal

    const t = target ?? queryRef.current
    queryRef.current = t
    const byCoords = typeof t.lat === 'number' && typeof t.lon === 'number'

    setLoading(true)
    setError(null)
    setSectionError({ forecast: null, air: null })
    if (!keep) {
      setWeather(null)
      setForecast(null)
      setAir(null)
    }

    try {
      const weatherPromise = byCoords
        ? weatherApi.currentByCoords(t.lat, t.lon, signal)
        : weatherApi.currentByCity(t.city, signal)

      const forecastPromise = byCoords
        ? weatherApi.forecastByCoords(t.lat, t.lon, signal)
        : weatherApi.forecastByCity(t.city, signal)
      /* current weather decides success — if it fails we never await the
         forecast, so attach a no-op handler to avoid an unhandled rejection */
      forecastPromise.catch(() => {})

      const current = await weatherPromise
      setWeather(current)
      lastCityRef.current = current.city.name
      setLastCity(current.city.name)

      const [forecastResult, airResult] = await Promise.allSettled([
        forecastPromise,
        weatherApi.airQuality(current.city.lat, current.city.lon, signal),
      ])

      if (signal.aborted) return

      if (forecastResult.status === 'fulfilled') setForecast(forecastResult.value)
      else setSectionError((s) => ({ ...s, forecast: toErrorState(forecastResult.reason).message }))

      if (airResult.status === 'fulfilled') setAir(airResult.value)
      else setSectionError((s) => ({ ...s, air: toErrorState(airResult.reason).message }))
    } catch (err) {
      if (err?.name === 'AbortError' || signal.aborted) return
      setError(toErrorState(err))
    } finally {
      /* only the newest request may clear the loading flag */
      if (abortRef.current === controller) setLoading(false)
    }
  }, [setLastCity])

  const remember = useCallback(
    (name) => {
      setRecent((prev) =>
        [name, ...prev.filter((c) => c.toLowerCase() !== name.toLowerCase())].slice(0, 6),
      )
    },
    [setRecent],
  )

  const searchCity = useCallback(
    (value) => {
      const city = String(value ?? '').trim()
      if (city.length < 2) {
        setError({ message: MESSAGES.validation, type: 'validation' })
        return Promise.resolve()
      }
      remember(city)
      return load({ city })
    },
    [load, remember],
  )

  const searchByCoords = useCallback(
    (lat, lon) => {
      remember('Current location')
      return load({ lat, lon })
    },
    [load, remember],
  )

  const refresh = useCallback(() => {
    invalidateCache()
    return load(queryRef.current, { keep: true })
  }, [load])

  const clearRecent = useCallback(() => setRecent([]), [setRecent])

  const dismissError = useCallback(() => setError(null), [])

  /* first paint: restore the last viewed city.
     The cleanup aborts in-flight work, so a StrictMode remount simply
     starts a fresh request instead of hanging on a dead one. */
  useEffect(() => {
    load({ city: lastCityRef.current })
    return () => abortRef.current?.abort()
  }, [load])

  return {
    weather,
    forecast,
    air,
    loading,
    error,
    sectionError,
    recent,
    clearRecent,
    searchCity,
    searchByCoords,
    refresh,
    dismissError,
    city: weather?.city ?? null,
  }
}
