import { pathToFileURL } from 'node:url'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import { env, reportEnv } from './config/env.js'
import { health } from './controllers/weatherController.js'
import { errorHandler, notFound } from './middleware/errorMiddleware.js'
import weatherRoutes from './routes/weatherRoutes.js'

const app = express()

app.disable('x-powered-by')
/* Render/ Railway terminate TLS upstream — required for correct client IPs */
app.set('trust proxy', 1)

if (env.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`[req] ${req.method} ${req.originalUrl}`)
    next()
  })
}

app.use(
  cors({
    origin: env.clientUrls,
    methods: ['GET', 'OPTIONS'],
    optionsSuccessStatus: 200,
  }),
)

app.use(express.json({ limit: '10kb' }))

/* liveness probe before the rate limiter so hosting health checks never 429 */
app.get('/api/health', health)

app.use(
  '/api',
  rateLimit({
    windowMs: env.rateWindowMs,
    limit: env.rateMax,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      code: 'limit',
      message: 'Too many requests from this address. Please wait and try again.',
    },
  }),
)

app.use('/api', weatherRoutes)

app.use(notFound)
app.use(errorHandler)

/* listen only when executed directly (tests import the app on an ephemeral port) */
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isMain) {
  const server = app.listen(env.port, () => {
    reportEnv()
    console.log(`[api] listening on http://localhost:${env.port}`)
  })

  const shutdown = () => {
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(1), 5000).unref()
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

export default app
