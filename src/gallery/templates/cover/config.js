import { useCallback, useMemo } from 'react'
import { forGallery, useGalleryId } from '../../../data/galleries'

// Cover settings: what the photographer can change about the gallery cover.
//
//   layout  — where things sit (text position, alignment, logo, buttons, margins, overlay)
//   show    — which optional pieces are visible
//   content — the words. Only edited fields are stored; the rest fall back to the gallery's own data.
//
// Templates are preset `layout` + `show` combinations. Choosing one never touches `content`.
//
// `layout.composition` picks the kind of cover:
//   overlay  — the photo fills the screen and the text sits on top (position grid, overlay…)
//   anything else — a composed cover: the photo is placed on a solid backdrop (see Composed.jsx),
//                   tuned with shape, photoSize, flip and surface.

/** Character limits for the text fields. */
export const LIMITS = { eyebrow: 40, title: 40, subtitle: 80, primaryCta: 20, secondaryCta: 20 }

/** 3 × 3 text positions, as `<vertical>-<horizontal>`. */
export const POSITIONS = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'middle-center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
]

export const ALIGN = [
  { id: 'left', label: 'Left' },
  { id: 'center', label: 'Center' },
  { id: 'right', label: 'Right' },
]

// `layout.logo` is one value: 'top-left' | 'top-center' | 'top-right' | 'inline' | 'hidden'.
// The editor shows it as three controls: show/hide, placement, and (in the top bar) alignment.

/** Where a visible logo sits. */
export const LOGO_PLACEMENT = [
  { id: 'top', label: 'Top bar' },
  { id: 'inline', label: 'In text' },
]

/** Alignment of the logo in the top bar. */
export const LOGO_ALIGN = [
  { id: 'top-left', label: 'Left' },
  { id: 'top-center', label: 'Center' },
  { id: 'top-right', label: 'Right' },
]

export const TITLE_SIZE = [
  { id: 's', label: 'Small' },
  { id: 'm', label: 'Medium' },
  { id: 'l', label: 'Large' },
]

export const WIDTH = [
  { id: 'narrow', label: 'Narrow', px: 520 },
  { id: 'medium', label: 'Medium', px: 720 },
  { id: 'wide', label: 'Wide', px: 960 },
]

export const CTA_LAYOUT = [
  { id: 'row', label: 'Side by side' },
  { id: 'stack', label: 'Stacked' },
]

export const CTA_SIZE = [
  { id: 'md', label: 'Regular' },
  { id: 'lg', label: 'Large' },
]

/** Slider ranges, in px at full desktop width. Smaller screens scale these down (see Cover). */
export const MARGIN_X = { min: 0, max: 120, step: 4 }
export const MARGIN_Y = { min: 0, max: 160, step: 4 }

/** Composed cover kinds. `shape`: uses the photo shape control. `flip`: can mirror sides. `photos`: how many photos it shows. */
export const COMPOSITIONS = {
  overlay: { name: 'Full bleed' },
  banner: { name: 'Banner', flip: true, photos: 1 },
  split: { name: 'Split', flip: true, photos: 1 },
  frame: { name: 'Framed', shape: true, photos: 1 },
  strip: { name: 'Side title', flip: true, photos: 1 },
  triptych: { name: 'Triptych', shape: true, photos: 3 },
  corner: { name: 'Corner print', shape: true, flip: true, photos: 1 },
  stacked: { name: 'Stacked', shape: true, photos: 1 },
}

export const isComposed = (layout) => layout.composition !== 'overlay'
export const photoCount = (layout) => COMPOSITIONS[layout.composition]?.photos ?? 1

/** Photo shapes for composed covers. `auto` follows the photo's own orientation. */
export const SHAPES = [
  { id: 'auto', label: 'Auto', hint: 'Follows the photo’s own orientation' },
  { id: 'portrait', label: 'Portrait', ratio: 2 / 3 },
  { id: 'square', label: 'Square', ratio: 1 },
  { id: 'landscape', label: 'Landscape', ratio: 3 / 2 },
]

/** Width ÷ height for a shape, using the photo itself when the shape is `auto`. */
export const shapeRatio = (shape, photo) =>
  SHAPES.find((s) => s.id === shape)?.ratio ?? (photo?.w && photo?.h ? photo.w / photo.h : 2 / 3)

export const PHOTO_SIZE = [
  { id: 's', label: 'Small' },
  { id: 'm', label: 'Medium' },
  { id: 'l', label: 'Large' },
]

/** Backdrops for composed covers. */
export const SURFACES = [
  { id: 'paper', label: 'Paper', bg: '#ebebea', ink: '#2f2f2f' },
  { id: 'linen', label: 'Linen', bg: '#eee7dc', ink: '#3a3128' },
  { id: 'white', label: 'White', bg: '#fbfbfa', ink: '#1f1f1f' },
  { id: 'ink', label: 'Ink', bg: '#141414', ink: '#f1f1f1', dark: true },
]

const base = {
  layout: {
    composition: 'overlay',
    shape: 'auto',
    photoSize: 'm',
    flip: false,
    surface: 'paper',
    position: 'bottom-center',
    align: 'center',
    logo: 'top-left',
    titleSize: 'm',
    width: 'wide',
    ctaLayout: 'row',
    ctaSize: 'lg',
    marginX: 32,
    marginY: 64,
    overlay: 50,
  },
  show: { eyebrow: true, subtitle: true, primaryCta: true, secondaryCta: true, storeLink: true },
}

// One full-bleed starting point: position, logo, title size, overlay etc. are tuned under Layout.
export const TEMPLATES = [
  { id: 'full-bleed', name: 'Full bleed', description: 'Photo fills the screen, text on top', ...base },
]

// Composed covers: quiet by default (title and date), buttons can be turned on under Text.
const quiet = { eyebrow: true, subtitle: false, primaryCta: false, secondaryCta: false, storeLink: true }
const composed = (layout) => ({ ...base.layout, titleSize: 'm', marginX: 32, marginY: 32, ...layout })

export const COMPOSED_TEMPLATES = [
  { id: 'banner', name: 'Banner', description: 'Wide photo, title below', layout: composed({ composition: 'banner' }), show: quiet },
  { id: 'split', name: 'Split', description: 'Title beside a tall photo', layout: composed({ composition: 'split', titleSize: 'l' }), show: quiet },
  { id: 'framed', name: 'Framed', description: 'Centered print, title across', layout: composed({ composition: 'frame' }), show: quiet },
  { id: 'strip', name: 'Side title', description: 'Vertical title, big photo', layout: composed({ composition: 'strip', photoSize: 'l' }), show: quiet },
  { id: 'triptych', name: 'Triptych', description: 'Three photos in a row', layout: composed({ composition: 'triptych', shape: 'square', marginX: 88 }), show: quiet },
  { id: 'corner-print', name: 'Corner print', description: 'Small print, oversized title', layout: composed({ composition: 'corner', titleSize: 'l', marginX: 40, marginY: 40 }), show: quiet },
  { id: 'stacked', name: 'Stacked', description: 'Title over a centered print', layout: composed({ composition: 'stacked', titleSize: 's' }), show: quiet },
]

export const ALL_TEMPLATES = [...TEMPLATES, ...COMPOSED_TEMPLATES]

const DEFAULT = { layout: base.layout, show: base.show, content: {} }

/** The gallery's own words, used for any field the photographer hasn't edited. */
export const defaultContent = (gallery, total) => ({
  eyebrow: `${gallery.date} · ${total} photos`,
  title: gallery.client,
  subtitle: `Photographed by ${gallery.photographer}`,
  primaryCta: 'View gallery',
  secondaryCta: 'Shop prints',
})

const same = (a, b) => Object.keys(a).every((k) => a[k] === b[k])

/** The template the current layout matches exactly, or null once it's been customised. */
export const matchTemplate = (config) =>
  ALL_TEMPLATES.find((t) => same(t.layout, config.layout) && same(t.show, config.show))?.id ?? null

function load(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key))
    if (!saved) return DEFAULT
    return {
      layout: { ...DEFAULT.layout, ...saved.layout },
      show: { ...DEFAULT.show, ...saved.show },
      content: { ...saved.content },
    }
  } catch {
    return DEFAULT
  }
}

// Shared by every reader in this tab, and kept in sync with other tabs and the dashboard preview.
const family = forGallery('cover', load)

/**
 * Cover settings, saved to this browser. `defaults` fills in any text that hasn't been edited.
 * Returns the resolved config plus setters for each part.
 */
export function useCoverConfig(defaults) {
  const [state, setState] = family(useGalleryId()).use()

  const setLayout = useCallback((patch) => setState((s) => {
    const layout = { ...s.layout, ...patch }
    // The text aligns to the side of the position grid it sits on.
    if (patch.position && !patch.align) layout.align = patch.position.split('-')[1]
    return { ...s, layout }
  }), [])
  const setShow = useCallback((patch) => setState((s) => ({ ...s, show: { ...s.show, ...patch } })), [])
  const setContent = useCallback((patch) => setState((s) => ({ ...s, content: { ...s.content, ...patch } })), [])
  const applyTemplate = useCallback((id) => {
    const t = ALL_TEMPLATES.find((x) => x.id === id)
    if (t) setState((s) => ({ ...s, layout: t.layout, show: t.show }))
  }, [])
  const reset = useCallback(() => setState(DEFAULT), [])

  const config = useMemo(
    () => ({ layout: state.layout, show: state.show, content: { ...defaults, ...state.content } }),
    [state, defaults]
  )
  const template = matchTemplate(state)

  return { config, template, setLayout, setShow, setContent, applyTemplate, reset }
}
