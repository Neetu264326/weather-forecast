import { useEffect, useState } from 'react'
import Icon from './Icon'
import WeatherIcon from './WeatherIcon'
import ErrorMessage from './ErrorMessage'
import useLocalStorage from '../hooks/useLocalStorage'
import { formatTemp, windDir } from '../utils/weatherUtils'
import { weatherApi } from '../services/weatherApi'

const MAX_CITIES = 4

export default function CompareCities({ unit }) {
  const [cities, setCities] = useLocalStorage('weatheriq.compareCities', [
    'New Delhi',
    'Mumbai',
  ])
  const [result, setResult] = useState({ key: null, rows: [], error: null })
  const [notice, setNotice] = useState(null)
  const [input, setInput] = useState('')
  const [reload, setReload] = useState(0)

  const signature = cities.join('|')
  const hasCities = cities.length > 0
  const loading = hasCities && result.key !== signature
  const error = result.key === signature ? result.error : null
  const rows = result.rows

  /* fetch in an effect; `setReload` re-runs it for the retry button */
  useEffect(() => {
    const list = signature ? signature.split('|') : []
    if (!list.length) return undefined

    let alive = true
    weatherApi
      .compare(list)
      .then((data) => {
        if (!alive) return
        setResult({ key: signature, rows: Array.isArray(data) ? data : [], error: null })
      })
      .catch((err) => {
        if (!alive) return
        setResult({
          key: signature,
          rows: [],
          error: { message: err?.message, type: err?.type || 'api' },
        })
      })

    return () => {
      alive = false
    }
  }, [signature, reload])

  const addCity = (e) => {
    e.preventDefault()
    const value = input.trim()
    if (!value) return
    if (cities.length >= MAX_CITIES) {
      setNotice({ message: `Compare up to ${MAX_CITIES} cities at a time.`, type: 'validation' })
      return
    }
    if (cities.some((c) => c.toLowerCase() === value.toLowerCase())) {
      setInput('')
      return
    }
    setNotice(null)
    setCities([...cities, value])
    setInput('')
  }

  const removeCity = (name) => {
    setNotice(null)
    setCities(cities.filter((c) => c !== name))
  }

  const best = (getter) => {
    if (rows.length < 2) return null
    const values = rows.map(getter).filter((v) => typeof v === 'number' && !Number.isNaN(v))
    if (values.length < 2) return null
    return Math.max(...values)
  }

  const maxTemp = best((r) => r.current.temp)
  const maxFeels = best((r) => r.current.feelsLike)
  const maxHumidity = best((r) => r.current.humidity)
  const maxWind = best((r) => r.current.windSpeed)
  const maxPressure = best((r) => r.current.pressure)

  const cell = (value, isBest) => <td className={isBest ? 'is-best' : undefined}>{value}</td>

  return (
    <div className="card">
      <div className="card__head">
        <h2 className="card__title">
          <Icon name="compare" /> Side-by-side comparison
        </h2>
        <span className="card__hint">{rows.length}/{MAX_CITIES} cities</span>
      </div>

      <form className="cmp-picker" onSubmit={addCity}>
        <label className="sr-only" htmlFor="cmp-city">
          Add a city to compare
        </label>
        <input
          id="cmp-city"
          placeholder="Add a city, e.g. Bengaluru"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={40}
        />
        <button type="submit" className="btn btn--primary">
          <Icon name="plus" size={16} /> Add city
        </button>

        <div className="hero__chips">
          {cities.map((c) => (
            <button
              key={c}
              type="button"
              className="chip"
              onClick={() => removeCity(c)}
              aria-label={`Remove ${c} from comparison`}
              style={{ cursor: 'pointer' }}
            >
              {c} <Icon name="close" size={13} />
            </button>
          ))}
        </div>
      </form>

      {loading && (
        <div className="sk-rail" aria-live="polite">
          <div className="sk" style={{ height: 220, flex: 1 }} />
          <div className="sk" style={{ height: 220, flex: 1 }} />
        </div>
      )}

      {notice && (
        <p className="fav-empty" role="status">
          {notice.message}
        </p>
      )}

      {!loading && error && (
          <ErrorMessage
            type={error.type}
            message={error.message}
            onRetry={() => setReload((r) => r + 1)}
          />
      )}

      {!loading && !error && (!hasCities || rows.length === 0) && (
        <p className="fav-empty">Add at least one city to start comparing.</p>
      )}

      {!loading && !error && hasCities && rows.length > 0 && (
        <div className="cmp-table-wrap">
          <table className="cmp">
            <caption className="sr-only">Weather comparison between selected cities</caption>
            <thead>
              <tr>
                <th scope="col">Metric</th>
                {rows.map((r) => (
                  <th scope="col" key={r.city.name}>
                    {r.city.name}
                    <small>{r.city.country}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Condition</th>
                {rows.map((r) => (
                  <td key={r.city.name}>
                    <WeatherIcon
                      icon={r.condition.icon}
                      size={42}
                      title={r.condition.description}
                    />
                    <span style={{ fontSize: 13, textTransform: 'capitalize' }}>
                      {r.condition.description}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">Temperature</th>
                {rows.map((r) =>
                  cell(
                    formatTemp(r.current.temp, unit),
                    maxTemp !== null && r.current.temp === maxTemp,
                  ),
                )}
              </tr>
              <tr>
                <th scope="row">Feels like</th>
                {rows.map((r) =>
                  cell(
                    formatTemp(r.current.feelsLike, unit),
                    maxFeels !== null && r.current.feelsLike === maxFeels,
                  ),
                )}
              </tr>
              <tr>
                <th scope="row">Humidity</th>
                {rows.map((r) =>
                  cell(
                    `${r.current.humidity}%`,
                    maxHumidity !== null && r.current.humidity === maxHumidity,
                  ),
                )}
              </tr>
              <tr>
                <th scope="row">Wind</th>
                {rows.map((r) =>
                  cell(
                    `${Math.round(r.current.windSpeed)} km/h ${windDir(r.current.windDeg)}`,
                    maxWind !== null && r.current.windSpeed === maxWind,
                  ),
                )}
              </tr>
              <tr>
                <th scope="row">Pressure</th>
                {rows.map((r) =>
                  cell(
                    `${r.current.pressure} hPa`,
                    maxPressure !== null && r.current.pressure === maxPressure,
                  ),
                )}
              </tr>
            </tbody>
          </table>
          <p className="cmp__legend">
            Green marks the highest value in each row — useful for spotting the warmer, damper or
            windier city at a glance.
          </p>
        </div>
      )}
    </div>
  )
}
