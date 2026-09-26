import { NavLink, Link } from 'react-router-dom'
import Icon from './Icon'
import SearchBar from './SearchBar'
import { NAV_LINKS } from '../utils/constants'

export default function Header({
  onSearch,
  recent,
  clearRecent,
  unit,
  setUnit,
  theme,
  setTheme,
  onLocate,
  locating,
  demo = false,
}) {
  return (
    <>
      <header className="header">
        <div className="shell header__inner">
          <Link to="/" className="logo" aria-label="WeatherIQ home">
            <span className="logo__mark">
              <Icon name="sparkle" />
            </span>
            <span>
              WeatherIQ
              <small>Weather intelligence</small>
            </span>
            {demo && <span className="demo-badge">Demo data</span>}
          </Link>

          <nav className="header__nav" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="header__search">
            <SearchBar onSearch={onSearch} recent={recent} onClearRecent={clearRecent} />
          </div>

          <div className="header__actions">
            <button
              type="button"
              className="icon-btn"
              onClick={onLocate}
              aria-label="Use my current location"
              title="Use my current location"
              disabled={locating}
            >
              <Icon name="navigation" className={`ico${locating ? ' spin' : ''}`} />
            </button>

            <div className="seg" role="group" aria-label="Temperature unit">
              <button
                type="button"
                className="seg__opt"
                aria-pressed={unit === 'C'}
                aria-selected={unit === 'C'}
                onClick={() => setUnit('C')}
              >
                °C
              </button>
              <button
                type="button"
                className="seg__opt"
                aria-pressed={unit === 'F'}
                aria-selected={unit === 'F'}
                onClick={() => setUnit('F')}
              >
                °F
              </button>
            </div>

            <button
              type="button"
              className="icon-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title="Toggle theme"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
          </div>
        </div>
      </header>

      <nav className="tabbar" aria-label="Mobile navigation">
        {NAV_LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => (isActive ? 'is-active' : undefined)}
          >
            <Icon name={l.icon} />
            {l.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
