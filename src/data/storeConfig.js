import { useCallback, useLayoutEffect, useMemo, useSyncExternalStore } from 'react'
import { persisted, readJSON } from '../lib/persisted'
import { categories, packageById, packages, productById, products } from './catalog'
import { DEFAULT_CATALOG, getActiveGalleryId, getGallery, subscribeActiveGallery, subscribeGalleries } from './galleries'

// Store settings: the photographer's catalogs, made in the dashboard's Store section.
//
// catalog.js stays the "as delivered" catalog. A catalog is a set of edits on top of it — which
// products and packages are offered, in what order, at what prices — plus packages the photographer
// built themselves. Each gallery sells from one catalog (gallery.catalogId).
//
//   { catalogs: [{ id, name, created,
//       products     — { [productId]: { hidden, name, tagline, badge, prices: { [optionId]: { [valueId]: number } }, off: { [optionId]: [valueId] } } }
//       order        — product ids in shop order (null = catalog order)
//       packages     — { [packageId]: { hidden, name, tagline, discount, popular } }
//       packageOrder — package ids in order (null = catalog order)
//       custom       — packages made in the dashboard: [{ id, name, tagline, discount, hero, slots, custom: true }]
//   }] }
//
// The *active* catalog is applied in place to the same objects every store page and lib/pricing.js
// already read, so nothing else needs to change. Which one is active, first match wins:
//   1. the dashboard, while it edits a catalog (`useStoreConfig(id)`)
//   2. `?catalog=<id>` on a store URL (the dashboard's "Preview"), for the rest of that browser tab
//   3. the catalog of the gallery the client came from
//   4. the default catalog
//
// Hidden products and packages leave the shop lists but stay in `productById` / `packageById`, so
// cart lines and packages that already use them still resolve and price correctly. Every catalog's
// custom packages are registered in `packageById` for the same reason.

const KEY = 'store-v3:store'

export const LIMITS = { name: 32, tagline: 80, badge: 16, catalog: 40, qty: 50, slots: 6 }
/** Package discount range, as a fraction. */
export const DISCOUNT = { min: 0, max: 0.4, step: 0.01 }
export { DEFAULT_CATALOG }

const clone = (v) => JSON.parse(JSON.stringify(v))
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})

/** The catalog as delivered — what "Reset" goes back to, and what the dashboard compares against. */
export const original = {
  products: products.map(clone),
  packages: packages.map(clone),
  productById: Object.fromEntries(products.map((p) => [p.id, clone(p)])),
  packageById: Object.fromEntries(packages.map((p) => [p.id, clone(p)])),
}

const blank = (id, name) => ({ id, name, created: Date.now(), products: {}, order: null, packages: {}, packageOrder: null, custom: [] })

const validSlot = (s) => s && productById[s.productId] && Number.isFinite(s.qty) && s.qty > 0
const readCatalog = (c) => ({
  id: String(c.id),
  name: typeof c.name === 'string' && c.name.trim() ? c.name : 'Untitled catalog',
  created: c.created ?? 0,
  products: obj(c.products),
  order: Array.isArray(c.order) ? c.order : null,
  packages: obj(c.packages),
  packageOrder: Array.isArray(c.packageOrder) ? c.packageOrder : null,
  custom: Array.isArray(c.custom)
    ? c.custom.filter((p) => p?.id && Array.isArray(p.slots)).map((p) => ({ ...p, custom: true, slots: p.slots.filter(validSlot) }))
    : [],
})

const load = (key) => {
  const s = readJSON(key, {})
  let list = Array.isArray(s.catalogs) ? s.catalogs.filter((c) => c?.id).map(readCatalog) : null
  // Before catalogs, the store held one set of edits: that becomes the main catalog.
  if (!list) list = [readCatalog({ ...s, id: DEFAULT_CATALOG, name: 'Main catalog' })]
  if (!list.some((c) => c.id === DEFAULT_CATALOG)) list.unshift(blank(DEFAULT_CATALOG, 'Main catalog'))
  return { catalogs: list }
}

const byOrder = (list, order) => {
  if (!order) return list
  const rank = (id) => { const k = order.indexOf(id); return k === -1 ? Infinity : k }
  return [...list].sort((a, b) => rank(a.id) - rank(b.id))
}

const resolveProduct = (orig, edit = {}) => {
  const next = clone(orig)
  if (edit.name?.trim()) next.name = edit.name.trim()
  if (edit.tagline?.trim()) next.tagline = edit.tagline.trim()
  if (typeof edit.badge === 'string') next.badge = edit.badge.trim() || undefined
  next.hidden = !!edit.hidden
  next.options = next.options.map((opt) => {
    const prices = edit.prices?.[opt.id] ?? {}
    const off = new Set(edit.off?.[opt.id] ?? [])
    let values = opt.values.map((v) => {
      const p = prices[v.id]
      if (typeof p !== 'number' || !Number.isFinite(p)) return v
      return opt.id === 'size' ? { ...v, price: p } : { ...v, delta: p }
    })
    const on = values.filter((v) => !off.has(v.id))
    values = on.length ? on : values.slice(0, 1) // an option always keeps at least one value
    return { ...opt, values }
  })
  return next
}

const resolvePackage = (orig, edit = {}) => {
  const next = clone(orig)
  if (edit.name?.trim()) next.name = edit.name.trim()
  if (edit.tagline?.trim()) next.tagline = edit.tagline.trim()
  if (typeof edit.discount === 'number') next.discount = Math.min(DISCOUNT.max, Math.max(DISCOUNT.min, edit.discount))
  if (typeof edit.popular === 'boolean') next.popular = edit.popular || undefined
  next.hidden = !!edit.hidden || !next.slots.length
  return next
}

/** Every package a catalog can offer: the delivered ones, then its own. */
const packageDefs = (cat) => [...original.packages, ...cat.custom]

/** Writes catalog `cat` onto the live catalog objects (in place). */
function apply(cat, all) {
  original.products.forEach((orig) => {
    const live = productById[orig.id]
    const next = resolveProduct(orig, cat.products[orig.id])
    Object.keys(live).forEach((k) => delete live[k])
    Object.assign(live, next)
  })
  const shown = byOrder(original.products.map((p) => productById[p.id]), cat.order).filter((p) => !p.hidden)
  products.splice(0, products.length, ...shown)

  // Other catalogs' own packages stay resolvable (a cart may hold one) but are never listed.
  all.forEach((c) => c.id !== cat.id && c.custom.forEach((p) => { packageById[p.id] = resolvePackage(p, { ...c.packages[p.id], hidden: true }) }))
  packageDefs(cat).forEach((orig) => {
    const next = resolvePackage(orig, cat.packages[orig.id])
    const live = packageById[orig.id]
    if (!live) { packageById[orig.id] = next; return }
    Object.keys(live).forEach((k) => delete live[k])
    Object.assign(live, next)
  })
  const shownPkgs = byOrder(packageDefs(cat).map((p) => packageById[p.id]), cat.packageOrder).filter((p) => !p.hidden)
  packages.splice(0, packages.length, ...shownPkgs)
}

const store = persisted(KEY, load)

// ── Which catalog is live in this document ─────────────────────────────────

let override = null // set by the dashboard while it edits a catalog
let fromUrl = (() => {
  if (typeof window === 'undefined') return null
  try {
    const q = new URLSearchParams(window.location.search).get('catalog')
    if (q) sessionStorage.setItem('store-v3:preview-catalog', q)
    return q ?? sessionStorage.getItem('store-v3:preview-catalog')
  } catch { return null }
})()

const findCatalog = (id) => store.get().catalogs.find((c) => c.id === id)
const activeId = () => {
  for (const id of [override, fromUrl, getGallery(getActiveGalleryId())?.catalogId]) if (id && findCatalog(id)) return id
  return DEFAULT_CATALOG
}

let version = 0
const versionSubs = new Set()
const refresh = () => {
  apply(findCatalog(activeId()) ?? store.get().catalogs[0], store.get().catalogs)
  version++
  versionSubs.forEach((fn) => fn())
}
refresh()
// Edits from here or another document (the dashboard) re-apply before anyone re-renders.
store.subscribe(refresh)
subscribeGalleries(refresh)
subscribeActiveGallery(() => {
  // Arriving from a gallery ends a catalog preview.
  fromUrl = null
  try { sessionStorage.removeItem('store-v3:preview-catalog') } catch { /* ignore */ }
  refresh()
})

const setOverride = (id) => { if (override !== id) { override = id; refresh() } }

/** Changes whenever the live catalog does. The store layout keys its pages on it so they re-read the catalog. */
export const useCatalogVersion = () => useSyncExternalStore((fn) => { versionSubs.add(fn); return () => versionSubs.delete(fn) }, () => version)

// ── Dashboard API ──────────────────────────────────────────────────────────

const uid = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

/** All catalogs plus actions to create, rename, duplicate and delete them. */
export function useCatalogs() {
  const [state, setState] = store.use()
  const { catalogs } = state

  /** `from`: 'all' (every product offered), 'none' (everything hidden, to switch on) or a catalog id to copy. */
  const create = useCallback((name, from = 'all') => {
    const c = blank(uid('cat'), name.trim().slice(0, LIMITS.catalog) || 'Untitled catalog')
    const src = store.get().catalogs.find((x) => x.id === from)
    if (src) Object.assign(c, clone({ products: src.products, order: src.order, packages: src.packages, packageOrder: src.packageOrder }), {
      // Copies get their own packages (new ids), so editing one catalog never changes another.
      custom: src.custom.map((p) => ({ ...clone(p), id: uid('pkg') })),
    })
    if (src) {
      const ids = Object.fromEntries(src.custom.map((p, k) => [p.id, c.custom[k].id]))
      c.packages = Object.fromEntries(Object.entries(c.packages).map(([k, v]) => [ids[k] ?? k, v]))
      c.packageOrder = c.packageOrder?.map((k) => ids[k] ?? k) ?? null
    }
    if (from === 'none') {
      c.products = Object.fromEntries(original.products.map((p) => [p.id, { hidden: true }]))
      c.packages = Object.fromEntries(original.packages.map((p) => [p.id, { hidden: true }]))
    }
    setState((s) => ({ catalogs: [...s.catalogs, c] }))
    return c
  }, [setState])

  const rename = useCallback((id, name) => setState((s) => ({
    catalogs: s.catalogs.map((c) => (c.id === id ? { ...c, name: name.slice(0, LIMITS.catalog) } : c)),
  })), [setState])

  /** Deletes a catalog (not the main one). Galleries using it should move to the main catalog first. */
  const remove = useCallback((id) => {
    if (id === DEFAULT_CATALOG) return false
    setState((s) => ({ catalogs: s.catalogs.filter((c) => c.id !== id) }))
    return true
  }, [setState])

  /** What a catalog offers, for lists: visible product and package counts, and its lowest price. */
  const summary = useCallback((c) => {
    const visible = original.products.filter((p) => !c.products[p.id]?.hidden)
    const pkgs = packageDefs(c).filter((p) => !c.packages[p.id]?.hidden && p.slots.length)
    const prices = visible.map((p) => Math.min(...resolveProduct(p, c.products[p.id]).options.find((o) => o.id === 'size').values.map((v) => v.price)))
    return {
      products: visible.length,
      packages: pkgs.length,
      from: prices.length ? Math.min(...prices) : null,
      edits: Object.keys(c.products).length + Object.keys(c.packages).length + c.custom.length,
      thumbs: byOrder(visible, c.order).slice(0, 4).map((p) => p.id),
    }
  }, [])

  return { catalogs, create, rename, remove, summary }
}

/**
 * One catalog's settings plus setters, for the dashboard. While mounted, this catalog is the live
 * one in this document, so `productById`, `packageById` and lib/pricing.js reflect it. Product and
 * package lists here include hidden ones, in the photographer's order.
 */
export function useStoreConfig(catalogId = DEFAULT_CATALOG) {
  const [state, setState] = store.use()
  const cfg = state.catalogs.find((c) => c.id === catalogId) ?? null

  useLayoutEffect(() => {
    setOverride(catalogId)
    return () => setOverride(null)
  }, [catalogId])
  // Re-render after the override applies, so lists read the right catalog.
  useCatalogVersion()

  const setCfg = useCallback((fn) => setState((s) => ({
    catalogs: s.catalogs.map((c) => (c.id === catalogId ? { ...c, ...fn(c) } : c)),
  })), [setState, catalogId])

  const editProduct = useCallback((id, patch) => setCfg((c) => ({ products: { ...c.products, [id]: { ...c.products[id], ...patch } } })), [setCfg])
  const setPrice = useCallback((id, optId, valId, value) => setCfg((c) => {
    const e = c.products[id] ?? {}
    const prices = { ...e.prices, [optId]: { ...e.prices?.[optId] } }
    if (value == null) delete prices[optId][valId]
    else prices[optId][valId] = value
    return { products: { ...c.products, [id]: { ...e, prices } } }
  }), [setCfg])
  const toggleValue = useCallback((id, optId, valId) => setCfg((c) => {
    const e = c.products[id] ?? {}
    const list = e.off?.[optId] ?? []
    const off = { ...e.off, [optId]: list.includes(valId) ? list.filter((v) => v !== valId) : [...list, valId] }
    return { products: { ...c.products, [id]: { ...e, off } } }
  }), [setCfg])
  const resetProduct = useCallback((id) => setCfg((c) => {
    const { [id]: _, ...rest } = c.products
    return { products: rest }
  }), [setCfg])
  const setOrder = useCallback((ids) => setCfg(() => ({ order: ids })), [setCfg])

  const editPackage = useCallback((id, patch) => setCfg((c) => ({ packages: { ...c.packages, [id]: { ...c.packages[id], ...patch } } })), [setCfg])
  const resetPackage = useCallback((id) => setCfg((c) => {
    const { [id]: _, ...rest } = c.packages
    return { packages: rest }
  }), [setCfg])
  const setPackageOrder = useCallback((ids) => setCfg(() => ({ packageOrder: ids })), [setCfg])

  // Packages the photographer builds.
  const createPackage = useCallback((name) => {
    const first = original.products.find((p) => !cfg?.products[p.id]?.hidden) ?? original.products[0]
    const pkg = {
      id: uid('pkg'),
      name: name.trim().slice(0, LIMITS.name) || 'New package',
      tagline: '',
      discount: 0.15,
      hero: 'p1011',
      custom: true,
      slots: [{ id: 's1', productId: first.id, qty: 1, variant: { size: first.options.find((o) => o.id === 'size').values[0].id } }],
    }
    setCfg((c) => ({ custom: [...c.custom, pkg], packageOrder: c.packageOrder ? [...c.packageOrder, pkg.id] : null }))
    return pkg
  }, [setCfg, cfg])
  const editCustom = useCallback((id, patch) => setCfg((c) => ({ custom: c.custom.map((p) => (p.id === id ? { ...p, ...patch } : p)) })), [setCfg])
  const deletePackage = useCallback((id) => setCfg((c) => {
    const { [id]: _, ...rest } = c.packages
    return { custom: c.custom.filter((p) => p.id !== id), packages: rest, packageOrder: c.packageOrder?.filter((k) => k !== id) ?? null }
  }), [setCfg])
  const addSlot = useCallback((pkgId) => setCfg((c) => ({
    custom: c.custom.map((p) => {
      if (p.id !== pkgId || p.slots.length >= LIMITS.slots) return p
      const prod = original.products.find((x) => !c.products[x.id]?.hidden) ?? original.products[0]
      const n = Math.max(0, ...p.slots.map((s) => Number(s.id.slice(1)) || 0)) + 1
      return { ...p, slots: [...p.slots, { id: `s${n}`, productId: prod.id, qty: 1, variant: { size: prod.options.find((o) => o.id === 'size').values[0].id } }] }
    }),
  })), [setCfg])
  const editSlot = useCallback((pkgId, slotId, patch) => setCfg((c) => ({
    custom: c.custom.map((p) => (p.id !== pkgId ? p : {
      ...p,
      slots: p.slots.map((s) => {
        if (s.id !== slotId) return s
        const next = { ...s, ...patch }
        // A new product starts at its first size.
        if (patch.productId && patch.productId !== s.productId) {
          next.variant = { size: original.productById[patch.productId].options.find((o) => o.id === 'size').values[0].id }
        }
        return next
      }),
    })),
  })), [setCfg])
  const removeSlot = useCallback((pkgId, slotId) => setCfg((c) => ({
    custom: c.custom.map((p) => (p.id === pkgId ? { ...p, slots: p.slots.filter((s) => s.id !== slotId) } : p)),
  })), [setCfg])

  const reset = useCallback(() => setCfg(() => ({ products: {}, order: null, packages: {}, packageOrder: null })), [setCfg])

  const empty = { products: {}, packages: {}, custom: [], order: null, packageOrder: null }
  const c = cfg ?? empty
  const allProducts = useMemo(() => byOrder(original.products.map((p) => productById[p.id]), c.order), [c.order, version]) // eslint-disable-line react-hooks/exhaustive-deps
  const allPackages = useMemo(() => byOrder(packageDefs(c).map((p) => packageById[p.id] ?? resolvePackage(p, c.packages[p.id])), c.packageOrder), [c, version]) // eslint-disable-line react-hooks/exhaustive-deps

  const isEdited = (id) => !!c.products[id] && Object.keys(c.products[id]).length > 0
  const isPackageEdited = (id) => !!c.packages[id] && Object.keys(c.packages[id]).length > 0
  const isCustom = (id) => c.custom.some((p) => p.id === id)

  return {
    cfg: c, catalog: cfg, categories, allProducts, allPackages,
    editProduct, setPrice, toggleValue, resetProduct, setOrder,
    editPackage, resetPackage, setPackageOrder, reset,
    createPackage, editCustom, deletePackage, addSlot, editSlot, removeSlot,
    isEdited, isPackageEdited, isCustom,
    edited: c.order != null || c.packageOrder != null || Object.keys(c.products).length > 0 || Object.keys(c.packages).length > 0,
  }
}
