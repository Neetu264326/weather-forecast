/**
 * Compare page: renders the fan-out payload, highlights the best value per
 * row, and recovers through the retry button on failure.
 */
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../services/weatherApi', () => ({
  ApiError: class ApiError extends Error {
    constructor(message, type = 'api', status = 0) {
      super(message)
      this.name = 'ApiError'
      this.type = type
      this.status = status
    }
  },
  MESSAGES: { api: 'Weather service is temporarily unavailable.' },
  invalidateCache: vi.fn(),
  weatherApi: {
    compare: vi.fn(),
    currentByCity: vi.fn(),
    currentByCoords: vi.fn(),
    forecastByCity: vi.fn(),
    forecastByCoords: vi.fn(),
    airQuality: vi.fn(),
    suggestions: vi.fn(),
    health: vi.fn(),
  },
}))

const { weatherApi } = await import('../services/weatherApi')
const { default: CompareCities } = await import('../components/CompareCities')

const row = (name, country, temp, humidity) => ({
  city: { name, country, lat: 0, lon: 0, timezoneOffset: 0 },
  condition: { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' },
  current: {
    temp,
    feelsLike: temp + 1,
    humidity,
    windSpeed: 10,
    windDeg: 90,
    pressure: 1013,
  },
})

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  localStorage.setItem('weatheriq.compareCities', JSON.stringify(['New Delhi', 'Mumbai']))
  weatherApi.compare.mockResolvedValue([
    row('New Delhi', 'IN', 34, 45),
    row('Mumbai', 'IN', 30, 78),
  ])
})

describe('CompareCities', () => {
  test('renders both cities and marks the best value in each row', async () => {
    render(<CompareCities unit="C" />)

    const table = await screen.findByRole('table')
    expect(within(table).getByRole('columnheader', { name: /New Delhi/ })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: /Mumbai/ })).toBeInTheDocument()

    /* temperature row: Delhi 34 > Mumbai 30 → Delhi cell is best */
    const temperatureRow = within(table).getByRole('row', { name: /Temperature/ })
    expect(temperatureRow).toHaveTextContent('34')
    expect(temperatureRow.querySelector('td.is-best')).not.toBeNull()

    /* humidity row: Mumbai 78 > Delhi 45 → Mumbai cell is best */
    const humidityRow = within(table).getByRole('row', { name: /Humidity/ })
    expect(humidityRow.querySelectorAll('td.is-best')).toHaveLength(1)
    expect(humidityRow.querySelector('td.is-best')).toHaveTextContent('78%')
  })

  test('shows an error state with retry, then recovers', async () => {
    weatherApi.compare.mockRejectedValueOnce(
      new (await import('../services/weatherApi')).ApiError('upstream down', 'api', 503),
    )

    render(<CompareCities unit="C" />)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('upstream down')

    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    const table = await screen.findByRole('table')
    expect(within(table).getByRole('columnheader', { name: /New Delhi/ })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('adding more than four cities is blocked with a notice', async () => {
    localStorage.setItem(
      'weatheriq.compareCities',
      JSON.stringify(['A', 'B', 'C', 'D'].map((c) => `City ${c}`)),
    )
    weatherApi.compare.mockResolvedValue([])

    render(<CompareCities unit="C" />)
    await waitFor(() => expect(weatherApi.compare).toHaveBeenCalled())

    await userEvent.type(screen.getByLabelText(/Add a city to compare/i), 'Extra City')
    await userEvent.click(screen.getByRole('button', { name: /add city/i }))

    expect(await screen.findByText(/Compare up to 4 cities at a time/)).toBeInTheDocument()
  })
})
