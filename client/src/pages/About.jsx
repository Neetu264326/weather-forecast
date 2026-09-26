import Icon from '../components/Icon'

const FEATURES = [
  ['pin', 'Live conditions', 'City search with debounced suggestions, geolocation, feels-like, highs/lows and local time.'],
  ['clock', 'Hourly + 5-day', '3-hour steps from OpenWeather aggregated into a scrollable rail, daily ranges and rain bars.'],
  ['shield', 'Air quality & UV', 'OpenWeather AQI with pollutant breakdown, plus a UV estimate derived from solar angle and cloud cover.'],
  ['compare', 'City comparison', 'Two to four cities side by side — one backend request fans out to every provider call.'],
  ['star', 'Favorites', 'Stored in localStorage, previewed with cached responses, removable in one click.'],
  ['sparkle', 'Mood & insights', 'Plain-language summaries and data-driven insights generated only from loaded forecast values.'],
]

const ENDPOINTS = [
  ['GET', '/api/weather?city=Delhi', 'Current conditions for a city name'],
  ['GET', '/api/weather/coordinates?lat&lon', 'Current conditions for a coordinate pair'],
  ['GET', '/api/forecast?city=Delhi', 'Hourly (24 × 3h) + aggregated daily forecast'],
  ['GET', '/api/forecast/coordinates?lat&lon', 'Forecast by coordinate pair'],
  ['GET', '/api/air-quality?lat&lon', 'AQI, pollutants and estimated UV index'],
  ['GET', '/api/geo?q=Del', 'Direct geocoding — search suggestions'],
  ['GET', '/api/compare?cities=A,B', 'Server-side fan-out for the compare table'],
  ['GET', '/api/health', 'Liveness probe for the hosting platform'],
]

export default function About() {
  return (
    <main className="shell page" id="main">
      <header className="page-head reveal">
        <h1>About WeatherIQ</h1>
        <p>
          A full-stack weather intelligence dashboard: React on the front, an Express API layer in
          the middle, OpenWeather at the back. The API key never reaches the browser.
        </p>
      </header>

      <div className="dash">
        <section className="card col-6 reveal" style={{ '--i': 0 }}>
          <div className="card__head">
            <h2 className="card__title">
              <Icon name="layers" /> Architecture
            </h2>
          </div>
          <pre className="code-block">{`Browser
  │  React 19 + Vite, custom CSS
  │  fetch("/api/...")
  ▼
Express API  (server/)
  │  validate → rate-limit → transform
  │  key lives only in .env
  ▼
OpenWeather
  ├─ /data/2.5/weather
  ├─ /data/2.5/forecast
  ├─ /data/2.5/air_pollution
  └─ /geo/1.0/direct`}</pre>
        </section>

        <section className="card col-6 reveal" style={{ '--i': 1 }}>
          <div className="card__head">
            <h2 className="card__title">
              <Icon name="shield" /> Why an Express layer
            </h2>
          </div>
          <ul className="about-list">
            <li>
              <Icon name="check" />
              <span>
                <strong>Key safety</strong> — the OpenWeather key sits in a server env var and is
                never shipped in the client bundle.
              </span>
            </li>
            <li>
              <Icon name="check" />
              <span>
                <strong>Response shaping</strong> — raw payloads are transformed into a small,
                consistent JSON contract the UI can trust.
              </span>
            </li>
            <li>
              <Icon name="check" />
              <span>
                <strong>Rate limiting</strong> — express-rate-limit protects the shared key from
                bursts of traffic.
              </span>
            </li>
            <li>
              <Icon name="check" />
              <span>
                <strong>One call, many cities</strong> — <code>/api/compare</code> fans out
                server-side so the browser makes a single request.
              </span>
            </li>
            <li>
              <Icon name="check" />
              <span>
                <strong>Caching</strong> — identical responses are memoised for five minutes on
                both sides, cutting repeat calls.
              </span>
            </li>
          </ul>
        </section>

        <section className="card col-12 reveal" style={{ '--i': 2 }}>
          <div className="card__head">
            <h2 className="card__title">
              <Icon name="grid" /> Features
            </h2>
          </div>
          <div className="details">
            {FEATURES.map(([icon, title, body]) => (
              <article className="detail" key={title}>
                <p className="detail__label">
                  <Icon name={icon} /> {title}
                </p>
                <p className="detail__sub" style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.55 }}>
                  {body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="card col-7 reveal" style={{ '--i': 3 }}>
          <div className="card__head">
            <h2 className="card__title">
              <Icon name="layers" /> REST endpoints
            </h2>
          </div>
          {ENDPOINTS.map(([method, path, note]) => (
            <p className="endpoint" key={path}>
              <span className="method">{method}</span>
              {path}
              <span>{note}</span>
            </p>
          ))}
        </section>

        <section className="card col-5 reveal" style={{ '--i': 4 }}>
          <div className="card__head">
            <h2 className="card__title">
              <Icon name="info" /> Stack &amp; notes
            </h2>
          </div>
          <ul className="about-list">
            <li>
              <Icon name="check" />
              React 19 · React Router 7 · custom CSS (no UI framework)
            </li>
            <li>
              <Icon name="check" />
              Node.js · Express 5 · express-validator · express-rate-limit
            </li>
            <li>
              <Icon name="check" />
              Charts drawn by hand in SVG — no charting library
            </li>
            <li>
              <Icon name="check" />
              <code>useWeather()</code> owns loading, data, errors, search and refresh
            </li>
            <li>
              <Icon name="check" />
              Skeletons, section-level errors and <code>prefers-reduced-motion</code> support
            </li>
            <li>
              <Icon name="check" />
              Favourites, theme, unit and recent searches persist in localStorage
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}
