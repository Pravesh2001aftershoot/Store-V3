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

/**
 * Returns the current cover photo plus setters.
 * `fallback` is the gallery's default cover; `library` is every photo in the gallery.
 */
export function useCoverPhoto(fallback, library) {
  const [state, setState] = useState(load) // { id?, upload?: { src, w, h, name } }

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // Upload too large for storage: keep the photo for this session, remember only the gallery choice.
      try { localStorage.setItem(KEY, JSON.stringify({ ...state, id: state.id === UPLOAD_ID ? undefined : state.id, upload: undefined })) } catch { /* ignore */ }
    }
  }, [state])

  const upload = state.upload ? { id: UPLOAD_ID, name: state.upload.name, src: state.upload.src, thumb: state.upload.src, w: state.upload.w, h: state.upload.h } : null

  const photo = useMemo(() => {
    if (state.id === UPLOAD_ID && upload) return upload
    return library.find((p) => p.id === state.id) ?? fallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, library, fallback])

  const choose = useCallback((id) => setState((s) => ({ ...s, id })), [])
  const setUpload = useCallback((u) => setState({ id: UPLOAD_ID, upload: u }), [])
  const removeUpload = useCallback(() => setState((s) => ({ id: s.id === UPLOAD_ID ? undefined : s.id })), [])
  const reset = useCallback(() => setState((s) => ({ upload: s.upload })), [])

  return { photo, upload, isDefault: photo === fallback, choose, setUpload, removeUpload, reset }
}
