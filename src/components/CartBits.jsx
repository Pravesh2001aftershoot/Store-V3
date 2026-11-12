import { productById, packageById } from '../data/catalog'
import { getPhoto } from '../data/gallery'
import { cellAspect, lineQty, variantLabel, sizeOf } from '../lib/pricing'
import { plural } from '../lib/utils'
import CroppedImage from './CroppedImage'
import ProductMockup from './ProductMockup'

/** Flattened sub-lines for a cart line (one for products, one per slot for packages). */
export const lineParts = (line) =>
  line.kind === 'package'
    ? line.slots.map((s) => ({ product: productById[s.productId], variant: s.variant, photos: s.photos }))
    : [{ product: productById[line.productId], variant: line.variant, photos: line.photos }]

export const lineTitle = (line) =>
  line.kind === 'package' ? `${packageById[line.packageId].name} Package` : productById[line.productId].name

export function LineThumb({ line, className }) {
  const part = lineParts(line)[0]
  return (
    <div className={className}>
      <ProductMockup product={part.product} variant={part.variant} items={part.photos} className="aspect-square rounded-xl" />
    </div>
  )
}

export function PartSummary({ part }) {
  const qty = lineQty(part.product, part.photos.length)
  const size = sizeOf(part.product, part.variant)
  return (
    <span>
      {qty} × {part.product.name} {size.label}
      {part.product.mode === 'book' && ` · ${plural(part.photos.length, 'photo')}`}
    </span>
  )
}

export function PhotoStrip({ part, max = 8, size = 'h-9' }) {
  const shown = part.photos.slice(0, max)
  const more = part.photos.length - shown.length
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((p, i) => (
        <CroppedImage
          key={i}
          photo={getPhoto(p.photoId)}
          crop={p.crop}
          aspect={cellAspect(part.product, part.variant, p.orientation)}
          className={`${size} rounded-[3px] ring-1 ring-black/5`}
        />
      ))}
      {more > 0 && <span className="ml-1 text-12-r text-type-2">+{more}</span>}
    </div>
  )
}

export const partVariantText = (part) => variantLabel(part.product, part.variant, { skipSize: true })
