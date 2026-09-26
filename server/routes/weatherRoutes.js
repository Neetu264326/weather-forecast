import { Router } from 'express'
import { query } from 'express-validator'
import * as controller from '../controllers/weatherController.js'
import { validate } from '../middleware/errorMiddleware.js'

const router = Router()

const cityRules = [
  query('city')
    .isString()
    .withMessage('Provide a city name.')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('City name must be 2–80 characters.'),
]

const coordRules = [
  query('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90.')
    .toFloat(),
  query('lon')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180.')
    .toFloat(),
]

const geoRules = [
  query('q')
    .isString()
    .withMessage('Provide a search term.')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Search term must be 2–80 characters.'),
]

const compareRules = [
  query('cities').custom((value) => {
    if (typeof value !== 'string') throw new Error('Provide cities as a comma-separated list.')
    const cities = value.split(',').map((entry) => entry.trim()).filter(Boolean)
    if (cities.length < 2) throw new Error('Provide at least two cities, comma-separated.')
    if (cities.length > 4) throw new Error('Compare up to four cities at a time.')
    if (cities.some((name) => name.length < 2 || name.length > 60)) {
      throw new Error('Each city name must be 2–60 characters.')
    }
    return true
  }),
]

router.get('/health', controller.health)

router.get('/weather', cityRules, validate, controller.getWeatherByCity)
router.get('/weather/coordinates', coordRules, validate, controller.getWeatherByCoords)

router.get('/forecast', cityRules, validate, controller.getForecastByCity)
router.get('/forecast/coordinates', coordRules, validate, controller.getForecastByCoords)

router.get('/air-quality', coordRules, validate, controller.getAirQuality)

router.get('/geo', geoRules, validate, controller.getGeoSuggestions)

router.get('/compare', compareRules, validate, controller.getCompare)

export default router
