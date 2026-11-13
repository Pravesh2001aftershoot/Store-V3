import { useCallback, useEffect, useMemo, useState } from 'react'
import { readJSON } from '../../lib/persisted'
import { forGallery, useGalleryId } from '../../data/galleries'

// The gallery's photo library as the photographer arranges it in the dashboard:
// which collections exist and in what order, which collection each photo is in, the photo order,
// photos taken out of the gallery, and photos uploaded in the browser.
//
// The base photos (local files or placeholders, see data/photos.js) are never changed; this is a
// layer of edits on top, so "Reset" always gets back to the original gallery.
//
//   collections — ordered collection names (null = the gallery's own list)
//   assign      — { [photoId]: collection } for photos moved out of their original collection
//   order       — photo ids in display order (null = original order). Unknown ids sort after known ones.
//   removed     — photo ids taken out of the client gallery (restorable)
//   uploads     — [{ id, name, w, h, collection, added }] — the image data itself lives in IndexedDB
//
// Storage: the manifest above in localStorage (small, synced to other tabs and the dashboard
// preview), image blobs in IndexedDB (localStorage's ~5MB can't hold photos).

const EMPTY = { collections: null, assign: {}, order: null, removed: [], uploads: [] }

const load = (key) => {
  const s = readJSON(key, {})
  return {
    collections: Array.isArray(s.collections) && s.collections.length ? s.collections : null,
    assign: s.assign && typeof s.assign === 'object' ? s.assign : {},
    order: Array.isArray(s.order) ? s.order : null,
    removed: Array.isArray(s.removed) ? s.removed : [],
    uploads: Array.isArray(s.uploads) ? s.uploads.filter((u) => u?.id) : [],
  }
}

const family = forGallery('library', load)

/** Longest edge of an uploaded photo, and of its grid thumbnail. */
export const MAX_EDGE = 2400
export const THUMB_EDGE = 720
/** Collection names are short: they're tab labels. */
export const NAME_LIMIT = 32

// ── IndexedDB (image blobs) ─────────────────────────────────────────────────
const DB = 'store-v3-media'
const OBJECTS = 'gallery-uploads'

let dbPromise
function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(OBJECTS)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbPromise
}
const tx = async (mode, fn) => {
  const d = await db()
  return new Promise((resolve, reject) => {
    const t = d.transaction(OBJECTS, mode)
    const out = fn(t.objectStore(OBJECTS))
    t.oncomplete = () => resolve(out?.result)
    t.onerror = () => reject(t.error)
  })
}
const putBlobs = (id, value) => tx('readwrite', (s) => s.put(value, id))
const getBlobs = (id) => tx('readonly', (s) => s.get(id))
const deleteBlobs = (ids) => tx('readwrite', (s) => ids.forEach((id) => s.delete(id)))

/** Decodes an image file and returns `{ full, thumb, w, h }` (JPEG blobs, downscaled). */
async function encode(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error(`${file.name} isn't an image we can read`))
      i.src = url
    })
    const at = (edge) => {
      const scale = Math.min(1, edge / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      return new Promise((resolve) => c.toBlob((b) => resolve({ blob: b, w, h }), 'image/jpeg', 0.86))
    }
    const full = await at(MAX_EDGE)
    const thumb = await at(THUMB_EDGE)
    return { full: full.blob, thumb: thumb.blob, w: full.w, h: full.h }
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Object URLs for uploaded blobs, shared by every hook instance in this document.
const urls = new Map() // id → { src, thumb }
async function resolveUploads(ids) {
  await Promise.all(
    ids.filter((id) => !urls.has(id)).map(async (id) => {
      const rec = await getBlobs(id).catch(() => null)
      if (rec) urls.set(id, { src: URL.createObjectURL(rec.full), thumb: URL.createObjectURL(rec.thumb) })
    })
  )
}

const uid = () => `up-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
const unique = (name, taken) => {
  let n = name
  for (let k = 2; taken.includes(n); k++) n = `${name} ${k}`
  return n
}

/**
 * The library, merged with the gallery's own photos.
 * `base` — the gallery's photos ({ id, collection, … }); `baseCollections` — its collection names.
 *
 * Returns `photos` (in the client gallery, ordered by collection then position), `removed`,
 * `collections`, `ready` (uploads resolved) and the actions the dashboard uses.
 */
export function useGalleryLibrary(base, baseCollections) {
  const [state, setState] = family(useGalleryId()).use()
  const [tick, setTick] = useState(0) // bumps when upload URLs resolve
  const uploadIds = state.uploads.map((u) => u.id).join('|')
  const [ready, setReady] = useState(state.uploads.every((u) => urls.has(u.id)))

  useEffect(() => {
    let alive = true
    const ids = uploadIds ? uploadIds.split('|') : []
    resolveUploads(ids).then(() => {
      if (!alive) return
      setReady(true)
      setTick((t) => t + 1)
    })
    return () => { alive = false }
  }, [uploadIds])

  const collections = state.collections ?? baseCollections

  // Every photo with its current collection, in display order (removed ones included, flagged).
  const all = useMemo(() => {
    const uploads = state.uploads
      .filter((u) => urls.has(u.id))
      .map((u) => ({ id: u.id, name: u.name, ...urls.get(u.id), w: u.w, h: u.h, ow: u.w * 2, oh: u.h * 2, collection: u.collection, uploaded: true }))
    const list = [...base, ...uploads].map((p, i) => ({ ...p, collection: state.assign[p.id] ?? p.collection, i }))
    const pos = state.order ? new Map(state.order.map((id, k) => [id, k])) : null
    const removed = new Set(state.removed)
    const known = new Set(collections)
    // A photo whose collection no longer exists goes to the first one.
    list.forEach((p) => { if (!known.has(p.collection)) p.collection = collections[0] })
    const rank = (p) => (pos?.has(p.id) ? pos.get(p.id) : Infinity)
    const sorted = list.sort((a, b) => rank(a) - rank(b) || a.i - b.i)
    return collections.flatMap((c) => sorted.filter((p) => p.collection === c)).map(({ i, ...p }) => ({ ...p, removed: removed.has(p.id) }))
  }, [base, state, collections, tick])

  const photos = useMemo(() => all.filter((p) => !p.removed), [all])
  const removed = useMemo(() => all.filter((p) => p.removed), [all])

  // ── Collections ───────────────────────────────────────────────────────────
  const withCollections = (s, fn) => ({ ...s, collections: fn(s.collections ?? baseCollections) })

  const addCollection = useCallback((name) => {
    let made
    setState((s) => withCollections(s, (list) => {
      made = unique(name.trim().slice(0, NAME_LIMIT) || 'New collection', list)
      return [...list, made]
    }))
    return made
  }, [baseCollections]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Renames a collection, keeping its photos (they're re-assigned to the new name). */
  const renameCollection = useCallback((from, to) => {
    const name = to.trim().slice(0, NAME_LIMIT)
    if (!name || name === from) return from
    let result = from
    setState((s) => {
      const list = s.collections ?? baseCollections
      if (list.includes(name)) return s
      result = name
      const assign = { ...s.assign }
      all.forEach((p) => { if (p.collection === from) assign[p.id] = name })
      return {
        ...s,
        assign,
        collections: list.map((c) => (c === from ? name : c)),
        uploads: s.uploads.map((u) => (u.collection === from ? { ...u, collection: name } : u)),
      }
    })
    return result
  }, [all, baseCollections]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Deletes a collection; its photos move to `moveTo` (they're never deleted with it). */
  const deleteCollection = useCallback((name, moveTo) => {
    setState((s) => {
      const list = s.collections ?? baseCollections
      if (list.length < 2) return s
      const target = moveTo && moveTo !== name ? moveTo : list.find((c) => c !== name)
      const assign = { ...s.assign }
      all.forEach((p) => { if (p.collection === name) assign[p.id] = target })
      return { ...s, assign, collections: list.filter((c) => c !== name) }
    })
  }, [all, baseCollections])

  const reorderCollections = useCallback((list) => setState((s) => ({ ...s, collections: list })), [setState])

  // ── Photos ────────────────────────────────────────────────────────────────
  /** Moves photos to another collection, at its end. */
  const moveTo = useCallback((ids, collection) => {
    const set = new Set(ids)
    setState((s) => {
      const assign = { ...s.assign }
      ids.forEach((id) => { assign[id] = collection })
      const order = all.map((p) => p.id).filter((id) => !set.has(id)).concat(ids)
      return { ...s, assign, order }
    })
  }, [all, setState])

  /** Sets the order of one collection's photos (ids must all be in that collection). */
  const reorder = useCallback((collection, ids) => {
    setState((s) => {
      const rest = all.filter((p) => p.collection !== collection).map((p) => p.id)
      const before = all.findIndex((p) => p.collection === collection)
      const at = before === -1 ? rest.length : before // `all` is grouped by collection
      return { ...s, order: [...rest.slice(0, at), ...ids, ...rest.slice(at)] }
    })
  }, [all, setState])

  const remove = useCallback((ids) => setState((s) => ({ ...s, removed: [...new Set([...s.removed, ...ids])] })), [setState])
  const restore = useCallback((ids) => {
    const set = new Set(ids)
    setState((s) => ({ ...s, removed: s.removed.filter((id) => !set.has(id)) }))
  }, [setState])

  /** Deletes uploaded photos for good (gallery photos can only be removed, not deleted). */
  const deleteUploads = useCallback(async (ids) => {
    const set = new Set(ids)
    setState((s) => ({ ...s, uploads: s.uploads.filter((u) => !set.has(u.id)), removed: s.removed.filter((id) => !set.has(id)) }))
    ids.forEach((id) => {
      const u = urls.get(id)
      if (u) { URL.revokeObjectURL(u.src); URL.revokeObjectURL(u.thumb); urls.delete(id) }
    })
    await deleteBlobs(ids).catch(() => {})
  }, [setState])

  /**
   * Adds image files to `collection`. Resolves to `{ added, failed }`.
   * `onProgress(done, total)` is called after each file.
   */
  const addFiles = useCallback(async (files, collection, onProgress) => {
    const list = [...files].filter((f) => f.type.startsWith('image/'))
    const added = []
    let failed = files.length - list.length
    for (const [k, file] of list.entries()) {
      try {
        const { full, thumb, w, h } = await encode(file)
        const id = uid()
        await putBlobs(id, { full, thumb })
        urls.set(id, { src: URL.createObjectURL(full), thumb: URL.createObjectURL(thumb) })
        added.push({ id, name: file.name, w, h, collection, added: Date.now() })
      } catch {
        failed++
      }
      onProgress?.(k + 1, list.length)
    }
    if (added.length) setState((s) => ({ ...s, uploads: [...s.uploads, ...added] }))
    return { added: added.length, failed }
  }, [setState])

  /** Back to the gallery as delivered. Uploads stay (they're only removed by deleting them). */
  const reset = useCallback(() => setState((s) => ({
    ...EMPTY,
    uploads: s.uploads.map((u) => (baseCollections.includes(u.collection) ? u : { ...u, collection: baseCollections[0] })),
  })), [setState, baseCollections])

  const edited = !!(state.collections || state.order || state.removed.length || Object.keys(state.assign).length)

  return {
    photos, removed, all, collections, ready, edited, uploads: state.uploads.length,
    addCollection, renameCollection, deleteCollection, reorderCollections,
    moveTo, reorder, remove, restore, deleteUploads, addFiles, reset,
  }
}

/** Deletes a gallery's uploaded images from IndexedDB (when the gallery itself is deleted). */
export async function purgeUploads(key) {
  const ids = (readJSON(key, {}).uploads ?? []).map((u) => u?.id).filter(Boolean)
  ids.forEach((id) => { const u = urls.get(id); if (u) { URL.revokeObjectURL(u.src); URL.revokeObjectURL(u.thumb); urls.delete(id) } })
  if (ids.length) await deleteBlobs(ids).catch(() => {})
}
