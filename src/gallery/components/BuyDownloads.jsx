import { Sparkle } from '@phosphor-icons/react'
import { money } from '../../lib/utils'

// Buying high-res downloads from inside the gallery. High res is sold by the store's Digital Download
// and Whole Gallery Download products (lib/downloads.js → rules.paid); these pieces show the price in
// SizePrompt (one photo) and the Download pane, which put the order in the store cart. Paying happens
// at the store's checkout.

const plural = (n, word = 'photo') => `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`

/**
 * The price card for a High res order (`quote` from useDownloads): what's being bought, what's already
 * yours, and when the whole-gallery price takes over. `galleryCount` is how many photos the gallery has.
 */
export function OrderSummary({ quote, galleryCount, compact = false }) {
  if (!quote) return null
  const { count, owned, each, perPhoto, whole, total, saves, gallery } = quote
  return (
    <div className="rounded-xl bg-surface-2 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-14-sb text-type-0">
          {count === 0 ? 'Already yours' : whole ? 'Whole gallery · High res' : `${plural(count)} · High res`}
        </p>
        <p className="shrink-0 text-16-sb tabular-nums text-type-0">{count === 0 ? 'Free' : money(total)}</p>
      </div>
      <div className="mt-1.5 space-y-0.5 text-12-r-p text-type-2">
        {count > 0 && !whole && <p className="tabular-nums">{plural(count)} × {money(each)}</p>}
        {whole && (
          <p className="tabular-nums">
            All {plural(galleryCount)} for {money(gallery)}, instead of {money(perPhoto)} for {count.toLocaleString()} at {money(each)} each. You save {money(saves)}.
          </p>
        )}
        {owned > 0 && !whole && <p>{owned === 1 ? '1 photo is' : `${owned.toLocaleString()} photos are`} already yours, so {owned === 1 ? 'it’s' : 'they’re'} free.</p>}
        {!compact && <p>Original resolution, no watermark. Pay at checkout, then download here any time.</p>}
      </div>
    </div>
  )
}

/** One line under the free option nudging toward the whole gallery when it has a price. */
export function GalleryOffer({ quote, galleryCount, onPick }) {
  if (!quote?.gallery || quote.whole) return null
  return (
    <button
      onClick={onPick}
      className="mt-3 flex w-full items-center gap-2.5 rounded-xl border border-dashed border-border px-3.5 py-2.5 text-left outline-none transition hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Sparkle size={16} className="shrink-0 text-type-2" />
      <span className="min-w-0 flex-1 text-12-r-p text-type-2">
        <span className="text-type-0">Whole gallery in high res: {money(quote.gallery)}</span> · all {plural(galleryCount)}
      </span>
    </button>
  )
}
