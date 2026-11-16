import { readJSON } from '../../lib/persisted'
import { forGallery, useGalleryId } from '../../data/galleries'

// Gallery settings (the Settings step): who can open a gallery and what visitors can do in it.
// Saved per gallery under galleryKey(id, 'access'). The step edits a draft and writes it on Save.

export const ROLES = [
  { id: 'client', label: 'Client', plural: 'Clients' },
  { id: 'guest', label: 'Guest', plural: 'Guests' },
  { id: 'vendor', label: 'Vendor', plural: 'Vendors' },
]
export const roleLabel = (id) => ROLES.find((r) => r.id === id)?.label ?? id
export const rolePlural = (id) => ROLES.find((r) => r.id === id)?.plural ?? id

/** Role-based access needs at least this many roles before it can be saved. */
export const MIN_ROLES = 2
export const IMAGE_SIZES = [
  { id: 'web', label: 'Web size' },
  { id: 'high', label: 'High res' },
]
export const LIMIT_MAX = 99999

/** One audience's settings: the whole gallery ("anyone"), or one role. */
const audience = (on) => ({
  collectEmail: { on },
  approved: { on, people: [] }, // [{ id, name, email, phone }]
  pin: { on, value: '' }, // 4 digits
  faceSearch: { on, scope: 'all' }, // 'all' = whole gallery, 'own' = only photos they're in
  comments: { on },
  filterByFace: { on },
  favoriting: { on, limit: '' },
  hideImages: { on, bulk: false },
  screenshot: { on },
  downloads: { on, pin: { on: false, code: '' }, image: { on, sizes: { web: on, high: on }, limit: '' }, video: { on } },
  sharing: { on, image: on, video: on },
  sets: { on, hidden: [] }, // collection titles kept off the main gallery
})

export function defaults() {
  // Clients: everything on except email collection (they're on the approved list), password and face scan.
  const client = { ...audience(true), collectEmail: { on: false }, pin: { on: false, value: '' }, faceSearch: { on: false, scope: 'all' } }
  return {
    mode: 'anyone', // 'anyone' | 'roles'
    roles: ['client', 'guest'],
    singleLink: true, // one link for every role, or one link per role
    expiry: { all: '', client: '', guest: '', vendor: '' }, // yyyy-mm-dd, '' = never
    data: {
      anyone: audience(false),
      client,
      // Guests sign up with any email; Clients and Vendors must be on the approved list.
      guest: { ...structuredClone(client), collectEmail: { on: true }, approved: { on: false, people: [] } },
      vendor: structuredClone(client),
    },
  }
}

/** Saved values over the defaults, keeping only what has the right type (old or hand-edited storage). */
function merge(def, saved) {
  if (Array.isArray(def)) return Array.isArray(saved) ? saved : def
  if (def && typeof def === 'object') {
    const out = {}
    for (const k of Object.keys(def)) out[k] = merge(def[k], saved?.[k])
    return out
  }
  return typeof saved === typeof def ? saved : def
}

export function normalize(s) {
  const next = structuredClone(s)
  next.roles = ROLES.map((r) => r.id).filter((id) => next.roles.includes(id))
  if (!['anyone', 'roles'].includes(next.mode)) next.mode = 'anyone'
  // On a role, visitors either sign up with any email or must be on the approved list: always exactly one.
  for (const r of ROLES) {
    const d = next.data[r.id]
    if (d.collectEmail.on && d.approved.on) d.approved.on = false
    if (!d.collectEmail.on && !d.approved.on) d.collectEmail.on = true
    // Required with one link for all roles (see pinRequired): store it as on, not just shown as on.
    if (pinRequired(next, r.id)) d.pin.on = true
  }
  return next
}

const load = (key) => normalize(merge(defaults(), readJSON(key, {})))
const family = forGallery('access', load)

/** This gallery's saved settings: `[settings, set]`. */
export const useGalleryAccess = () => family(useGalleryId()).use()

// ---- Rules ----

/** One link for every role: a role that collects emails needs a password to prove visitors belong to it. */
export const pinRequired = (s, role) => s.mode === 'roles' && s.singleLink && !s.data[role].approved.on
/** Face scan → Whole gallery already lets visitors filter to photos they're in. */
export const filterIncluded = (d) => d.faceSearch.on && d.faceSearch.scope === 'all'

/** The audiences being edited: the whole gallery, or each configured role. */
export const audiences = (s) => (s.mode === 'roles' ? s.roles : ['anyone'])

/** Why the settings can't be saved yet, or null. */
export function saveBlocker(s) {
  if (s.mode === 'roles' && s.roles.length < MIN_ROLES) return `Add at least ${MIN_ROLES} roles to save`
  for (const a of audiences(s)) {
    const d = s.data[a]
    const pinOn = d.pin.on || (a !== 'anyone' && pinRequired(s, a))
    if (pinOn && !/^\d{4}$/.test(d.pin.value)) return `Enter a 4-digit password${a === 'anyone' ? '' : ` for ${rolePlural(a)}`}`
    if (d.downloads.on && d.downloads.image.on && !IMAGE_SIZES.some((z) => d.downloads.image.sizes[z.id])) {
      return `Pick at least one image size${a === 'anyone' ? '' : ` for ${rolePlural(a)}`}`
    }
  }
  return null
}

export const randomPin = () => String(Math.floor(1000 + Math.random() * 9000))
export const initials = (name) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0]).toUpperCase()
}
