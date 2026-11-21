import { useCallback } from 'react'
import { readJSON } from '../lib/persisted'
import { forGallery } from './galleries'

// Digital downloads a client has paid for, per gallery: the store's Payment step writes them, and the
// client gallery reads them to unlock paid sizes for those photos (src/gallery/lib/downloads.js).
//
// Saved under galleryKey(id, 'purchases') as `{ all, ids, files, galleries }`:
//   all   — the Whole Gallery Download was bought at the original resolution: every photo, including
//           ones added later
//   galleries — [versionId]: the Whole Gallery Download bought in a smaller version (every photo, in it)
//   ids   — photos bought at the original resolution, one by one
//   files — { [photoId]: [versionId] }: photos bought as a smaller Digital Download version
// The original resolution covers every smaller version of the same photo.

const strings = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [])
const load = (key) => {
  const v = readJSON(key, {})
  const files = v?.files && typeof v.files === 'object' && !Array.isArray(v.files)
    ? Object.fromEntries(Object.entries(v.files).map(([k, list]) => [k, strings(list)]))
    : {}
  return { all: v?.all === true, ids: strings(v?.ids), files, galleries: strings(v?.galleries) }
}
const family = forGallery('purchases', load)

/**
 * Adds a paid order to a gallery's purchases: `{ all?, ids?, files?, galleries? }` (`ids`: photos bought
 * at the original resolution; `files`: `[{ photoId, version }]` bought as a smaller version;
 * `galleries`: versions the whole gallery was bought in).
 */
export function recordPurchase(galleryId, { all = false, ids = [], files = [], galleries = [] }) {
  family(galleryId).set((cur) => {
    const next = { ...cur.files }
    files.forEach(({ photoId, version }) => { next[photoId] = [...new Set([...(next[photoId] ?? []), version])] })
    return { all: cur.all || all, ids: [...new Set([...cur.ids, ...ids])], files: next, galleries: [...new Set([...cur.galleries, ...galleries])] }
  })
}

/**
 * `{ all, ids, files, galleries, owns(photo, version?), ownsGallery(version?) }` for a gallery. Without
 * `version`, `owns` asks about the original resolution; with one, whether that version (or the original)
 * was bought, for this photo or for the whole gallery. `ownsGallery` asks the same of the whole gallery.
 */
export function usePurchases(galleryId) {
  const [value] = family(galleryId).use()
  const ownsGallery = useCallback((version) => value.all || (!!version && value.galleries.includes(version)), [value])
  const owns = useCallback(
    (p, version) => ownsGallery(version) || value.ids.includes(p.id) || (!!version && !!value.files[p.id]?.includes(version)),
    [value, ownsGallery]
  )
  return { ...value, owns, ownsGallery }
}
