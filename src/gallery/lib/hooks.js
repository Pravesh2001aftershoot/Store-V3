import { useEffect, useMemo, useRef, useState } from 'react'

const QUERIES = { desktop: '(min-width: 1024px)', tablet: '(min-width: 640px)' }

const current = () => {
  if (typeof window === 'undefined') return 'desktop'
  if (window.matchMedia(QUERIES.desktop).matches) return 'desktop'
  if (window.matchMedia(QUERIES.tablet).matches) return 'tablet'
  return 'mobile'
}

/** 'mobile' (<640) · 'tablet' (640–1023) · 'desktop' (≥1024) */
export function useBreakpoint() {
  const [bp, setBp] = useState(current)
  useEffect(() => {
    const mqs = Object.values(QUERIES).map((q) => window.matchMedia(q))
    const on = () => setBp(current())
    mqs.forEach((m) => m.addEventListener('change', on))
    return () => mqs.forEach((m) => m.removeEventListener('change', on))
  }, [])
  return bp
}

/**
 * Infinite scroll. Reveals `batch` more items whenever the sentinel nears the viewport.
 * `min` forces at least that many to be shown (e.g. to jump to a section further down).
 * Returns how many to show, a ref for the sentinel, and whether everything is shown.
 */
export function useInfinite(total, { batch = 24, resetKey, min = 0 } = {}) {
  const [stored, setCount] = useState(batch)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)
  const count = Math.max(stored, min)
  const done = count >= total

  useEffect(() => { setCount(batch) }, [resetKey, batch])

  useEffect(() => {
    const el = ref.current
    if (!el || done) return
    let timer
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || timer) return
        setLoading(true)
        // Short delay stands in for a paginated API request.
        timer = setTimeout(() => {
          setCount((c) => Math.min(total, Math.max(c, min) + batch))
          setLoading(false)
          timer = undefined
        }, 350)
      },
      { rootMargin: '0px 0px 1200px 0px' }
    )
    io.observe(el)
    return () => { io.disconnect(); clearTimeout(timer) }
  }, [total, batch, done, count, min])

  return { count: Math.min(count, total), ref, done, loading }
}

/** Fills in `w`/`h` for photos without known dimensions (local uploads) by loading them. */
export function useMeasuredPhotos(list) {
  const [dims, setDims] = useState({})
  useEffect(() => {
    let alive = true
    list.forEach((p) => {
      if (p.w && p.h) return
      const img = new Image()
      img.onload = () => alive && setDims((d) => ({ ...d, [p.id]: [img.naturalWidth, img.naturalHeight] }))
      img.src = p.thumb
    })
    return () => { alive = false }
  }, [list])
  return useMemo(
    () => list.map((p) => (p.w && p.h ? p : dims[p.id] ? { ...p, w: dims[p.id][0], h: dims[p.id][1] } : { ...p, w: 3, h: 2 })),
    [list, dims]
  )
}
