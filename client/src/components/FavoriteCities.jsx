import { useEffect, useState } from 'react'
import Icon from './Icon'
import WeatherIcon from './WeatherIcon'
import { formatTemp } from '../utils/weatherUtils'
import { weatherApi } from '../services/weatherApi'

export default function FavoriteCities({
  favorites = [],
  unit,
  onSelect,
  onRemove,
  className = 'col-12',
}) {
  const [preview, setPreview] = useState({})
  const [failed, setFailed] = useState({})
  const signature = favorites.join('|')

  /* one cached request per city, refreshed only when the list changes */
  useEffect(() => {
    let alive = true
    const list = signature ? signature.split('|') : []
    if (!list.length) return () => {}

    Promise.allSettled(list.map((city) => weatherApi.currentByCity(city))).then((results) => {
      if (!alive) return
      const next = {}
      const bad = {}
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') next[list[i]] = r.value
        else bad[list[i]] = true
      })
      setPreview(next)
      setFailed(bad)
    })

    return () => {
      alive = false
    }
  }, [signature])

  return (
    <section className={`card ${className} reveal`} style={{ '--i': 10 }} aria-labelledby="fav-title">
      <div className="card__head">
        <h2 className="card__title" id="fav-title">
          <Icon name="star" /> Favorite cities
        </h2>
        <span className="card__hint">{favorites.length} saved</span>
      </div>

      {favorites.length === 0 ? (
        <p className="fav-empty">
          No favorites yet — press the star on any city card to keep it one click away.
        </p>
      ) : (
        <ul className="fav-list">
          {favorites.map((city) => {
            const data = preview[city]
            return (
              <li key={city} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="fav-card"
                  onClick={() => onSelect(city)}
                  aria-label={`View weather for ${city}`}
                >
                  {!data && !failed[city] ? (
                    <>
                      <span className="sk fav-sk" style={{ width: 34, height: 34, borderRadius: 12 }} />
                      <span>
                        <span className="fav-card__name">{city}</span>
                        <span className="fav-card__meta">Loading…</span>
                      </span>
                      <span className="fav-card__temp">--</span>
                    </>
                  ) : failed[city] ? (
                    <>
                      <Icon name="alert" />
                      <span>
                        <span className="fav-card__name">{city}</span>
                        <span className="fav-card__meta">Unavailable</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <WeatherIcon
                        icon={data.condition.icon}
                        size={34}
                        title={data.condition.description}
                      />
                      <span>
                        <span className="fav-card__name">{data.city.name}</span>
                        <span className="fav-card__meta">{data.condition.description}</span>
                      </span>
                      <span className="fav-card__temp">{formatTemp(data.current.temp, unit)}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="fav-card__remove"
                  onClick={() => onRemove(city)}
                  aria-label={`Remove ${city} from favorites`}
                >
                  <Icon name="close" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
