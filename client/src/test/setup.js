import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => cleanup())

/* Node 25 ships a localStorage stub and jsdom may run with an opaque origin —
   install whichever real store works, otherwise fall back to memory */
class MemoryStorage {
  #map = new Map()
  get length() {
    return this.#map.size
  }
  key(index) {
    return [...this.#map.keys()][index] ?? null
  }
  getItem(key) {
    const k = String(key)
    return this.#map.has(k) ? this.#map.get(k) : null
  }
  setItem(key, value) {
    this.#map.set(String(key), String(value))
  }
  removeItem(key) {
    this.#map.delete(String(key))
  }
  clear() {
    this.#map.clear()
  }
}

const candidates = []
try {
  candidates.push(window.localStorage)
} catch {
  /* opaque origin */
}
try {
  candidates.push(globalThis.localStorage)
} catch {
  /* stub without backing file */
}
const workingStore =
  candidates.find((store) => store && typeof store.clear === 'function') ?? new MemoryStorage()
Object.defineProperty(globalThis, 'localStorage', {
  value: workingStore,
  configurable: true,
  writable: true,
})

/* jsdom does not implement these browser APIs (charts, dropdowns, themes) */
window.matchMedia ??= vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

window.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

window.scrollTo ??= () => {}
