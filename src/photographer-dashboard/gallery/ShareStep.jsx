import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, ArrowUpRight, CopySimple, DownloadSimple, Lightbulb, LockSimple, PaperPlaneTilt,
  CaretDown, EnvelopeSimple, UsersThree, X,
} from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import { cn, plural } from '../../lib/utils'
import { notify } from '../../gallery/lib/actions'
import { Segmented } from '../../gallery/templates/cover/controls'
import { Checkbox, Empty, IconButton, PageHeader, Tag } from '../components/ui'
import { galleryPath } from '../../data/galleries'
import { audiences, rolePlural, roleLabel, useGalleryAccess } from './access'
import {
  LIMITS, allCodes, codesFor, composeEmail, defaultText, expiryFor, formatDate, formatSent, galleryExpiry, linkFor, qrCardPNG,
  qrCards, qrFor, useShareHistory, useShareSettings, variableValues,
} from './share'
import VariableText from './VariableText'

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
 * its passwords, download PINs and expiry; then two ways to send it to everyone at once, one email
 * (wording, details and recipients editable) and one QR card; then the history of emails sent.
 * (Send is simulated in the prototype: it checks there are recipients and toasts.)
 */
export default function ShareStep({ ws }) {
  const { cover, media } = ws
  const [access] = useGalleryAccess()
  const base = `${window.location.origin}${galleryPath(ws.gallery.id)}`
  const [method, setMethod] = useState('email')
  const roles = access.mode === 'roles'

  const accessSummary = roles
    ? `By role · ${access.roles.map(rolePlural).join(', ')} · ${access.singleLink ? 'one link' : 'a link each'}`
    : `Anyone with the link${access.data.anyone.pin.on ? ' · password' : ''}`

  return (
    <div className="mx-auto max-w-[1360px] px-4 pb-40 pt-6 md:px-6 md:pt-10">
      <PageHeader title="Share with your clients" />

      {/* Desktop: left column = cover + links, then the email history; right column = "Send by" across both rows.
          Stacked (under 1024px): links, Send by, then the email history. */}
      <div className="mt-6 grid items-start gap-6 md:mt-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:grid-rows-[auto_1fr]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface-1">
            <div className="relative aspect-[3/2] max-h-[260px] w-full overflow-hidden bg-type-0 lg:max-h-none">
              <img src={media.photo.src} alt="" className="h-full w-full object-cover opacity-90" style={{ objectPosition: `${media.photo.focus.x}% ${media.photo.focus.y}%` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-12-sb uppercase text-white/70">{ws.gallery.date}</p>
                <p className="mt-1 truncate text-20-m">{cover.config.content.title || ws.gallery.client}</p>
              </div>
            </div>
            <AccessOverview access={access} base={base} />
            <div className="flex items-center gap-3 border-t border-border px-4 py-3 md:px-5">
              <LockSimple size={16} className="shrink-0 text-type-2" />
              <p className="min-w-0 flex-1 truncate text-13-r text-type-2">{accessSummary}</p>
              <Link to={`${ws.base}/settings`} className="flex shrink-0 items-center gap-1 text-13-m text-type-2 transition hover:text-type-0">
                Settings <ArrowRight size={12} />
              </Link>
            </div>
        </div>

        {/* Right: one card — "Send by" with Email / QR in its header, the chosen method below. */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface-1 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3.5 md:px-6 md:py-4">
            <h2 className="whitespace-nowrap text-20-m text-type-0 max-sm:text-16-sb">Send by</h2>
            <div className="w-[180px] sm:w-[240px]">
              <Segmented value={method} onChange={setMethod} options={[{ id: 'email', label: 'Email' }, { id: 'qr', label: 'QR code' }]} />
            </div>
          </div>
          <div className="p-4 md:p-6">
            {method === 'email'
              ? <EmailComposer ws={ws} access={access} base={base} />
              : <QrPanel ws={ws} access={access} base={base} />}
          </div>
        </section>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <EmailHistory />
        </div>
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
 * Every way in, per audience: a block per link ("Clients · Expires on 12 Dec 2026", the URL pill with
 * Copy inside it, and a round Open button), with that audience's password and download PIN under it.
 * One shared link shows once, then each role's codes.
 */
function AccessOverview({ access, base }) {
  const roles = access.mode === 'roles'
  const auds = audiences(access)
  const shared = !roles || access.singleLink
  const anyCodes = (a) => codesFor(access, a).password || codesFor(access, a).pin
  return (
    <div className="space-y-5 px-4 py-5 md:px-5">
      {shared && (
        <div>
          <LinkHead title={roles ? 'Gallery link · all roles' : 'Gallery link'} expiry={access.expiry.all} />
          <LinkField url={base} label="Gallery link" />
          {!roles && anyCodes('anyone') && <Codes access={access} aud="anyone" />}
        </div>
      )}
      {roles && auds.map((a) => (
        <div key={a}>
          <LinkHead
            title={rolePlural(a)}
            expiry={shared ? undefined : expiryFor(access, a)}
            tag={access.data[a].approved.on ? `Approved list · ${access.data[a].approved.people.length}` : 'Email sign-up'}
          />
          {!shared && <LinkField url={linkFor(access, a, base)} label={`${roleLabel(a)} link`} />}
          <Codes access={access} aud={a} empty />
        </div>
      ))}
    </div>
  )
}

/** "Clients  Expires on 12 Dec 2026" — `expiry` undefined hides the expiry (the shared link shows it). */
function LinkHead({ title, expiry, tag }) {
  return (
    <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <p className="text-16-sb text-type-0">{title}</p>
      {expiry !== undefined && <p className="text-13-r text-type-2">{expiry ? `Expires on ${formatDate(expiry)}` : 'Never expires'}</p>}
      {tag && <Tag className="self-center">{tag}</Tag>}
    </div>
  )
}

/** The URL pill with Copy inside it, and a round Open button beside it. */
function LinkField({ url, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-10 min-w-0 flex-1 items-center rounded-full bg-surface-2 pl-4 pr-1">
        <span className="min-w-0 flex-1 truncate text-13-r text-type-1">{url}</span>
        <IconButton small label={`Copy ${label.toLowerCase()}`} onClick={() => copy(url, 'Link copied')}><CopySimple size={16} /></IconButton>
      </div>
      <a href={url} target="_blank" rel="noreferrer" aria-label={`Open ${label.toLowerCase()}`} title={`Open ${label.toLowerCase()}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-type-1 transition hover:border-type-3 hover:text-type-0">
        <ArrowUpRight size={16} />
      </a>
    </div>
  )
}

/** An audience's password and download PIN chips; `empty` says "No password" when there's neither. */
function Codes({ access, aud, empty }) {
  const { password, pin } = codesFor(access, aud)
  if (!password && !pin && !empty) return null
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {password ? <Code label="Password" value={password} /> : <span className="text-12-r text-type-3">No password</span>}
      {pin && <Code label="Download PIN" value={pin} />}
    </div>
  )
}

/**
 * Every email sent from this step, newest first: who it went to, when, and the subject. The latest 5
 * show; "Show all" lists the rest. A row opens to list every recipient. Empty until the first send.
 */
function EmailHistory() {
  const { history } = useShareHistory()
  const [all, setAll] = useState(false)
  const [open, setOpen] = useState(null)
  const shown = all ? history : history.slice(0, 5)
  return (
    <section>
      <h2 className="text-16-sb text-type-0">
        Email history {history.length > 0 && <span className="text-type-3">{history.length}</span>}
      </h2>
      {!history.length ? (
        <div className="mt-3">
          <Empty icon={EnvelopeSimple} title="No emails sent yet">
            When you send the gallery by email, who it went to and when shows here.
          </Empty>
        </div>
      ) : (
        <>
          <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-1">
            {shown.map((e) => {
              const expanded = open === e.id
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : e.id)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-surface-2/60"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-type-1"><EnvelopeSimple size={16} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-baseline gap-1.5 text-14-m text-type-0">
                        <span className="truncate">{e.to[0]}</span>
                        {e.to.length > 1 && <span className="shrink-0 text-13-r text-type-2">+{e.to.length - 1} more</span>}
                      </span>
                      <span className="block truncate text-12-r text-type-2">{formatSent(e.at)}</span>
                    </span>
                    <CaretDown size={14} className={cn('shrink-0 text-type-2 transition-transform duration-300', expanded && 'rotate-180')} />
                  </button>
                  {expanded && (
                    <div className="space-y-2 px-4 pb-4 pl-16">
                      <p className="text-12-r text-type-3">Subject</p>
                      <p className="-mt-1.5 break-words text-13-r text-type-1">{e.subject}</p>
                      <p className="text-12-r text-type-3">Sent to {plural(e.to.length, 'person', 'people')}</p>
                      <ul className="-mt-1.5 space-y-0.5">
                        {e.to.map((x) => <li key={x} className="break-all text-13-r text-type-1">{x}</li>)}
                      </ul>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          {history.length > 5 && (
            <button type="button" onClick={() => setAll((v) => !v)} className="mt-3 text-13-m text-type-2 underline-offset-4 transition hover:text-type-0 hover:underline">
              {all ? 'Show fewer' : `Show all ${history.length}`}
            </button>
          )}
        </>
      )}
    </section>
  )
}

/** A recipient in the To field: one address, or a whole approved group. ✕ removes it. */
function Chip({ label, title, onRemove, group }) {
  return (
    <span title={title} className={cn('flex h-8 max-w-full items-center gap-1 rounded-full bg-surface-2 pr-1 text-type-0', group ? 'pl-2.5 text-13-m' : 'pl-3 text-13-r')}>
      {group && <UsersThree size={14} className="shrink-0 text-type-2" />}
      <span className="truncate">{label}</span>
      <button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-type-2 transition hover:bg-surface-1 hover:text-type-0"><X size={12} /></button>
    </span>
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
 * The one email for everyone: recipients (typed, plus each approved group the photographer ticks),
 * subject, message (greeting and sign-off included) and which details to include, beside a live preview, and Send.
 */
function EmailComposer({ ws, access, base }) {
  const [share, setShare] = useShareSettings()
  const { record } = useShareHistory()
  // Roles on an approved list with people on it: each can be added to To as a group (all ticked to start).
  const groups = access.mode === 'roles' ? access.roles.filter((r) => access.data[r].approved.on && access.data[r].approved.people.length) : []
  const [picked, setPicked] = useState(() => groups)
  const added = groups.filter((r) => picked.includes(r))
  const toggleGroup = (r, on) => setPicked((p) => (on ? [...p, r] : p.filter((x) => x !== r)))
  const [typed, setTyped] = useState([])
  const [draftTo, setDraftTo] = useState('')
  const to = useMemo(() => {
    const fromGroups = groups.filter((r) => picked.includes(r)).flatMap((r) => access.data[r].approved.people.map((p) => p.email))
    return [...new Set([...fromGroups, ...typed])]
  }, [groups, picked, access, typed])
  const def = defaultText(ws.gallery)
  const email = useMemo(() => composeEmail({ gallery: ws.gallery, access, base, share, to }), [ws.gallery, access, base, share, to])
  const codes = allCodes(access)
  const single = access.mode !== 'roles'
  const password = codes.some((c) => c.password)
  const pin = codes.some((c) => c.pin)
  const expiry = galleryExpiry(access)
  const values = variableValues({ gallery: ws.gallery, expiry, to })
  const hint = 'Empty uses the text shown. Type { to add a variable.'

  // Prototype: nothing is sent; the toast stands in for the platform sending it.
  const send = () => {
    if (draftTo.trim()) return notify('Add or clear the address you’re typing first')
    if (!to.length) return notify('Add someone to send it to')
    record({ to, subject: email.subject })
    notify(`Email sent to ${plural(to.length, 'person', 'people')}`)
  }

  const set = (patch) => setShare((s) => ({ ...s, ...patch }))
  const include = (k, v) => setShare((s) => ({ ...s, include: { ...s.include, [k]: v } }))
  const edited = share.subject || share.message

  const addTo = () => {
    const parts = draftTo.split(/[,\s;]+/).map((x) => x.trim()).filter(Boolean)
    const valid = (p) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p)
    const bad = parts.filter((p) => !valid(p))
    // Add the good ones; leave the rest in the field to fix.
    setTyped((t) => [...new Set([...t, ...parts.filter(valid)])])
    setDraftTo(bad.join(', '))
    if (bad.length) notify(`“${bad[0]}” isn’t an email address`)
  }

  const options = [
    { k: 'link', label: 'Gallery link', show: true },
    { k: 'password', label: single ? `Password (${codes[0]?.password})` : 'Passwords', show: password },
    { k: 'pin', label: single ? `Download PIN (${codes[0]?.pin})` : 'Download PINs', show: pin },
    { k: 'expiry', label: single || access.singleLink ? `Expiry date (${formatDate(expiry)})` : 'Expiry dates', show: !!expiry },
  ].filter((o) => o.show)

  return (
    <div className="grid gap-6 xl:grid-cols-2 xl:gap-8">
      <div className="min-w-0 space-y-5">
        <div>
          <p className="mb-1.5 text-13-m text-type-1">To</p>
          <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-surface-1 p-1.5 transition focus-within:border-type-0 focus-within:ring-4 focus-within:ring-black/5">
            {added.map((r) => (
              <Chip key={r} label={`Approved ${rolePlural(r).toLowerCase()} · ${access.data[r].approved.people.length}`} title={access.data[r].approved.people.map((p) => p.email).join(', ')} onRemove={() => toggleGroup(r, false)} group />
            ))}
            {typed.map((e) => <Chip key={e} label={e} onRemove={() => setTyped((t) => t.filter((x) => x !== e))} />)}
            <input
              type="email"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
              onKeyDown={(e) => {
                if (['Enter', ',', ' '].includes(e.key) && draftTo.trim()) { e.preventDefault(); addTo() }
                if (e.key === 'Backspace' && !draftTo && typed.length) setTyped((t) => t.slice(0, -1))
              }}
              onBlur={() => draftTo.trim() && addTo()}
              placeholder={to.length ? 'Add another' : 'name@example.com'}
              aria-label="Add a recipient"
              className="h-8 min-w-[140px] flex-1 bg-transparent px-2 text-14-r text-type-0 outline-none placeholder:text-type-3"
            />
          </div>
          <p className="mt-1.5 text-12-r text-type-3">Press Enter or comma after each address.</p>
          {groups.length > 0 && (
            <div className="mt-3 space-y-2.5">
              {groups.map((r) => (
                <Checkbox key={r} checked={picked.includes(r)} onChange={(v) => toggleGroup(r, v)}>
                  Add approved {rolePlural(r).toLowerCase()} ({access.data[r].approved.people.length})
                </Checkbox>
              ))}
            </div>
          )}
        </div>

        <VariableText label="Subject" singleLine value={share.subject} onChange={(v) => set({ subject: v })} placeholder={def.subject} limit={LIMITS.subject} values={values} hint={hint} />

        <VariableText label="Message" value={share.message} onChange={(v) => set({ message: v })} placeholder={def.message} limit={LIMITS.message} rows={5} values={values} hint={hint} />

        <div>
          <p className="mb-2.5 text-12-sb uppercase text-type-2">Include</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2.5">
            {options.map((o) => <Checkbox key={o.k} checked={share.include[o.k]} onChange={(v) => include(o.k, v)}>{o.label}</Checkbox>)}
          </div>
          {!password && !pin && <p className="mt-2 text-12-r text-type-3">No password or download PIN. Add them in Settings.</p>}
          {password && !share.include.password && <p className="mt-2 text-12-r text-amber-700">They’ll need the password to open the gallery. Send it another way.</p>}
          {!single && (password || pin) && share.include.password && <p className="mt-2 text-12-r text-type-3">Everyone gets every role’s details. Untick a detail to send it another way.</p>}
        </div>


        {edited && (
          <button type="button" onClick={() => set({ subject: '', message: '' })} className="block text-13-m text-type-2 underline-offset-4 transition hover:text-type-0 hover:underline">
            Use the default wording
          </button>
        )}

        <Button size="md" onClick={send} className="max-sm:w-full">
          <PaperPlaneTilt size={16} /> Send
        </Button>
      </div>

      <div className="min-w-0">
        <p className="mb-2.5 text-12-sb uppercase text-type-2">Preview</p>
        <div className="rounded-xl border border-border bg-surface-0">
          <dl className="space-y-1 border-b border-border px-4 py-3 text-13-r">
            <div className="flex gap-2"><dt className="w-14 shrink-0 text-type-3">From</dt><dd className="min-w-0 truncate text-type-1">{ws.gallery.photographer}</dd></div>
            <div className="flex gap-2"><dt className="w-14 shrink-0 text-type-3">To</dt><dd className="min-w-0 truncate text-type-1" title={to.join(', ')}>{to.length ? to.join(', ') : <span className="text-type-3">No one yet</span>}</dd></div>
            <div className="flex gap-2"><dt className="w-14 shrink-0 text-type-3">Subject</dt><dd className="min-w-0 text-type-0">{email.subject}</dd></div>
          </dl>
          <p className="whitespace-pre-wrap break-words px-4 py-4 text-14-r-p text-type-1">{email.body}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * The QR cards: one for the gallery link, or with roles and a link per role, one per role for its own
 * link. Each shows as a row (code, role, caption, printed lines, download). What to print under the
 * codes is chosen once for all cards. Each card downloads as a PNG. The tip can be closed (until reload).
 */
function QrPanel({ ws, access, base }) {
  const [share, setShare] = useShareSettings()
  const [tip, setTip] = useState(true)
  const codes = allCodes(access)
  const single = access.mode !== 'roles'
  const pin = codes.some((c) => c.pin)
  const title = ws.cover.config.content.title || ws.gallery.title
  const cards = qrCards(access, base, share.qr)
  const setQr = (k, v) => setShare((s) => ({ ...s, qr: { ...s.qr, [k]: v } }))

  const download = (card) => {
    const a = document.createElement('a')
    a.href = qrCardPNG({ title, tag: card.role && rolePlural(card.role), url: card.url, lines: card.lines })
    a.download = `${ws.gallery.id}${card.role ? `-${card.role}` : ''}-qr.png`
    a.click()
    notify(card.role ? `${rolePlural(card.role)} QR card downloaded` : 'QR card downloaded')
  }

  return (
    <div className="space-y-4">
      {tip && (
        <p className="flex items-start gap-2 rounded-xl bg-surface-2 py-1 pl-3 pr-1 text-13-r-p text-type-2">
          <Lightbulb size={16} className="mt-2 shrink-0 text-type-1" />
          <span className="min-w-0 flex-1 py-1.5"><span className="text-13-m text-type-1">Tip:</span> Put it on a table card, a print order slip or the last slide of a slideshow.</span>
          <IconButton small label="Close tip" onClick={() => setTip(false)}><X size={14} /></IconButton>
        </p>
      )}
      {/* Passwords are always printed; only the download PIN is optional. */}
      {pin && (
        <Checkbox checked={share.qr.pin} onChange={(v) => setQr('pin', v)}>
          Print {single ? `the download PIN (${codes.find((c) => c.pin).pin})` : 'download PINs'} under the code
        </Checkbox>
      )}
      <div className="space-y-4">
        {cards.map((card) => (
          <QrRow
            key={card.key}
            card={card}
            label={card.role ? rolePlural(card.role) : access.mode === 'roles' ? 'All roles' : 'Gallery link'}
            onDownload={() => download(card)}
          />
        ))}
      </div>
    </div>
  )
}

/** A QR card as a row: the code, then the label, "Scan to open the gallery", the printed lines, and Download. */
function QrRow({ card, label, onDownload }) {
  const qr = useMemo(() => qrFor(card.url), [card.url])
  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-surface-1 p-4 md:gap-6 md:p-5">
      <svg viewBox={`-1 -1 ${qr.size + 2} ${qr.size + 2}`} role="img" aria-label={`QR code for ${card.url}`} className="aspect-square w-[104px] shrink-0 sm:w-[160px]" shapeRendering="crispEdges">
        <rect x="-1" y="-1" width={qr.size + 2} height={qr.size + 2} fill="white" />
        <path
          fill="currentColor"
          className="text-type-0"
          d={qr.data.flatMap((row, y) => row.map((on, x) => (on ? `M${x} ${y}h1v1h-1z` : ''))).join('')}
        />
      </svg>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-12-sb uppercase text-type-2">{label}</p>
        <div className="mt-auto flex items-end gap-3 pt-3">
          <div className="min-w-0 flex-1">
            <p className="text-13-r text-type-2">Scan to open the gallery</p>
            {card.lines.map((l) => <p key={l} className="mt-1 break-words text-14-m text-type-0 sm:text-16-m">{l}</p>)}
          </div>
          <IconButton label={`Download ${label.toLowerCase()} QR card`} onClick={onDownload} className="border border-border">
            <DownloadSimple size={18} />
          </IconButton>
        </div>
      </div>
    </div>
  )
}
