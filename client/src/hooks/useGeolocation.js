import { useCallback, useState } from 'react'
import { MESSAGES } from '../services/weatherApi'

const ERROR_MESSAGES = {
  denied: 'Location permission was denied. Search for a city instead.',
  unavailable: 'Your location could not be determined.',
  timeout: 'Location request timed out. Please try again.',
  unsupported: 'This browser does not support geolocation.',
  location: MESSAGES.location,
}

/**
 * Thin wrapper around navigator.geolocation with every failure mode
 * mapped to a human-readable message. `onError` fires from the browser
 * callback (an event-like context), which keeps effects render-clean.
 */
export default function useGeolocation(onError) {
  const [state, setState] = useState({ coords: null, loading: false, error: null })

  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  const fail = useCallback(
    (key) => {
      const message = ERROR_MESSAGES[key] ?? ERROR_MESSAGES.location
      setState({ coords: null, loading: false, error: message })
      onError?.(message)
    },
    [onError],
  )

  const request = useCallback(() => {
    if (!supported) {
      fail('unsupported')
      return
    }

    setState({ coords: null, loading: true, error: null })

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coords: {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          },
          loading: false,
          error: null,
        })
      },
      (err) => fail({ 1: 'denied', 2: 'unavailable', 3: 'timeout' }[err.code]),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    )
  }, [supported, fail])

  return { ...state, supported, request }
}
