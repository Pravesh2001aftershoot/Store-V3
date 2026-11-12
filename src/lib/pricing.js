import { productById, packageById } from '../data/catalog'
import { plural } from './utils'

export const getOption = (product, optId) => product.options.find((o) => o.id === optId)

export const getValue = (product, optId, valId) => {
  const opt = getOption(product, optId)
  return opt?.values.find((v) => v.id === valId) || opt?.values[0]
}

export const defaultVariant = (product, overrides = {}) =>
  Object.fromEntries(product.options.map((o) => [o.id, overrides[o.id] || o.values[0].id]))

export const sizeOf = (product, variant) => getValue(product, 'size', variant.size)

export const variantLabel = (product, variant, { skipSize = false } = {}) =>
  product.options
    .filter((o) => !(skipSize && o.id === 'size'))
    .map((o) => getValue(product, o.id, variant[o.id])?.label)
    .filter(Boolean)
    .join(' · ')

/** Price of a single item of this variant (books include extra photos beyond the minimum). */
export const unitPrice = (product, variant, photoCount = 0) => {
  let price = sizeOf(product, variant).price
  for (const o of product.options) {
    if (o.id === 'size') continue
    price += getValue(product, o.id, variant[o.id])?.delta || 0
  }
  if (product.mode === 'book') price += bookExtras(product, photoCount)
  return price
}

export const bookExtras = (product, photoCount) =>
  product.mode === 'book' ? Math.max(0, photoCount - product.book.min) * product.book.perExtra : 0

export const fromPrice = (product) => Math.min(...getOption(product, 'size').values.map((v) => v.price))

/** How many physical items a set of photos produces. */
export const lineQty = (product, photoCount) => {
  if (product.mode === 'set') return Math.floor(photoCount / product.setSize)
  if (product.mode === 'book') return photoCount > 0 ? 1 : 0
  return photoCount
}

export const lineTotal = (product, variant, photoCount) => {
  if (product.mode === 'book') return photoCount ? unitPrice(product, variant, photoCount) : 0
  return unitPrice(product, variant) * lineQty(product, photoCount)
}

/**
 * Photo requirements for a product (or a package slot with fixed qty).
 * Returns { min, max, step }.
 */
export const requirement = (product, slotQty) => {
  if (product.mode === 'book') return { min: product.book.min, max: product.book.max, step: 1 }
  const per = product.mode === 'set' ? product.setSize : 1
  if (slotQty) return { min: slotQty * per, max: slotQty * per, step: per }
  return { min: per, max: 100, step: per }
}

export const validate = (product, count, slotQty) => {
  const { min, max, step } = requirement(product, slotQty)
  if (count === 0) return { ok: false, message: `Select ${min === max ? min : `at least ${min}`} ${min === 1 ? 'photo' : 'photos'}` }
  if (count < min) return { ok: false, message: `Select ${min - count} more ${min - count === 1 ? 'photo' : 'photos'}` }
  if (count > max) return { ok: false, message: `Remove ${count - max} ${count - max === 1 ? 'photo' : 'photos'}` }
  if (count % step) return { ok: false, message: `Select photos in multiples of ${step} (${step - (count % step)} more)` }
  return { ok: true, message: '' }
}

export const requirementText = (product, slotQty) => {
  const { min, max } = requirement(product, slotQty)
  if (product.mode === 'book') return `${min}–${max} photos · ${min} included`
  if (min === max) return `Choose ${plural(min, 'photo')}`
  if (product.mode === 'set') return `Choose photos in multiples of ${product.setSize}`
  return 'Each photo becomes one print'
}

/** Frame aspect ratio (w/h) for a cropped cell. */
export const cellAspect = (product, variant, orientation = 'portrait') => {
  const s = sizeOf(product, variant)
  const lo = Math.min(s.w, s.h)
  const hi = Math.max(s.w, s.h)
  if (lo === hi) return 1
  return orientation === 'landscape' ? hi / lo : lo / hi
}

export const frameInches = (product, variant, orientation) => {
  const s = sizeOf(product, variant)
  const lo = Math.min(s.w, s.h)
  const hi = Math.max(s.w, s.h)
  return orientation === 'landscape' ? { w: hi, h: lo } : { w: lo, h: hi }
}

export const defaultOrientation = (product, photo) =>
  product.allowOrientation && photo.w > photo.h ? 'landscape' : 'portrait'

// ---- Packages -------------------------------------------------------------

export const slotValue = (slot) => {
  const product = productById[slot.productId]
  const variant = defaultVariant(product, slot.variant)
  const count = product.mode === 'book' ? product.book.min : slot.qty
  return product.mode === 'book' ? unitPrice(product, variant, count) : unitPrice(product, variant) * slot.qty
}

export const packageValue = (pkg) => pkg.slots.reduce((s, slot) => s + slotValue(slot), 0)
export const packagePrice = (pkg) => Math.round((packageValue(pkg) * (1 - pkg.discount)) / 5) * 5
export const packageItemCount = (pkg) => pkg.slots.reduce((s, x) => s + x.qty, 0)

// ---- Cart lines -----------------------------------------------------------

export const lineSubtotal = (line) => {
  if (line.kind === 'package') {
    const pkg = packageById[line.packageId]
    const extras = line.slots.reduce((s, slot) => s + bookExtras(productById[slot.productId], slot.photos.length), 0)
    return packagePrice(pkg) + extras
  }
  return lineTotal(productById[line.productId], line.variant, line.photos.length)
}

export const lineCompareAt = (line) => {
  if (line.kind !== 'package') return null
  const pkg = packageById[line.packageId]
  const extras = line.slots.reduce((s, slot) => s + bookExtras(productById[slot.productId], slot.photos.length), 0)
  return packageValue(pkg) + extras
}

export const lineItemCount = (line) =>
  line.kind === 'package'
    ? line.slots.reduce((s, slot) => s + lineQty(productById[slot.productId], slot.photos.length), 0)
    : lineQty(productById[line.productId], line.photos.length)
