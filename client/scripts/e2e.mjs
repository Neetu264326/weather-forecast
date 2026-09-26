/*
  Scripted headless-browser E2E suite (no extra dependencies).
    1. boots the Express API in fixtures mode on E2E_API_PORT
    2. boots Vite dev on E2E_WEB_PORT proxying /api to that API
    3. loads every route in headless Edge (--dump-dom) and asserts markers
    4. also checks the API is reachable through the Vite proxy
  Exit code 0 = all checks passed.  Usage: npm run test:e2e
*/

import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientRoot = path.resolve(__dirname, '..')
const serverRoot = path.resolve(clientRoot, '..', 'server')

const API_PORT = Number(process.env.E2E_API_PORT || 5051)
const WEB_PORT = Number(process.env.E2E_WEB_PORT || 5175)
const API_URL = `http://localhost:${API_PORT}`
const WEB_URL = `http://localhost:${WEB_PORT}`
const EDGE =
  process.env.EDGE_PATH ||
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'

const VIRTUAL_TIME_BUDGET = 12000
const EDGE_TIMEOUT_MS = 40000
const SERVER_READY_TIMEOUT_MS = 60000

/* route → substrings that must appear in the dumped DOM */
const ROUTES = [
  { path: '/', name: 'dashboard', markers: ['id="now-title"', 'New Delhi', 'Demo data'] },
  { path: '/favorites', name: 'favorites', markers: ['Saved cities'] },
  { path: '/compare', name: 'compare', markers: ['Compare cities'] },
  { path: '/about', name: 'about', markers: ['About WeatherIQ'] },
  { path: '/definitely-not-a-page', name: '404', markers: ['Page not found'] },
]

const children = []
const profileDirs = []
let failed = 0

const log = (msg) => console.log(msg)
const pass = (msg) => log(`  ok   ${msg}`)
const fail = (msg) => {
  failed += 1
  log(`  FAIL ${msg}`)
}

function start(name, cmd, args, opts) {
  const child = spawn(cmd, args, { cwd: opts.cwd, env: opts.env, windowsHide: true })
  children.push({ name, child })
  child.stdout?.on('data', () => {})
  child.stderr?.on('data', () => {})
  child.on('error', (err) => fail(`${name} failed to start: ${err.message}`))
  return child
}

function killAll() {
  for (const { child } of children) {
    if (child.exitCode === null && !child.killed) {
      try {
        if (process.platform === 'win32') {
          spawnSyncTaskKill(child.pid)
        } else {
          child.kill('SIGTERM')
        }
      } catch {
        /* best effort */
      }
    }
  }
  for (const dir of profileDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true })
    } catch {
      /* best effort */
    }
  }
}

function spawnSyncTaskKill(pid) {
  /* /T kills the whole tree — Edge and vite both fork children */
  spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { windowsHide: true })
}

function get(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = ''
      res.on('data', (d) => (body += d))
      res.on('end', () => resolve({ status: res.statusCode, body }))
    })
    req.on('error', reject)
    req.setTimeout(5000, () => req.destroy(new Error('timeout')))
  })
}

async function waitFor(name, url, timeoutMs = SERVER_READY_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await get(url)
      if (res.status && res.status < 500) return true
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  fail(`${name} did not become ready within ${timeoutMs}ms (${url})`)
  return false
}

function dumpDom(url) {
  return new Promise((resolve) => {
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-edge-'))
    profileDirs.push(profile)
    const child = spawn(
      EDGE,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        `--user-data-dir=${profile}`,
        `--virtual-time-budget=${VIRTUAL_TIME_BUDGET}`,
        '--dump-dom',
        url,
      ],
      { windowsHide: true },
    )
    let out = ''
    let done = false
    const finish = (value) => {
      if (done) return
      done = true
      clearTimeout(timer)
      try {
        if (child.exitCode === null) child.kill()
      } catch {
        /* already gone */
      }
      resolve(value)
    }
    const timer = setTimeout(() => finish(''), EDGE_TIMEOUT_MS)
    child.stdout.on('data', (d) => (out += d))
    child.on('error', () => finish(''))
    child.on('close', () => finish(out))
  })
}

async function main() {
  if (!fs.existsSync(EDGE)) {
    console.error(`Edge not found at ${EDGE} — set EDGE_PATH to msedge.exe`)
    process.exit(2)
  }

  log('E2E: starting API (fixtures mode)…')
  start('api', process.execPath, ['server.js'], {
    cwd: serverRoot,
    env: {
      ...process.env,
      PORT: String(API_PORT),
      UPSTREAM_MODE: 'fixtures',
      CLIENT_URL: WEB_URL,
      NODE_ENV: 'development',
    },
  })

  const apiReady = await waitFor('API', `${API_URL}/api/health`)
  if (apiReady) {
    try {
      const res = await get(`${API_URL}/api/health`)
      const health = JSON.parse(res.body)
      if (health?.data?.upstream === 'fixtures') pass('API health reports upstream=fixtures')
      else fail(`API health upstream: ${health?.data?.upstream}`)
    } catch (err) {
      fail(`API health unreadable: ${err.message}`)
    }
  }

  log('E2E: starting Vite dev server…')
  start('vite', process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(WEB_PORT), '--strictPort'], {
    cwd: clientRoot,
    env: { ...process.env, API_PROXY_TARGET: API_URL },
  })

  const webReady = await waitFor('Vite', `${WEB_URL}/`)
  if (webReady) {
    try {
      const res = await get(`${WEB_URL}/api/health`)
      if (res.status === 200) pass('API reachable through the Vite proxy')
      else fail(`Vite proxy /api/health → HTTP ${res.status}`)
    } catch (err) {
      fail(`Vite proxy check failed: ${err.message}`)
    }
  }

  if (apiReady && webReady) {
    log('E2E: loading routes in headless Edge…')
    for (const route of ROUTES) {
      const url = `${WEB_URL}${route.path}`
      const dom = await dumpDom(url)
      if (!dom) {
        fail(`${route.name} (${route.path}) — empty DOM dump`)
        continue
      }
      const missing = route.markers.filter((m) => !dom.includes(m))
      if (missing.length === 0) {
        pass(`${route.name} (${route.path}) — ${route.markers.length} markers found`)
      } else {
        fail(`${route.name} (${route.path}) — missing: ${missing.join(', ')}`)
        const snippet = dom.replace(/\s+/g, ' ').slice(0, 400)
        log(`        body starts: ${snippet}`)
      }
    }
  }

  killAll()

  const total = ROUTES.length + 2
  log('')
  if (failed === 0) {
    log(`E2E: all ${total} checks passed`)
    process.exit(0)
  } else {
    log(`E2E: ${failed} of ${total} checks failed`)
    process.exit(1)
  }
}

process.on('SIGINT', () => {
  killAll()
  process.exit(130)
})

main().catch((err) => {
  console.error(err)
  killAll()
  process.exit(1)
})
