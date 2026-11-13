import { useCallback, useEffect, useMemo, useState } from 'react'

// The cover photo: the gallery's default, any gallery photo, or an image uploaded from this computer.
//
// The choice is saved to this browser. A gallery photo is stored by id. An upload is shrunk to
// MAX_EDGE and stored as a JPEG data URL; if that's too big for storage it still works until reload.

const KEY = 'store-v3:gallery-cover-photo'
const MAX_EDGE = 2400
export const UPLOAD_ID = 'upload'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {}
  } catch {
    return {}
  }
}

/** Reads an image file and returns a downscaled JPEG data URL with its size. */
export function readImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve({ src: canvas.toDataURL('image/jpeg', 0.85), w, h })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Not an image we can read'))
    }
    img.src = url
  })
}

export const CENTER = { x: 50, y: 50 }

/**
 * Returns the cover photos plus setters.
 * `fallback` is the gallery's default cover; `library` is every photo in the gallery.
 *
 * `slots` holds every photo a cover can show: slot 0 is the main cover photo, slots 1–2 are only
 * used by multi-photo layouts and default to the gallery photos that follow the main one.
 * Each photo carries its `focus` ({ x, y } in %), the point kept in view when it's cropped.
 * Focal points are saved per photo, so they survive switching photos back and forth.
 */
export function useCoverPhoto(fallback, library) {
  const [state, setState] = useState(load) // { id?, extra?: [id, id], upload?: { src, w, h, name }, focus?: { [id]: { x, y } } }

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // Upload too large for storage: keep it for this session, remember everything else.
      const drop = (id) => (id === UPLOAD_ID ? undefined : id)
      try { localStorage.setItem(KEY, JSON.stringify({ ...state, id: drop(state.id), extra: state.extra?.map(drop), upload: undefined })) } catch { /* ignore */ }
    }
  }, [state])

  const upload = useMemo(
    () => (state.upload ? { id: UPLOAD_ID, name: state.upload.name, src: state.upload.src, thumb: state.upload.src, w: state.upload.w, h: state.upload.h } : null),
    [state.upload]
  )

  const slots = useMemo(() => {
    const find = (id) => (id === UPLOAD_ID ? upload : library.find((p) => p.id === id)) ?? null
    const main = find(state.id) ?? fallback
    const used = new Set([main.id])
    const start = Math.max(0, library.findIndex((p) => p.id === main.id) + 1)
    const next = () => {
      for (let k = 0; k < library.length; k++) {
        const p = library[(start + k) % library.length]
        if (!used.has(p.id)) return p
      }
      return main
    }
    const list = [main]
    for (let k = 0; k < 2; k++) {
      const p = find(state.extra?.[k]) ?? next()
      used.add(p.id)
      list.push(p)
    }
    return list.map((p) => ({ ...p, focus: state.focus?.[p.id] ?? CENTER }))
  }, [state, upload, library, fallback])

  /** Puts photo `id` in `slot` (0 = main cover photo). */
  const choose = useCallback((id, slot = 0) => setState((s) => {
    if (slot === 0) return { ...s, id }
    const extra = [...(s.extra ?? [])]
    extra[slot - 1] = id
    return { ...s, extra }
  }), [])
  const setUpload = useCallback((u, slot = 0) => setState((s) => {
    const focus = { ...s.focus }
    delete focus[UPLOAD_ID] // a new image starts centered
    const next = { ...s, upload: u, focus }
    if (slot === 0) return { ...next, id: UPLOAD_ID }
    const extra = [...(s.extra ?? [])]
    extra[slot - 1] = UPLOAD_ID
    return { ...next, extra }
  }), [])
  const removeUpload = useCallback(() => setState((s) => {
    const drop = (id) => (id === UPLOAD_ID ? undefined : id)
    const focus = { ...s.focus }
    delete focus[UPLOAD_ID]
    return { ...s, id: drop(s.id), extra: s.extra?.map(drop), upload: undefined, focus }
  }), [])
  const setFocus = useCallback((id, point) => setState((s) => ({ ...s, focus: { ...s.focus, [id]: point } })), [])
  const reset = useCallback(() => setState((s) => ({ upload: s.upload })), [])

  return { photo: slots[0], slots, upload, isDefault: slots[0].id === fallback.id, choose, setUpload, removeUpload, setFocus, reset }
}
