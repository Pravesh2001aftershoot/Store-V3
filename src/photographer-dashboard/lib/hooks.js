import { useEffect, useState } from 'react'

const match = (q) => typeof window !== 'undefined' && window.matchMedia(q).matches

/** True while the media query matches. */
export function useMedia(query) {
  const [on, setOn] = useState(() => match(query))
  useEffect(() => {
    const mq = window.matchMedia(query)
    const fn = () => setOn(mq.matches)
    fn()
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [query])
  return on
}

/**
 * Wide enough to dock an editor beside its preview (≥ 960px). Below that, editors open as the
 * gallery's bottom sheet over a full-width preview.
 */
export const DOCK_QUERY = '(min-width: 960px)'
export const useDocked = () => useMedia(DOCK_QUERY)

/** Phones (< 640px): the sidebar becomes a top bar with a drawer. Same breakpoint as the client gallery. */
export const usePhone = () => useMedia('(max-width: 639px)')

/** Sidebar layout: full (≥ 1024px), icon rail (640–1023px), or none on phones (top bar + drawer). */
export const useWideNav = () => useMedia('(min-width: 1024px)')

/** Height of the phone top bar, in px. Above phones there's no top bar: the sidebar is on the left. */
export const PHONE_BAR_H = 56
/** Space above the page content: workspaces size to the screen below it, sticky rows sit under it. */
export const useTopOffset = () => (usePhone() ? PHONE_BAR_H : 0)
