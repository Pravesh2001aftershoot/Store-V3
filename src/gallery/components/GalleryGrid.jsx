import { useMemo } from 'react'
import { COLUMNS, GAP, MARGIN } from '../lib/settings'
import { useBreakpoint, useInfinite } from '../lib/hooks'
import { justifiedRows, masonry } from '../lib/layout'
import Photo from './Photo'
import SectionHeader from '../sections/SectionHeader'

/** DOM id of a collection's section heading (used for jumping and scroll-spy). */
export const sectionId = (name) => `collection-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

/**
 * Gallery grid with infinite scroll.
 * `photos` is one flat list; optional `sections` ({ title, start, end } ranges into it) split it into
 * titled blocks so the whole gallery reads as one continuous scroll. Indexes passed to `onOpen` / `onSelect` are into `photos`.
 *  orientation  vertical → masonry columns · horizontal → justified rows
 *  size         small 4 · medium 3 · large 2 per row (desktop; fewer on smaller screens)
 *  spacing      airy · thin · none
 * `headings` (from `useSectionConfig`) styles each section's heading; `onEditHeading(title)` adds its pencil.
 */
export default function GalleryGrid({ photos, sections, settings, favorites, onFavorite, hidden, onHide, onOpen, onBuy, selecting = false, selected, onSelect, headings, onEditHeading, resetKey, minCount = 0, emptyMessage = 'No photos here yet' }) {
  const bp = useBreakpoint()
  const columns = COLUMNS[settings.size][bp]
  const gap = GAP[settings.spacing][bp]
  const margin = MARGIN[settings.spacing][bp]
  const { count, ref, done, loading } = useInfinite(photos.length, { batch: 24, resetKey, min: minCount })

  const blocks = useMemo(() => {
    const ranges = sections ?? [{ start: 0, end: photos.length }]
    return ranges
      .map((r, index) => ({ ...r, index, items: photos.slice(r.start, Math.min(r.end, count)) }))
      .filter((b) => b.items.length > 0)
  }, [photos, sections, count])

  const tile = (offset, { item, index }, style) => (
    <Photo
      key={item.id}
      photo={item}
      style={style}
      favorite={favorites.has(item.id)}
      onFavorite={() => onFavorite(item.id)}
      hidden={hidden.has(item.id)}
      onHide={() => onHide(item.id)}
      onOpen={() => onOpen(offset + index)}
      onBuy={() => onBuy(item)}
      selecting={selecting}
      selected={selected?.has(item.id)}
      onSelect={(e) => onSelect?.(offset + index, e)}
    />
  )

  return (
    <section aria-label="Photos" style={{ padding: `${margin}px ${margin}px 0` }} className="mx-auto w-full max-w-[1800px]">
      {blocks.map((b, i) => (
        <div key={b.title ?? 'all'}>
          {b.title && (
            <SectionHeader
              id={sectionId(b.title)}
              style={headings.style}
              words={headings.words(b.title, b.end - b.start)}
              index={b.index}
              onEdit={onEditHeading && (() => onEditHeading(b.title))}
            />
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
