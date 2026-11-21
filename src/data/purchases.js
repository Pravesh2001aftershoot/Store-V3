import { useCallback } from 'react'
import { readJSON } from '../lib/persisted'
import { forGallery } from './galleries'

// Digital downloads a client has paid for, per gallery: the store's Payment step writes them, and the
// client gallery reads them to unlock High res for those photos (src/gallery/lib/downloads.js).
//
// Saved under galleryKey(id, 'purchases') as `{ all, ids }`: `all` once the Whole Gallery Download is
// bought (every photo, including ones added later), otherwise the ids of photos bought one by one.

const load = (key) => {
  const v = readJSON(key, {})
  return { all: v?.all === true, ids: Array.isArray(v?.ids) ? v.ids.filter((x) => typeof x === 'string') : [] }
}
const family = forGallery('purchases', load)

/** Adds a paid order to a gallery's purchases: `{ all?, ids? }`. */
export function recordPurchase(galleryId, { all = false, ids = [] }) {
  family(galleryId).set((cur) => ({ all: cur.all || all, ids: [...new Set([...cur.ids, ...ids])] }))
}

/** `{ all, ids, owns(photo) }` for a gallery. */
export function usePurchases(galleryId) {
  const [value] = family(galleryId).use()
  const owns = useCallback((p) => value.all || value.ids.includes(p.id), [value])
  return { ...value, owns }
}
