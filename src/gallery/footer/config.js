import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BehanceLogo, FacebookLogo, Globe, InstagramLogo, LinkedinLogo, PinterestLogo, ThreadsLogo, TiktokLogo, WhatsappLogo, XLogo, YoutubeLogo,
} from '@phosphor-icons/react'

// Footer settings: what the photographer can change about the gallery footer.
//
//   layout  — template (the structure), background, how socials look, the photo on the card template
//   show    — which optional pieces are visible
//   content — the words. Only edited fields are stored; the rest fall back to the gallery's own data.
//   socials — ordered list of { platform, value }. `value` is a handle or a full URL.
//
// Templates are preset `layout` + `show` combinations. Choosing one never touches `content` or `socials`.

/**
 * Footer backgrounds, all from the design system's surfaces. `dark` re-maps the colour tokens inside
 * the footer only (see `DARK_TOKENS` in Footer.jsx), so every template keeps using `type-*` / `surface-*`.
 * `bg` is what the editor's swatch shows.
 */
export const SURFACES = [
  { id: 'white', label: 'White', bg: 'var(--surface-1)', className: 'bg-surface-1' },
  { id: 'page', label: 'Page', bg: 'var(--surface-0)', className: 'bg-surface-0' },
  { id: 'grey', label: 'Grey', bg: 'var(--surface-2)', className: 'bg-surface-2' },
  { id: 'dark', label: 'Dark', bg: 'var(--type-0)', className: 'bg-surface-1', dark: true },
]
// Backgrounds from the first version of the footer, mapped to the closest surface.
const LEGACY_SURFACE = { paper: 'grey', linen: 'grey', ink: 'dark' }

export const LIMITS = { tagline: 90, email: 60, location: 40, cta: 24, wordmark: 16 }

export const SOCIAL_STYLE = [
  { id: 'icons', label: 'Icons' },
  { id: 'names', label: 'Names' },
]

/**
 * Social platforms. `url(handle)` builds the profile link from a handle; a full URL is used as is.
 * `handle: false` means only a URL makes sense (website).
 */
export const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: InstagramLogo, placeholder: '@yourstudio', url: (h) => `https://instagram.com/${h}` },
  { id: 'facebook', label: 'Facebook', icon: FacebookLogo, placeholder: 'yourstudio', url: (h) => `https://facebook.com/${h}` },
  { id: 'tiktok', label: 'TikTok', icon: TiktokLogo, placeholder: '@yourstudio', url: (h) => `https://tiktok.com/@${h}` },
  { id: 'pinterest', label: 'Pinterest', icon: PinterestLogo, placeholder: 'yourstudio', url: (h) => `https://pinterest.com/${h}` },
  { id: 'youtube', label: 'YouTube', icon: YoutubeLogo, placeholder: '@yourstudio', url: (h) => `https://youtube.com/@${h}` },
  { id: 'x', label: 'X', icon: XLogo, placeholder: '@yourstudio', url: (h) => `https://x.com/${h}` },
  { id: 'threads', label: 'Threads', icon: ThreadsLogo, placeholder: '@yourstudio', url: (h) => `https://threads.net/@${h}` },
  { id: 'linkedin', label: 'LinkedIn', icon: LinkedinLogo, placeholder: 'in/yourname', url: (h) => `https://linkedin.com/${h.startsWith('in/') || h.startsWith('company/') ? h : `in/${h}`}` },
  { id: 'behance', label: 'Behance', icon: BehanceLogo, placeholder: 'yourstudio', url: (h) => `https://behance.net/${h}` },
  { id: 'whatsapp', label: 'WhatsApp', icon: WhatsappLogo, placeholder: '+1 305 555 0100', url: (h) => `https://wa.me/${h.replace(/\D/g, '')}` },
  { id: 'website', label: 'Website', icon: Globe, placeholder: 'yourstudio.com', url: (h) => `https://${h}` },
]
export const platform = (id) => PLATFORMS.find((p) => p.id === id)

/** The link for a social entry, or null when the value is empty. */
export function socialUrl({ platform: id, value }) {
  const v = value.trim()
  if (!v) return null
  if (/^https?:\/\//i.test(v)) return v
  const p = platform(id)
  return p ? p.url(v.replace(/^@/, '')) : null
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

const SHOW = { logo: true, tagline: true, email: true, location: true, socials: true, links: true, cta: true, wordmark: true, credit: true, backToTop: true }

const t = (id, name, description, layout, show = {}) => ({
  id,
  name,
  description,
  layout: { template: id, surface: 'white', socialStyle: 'icons', ...layout },
  show: { ...SHOW, ...show },
})

// Each template is a different structure (see Footer.jsx). Inspired by a few studio and product sites,
// re-drawn for a photographer's gallery.
export const TEMPLATES = [
  t('simple', 'Simple', 'Logo, socials and a line of small print', {}, { tagline: false, location: false, links: false, cta: false, wordmark: false }),
  t('statement', 'Statement', 'Tagline beside link columns, faint wordmark', { socialStyle: 'names' }, { logo: false, cta: false }),
  t('talk', 'Let’s talk', 'An invitation to get in touch, with a button', { socialStyle: 'names' }, { logo: false, wordmark: false }),
  t('card', 'Photo card', 'Text beside a framed photo with a button', {}, { wordmark: false }),
  t('grid', 'Grid', 'Everything set in a grid of hairlines', { socialStyle: 'names' }, { cta: false, wordmark: false }),
  t('wordmark', 'Wordmark', 'Columns over your name, edge to edge', { socialStyle: 'names' }, { logo: false, cta: false }),
]

/** Which optional pieces each template actually draws, so the editor only offers those. */
export const SUPPORTS = {
  simple: ['logo', 'tagline', 'email', 'location', 'socials', 'links', 'credit', 'backToTop'],
  statement: ['logo', 'tagline', 'email', 'location', 'socials', 'links', 'wordmark', 'credit', 'backToTop'],
  talk: ['logo', 'tagline', 'email', 'location', 'socials', 'links', 'cta', 'credit', 'backToTop'],
  card: ['logo', 'tagline', 'email', 'location', 'socials', 'links', 'cta', 'credit', 'backToTop'],
  grid: ['logo', 'tagline', 'email', 'location', 'socials', 'links', 'credit', 'backToTop'],
  wordmark: ['logo', 'tagline', 'email', 'location', 'socials', 'links', 'wordmark', 'credit', 'backToTop'],
}
export const supports = (layout, key) => SUPPORTS[layout.template]?.includes(key) ?? false

const DEFAULT_SOCIALS = [
  { platform: 'instagram', value: '' },
  { platform: 'facebook', value: '' },
]

const DEFAULT = { layout: TEMPLATES[0].layout, show: TEMPLATES[0].show, content: {}, socials: null }

/** The gallery's own data, used for any field the photographer hasn't edited. */
export const defaultContent = (gallery, profile) => ({
  tagline: 'Honest, unhurried photographs of the days that matter.',
  email: profile.email,
  location: profile.location,
  cta: 'Book a session',
  wordmark: gallery.studio,
})

/** Default social handles, from the photographer's profile. */
export const defaultSocials = (profile) =>
  DEFAULT_SOCIALS.map((s) => (s.platform === 'instagram' ? { ...s, value: profile.instagram ?? '' } : s))

const same = (a, b) => Object.keys(a).every((k) => a[k] === b[k])

/** True while the layout and visibility match the template exactly. */
const pristine = (state) => {
  const tpl = TEMPLATES.find((x) => x.id === state.layout.template)
  return !!tpl && same(tpl.layout, state.layout) && same(tpl.show, state.show)
}

const KEY = 'store-v3:gallery-footer'

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (!saved) return DEFAULT
    const layout = { ...DEFAULT.layout, ...saved.layout }
    layout.surface = LEGACY_SURFACE[layout.surface] ?? (SURFACES.some((x) => x.id === layout.surface) ? layout.surface : 'white')
    return {
      layout,
      show: { ...DEFAULT.show, ...saved.show },
      content: { ...saved.content },
      socials: Array.isArray(saved.socials) ? saved.socials.filter((s) => platform(s.platform)) : null,
    }
  } catch {
    return DEFAULT
  }
}

/**
 * Footer settings, saved to this browser. `defaults` fills in any text that hasn't been edited and
 * `socialDefaults` is the starting list of socials. Returns the resolved config plus setters.
 */
export function useFooterConfig(defaults, socialDefaults) {
  const [state, setState] = useState(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* private mode: settings just won't persist */ }
  }, [state])

  const setLayout = useCallback((patch) => setState((s) => ({ ...s, layout: { ...s.layout, ...patch } })), [])
  const setShow = useCallback((patch) => setState((s) => ({ ...s, show: { ...s.show, ...patch } })), [])
  const setContent = useCallback((patch) => setState((s) => ({ ...s, content: { ...s.content, ...patch } })), [])
  const setSocials = useCallback((fn) => setState((s) => ({ ...s, socials: fn(s.socials ?? socialDefaults) })), [socialDefaults])
  // Keep the chosen photo when switching templates; everything else comes from the template.
  const applyTemplate = useCallback((id) => {
    const tpl = TEMPLATES.find((x) => x.id === id)
    if (tpl) setState((s) => ({ ...s, layout: { ...tpl.layout, photoId: s.layout.photoId }, show: tpl.show }))
  }, [])
  const reset = useCallback(() => setState(DEFAULT), [])

  const config = useMemo(
    () => ({ layout: state.layout, show: state.show, content: { ...defaults, ...state.content }, socials: state.socials ?? socialDefaults }),
    [state, defaults, socialDefaults]
  )
  const { photoId, ...layout } = state.layout
  const edited = !pristine({ ...state, layout })

  return { config, edited, setLayout, setShow, setContent, setSocials, applyTemplate, reset }
}
