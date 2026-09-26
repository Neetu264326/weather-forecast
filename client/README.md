# WeatherIQ — client

React 19 + Vite frontend for the WeatherIQ dashboard.

See the root [README](../README.md) for architecture, setup and API docs, and
[DEPLOYMENT.md](../DEPLOYMENT.md) for deploying this app.

```bash
npm install
npm run dev      # http://localhost:5173 (proxies /api → :5000)
npm run lint
npm run build
```

Environment (`.env`): `VITE_API_URL` (leave empty when the API runs on the same
origin — the root `vercel.json` deploy does this), `VITE_USE_MOCK`
(`true` = frontend-only demo data, no server needed).
