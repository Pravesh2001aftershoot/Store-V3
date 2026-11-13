import { useCallback, useMemo } from 'react'
import { persisted, readJSON } from '../../lib/persisted'
import { profile as baseProfile, galleries as baseGalleries, genres as baseGenres } from './portfolio'

// Portfolio settings: what the photographer changes about their portfolio page in the dashboard.
//
//   profile — edited profile fields only; the rest fall back to the mock profile (data/portfolio.js)
//   photo   — the portrait: null (default), { id } (a portfolio photo) or { src, w, h } (an upload)
//   intro   — the hero's greeting, buttons and facts strip
//   work    — section title, gallery titles, hidden galleries/genres, genre labels and order
//   contact — the closing section's heading and rows, and the header's Enquire button
//
// Like the gallery's settings, saved to this browser and shared with the dashboard's preview.

const KEY = 'store-v3:portfolio'

export const LIMITS = {
  name: 40, role: 60, bio: 360, location: 60, availability: 30, email: 60, instagram: 40,
  greeting: 40, heading: 80, workTitle: 30, galleryTitle: 40, genreLabel: 20, discipline: 20,
}

export const FACTS = [
  { id: 'availability', label: 'Availability' },
  { id: 'focus', label: 'Focus' },
  { id: 'location', label: 'Location' },
  { id: 'experience', label: 'Experience' },
]

const DEFAULT = {
  profile: {},
  photo: null,
  intro: { greeting: null, buttons: true, facts: true, factList: { availability: true, focus: true, location: true, experience: true } },
  work: { title: null, titles: {}, hidden: [], hiddenGenres: [], genreLabels: {}, genreOrder: null },
  contact: { heading: null, availability: true, location: true, social: true, enquire: true },
}

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})
const arr = (v) => (Array.isArray(v) ? v : [])

function load() {
  const s = readJSON(KEY, null)
  if (!s) return DEFAULT
  return {
    profile: obj(s.profile),
    photo: s.photo && (s.photo.id || s.photo.src) ? s.photo : null,
    intro: { ...DEFAULT.intro, ...obj(s.intro), factList: { ...DEFAULT.intro.factList, ...obj(s.intro?.factList) } },
    work: {
      ...DEFAULT.work,
      ...obj(s.work),
      titles: obj(s.work?.titles),
      hidden: arr(s.work?.hidden),
      hiddenGenres: arr(s.work?.hiddenGenres),
      genreLabels: obj(s.work?.genreLabels),
      genreOrder: Array.isArray(s.work?.genreOrder) ? s.work.genreOrder : null,
    },
    contact: { ...DEFAULT.contact, ...obj(s.contact) },
  }
}

function save(key, state) {
  try {
    localStorage.setItem(key, JSON.stringify(state))
  } catch {
    // An uploaded portrait too big for storage lasts until reload; everything else is kept.
    try { localStorage.setItem(key, JSON.stringify({ ...state, photo: state.photo?.src ? null : state.photo })) } catch { /* ignore */ }
  }
}

const store = persisted(KEY, load, save)

/** Every portfolio photo, for the portrait picker. */
export const allWorkPhotos = baseGalleries.flatMap((g) => g.photos)

/**
 * The portfolio as the photographer has set it up: resolved profile, visible galleries and genres,
 * section settings, plus setters. Every portfolio component reads from here.
 */
export function usePortfolio() {
  const [state, setState] = store.use()

  const profile = useMemo(() => {
    const p = { ...baseProfile }
    Object.entries(state.profile).forEach(([k, v]) => {
      if (k === 'disciplines') { if (Array.isArray(v) && v.length) p.disciplines = v }
      else if (k === 'since') {
        // Stored as typed; only a plausible year is used.
        const n = parseInt(v, 10)
        if (n > 1900 && n <= new Date().getFullYear()) p.since = n
      } else if (typeof v === 'string' && v.trim()) p[k] = v
      else if (typeof v === 'number') p[k] = v
    })
    p.firstName = p.name.split(' ')[0]
    if (state.photo?.src) p.photo = state.photo.src
    else if (state.photo?.id) p.photo = allWorkPhotos.find((x) => x.id === state.photo.id)?.src ?? p.photo
    return p
  }, [state.profile, state.photo])

  const { galleries, genres, galleryBySlug, allGenres, allGalleries } = useMemo(() => {
    const W = state.work
    const label = (id) => W.genreLabels[id]?.trim() || baseGenres.find((g) => g.id === id)?.label || id
    const allGalleries = baseGalleries.map((g) => ({
      ...g,
      title: W.titles[g.slug]?.trim() || g.title,
      genreLabel: label(g.genre),
      hidden: W.hidden.includes(g.slug) || W.hiddenGenres.includes(g.genre),
    }))
    const galleries = allGalleries.filter((g) => !g.hidden)
    const order = W.genreOrder ?? baseGenres.map((g) => g.id)
    const rank = (id) => { const k = order.indexOf(id); return k === -1 ? Infinity : k }
    const allGenres = [...baseGenres]
      .sort((a, b) => rank(a.id) - rank(b.id))
      .map((g) => ({ ...g, label: label(g.id), hidden: W.hiddenGenres.includes(g.id), count: galleries.filter((x) => x.genre === g.id).length }))
    const genres = allGenres.filter((g) => !g.hidden && g.count > 0)
    return { galleries, genres, allGenres, allGalleries, galleryBySlug: Object.fromEntries(galleries.map((g) => [g.slug, g])) }
  }, [state.work])

  const part = (name) => (patch) => setState((s) => ({ ...s, [name]: { ...s[name], ...patch } }))
  /* eslint-disable react-hooks/exhaustive-deps -- setState is stable */
  const setProfile = useCallback(part('profile'), [])
  const setIntro = useCallback(part('intro'), [])
  const setWork = useCallback(part('work'), [])
  const setContact = useCallback(part('contact'), [])
  /* eslint-enable react-hooks/exhaustive-deps */
  const setPhoto = useCallback((photo) => setState((s) => ({ ...s, photo })), [setState])
  const toggleIn = useCallback((key, id) => setState((s) => {
    const list = s.work[key]
    return { ...s, work: { ...s.work, [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] } }
  }), [setState])
  const setGalleryTitle = useCallback((slug, title) => setState((s) => ({ ...s, work: { ...s.work, titles: { ...s.work.titles, [slug]: title } } })), [setState])
  const setGenreLabel = useCallback((id, text) => setState((s) => ({ ...s, work: { ...s.work, genreLabels: { ...s.work.genreLabels, [id]: text } } })), [setState])
  const reset = useCallback(() => setState(DEFAULT), [setState])

  return {
    state, profile, base: baseProfile, galleries, genres, galleryBySlug, allGenres, allGalleries,
    intro: state.intro,
    greeting: state.intro.greeting?.trim() || `Hello! I’m ${profile.firstName}.`,
    workTitle: state.work.title?.trim() || 'Selected work',
    contactHeading: state.contact.heading?.trim() || 'Have a day worth remembering? Let’s talk.',
    contact: state.contact,
    setProfile, setIntro, setWork, setContact, setPhoto, setGalleryTitle, setGenreLabel,
    toggleGallery: (slug) => toggleIn('hidden', slug),
    toggleGenre: (id) => toggleIn('hiddenGenres', id),
    reset,
  }
}
