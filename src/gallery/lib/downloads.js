import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { IMAGE_SIZES } from '../../photographer-dashboard/gallery/access'
import { persistedFamily, readJSON } from '../../lib/persisted'
import { productById } from '../../data/catalog'
import { useCatalogVersion } from '../../data/storeConfig'
import { useGalleryId } from '../../data/galleries'
import { usePurchases } from '../../data/purchases'
import { registerPhoto } from '../../data/gallery'
import { defaultOrientation, defaultVariant, getOption } from '../../lib/pricing'
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

/**
 * A Digital Download file version as a download size: `file:<versionId>`, priced. `gallery` is the
 * Whole Gallery Download in this version (`{ price, compareAt? }`, the sale and full price), or null.
 */
const fileSize = (v, whole) => ({
  id: `file:${v.id}`,
  version: v.id,
  edge: v.edge,
  label: v.label,
  hint: v.edge ? `${v.note}. Smaller than the original, still sharp in print.` : `Full resolution, ${v.note.toLowerCase()}. Best for printing.`,
  price: v.price,
  gallery: whole ? { price: whole.price, compareAt: whole.compareAt ?? null } : null,
})
/** The Digital Download version a size sells, or null for a free size. */
export const versionOf = (sizeId) => (typeof sizeId === 'string' && sizeId.startsWith('file:') ? sizeId.slice(5) : null)

/** The store products that sell High res (src/data/catalog.js), when the gallery's catalog shows them. */
export const DIGITAL = { photo: 'digital-download', gallery: 'digital-gallery' }
const offered = (id) => {
  const p = productById[id]
  return p && !p.hidden ? p : null
}

/**
 * `{ on, pin, sizes, limit, paid, personalUse }` for this visitor. `pin` is the 4-digit code or null; `limit` a number
 * or null (it counts free downloads only). `personalUse`: the photographer asks visitors to agree to personal,
 * non-commercial use before their first download (Settings → Downloads, off by default). Web size uses the photographer's long edge and watermark.
 *
 * `paid`: High res is sold whenever it's offered, the photographer hasn't made it free (`image.highFree`)
 * and the gallery's store shows the Digital Download product. Each of that product's file versions
 * (original resolution or a smaller long edge, with or without watermark) becomes a paid size
 * `file:<versionId>` with its price and its whole-gallery offer (`size.gallery`). `paid` is `{ versions,
 * from, full, gallery }`: the version values, the lowest price, the size id of the original resolution
 * (or the first version), and the lowest whole-gallery price (null when none is offered). Otherwise null, and High res (if offered) is free. Prices live in the store catalog (dashboard → Store).
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
    const versions = photo ? getOption(photo, 'size').values : []
    const wholes = whole ? getOption(whole, 'size').values : []
    const fileSizes = versions.map((v) => fileSize(v, wholes.find((w) => w.id === v.id)))
    const wholeOffers = fileSizes.filter((z) => z.gallery)
    const paid = photo
      ? {
          versions,
          from: Math.min(...versions.map((v) => v.price)),
          full: (fileSizes.find((z) => !z.edge) ?? fileSizes[0]).id,
          // The lowest whole-gallery price, or null when no version has one.
          gallery: wholeOffers.length ? Math.min(...wholeOffers.map((z) => z.gallery.price)) : null,
        }
      : null
    const sizes = [
      offers.web && (paid ? { ...webSize, price: 0 } : webSize),
      ...(offers.high ? (paid ? fileSizes : [SIZES[1]]) : []),
    ].filter(Boolean)
    if (!d) return { on: true, pin: null, sizes, limit: null, paid, personalUse: false }
    const dl = d.downloads
    const limit = Number(image.limit)
    return {
      on: dl.on && image.on && sizes.length > 0,
      pin: dl.pin.on && /^\d{4}$/.test(dl.pin.code) ? dl.pin.code : null,
      sizes,
      limit: limit > 0 ? limit : null,
      paid,
      personalUse: !!dl.personalUse,
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

  /** True when this size has to be bought (a Digital Download version while the store sells High res). */
  const isPaid = useCallback((sizeId) => !!rules.paid && !!versionOf(sizeId), [rules.paid])
  const { owns, ownsGallery, all: ownsAll } = purchases
  /** Whether `photo` can be downloaded in `sizeId` without paying (free sizes always can). */
  const ownsSize = useCallback((photo, sizeId) => !versionOf(sizeId) || owns(photo, versionOf(sizeId)), [owns])

  /**
   * The price of `photos` in paid size `sizeId` (default: the original resolution). `everything` is the
   * whole gallery's photos, for that version's whole-gallery price: past it, the order becomes the Whole
   * Gallery Download in that version (never pay more than that). Photos already bought in that version
   * (or the original) are free. `{ photos, count, owned, each, perPhoto, gallery, galleryWas, whole,
   * total, saves, version, label, note }`: `photos` are the ones to buy; `gallery` / `galleryWas` the
   * whole-gallery sale and full price (null when this version has none, or it's already owned).
   */
  const quote = useCallback((photos, everything, sizeId) => {
    const paid = rules.paid
    if (!paid) return null
    const size = rules.sizes.find((z) => z.id === (versionOf(sizeId) ? sizeId : paid.full)) ?? rules.sizes.find((z) => z.id === paid.full)
    const toBuy = photos.filter((p) => !owns(p, size.version))
    const perPhoto = toBuy.length * size.price
    const g = size.gallery && !ownsGallery(size.version) ? size.gallery : null
    const whole = !!g && toBuy.length > 0 && g.price < perPhoto
    return {
      photos: whole ? everything.filter((p) => !owns(p, size.version)) : toBuy,
      count: toBuy.length,
      owned: photos.length - toBuy.length,
      each: size.price,
      perPhoto,
      gallery: g?.price ?? null,
      galleryWas: g?.compareAt ?? null,
      whole,
      total: whole ? g.price : perPhoto,
      saves: whole ? perPhoto - g.price : 0,
      version: size.version,
      label: size.label,
      note: paid.versions.find((v) => v.id === size.version)?.note,
    }
  }, [rules.paid, rules.sizes, owns, ownsGallery])

  return {
    rules, used: done.size, left, isNew, record, locked: !!rules.pin && !unlocked, unlock,
    isPaid, owns, ownsSize, ownsAll, ownsGallery, quote,
  }
}

/**
 * Puts a High res order (from `quote`, or `{ whole, photos, version }`) in the store cart: the Whole
 * Gallery Download in that version, or the photos on the Digital Download line for that version (joining the line
 * already in the cart for it, so a photo is never in it twice in the same version).
 * Returns false when there's nothing new to add.
 */
export function addOrderToCart({ lines, dispatch }, order) {
  if (order.whole) {
    const product = productById[DIGITAL.gallery]
    const variant = { ...defaultVariant(product), ...(order.version && product.options[0].values.some((v) => v.id === order.version) ? { size: order.version } : {}) }
    if (lines.some((l) => l.productId === DIGITAL.gallery && l.variant.size === variant.size)) return false
    dispatch({ type: 'add', line: { kind: 'product', productId: product.id, variant, photos: [] } })
    return true
  }
  const product = productById[DIGITAL.photo]
  const entries = order.photos.map((p) => {
    registerPhoto(p)
    return { photoId: p.id, crop: DEFAULT_CROP, orientation: defaultOrientation(product, p) }
  })
  const variant = { ...defaultVariant(product), ...(order.version ? { size: order.version } : {}) }
  const line = lines.find((l) => l.kind === 'product' && l.productId === product.id && l.variant.size === variant.size)
  if (!line) {
    if (!entries.length) return false
    dispatch({ type: 'add', line: { kind: 'product', productId: product.id, variant, photos: entries } })
    return true
  }
  const fresh = entries.filter((e) => !line.photos.some((x) => x.photoId === e.photoId))
  if (!fresh.length) return false
  dispatch({ type: 'update', id: line.id, line: { ...line, photos: [...line.photos, ...fresh] } })
  return true
}

/**
 * The size this visitor wants single photos in, saved per gallery under `gallery-download-size:<clientKey>`
 * ('web' | 'high' | 'file:<versionId>', or null to be asked each time). `[size, setSize]`; `size` is null when the saved size
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
 * Whether this visitor has agreed to use the gallery's photos for personal, non-commercial use only,
 * saved per gallery under `gallery-download-terms:<clientKey>` (true once agreed). Only asked when the
 * photographer turns it on (`rules.personalUse`); until agreed the "Download photo" prompt always opens
 * and its Download button waits for the tick. `[agreed, setAgreed]`.
 */
const termsAgreed = persistedFamily(
  (clientKey) => `gallery-download-terms:${clientKey}`,
  (key) => readJSON(key) === true
)
export const useTermsAgreed = (clientKey) => termsAgreed(clientKey).use()

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
