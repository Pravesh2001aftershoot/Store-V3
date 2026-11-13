import { useState } from 'react'
import { Check, Plus, Trash } from '@phosphor-icons/react'
import { cn } from '../../../lib/utils'
import EditorPane from '../editor/EditorPane'
import FitThumb from '../editor/FitThumb'
import { Label, Section, Segmented, Swatches, Switch, TextField } from '../cover/controls'
import { LIMITS, PLATFORMS, SOCIAL_STYLE, SURFACES, TEMPLATES, isEmail, platform, socialUrl, supports } from './config'
import Footer from './Footer'

const TABS = [
  { id: 'templates', label: 'Templates' },
  { id: 'content', label: 'Content' },
  { id: 'socials', label: 'Socials' },
  { id: 'style', label: 'Style' },
]

/**
 * Footer editor. Same shell as the cover editor (left pane / phone sheet). Non-modal, so the
 * preview beside it can scroll: a footer is often taller than the space left for it.
 */
export default function FooterEditor({ open, onClose, phone, peek, onPeek, gallery, footer, photo, photos, inline = false }) {
  const [tab, setTab] = useState('templates')
  const name = TEMPLATES.find((t) => t.id === footer.config.layout.template)?.name ?? 'Custom'
  return (
    <EditorPane
      open={open}
      onClose={onClose}
      phone={phone}
      peek={peek}
      onPeek={onPeek}
      title="Customize footer"
      subtitle={`Template: ${name}${footer.edited ? ' · edited' : ''}`}
      previewLabel="Preview footer"
      tabs={TABS}
      tab={tab}
      onTab={setTab}
      onReset={footer.reset}
      modal={false}
      inline={inline}
    >
      {tab === 'templates' && <TemplatesTab footer={footer} gallery={gallery} photo={photo} />}
      {tab === 'content' && <ContentTab footer={footer} />}
      {tab === 'socials' && <SocialsTab footer={footer} />}
      {tab === 'style' && <StyleTab footer={footer} photos={photos} />}
    </EditorPane>
  )
}

// ── Templates ───────────────────────────────────────────────────────────────

function TemplatesTab({ footer, gallery, photo }) {
  const { config } = footer
  return (
    <div>
      <p className="mb-4 text-12-r text-type-2">Pick a layout, then fine-tune it under Content, Socials and Style. Your words and links are kept.</p>
      <div className="space-y-4">
        {TEMPLATES.map((t) => {
          const active = config.layout.template === t.id
          return (
            // The thumbnail is a real footer (with its own links), so the card's button is an overlay, not a wrapper.
            <div key={t.id} className="group relative">
              <button
                onClick={() => footer.applyTemplate(t.id)}
                aria-pressed={active}
                aria-label={`${t.name} template`}
                className="absolute inset-0 z-1 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-type-0 focus-visible:ring-offset-2"
              />
              <div className={cn('relative rounded-xl p-0.5 ring-1 transition', active ? 'ring-2 ring-type-0' : 'ring-border group-hover:ring-type-3')}>
                <FitThumb>
                  <Footer gallery={gallery} photo={photo} config={{ ...config, layout: { ...t.layout, photoId: config.layout.photoId }, show: t.show }} />
                </FitThumb>
                {active && (
                  <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-white text-type-0 shadow">
                    <Check size={12} weight="bold" />
                  </span>
                )}
              </div>
              <p className="mt-2 text-13-m text-type-0">{t.name}</p>
              <p className="text-12-r text-type-2">{t.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Content ─────────────────────────────────────────────────────────────────

function Toggle({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <Label>{label}</Label>
        {hint && <p className="-mt-1.5 text-12-r text-type-2">{hint}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  )
}

function ContentTab({ footer }) {
  const { content: C, show, layout: L } = footer.config
  const has = (key) => supports(L, key)
  const text = (key) => ({ value: C[key] ?? '', onChange: (v) => footer.setContent({ [key]: v }), limit: LIMITS[key] })
  const toggle = (key) => ({ enabled: show[key], onToggle: (on) => footer.setShow({ [key]: on }) })
  const flag = (key) => ({ checked: show[key], onChange: (on) => footer.setShow({ [key]: on }) })
  const emailError = C.email?.trim() && !isEmail(C.email) ? 'Enter a full email address, like name@studio.com' : C.email?.trim() ? null : 'Add an email, or turn it off'
  return (
    <div>
      <Section title="Brand">
        {has('logo') && <Toggle label="Show logo" {...flag('logo')} />}
        {has('wordmark') && <TextField label="Wordmark" hint="Your name, drawn edge to edge" {...text('wordmark')} {...toggle('wordmark')} />}
      </Section>

      <Section title="Message">
        <TextField label="Tagline" hint="A line about you or your work" multiline {...text('tagline')} {...toggle('tagline')} />
        {has('cta') && <TextField label="Button" hint="Opens an email to you" {...text('cta')} {...toggle('cta')} />}
      </Section>

      <Section title="Contact" hint="Clients can tap your email to write to you.">
        <TextField label="Email" type="email" placeholder="hello@yourstudio.com" error={emailError} hint="Shown as a link" {...text('email')} {...toggle('email')} />
        <TextField label="Location" placeholder="City, country" hint="Where you’re based" {...text('location')} {...toggle('location')} />
      </Section>

      <Section title="Links & small print">
        <Toggle label="Quick links" hint="View gallery · Print store · Portfolio" {...flag('links')} />
        <Toggle label="Photographer credit" hint="Your name, linked to your portfolio" {...flag('credit')} />
        <Toggle label="Back to top" {...flag('backToTop')} />
      </Section>
    </div>
  )
}

// ── Socials ─────────────────────────────────────────────────────────────────

function SocialsTab({ footer }) {
  const { socials, show, layout: L } = footer.config
  const used = new Set(socials.map((s) => s.platform))
  const free = PLATFORMS.filter((p) => !used.has(p.id))
  const set = (i, value) => footer.setSocials((list) => list.map((s, j) => (j === i ? { ...s, value } : s)))
  const remove = (i) => footer.setSocials((list) => list.filter((_, j) => j !== i))
  const add = (id) => footer.setSocials((list) => [...list, { platform: id, value: '' }])
  const shown = socials.filter((s) => socialUrl(s)).length

  return (
    <div>
      <Section title="Social links">
        <Toggle label="Show socials" hint={`${shown} of ${socials.length} filled in`} checked={show.socials} onChange={(on) => footer.setShow({ socials: on })} />
        <div className={cn('space-y-3', !show.socials && 'pointer-events-none opacity-50')} aria-disabled={!show.socials}>
          <Segmented label="Display as" options={SOCIAL_STYLE} value={L.socialStyle} onChange={(socialStyle) => footer.setLayout({ socialStyle })} />
        </div>
      </Section>

      <Section title="Your profiles" hint="Type a handle or paste a link. Empty ones stay hidden." className={cn(!show.socials && 'opacity-50')}>
        {socials.length === 0 && <p className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-13-r text-type-2">No profiles yet. Add one below.</p>}
        <div className="space-y-2.5">
          {socials.map((s, i) => (
            <SocialRow key={s.platform} entry={s} onChange={(v) => set(i, v)} onRemove={() => remove(i)} />
          ))}
        </div>
      </Section>

      {free.length > 0 && (
        <Section title="Add a profile">
          <div className="flex flex-wrap gap-1.5">
            {free.map((p) => (
              <button
                key={p.id}
                onClick={() => add(p.id)}
                className="flex h-8 items-center gap-1.5 rounded-full bg-surface-2 pl-2.5 pr-3 text-12-m text-type-1 transition hover:bg-[#ececec] hover:text-type-0"
              >
                <Plus size={12} weight="bold" />
                <p.icon size={15} />
                {p.label}
              </button>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function SocialRow({ entry, onChange, onRemove }) {
  const p = platform(entry.platform)
  const url = socialUrl(entry)
  const id = `social-${entry.platform}`
  return (
    <div className="rounded-xl border border-input bg-surface-1 transition focus-within:border-type-0 focus-within:ring-4 focus-within:ring-black/5">
      <div className="flex items-center gap-2 pl-3 pr-1.5">
        <p.icon size={18} className="shrink-0 text-type-1" />
        <label htmlFor={id} className="sr-only">{p.label}</label>
        <input
          id={id}
          value={entry.value}
          maxLength={120}
          onChange={(e) => onChange(e.target.value)}
          placeholder={p.placeholder}
          autoComplete="off"
          spellCheck={false}
          className="h-10 min-w-0 flex-1 bg-transparent text-14-r text-type-0 outline-none placeholder:text-type-3"
        />
        <button onClick={onRemove} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-type-2 transition hover:bg-surface-2 hover:text-type-0" aria-label={`Remove ${p.label}`}>
          <Trash size={15} />
        </button>
      </div>
      <p className="-mt-1 truncate pb-1.5 pl-9.5 pr-3 text-11-r text-type-3">
        {url ? url.replace(/^https?:\/\//, '') : `${p.label} · hidden until filled in`}
      </p>
    </div>
  )
}

// ── Style ───────────────────────────────────────────────────────────────────

const PHOTO_PAGE = 24

function StyleTab({ footer, photos }) {
  const { layout: L } = footer.config
  const [limit, setLimit] = useState(PHOTO_PAGE)
  return (
    <div>
      <Section title="Background">
        <Swatches label="Background" options={SURFACES} value={L.surface} onChange={(surface) => footer.setLayout({ surface })} />
      </Section>

      {L.template === 'card' && (
        <Section title="Card photo" hint="The photo beside your text. Tap one to use it.">
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={() => footer.setLayout({ photoId: null })}
              aria-pressed={!L.photoId}
              className={cn('grid aspect-square place-items-center rounded-lg bg-surface-2 px-1 text-center text-11-m text-type-1 transition', !L.photoId ? 'ring-2 ring-type-0 ring-offset-2' : 'hover:bg-[#ececec]')}
            >
              Cover photo
            </button>
            {photos.slice(0, limit).map((p) => {
              const active = L.photoId === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => footer.setLayout({ photoId: p.id })}
                  aria-pressed={active}
                  aria-label={`Use ${p.name}`}
                  className={cn('relative aspect-square overflow-hidden rounded-lg bg-surface-2 transition', active ? 'ring-2 ring-type-0 ring-offset-2' : 'hover:opacity-85')}
                >
                  <img src={p.thumb ?? p.src} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover" />
                </button>
              )
            })}
          </div>
          {photos.length > limit && (
            <button onClick={() => setLimit((l) => l + PHOTO_PAGE)} className="h-8 w-full rounded-full bg-surface-2 text-13-m text-type-0 transition hover:bg-[#ededed]">
              Show more ({photos.length - limit})
            </button>
          )}
        </Section>
      )}
    </div>
  )
}
