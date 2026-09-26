import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import useDebounce from '../hooks/useDebounce'
import { MESSAGES, weatherApi } from '../services/weatherApi'

export default function SearchBar({ onSearch, recent = [], onClearRecent }) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState({ q: '', list: [] })
  const [active, setActive] = useState(-1)

  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const debounced = useDebounce(value.trim(), 450)

  /* debounced geocoding — one request after the user stops typing.
     `pending` is derived, so no extra loading state is needed. */
  useEffect(() => {
    if (debounced.length < 2) return undefined
    const controller = new AbortController()
    weatherApi
      .suggestions(debounced, controller.signal)
      .then((list) => setResult({ q: debounced, list: Array.isArray(list) ? list.slice(0, 6) : [] }))
      .catch((err) => {
        if (err?.name !== 'AbortError') setResult({ q: debounced, list: [] })
      })
    return () => controller.abort()
  }, [debounced])

  const suggestions = result.q === debounced ? result.list : []
  const pending = debounced.length >= 2 && result.q !== debounced

  useEffect(() => {
    const onPointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const submit = (city = value) => {
    const q = String(city ?? '').trim()
    if (q.length < 2) {
      setOpen(true)
      return
    }
    onSearch(q)
    setOpen(false)
    setActive(-1)
    inputRef.current?.blur()
  }

  const clear = () => {
    setValue('')
    setResult({ q: '', list: [] })
    inputRef.current?.focus()
  }

  const showSuggestions = value.trim().length >= 2 && suggestions.length > 0
  const showRecent = !showSuggestions && recent.length > 0
  const showPanel =
    open && (showSuggestions || showRecent || pending || value.trim().length >= 2)

  const items = showSuggestions
    ? suggestions.map((s) => ({
        key: `${s.name}${s.state}`,
        label: s.name,
        meta: [s.state, s.country].filter(Boolean).join(', '),
        value: s.name,
      }))
    : recent.map((c) => ({ key: c, label: c, meta: 'Recent', value: c }))

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false)
      setActive(-1)
      return
    }
    if (!showPanel) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && active >= 0 && items[active]) {
      e.preventDefault()
      submit(items[active].value)
    }
  }

  return (
    <div className="search" ref={wrapRef}>
      <form
        className="search__field"
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Icon name="search" />
        <input
          ref={inputRef}
          className="search__input"
          type="search"
          name="q"
          placeholder="Search city, country..."
          aria-label="Search city, country"
          aria-expanded={showPanel}
          aria-controls="search-panel"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setActive(-1)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {value && (
          <button type="button" className="search__clear" onClick={clear} aria-label="Clear search">
            <Icon name="close" size={15} />
          </button>
        )}
        <button type="submit" className="search__btn" aria-label="Search">
          <Icon name="chevronRight" size={17} />
        </button>
      </form>

      {showPanel && (
        <div className="search__panel" id="search-panel" role="listbox">
          {showSuggestions && (
            <div className="search__label">
              <span>Suggestions</span>
              {pending && <span>Searching…</span>}
            </div>
          )}
          {showRecent && (
            <div className="search__label">
              <span>Recent searches</span>
              <button type="button" className="search__link" onClick={onClearRecent}>
                Clear
              </button>
            </div>
          )}
          {items.length === 0 && !pending && (
            <div className="search__empty">
              {value.trim().length >= 2 ? MESSAGES.notfound : 'Search for a city to get started.'}
            </div>
          )}
          {items.map((item, i) => (
            <button
              key={item.key}
              type="button"
              role="option"
              aria-selected={i === active}
              className={`search__item${i === active ? ' is-active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => submit(item.value)}
            >
              <Icon name={showSuggestions ? 'pin' : 'clock'} />
              {item.label}
              <span>{item.meta}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
