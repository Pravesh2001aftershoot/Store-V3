import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { IMAGE_SIZES } from '../../photographer-dashboard/gallery/access'
import { persistedFamily, readJSON } from '../../lib/persisted'
import { productById } from '../../data/catalog'
import { useCatalogVersion } from '../../data/storeConfig'
import { useGalleryId } from '../../data/galleries'
import { usePurchases } from '../../data/purchases'
import { registerPhoto } from '../../data/gallery'
import { defaultOrientation, defaultVariant, unitPrice } from '../../lib/pricing'
import { DEFAULT_CROP } from '../../lib/crop'
import { usePersistedIds } from './actions'
import { useVisitor } from './visitor'

// Download rules for the client gallery, read from the photographer's Settings → Downloads
// (photographer-dashboard/gallery/access.js), plus a per-visitor ledger of what's been downloaded.
//
// The audience is the signed-in visitor's (lib/visitor.js): the whole gallery ("anyone"), or with
// role-based access their role. An OPEN visitor (settings never saved, or the dashboard preview) keeps
// downloads open (both sizes, no PIN, no limit), so an unconfigured gallery isn't locked by the defaults.

const HINTS = {
  web: 'Long edge 2048px. Good for phones, screens and sharing.',
  high: 'Full resolution, as delivered. Best for printing.',
}
export const SIZES = IMAGE_SIZES.map((z) => ({ ...z, hint: HINTS[z.id] }))

export const DIGITAL = { photo: 'digital-download', gallery: 'digital-gallery' }
const offered = (id) => {
  const p = productById[id]
  return p && !p.hidden ? p : null
}

/**
 * `{ on, pin, sizes, limit, paid }` for this visitor. `pin` is the 4-digit code or null; `limit` a number
 * or null (it counts free downloads only). Web size uses the photographer's long edge and watermark.
 *
 * `paid`: High res is sold whenever it's offered, the photographer hasn't made it free (`image.highFree`)
 * and the gallery's store shows the Digital Download product. It's then priced from that product:
 * `{ photo, gallery }` (the Whole Gallery Download price, or null when that product isn't shown).
 * Otherwise null, and High res (if offered) is free. Prices live in the store catalog (dashboard → Store).
 * An OPEN visitor (settings never saved, or the dashboard preview) gets both sizes, no PIN and no limit,
 * so an unconfigured gallery isn't locked by the defaults; High res is still sold if the store sells it.
 */
export function useDownloadRules() {
  const d = useVisitor()?.visitor.d
  const catalog = useCatalogVersion() // the gallery's catalog can change prices or hide the products
  return useMemo(() => {
    const image = d?.downloads.image
    const web = image?.web ?? { edge: 2048, watermark: false }
    const webSize = d ? { ...SIZES[0], hint: `${web.edge.toLocaleString()}px long edge${web.watermark ? ', watermarked' : ''}. Good for phones, screens and sharing.` } : SIZES[0]
    const offers = d ? image.sizes : { web: true, high: true }
    const photo = offers.high && !image?.highFree && offered(DIGITAL.photo)
    const whole = photo && offered(DIGITAL.gallery)
    const paid = photo ? { photo: unitPrice(photo, defaultVariant(photo)), gallery: whole ? unitPrice(whole, defaultVariant(whole)) : null } : null
    const sizes = [
      offers.web && (paid ? { ...webSize, price: 0 } : webSize),
      offers.high && (paid ? { ...SIZES[1], hint: 'Original resolution, no watermark. Best for printing.', price: paid.photo } : SIZES[1]),
    ].filter(Boolean)
    if (!d) return { on: true, pin: null, sizes, limit: null, paid }
    const dl = d.downloads
    const limit = Number(image.limit)
    return {
      on: dl.on && image.on && sizes.length > 0,
      pin: dl.pin.on && /^\d{4}$/.test(dl.pin.code) ? dl.pin.code : null,
      sizes,
      limit: limit > 0 ? limit : null,
      paid,
    }
  }, [d, catalog]) // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Rules + the visitor's allowance and purchases. The limit counts distinct photos (saved per gallery under
 * `gallery-downloads:<clientKey>`), so downloading a photo again never uses the allowance twice.
 * The PIN, once entered, holds for the visit. High-res photos bought in the store (src/data/purchases.js)
 * download again for free and never use the allowance.
 */
export function useDownloads(clientKey) {
  const rules = useDownloadRules()
  const [done, , , setMany] = usePersistedIds(`gallery-downloads:${clientKey}`)
  const purchases = usePurchases(useGalleryId())
  const [unlocked, setUnlocked] = useState(false)
  const left = rules.limit == null ? Infinity : Math.max(0, rules.limit - done.size)

  const isNew = useCallback((p) => !done.has(p.id), [done])
  const record = useCallback((photos) => setMany(photos.map((p) => p.id), true), [setMany])
  const unlock = useCallback((code) => {
    const ok = code === rules.pin
    if (ok) setUnlocked(true)
    return ok
  }, [rules.pin])

  /** True when this size has to be bought (High res while the store sells it). */
  const isPaid = useCallback((sizeId) => !!rules.paid && sizeId === 'high', [rules.paid])
  const { owns, all: ownsAll } = purchases

  /**
   * The price of `photos` in High res. `everything` is the whole gallery's photos, for the whole-gallery
   * price: past it, the order becomes the Whole Gallery Download (never pay more than that). Photos
   * already bought are free. `{ photos, count, owned, each, perPhoto, gallery, whole, total, saves }`:
   * `photos` are the ones to buy.
   */
  const quote = useCallback((photos, everything) => {
    const paid = rules.paid
    if (!paid) return null
    const toBuy = photos.filter((p) => !owns(p))
    const perPhoto = toBuy.length * paid.photo
    const whole = paid.gallery != null && toBuy.length > 0 && paid.gallery < perPhoto
    return {
      photos: whole ? everything.filter((p) => !owns(p)) : toBuy,
      count: toBuy.length,
      owned: photos.length - toBuy.length,
      each: paid.photo,
      perPhoto,
      gallery: paid.gallery,
      whole,
      total: whole ? paid.gallery : perPhoto,
      saves: whole ? perPhoto - paid.gallery : 0,
    }
  }, [rules.paid, owns])

  return {
    rules, used: done.size, left, isNew, record, locked: !!rules.pin && !unlocked, unlock,
    isPaid, owns, ownsAll, quote,
  }
}

/**
 * Puts a High res order (from `quote`) in the store cart: the Whole Gallery Download, or the photos on
 * the Digital Download line (joining the line already in the cart, so a photo is never in it twice).
 * Returns false when there's nothing new to add.
 */
export function addOrderToCart({ lines, dispatch }, order) {
  if (order.whole) {
    if (lines.some((l) => l.productId === DIGITAL.gallery)) return false
    const product = productById[DIGITAL.gallery]
    dispatch({ type: 'add', line: { kind: 'product', productId: product.id, variant: defaultVariant(product), photos: [] } })
    return true
  }
  const product = productById[DIGITAL.photo]
  const entries = order.photos.map((p) => {
    registerPhoto(p)
    return { photoId: p.id, crop: DEFAULT_CROP, orientation: defaultOrientation(product, p) }
  })
  const line = lines.find((l) => l.kind === 'product' && l.productId === product.id)
  if (!line) {
    if (!entries.length) return false
    dispatch({ type: 'add', line: { kind: 'product', productId: product.id, variant: defaultVariant(product), photos: entries } })
    return true
  }
  const fresh = entries.filter((e) => !line.photos.some((x) => x.photoId === e.photoId))
  if (!fresh.length) return false
  dispatch({ type: 'update', id: line.id, line: { ...line, photos: [...line.photos, ...fresh] } })
  return true
}

/**
 * The size this visitor wants single photos in, saved per gallery under `gallery-download-size:<clientKey>`
 * ('web' | 'high', or null to be asked each time). `[size, setSize]`; `size` is null when the saved size
 * isn't one the photographer offers any more, so the visitor is asked again.
 */
const sizePref = persistedFamily(
  (clientKey) => `gallery-download-size:${clientKey}`,
  (key) => {
    const v = readJSON(key)
    return SIZES.some((z) => z.id === v) ? v : null
  }
)
export function useSizePref(clientKey, sizes) {
  const [saved, setSaved] = sizePref(clientKey).use()
  return [sizes.some((z) => z.id === saved) ? saved : null, setSaved]
}

/**
 * What can be downloaded from `photos` within the allowance: everything already downloaded, plus new
 * photos in order until the allowance runs out. `{ take, fresh, cut }` — `cut` is how many new ones don't fit.
 */
export function fitAllowance(photos, isNew, left) {
  const fresh = photos.filter(isNew).length
  if (fresh <= left) return { take: photos, fresh, cut: 0 }
  let room = left
  const take = photos.filter((p) => !isNew(p) || room-- > 0)
  return { take, fresh, cut: fresh - left }
}

// Photo tiles and the lightbox read this to show (or leave out) their download button and to route a
// one-photo download through the rules. Without a provider they download straight away.
export const DownloadContext = createContext(null)
export const useDownloadAction = () => useContext(DownloadContext)
