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
/** Downloads the full-size photo. Falls back to opening it in a new tab if the fetch fails. */
export async function downloadPhoto(photo) {
  try {
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
    notify(`Downloading ${a.download}`)
  } catch {
    window.open(photo.src, '_blank', 'noopener')
  }
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

// ── Favourites (persisted per gallery) ──────────────────────────────────────
export function useFavorites(key) {
  const storageKey = `gallery-favs:${key}`
  const [favorites, setFavorites] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'))
    } catch {
      return new Set()
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...favorites]))
    } catch {
      /* storage unavailable — favourites last for this visit only */
    }
  }, [favorites, storageKey])

  const toggle = useCallback(
    (id) =>
      setFavorites((s) => {
        const n = new Set(s)
        n.has(id) ? n.delete(id) : n.add(id)
        return n
      }),
    []
  )
  const clear = useCallback(() => setFavorites(new Set()), [])
  return [favorites, toggle, clear]
}
