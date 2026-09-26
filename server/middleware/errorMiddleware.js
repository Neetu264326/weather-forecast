import { validationResult } from 'express-validator'
import { HttpError } from '../utils/apiClient.js'

const FALLBACK = {
  400: 'Invalid request.',
  404: 'That endpoint does not exist.',
  429: 'Too many requests. Please wait and try again.',
}

/**
 * Turns express-validator failures into the same error shape every other
 * failure uses, so the client only ever parses one format.
 */
export function validate(req, res, next) {
  const result = validationResult(req)
  if (result.isEmpty()) return next()

  const first = result.array()[0]
  next(new HttpError(400, first.msg || 'Invalid request.', { code: 'validation' }))
}

export function notFound(req, res, next) {
  next(
    new HttpError(404, `Endpoint ${req.method} ${req.originalUrl} is not available.`, {
      code: 'not_found',
    }),
  )
}

/* eslint-disable no-unused-vars -- Express identifies error handlers by arity */
export function errorHandler(err, req, res, next) {
  const status = Number(err.status || err.statusCode) || 500
  const code = typeof err.code === 'string' ? err.code : 'error'

  const message = err.expose
    ? err.message
    : FALLBACK[status] || 'Weather service is temporarily unavailable.'

  if (!err.expose || status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl} → ${status}`, err)
  } else if (process.env.NODE_ENV !== 'production') {
    console.log(`[warn] ${req.method} ${req.originalUrl} → ${status}: ${message}`)
  }

  res.status(status).json({ success: false, code, message })
}
/* eslint-enable no-unused-vars */
