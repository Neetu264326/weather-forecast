import app from './server.js'

export default function handler(req, res) {
  const url = req.url || '/'
  if (!url.startsWith('/api')) {
    const [path, query] = url.split('?')
    req.url = `/api${path.startsWith('/') ? path : `/${path}`}${query ? `?${query}` : ''}`
  }
  return app(req, res)
}
