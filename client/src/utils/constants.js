export const UNITS = { C: 'C', F: 'F' }

export const DEFAULT_CITY = 'New Delhi'

export const LS_KEYS = {
  unit: 'weatheriq.unit',
  theme: 'weatheriq.theme',
  favorites: 'weatheriq.favorites',
  recent: 'weatheriq.recentSearches',
  lastCity: 'weatheriq.lastCity',
}

export const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: 'grid' },
  { to: '/favorites', label: 'Favorites', icon: 'star' },
  { to: '/compare', label: 'Compare', icon: 'compare' },
  { to: '/about', label: 'About', icon: 'info' },
]

/* OpenWeather condition ids → UI group
   https://openweathermap.org/weather-conditions */
export const CONDITION_GROUPS = [
  { max: 232, group: 'thunderstorm' },
  { max: 321, group: 'drizzle' },
  { max: 622, group: 'rain' },
  { max: 781, group: 'mist' },
  { max: 800, group: 'clear' },
  { max: 804, group: 'clouds' },
]

export const GROUP_LABELS = {
  clear: 'Clear sky',
  clouds: 'Cloudy',
  rain: 'Rain',
  drizzle: 'Drizzle',
  thunderstorm: 'Thunderstorm',
  snow: 'Snow',
  mist: 'Mist',
}

/* AQI (European scale used by OpenWeather): 1..5 */
export const AQI_LEVELS = [
  { min: 1, max: 1, label: 'Good', color: '#34d399', note: 'Air quality is satisfactory.' },
  { min: 2, max: 2, label: 'Fair', color: '#a3e635', note: 'Acceptable air quality for most.' },
  { min: 3, max: 3, label: 'Moderate', color: '#fbbf24', note: 'Sensitive groups may feel effects.' },
  { min: 4, max: 4, label: 'Poor', color: '#fb923c', note: 'Consider limiting long outdoor effort.' },
  { min: 5, max: 5, label: 'Very Poor', color: '#f87171', note: 'Extended outdoor time not advised.' },
]

export const UV_LEVELS = [
  { max: 2, label: 'Low', color: '#34d399' },
  { max: 5, label: 'Moderate', color: '#fbbf24' },
  { max: 7, label: 'High', color: '#fb923c' },
  { max: 10, label: 'Very High', color: '#f87171' },
  { max: Infinity, label: 'Extreme', color: '#c084fc' },
]

export const DETAIL_ICONS = {
  humidity: 'drop',
  wind: 'wind',
  pressure: 'gauge',
  visibility: 'eye',
  uv: 'sun',
  clouds: 'cloud',
  dew: 'thermometer',
}
