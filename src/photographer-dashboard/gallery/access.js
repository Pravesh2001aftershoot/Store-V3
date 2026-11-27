import { readJSON } from '../../lib/persisted'
import { forGallery, useGalleryId } from '../../data/galleries'

// Gallery settings (the Settings step): who can open a gallery and what visitors can do in it.
// Saved per gallery under galleryKey(id, 'access'). The step edits a draft and writes it on Save.

export const ROLES = [
  { id: 'client', label: 'Client', plural: 'Clients' },
  { id: 'guest', label: 'Guest', plural: 'Guests' },
  { id: 'vendor', label: 'Vendor', plural: 'Vendors' },
]
export const roleLabel = (id) => (id === 'anyone' ? 'Client' : ROLES.find((r) => r.id === id)?.label ?? id)
export const rolePlural = (id) => (id === 'anyone' ? 'Clients' : ROLES.find((r) => r.id === id)?.plural ?? id)

/** Role-based access needs at least this many roles before it can be saved. */
export const MIN_ROLES = 2
export const IMAGE_SIZES = [
  { id: 'web', label: 'Web size' },
  { id: 'high', label: 'High res' },
]
export const LIMIT_MAX = 99999
/** Long edge of Web size downloads, in px. */
export const WEB_EDGES = [1200, 2048]

/** Gallery links: `gallery.aftershoot.com/` + gallery name + ending. Only the gallery name is editable. */
export const LINK_HOST = 'gallery.aftershoot.com/'
export const linkEnding = (s, aud) => (s.mode === 'roles' && !s.singleLink && aud !== 'all' ? `/${aud}` : '/view')
/** Lowercase letters, numbers and hyphens: spaces become hyphens, anything else is dropped. */
export const slugify = (v) => v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 60)
/** The gallery name in the link: the photographer's own, or one made from the gallery title. */
export const slugOf = (s, title) => (s.slug.custom ? s.slug.value : slugify(title ?? '').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'gallery')

/** Sign-in methods. Anyone with the link: none / collect / approved. A role: password / collect / approved. */
export const SIGN_IN = { anyone: ['none', 'collect', 'approved'], role: ['password', 'collect', 'approved'] }
/** Visitors give an email: needed for a per-visitor download limit. */
export const emailSignIn = (d) => d.signIn === 'collect' || d.signIn === 'approved'
export const PASSWORD_RE = /^[A-Za-z0-9]{4,20}$/

/** One audience's settings: the whole gallery ("anyone"), or one role. */
const audience = ({ signIn, face, comments, hide, screenshot }) => ({
  signIn, // see SIGN_IN
  collectEmail: { on: signIn === 'collect' }, // kept in step with signIn (normalize) for older readers
  approved: { on: signIn === 'approved', people: [] }, // [{ id, name, email, phone }]
  pin: { on: false, value: '' }, // letters and numbers, 4–20
  faceSearch: { on: face, scope: 'all' }, // 'all' = whole gallery, 'own' = only photos they're in
  comments: { on: comments },
  filterByFace: { on: true }, // face scan decides it while on (filterForced)
  favoriting: { on: true },
  hideImages: { on: hide, bulk: false },
  screenshot: { on: screenshot },
  downloads: { on: true, pin: { on: false, code: '' }, personalUse: false, image: { on: true, sizes: { web: true, high: true }, highFree: false, limit: '', web: { edge: 2048, watermark: false } }, video: { on: true } },
  sharing: { on: true, image: true, video: true },
  sets: { on: true, hidden: [] }, // collection titles kept off the main gallery
})

/** New galleries (PRD section 5). Vendor starts with the Guest defaults. */
export function defaults() {
  const guest = audience({ signIn: 'collect', face: true, comments: false, hide: false, screenshot: true })
  return {
    mode: 'anyone', // 'anyone' | 'roles'
    roles: ['client', 'guest'],
    singleLink: true, // one link for every role, or one link per role
    slug: { custom: false, value: '' }, // the gallery name in the link; not custom = from the title
    expiry: { all: '', client: '', guest: '', vendor: '' }, // yyyy-mm-dd, '' = never
    data: {
      anyone: audience({ signIn: 'none', face: false, comments: false, hide: false, screenshot: false }),
      client: audience({ signIn: 'approved', face: true, comments: true, hide: true, screenshot: false }),
      guest,
      vendor: structuredClone(guest),
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

/** Settings saved before the sign-in method existed: read it from the old email switches. */
function upgrade(raw) {
  for (const [aud, d] of Object.entries(raw?.data ?? {})) {
    if (!d || typeof d.signIn === 'string') continue
    if (aud === 'anyone') d.signIn = d.collectEmail?.on ? 'collect' : 'none'
    else d.signIn = d.approved?.on ? 'approved' : 'collect'
  }
  return raw
}

export function normalize(s) {
  const next = structuredClone(s)
  next.roles = ROLES.map((r) => r.id).filter((id) => next.roles.includes(id))
  if (!['anyone', 'roles'].includes(next.mode)) next.mode = 'anyone'
  for (const aud of ['anyone', ...ROLES.map((r) => r.id)]) {
    const d = next.data[aud]
    const allowed = SIGN_IN[aud === 'anyone' ? 'anyone' : 'role']
    if (!allowed.includes(d.signIn)) d.signIn = allowed[1]
    d.collectEmail.on = d.signIn === 'collect'
    d.approved.on = d.signIn === 'approved'
    // The download limit is counted per visitor email: no email sign-in, no limit.
    if (!emailSignIn(d)) d.downloads.image.limit = ''
  }
  // Required passwords are stored as on, not just shown as on.
  for (const r of ROLES) if (pinRequired(next, r.id)) next.data[r.id].pin.on = true
  return next
}

const load = (key) => normalize(merge(defaults(), upgrade(readJSON(key, {}))))
const family = forGallery('access', load)

/** This gallery's saved settings: `[settings, set]`. */
export const useGalleryAccess = () => family(useGalleryId()).use()

// ---- Rules ----

/** Roles on the one shared link that let visitors in without an approved list. */
const openRoles = (s) => s.roles.filter((r) => s.data[r].signIn !== 'approved')

/**
 * Why a role must have a password, or null: Password only always has one; on one link for every role,
 * passwords tell apart the roles without an approved list once there are two or more of them.
 */
export function pinReason(s, role) {
  if (s.mode !== 'roles' || role === 'anyone') return null
  const d = s.data[role]
  if (d.signIn === 'password') return 'password'
  if (s.singleLink && d.signIn !== 'approved' && openRoles(s).length > 1) return 'shared'
  return null
}
export const pinRequired = (s, role) => !!pinReason(s, role)

/** Face scan decides Filter by face: on with Whole gallery, off with Only photos they're in, else null (free). */
export const filterForced = (d) => (d.faceSearch.on ? d.faceSearch.scope === 'all' : null)
/** Face scan → Whole gallery already lets visitors filter to photos they're in. */
export const filterIncluded = (d) => filterForced(d) === true
/** Whether visitors can filter by face. */
export const filterOn = (d) => filterForced(d) ?? d.filterByFace.on

/** The audiences being edited: the whole gallery, or each configured role. */
export const audiences = (s) => (s.mode === 'roles' ? s.roles : ['anyone'])

/** Why the settings can't be saved yet, or null: `{ message, aud, field }`. */
export function saveBlocker(s) {
  const of = (a) => (a === 'anyone' ? '' : ` for ${ROLES.find((r) => r.id === a).plural}`)
  if (s.mode === 'roles' && s.roles.length < MIN_ROLES) return { message: `Add at least ${MIN_ROLES} roles to save`, aud: null, field: 'roles' }
  if (s.slug.custom && !s.slug.value.replace(/-/g, '')) return { message: 'Enter a gallery name for the link', aud: null, field: 'slug' }
  for (const a of audiences(s)) {
    const d = s.data[a]
    if (d.pin.on && !PASSWORD_RE.test(d.pin.value)) return { message: `Enter a password of 4–20 letters or numbers${of(a)}`, aud: a, field: 'pin' }
    if (d.downloads.on && d.downloads.image.on && !IMAGE_SIZES.some((z) => d.downloads.image.sizes[z.id])) {
      return { message: `Pick at least one image size${of(a)}`, aud: a, field: 'sizes' }
    }
  }
  // One link for every role: the password decides the role, so two roles can't share one.
  if (s.mode === 'roles' && s.singleLink) {
    const seen = {}
    for (const r of s.roles) {
      const d = s.data[r]
      if (!d.pin.on || d.signIn === 'approved') continue
      const v = d.pin.value.toLowerCase()
      if (seen[v]) return { message: `${rolePlural(seen[v])} and ${rolePlural(r)} need different passwords`, aud: r, field: 'pin' }
      seen[v] = r
    }
  }
  return null
}

// ---- Save summary ----

const SIGN_IN_LABEL = { none: 'No sign-in needed', collect: 'Collect email on sign-up', password: 'Password only', approved: 'Approved only' }
const GATES = { none: [], collect: ['email'], approved: ['email', 'list'], password: ['password'] }
const GATE_EFFECT = { email: 'must now enter their email', list: 'must now be on your approved list', password: 'must now enter a password' }
const FEATURES = [
  ['favoriting', 'Favorites', 'favorite photos'],
  ['comments', 'Comments', 'comment'],
  ['hideImages', 'Hide photos', 'hide photos'],
  ['downloads', 'Downloads', 'download'],
  ['sharing', 'Sharing', 'share'],
  ['screenshot', 'Screenshot protection', null],
]

/**
 * What Save will change, for the Save summary: `[{ label, effect, breaking }]`. Breaking changes cut off
 * people who already have the link (link changes, new gates, features turned off, sets hidden).
 * Switching between Anyone with the link and one link for all roles keeps the link, so it isn't breaking.
 */
export function changeSummary(before, after, title) {
  const out = []
  const add = (label, effect = null, breaking = false) => out.push({ label, effect, breaking })
  const roles = after.mode === 'roles'

  if (before.mode !== after.mode) {
    const separate = (s) => s.mode === 'roles' && !s.singleLink
    const label = roles ? `Access: by role${after.singleLink ? ' · one link for all roles' : ' · a link per role'}` : 'Access: anyone with the link'
    if (separate(before) || separate(after)) add(label, 'The current link stops working. Send everyone the new one.', true)
    else add(label)
  } else if (roles && before.singleLink !== after.singleLink) {
    add(after.singleLink ? 'One link for all roles' : 'A link per role', after.singleLink ? 'Role links stop working. Everyone uses the shared link.' : 'The shared link stops working. Send each role its own link.', true)
  }
  if (slugOf(before, title) !== slugOf(after, title)) add(`Gallery link: …/${slugOf(after, title)}`, 'The old link stops working.', true)
  if (roles && before.mode === 'roles') {
    for (const r of before.roles) if (!after.roles.includes(r)) add(`${rolePlural(r)} removed`, `${rolePlural(r)} can’t open the gallery any more.`, true)
    for (const r of after.roles) if (!before.roles.includes(r)) add(`${rolePlural(r)} added`)
  }
  for (const k of Object.keys(after.expiry)) {
    if (before.expiry[k] !== after.expiry[k] && (k === 'all' ? !roles || after.singleLink : roles && !after.singleLink && after.roles.includes(k))) {
      add(`${k === 'all' ? 'Expiry' : `${roleLabel(k)} link expiry`}: ${after.expiry[k] || 'never'}`)
    }
  }

  for (const aud of audiences(after)) {
    // Compare with what visitors of this audience had before: the same audience, or "anyone" when roles were just turned on.
    const prevAud = before.mode === after.mode ? aud : roles ? 'anyone' : null
    if (!prevAud || (before.mode === 'roles' && !before.roles.includes(aud))) continue
    const a = before.data[prevAud]
    const b = after.data[aud]
    const who = aud === 'anyone' ? 'Visitors' : rolePlural(aud)
    const pre = aud === 'anyone' ? '' : `${rolePlural(aud)} · `

    if (a.signIn !== b.signIn) {
      // The approved list implies an email, so it's the one effect worth saying.
      const fresh = GATES[b.signIn].filter((g) => !GATES[a.signIn].includes(g))
      const gates = fresh.includes('list') ? ['list'] : fresh
      add(`${pre}Sign-in: ${SIGN_IN_LABEL[b.signIn]}`, gates.length ? `${who} ${gates.map((g) => GATE_EFFECT[g]).join(' and ')}.` : null, gates.length > 0)
    }
    if (!a.pin.on && b.pin.on && b.signIn !== 'password') add(`${pre}Password protection on`, `${who} must now enter a password.`, true)
    else if (a.pin.on && b.pin.on && a.pin.value !== b.pin.value) add(`${pre}Password changed`, 'The old password stops working.', true)
    else if (a.pin.on && !b.pin.on) add(`${pre}Password protection off`)
    if (!a.faceSearch.on && b.faceSearch.on) add(`${pre}Face scan sign-in on`, `${who} must now scan their face.`, true)
    else if (a.faceSearch.on && !b.faceSearch.on) add(`${pre}Face scan sign-in off`)
    else if (b.faceSearch.on && a.faceSearch.scope !== b.faceSearch.scope) {
      add(`${pre}Face scan: ${b.faceSearch.scope === 'own' ? 'Only photos they’re in' : 'Whole gallery'}`, b.faceSearch.scope === 'own' ? `${who} only see photos they’re in.` : null, b.faceSearch.scope === 'own')
    }
    if (filterOn(a) !== filterOn(b)) add(`${pre}Filter by face ${filterOn(b) ? 'on' : 'off'}`, filterOn(b) ? null : `${who} can no longer filter by face.`, !filterOn(b))
    for (const [k, name, verb] of FEATURES) {
      if (a[k].on === b[k].on) continue
      const off = !b[k].on
      add(`${pre}${name} ${b[k].on ? 'on' : 'off'}`, off && verb ? `${who} can no longer ${verb}.` : null, off && !!verb)
    }
    if (a.downloads.on && b.downloads.on) {
      for (const [k, name] of [['image', 'Photo downloads'], ['video', 'Video downloads']]) {
        if (a.downloads[k].on && !b.downloads[k].on) add(`${pre}${name} off`, `${who} can no longer download ${k === 'image' ? 'photos' : 'videos'}.`, true)
        else if (!a.downloads[k].on && b.downloads[k].on) add(`${pre}${name} on`)
      }
      for (const z of IMAGE_SIZES) {
        if (a.downloads.image.sizes[z.id] && !b.downloads.image.sizes[z.id] && b.downloads.image.on) add(`${pre}${z.label} downloads off`, `${who} can no longer download ${z.label.toLowerCase()}.`, true)
      }
      if (!a.downloads.pin.on && b.downloads.pin.on) add(`${pre}Download PIN on`, `${who} need the PIN to download.`, true)
      if (a.downloads.image.limit !== b.downloads.image.limit) add(`${pre}Download limit: ${b.downloads.image.limit || 'none'}`)
    }
    if (a.sharing.on && b.sharing.on) {
      for (const [k, name] of [['image', 'Photo sharing'], ['video', 'Video sharing']]) {
        if (a.sharing[k] && !b.sharing[k]) add(`${pre}${name} off`, `${who} can no longer share ${k === 'image' ? 'photos' : 'videos'}.`, true)
      }
    }
    const hiddenBefore = a.sets.on ? a.sets.hidden : []
    const hiddenNow = b.sets.on ? b.sets.hidden : []
    const newlyHidden = hiddenNow.filter((t) => !hiddenBefore.includes(t))
    if (newlyHidden.length) add(`${pre}${newlyHidden.join(', ')} hidden`, `${who} can no longer see ${newlyHidden.length === 1 ? 'this set' : 'these sets'}.`, true)
    if (b.signIn === 'approved') {
      const removed = a.approved.people.filter((p) => !b.approved.people.some((q) => q.email === p.email))
      if (removed.length) add(`${pre}${removed.length} removed from the approved list`, `${removed.map((p) => p.name).join(', ')} can no longer open the gallery.`, true)
      const added = b.approved.people.length - (a.approved.people.length - removed.length)
      if (added > 0) add(`${pre}${added} added to the approved list`)
    }
  }
  return out
}

export const randomPin = () => String(Math.floor(1000 + Math.random() * 9000))
export const initials = (name) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0]).toUpperCase()
}
