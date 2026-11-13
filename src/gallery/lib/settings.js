import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { readJSON } from '../../lib/persisted'
import { forGallery, useGalleryId } from '../../data/galleries'

// Grid options. Names match the Live Canvas gallery editor (spacing / thumbSize / orientation).
export const SPACING = [
  { id: 'airy', label: 'Airy' },
  { id: 'thin', label: 'Thin' },
  { id: 'none', label: 'None' },
]

export const ORIENTATION = [
  { id: 'vertical', label: 'Vertical', hint: 'Masonry columns' },
  { id: 'horizontal', label: 'Horizontal', hint: 'Justified rows' },
]

export const SIZE = [
  { id: 'small', label: 'Small', hint: '4 per row' },
  { id: 'medium', label: 'Medium', hint: '3 per row' },
  { id: 'large', label: 'Large', hint: '2 per row' },
]

export const DEFAULTS = { spacing: 'thin', orientation: 'vertical', size: 'medium' }

/** Items per row/column, by breakpoint. Desktop matches the spec; smaller screens step down. */
export const COLUMNS = {
  small: { mobile: 2, tablet: 3, desktop: 4 },
  medium: { mobile: 2, tablet: 3, desktop: 3 },
  large: { mobile: 1, tablet: 2, desktop: 2 },
}

/** Gap between photos, and page-edge margin, in px, by breakpoint. */
export const GAP = {
  none: { mobile: 0, tablet: 0, desktop: 0 },
  thin: { mobile: 4, tablet: 4, desktop: 4 },
  airy: { mobile: 16, tablet: 32, desktop: 48 },
}
export const MARGIN = {
  none: { mobile: 0, tablet: 0, desktop: 0 },
  thin: { mobile: 4, tablet: 16, desktop: 16 },
  airy: { mobile: 16, tablet: 32, desktop: 48 },
}

const valid = (list, v, d) => (list.some((o) => o.id === v) ? v : d)

// The photographer's default grid, set in the dashboard. Clients can still change their own view
// (Layout menu), which goes in the URL; the URL only carries values that differ from these defaults.
const loadDefaults = (key) => {
  const saved = readJSON(key, {})
  return {
    spacing: valid(SPACING, saved.spacing, DEFAULTS.spacing),
    orientation: valid(ORIENTATION, saved.orientation, DEFAULTS.orientation),
    size: valid(SIZE, saved.size, DEFAULTS.size),
  }
}
const gridDefaults = forGallery('grid', loadDefaults)

/** The photographer's default grid: `[defaults, set(key, value), reset()]`. */
export function useGridDefaults() {
  const [defaults, setDefaults] = gridDefaults(useGalleryId()).use()
  const set = useCallback((key, value) => setDefaults((d) => ({ ...d, [key]: value })), [setDefaults])
  const reset = useCallback(() => setDefaults({ ...DEFAULTS }), [setDefaults])
  return [defaults, set, reset]
}

/**
 * Grid settings the client sees: the photographer's defaults, overridden by the URL
 * (?spacing=airy&orientation=horizontal&size=large), so a layout can still be shared by link.
 */
export function useGridSettings() {
  const [params, setParams] = useSearchParams()
  const [base] = gridDefaults(useGalleryId()).use()
  const settings = {
    spacing: valid(SPACING, params.get('spacing'), base.spacing),
    orientation: valid(ORIENTATION, params.get('orientation'), base.orientation),
    size: valid(SIZE, params.get('size'), base.size),
  }
  const set = useCallback(
    (key, value) =>
      setParams(
        (p) => {
          const next = new URLSearchParams(p)
          if (value === gridDefaults.get()[key]) next.delete(key)
          else next.set(key, value)
          return next
        },
        { replace: true, preventScrollReset: true }
      ),
    [setParams]
  )
  return [settings, set]
}
