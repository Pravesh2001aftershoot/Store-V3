import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react'
import { useSearchParams } from 'react-router-dom'
import { galleryKey, useGalleryId } from '../../data/galleries'
import { readJSON } from '../../lib/persisted'
import { isEmbedded } from '../../lib/embed'
import { emailSignIn, filterOn, pinRequired, useGalleryAccess } from '../../photographer-dashboard/gallery/access'
import { expiryFor } from '../../photographer-dashboard/gallery/share'
import { people } from '../data/faces'

// Who is looking at a client gallery, and what they're allowed to do in it.
//
// The rules come from the photographer's Settings step (photographer-dashboard/gallery/access.js),
// read for one audience: the whole gallery ("anyone"), or with role-based access the visitor's role.
// The visitor's sign-in (role, email, password, face scan) is kept for the browser tab in
// sessionStorage under `<galleryKey(id, 'visitor')>`, so a reload doesn't ask again but a new
// visit does. Sign out clears it.
//
// A gallery whose settings were never saved, and the dashboard's preview (`?embed=1`), are OPEN:
// no sign-in and every action on, so an unconfigured gallery isn't locked by the dashboard's defaults.

// ── Session (per tab) ───────────────────────────────────────────────────────

const sessionKey = (id) => galleryKey(id, 'visitor')
const sessions = new Map() // id → { value, subs }

function store(id) {
  if (!sessions.has(id)) {
    let value = null
    try { value = JSON.parse(sessionStorage.getItem(sessionKey(id))) } catch { /* private mode */ }
    sessions.set(id, { value: value && typeof value === 'object' ? value : null, subs: new Set() })
  }
  return sessions.get(id)
}

function writeSession(id, value) {
  const s = store(id)
  s.value = value
  try {
    if (value) sessionStorage.setItem(sessionKey(id), JSON.stringify(value))
    else sessionStorage.removeItem(sessionKey(id))
  } catch { /* private mode: holds until the tab reloads */ }
  s.subs.forEach((fn) => fn())
}

/** `[session, set]`. Session: `{ role?, email?, password?, face?, done }` — `done` once every step passed. */
export function useVisitorSession() {
  const id = useGalleryId()
  const s = store(id)
  const value = useSyncExternalStore(
    (fn) => { s.subs.add(fn); return () => s.subs.delete(fn) },
    () => s.value,
    () => s.value
  )
  const set = useCallback((patch) => writeSession(id, patch == null ? null : { ...(store(id).value ?? {}), ...patch }), [id])
  return [value, set]
}

// ── Audience and steps ──────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10)
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
export { emailOk }

/** Face scan sign-in works only when the gallery has key faces to match against (the sample gallery). */
export const faceScanAvailable = () => people.length > 0

/**
 * Everything the gallery needs about this visitor, from the saved settings and their session:
 * `{ open, mode, roles, roleFixed, aud, d, expired, steps, signedIn }`.
 * `steps` are the sign-in steps still to do, in order: 'role' → 'email' → 'password' → 'face'.
 */
export function resolveVisitor({ access, configured, embedded, roleParam, session }) {
  if (!configured || embedded) return { open: true, steps: [], signedIn: false }
  const roles = access.mode === 'roles'
  // One link per role: the role is in the link. One link for all (or a role link without a role): the visitor picks.
  const roleFixed = roles && !access.singleLink && access.roles.includes(roleParam) ? roleParam : null
  const role = roles ? roleFixed ?? (access.roles.includes(session?.role) ? session.role : null) : null
  const aud = roles ? role : 'anyone'
  const d = aud ? access.data[aud] : null

  // The shared link's expiry applies before a role is picked; a role's own link uses its own date.
  const expiry = !roles || access.singleLink ? access.expiry.all : role ? expiryFor(access, role) : ''
  const expired = !!expiry && expiry < today()

  // Every step this audience has (`all`), and the ones the session hasn't passed yet (`steps`).
  const all = []
  const steps = []
  const step = (name, passed) => { all.push(name); if (!passed) steps.push(name) }
  if (roles && !roleFixed) step('role', !!role)
  if (d) {
    const approved = d.signIn === 'approved'
    if (emailSignIn(d)) {
      const email = session?.email?.toLowerCase()
      step('email', !!email && emailOk(email) && (!approved || isApproved(d, email)))
    }
    if (d.pin.on || pinRequired(access, aud)) step('password', session?.password === d.pin.value)
    if (d.faceSearch.on && faceScanAvailable()) step('face', !!session?.face)
  }
  return {
    open: false,
    mode: access.mode,
    roles: access.roles,
    roleFixed,
    aud,
    d,
    expired,
    expiry,
    steps,
    // There was something to sign in to, and it's done: the gallery offers Sign out.
    signedIn: all.length > 0 && steps.length === 0,
  }
}

/** True when `email` is on the audience's approved list. */
export const isApproved = (d, email) => d.approved.people.some((p) => p.email.trim().toLowerCase() === email.trim().toLowerCase())
/** The approved person with this email, for greeting them by name. */
export const approvedPerson = (d, email) => d?.approved.people.find((p) => p.email.trim().toLowerCase() === email?.trim().toLowerCase()) ?? null

/** Every action allowed, nothing limited. */
const OPEN_PERMS = {
  favorites: { on: true, limit: null },
  hide: { on: true, bulk: true },
  faces: true,
  faceOnly: null,
  share: true,
  screenshot: false,
  hiddenCollections: [],
}

/** What this visitor can do, from their audience's settings. */
export function permissionsFor(v, session) {
  if (v.open || !v.d) return OPEN_PERMS
  const d = v.d
  return {
    favorites: { on: d.favoriting.on, limit: null }, // no favorites limit
    // Hide photos is a Client-only setting in the dashboard; other roles and "anyone" can't hide.
    hide: { on: v.aud === 'client' && d.hideImages.on, bulk: v.aud === 'client' && d.hideImages.on && d.hideImages.bulk },
    // Face scan decides it while on: Whole gallery → on, Only photos they're in → off.
    faces: filterOn(d),
    // Face scan → "Only photos they're in": the gallery shows just the scanned person's photos.
    faceOnly: d.faceSearch.on && d.faceSearch.scope === 'own' && session?.face ? session.face : null,
    share: d.sharing.on && d.sharing.image,
    screenshot: d.screenshot.on,
    hiddenCollections: d.sets.on ? d.sets.hidden : [],
  }
}

/** Resolves this visitor for the current gallery. Used by the sign-in gate and the gallery. */
export function useVisitorState() {
  const id = useGalleryId()
  const [access] = useGalleryAccess()
  const [params] = useSearchParams()
  const [session, setSession] = useVisitorSession()
  const configured = readJSON(galleryKey(id, 'access'), null) != null
  const embedded = isEmbedded()
  const roleParam = params.get('role')
  const visitor = useMemo(
    () => resolveVisitor({ access, configured, embedded, roleParam, session }),
    [access, configured, embedded, roleParam, session]
  )
  const perms = useMemo(() => permissionsFor(visitor, session), [visitor, session])
  return { access, visitor, perms, session, setSession, signOut: () => setSession(null) }
}

// The gallery reads the resolved visitor from here (tiles, the lightbox, downloads).
export const VisitorContext = createContext(null)
export const useVisitor = () => useContext(VisitorContext)
/** This visitor's permissions; every action allowed outside a gallery. */
export const usePermissions = () => useContext(VisitorContext)?.perms ?? OPEN_PERMS
