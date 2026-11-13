import { useSyncExternalStore } from 'react'

// A value saved to localStorage and shared by every component that reads it.
//
// - Every hook instance in a document sees the same value (no per-component copies drifting apart).
// - Other documents on the same origin (another tab, or the dashboard's preview iframe) pick up
//   changes through the `storage` event, so a live preview follows the editor without reloading.
//   Values that arrive from another document are not written back, so two documents never echo.
//
// `load(key)` reads and sanitises the stored value (it must never throw); `save(key, value)` writes it
// and may fall back to a smaller value when storage is full.

const defaultSave = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* private mode / full: just won't persist */ }
}

export function persisted(key, load, save = defaultSave) {
  let value = load(key)
  const subs = new Set()
  const emit = () => subs.forEach((fn) => fn())

  const set = (next) => {
    const v = typeof next === 'function' ? next(value) : next
    if (Object.is(v, value)) return
    value = v
    save(key, v)
    emit()
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== key && e.key !== null) return // null: storage was cleared
      value = load(key)
      emit()
    })
  }

  const subscribe = (fn) => {
    subs.add(fn)
    return () => subs.delete(fn)
  }
  const get = () => value

  /** `[value, set]`, like useState — `set` takes a value or an updater. */
  const use = () => [useSyncExternalStore(subscribe, get, get), set]

  return { get, set, use, subscribe }
}

/** Reads JSON from localStorage, or `fallback` when missing or unreadable. */
export const readJSON = (key, fallback = null) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

/**
 * A family of persisted values, one per id (e.g. one cover config per gallery). `keyOf(id)` names
 * the storage key; each id's value is created on first use and then shared like `persisted()`.
 */
export function persistedFamily(keyOf, load, save) {
  const cache = new Map()
  return (id) => {
    const key = keyOf(id)
    if (!cache.has(key)) cache.set(key, persisted(key, load, save))
    return cache.get(key)
  }
}
