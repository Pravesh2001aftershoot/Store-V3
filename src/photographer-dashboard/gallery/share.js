import { encode } from 'uqr'
import { readJSON } from '../../lib/persisted'
import { forGallery, useGalleryId } from '../../data/galleries'
import { roleLabel, rolePlural } from './access'

// Share step: the email the photographer sends and the QR card they print, built from the gallery's
// access settings (access.js). Only the wording and the include choices are saved, per gallery under
// galleryKey(id, 'share'); empty wording falls back to text made from the gallery.

export const LIMITS = { subject: 120, message: 1000, closing: 200 }

const DEFAULTS = {
  subject: '',
  message: '',
  closing: '',
  include: { link: true, password: true, pin: true, expiry: true }, // email
  qr: { password: true, pin: false }, // printed under the QR code
}

const load = (key) => {
  const s = readJSON(key, {})
  const bool = (v, d) => (typeof v === 'boolean' ? v : d)
  const text = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '')
  return {
    subject: text(s.subject, LIMITS.subject),
    message: text(s.message, LIMITS.message),
    closing: text(s.closing, LIMITS.closing),
    include: Object.fromEntries(Object.entries(DEFAULTS.include).map(([k, d]) => [k, bool(s.include?.[k], d)])),
    qr: Object.fromEntries(Object.entries(DEFAULTS.qr).map(([k, d]) => [k, bool(s.qr?.[k], d)])),
  }
}
const family = forGallery('share', load)

/** This gallery's share settings: `[settings, set]`. */
export const useShareSettings = () => family(useGalleryId()).use()

/** The text used while a field is empty. */
export const defaultText = (gallery) => ({
  subject: `Your photos are ready: ${gallery.title}`,
  message: `Hi ${gallery.client},\n\nYour gallery is ready! Have a look, pick your favorites and download the ones you love.`,
  closing: `Enjoy!\n${gallery.photographer}`,
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

/** The email for one audience: { subject, body }. `include` picks which details go in. */
export function composeEmail({ gallery, access, aud, base, share }) {
  const def = defaultText(gallery)
  const { include } = share
  const codes = codesFor(access, aud)
  const expiry = expiryFor(access, aud)
  const roles = aud !== 'anyone'
  const lines = []
  if (include.link) {
    lines.push(`View the gallery: ${linkFor(access, aud, base)}`)
    if (roles && access.singleLink) lines.push(`When it opens, choose “${roleLabel(aud)}”.`)
    if (roles && access.data[aud].approved.on) lines.push('Sign in with the email address this was sent to.')
  }
  if (include.password && codes.password) lines.push(`Password: ${codes.password}`)
  if (include.pin && codes.pin) lines.push(`Download PIN: ${codes.pin}`)
  if (include.expiry && expiry) lines.push(`The link works until ${formatDate(expiry)}.`)
  const body = [share.message.trim() || def.message, lines.join('\n'), share.closing.trim() || def.closing].filter(Boolean).join('\n\n')
  return { subject: share.subject.trim() || def.subject, body }
}

export const mailto = (to, { subject, body }) =>
  `mailto:${to.map(encodeURIComponent).join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

/** QR modules for a link: { size, data: boolean[][] } (no quiet zone; callers add their own margin). */
export const qrFor = (text) => encode(text, { ecc: 'M', border: 0 })

/** The QR card as a PNG data URL (1080 × 1350), for printing or slides. */
export function qrCardPNG({ title, url, lines }) {
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
  g.font = '600 52px "Geist Variable", system-ui, sans-serif'
  wrap(g, title, W / 2, 170, W - 160, 64)

  const { size, data } = qrFor(url)
  const box = 620
  const cell = Math.floor(box / size)
  const side = cell * size
  const x0 = Math.round((W - side) / 2) // whole pixels, or the modules show hairline seams
  const y0 = 300
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (data[y][x]) g.fillRect(x0 + x * cell, y0 + y * cell, cell, cell)

  let y = y0 + side + 110
  g.font = '400 38px "Geist Variable", system-ui, sans-serif'
  g.fillStyle = '#555555'
  g.fillText('Scan to open the gallery', W / 2, y)
  g.fillStyle = '#111111'
  g.font = '600 44px "Geist Variable", system-ui, sans-serif'
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

/** Who an audience is, in words: "Clients", or "Everyone" without roles. */
export const audienceName = (aud) => (aud === 'anyone' ? 'Everyone' : rolePlural(aud))
