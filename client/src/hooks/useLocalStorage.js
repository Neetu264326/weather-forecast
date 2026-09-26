import { useCallback, useEffect, useState } from 'react'

/**
 * useState persisted in localStorage. Validates JSON so a corrupted
 * value can never crash the app.
 */
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const raw = window.localStorage.getItem(key)
      return raw !== null ? JSON.parse(raw) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* quota exceeded or private mode — preferences simply won't persist */
    }
  }, [key, value])

  const remove = useCallback(() => setValue(initialValue), [initialValue])

  return [value, setValue, remove]
}
