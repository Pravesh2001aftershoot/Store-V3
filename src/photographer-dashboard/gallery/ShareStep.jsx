import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, ArrowSquareOut, Check, Circle, CopySimple, DownloadSimple, EnvelopeSimple, LockSimple,
  Storefront, UserCircle, X,
} from '@phosphor-icons/react'
import { Button, Field } from '../../components/ui'
import { cn, plural } from '../../lib/utils'
import { notify } from '../../gallery/lib/actions'
import { Segmented } from '../../gallery/templates/cover/controls'
import { ALL_TEMPLATES as COVER_TEMPLATES } from '../../gallery/templates/cover/config'
import { Checkbox, IconButton, PageHeader, Tag } from '../components/ui'
import { galleryPath } from '../../data/galleries'
import { audiences, rolePlural, roleLabel, useGalleryAccess } from './access'
import {
  LIMITS, audienceName, codesFor, composeEmail, defaultText, expiryFor, formatDate, linkFor, mailto, qrCardPNG, qrFor,
  useShareSettings,
} from './share'

const copy = async (text, ok) => {
  try {
    await navigator.clipboard.writeText(text)
    notify(ok)
  } catch {
    notify('Couldn’t copy — select it and copy it yourself')
  }
}

/**
 * Step 4 — Share. Everything the client needs to get in, built from the Settings step: each link with
 * its passwords, download PINs and expiry; then two ways to send it, an email (wording and details
 * editable) and a QR card; then a "Before you send" checklist.
 * (Sending from the app is out of scope: the email opens in the photographer's own mail app.)
 */
export default function ShareStep({ ws }) {
  const { library, photos, sections, cover, media, footer } = ws
  const [access] = useGalleryAccess()
  const base = `${window.location.origin}${galleryPath(ws.gallery.id)}`
  const auds = audiences(access)
  const [picked, setPicked] = useState(auds[0])
  const aud = auds.includes(picked) ? picked : auds[0]
  const [method, setMethod] = useState('email')
  const roles = access.mode === 'roles'

  // Roles on the approved list with nobody on it can't get in.
  const emptyLists = roles ? access.roles.filter((r) => access.data[r].approved.on && !access.data[r].approved.people.length) : []
  const accessSummary = roles
    ? `By role · ${access.roles.map(rolePlural).join(', ')} · ${access.singleLink ? 'one link' : 'a link each'}`
    : `Anyone with the link${access.data.anyone.pin.on ? ' · password' : ''}`

  const checks = [
    { done: photos.length > 0, title: plural(photos.length, 'photo'), detail: `${plural(sections.length, 'collection')}${library.removed.length ? ` · ${library.removed.length} removed` : ''}`, to: 'photos' },
    { done: !media.isDefault, title: media.isDefault ? 'Using the default cover photo' : 'Cover photo chosen', detail: `Template: ${COVER_TEMPLATES.find((t) => t.id === cover.template)?.name ?? 'Custom'}`, to: 'design' },
    { done: !!cover.config.content.title, title: `Titled “${cover.config.content.title}”`, detail: cover.config.content.subtitle || 'No subtitle', to: 'design' },
    { done: true, title: 'Footer', detail: footer.edited ? 'Customised' : 'Using the template as is', to: 'design' },
    {
      done: !emptyLists.length,
      title: emptyLists.length ? `No approved ${emptyLists.map((r) => rolePlural(r).toLowerCase()).join(' or ')} yet` : 'Access',
      detail: emptyLists.length ? 'Nobody in that role can open the gallery until you add them.' : accessSummary,
      to: 'settings',
    },
  ]

  return (
    <div className="mx-auto max-w-[960px] px-4 pb-40 pt-6 md:px-6 md:pt-10">
      <PageHeader title="Share with your client" description="Send the link by email or as a QR code. Passwords and PINs come from Settings, and everything you change keeps updating the gallery." />

      {/* Cover + how people get in */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface-1">
        <div className="relative aspect-[21/9] max-h-[240px] w-full overflow-hidden bg-type-0">
          <img src={media.photo.src} alt="" className="h-full w-full object-cover opacity-90" style={{ objectPosition: `${media.photo.focus.x}% ${media.photo.focus.y}%` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-6">
            <p className="text-12-sb uppercase text-white/70">{ws.gallery.date}</p>
            <p className="mt-1 truncate text-24-m">{cover.config.content.title || ws.gallery.client}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 md:px-5">
          <LockSimple size={16} className="shrink-0 text-type-2" />
          <p className="min-w-0 flex-1 truncate text-13-m text-type-1">{accessSummary}</p>
          <Link to={`${ws.base}/settings`} className="flex shrink-0 items-center gap-1 text-13-m text-type-2 transition hover:text-type-0">
            Settings <ArrowRight size={12} />
          </Link>
        </div>
        <AccessOverview access={access} base={base} />
      </div>

      {/* Send it */}
      <h2 className="mt-10 text-16-sb text-type-0">Send it</h2>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        {roles && (
          <div className="sm:w-[320px]">
            <Segmented label="Who’s it for" value={aud} onChange={setPicked} options={auds.map((a) => ({ id: a, label: audienceName(a) }))} />
          </div>
        )}
        <div className="sm:w-[240px]">
          <Segmented
            label={roles ? 'How' : 'Send by'}
            value={method}
            onChange={setMethod}
            options={[{ id: 'email', label: 'Email' }, { id: 'qr', label: 'QR code' }]}
          />
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-border bg-surface-1 p-4 md:p-5">
        {method === 'email'
          ? <EmailComposer key={aud} ws={ws} access={access} aud={aud} base={base} />
          : <QrPanel ws={ws} access={access} aud={aud} base={base} />}
      </div>

      <h2 className="mt-10 text-16-sb text-type-0">Before you send</h2>
      <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface-1">
        {checks.map((c) => (
          <li key={c.to + c.title}>
            <Link to={`${ws.base}/${c.to}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface-2/60">
              <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full', c.done ? 'bg-success-bg text-success' : 'bg-surface-2 text-type-3')}>
                {c.done ? <Check size={12} weight="bold" /> : <Circle size={10} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-14-m text-type-0">{c.title}</span>
                <span className="block truncate text-12-r text-type-2">{c.detail}</span>
              </span>
              <span className="text-13-m text-type-2">Edit</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-16-sb text-type-0">Also part of the gallery</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {[
          { to: '/dashboard/portfolio', icon: UserCircle, title: 'Portfolio', body: 'Your name in the gallery links here. Check your profile and work.' },
          { to: `/dashboard/store/${ws.meta.catalogId}`, icon: Storefront, title: 'Print store', body: 'Clients order prints from their photos. Set products and prices for this gallery’s catalog.' },
        ].map((x) => (
          <Link key={x.to} to={x.to} className="group flex gap-3 rounded-2xl border border-border bg-surface-1 p-4 transition hover:border-type-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2"><x.icon size={20} /></span>
            <span>
              <span className="block text-14-m text-type-0">{x.title}</span>
              <span className="block text-13-r-p text-type-2">{x.body}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <Button as={Link} to={`${ws.base}/settings`} variant="ghost" size="sm" className="-ml-2 max-sm:ml-0 max-sm:h-10 max-sm:w-full">
          <ArrowLeft size={14} /> Settings
        </Button>
      </div>
    </div>
  )
}

/**
 * Every way in, per audience: the link (shared, or one per role) with Copy and Open, then the
 * passwords, download PINs, sign-in method and expiry.
 */
function AccessOverview({ access, base }) {
  const roles = access.mode === 'roles'
  const auds = audiences(access)
  const shared = !roles || access.singleLink
  return (
    <div className="divide-y divide-border">
      {shared && <LinkLine label={roles ? 'Gallery link · all roles' : 'Gallery link'} url={base} expiry={access.expiry.all} />}
      {(roles || codesFor(access, 'anyone').password || codesFor(access, 'anyone').pin) && auds.map((a) => {
        const { password, pin } = codesFor(access, a)
        const d = access.data[a]
        return (
          <div key={a} className="px-4 py-3.5 md:px-5">
            {roles && (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-13-m text-type-0">{rolePlural(a)}</p>
                <Tag>{d.approved.on ? `Approved list · ${d.approved.people.length}` : 'Email sign-up'}</Tag>
              </div>
            )}
            {!shared && <LinkField url={linkFor(access, a, base)} label={`${roleLabel(a)} link`} expiry={expiryFor(access, a)} />}
            <div className={cn('flex flex-wrap gap-2', !shared && 'mt-2.5')}>
              {password ? <Code label="Password" value={password} /> : <span className="text-12-r text-type-3">No password</span>}
              {pin && <Code label="Download PIN" value={pin} />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LinkLine({ label, url, expiry }) {
  return (
    <div className="px-4 py-3.5 md:px-5">
      <LinkField label={label} url={url} expiry={expiry} />
    </div>
  )
}

/** URL pill with Copy and Open (full width under the URL on phones). */
function LinkField({ label, url, expiry }) {
  return (
    <div>
      <p className="mb-1.5 text-12-m text-type-2">
        {label} <span className="text-type-3">· {expiry ? `expires ${formatDate(expiry)}` : 'never expires'}</span>
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex h-10 min-w-0 flex-1 items-center rounded-full border border-input bg-surface-0 px-4">
          <span className="truncate text-13-r text-type-1">{url}</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => copy(url, 'Link copied')} className="max-sm:h-10 max-sm:flex-1"><CopySimple size={14} /> Copy</Button>
          <Button as="a" href={url} target="_blank" rel="noreferrer" variant="outline" size="sm" className="max-sm:h-10 max-sm:flex-1">Open <ArrowSquareOut size={12} /></Button>
        </div>
      </div>
    </div>
  )
}

/** A code with its label and a copy button: "Password 4821 ⧉". */
function Code({ label, value }) {
  return (
    <span className="flex h-9 items-center gap-2 rounded-full bg-surface-2 pl-3.5 pr-1">
      <span className="text-12-r text-type-2">{label}</span>
      <span className="text-14-m tabular-nums tracking-widest text-type-0">{value}</span>
      <IconButton small label={`Copy ${label.toLowerCase()}`} onClick={() => copy(value, `${label} copied`)}><CopySimple size={14} /></IconButton>
    </span>
  )
}

/**
 * The email for one audience: recipients (the approved list when there is one), subject, message,
 * which details to include, and the sign-off, beside a live preview. Opens in the mail app or copies.
 */
function EmailComposer({ ws, access, aud, base }) {
  const [share, setShare] = useShareSettings()
  const d = access.data[aud]
  const approved = aud !== 'anyone' && d.approved.on
  const [to, setTo] = useState(() => (approved ? d.approved.people.map((p) => p.email) : []))
  const [draftTo, setDraftTo] = useState('')
  const def = defaultText(ws.gallery)
  const email = useMemo(() => composeEmail({ gallery: ws.gallery, access, aud, base, share }), [ws.gallery, access, aud, base, share])
  const { password, pin } = codesFor(access, aud)
  const expiry = expiryFor(access, aud)

  const set = (patch) => setShare((s) => ({ ...s, ...patch }))
  const include = (k, v) => setShare((s) => ({ ...s, include: { ...s.include, [k]: v } }))
  const edited = share.subject || share.message || share.closing

  const addTo = () => {
    const parts = draftTo.split(/[,\s;]+/).map((x) => x.trim()).filter(Boolean)
    const valid = (p) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p)
    const bad = parts.filter((p) => !valid(p))
    // Add the good ones; leave the rest in the field to fix.
    setTo((t) => [...new Set([...t, ...parts.filter(valid)])])
    setDraftTo(bad.join(', '))
    if (bad.length) notify(`“${bad[0]}” isn’t an email address`)
  }

  const options = [
    { k: 'link', label: 'Gallery link', show: true },
    { k: 'password', label: `Password (${password})`, show: !!password },
    { k: 'pin', label: `Download PIN (${pin})`, show: !!pin },
    { k: 'expiry', label: `Expiry date (${formatDate(expiry)})`, show: !!expiry },
  ].filter((o) => o.show)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-w-0 space-y-4">
        <div>
          <p className="mb-1.5 text-13-m text-type-1">To</p>
          <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-surface-1 p-1.5 transition focus-within:border-type-0 focus-within:ring-4 focus-within:ring-black/5">
            {to.map((e) => (
              <span key={e} className="flex h-8 max-w-full items-center gap-1 rounded-full bg-surface-2 pl-3 pr-1 text-13-r text-type-0">
                <span className="truncate">{e}</span>
                <button type="button" aria-label={`Remove ${e}`} onClick={() => setTo((t) => t.filter((x) => x !== e))} className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-type-2 transition hover:bg-surface-1 hover:text-type-0"><X size={12} /></button>
              </span>
            ))}
            <input
              type="email"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
              onKeyDown={(e) => {
                if (['Enter', ',', ' '].includes(e.key) && draftTo.trim()) { e.preventDefault(); addTo() }
                if (e.key === 'Backspace' && !draftTo && to.length) setTo((t) => t.slice(0, -1))
              }}
              onBlur={() => draftTo.trim() && addTo()}
              placeholder={to.length ? 'Add another' : 'name@example.com'}
              aria-label="Add a recipient"
              className="h-8 min-w-[140px] flex-1 bg-transparent px-2 text-14-r text-type-0 outline-none placeholder:text-type-3"
            />
          </div>
          <p className="mt-1.5 text-12-r text-type-3">
            {approved ? `Filled from approved ${rolePlural(aud).toLowerCase()}.` : 'Press Enter or comma after each address.'}
          </p>
        </div>

        <Field label="Subject" value={share.subject} onChange={(e) => set({ subject: e.target.value.slice(0, LIMITS.subject) })} placeholder={def.subject} />

        <TextArea label="Message" value={share.message} onChange={(v) => set({ message: v })} placeholder={def.message} limit={LIMITS.message} rows={5} />

        <div>
          <p className="mb-2 text-13-m text-type-1">Include</p>
          <div className="space-y-2.5">
            {options.map((o) => <Checkbox key={o.k} checked={share.include[o.k]} onChange={(v) => include(o.k, v)}>{o.label}</Checkbox>)}
          </div>
          {!password && !pin && <p className="mt-2 text-12-r text-type-3">No password or download PIN for {audienceName(aud).toLowerCase()}. Add them in Settings.</p>}
          {password && !share.include.password && <p className="mt-2 text-12-r text-amber-700">They’ll need the password to open the gallery. Send it another way.</p>}
        </div>

        <TextArea label="Sign-off" value={share.closing} onChange={(v) => set({ closing: v })} placeholder={def.closing} limit={LIMITS.closing} rows={2} />

        {edited && (
          <button type="button" onClick={() => set({ subject: '', message: '', closing: '' })} className="text-13-m text-type-2 underline-offset-4 transition hover:text-type-0 hover:underline">
            Use the default wording
          </button>
        )}
      </div>

      <div className="min-w-0">
        <p className="mb-1.5 text-13-m text-type-1">Preview</p>
        <div className="rounded-xl border border-border bg-surface-0">
          <dl className="space-y-1 border-b border-border px-4 py-3 text-13-r">
            <div className="flex gap-2"><dt className="w-14 shrink-0 text-type-3">From</dt><dd className="min-w-0 truncate text-type-1">{ws.gallery.photographer}</dd></div>
            <div className="flex gap-2"><dt className="w-14 shrink-0 text-type-3">To</dt><dd className="min-w-0 truncate text-type-1">{to.length ? to.join(', ') : <span className="text-type-3">No one yet</span>}</dd></div>
            <div className="flex gap-2"><dt className="w-14 shrink-0 text-type-3">Subject</dt><dd className="min-w-0 text-type-0">{email.subject}</dd></div>
          </dl>
          <p className="whitespace-pre-wrap break-words px-4 py-4 text-14-r-p text-type-1">{email.body}</p>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" size="md" onClick={() => copy(`Subject: ${email.subject}\n\n${email.body}`, 'Email copied')} className="max-sm:w-full">
            <CopySimple size={16} /> Copy email
          </Button>
          <Button as="a" href={mailto(to, email)} size="md" className="max-sm:w-full">
            <EnvelopeSimple size={16} /> Open in email app
          </Button>
        </div>
        <p className="mt-2 text-12-r text-type-3 sm:text-right">Opens a draft in your own email app. Sending from here comes later.</p>
      </div>
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder, limit, rows }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-13-m text-type-1">
        {label}
        <span className="text-11-r tabular-nums text-type-3">{value.length}/{limit}</span>
      </span>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value.slice(0, limit))}
        placeholder={placeholder}
        className="w-full resize-y rounded-lg border border-input bg-surface-1 px-3.5 py-2.5 text-14-r-p text-type-0 outline-none transition placeholder:text-type-3 focus:border-type-0 focus:ring-4 focus:ring-black/5"
      />
      {!value && <span className="mt-1 block text-12-r text-type-3">Empty uses the text shown.</span>}
    </label>
  )
}

/** A QR card for one audience's link, with the codes to print under it. Download as PNG. */
function QrPanel({ ws, access, aud, base }) {
  const [share, setShare] = useShareSettings()
  const url = linkFor(access, aud, base)
  const { password, pin } = codesFor(access, aud)
  const qr = useMemo(() => qrFor(url), [url])
  const title = ws.cover.config.content.title || ws.gallery.title
  const lines = [
    share.qr.password && password && `Password ${password}`,
    share.qr.pin && pin && `Download PIN ${pin}`,
  ].filter(Boolean)
  const roleHint = aud !== 'anyone' && access.singleLink ? `Choose “${roleLabel(aud)}” when it opens` : null
  const allLines = roleHint ? [...lines, roleHint] : lines
  const setQr = (k, v) => setShare((s) => ({ ...s, qr: { ...s.qr, [k]: v } }))

  const download = () => {
    const a = document.createElement('a')
    a.href = qrCardPNG({ title, url, lines: allLines })
    a.download = `${ws.gallery.id}${aud === 'anyone' ? '' : `-${aud}`}-qr.png`
    a.click()
    notify('QR card downloaded')
  }

  return (
    <div className="grid gap-6 sm:grid-cols-[280px_minmax(0,1fr)]">
      <div className="mx-auto w-full max-w-[280px] rounded-2xl border border-border bg-white p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,.04)]">
        <p className="line-clamp-2 text-16-sb text-type-0">{title}</p>
        <svg viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`} role="img" aria-label={`QR code for ${url}`} className="mx-auto mt-4 aspect-square w-full max-w-[200px]" shapeRendering="crispEdges">
          <path
            fill="currentColor"
            className="text-type-0"
            d={qr.data.flatMap((row, y) => row.map((on, x) => (on ? `M${x} ${y}h1v1h-1z` : ''))).join('')}
          />
        </svg>
        <p className="mt-4 text-13-r text-type-2">Scan to open the gallery</p>
        {allLines.map((l) => <p key={l} className="mt-1 text-14-m text-type-0">{l}</p>)}
      </div>

      <div className="min-w-0 space-y-4">
        <div>
          <p className="mb-1.5 text-13-m text-type-1">Opens</p>
          <p className="truncate rounded-full border border-input bg-surface-0 px-4 py-2.5 text-13-r text-type-1">{url}</p>
        </div>
        <div>
          <p className="mb-2 text-13-m text-type-1">Print under the code</p>
          <div className="space-y-2.5">
            {password && <Checkbox checked={share.qr.password} onChange={(v) => setQr('password', v)}>Password ({password})</Checkbox>}
            {pin && <Checkbox checked={share.qr.pin} onChange={(v) => setQr('pin', v)}>Download PIN ({pin})</Checkbox>}
            {!password && !pin && <p className="text-12-r text-type-3">No password or download PIN for {audienceName(aud).toLowerCase()}.</p>}
          </div>
          {password && share.qr.password && <p className="mt-2 text-12-r text-type-3">Anyone who sees the card can get in. Leave the password off for cards in public places.</p>}
        </div>
        <p className="text-12-r-p text-type-3">Put it on a table card, a print order slip or the last slide of a slideshow.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="md" onClick={download} className="max-sm:w-full"><DownloadSimple size={16} /> Download PNG</Button>
          <Button variant="outline" size="md" onClick={() => copy(url, 'Link copied')} className="max-sm:w-full"><CopySimple size={16} /> Copy link</Button>
        </div>
      </div>
    </div>
  )
}
