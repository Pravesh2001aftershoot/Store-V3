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
//             `type.eyebrow` and `type.note` are the label's and the note's own { font, weight, size };
//             the cover never decides those.
//   show    — optional pieces (photo count; fine rules, which always come from the template: see bindRules)
//   content — the words, per collection: { [collection]: { eyebrow?, title?, description? } }.
//             Only edited fields are stored; the rest fall back to the collection's own name and count.
//   perSet  — false: one layout (layout + show) for every heading. true: each collection can have its own.
//   sets    — per-collection layouts while perSet is on: { [collection]: { layout, show } }. A collection
//             without one uses the shared layout. Kept when perSet is turned off, so turning it back on restores them.
//
// Type always applies to every collection, so the gallery reads as one piece; the words are per
// collection. Choosing a template never touches the words or the type.

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
  t('numbered', 'Numbered', 'Chapter number beside the title'),
  t('inline', 'Inline', 'A quiet title and count on one hairline', { size: 's', spacing: 'compact' }),
]

/** Which controls each template uses, so the editor only offers those. */
export const SUPPORTS = {
  classic: ['align'],
  centered: [],
  split: ['flip'],
  numbered: ['align'],
  inline: [],
}
export const supports = (layout, key) => SUPPORTS[layout.template]?.includes(key) ?? false

/** Fine rules aren't a setting: a heading has them when its template does (Centered). */
const bindRules = (layout, show) => ({ ...show, divider: TEMPLATES.find((x) => x.id === layout.template)?.show.divider ?? false })

// Headings follow the cover until the photographer chooses their own type.
const DEFAULT_TYPE = {
  matchCover: true, font: 'sans', weight: 600, case: 'none',
  eyebrow: { font: 'sans', weight: 600, size: 's' },
  note: { font: 'sans', weight: 400, size: 'm' },
}
const loadType = (t = {}) => ({
  ...DEFAULT_TYPE,
  ...t,
  eyebrow: { ...DEFAULT_TYPE.eyebrow, ...t.eyebrow },
  note: { ...DEFAULT_TYPE.note, ...t.note },
})
const DEFAULT = { layout: TEMPLATES[0].layout, show: TEMPLATES[0].show, type: DEFAULT_TYPE, content: {}, perSet: false, sets: {} }

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
    const layout = { ...DEFAULT.layout, ...saved.layout }
    return {
      layout,
      show: bindRules(layout, { ...DEFAULT.show, ...saved.show }),
      type: loadType(saved.type),
      content: saved.content && typeof saved.content === 'object' ? saved.content : {},
      perSet: saved.perSet === true,
      sets: Object.fromEntries(
        Object.entries(saved.sets && typeof saved.sets === 'object' ? saved.sets : {})
          .filter(([, v]) => v && typeof v === 'object')
          .map(([k, v]) => { const l = { ...DEFAULT.layout, ...v.layout }; return [k, { layout: l, show: bindRules(l, { ...DEFAULT.show, ...v.show }) }] })
      ),
    }
  } catch {
    return DEFAULT
  }
}

const same = (a, b) => Object.keys(a).every((k) => (a[k] && typeof a[k] === 'object' ? same(a[k], b?.[k] ?? {}) : a[k] === b?.[k]))

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
  /** The label's or the note's own type: `piece` is 'eyebrow' or 'note'. */
  const setPieceType = useCallback((piece, patch) => setState((s) => ({ ...s, type: { ...s.type, [piece]: { ...s.type[piece], ...patch } } })), [])
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
  /** Same layout for every heading (false) or a layout per collection (true). */
  const setPerSet = useCallback((perSet) => setState((s) => ({ ...s, perSet })), [])

  const fromCover = useMemo(() => coverStyle(cover), [cover])

  // What a heading actually draws with: matching the cover overrides type, alignment and size.
  const resolve = useCallback((layout, rawShow) => {
    const show = bindRules(layout, rawShow)
    if (!state.type.matchCover) return { layout, show, type: state.type }
    return {
      layout: { ...layout, ...(supports(layout, 'align') ? { align: fromCover.align } : {}), size: fromCover.size },
      show,
      type: { ...state.type, ...fromCover.type },
    }
  }, [state.type, fromCover])
  const style = useMemo(() => resolve(state.layout, state.show), [resolve, state.layout, state.show])

  /** The layout a collection uses: its own while perSet is on (if it has one), else the shared one. */
  const own = useCallback(
    (collection) => (state.perSet && collection && state.sets[collection]) || { layout: state.layout, show: state.show },
    [state]
  )
  /** The style one collection's heading draws with. */
  const styleFor = useCallback((collection) => { const o = own(collection); return resolve(o.layout, o.show) }, [own, resolve])

  /**
   * Layout reads and writes for one collection: its own layout while perSet is on, the shared one otherwise.
   * `{ layout, show, style, setLayout, setShow, applyTemplate }`.
   */
  const scoped = useCallback((collection) => {
    const o = own(collection)
    const write = (fn) => setState((s) => {
      if (!s.perSet || !collection) return { ...s, ...fn({ layout: s.layout, show: s.show }) }
      const cur = s.sets[collection] ?? { layout: s.layout, show: s.show }
      return { ...s, sets: { ...s.sets, [collection]: { ...cur, ...fn(cur) } } }
    })
    return {
      layout: o.layout,
      show: o.show,
      style: resolve(o.layout, o.show),
      setLayout: (patch) => write((c) => ({ layout: { ...c.layout, ...patch } })),
      setShow: (patch) => write((c) => ({ show: { ...c.show, ...patch } })),
      applyTemplate: (id) => {
        const tpl = TEMPLATES.find((x) => x.id === id)
        if (tpl) write(() => ({ layout: tpl.layout, show: tpl.show }))
      },
    }
  }, [own, resolve])

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

  return {
    state, style, styleFor, scoped, words, fromCover, edited,
    setLayout, setShow, setType, setPieceType, setContent, clearContent, applyTemplate, setPerSet, reset,
  }
}
