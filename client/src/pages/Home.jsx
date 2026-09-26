import AirQuality from '../components/AirQuality'
import CurrentWeather from '../components/CurrentWeather'
import ErrorMessage from '../components/ErrorMessage'
import FavoriteCities from '../components/FavoriteCities'
import HourlyForecast from '../components/HourlyForecast'
import Loading from '../components/Loading'
import SunriseSunset from '../components/SunriseSunset'
import WeatherBackground from '../components/WeatherBackground'
import WeatherChart from '../components/WeatherChart'
import WeatherDetails from '../components/WeatherDetails'
import WeatherMood from '../components/WeatherMood'
import WeeklyForecast from '../components/WeeklyForecast'
import WindDial from '../components/WindDial'
import Icon from '../components/Icon'
import { groupFromIcon } from '../utils/weatherUtils'

export default function Home({
  weather,
  forecast,
  air,
  loading,
  error,
  sectionError,
  refresh,
  unit,
  favorites,
  toggleFavorite,
  onSelectCity,
  onRemoveFavorite,
}) {
  const group = weather ? groupFromIcon(weather.condition.icon) : 'clear'
  const isDay = weather ? weather.isDay : true

  if (loading && !weather) {
    return (
      <>
        <WeatherBackground group={group} isDay={isDay} />
        <main className="shell page" id="main">
          <Loading />
        </main>
      </>
    )
  }

  if (error && !weather) {
    return (
      <>
        <WeatherBackground group="clear" isDay />
        <main className="shell page" id="main">
          <div className="card col-12">
            <ErrorMessage type={error.type} message={error.message} onRetry={refresh} />
          </div>
        </main>
      </>
    )
  }

  if (!weather) return null

  const offset = weather.city.timezoneOffset
  const isFavorite = favorites.includes(weather.city.name)

  return (
    <>
      <WeatherBackground group={group} isDay={isDay} />

      <main className="shell page" id="main">
        {loading && (
          <p className="pill reveal" style={{ marginBottom: 14 }}>
            <Icon name="loader" size={14} className="ico spin" /> Updating weather intelligence…
          </p>
        )}

        <div className="dash">
          <CurrentWeather
            weather={weather}
            unit={unit}
            isFavorite={isFavorite}
            onToggleFavorite={() => toggleFavorite(weather.city.name)}
          />

          <WeatherMood weather={weather} forecast={forecast} />
          <WeatherDetails weather={weather} unit={unit} air={air} />

          {sectionError.forecast ? (
            <section className="card col-12">
              <ErrorMessage
                type="api"
                message={`Forecast unavailable — ${sectionError.forecast}`}
                onRetry={refresh}
                compact
              />
            </section>
          ) : (
            <>
              <HourlyForecast forecast={forecast} weather={weather} unit={unit} />
              <WeeklyForecast forecast={forecast} unit={unit} />
            </>
          )}

          <SunriseSunset weather={weather} />

          <AirQuality air={air} weather={weather} error={sectionError.air} />

          {!sectionError.forecast && forecast && (
            <>
              <WeatherChart
                type="temp"
                hourly={forecast.hourly}
                offset={offset}
                unit={unit}
                className="col-6"
              />
              <WindDial weather={weather} />
              <WeatherChart
                type="rain"
                hourly={forecast.hourly}
                offset={offset}
                unit={unit}
                className="col-3"
                title="Rain chance"
              />
            </>
          )}

          <FavoriteCities
            favorites={favorites}
            unit={unit}
            onSelect={onSelectCity}
            onRemove={onRemoveFavorite}
          />
        </div>
      </main>
    </>
  )
}
