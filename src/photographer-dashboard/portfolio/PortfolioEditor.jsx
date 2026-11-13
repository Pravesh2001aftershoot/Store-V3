import { useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, CircleNotch, Images, MagnifyingGlass, Plus, UploadSimple, X } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { notify } from '../../gallery/lib/actions'
import EditorPane from '../../gallery/templates/editor/EditorPane'
import { Section, Switch, TextField } from '../../gallery/templates/cover/controls'
import { isEmail } from '../../gallery/templates/footer/config'
import { FACTS, LIMITS, allWorkPhotos, usePortfolio } from '../../portfolio/data/config'
import { formatDate } from '../../portfolio/data/portfolio'
import { Chip, Tag } from '../components/ui'

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'intro', label: 'Intro' },
  { id: 'work', label: 'Work' },
  { id: 'contact', label: 'Contact' },
]

/** Which part of /portfolio the preview shows for each tab (see PortfolioPage's preview target). */
export const TARGETS = { profile: 'top', intro: 'top', work: 'work', contact: 'contact' }

/**
 * Portfolio editor, in the gallery's editor shell. Every field saves as you type; empty text falls
 * back to the default (shown as the placeholder).
 */
export default function PortfolioEditor({ tab, onTab, ...pane }) {
  const p = usePortfolio()
  return (
    <EditorPane
      {...pane}
      modal={false}
      title="Customize portfolio"
      subtitle={`${p.galleries.length} galleries shown · ${p.genres.length} categories`}
      previewLabel="Preview portfolio"
      tabs={TABS}
      tab={tab}
      onTab={onTab}
      onReset={() => window.confirm('Reset the whole portfolio to its defaults?') && (p.reset(), notify('Portfolio reset'))}
    >
      {tab === 'profile' && <ProfileTab p={p} />}
      {tab === 'intro' && <IntroTab p={p} />}
      {tab === 'work' && <WorkTab p={p} />}
      {tab === 'contact' && <ContactTab p={p} />}
    </EditorPane>
  )
}

/** A text field bound to one profile field; empty → the default. */
function ProfileField({ p, k, label, multiline, hint, error, type }) {
  const value = p.state.profile[k] ?? String(p.base[k] ?? '')
  return (
    <TextField
      label={label}
      hint={hint}
      value={value}
      onChange={(v) => p.setProfile({ [k]: v })}
      limit={LIMITS[k]}
      multiline={multiline}
      placeholder={String(p.base[k] ?? '')}
      error={error}
      type={type}
    />
  )
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-13-m text-type-0">{label}</p>
        {hint && <p className="text-12-r text-type-2">{hint}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  )
}

// ── Profile ─────────────────────────────────────────────────────────────────

/** Shrinks a portrait upload to fit localStorage alongside everything else (~200KB). */
function readPortrait(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight))
      const c = document.createElement('canvas')
      c.width = Math.round(img.naturalWidth * scale)
      c.height = Math.round(img.naturalHeight * scale)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve({ src: c.toDataURL('image/jpeg', 0.82), w: c.width, h: c.height })
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')) }
    img.src = url
  })
}

function ProfileTab({ p }) {
  const [picking, setPicking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [more, setMore] = useState(24)
  const input = useRef(null)
  const portraits = useMemo(() => allWorkPhotos.filter((x) => x.h > x.w), [])
  const email = p.state.profile.email ?? p.base.email

  const upload = async (file) => {
    if (!file) return
    setBusy(true)
    try {
      p.setPhoto(await readPortrait(file))
      notify('Portrait updated')
    } catch {
      notify('That file isn’t an image we can read')
    }
    setBusy(false)
  }

  return (
    <div>
      <Section title="Portrait" hint="Shown beside your intro.">
        {/* Phones: the portrait sits above full-width buttons. */}
        <div className="flex items-center gap-4 max-sm:flex-col max-sm:items-start">
          <img src={p.profile.photo} alt="" className="h-24 w-20 shrink-0 rounded-lg object-cover ring-1 ring-black/5" />
          <div className="flex min-w-0 flex-wrap gap-2 max-sm:w-full max-sm:flex-col max-sm:[&>*]:h-10 max-sm:[&>*]:w-full max-sm:[&>*]:justify-center">
            <button onClick={() => input.current?.click()} className="flex h-9 items-center gap-1.5 rounded-full bg-surface-2 px-3.5 text-13-m text-type-0 transition hover:bg-[#ececec]">
              {busy ? <CircleNotch size={14} className="animate-spin" /> : <UploadSimple size={14} />} Upload
            </button>
            <button onClick={() => setPicking((v) => !v)} aria-expanded={picking} className="flex h-9 items-center gap-1.5 rounded-full bg-surface-2 px-3.5 text-13-m text-type-0 transition hover:bg-[#ececec]">
              <Images size={14} /> From your work
            </button>
            {p.state.photo && (
              <button onClick={() => p.setPhoto(null)} className="flex h-9 items-center rounded-full px-3 text-13-m text-type-2 transition hover:bg-surface-2 hover:text-type-0">
                Use default
              </button>
            )}
          </div>
          <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { upload(e.target.files[0]); e.target.value = '' }} />
        </div>
        {picking && (
          <div>
            <div className="grid grid-cols-4 gap-1.5">
              {portraits.slice(0, more).map((x) => (
                <button
                  key={x.id}
                  onClick={() => { p.setPhoto({ id: x.id }); setPicking(false) }}
                  aria-label="Use this photo"
                  className={cn('aspect-[4/5] overflow-hidden rounded-md ring-offset-2 transition hover:opacity-90', p.state.photo?.id === x.id && 'ring-2 ring-type-0')}
                >
                  <img src={x.src} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            {more < portraits.length && (
              <button onClick={() => setMore((m) => m + 24)} className="mt-2 w-full rounded-full py-2 text-13-m text-type-1 transition hover:bg-surface-2">
                Show more
              </button>
            )}
          </div>
        )}
      </Section>

      <Section title="About you">
        <ProfileField p={p} k="name" label="Name" hint="Also shown in your galleries" />
        <ProfileField p={p} k="role" label="What you do" />
        <ProfileField p={p} k="location" label="Location" />
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <ProfileField p={p} k="availability" label="Availability" />
          <TextField
            label="Since"
            value={String(p.state.profile.since ?? p.base.since)}
            onChange={(v) => p.setProfile({ since: v.replace(/\D/g, '').slice(0, 4) })}
            limit={6}
            error={(() => {
              const v = p.state.profile.since
              if (v == null || v === '') return null
              const n = parseInt(v, 10)
              return n > 1900 && n <= new Date().getFullYear() ? null : 'A year'
            })()}
          />
        </div>
      </Section>

      <Section title="Contact details" hint="Used by your portfolio and your galleries’ footers.">
        <ProfileField p={p} k="email" label="Email" type="email" error={email && !isEmail(email) ? 'That doesn’t look like an email address' : null} />
        <ProfileField p={p} k="instagram" label="Instagram" />
      </Section>

      <Section title="Specialities" hint="Listed under your greeting.">
        <Disciplines p={p} />
      </Section>
    </div>
  )
}

function Disciplines({ p }) {
  const list = p.profile.disciplines
  const [draft, setDraft] = useState('')
  const set = (next) => p.setProfile({ disciplines: next })
  const add = () => {
    const v = draft.trim().slice(0, LIMITS.discipline)
    if (v && !list.includes(v)) set([...list, v])
    setDraft('')
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {list.map((d) => (
          <span key={d} className="flex h-8 items-center gap-1 rounded-full bg-surface-2 pl-3 pr-1 text-13-m text-type-0">
            {d}
            <button onClick={() => set(list.filter((x) => x !== d))} disabled={list.length < 2} aria-label={`Remove ${d}`} className="grid h-6 w-6 place-items-center rounded-full text-type-2 transition hover:bg-surface-1 hover:text-type-0 disabled:opacity-30">
              <X size={11} weight="bold" />
            </button>
          </span>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); add() }} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={LIMITS.discipline}
          placeholder="Add a speciality"
          aria-label="Add a speciality"
          className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-surface-1 px-3 text-14-r text-type-0 outline-none transition placeholder:text-type-3 focus:border-type-0 focus:ring-4 focus:ring-black/5"
        />
        <button type="submit" disabled={!draft.trim()} className="flex h-10 items-center gap-1 rounded-full bg-primary px-4 text-13-m text-primary-foreground transition disabled:opacity-40">
          <Plus size={14} /> Add
        </button>
      </form>
    </div>
  )
}

// ── Intro ───────────────────────────────────────────────────────────────────

function IntroTab({ p }) {
  const { intro } = p
  return (
    <div>
      <Section title="Greeting">
        <TextField
          label="Headline"
          value={intro.greeting ?? ''}
          onChange={(v) => p.setIntro({ greeting: v })}
          limit={LIMITS.greeting}
          placeholder={`Hello! I’m ${p.profile.firstName}.`}
          hint="Leave empty to use the default"
        />
        <ProfileField p={p} k="bio" label="Bio" multiline />
        <Toggle label="Buttons" hint="View work · Get in touch" checked={intro.buttons} onChange={(v) => p.setIntro({ buttons: v })} />
      </Section>
      <Section title="Facts strip" hint="The row of quick facts under your intro.">
        <Toggle label="Show facts" checked={intro.facts} onChange={(v) => p.setIntro({ facts: v })} />
        <div className={cn('space-y-3 rounded-xl bg-surface-2 p-3 transition', !intro.facts && 'pointer-events-none opacity-50')}>
          {FACTS.map((f) => (
            <Toggle
              key={f.id}
              label={f.label}
              hint={{ availability: p.profile.availability, focus: p.profile.role, location: p.profile.location, experience: `Since ${p.profile.since}` }[f.id]}
              checked={intro.factList[f.id]}
              onChange={(v) => p.setIntro({ factList: { ...intro.factList, [f.id]: v } })}
            />
          ))}
        </div>
      </Section>
    </div>
  )
}

// ── Work ────────────────────────────────────────────────────────────────────

function WorkTab({ p }) {
  const [q, setQ] = useState('')
  const [genre, setGenre] = useState('all')
  const [shown, setShown] = useState(20)
  const [renaming, setRenaming] = useState(null)

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return p.allGalleries.filter((g) => (genre === 'all' || g.genre === genre) && (!t || `${g.title} ${g.location} ${g.year}`.toLowerCase().includes(t)))
  }, [p.allGalleries, q, genre])

  const moveGenre = (id, by) => {
    const order = p.allGenres.map((g) => g.id)
    const i = order.indexOf(id)
    const j = i + by
    if (j < 0 || j >= order.length) return
    ;[order[i], order[j]] = [order[j], order[i]]
    p.setWork({ genreOrder: order })
  }

  return (
    <div>
      <Section title="Section">
        <TextField label="Title" value={p.state.work.title ?? ''} onChange={(v) => p.setWork({ title: v })} limit={LIMITS.workTitle} placeholder="Selected work" />
      </Section>

      <Section title="Categories" hint="Filter tabs above your work, in this order. Hiding one hides its galleries.">
        <ul className="space-y-1.5">
          {p.allGenres.map((g, i) => (
            <li key={g.id} className={cn('flex items-center gap-2 rounded-xl bg-surface-2 p-1.5 pl-3 transition', g.hidden && 'opacity-60')}>
              <input
                value={p.state.work.genreLabels[g.id] ?? g.label}
                onChange={(e) => p.setGenreLabel(g.id, e.target.value.slice(0, LIMITS.genreLabel))}
                aria-label={`${g.label} label`}
                className="h-8 min-w-0 flex-1 rounded-md bg-transparent px-1 text-13-m text-type-0 outline-none transition focus:bg-surface-1 focus:ring-1 focus:ring-input"
              />
              <span className="text-12-r tabular-nums text-type-3">{g.count}</span>
              <button onClick={() => moveGenre(g.id, -1)} disabled={i === 0} aria-label="Move up" className="grid h-7 w-7 place-items-center rounded-full text-type-2 hover:bg-surface-1 disabled:opacity-30"><ArrowUp size={13} /></button>
              <button onClick={() => moveGenre(g.id, 1)} disabled={i === p.allGenres.length - 1} aria-label="Move down" className="grid h-7 w-7 place-items-center rounded-full text-type-2 hover:bg-surface-1 disabled:opacity-30"><ArrowDown size={13} /></button>
              <Switch checked={!g.hidden} onChange={() => p.toggleGenre(g.id)} label={`Show ${g.label}`} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Galleries" hint="Hide a gallery to take it off your portfolio. Tap a title to rename it.">
        <label className="relative flex h-10 items-center">
          <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 text-type-3" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setShown(20) }}
            placeholder="Search galleries"
            aria-label="Search galleries"
            className="h-full w-full rounded-full border border-input bg-surface-1 pl-9 pr-3 text-14-r text-type-0 outline-none transition placeholder:text-type-3 focus:border-type-0"
          />
        </label>
        <div className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5">
          <Chip active={genre === 'all'} onClick={() => { setGenre('all'); setShown(20) }} className="h-8 px-3 text-12-m">All</Chip>
          {p.allGenres.map((g) => (
            <Chip key={g.id} active={genre === g.id} onClick={() => { setGenre(g.id); setShown(20) }} className="h-8 px-3 text-12-m">{g.label}</Chip>
          ))}
        </div>
        <ul className="divide-y divide-border">
          {list.slice(0, shown).map((g) => (
            <li key={g.slug} className="flex items-center gap-3 py-2">
              <img src={g.cover.src} alt="" loading="lazy" className={cn('h-12 w-10 shrink-0 rounded-md object-cover transition', g.hidden && 'opacity-40 grayscale')} />
              <div className="min-w-0 flex-1">
                {renaming === g.slug ? (
                  <input
                    autoFocus
                    defaultValue={g.title}
                    maxLength={LIMITS.galleryTitle}
                    aria-label="Gallery title"
                    onBlur={(e) => { p.setGalleryTitle(g.slug, e.target.value); setRenaming(null) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setRenaming(null) }}
                    className="h-7 w-full rounded-md border border-type-0 bg-surface-1 px-2 text-13-m text-type-0 outline-none"
                  />
                ) : (
                  <button onClick={() => setRenaming(g.slug)} className="block max-w-full truncate text-left text-13-m text-type-0 hover:underline" title="Rename">
                    {g.title}
                  </button>
                )}
                <p className="truncate text-12-r text-type-2">{g.genreLabel} · {formatDate(g.date)} · {g.count} photos</p>
              </div>
              {g.hidden && <Tag>Hidden</Tag>}
              <Switch checked={!p.state.work.hidden.includes(g.slug)} onChange={() => p.toggleGallery(g.slug)} label={`Show ${g.title}`} />
            </li>
          ))}
        </ul>
        {list.length === 0 && <p className="py-6 text-center text-13-r text-type-2">No galleries match.</p>}
        {shown < list.length && (
          <button onClick={() => setShown((n) => n + 20)} className="w-full rounded-full bg-surface-2 py-2.5 text-13-m text-type-0 transition hover:bg-[#ececec]">
            Show more ({list.length - shown})
          </button>
        )}
      </Section>
    </div>
  )
}

// ── Contact ─────────────────────────────────────────────────────────────────

function ContactTab({ p }) {
  const c = p.contact
  return (
    <div>
      <Section title="Closing section">
        <TextField
          label="Heading"
          value={c.heading ?? ''}
          onChange={(v) => p.setContact({ heading: v })}
          limit={LIMITS.heading}
          multiline
          placeholder="Have a day worth remembering? Let’s talk."
          hint="Leave empty to use the default"
        />
        <p className="rounded-xl bg-surface-2 px-3 py-2.5 text-12-r-p text-type-2">
          The main button emails <span className="text-type-0">{p.profile.email}</span> — change it under Profile.
        </p>
      </Section>
      <Section title="Details beside it">
        <Toggle label="Availability" hint={p.profile.availability} checked={c.availability} onChange={(v) => p.setContact({ availability: v })} />
        <Toggle label="Location" hint={p.profile.location} checked={c.location} onChange={(v) => p.setContact({ location: v })} />
        <Toggle label="Instagram" hint={p.profile.instagram} checked={c.social} onChange={(v) => p.setContact({ social: v })} />
      </Section>
      <Section title="Header">
        <Toggle label="Enquire button" hint="Top right of every portfolio page" checked={c.enquire} onChange={(v) => p.setContact({ enquire: v })} />
      </Section>
    </div>
  )
}
