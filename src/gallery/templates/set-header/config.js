import { useCallback, useMemo } from 'react'
import { forGallery, useGalleryId } from '../../../data/galleries'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/cormorant-garamond'
import '@fontsource-variable/geist-mono'
import { isComposed } from '../cover/config'

// Collection heading settings: how the heading above each collection in the grid looks.
//
//   layout  — template (the structure), text position, spacing, title size
//   type    — the title's typeface: font, weight, letter case. `matchCover` follows the cover instead.
//   show    — optional pieces shared by every heading (photo count, divider)
//   content — the words, per collection: { [collection]: { eyebrow?, title?, description? } }.
//             Only edited fields are stored; the rest fall back to the collection's own name and count.
//
// Layout, type and show apply to every collection, so the gallery reads as one piece; the words are
// per collection. Choosing a template never touches the words or the type.

export const LIMITS = { eyebrow: 32, title: 40, description: 160 }

export const FONTS = [
  { id: 'sans', label: 'Sans', family: "'Geist Variable', ui-sans-serif, system-ui, sans-serif", hint: 'Geist — the gallery’s own typeface' },
  { id: 'serif', label: 'Serif', family: "'Fraunces Variable', ui-serif, Georgia, serif", hint: 'Fraunces — soft, editorial' },
  { id: 'garamond', label: 'Classic', family: "'Cormorant Garamond Variable', ui-serif, Georgia, serif", hint: 'Cormorant Garamond — fine, high contrast' },
  { id: 'mono', label: 'Mono', family: "'Geist Mono Variable', ui-monospace, monospace", hint: 'Geist Mono — technical, understated' },
]
export const font = (id) => FONTS.find((f) => f.id === id) ?? FONTS[0]

export const WEIGHTS = [
  { id: 300, label: 'Light' },
  { id: 400, label: 'Regular' },
  { id: 600, label: 'Bold' },
]

export const CASES = [
  { id: 'none', label: 'As typed' },
  { id: 'uppercase', label: 'Uppercase' },
]

export const ALIGN = [
  { id: 'left', label: 'Left' },
  { id: 'center', label: 'Center' },
  { id: 'right', label: 'Right' },
]

export const SIZES = [
  { id: 's', label: 'Small' },
  { id: 'm', label: 'Medium' },
  { id: 'l', label: 'Large' },
]

/** Room above and below the heading. */
export const SPACING = [
  { id: 'compact', label: 'Compact' },
  { id: 'regular', label: 'Regular' },
  { id: 'airy', label: 'Airy' },
]

const t = (id, name, description, layout, show = {}) => ({
  id,
  name,
  description,
  layout: { template: id, align: 'left', size: 'm', spacing: 'regular', flip: false, ...layout },
  show: { eyebrow: true, divider: false, ...show },
})

// Each template is a different structure (see SectionHeader.jsx).
export const TEMPLATES = [
  t('classic', 'Classic', 'Photo count over a large title'),
  t('centered', 'Centered', 'Title centred between two fine rules', { align: 'center' }, { divider: true }),
  t('split', 'Split', 'Title on one side, your note on the other', { size: 'l' }),
  t('numbered', 'Numbered', 'Chapter number beside the title', {}, { divider: true }),
  t('inline', 'Inline', 'A quiet title and count on one hairline', { size: 's', spacing: 'compact' }),
]

/** Which controls each template uses, so the editor only offers those. */
export const SUPPORTS = {
  classic: ['align', 'divider'],
  centered: ['divider'],
  split: ['flip', 'divider'],
  numbered: ['align', 'divider'],
  inline: [],
}
export const supports = (layout, key) => SUPPORTS[layout.template]?.includes(key) ?? false

// Headings follow the cover until the photographer chooses their own type.
const DEFAULT_TYPE = { matchCover: true, font: 'sans', weight: 600, case: 'none' }
const DEFAULT = { layout: TEMPLATES[0].layout, show: TEMPLATES[0].show, type: DEFAULT_TYPE, content: {} }

// Composed covers centre their title on these; the rest sit it to one side (mirrored by `flip`).
const CENTRED_COVERS = ['frame', 'stacked', 'triptych', 'banner']

/**
 * The cover's title style, as heading type + position. The cover is always set in Geist:
 * full-bleed covers use a bold title placed by the cover's own alignment; composed covers a light,
 * uppercase one.
 */
export function coverStyle(cover) {
  const L = cover?.layout
  if (!L) return { type: { font: 'sans', weight: 600, case: 'none' }, align: 'left', size: 'm' }
  if (!isComposed(L)) return { type: { font: 'sans', weight: 600, case: 'none' }, align: L.align ?? 'left', size: L.titleSize ?? 'm' }
  const align = CENTRED_COVERS.includes(L.composition) ? 'center' : L.flip ? 'right' : 'left'
  return { type: { font: 'sans', weight: 300, case: 'uppercase' }, align, size: L.titleSize ?? 'm' }
}

function load(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key))
    if (!saved) return DEFAULT
    return {
      layout: { ...DEFAULT.layout, ...saved.layout },
      show: { ...DEFAULT.show, ...saved.show },
      type: { ...DEFAULT_TYPE, ...saved.type },
      content: saved.content && typeof saved.content === 'object' ? saved.content : {},
    }
  } catch {
    return DEFAULT
  }
}

const same = (a, b) => Object.keys(a).every((k) => a[k] === b[k])

// Shared by every reader in this tab, and kept in sync with other tabs and the dashboard preview.
const family = forGallery('sections', load)

/**
 * Heading settings, saved to this browser. `cover` is the live cover config, used when the type is
 * set to match it. Returns the resolved `style` (what headings draw with) plus setters.
 */
export function useSectionConfig(cover) {
  const [state, setState] = family(useGalleryId()).use()

  const setLayout = useCallback((patch) => setState((s) => ({ ...s, layout: { ...s.layout, ...patch } })), [])
  const setShow = useCallback((patch) => setState((s) => ({ ...s, show: { ...s.show, ...patch } })), [])
  const setType = useCallback((patch) => setState((s) => ({ ...s, type: { ...s.type, ...patch } })), [])
  /** Edits the words of one collection's heading. */
  const setContent = useCallback(
    (collection, patch) => setState((s) => ({ ...s, content: { ...s.content, [collection]: { ...s.content[collection], ...patch } } })),
    []
  )
  /** Puts a collection's words back to its own name and count. */
  const clearContent = useCallback(
    (collection) => setState((s) => {
      const { [collection]: _, ...rest } = s.content
      return { ...s, content: rest }
    }),
    []
  )
  const applyTemplate = useCallback((id) => {
    const tpl = TEMPLATES.find((x) => x.id === id)
    if (tpl) setState((s) => ({ ...s, layout: tpl.layout, show: tpl.show }))
  }, [])
  const reset = useCallback(() => setState(DEFAULT), [])

  const fromCover = useMemo(() => coverStyle(cover), [cover])

  // What the headings actually draw with: matching the cover overrides type, alignment and size.
  const style = useMemo(() => {
    if (!state.type.matchCover) return { layout: state.layout, show: state.show, type: state.type }
    return {
      layout: { ...state.layout, ...(supports(state.layout, 'align') ? { align: fromCover.align } : {}), size: fromCover.size },
      show: state.show,
      type: { ...state.type, ...fromCover.type },
    }
  }, [state, fromCover])

  /** A collection's words, with its own name and count filled in where nothing's been typed. */
  const words = useCallback(
    (collection, count) => {
      const c = state.content[collection] ?? {}
      return {
        eyebrow: c.eyebrow ?? `${count} photos`,
        title: c.title?.trim() ? c.title : collection,
        description: c.description ?? '',
        raw: c,
      }
    },
    [state.content]
  )

  const tpl = TEMPLATES.find((x) => x.id === state.layout.template)
  const edited = !tpl || !same(tpl.layout, state.layout) || !same(tpl.show, state.show) || !same(DEFAULT_TYPE, state.type)

  return { state, style, words, fromCover, edited, setLayout, setShow, setType, setContent, clearContent, applyTemplate, reset }
}
