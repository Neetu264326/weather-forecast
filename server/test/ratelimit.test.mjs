/**
 * Rate limiting: a dedicated app instance with a tiny budget.
 * (Separate file → separate test process → its own env.)
 */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'

process.env.NODE_ENV = 'test'
process.env.UPSTREAM_MODE = 'fixtures'
process.env.RATE_LIMIT_MAX = '3'
process.env.RATE_LIMIT_WINDOW_MS = '60000'

const { default: app } = await import('../server.js')

let server
let base

before(async () => {
  server = app.listen(0)
  await new Promise((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })
  base = `http://127.0.0.1:${server.address().port}`
})

after(() => new Promise((resolve) => server.close(resolve)))

test('allows RATE_LIMIT_MAX requests, then answers 429 with the error envelope', async () => {
  const statuses = []
  for (let i = 0; i < 5; i += 1) {
    const res = await fetch(`${base}/api/weather?city=Delhi`)
    statuses.push(res.status)
    if (i === 4) {
      const body = await res.json()
      assert.equal(body.success, false)
      assert.equal(body.code, 'limit')
      assert.match(body.message, /Too many requests/)
      assert.ok(res.headers.get('ratelimit') || res.headers.get('ratelimit-limit'))
    }
  }
  assert.deepEqual(statuses, [200, 200, 200, 429, 429])
})
