# Deployment

Two deploy targets from one repo:

| Piece | Host | Root directory | Notes |
|---|---|---|---|
| Express API | [Render](https://dashboard.render.com) | `server/` | blueprint file: `render.yaml` (repo root) |
| React client | [Vercel](https://vercel.com/new) (or Netlify) | `client/` | SPA rewrite: `client/vercel.json` / `netlify.toml` |

## 1. Push the repo to GitHub

```bash
git add .
git commit -m "WeatherIQ: full-stack weather intelligence dashboard"
git remote add origin <your-repo-url>
git push -u origin master
```

## 2. Deploy the API (Render)

1. Render → **New → Blueprint** → pick the repo (uses `render.yaml` automatically).
2. After the service is created, set environment variables (service → **Environment**):

| Variable | Value | Required |
|---|---|---|
| `NODE_ENV` | `production` | set by blueprint |
| `CLIENT_URL` | your Vercel URL, e.g. `https://weatheriq.vercel.app` (exact origin, no trailing `/`) | **yes** — CORS |
| `UPSTREAM_MODE` | `fixtures` (works with no key) or `live` | yes |
| `OPENWEATHER_API_KEY` | your key | only for `live` |
| `RATE_LIMIT_MAX` | `120` (per 15 min per IP) | optional |

3. Health check is `/api/health` — Render restarts the service if it stops answering.

## 3. Deploy the client (Vercel)

1. Vercel → **Add New → Project** → import the repo.
2. **Root Directory**: `client` · Framework preset: **Vite** (auto-detected).
3. Environment variables (**must be set before building**):

| Variable | Value |
|---|---|
| `VITE_API_URL` | your Render URL, e.g. `https://weatheriq-api.onrender.com` |
| `VITE_USE_MOCK` | `false` |

4. Deploy. Copy the site URL, paste it into Render's `CLIENT_URL`, redeploy the API.

> `VITE_API_URL` is baked into the bundle at build time. If it is missing the app
> logs `VITE_API_URL is not set` to the browser console and every request fails.
> `client/netlify.toml` exists as an alternative (publish `dist`, SPA redirect included).

## 4. Verify the deployment

```bash
# from your machine, against the deployed API
SMOKE_BASE=https://weatheriq-api.onrender.com npm run smoke   # in server/

# quick probes
curl https://weatheriq-api.onrender.com/api/health   # {"data":{"upstream":...}}
curl "https://weatheriq-api.onrender.com/api/weather?city=Delhi"
```

Then open the client URL: dashboard renders, header badge shows **Demo data**
only while `upstream` is `fixtures`.

## 5. Switch to real OpenWeather data

Render → Environment → set:

```
OPENWEATHER_API_KEY=<your key>
UPSTREAM_MODE=live
```

Save (service redeploys), then re-run `SMOKE_BASE=... npm run smoke` — the badge
disappears because `/api/health` now reports `upstream: "live"`.

## Troubleshooting

| Symptom | Cause → fix |
|---|---|
| Browser console: `VITE_API_URL is not set` | env var missing at Vercel build → add + redeploy |
| CORS error in console | `CLIENT_URL` on Render ≠ exact client origin (scheme, host, no trailing slash) |
| 429 responses | lower traffic window or raise `RATE_LIMIT_MAX` |
| 503 `code:"config"` | `UPSTREAM_MODE=live` without `OPENWEATHER_API_KEY` |
| Blank/error only on refresh of `/compare` | SPA rewrite missing → `vercel.json`/`netlify.toml` not applied (check root directory) |
