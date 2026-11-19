import { encode } from 'uqr'
import { persisted, readJSON } from '../../lib/persisted'
import { forGallery, useGalleryId } from '../../data/galleries'
import { audiences, roleLabel, rolePlural } from './access'

// Share step: the email the photographer sends and the QR card they print, built from the gallery's
// access settings (access.js). Only the wording and the include choices are saved, per gallery under
// galleryKey(id, 'share'); empty wording falls back to text made from the gallery.

export const LIMITS = { subject: 120, message: 1000 }

const DEFAULTS = {
  template: 'ready', // the email template the wording started from (see BUILT_IN_TEMPLATES)
  subject: '',
  message: '',
  include: { link: true, password: true, pin: true, expiry: true }, // email
  qr: { pin: false }, // printed under the QR code (passwords always are)
}

const load = (key) => {
  const s = readJSON(key, {})
  const bool = (v, d) => (typeof v === 'boolean' ? v : d)
  const text = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '')
  return {
    template: typeof s.template === 'string' && s.template ? s.template : DEFAULTS.template,
    subject: text(s.subject, LIMITS.subject),
    message: text(s.message, LIMITS.message),
    include: Object.fromEntries(Object.entries(DEFAULTS.include).map(([k, d]) => [k, bool(s.include?.[k], d)])),
    qr: Object.fromEntries(Object.entries(DEFAULTS.qr).map(([k, d]) => [k, bool(s.qr?.[k], d)])),
  }
}
const family = forGallery('share', load)

/** This gallery's share settings: `[settings, set]`. */
export const useShareSettings = () => family(useGalleryId()).use()

// Emails sent from the Share step, newest first, under galleryKey(id, 'share-history'). Each entry is
// { id, at (ms), to: [email], subject }. Only the latest HISTORY_LIMIT are kept.
export const HISTORY_LIMIT = 50
const loadHistory = (key) => {
  const list = readJSON(key, [])
  if (!Array.isArray(list)) return []
  return list
    .filter((e) => e && typeof e.at === 'number' && Array.isArray(e.to) && e.to.length)
    .map((e) => ({ id: String(e.id ?? e.at), at: e.at, to: e.to.filter((x) => typeof x === 'string'), subject: typeof e.subject === 'string' ? e.subject : '' }))
    .slice(0, HISTORY_LIMIT)
}
const historyFamily = forGallery('share-history', loadHistory)

/** This gallery's sent emails: `{ history, record({ to, subject }) }`. */
export function useShareHistory() {
  const [history, setHistory] = historyFamily(useGalleryId()).use()
  const record = ({ to, subject }) => {
    const at = Date.now()
    setHistory((h) => [{ id: `${at}`, at, to, subject }, ...h].slice(0, HISTORY_LIMIT))
  }
  return { history, record }
}

/** "Today, 3:42 pm", "Yesterday, 9:05 am", or "12 Nov 2026, 3:42 pm". */
export function formatSent(at) {
  const d = new Date(at)
  const p = (n) => String(n).padStart(2, '0')
  return {
    date: `${p(d.getDate())} / ${p(d.getMonth() + 1)} / ${d.getFullYear()}`,
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
  }
}

/**
 * Variables the photographer can put in the subject and message, written `{gallery_name}`.
 * `${Gallery_name}`, any case and spaces for underscores (`{Gallery name}`) are read the same way.
 * Each is filled from the gallery when the email is built.
 */
export const VARIABLES = [
  { key: 'gallery_name', label: 'Gallery name' },
  { key: 'client_name', label: 'Client name' },
  { key: 'client_email', label: 'Client email' },
  { key: 'expiry_date', label: 'Expiry date' },
]
export const VARIABLE_RE = /\$?\{\s*([a-z_ ]+?)\s*\}/gi
const keyOf = (name) => name.trim().toLowerCase().replace(/\s+/g, '_')
export const isVariable = (name) => VARIABLES.some((v) => v.key === keyOf(name))

/** What each variable becomes for this email ('' when there's nothing to fill it with). */
export const variableValues = ({ gallery, expiry, to = [] }) => ({
  gallery_name: gallery.title,
  client_name: gallery.client,
  client_email: to[0] ?? '',
  expiry_date: formatDate(expiry),
})

/** Text with its variables filled in. Unknown ones are left as typed. */
export const fillVariables = (text, values) =>
  text.replace(VARIABLE_RE, (m, name) => (keyOf(name) in values ? values[keyOf(name)] : m))

// Email templates: a starting wording (subject + message) the photographer picks above the fields.
// The built-in ones ship with the product; the photographer's own are account-wide (every gallery sees
// them) under TEMPLATES_KEY: [{ id, name, subject, message }], at most TEMPLATE_LIMIT. Empty subject or
// message means the default wording (defaultText), so "Gallery ready" is simply both empty.
export const TEMPLATE_LIMIT = 20
export const TEMPLATE_NAME_LIMIT = 40
export const DEFAULT_TEMPLATE = 'ready'
export const BUILT_IN_TEMPLATES = [
  { id: 'ready', name: 'Gallery ready', subject: '', message: '' },
  {
    id: 'favourites',
    name: 'Pick your favourites',
    subject: 'Pick your favourites from {gallery_name}',
    message: 'Hi {client_name},\n\nWhen you have a moment, go through the gallery and heart the photos you love most. We’ll use your favourites for your album and prints.\n\nThank you!',
  },
  {
    id: 'expiring',
    name: 'Gallery expiring soon',
    subject: 'Reminder: {gallery_name} closes on {expiry_date}',
    message: 'Hi {client_name},\n\nA quick reminder that your gallery is open until {expiry_date}. Download your photos and order any prints before then.\n\nThank you!',
  },
  {
    id: 'thanks',
    name: 'Thank you',
    subject: 'Thank you, {client_name}',
    message: 'Hi {client_name},\n\nThank you for choosing me for {gallery_name}. It was a joy to photograph. Your full gallery is below, ready to view, share and download.\n\nWith love,',
  },
]
export const TEMPLATES_KEY = 'store-v3:email-templates'

const loadTemplates = (key) => {
  const list = readJSON(key, [])
  if (!Array.isArray(list)) return []
  const text = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '')
  return list
    .filter((t) => t && typeof t.id === 'string' && typeof t.name === 'string' && t.name.trim())
    .map((t) => ({ id: t.id, name: t.name.slice(0, TEMPLATE_NAME_LIMIT), subject: text(t.subject, LIMITS.subject), message: text(t.message, LIMITS.message) }))
    .slice(0, TEMPLATE_LIMIT)
}
const templateStore = persisted(TEMPLATES_KEY, loadTemplates)

/**
 * Built-in and saved email templates: `{ builtIn, own, find(id), create({ name, subject, message }) → id,
 * update(id, patch), remove(id) }`. `find` falls back to the default template for an unknown id
 * (a saved template deleted while a gallery still pointed at it).
 */
export function useEmailTemplates() {
  const [own, setOwn] = templateStore.use()
  const find = (id) => BUILT_IN_TEMPLATES.find((t) => t.id === id) ?? own.find((t) => t.id === id) ?? BUILT_IN_TEMPLATES[0]
  const create = ({ name, subject, message }) => {
    const id = `own-${Date.now().toString(36)}`
    setOwn((l) => [...l, { id, name: name.trim().slice(0, TEMPLATE_NAME_LIMIT), subject, message }].slice(0, TEMPLATE_LIMIT))
    return id
  }
  const update = (id, patch) => setOwn((l) => l.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  const remove = (id) => setOwn((l) => l.filter((t) => t.id !== id))
  return { builtIn: BUILT_IN_TEMPLATES, own, find, create, update, remove, full: own.length >= TEMPLATE_LIMIT }
}

/** The text used while a field is empty. */
export const defaultText = (gallery) => ({
  subject: `Your photos are ready: ${gallery.title}`,
  message: `Hi ${gallery.client},\n\nYour gallery is ready! Have a look, pick your favorites and download the ones you love.\n\nEnjoy!\n${gallery.photographer}`,
})

/** The link an audience opens: the shared one, or its role's own. */
export const linkFor = (access, aud, base) => (aud === 'anyone' || access.singleLink ? base : `${base}?role=${aud}`)
export const expiryFor = (access, aud) => access.expiry[aud === 'anyone' || access.singleLink ? 'all' : aud]

export const formatDate = (iso) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

/** What an audience needs to get in and download: { password, pin } (each '' when not needed). */
export function codesFor(access, aud) {
  const d = access.data[aud]
  return {
    password: d.pin.on ? d.pin.value : '',
    pin: d.downloads.on && d.downloads.pin.on ? d.downloads.pin.code : '',
  }
}

/** Everyone's codes, one entry per audience that has a password or download PIN: [{ aud, password, pin }]. */
export const allCodes = (access) => audiences(access).map((aud) => ({ aud, ...codesFor(access, aud) })).filter((c) => c.password || c.pin)

/**
 * The expiry that fills {expiry_date}: the shared link's, or with a link per role the soonest role
 * date ('' when nothing expires).
 */
export const galleryExpiry = (access) => {
  if (access.mode !== 'roles' || access.singleLink) return access.expiry.all
  return access.roles.map((r) => access.expiry[r]).filter(Boolean).sort()[0] ?? ''
}

/** "Client, Guest or Vendor". */
const orList = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} or ${xs.at(-1)}`)

/**
 * The one email for the whole gallery: { subject, body }. It always links to the gallery itself; with
 * roles the visitor picks theirs when it opens, and each role gets a line with what it needs (sign in
 * with the email this was sent to, password, download PIN, its own expiry). `include` picks which
 * details go in; `to` fills {client_email}.
 */
export function composeEmail({ gallery, access, base, share, to = [] }) {
  const def = defaultText(gallery)
  const { include } = share
  const roles = access.mode === 'roles'
  const shared = !roles || access.singleLink
  const lines = []
  if (include.link) {
    lines.push(`View the gallery: ${base}`)
    if (roles) lines.push(`When it opens, choose ${orList(access.roles.map(roleLabel))}.`)
  }
  if (!roles) {
    const { password, pin } = codesFor(access, 'anyone')
    if (include.password && password) lines.push(`Password: ${password}`)
    if (include.pin && pin) lines.push(`Download PIN: ${pin}`)
  } else {
    for (const r of access.roles) {
      const { password, pin } = codesFor(access, r)
      const own = !shared && access.expiry[r]
      const parts = [
        include.link && access.data[r].approved.on && 'sign in with the email address this was sent to',
        include.password && password && `password ${password}`,
        include.pin && pin && `download PIN ${pin}`,
        include.expiry && own && `link works until ${formatDate(own)}`,
      ].filter(Boolean)
      if (parts.length) lines.push(`${rolePlural(r)}: ${parts.join(' · ')}`)
    }
  }
  if (include.expiry && shared && access.expiry.all) lines.push(`The link works until ${formatDate(access.expiry.all)}.`)
  const fill = (t) => fillVariables(t, variableValues({ gallery, expiry: galleryExpiry(access), to }))
  // The message carries the greeting and sign-off; the access details follow it.
  const body = [fill(share.message.trim()) || def.message, lines.join('\n')].filter(Boolean).join('\n\n')
  return { subject: fill(share.subject.trim()) || def.subject, body }
}

/**
 * The QR cards to print: [{ key, role, url, lines }]. One card for the gallery link, or with roles and
 * a link per role, one card per role for its own link. Lines are what's printed under the code: without
 * roles "Password 1234", "Download PIN 5678"; on a role's own card the same for that role; on the one
 * card for every role, a line per role ("Guests · Password 1234 · PIN 5678") then which roles to pick.
 */
export function qrCards(access, base, qr) {
  const own = (aud) => {
    const { password, pin } = codesFor(access, aud)
    return [password && `Password ${password}`, qr.pin && pin && `Download PIN ${pin}`].filter(Boolean)
  }
  if (access.mode !== 'roles') return [{ key: 'anyone', role: null, url: base, lines: own('anyone') }]
  if (!access.singleLink) return access.roles.map((r) => ({ key: r, role: r, url: linkFor(access, r, base), lines: own(r) }))
  const lines = access.roles.map((r) => {
    const { password, pin } = codesFor(access, r)
    const parts = [password && `Password ${password}`, qr.pin && pin && `PIN ${pin}`].filter(Boolean)
    return parts.length ? `${rolePlural(r)} · ${parts.join(' · ')}` : null
  }).filter(Boolean)
  return [{ key: 'all', role: null, url: base, lines: [...lines, `Choose ${orList(access.roles.map(roleLabel))} when it opens`] }]
}

/** QR modules for a link: { size, data: boolean[][] } (no quiet zone; callers add their own margin). */
export const qrFor = (text) => encode(text, { ecc: 'M', border: 0 })

/** The QR card as a PNG data URL (1080 × 1350), for printing or slides. `tag` (a role) prints small above the title. */
export function qrCardPNG({ title, tag, url, lines }) {
  const W = 1080
  const H = 1350
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, W, H)
  g.fillStyle = '#111111'
  g.textAlign = 'center'
  if (tag) {
    g.fillStyle = '#555555'
    g.font = '600 32px "Geist", system-ui, sans-serif'
    g.fillText(tag.toUpperCase(), W / 2, 100)
    g.fillStyle = '#111111'
  }
  g.font = '600 52px "Geist", system-ui, sans-serif'
  wrap(g, title, W / 2, 170, W - 160, 64)

  const { size, data } = qrFor(url)
  const box = 620
  const cell = Math.floor(box / size)
  const side = cell * size
  const x0 = Math.round((W - side) / 2) // whole pixels, or the modules show hairline seams
  const y0 = 300
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (data[y][x]) g.fillRect(x0 + x * cell, y0 + y * cell, cell, cell)

  let y = y0 + side + 110
  g.font = '400 38px "Geist", system-ui, sans-serif'
  g.fillStyle = '#555555'
  g.fillText('Scan to open the gallery', W / 2, y)
  g.fillStyle = '#111111'
  g.font = '600 44px "Geist", system-ui, sans-serif'
  for (const l of lines) { y += 74; g.fillText(l, W / 2, y) }
  return c.toDataURL('image/png')
}

function wrap(g, text, x, y, max, lh) {
  const words = text.split(/\s+/)
  let line = ''
  const out = []
  for (const w of words) {
    const t = line ? `${line} ${w}` : w
    if (g.measureText(t).width > max && line) { out.push(line); line = w } else line = t
  }
  out.push(line)
  out.slice(0, 2).forEach((l, i) => g.fillText(l, x, y + i * lh))
}
