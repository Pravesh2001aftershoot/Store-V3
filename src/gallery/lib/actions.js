import { useCallback, useEffect, useState } from 'react'

// ── Toasts ──────────────────────────────────────────────────────────────────
// A tiny pub/sub so any component can show a message without prop drilling.
const listeners = new Set()
export function notify(message) {
  listeners.forEach((fn) => fn(message))
}
export function useToasts() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    const on = (message) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((t) => [...t, { id, message }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
    }
    listeners.add(on)
    return () => listeners.delete(on)
  }, [])
  return toasts
}

// ── Download ────────────────────────────────────────────────────────────────
/** Fetches the full-size photo and saves it. Throws if the fetch fails. Returns the file name. */
async function saveFile(photo) {
  const res = await fetch(photo.src)
  if (!res.ok) throw new Error(res.statusText)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = photo.name.includes('.') ? photo.name : `${photo.name}.jpg`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return a.download
}

/** Downloads the full-size photo. Falls back to opening it in a new tab if the fetch fails. */
export async function downloadPhoto(photo) {
  try {
    notify(`Downloading ${await saveFile(photo)}`)
  } catch {
    window.open(photo.src, '_blank', 'noopener')
  }
}

/**
 * Downloads several photos, one after another (browsers throttle a burst of simultaneous downloads).
 * No new-tab fallback here — a tab per photo would trip the popup blocker — so failures are just counted.
 */
export async function downloadPhotos(photos) {
  if (photos.length === 1) return downloadPhoto(photos[0])
  notify(`Downloading ${photos.length} photos…`)
  let failed = 0
  for (const p of photos) {
    try {
      await saveFile(p)
    } catch {
      failed++
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  if (failed) notify(`${failed} of ${photos.length} photos couldn’t be downloaded`)
}

// ── Share ───────────────────────────────────────────────────────────────────
/**
 * Shares the photo with the native share sheet (as a file where supported, e.g. mobile),
 * otherwise copies a link to the clipboard.
 */
export async function sharePhoto(photo) {
  const url = new URL(photo.src, window.location.href).href
  const title = photo.name
  try {
    if (navigator.share) {
      try {
        const blob = await (await fetch(photo.src)).blob()
        const file = new File([blob], photo.name, { type: blob.type || 'image/jpeg' })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title })
          return
        }
      } catch (e) {
        if (e?.name === 'AbortError') return
      }
      await navigator.share({ title, url })
      return
    }
    await navigator.clipboard.writeText(url)
    notify('Link copied to clipboard')
  } catch (e) {
    if (e?.name !== 'AbortError') notify('Couldn’t share this photo')
  }
}

/** Max photos sent as files to the native share sheet; above that we share links instead. */
const SHARE_FILES_MAX = 10

/** Shares several photos: as files where the share sheet supports it, otherwise as a list of links. */
export async function sharePhotos(photos) {
  if (photos.length === 1) return sharePhoto(photos[0])
  const title = `${photos.length} photos`
  const links = photos.map((p) => new URL(p.src, window.location.href).href).join('\n')
  try {
    if (navigator.share) {
      if (photos.length <= SHARE_FILES_MAX) {
        try {
          const files = await Promise.all(
            photos.map(async (p) => {
              const blob = await (await fetch(p.src)).blob()
              return new File([blob], p.name, { type: blob.type || 'image/jpeg' })
            })
          )
          if (navigator.canShare?.({ files })) {
            await navigator.share({ files, title })
            return
          }
        } catch (e) {
          if (e?.name === 'AbortError') return
        }
      }
      await navigator.share({ title, text: links })
      return
    }
    await navigator.clipboard.writeText(links)
    notify(`${photos.length} links copied to clipboard`)
  } catch (e) {
    if (e?.name !== 'AbortError') notify('Couldn’t share these photos')
  }
}

// ── Favourites & hidden photos (each a set of photo ids, persisted per gallery) ──
function usePersistedIds(storageKey) {
  const [ids, setIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'))
    } catch {
      return new Set()
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...ids]))
    } catch {
      /* storage unavailable — the set lasts for this visit only */
    }
  }, [ids, storageKey])

  const toggle = useCallback(
    (id) =>
      setIds((s) => {
        const n = new Set(s)
        n.has(id) ? n.delete(id) : n.add(id)
        return n
      }),
    []
  )
  const clear = useCallback(() => setIds(new Set()), [])
  /** Adds (`on`) or removes every id in `list` at once. */
  const setMany = useCallback(
    (list, on) =>
      setIds((s) => {
        const n = new Set(s)
        list.forEach((id) => (on ? n.add(id) : n.delete(id)))
        return n
      }),
    []
  )
  return [ids, toggle, clear, setMany]
}

export const useFavorites = (key) => usePersistedIds(`gallery-favs:${key}`)
export const useHidden = (key) => usePersistedIds(`gallery-hidden:${key}`)

// ── Sets (named, client-made groups of photos, persisted per gallery) ─────────
export const MAX_SETS = 2

export function useSets(key) {
  const storageKey = `gallery-sets:${key}`
  const [sets, setSets] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem(storageKey) || '[]')
      return Array.isArray(v) ? v.slice(0, MAX_SETS) : []
    } catch {
      return []
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(sets))
    } catch {
      /* storage unavailable — sets last for this visit only */
    }
  }, [sets, storageKey])

  /** Creates a set from `ids`. Returns it, or null when the limit is reached. */
  const create = useCallback(
    (name, ids) => {
      if (sets.length >= MAX_SETS) return null
      const set = { id: Math.random().toString(36).slice(2, 10), name, ids: [...ids] }
      setSets((s) => (s.length >= MAX_SETS ? s : [...s, set]))
      return set
    },
    [sets.length]
  )
  const remove = useCallback((id) => setSets((s) => s.filter((x) => x.id !== id)), [])
  return [sets, create, remove]
}
