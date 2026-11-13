import { useMemo } from 'react'
import { COLUMNS, GAP, MARGIN } from '../lib/settings'
import { useBreakpoint, useInfinite } from '../lib/hooks'
import { justifiedRows, masonry } from '../lib/layout'
import Photo from './Photo'
import { Eyebrow } from '../../components/ui'

/** DOM id of a collection's section heading (used for jumping and scroll-spy). */
export const sectionId = (name) => `collection-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

/**
 * Gallery grid with infinite scroll.
 * `photos` is one flat list; optional `sections` ({ title, start, end } ranges into it) split it into
 * titled blocks so the whole gallery reads as one continuous scroll. Indexes passed to `onOpen` are into `photos`.
 *  orientation  vertical → masonry columns · horizontal → justified rows
 *  size         small 4 · medium 3 · large 2 per row (desktop; fewer on smaller screens)
 *  spacing      airy · thin · none
 */
export default function GalleryGrid({ photos, sections, settings, favorites, onFavorite, onOpen, onBuy, resetKey, minCount = 0, emptyMessage = 'No photos here yet' }) {
  const bp = useBreakpoint()
  const columns = COLUMNS[settings.size][bp]
  const gap = GAP[settings.spacing][bp]
  const margin = MARGIN[settings.spacing][bp]
  const { count, ref, done, loading } = useInfinite(photos.length, { batch: 24, resetKey, min: minCount })

  const blocks = useMemo(() => {
    const ranges = sections ?? [{ start: 0, end: photos.length }]
    return ranges
      .map((r) => ({ ...r, items: photos.slice(r.start, Math.min(r.end, count)) }))
      .filter((b) => b.items.length > 0)
  }, [photos, sections, count])

  const tile = (offset, { item, index }, style) => (
    <Photo
      key={item.id}
      photo={item}
      style={style}
      favorite={favorites.has(item.id)}
      onFavorite={() => onFavorite(item.id)}
      onOpen={() => onOpen(offset + index)}
      onBuy={() => onBuy(item)}
    />
  )

  return (
    <section aria-label="Photos" style={{ padding: `${margin}px ${margin}px 0` }} className="mx-auto w-full max-w-[1800px]">
      {blocks.map((b, i) => (
        <div key={b.title ?? 'all'}>
          {b.title && (
            <header id={sectionId(b.title)} className="px-1 py-5 md:py-16">
              <Eyebrow>{b.end - b.start} photos</Eyebrow>
              <h2 className="mt-4 text-48-sb text-type-0 md:text-72-sb">{b.title}</h2>
            </header>
          )}
          {columns === 1 ? (
            // One per row (large on mobile): each photo spans the full width, height follows its aspect ratio.
            <div className="flex flex-col" style={{ gap }}>
              {b.items.map((item, index) => tile(b.start, { item, index }, { width: '100%' }))}
            </div>
          ) : settings.orientation === 'vertical' ? (
            <div className="flex items-start" style={{ gap }}>
              {masonry(b.items, columns).map((col, i) => (
                <div key={i} className="flex min-w-0 flex-1 flex-col" style={{ gap }}>
                  {col.map((cell) => tile(b.start, cell))}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap }}>
              {justifiedRows(b.items, columns).map((row, r) => (
                <div key={r} className="flex" style={{ gap }}>
                  {row.cells.map((cell) => tile(b.start, cell, { flex: `${cell.item.w / cell.item.h} 1 0%` }))}
                  {row.spacers.map((ratio, k) => (
                    <div key={`s${k}`} aria-hidden style={{ flex: `${ratio} 1 0%` }} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div ref={ref} className="flex h-28 items-center justify-center text-13-r text-type-3">
        {loading && <span className="h-5 w-5 animate-spin rounded-full border-2 border-type-3/30 border-t-type-2" aria-label="Loading more photos" />}
        {done && photos.length > 0 && <span>You’ve seen all {photos.length} photos</span>}
        {photos.length === 0 && <span>{emptyMessage}</span>}
      </div>
    </section>
  )
}
