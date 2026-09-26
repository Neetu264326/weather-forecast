import FavoriteCities from '../components/FavoriteCities'
import Icon from '../components/Icon'

export default function Favorites({ favorites, unit, onSelect, onRemove }) {
  return (
    <main className="shell page" id="main">
      <header className="page-head reveal">
        <h1>Saved cities</h1>
        <p>
          Your shortlist, kept in <code>localStorage</code> so it survives a refresh without an
          account. Tap a card to load its full dashboard.
        </p>
      </header>

      <div className="dash">
        <FavoriteCities
          favorites={favorites}
          unit={unit}
          onSelect={onSelect}
          onRemove={onRemove}
        />

        <section className="card col-12 reveal" style={{ '--i': 1 }}>
          <div className="card__head">
            <h2 className="card__title">
              <Icon name="info" /> How favorites work
            </h2>
          </div>
          <ul className="about-list">
            <li>
              <Icon name="check" />
              Saved under the <strong>weatheriq.favorites</strong> key in your browser — nothing is
              uploaded anywhere.
            </li>
            <li>
              <Icon name="check" />
              Each saved city is fetched once and memoised for five minutes, so opening this page
              does not spam the API.
            </li>
            <li>
              <Icon name="check" />
              The hover <strong>×</strong> (or focus + Enter) removes a city instantly.
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}
