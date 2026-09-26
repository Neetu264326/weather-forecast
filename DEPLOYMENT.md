# Deployment

One Vercel project serves the whole app — React client **and** the Express API — from a single origin.

| Piece | Host | Where it lives | Notes |
|---|---|---|---|
| React client | [Vercel](https://vercel.com/new) | `client/` → built to `client/dist` | config: `vercel.json` (repo root) |
| Express API | Vercel Functions | `api/*.js` → `server/` | fixtures mode, no key needed |

## How it is wired

- `vercel.json` (root) — project root is the repo root: installs both workspaces, runs
  `vite build`, publishes `client/dist`, and rewrites every non-`/api` path to
  `/index.html` (SPA fallback). `/api/*` is excluded from the rewrite so it reaches the
  functions.
- `api/[...slug].js` — mounts the Express app for every single-segment `/api/*` route.
- `api/weather/coordinates.js`, `api/forecast/coordinates.js` — the two multi-segment
  routes (Vercel's `api/` router matches `[...slug]` to one segment only).
- `server/vercel.js` — the shared handler: normalises the request path, then hands off
  to the Express app exported by `server/server.js`.
- `client/vercel.json` and `client/netlify.toml` are only used if you deploy the client
  on its own; the root `vercel.json` wins for this project.

## Redeploy

```bash
vercel deploy --prod --yes
```

## Environment variables (project → Settings → Environment Variables)

| Variable | Value | Required |
|---|---|---|
| `UPSTREAM_MODE` | `fixtures` (demo data, no key) or `live` | **yes** — defaults to `live` |
| `OPENWEATHER_API_KEY` | your key from <https://openweathermap.org/api> | only for `live` |
| `CLIENT_URL` | your production origin, e.g. `https://weather-forecast-eta-seven.vercel.app` | CORS, exact origin |

`VITE_API_URL` is intentionally **not** set: the client calls `/api` on its own domain.
`VITE_USE_MOCK` stays unset so the real backend serves the data.

## Verify

```bash
cd server
SMOKE_BASE=https://<your-production-domain> npm run smoke   # 11 end-to-end checks
```

Open the site: the header badge shows **Demo data** while `upstream` is `fixtures`.

## Switch to live OpenWeather data

1. Set `OPENWEATHER_API_KEY` and `UPSTREAM_MODE=live` in the project's environment.
2. Redeploy (`vercel deploy --prod --yes`).
3. Re-run `SMOKE_BASE=... npm run smoke` — `/api/health` now reports `upstream: "live"`.

## Alternative: Render API + Vercel client

`render.yaml` still deploys the API on Render instead (blueprint, health check on
`/api/health`). In that split setup set `VITE_API_URL` on Vercel to the Render URL and
`CLIENT_URL` on Render to the Vercel URL before building.

## Troubleshooting

| Symptom | Cause → fix |
|---|---|
| `/api/*` returns the SPA's `index.html` | SPA rewrite no longer excludes `/api` → restore `"/((?!api/).*)"` in root `vercel.json` |
| `/api/weather/coordinates` → empty 404 | multi-segment routes need their own file under `api/` (see wiring above) |
| `503 code:"config"` | `UPSTREAM_MODE=live` without `OPENWEATHER_API_KEY` |
| Badge says *Demo data* after adding a key | env var changed but not redeployed → redeploy |
| 429 responses | raise `RATE_LIMIT_MAX` in the project environment |
