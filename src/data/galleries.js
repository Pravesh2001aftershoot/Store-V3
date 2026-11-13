import { createContext, createElement, useCallback, useContext, useSyncExternalStore } from 'react'
import { persisted, persistedFamily, readJSON } from '../lib/persisted'
import { gallery as sample } from './gallery'

// Every client gallery the photographer has made, and which one a page is showing.
//
// The registry holds each gallery's own details; everything else about a gallery (photos, cover,
// grid, headings, footer) is saved per gallery under `galleryKey(id, name)`. The first gallery is
// the original sample, and keeps the storage keys it had before galleries existed, so nothing
// saved earlier is lost.
//
//   { id, title, client, date, collections, catalogId, sample, created }
//   sample — starts with the bundled sample photos (otherwise it starts empty: uploads only)

export const DEFAULT_GALLERY = 'lexie-taylor'
export const DEFAULT_CATALOG = 'default'
export const LIMITS = { title: 60, client: 40, date: 30, collection: 32 }

const KEY = 'store-v3:galleries'

const SAMPLE = {
  id: DEFAULT_GALLERY,
  title: sample.title,
  client: sample.client,
  date: sample.date,
  collections: sample.collections.filter((c) => c !== 'All'),
  catalogId: DEFAULT_CATALOG,
  sample: true,
  created: Date.UTC(2026, 8, 20),
}

const load = (key) => {
  const saved = readJSON(key, null)
  if (!Array.isArray(saved)) return [SAMPLE]
  const list = saved.filter((g) => g?.id && g.title).map((g) => ({
    ...g,
    collections: Array.isArray(g.collections) && g.collections.length ? g.collections : ['Highlights'],
    catalogId: g.catalogId || DEFAULT_CATALOG,
  }))
  return list.length ? list : [SAMPLE]
}

const registry = persisted(KEY, load)

/** Storage key for one of a gallery's settings. The sample gallery keeps its original keys. */
export const galleryKey = (id, name) => (id === DEFAULT_GALLERY ? `store-v3:gallery-${name}` : `store-v3:gallery:${id}:${name}`)
/** Per-gallery settings names (see galleryKey). Used to clean up when a gallery is deleted. */
export const GALLERY_SETTINGS = ['library', 'cover', 'cover-photo', 'sections', 'footer', 'grid']

/** A persisted value per gallery: `forGallery('cover', load)(galleryId)`. */
export const forGallery = (name, loadFn, save) => persistedFamily((id) => galleryKey(id, name), loadFn, save)

/** The full gallery object pages render with: registry details plus the studio's branding. */
export const withBranding = (meta) => ({
  studio: sample.studio,
  logo: sample.logo,
  photographer: sample.photographer,
  ...meta,
  collections: ['All', ...meta.collections],
})

export const getGalleries = () => registry.get()
export const getGallery = (id) => registry.get().find((g) => g.id === id) ?? null

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40) || 'gallery'

/** All galleries plus actions. */
export function useGalleries() {
  const [list, setList] = registry.use()

  const create = useCallback((fields) => {
    const taken = new Set(registry.get().map((g) => g.id))
    let id = slug(fields.title)
    for (let k = 2; taken.has(id); k++) id = `${slug(fields.title)}-${k}`
    const g = {
      id,
      title: fields.title.trim().slice(0, LIMITS.title),
      client: (fields.client?.trim() || fields.title.trim()).slice(0, LIMITS.client),
      date: fields.date?.trim().slice(0, LIMITS.date) || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      collections: fields.collections?.length ? fields.collections : ['Highlights'],
      catalogId: fields.catalogId || DEFAULT_CATALOG,
      sample: !!fields.sample,
      created: Date.now(),
    }
    setList((l) => [g, ...l])
    return g
  }, [setList])

  const update = useCallback((id, patch) => setList((l) => l.map((g) => (g.id === id ? { ...g, ...patch } : g))), [setList])

  /** Removes a gallery and its saved settings. The last gallery can't be removed. */
  const remove = useCallback((id) => {
    if (registry.get().length < 2) return false
    setList((l) => l.filter((g) => g.id !== id))
    GALLERY_SETTINGS.forEach((name) => { try { localStorage.removeItem(galleryKey(id, name)) } catch { /* ignore */ } })
    return true
  }, [setList])

  /** Galleries using a catalog that's been deleted go back to the default catalog. */
  const reassignCatalog = useCallback((from, to = DEFAULT_CATALOG) => setList((l) => l.map((g) => (g.catalogId === from ? { ...g, catalogId: to } : g))), [setList])

  return { galleries: list, create, update, remove, reassignCatalog }
}

export const subscribeGalleries = registry.subscribe

// ── Which gallery a page is showing ─────────────────────────────────────────

const Ctx = createContext(DEFAULT_GALLERY)

/** Everything inside renders for gallery `id` (settings hooks read it from here). */
export const GalleryProvider = ({ id, children }) => createElement(Ctx.Provider, { value: id }, children)
export const useGalleryId = () => useContext(Ctx)

/** The gallery the client is browsing, so the print store can use its catalog and link back to it. */
const ACTIVE = 'store-v3:active-gallery'
let active = (() => { try { return sessionStorage.getItem(ACTIVE) } catch { return null } })()
const activeSubs = new Set()
export const getActiveGalleryId = () => (active && getGallery(active) ? active : registry.get()[0].id)
export const setActiveGallery = (id) => {
  if (id === active) return
  active = id
  try { sessionStorage.setItem(ACTIVE, id) } catch { /* ignore */ }
  activeSubs.forEach((fn) => fn())
}
export const subscribeActiveGallery = (fn) => { activeSubs.add(fn); return () => activeSubs.delete(fn) }

/** The gallery the client is browsing (full object), for the store's banner and "Back to gallery". */
export function useActiveGallery() {
  useSyncExternalStore(subscribeActiveGallery, () => active)
  const [list] = registry.use()
  const id = getActiveGalleryId()
  return withBranding(list.find((g) => g.id === id) ?? list[0])
}

/** Client URL for a gallery. */
export const galleryPath = (id) => `/g/${id}`
