import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { IMAGE_SIZES } from '../../photographer-dashboard/gallery/access'
import { persistedFamily, readJSON } from '../../lib/persisted'
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

const OPEN = { on: true, pin: null, sizes: SIZES, limit: null }

/** `{ on, pin, sizes, limit }` for this visitor. `pin` is the 4-digit code or null; `limit` a number or null. */
export function useDownloadRules() {
  const d = useVisitor()?.visitor.d
  return useMemo(() => {
    if (!d) return OPEN
    const dl = d.downloads
    const sizes = SIZES.filter((z) => dl.image.sizes[z.id])
    const limit = Number(dl.image.limit)
    return {
      on: dl.on && dl.image.on && sizes.length > 0,
      pin: dl.pin.on && /^\d{4}$/.test(dl.pin.code) ? dl.pin.code : null,
      sizes,
      limit: limit > 0 ? limit : null,
    }
  }, [d])
}

/**
 * Rules + the visitor's allowance. The limit counts distinct photos (saved per gallery under
 * `gallery-downloads:<clientKey>`), so downloading a photo again never uses the allowance twice.
 * The PIN, once entered, holds for the visit.
 */
export function useDownloads(clientKey) {
  const rules = useDownloadRules()
  const [done, , , setMany] = usePersistedIds(`gallery-downloads:${clientKey}`)
  const [unlocked, setUnlocked] = useState(false)
  const left = rules.limit == null ? Infinity : Math.max(0, rules.limit - done.size)

  const isNew = useCallback((p) => !done.has(p.id), [done])
  const record = useCallback((photos) => setMany(photos.map((p) => p.id), true), [setMany])
  const unlock = useCallback((code) => {
    const ok = code === rules.pin
    if (ok) setUnlocked(true)
    return ok
  }, [rules.pin])

  return { rules, used: done.size, left, isNew, record, locked: !!rules.pin && !unlocked, unlock }
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
