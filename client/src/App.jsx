import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import Header from './components/Header'
import Icon from './components/Icon'
import Loading from './components/Loading'
import useGeolocation from './hooks/useGeolocation'
import useLocalStorage from './hooks/useLocalStorage'
import useWeather from './hooks/useWeather'
import { weatherApi } from './services/weatherApi'
import { LS_KEYS } from './utils/constants'
import { groupFromIcon } from './utils/weatherUtils'

/* route-level code splitting: the first paint only downloads the shell + Home */
const About = lazy(() => import('./pages/About'))
const Compare = lazy(() => import('./pages/Compare'))
const Favorites = lazy(() => import('./pages/Favorites'))
const Home = lazy(() => import('./pages/Home'))

function PageFallback() {
  return (
    <main className="shell page" id="main">
      <div className="card col-12">
        <div className="sk" style={{ height: 220 }} aria-hidden="true" />
        <span className="sr-only" role="status">
          Loading page…
        </span>
      </div>
    </main>
  )
}

function NotFound() {
  return (
    <main className="shell page" id="main">
      <div className="card col-12">
        <div className="state">
          <span className="state__icon">
            <Icon name="pin" />
          </span>
          <div>
            <p className="state__title">Page not found</p>
            <p className="state__text">That route does not exist in this dashboard.</p>
          </div>
          <a className="btn btn--primary" href="/">
            Back to dashboard
          </a>
        </div>
      </div>
    </main>
  )
}

export default function App() {
  const [unit, setUnit] = useLocalStorage(LS_KEYS.unit, 'C')
  const [theme, setTheme] = useLocalStorage(LS_KEYS.theme, 'dark')
  const [favorites, setFavorites] = useLocalStorage(LS_KEYS.favorites, [
    'New Delhi',
    'Mumbai',
    'Bengaluru',
  ])
  const [toast, setToast] = useState(null)
  const [demo, setDemo] = useState(false)
  const toastTimer = useRef(null)

  const showToast = useCallback((message) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3400)
  }, [])

  const navigate = useNavigate()
  const wx = useWeather()
  const geo = useGeolocation(showToast)

  /* theme is applied at the document level so <html data-theme> drives CSS */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#05070d' : '#e9eefb')
  }, [theme])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  /* backend tells us which upstream it uses — fixtures get an honest badge */
  useEffect(() => {
    let alive = true
    weatherApi
      .health()
      .then((data) => {
        if (alive && data?.upstream === 'fixtures') setDemo(true)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  /* geolocation permission → coordinates → weather */
  useEffect(() => {
    if (geo.coords) wx.searchByCoords(geo.coords.lat, geo.coords.lon)
  }, [geo.coords, wx])

  const toggleFavorite = useCallback(
    (name) => {
      const exists = favorites.includes(name)
      setFavorites((prev) =>
        exists ? prev.filter((c) => c !== name) : [...prev, name],
      )
      showToast(exists ? `${name} removed from favorites` : `${name} saved to favorites`)
    },
    [favorites, setFavorites, showToast],
  )

  const removeFavorite = useCallback(
    (name) => {
      setFavorites((prev) => prev.filter((c) => c !== name))
      showToast(`${name} removed from favorites`)
    },
    [setFavorites, showToast],
  )

  const selectCity = useCallback(
    (city) => {
      navigate('/')
      wx.searchCity(city)
    },
    [navigate, wx],
  )

  const searchFromHeader = useCallback(
    (city) => {
      navigate('/')
      wx.searchCity(city)
    },
    [navigate, wx],
  )

  const group = wx.weather ? groupFromIcon(wx.weather.condition.icon) : 'clear'
  const isNight = wx.weather ? !wx.weather.isDay : true

  return (
    <div className={`app app--${group}${isNight ? ' app--night' : ''}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Header
        onSearch={searchFromHeader}
        recent={wx.recent}
        clearRecent={wx.clearRecent}
        unit={unit}
        setUnit={setUnit}
        theme={theme}
        setTheme={setTheme}
        onLocate={geo.request}
        locating={geo.loading}
        demo={demo}
      />

      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route
            path="/"
            element={
              <Suspense
                fallback={
                  <main className="shell page" id="main">
                    <Loading />
                  </main>
                }
              >
                <Home
                  weather={wx.weather}
                  forecast={wx.forecast}
                  air={wx.air}
                  loading={wx.loading}
                  error={wx.error}
                  sectionError={wx.sectionError}
                  refresh={wx.refresh}
                  dismissError={wx.dismissError}
                  unit={unit}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  onSelectCity={selectCity}
                  onRemoveFavorite={removeFavorite}
                />
              </Suspense>
            }
          />
          <Route
            path="/favorites"
            element={
              <Favorites
                favorites={favorites}
                unit={unit}
                onSelect={selectCity}
                onRemove={removeFavorite}
              />
            }
          />
          <Route path="/compare" element={<Compare unit={unit} />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={16} />
          {toast}
        </div>
      )}
    </div>
  )
}
