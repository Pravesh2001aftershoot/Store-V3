import { useMemo } from 'react'
import { COLUMNS, GAP, MARGIN } from '../lib/settings'
import { useBreakpoint, useInfinite } from '../lib/hooks'
import { justifiedRows, masonry } from '../lib/layout'
import Photo from './Photo'

/**
 * Gallery grid with infinite scroll.
 *  orientation  vertical → masonry columns · horizontal → justified rows
 *  size         small 4 · medium 3 · large 2 per row (desktop; fewer on smaller screens)
 *  spacing      airy · thin · none
 */
export default function GalleryGrid({ photos, settings, favorites, onFavorite, onOpen, resetKey, emptyMessage = 'No photos here yet' }) {
  const bp = useBreakpoint()
  const columns = COLUMNS[settings.size][bp]
  const gap = GAP[settings.spacing][bp]
  const margin = MARGIN[settings.spacing][bp]
  const { count, ref, done, loading } = useInfinite(photos.length, { batch: 24, resetKey })

  const shown = useMemo(() => photos.slice(0, count), [photos, count])
  const rounded = settings.spacing === 'airy'

  const tile = ({ item, index }, style) => (
    <Photo
      key={item.id}
      photo={item}
      rounded={rounded}
      style={style}
      favorite={favorites.has(item.id)}
      onFavorite={() => onFavorite(item.id)}
      onOpen={() => onOpen(index)}
    />
  )

  return (
    <section aria-label="Photos" style={{ padding: `${margin}px ${margin}px 0` }} className="mx-auto w-full max-w-[1800px]">
      {settings.orientation === 'vertical' ? (
        <div className="flex items-start" style={{ gap }}>
          {masonry(shown, columns).map((col, i) => (
            <div key={i} className="flex min-w-0 flex-1 flex-col" style={{ gap }}>
              {col.map((cell) => tile(cell))}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap }}>
          {justifiedRows(shown, columns).map((row, r) => (
            <div key={r} className="flex" style={{ gap }}>
              {row.cells.map((cell) => tile(cell, { flex: `${cell.item.w / cell.item.h} 1 0%` }))}
              {row.spacers.map((ratio, k) => (
                <div key={`s${k}`} aria-hidden style={{ flex: `${ratio} 1 0%` }} />
              ))}
            </div>
          ))}
        </div>
      )}

      <div ref={ref} className="flex h-28 items-center justify-center text-13-r text-type-3">
        {loading && <span className="h-5 w-5 animate-spin rounded-full border-2 border-type-3/30 border-t-type-2" aria-label="Loading more photos" />}
        {done && photos.length > 0 && <span>You’ve seen all {photos.length} photos</span>}
        {photos.length === 0 && <span>{emptyMessage}</span>}
      </div>
    </section>
  )
}
