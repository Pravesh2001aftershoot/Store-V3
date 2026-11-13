import { useEffect, useRef } from 'react'

// Client pages rendered inside the photographer dashboard's preview frame.
//
// The dashboard loads a page with `?embed=1`. Embedded pages hide their own edit buttons (the
// dashboard is where editing happens) and accept "show this part" messages from the dashboard, so
// the preview scrolls to whatever is being edited.

export const PREVIEW_MESSAGE = 'store-v3:preview'

/** True when this page was opened as a dashboard preview. */
export const isEmbedded = () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('embed')

/** Calls `onTarget(target)` when the dashboard asks the preview to show `target`. */
export function usePreviewTarget(onTarget) {
  const fn = useRef(onTarget)
  fn.current = onTarget
  useEffect(() => {
    if (!isEmbedded()) return
    const on = (e) => {
      if (e.origin !== window.location.origin || e.data?.type !== PREVIEW_MESSAGE) return
      fn.current(e.data.target)
    }
    window.addEventListener('message', on)
    return () => window.removeEventListener('message', on)
  }, [])
}

/** Scrolls an element into view at the top of the page (used by embedded pages). */
export const scrollToEl = (el, offset = 0) => {
  if (!el) return
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' })
}
