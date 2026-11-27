import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowsClockwise, CaretDown, ChatCircleDots, Check, CopySimple, DownloadSimple, EnvelopeSimple, EyeSlash, FolderSimple,
  Heart, ImageBroken, Info, LockSimple, MagnifyingGlass, Plus, ScanSmiley, ShareFat, Storefront, UserFocus, Warning, X,
} from '@phosphor-icons/react'
import { Button, Field } from '../../components/ui'
import { Segmented, Switch } from '../../gallery/templates/cover/controls'
import { notify } from '../../gallery/lib/actions'
import { cn, money } from '../../lib/utils'
import { getGallery, useGalleryId } from '../../data/galleries'
import { catalogProduct, useCatalogs } from '../../data/storeConfig'
import { Checkbox, Chip, IconButton, PageHeader, PriceInput, Select, Tag, ease } from '../components/ui'
import Modal from '../components/Modal'
import { usePhone } from '../lib/hooks'
import {
  WEB_EDGES, IMAGE_SIZES, LIMIT_MAX, LINK_HOST, MIN_ROLES, ROLES, changeSummary, emailSignIn, filterForced, initials, linkEnding,
  normalize, pinReason, randomPin, roleLabel, rolePlural, saveBlocker, slugify, slugOf, useGalleryAccess,
} from './access'

// The settings, in the order they're listed (the sign-in method card comes first in Access).
// `rolesOnly`: only with role-based access. `clientOnly`: only on the Client role. `expands`: has options under it while on.
const SETTINGS = [
  { id: 'pin', group: 'access', icon: LockSimple, title: 'Password protection', desc: 'Visitors enter a password to open the gallery.', expands: true },
  { id: 'faceSearch', group: 'access', icon: ScanSmiley, title: 'Face scan sign-in', desc: 'Visitors scan their face to sign in.', expands: true },
  { id: 'filterByFace', group: 'engagement', icon: UserFocus, title: 'Filter by face', desc: 'Visitors can show only the photos they’re in.' },
  { id: 'favoriting', group: 'engagement', icon: Heart, title: 'Favorites', desc: 'Visitors can mark their favorite photos.' },
  { id: 'comments', group: 'engagement', icon: ChatCircleDots, title: 'Comments', desc: 'Visitors can comment on photos.', rolesOnly: true },
  { id: 'hideImages', group: 'engagement', icon: EyeSlash, title: 'Hide photos', desc: 'Clients can hide photos. Photos they hide don’t show to guests or vendors.', expands: true, clientOnly: true },
  { id: 'screenshot', group: 'privacy', icon: ImageBroken, title: 'Screenshot protection', desc: 'Photos blur if a visitor takes a screenshot.' },
  { id: 'downloads', group: 'privacy', icon: DownloadSimple, title: 'Downloads', desc: 'Visitors can download photos and videos.', expands: true },
  { id: 'sharing', group: 'privacy', icon: ShareFat, title: 'Sharing', desc: 'Visitors can share photos and videos.', expands: true },
  { id: 'sets', group: 'privacy', icon: FolderSimple, title: 'Set visibility', desc: 'Choose which sets show in the gallery.', expands: true },
]
const GROUPS = [
  { id: 'access', title: 'Access' },
  { id: 'engagement', title: 'Engagement' },
  { id: 'privacy', title: 'Privacy' },
]
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const SIGN_IN_TERMS = 'sign-in method no sign-in needed collect email on sign-up approved only password only'

/**
 * Step 3 — Settings. Who can open the gallery (anyone with the link, or by role) and what visitors
 * can do in it, grouped as Access, Engagement and Privacy. Edits stay a draft until Save; the bar
 * at the bottom shows while there are unsaved changes.
 */
export default function SettingsStep({ ws }) {
  const [saved, setSaved] = useGalleryAccess()
  const [draft, setDraft] = useState(saved)
  const [role, setRole] = useState(saved.roles[0])
  const [query, setQuery] = useState('')
  const [closed, setClosed] = useState({}) // group id → collapsed
  const [adding, setAdding] = useState(false)
  const [tried, setTried] = useState(false) // Save was pressed while blocked: show the problem in red
  const [summary, setSummary] = useState(null) // the Save summary's changes while it's open
  const dirty = !same(draft, saved)
  const blocker = saveBlocker(draft)
  const title = ws.gallery.title

  // Saved somewhere else (another tab) while there's nothing unsaved here: follow it.
  const last = useRef(saved)
  useEffect(() => {
    setDraft((d) => (same(d, last.current) ? saved : d))
    last.current = saved
  }, [saved])
  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return
    const warn = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const roles = draft.mode === 'roles'
  const activeRole = draft.roles.includes(role) ? role : draft.roles[0]
  const aud = roles ? activeRole : 'anyone'
  const cur = draft.data[aud]

  const edit = (fn) => setDraft((d) => { const n = structuredClone(d); fn(n); return normalize(n) })
  const editCur = (fn) => edit((n) => fn(n.data[aud], n))

  const forced = filterForced(cur)
  const locked = (id) => (id === 'pin' && !!pinReason(draft, aud)) || (id === 'filterByFace' && forced !== null)
  const toFace = () => document.getElementById('setting-faceSearch')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const lockNote = (id) => {
    if (id === 'pin') {
      return pinReason(draft, aud) === 'password'
        ? 'Required with Password only sign-in.'
        : 'Required: more than one role on the shared link signs in without an approved list, so each needs its own password.'
    }
    return (
      <>
        {forced ? 'On' : 'Off'} because of{' '}
        <button type="button" onClick={toFace} className="text-type-0 underline underline-offset-2">Face scan sign-in</button>
        {' '}→ {forced ? 'Whole gallery' : 'Only photos they’re in'}.
      </>
    )
  }
  const isOn = (id) => (id === 'filterByFace' && forced !== null ? forced : locked(id) || cur[id].on)

  const toggle = (id, on) => editCur((d) => {
    d[id].on = on
    if (!on) return
    if (id === 'sharing') { d.sharing.image = true; d.sharing.video = true }
    if (id === 'downloads') {
      d.downloads.image.on = true
      d.downloads.video.on = true
      if (!IMAGE_SIZES.some((z) => d.downloads.image.sizes[z.id])) d.downloads.image.sizes.web = true
    }
  })

  const q = query.trim().toLowerCase()
  const visible = (s) =>
    (!s.rolesOnly || roles) && (!s.clientOnly || (roles && aud === 'client')) && (!q || s.title.toLowerCase().includes(q))
  const signInVisible = !q || SIGN_IN_TERMS.includes(q)

  // Save: blocked → open the audience with the problem and mark it red; otherwise the Save summary.
  const save = () => {
    if (blocker) {
      setTried(true)
      if (blocker.aud && blocker.aud !== 'anyone') setRole(blocker.aud)
      if (blocker.field === 'pin' || blocker.field === 'sizes') setQuery('')
      return
    }
    setSummary(changeSummary(saved, draft, title))
  }
  const confirmSave = () => {
    setSaved(draft)
    setSummary(null)
    setTried(false)
    notify('Settings saved')
  }
  const dismiss = () => { setDraft(saved); setTried(false) }
  const showError = (field) => tried && blocker?.field === field && (blocker.aud === null || blocker.aud === aud)

  const slug = slugOf(draft, title)
  const setSlug = (v) => edit((n) => { n.slug = { custom: true, value: slugify(v) } })
  const links = !roles || draft.singleLink
    ? [{ key: 'all', label: roles ? 'Gallery link · all roles' : 'Gallery link' }]
    : draft.roles.map((r) => ({ key: r, label: `${roleLabel(r)} link` }))

  return (
    <div className="mx-auto max-w-[760px] px-4 pb-40 pt-6 max-sm:pb-56 md:px-6 md:pt-10">
      <PageHeader title="Gallery settings" description="Who can open this gallery and what visitors can do in it." />

      {/* Who can open it */}
      <div className="mt-8 rounded-2xl border border-border bg-surface-1 p-4 md:p-5">
        <Segmented
          label="Who can open this gallery"
          value={draft.mode}
          onChange={(mode) => edit((n) => { n.mode = mode })}
          options={[
            { id: 'anyone', label: 'Anyone with the link', hint: 'One link and expiry date for everyone. Choose how visitors sign in below.' },
            { id: 'roles', label: 'By role', hint: 'Clients, guests and vendors each get their own access and permissions.' },
          ]}
        />

        {roles && (
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-13-m text-type-0">Roles <span className="text-12-r text-type-3">· at least {MIN_ROLES}</span></p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const on = draft.roles.includes(r.id)
                if (!on) {
                  return (
                    <Chip key={r.id} onClick={() => { edit((n) => { n.roles.push(r.id) }); setRole(r.id); notify(`${r.label} role added`) }}>
                      <Plus size={14} /> {r.label}
                    </Chip>
                  )
                }
                const keep = draft.roles.length <= MIN_ROLES
                return (
                  <span key={r.id} className="flex h-9 items-center gap-1 rounded-full bg-primary pl-3.5 pr-1.5 text-13-m text-primary-foreground">
                    {r.label}
                    <button
                      type="button"
                      disabled={keep}
                      title={keep ? `Role-based access needs at least ${MIN_ROLES} roles` : undefined}
                      aria-label={`Remove ${r.label} role`}
                      onClick={() => edit((n) => { n.roles = n.roles.filter((x) => x !== r.id) })}
                      className="grid h-6 w-6 place-items-center rounded-full transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )
              })}
            </div>
            <div className="mt-4">
              <Checkbox checked={draft.singleLink} onChange={(v) => edit((n) => { n.singleLink = v })}>One link for all roles</Checkbox>
              <p className="ml-7 mt-1 text-12-r text-type-3">
                {draft.singleLink
                  ? 'Everyone opens the same link and picks their role. One expiry date covers all roles. When more than one role signs in without an approved list, each needs its own password.'
                  : 'Each role gets its own link and its own expiry date.'}
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 space-y-4 border-t border-border pt-5">
          {links.map((l) => (
            <LinkRow
              key={l.key}
              label={l.label}
              slug={slug}
              ending={linkEnding(draft, l.key)}
              onSlug={setSlug}
              error={showError('slug') || (draft.slug.custom && !draft.slug.value.replace(/-/g, ''))}
              expiry={draft.expiry[l.key]}
              onExpiry={(v) => edit((n) => { n.expiry[l.key] = v })}
            />
          ))}
        </div>
      </div>

      {/* What visitors can do */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        {roles && (
          <div className="sm:w-[320px]">
            <Segmented value={aud} onChange={setRole} options={draft.roles.map((r) => ({ id: r, label: rolePlural(r) }))} />
          </div>
        )}
        <label className="relative flex h-10 min-w-0 flex-1 items-center">
          <MagnifyingGlass size={16} className="pointer-events-none absolute left-3.5 text-type-3" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search settings"
            aria-label="Search settings"
            className="h-full w-full rounded-full border border-input bg-surface-1 pl-10 pr-4 text-14-r text-type-0 outline-none transition placeholder:text-type-3 focus:border-type-0"
          />
        </label>
      </div>
      {roles && <p className="mt-2 text-12-r text-type-3">Showing what {rolePlural(aud).toLowerCase()} can do. Each role keeps its own settings.</p>}

      <div className="mt-4">
        {GROUPS.map((g) => {
          const cards = SETTINGS.filter((s) => s.group === g.id && visible(s))
          const pair = g.id === 'access' && signInVisible
          if (!cards.length && !pair) return null
          const onCount = cards.filter((s) => isOn(s.id)).length + (pair && cur.signIn !== 'none' ? 1 : 0)
          const open = !!q || !closed[g.id]
          return (
            <section key={g.id} className="border-t border-border first:border-t-0">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setClosed((c) => ({ ...c, [g.id]: !c[g.id] }))}
                className="group flex h-14 w-full items-center gap-3 text-left"
              >
                <span className="flex-1 text-11-sb uppercase text-type-2 transition group-hover:text-type-0">{g.title}</span>
                <span className="text-12-r text-type-3">{onCount} of {cards.length + (pair ? 1 : 0)} on</span>
                <CaretDown size={14} className={cn('text-type-2 transition-transform duration-300', open && 'rotate-180')} />
              </button>
              <Collapse open={open}>
                <div className="space-y-3 pb-6">
                  {pair && <SignInChoice d={cur} role={aud} onMode={(m) => editCur((d) => { d.signIn = m })} onAdd={() => setAdding(true)} onRemove={(id) => editCur((d) => { d.approved.people = d.approved.people.filter((p) => p.id !== id) })} />}
                  {cards.map((s) => (
                    <SettingCard
                      key={s.id}
                      id={`setting-${s.id}`}
                      setting={s}
                      on={isOn(s.id)}
                      locked={locked(s.id)}
                      note={locked(s.id) ? lockNote(s.id) : null}
                      onChange={(on) => toggle(s.id, on)}
                    >
                      {s.expands && <Options id={s.id} d={cur} aud={aud} editCur={editCur} pinError={showError('pin')} sizesError={showError('sizes')} sets={ws.sections.map((x) => x.title)} />}
                    </SettingCard>
                  ))}
                </div>
              </Collapse>
            </section>
          )
        })}
        {GROUPS.every((g) => !SETTINGS.some((s) => s.group === g.id && visible(s))) && !signInVisible && (
          <p className="py-10 text-center text-14-r text-type-3">No settings match “{query.trim()}”.</p>
        )}
      </div>

      <SaveBar show={dirty} blocker={tried ? blocker?.message : null} onSave={save} onDismiss={dismiss} />
      <SaveSummary changes={summary} onCancel={() => setSummary(null)} onSave={confirmSave} />
      <PersonModal
        open={adding}
        onOpenChange={setAdding}
        title={`Add ${roleLabel(aud).toLowerCase()}`}
        onAdd={(p) => { editCur((d) => { d.approved.people.push(p) }); notify(`${p.name} added`) }}
      />
    </div>
  )
}

/**
 * A gallery link, `gallery.aftershoot.com/` + gallery name + ending, with Copy and an optional expiry date.
 * Only the gallery name (highlighted) can be edited; it's shared by every link of the gallery.
 */
function LinkRow({ label, slug, ending, onSlug, error, expiry, onExpiry }) {
  const url = `https://${LINK_HOST}${slug}${ending}`
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); notify('Link copied') } catch { notify('Couldn’t copy — select the link and copy it') }
  }
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
      <div className="min-w-0">
        <p className="mb-1.5 text-12-m text-type-2">{label}</p>
        <div className={cn('flex h-10 items-center rounded-full border bg-surface-0 pl-4 pr-1 transition focus-within:border-type-0', error ? 'border-destructive' : 'border-input')}>
          <span className="flex min-w-0 flex-1 items-center text-13-r text-type-3">
            <span className="min-w-0 shrink truncate">{LINK_HOST}</span>
            <input
              value={slug}
              onChange={(e) => onSlug(e.target.value)}
              size={Math.max(slug.length, 6)}
              aria-label="Gallery name in the link"
              spellCheck={false}
              className="min-w-[6ch] max-w-full shrink-0 rounded-md bg-surface-2 px-1 py-0.5 text-13-m text-type-0 outline-none"
            />
            <span className="shrink-0">{ending}</span>
          </span>
          <IconButton small label={`Copy ${label.toLowerCase()}`} onClick={copy}><CopySimple size={16} /></IconButton>
        </div>
        {error && <p className="mt-1.5 text-12-r text-destructive">Enter a gallery name: lowercase letters, numbers and hyphens.</p>}
      </div>
      <label className="block">
        <span className="mb-1.5 block text-12-m text-type-2">Expires {expiry ? '' : <span className="text-type-3">· never</span>}</span>
        <input
          type="date"
          value={expiry}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => onExpiry(e.target.value)}
          className="h-10 w-full rounded-full border border-input bg-surface-0 px-4 text-13-r text-type-0 outline-none transition focus:border-type-0"
        />
      </label>
    </div>
  )
}

/** A setting: icon, title and description, a switch, and its options underneath while on. */
function SettingCard({ id, setting: s, on, locked, note, onChange, children }) {
  const Icon = s.icon
  return (
    <div id={id} className="scroll-mt-24 rounded-2xl border border-border bg-surface-1 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-type-1"><Icon size={18} /></span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-14-m text-type-0">{s.title}</p>
          <p className="mt-0.5 text-13-r text-type-2">{s.desc}</p>
          {note && <p className="mt-1 text-12-r text-type-3">{note}</p>}
        </div>
        <span className="pt-1.5"><Switch checked={on} disabled={locked} onChange={onChange} label={s.title} /></span>
      </div>
      <Collapse open={on && !!children}>
        <div className="mt-4 space-y-4 border-t border-border pt-4 sm:ml-12">{children}</div>
      </Collapse>
    </div>
  )
}

/** The options under a setting that's on. */
function Options({ id, d, aud, editCur, pinError, sizesError, sets }) {
  // High res is sold through the store: the Digital Download product in this gallery's catalog.
  useCatalogs() // re-reads when a catalog changes
  const galleryId = useGalleryId()
  const catalogId = getGallery(galleryId)?.catalogId
  const photoProduct = catalogProduct(catalogId, 'digital-download')
  const wholeProduct = catalogProduct(catalogId, 'digital-gallery')
  const sellsDigital = photoProduct && !photoProduct.hidden
    ? { price: Math.min(...photoProduct.options[0].values.map((v) => v.price)), files: photoProduct.options[0].values.length, gallery: wholeProduct && !wholeProduct.hidden ? Math.min(...wholeProduct.options[0].values.map((v) => v.price)) : null }
    : null
  if (id === 'pin') {
    const short = d.pin.value.length < 4
    return (
      <label className="block">
        <span className="mb-1.5 block text-12-m text-type-2">Password</span>
        <input
          autoComplete="off"
          spellCheck={false}
          value={d.pin.value}
          onChange={(e) => { const v = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 20); editCur((x) => { x.pin.value = v }) }}
          placeholder="4–20 letters or numbers"
          aria-label="Password"
          aria-invalid={pinError}
          className={cn(
            'h-10 w-[240px] rounded-full border bg-surface-0 px-4 text-14-m text-type-0 outline-none transition placeholder:text-14-r placeholder:text-type-3 focus:border-type-0 max-sm:w-full',
            pinError ? 'border-destructive' : 'border-input'
          )}
        />
        {(short || pinError) && (
          <span className={cn('mt-1.5 block text-12-r', pinError ? 'text-destructive' : 'text-amber-700')}>
            {pinError && !short ? 'Use a different password from the other roles on this link.' : 'Enter 4–20 letters or numbers to save.'}
          </span>
        )}
      </label>
    )
  }
  if (id === 'faceSearch') {
    return (
      <Radios
        label="Face scan options"
        hideLabel
        value={d.faceSearch.scope}
        onChange={(v) => editCur((x) => { x.faceSearch.scope = v })}
        options={[
          { id: 'all', label: 'Whole gallery', tag: 'Filter Face On', info: 'Visitors browse every photo and can filter to the ones they’re in.' },
          { id: 'own', label: 'Only photos they’re in', tag: 'Filter Face Off', info: 'Visitors only see the sets and photos they appear in, so there’s nothing to filter.' },
        ]}
      />
    )
  }
  if (id === 'hideImages') {
    return (
      <div>
        <Checkbox checked={d.hideImages.bulk} onChange={(v) => editCur((x) => { x.hideImages.bulk = v })}>
          Allow hiding in bulk <Tag className="ml-1">Optional</Tag>
        </Checkbox>
        <p className="ml-7 mt-1 text-12-r text-type-3">Visitors can select several photos and hide them together.</p>
      </div>
    )
  }
  if (id === 'downloads') {
    const dl = d.downloads
    const selling = dl.image.sizes.high && !dl.image.highFree && !!sellsDigital
    return (
      <>
        <p className="rounded-xl bg-surface-2 px-3 py-2.5 text-12-r-p text-type-2">These rules apply to every download: one photo, a selection or the whole gallery.</p>
        <div>
          <Checkbox checked={dl.pin.on} onChange={(v) => editCur((x) => { x.downloads.pin.on = v; if (v && !x.downloads.pin.code) x.downloads.pin.code = randomPin() })}>
            Require a download PIN <Tag className="ml-1">Optional</Tag>
          </Checkbox>
          {dl.pin.on && (
            <div className="ml-7 mt-2.5">
              <div className="flex items-center gap-1">
                <span className="flex h-10 items-center rounded-full border border-input bg-surface-0 px-4 text-16-m tabular-nums tracking-widest text-type-0">{dl.pin.code}</span>
                <IconButton label="Copy download PIN" onClick={async () => { try { await navigator.clipboard.writeText(dl.pin.code); notify('Download PIN copied') } catch { notify('Couldn’t copy the PIN') } }}><CopySimple size={16} /></IconButton>
                <IconButton label="New download PIN" onClick={() => { editCur((x) => { x.downloads.pin.code = randomPin() }); notify('New download PIN made') }}><ArrowsClockwise size={16} /></IconButton>
              </div>
              <p className="mt-1.5 text-12-r text-type-3">Visitors enter this PIN before they can download.</p>
            </div>
          )}
        </div>
        <div>
          <Checkbox checked={dl.personalUse} onChange={(v) => editCur((x) => { x.downloads.personalUse = v })}>
            Personal use only <Tag className="ml-1">Optional</Tag>
          </Checkbox>
          <p className="ml-7 mt-1 text-12-r text-type-3">Before their first download, visitors agree to use photos for personal, non-commercial use only. They’re asked to contact you for commercial use.</p>
        </div>
        <div className="border-t border-border pt-4">
          <Checkbox checked={dl.image.on} onChange={(v) => editCur((x) => { x.downloads.image.on = v })}>Photo downloads</Checkbox>
          {dl.image.on && (
            <div className="ml-7 mt-3 space-y-3">
              <div>
                <p className="mb-2 text-12-m text-type-2">Sizes</p>
                <div className="flex flex-wrap gap-2">
                  {IMAGE_SIZES.map((z) => (
                    <Chip key={z.id} active={dl.image.sizes[z.id]} aria-pressed={dl.image.sizes[z.id]} onClick={() => editCur((x) => { x.downloads.image.sizes[z.id] = !x.downloads.image.sizes[z.id] })}>
                      {dl.image.sizes[z.id] ? <Check size={14} weight="bold" /> : <Plus size={14} />} {z.label}
                    </Chip>
                  ))}
                </div>
                {!IMAGE_SIZES.some((z) => dl.image.sizes[z.id]) && <p className={cn('mt-1.5 text-12-r', sizesError ? 'text-destructive' : 'text-amber-700')}>Pick at least one size.</p>}
              </div>
              {dl.image.sizes.web && <WebSizeOptions web={dl.image.web} edit={(fn) => editCur((x) => fn(x.downloads.image.web))} />}
              {dl.image.sizes.high && <HighResPrice product={sellsDigital} free={dl.image.highFree} onChange={(v) => editCur((x) => { x.downloads.image.highFree = v })} />}
              <LimitField
                label="Download limit"
                disabled={!emailSignIn(d)}
                hint={!emailSignIn(d)
                  ? `Limits count per visitor email. To set one, choose ${aud === 'anyone' ? 'Collect email on sign-up or Approved clients only' : `Collect email on sign-up or Approved ${rolePlural(aud).toLowerCase()} only`} under sign-in.`
                  : selling ? 'Most free photos each visitor can download (per email). Bought photos don’t count.' : 'Most photos each visitor can download (per email).'}
                value={dl.image.limit}
                onChange={(v) => editCur((x) => { x.downloads.image.limit = v })}
              />
            </div>
          )}
        </div>
        <div className="border-t border-border pt-4">
          <Checkbox checked={dl.video.on} onChange={(v) => editCur((x) => { x.downloads.video.on = v })}>Video downloads</Checkbox>
        </div>
      </>
    )
  }
  if (id === 'sharing') {
    return (
      <div className="space-y-3">
        <Checkbox checked={d.sharing.image} onChange={(v) => editCur((x) => { x.sharing.image = v })}>Photo sharing</Checkbox>
        <Checkbox checked={d.sharing.video} onChange={(v) => editCur((x) => { x.sharing.video = v })}>Video sharing</Checkbox>
      </div>
    )
  }
  if (id === 'sets') {
    if (!sets.length) return <p className="text-13-r text-type-3">No sets yet. Add them in Photos.</p>
    return (
      <div className="space-y-3">
        {sets.map((t) => {
          const shown = !d.sets.hidden.includes(t)
          return (
            <Checkbox key={t} checked={shown} onChange={(v) => editCur((x) => { x.sets.hidden = v ? x.sets.hidden.filter((h) => h !== t) : [...x.sets.hidden, t] })}>
              {t}
            </Checkbox>
          )
        })}
      </div>
    )
  }
  return null
}

/**
 * Sign-in method, one at a time. Anyone with the link: No sign-in needed, Collect email on sign-up or
 * Approved clients only. A role: Password only, Collect email on sign-up or Approved [role]s only.
 */
function SignInChoice({ d, role, onMode, onAdd, onRemove }) {
  const anyone = role === 'anyone'
  const who = rolePlural(role)
  const people = d.approved.people
  const first = anyone
    ? { id: 'none', label: 'No sign-in needed', hint: 'Anyone with the link can view the gallery.' }
    : { id: 'password', label: 'Password only', hint: `No email. ${who} enter the password you set below.` }
  return (
    <div className="rounded-2xl border border-border bg-surface-1 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-type-1"><EnvelopeSimple size={18} /></span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-14-m text-type-0">{anyone ? 'How visitors sign in' : `How ${who.toLowerCase()} sign in`}</p>
          <div className="mt-3">
            <Radios
              label="Sign-in method"
              hideLabel
              value={d.signIn}
              onChange={onMode}
              options={[
                first,
                { id: 'collect', label: 'Collect email on sign-up', hint: 'Anyone with the link enters their email to get in.' },
                { id: 'approved', label: `Approved ${who.toLowerCase()} only`, hint: 'Only the emails you add can open the link.' },
              ]}
            />
          </div>
        </div>
      </div>
      <Collapse open={d.signIn === 'approved'}>
        <div className="mt-4 border-t border-border pt-4 sm:ml-12">
          <p className="mb-2.5 text-12-m text-type-2">Approved {who.toLowerCase()} · {people.length}</p>
          {people.length > 0 && (
            <ul className="mb-3 divide-y divide-border rounded-xl border border-border">
              {people.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-12-sb text-primary-foreground">{initials(p.name)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-13-m text-type-0">{p.name}</span>
                    <span className="block truncate text-12-r text-type-3">{[p.email, p.phone].filter(Boolean).join(' · ')}</span>
                  </span>
                  <IconButton small label={`Remove ${p.name}`} onClick={() => onRemove(p.id)}><X size={14} /></IconButton>
                </li>
              ))}
            </ul>
          )}
          {people.length === 0 && <p className="mb-3 text-13-r text-type-3">No one added yet. Until you add someone, nobody can open this link as a {roleLabel(role).toLowerCase()}.</p>}
          <Button variant="outline" size="sm" onClick={onAdd} className="max-sm:w-full"><Plus size={14} /> Add {roleLabel(role).toLowerCase()}</Button>
        </div>
      </Collapse>
    </div>
  )
}

function PersonModal({ open, onOpenChange, title, onAdd }) {
  const [f, setF] = useState({ name: '', email: '', phone: '' })
  useEffect(() => { if (open) setF({ name: '', email: '', phone: '' }) }, [open])
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())
  const ok = f.name.trim() && emailOk
  const submit = (e) => {
    e?.preventDefault()
    if (!ok) return
    onAdd({ id: `p${Date.now().toString(36)}`, name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim() })
    onOpenChange(false)
  }
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="They’ll be able to open the gallery with this email."
      footer={(
        <>
          <Button variant="outline" size="md" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="md" disabled={!ok} onClick={submit}>Add</Button>
        </>
      )}
    >
      <form onSubmit={submit} className="space-y-4 pb-1">
        <Field label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value.slice(0, 60) })} placeholder="Sam Lee" autoFocus />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Email"
            type="email"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
            placeholder="sam@example.com"
            error={f.email.trim() && !emailOk ? 'Enter a valid email' : null}
          />
          <Field label="Phone (optional)" type="tel" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/[^\d+\-() ]/g, '').slice(0, 18) })} placeholder="+1 555 010 0199" />
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}

/**
 * While there are unsaved changes: Dismiss and Save. Tablet/desktop: a dark pill stuck to the bottom
 * of the page. Phones: the bottom CTA bar fixed to the screen, status line then Save over Dismiss.
 */
function SaveBar({ show, blocker, onSave, onDismiss }) {
  const phone = usePhone()
  const status = (
    <span className="flex items-center gap-2 text-13-m">
      <span className={cn('h-1.5 w-1.5 rounded-full', blocker ? 'bg-destructive' : phone ? 'bg-type-3' : 'bg-white/60')} />
      {blocker ?? 'Unsaved changes'}
    </span>
  )
  return (
    <AnimatePresence>
      {show && (phone ? (
        <motion.div
          key="phone"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.45, ease }}
          className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-2 border-t border-border bg-surface-1/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 text-type-1 backdrop-blur-md"
          role="status"
        >
          <div className="px-1 pb-1">{status}</div>
          <Button size="lg" onClick={onSave} className="w-full">Save</Button>
          <Button variant="ghost" size="lg" onClick={onDismiss} className="w-full">Dismiss</Button>
        </motion.div>
      ) : (
        <motion.div
          key="desktop"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3, ease }}
          className="sticky bottom-4 z-20 mx-auto mt-6 flex w-fit max-w-full items-center gap-2 rounded-full bg-type-0 py-2 pl-5 pr-2 text-white shadow-[0_10px_30px_rgba(0,0,0,.22)]"
          role="status"
        >
          <span className="mr-2">{status}</span>
          <Button variant="ghost" size="sm" onClick={onDismiss} className="text-white/80 hover:bg-white/10 hover:text-white">Dismiss</Button>
          <Button variant="light" size="sm" onClick={onSave}>Save</Button>
        </motion.div>
      ))}
    </AnimatePresence>
  )
}

/**
 * The Save summary: every change Save will make. Changes that cut off people who already have the link
 * are listed first in a red box with their effect, and the button reads "Save anyway".
 */
function SaveSummary({ changes, onCancel, onSave }) {
  const list = changes ?? []
  const breaking = list.filter((c) => c.breaking)
  const other = list.filter((c) => !c.breaking)
  return (
    <Modal
      open={!!changes}
      onOpenChange={(o) => { if (!o) onCancel() }}
      title="Save changes?"
      description={breaking.length ? 'Some changes affect people who already have the link.' : 'Here’s what will change.'}
      footer={(
        <>
          <Button variant="outline" size="md" onClick={onCancel}>Keep editing</Button>
          <Button size="md" onClick={onSave} className={breaking.length ? 'bg-destructive text-white hover:bg-destructive/90' : undefined}>{breaking.length ? 'Save anyway' : 'Save'}</Button>
        </>
      )}
    >
      <div className="space-y-4 pb-1">
        {breaking.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3.5">
            <p className="flex items-center gap-2 text-13-m text-destructive"><Warning size={16} weight="fill" /> Affects people with the link</p>
            <ul className="mt-2.5 space-y-2.5">
              {breaking.map((c, i) => (
                <li key={i}>
                  <p className="text-13-m text-type-0">{c.label}</p>
                  <p className="text-12-r text-destructive">{c.effect}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {other.length > 0 && (
          <ul className="space-y-2">
            {other.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-13-r text-type-1">
                <Check size={14} className="mt-0.5 shrink-0 text-type-3" /> {c.label}
              </li>
            ))}
          </ul>
        )}
        {!list.length && <p className="text-13-r text-type-2">Option details changed (sizes, watermark, wording). Nobody loses access.</p>}
      </div>
    </Modal>
  )
}

function Radios({ label, hideLabel, value, onChange, options }) {
  return (
    <div role="radiogroup" aria-label={label}>
      {label && !hideLabel && <p className="mb-2.5 text-12-m text-type-2">{label}</p>}
      <div className="space-y-3">
        {options.map((o) => {
          const on = o.id === value
          return (
            <button key={o.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.id)} className="group flex w-full items-start gap-2.5 text-left">
              <span className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition', on ? 'border-type-0' : 'border-type-3 group-hover:border-type-1')}>
                {on && <span className="h-2.5 w-2.5 rounded-full bg-type-0" />}
              </span>
              <span className="min-w-0">
                <span className={cn('flex flex-wrap items-center gap-1.5 text-14-r', on ? 'text-type-0' : 'text-type-1')}>
                  {o.label}
                  {o.tag && <Tag tone={on ? 'dark' : 'muted'}>{o.tag}</Tag>}
                  {o.info && (
                    <span title={o.info} aria-label={o.info} className="grid h-5 w-5 place-items-center text-type-3 hover:text-type-0">
                      <Info size={14} />
                    </span>
                  )}
                </span>
                {o.hint && <span className="mt-0.5 block text-12-r text-type-3">{o.hint}</span>}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Web size: its long edge (1,200 or 2,048px) and whether it's watermarked. */
function WebSizeOptions({ web, edit }) {
  return (
    <div className="space-y-3">
      <div>
        <span className="mb-1.5 block text-12-m text-type-2">Web size</span>
        <Select
          label="Web size"
          value={String(web.edge)}
          onChange={(v) => edit((w) => { w.edge = Number(v) })}
          options={WEB_EDGES.map((e) => ({ value: String(e), label: `${e.toLocaleString()}px long edge` }))}
          className="w-[200px] max-sm:w-full"
        />
      </div>
      <Checkbox checked={web.watermark} onChange={(v) => edit((w) => { w.watermark = v })}>Watermark web-size downloads</Checkbox>
    </div>
  )
}

/**
 * Whether High res is free or paid. Paid High res is sold through the store's Digital Download product
 * (priced in Store), so the choice only exists while this gallery's catalog shows it.
 */
function HighResPrice({ product, free, onChange }) {
  if (!product) {
    return (
      <p className="flex gap-2 rounded-xl bg-surface-2 px-3 py-2.5 text-12-r-p text-type-2">
        <Storefront size={16} className="mt-px shrink-0" />
        <span>High res downloads are free. To charge for them, show <span className="text-type-0">Digital Download</span> in this gallery’s store catalog (Store).</span>
      </p>
    )
  }
  return (
    <Radios
      label="High res"
      value={free ? 'free' : 'paid'}
      onChange={(v) => onChange(v === 'free')}
      options={[
        {
          id: 'paid',
          label: `Paid · ${product.files > 1 ? 'from ' : ''}${money(product.price)} a photo`,
          hint: `Sold as Digital Download in your store${product.files > 1 ? ` (${product.files} file sizes)` : ''}${product.gallery ? `, or from ${money(product.gallery)} for the whole gallery` : ''}. Visitors download it free once bought. Change prices in Store.`,
        },
        { id: 'free', label: 'Free', hint: 'Anyone with downloads can save the original file.' },
      ]}
    />
  )
}

/** Whole number up to LIMIT_MAX; empty means no limit. */
function LimitField({ label, hint, value, onChange, disabled }) {
  return (
    <label className="block">
      <span className={cn('mb-1.5 block text-12-m', disabled ? 'text-type-3' : 'text-type-2')}>{label}</span>
      <input
        inputMode="numeric"
        disabled={disabled}
        value={value}
        onChange={(e) => { const v = e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 5); onChange(v && String(Math.min(Number(v), LIMIT_MAX))) }}
        placeholder="No limit"
        aria-label={label}
        className="h-10 w-[160px] rounded-full border border-input bg-surface-0 px-4 text-14-r tabular-nums text-type-0 outline-none transition placeholder:text-type-3 focus:border-type-0 disabled:cursor-not-allowed disabled:bg-surface-2"
      />
      {hint && <span className="mt-1.5 block text-12-r text-type-3">{hint}</span>}
    </label>
  )
}

/** Height + fade reveal (0.3s, app curve). */
function Collapse({ open, children }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
