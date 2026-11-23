import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowUp, CaretDown, Plus, Star, Trash, X } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { notify } from '../../gallery/lib/actions'
import EditorPane from '../../gallery/templates/editor/EditorPane'
import { Section, Segmented, Switch, TextField } from '../../gallery/templates/cover/controls'
import { LIMITS, PORTFOLIO_COUNTS, SECTIONS, formatPrice, landscapePhotos, newId, portraitPhotos } from '../../website/data/config'
import { formatDate } from '../../portfolio/data/portfolio'
import { Checkbox, PriceInput, Tag, ease } from '../components/ui'

/** The website's parts, as the parts rail and the chips list them. `target` is where the preview scrolls. */
export const PART_META = {
  site: { title: 'Site settings', detail: 'Title, sections, header', target: 'top' },
  hero: { title: 'Hero', detail: 'Headline, photo, button', target: 'top' },
  about: { title: 'About', detail: 'Your story and portrait', target: 'about' },
  portfolio: { title: 'Portfolio', detail: 'A few galleries, then the full portfolio', target: 'portfolio' },
  pricing: { title: 'Pricing', detail: 'Packages and prices', target: 'pricing' },
  faq: { title: 'FAQ', detail: 'Questions clients ask', target: 'faq' },
  contact: { title: 'Contact', detail: 'Enquiry form and details', target: 'contact' },
}

/**
 * One editor for the website, in the gallery's editor shell (EditorPane). `part` picks what it
 * edits: Site settings, or one section. Every field saves as you type; empty text falls back to the
 * default (shown as the placeholder). Each section starts with its "Show on website" switch.
 */
export default function WebsiteEditor({ part, w, onPart, ...pane }) {
  const meta = PART_META[part]
  const section = part !== 'site'
  const subtitle = section
    ? (w.isHidden(part) ? 'Hidden from your website' : subtitles[part]?.(w) ?? meta.detail)
    : `${w.sections.length} of ${SECTIONS.length} sections shown`
  return (
    <EditorPane
      {...pane}
      modal={false}
      title={section ? `Customize ${part === 'faq' ? 'FAQ' : meta.title.toLowerCase()}` : 'Site settings'}
      subtitle={subtitle}
      previewLabel="Preview website"
      tabs={[{ id: part, label: meta.title }]}
      tab={part}
      onTab={() => {}}
      resetLabel={section ? 'Reset section' : 'Reset website'}
      onReset={() => {
        if (section) {
          if (window.confirm(`Reset ${meta.title} to its defaults?`)) { w.resetSection(part); notify(`${meta.title} reset`) }
        } else if (window.confirm('Reset the whole website to its defaults? Every section’s text, packages and questions go back to the samples.')) {
          w.reset(); notify('Website reset')
        }
      }}
    >
      {section && <Visibility w={w} id={part} />}
      {part === 'site' && <SiteEditor w={w} onPart={onPart} />}
      {part === 'hero' && <HeroEditor w={w} />}
      {part === 'about' && <AboutEditor w={w} />}
      {part === 'portfolio' && <PortfolioEditor w={w} />}
      {part === 'pricing' && <PricingEditor w={w} />}
      {part === 'faq' && <FaqEditor w={w} />}
      {part === 'contact' && <ContactEditor w={w} />}
    </EditorPane>
  )
}

const subtitles = {
  hero: (w) => (w.state.hero.layout === 'split' ? 'Split layout' : 'Full-bleed photo'),
  portfolio: (w) => `${w.portfolio.galleries.length} galleries · links to your portfolio`,
  pricing: (w) => `${w.pricing.packages.length} ${w.pricing.packages.length === 1 ? 'package' : 'packages'}`,
  faq: (w) => `${w.faq.items.length} ${w.faq.items.length === 1 ? 'question' : 'questions'}`,
  contact: (w) => (w.state.contact.form ? 'Enquiry form on' : 'Email button only'),
}

// ── Shared bits ─────────────────────────────────────────────────────────────

function Toggle({ label, hint, checked, onChange, disabled }) {
  return (
    <div className={cn('flex items-center justify-between gap-4', disabled && 'opacity-50')}>
      <div className="min-w-0">
        <p className="text-13-m text-type-0">{label}</p>
        {hint && <p className="truncate text-12-r text-type-2">{hint}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} label={label} disabled={disabled} />
    </div>
  )
}

/** The section's on/off switch, first in every section editor. */
function Visibility({ w, id }) {
  const shown = !w.isHidden(id)
  return (
    <div className={cn('mb-4 flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 transition', shown ? 'bg-surface-2' : 'bg-amber-50')}>
      <div className="min-w-0">
        <p className="text-13-m text-type-0">Show on website</p>
        <p className={cn('text-12-r', shown ? 'text-type-2' : 'text-amber-700')}>{shown ? 'Visitors see this section' : 'Hidden — your edits are kept'}</p>
      </div>
      <Switch checked={shown} onChange={() => w.toggleSection(id)} label={`Show ${PART_META[id].title}`} />
    </div>
  )
}

/** A text field bound to one key of a section; empty → the default, shown as the placeholder. */
function Text({ value, onChange, label, limit, placeholder, multiline, hint = 'Leave empty to use the default' }) {
  return <TextField label={label} value={value ?? ''} onChange={onChange} limit={limit} placeholder={placeholder} multiline={multiline} hint={value ? undefined : hint} />
}

const iconBtn = 'grid h-7 w-7 shrink-0 place-items-center rounded-full text-type-2 transition hover:bg-surface-1 hover:text-type-0 disabled:pointer-events-none disabled:opacity-30'

/** Up, down and remove for a row in a list. */
function RowActions({ i, n, onMove, onRemove, label }) {
  return (
    <>
      <button onClick={() => onMove(-1)} disabled={i === 0} aria-label={`Move ${label} up`} className={iconBtn}><ArrowUp size={13} /></button>
      <button onClick={() => onMove(1)} disabled={i === n - 1} aria-label={`Move ${label} down`} className={iconBtn}><ArrowDown size={13} /></button>
      {onRemove && <button onClick={onRemove} aria-label={`Remove ${label}`} className={cn(iconBtn, 'hover:text-destructive')}><Trash size={13} /></button>}
    </>
  )
}

/** A collapsible card for a package or a question: a summary row that opens to its fields. */
function Card({ open, onToggle, title, meta, actions, children }) {
  return (
    <li className="rounded-xl bg-surface-2">
      <div className="flex items-center gap-1 p-1.5 pl-3">
        <button onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left">
          <CaretDown size={12} className={cn('shrink-0 text-type-2 transition-transform', !open && '-rotate-90')} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-13-m text-type-0">{title}</span>
            {meta && <span className="block truncate text-12-r text-type-2">{meta}</span>}
          </span>
        </button>
        {actions}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
            <div className="space-y-3 px-3 pb-3 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

const move = (list, i, by) => {
  const j = i + by
  if (j < 0 || j >= list.length) return list
  const next = [...list]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

/**
 * The photo in use plus "Change photo", which opens a grid of portfolio photos (landscape for the
 * hero, portrait for About). "Use default" goes back to the default photo.
 */
function PhotoPicker({ current, photos, selected, onPick, onDefault, defaultLabel, wide }) {
  const [open, setOpen] = useState(false)
  const [more, setMore] = useState(24)
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 max-sm:flex-col max-sm:items-stretch">
        <img src={current} alt="" className={cn('shrink-0 rounded-lg object-cover ring-1 ring-black/5', wide ? 'aspect-[3/2] w-32 max-sm:w-full' : 'h-24 w-20')} />
        <div className="flex min-w-0 flex-wrap gap-2 max-sm:[&>*]:h-10 max-sm:[&>*]:flex-1 max-sm:[&>*]:justify-center">
          <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex h-9 items-center gap-1.5 rounded-full bg-surface-2 px-3.5 text-13-m text-type-0 transition hover:bg-[#ececec]">
            {open ? 'Close' : 'Change photo'}
          </button>
          {selected && (
            <button onClick={onDefault} className="flex h-9 items-center rounded-full px-3 text-13-m text-type-2 transition hover:bg-surface-2 hover:text-type-0">
              {defaultLabel}
            </button>
          )}
        </div>
      </div>
      {open && (
        <div>
          <div className={cn('grid gap-1.5', wide ? 'grid-cols-3' : 'grid-cols-4')}>
            {photos.slice(0, more).map((x) => (
              <button
                key={x.id}
                onClick={() => { onPick(x); setOpen(false) }}
                aria-label="Use this photo"
                aria-pressed={selected === x.id}
                className={cn('overflow-hidden rounded-md ring-offset-2 transition hover:opacity-90', wide ? 'aspect-[3/2]' : 'aspect-[4/5]', selected === x.id && 'ring-2 ring-type-0')}
              >
                <img src={x.src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          {more < photos.length && (
            <button onClick={() => setMore((m) => m + 24)} className="mt-2 w-full rounded-full py-2 text-13-m text-type-1 transition hover:bg-surface-2">
              Show more
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Site settings ───────────────────────────────────────────────────────────

function SiteEditor({ w, onPart }) {
  const order = ['hero', ...w.state.order, 'contact']
  const movable = w.state.order
  return (
    <div>
      <Section title="Site">
        <Text label="Site title" value={w.state.site.title} onChange={(v) => w.setSite({ title: v })} limit={LIMITS.siteTitle} placeholder={w.fallbacks.siteTitle} hint="Top left of the page. Empty uses your name" />
        <Text label="Footer" value={w.state.site.footer} onChange={(v) => w.setSite({ footer: v })} limit={LIMITS.footer} placeholder={w.fallbacks.footer} />
        <Toggle label="Enquire button" hint="Top right of the page, goes to Contact" checked={w.state.site.enquire} onChange={(v) => w.setSite({ enquire: v })} />
      </Section>

      <Section title="Sections" hint="Switch sections on or off. Hero stays first and Contact last; move the others to change the page order.">
        <ul className="space-y-1.5">
          {order.map((id) => {
            const meta = PART_META[id]
            const k = movable.indexOf(id)
            const hidden = w.isHidden(id)
            return (
              <li key={id} className={cn('flex items-center gap-1 rounded-xl bg-surface-2 p-1.5 pl-3 transition', hidden && 'opacity-60')}>
                <button onClick={() => onPart(id)} className="min-w-0 flex-1 py-1 text-left" title={`Edit ${meta.title}`}>
                  <span className="block truncate text-13-m text-type-0 hover:underline">{meta.title}</span>
                  <span className="block truncate text-12-r text-type-2">{hidden ? 'Hidden' : meta.detail}</span>
                </button>
                {k >= 0 ? (
                  <RowActions i={k} n={movable.length} label={meta.title} onMove={(by) => w.moveSection(id, by)} />
                ) : (
                  <span className="w-14 shrink-0 text-center text-11-m text-type-3">{id === 'hero' ? 'First' : 'Last'}</span>
                )}
                <span className="ml-1"><Switch checked={!hidden} onChange={() => w.toggleSection(id)} label={`Show ${meta.title}`} /></span>
              </li>
            )
          })}
        </ul>
      </Section>

      <p className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-12-r-p text-type-2">
        Your name, email, location and Instagram come from your profile — change them in{' '}
        <Link to="/dashboard/portfolio" className="text-type-0 underline underline-offset-2">Portfolio</Link>.
      </p>
    </div>
  )
}

// ── Hero ────────────────────────────────────────────────────────────────────

const HERO_LAYOUTS = [
  { id: 'full', label: 'Full-bleed', hint: 'Photo fills the screen, text over it' },
  { id: 'split', label: 'Split', hint: 'Text beside the photo' },
]

function HeroEditor({ w }) {
  const s = w.state.hero
  return (
    <div>
      <Section title="Layout">
        <div className="grid grid-cols-2 gap-2">
          {HERO_LAYOUTS.map((o) => (
            <button
              key={o.id}
              onClick={() => w.setHero({ layout: o.id })}
              aria-pressed={s.layout === o.id}
              className={cn('rounded-xl p-2 text-left ring-1 transition', s.layout === o.id ? 'ring-2 ring-type-0' : 'ring-border hover:ring-type-3')}
            >
              <HeroSketch kind={o.id} />
              <p className="mt-2 text-13-m text-type-0">{o.label}</p>
              <p className="text-12-r text-type-2">{o.hint}</p>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Text">
        <Text label="Headline" value={s.headline} onChange={(v) => w.setHero({ headline: v })} limit={LIMITS.headline} placeholder={w.fallbacks.headline} />
        <Text label="Subline" value={s.subline} onChange={(v) => w.setHero({ subline: v })} limit={LIMITS.subline} placeholder={w.fallbacks.subline} multiline />
        <TextField
          label="Button"
          value={s.ctaLabel}
          onChange={(v) => w.setHero({ ctaLabel: v })}
          limit={LIMITS.cta}
          placeholder={w.fallbacks.ctaLabel}
          enabled={s.cta}
          onToggle={(v) => w.setHero({ cta: v })}
          hint="Goes to your Contact section"
        />
      </Section>
      <Section title="Photo" hint="From your portfolio.">
        <PhotoPicker
          wide
          current={w.hero.photo.src}
          photos={landscapePhotos}
          selected={s.photo?.id}
          onPick={(x) => w.setHero({ photo: { id: x.id } })}
          onDefault={() => w.setHero({ photo: null })}
          defaultLabel="Use newest gallery"
        />
      </Section>
    </div>
  )
}

function HeroSketch({ kind }) {
  return (
    <div className="flex h-20 gap-1.5 overflow-hidden rounded-lg bg-surface-2 p-1.5">
      {kind === 'full' ? (
        <div className="relative flex-1 rounded-[3px] bg-type-3/50">
          <span className="absolute bottom-2.5 left-2 h-1.5 w-12 rounded-full bg-white" />
          <span className="absolute bottom-1.5 left-2 h-1 w-8 rounded-full bg-white/70" />
        </div>
      ) : (
        <>
          <div className="flex flex-1 flex-col justify-center gap-1 pl-1">
            <span className="h-1.5 w-10 rounded-full bg-type-3/70" />
            <span className="h-1.5 w-8 rounded-full bg-type-3/70" />
            <span className="h-1 w-6 rounded-full bg-type-3/40" />
          </div>
          <div className="flex-1 rounded-[3px] bg-type-3/50" />
        </>
      )}
    </div>
  )
}

// ── About ───────────────────────────────────────────────────────────────────

function AboutEditor({ w }) {
  const s = w.state.about
  return (
    <div>
      <Section title="Text">
        <Text label="Heading" value={s.heading} onChange={(v) => w.setAbout({ heading: v })} limit={LIMITS.heading} placeholder={w.fallbacks.aboutHeading} />
        <Text label="Your story" value={s.body} onChange={(v) => w.setAbout({ body: v })} limit={LIMITS.body} placeholder={w.fallbacks.aboutBody} multiline hint="Empty uses your portfolio bio" />
      </Section>
      <Section title="Photo">
        <PhotoPicker
          current={w.about.photo}
          photos={portraitPhotos}
          selected={s.photo?.id}
          onPick={(x) => w.setAbout({ photo: { id: x.id } })}
          onDefault={() => w.setAbout({ photo: null })}
          defaultLabel="Use my portrait"
        />
      </Section>
      <Section title="Details">
        <Toggle label="Quick facts" hint={`${w.profile.location} · since ${w.profile.since} · ${w.profile.availability}`} checked={s.facts} onChange={(v) => w.setAbout({ facts: v })} />
      </Section>
    </div>
  )
}

// ── Portfolio ───────────────────────────────────────────────────────────────

function PortfolioEditor({ w }) {
  const s = w.state.portfolio
  const [shown, setShown] = useState(12)
  const all = w.pf.galleries
  const featured = s.featured.filter((slug) => all.some((g) => g.slug === slug))
  const full = featured.length >= s.count
  const toggle = (slug) => w.setPortfolio((p) => ({ featured: p.featured.includes(slug) ? p.featured.filter((x) => x !== slug) : [...p.featured, slug] }))
  return (
    <div>
      <Section title="Text">
        <Text label="Heading" value={s.heading} onChange={(v) => w.setPortfolio({ heading: v })} limit={LIMITS.heading} placeholder={w.fallbacks.portfolioHeading} />
        <Text label="Intro" value={s.intro} onChange={(v) => w.setPortfolio({ intro: v })} limit={LIMITS.intro} placeholder={w.fallbacks.portfolioIntro} multiline />
        <Text label="Button" value={s.button} onChange={(v) => w.setPortfolio({ button: v })} limit={LIMITS.button} placeholder={w.fallbacks.portfolioButton} hint="Opens your full portfolio" />
      </Section>
      <Section title="Galleries shown">
        <Segmented options={PORTFOLIO_COUNTS.map((n) => ({ id: n, label: `${n} galleries` }))} value={s.count} onChange={(n) => w.setPortfolio((p) => ({ count: n, featured: p.featured.slice(0, n) }))} />
      </Section>
      <Section title="Featured" hint={featured.length ? `${featured.length} of ${s.count} picked, shown in the order you pick them.` : `Pick up to ${s.count}. With none picked, your newest galleries are shown.`}>
        {featured.length > 0 && (
          <button onClick={() => w.setPortfolio({ featured: [] })} className="flex h-8 items-center gap-1 rounded-full bg-surface-2 px-3 text-12-m text-type-1 transition hover:text-type-0">
            <X size={11} weight="bold" /> Clear picks
          </button>
        )}
        <ul className="divide-y divide-border">
          {all.slice(0, shown).map((g) => {
            const on = featured.includes(g.slug)
            return (
              <li key={g.slug} className={cn('flex items-center gap-3 py-2 transition', !on && full && 'opacity-50')}>
                <img src={g.cover.src} alt="" loading="lazy" className="h-12 w-10 shrink-0 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-13-m text-type-0">{g.title}</p>
                  <p className="truncate text-12-r text-type-2">{g.genreLabel} · {formatDate(g.date)}</p>
                </div>
                {on && <Tag tone="dark">{featured.indexOf(g.slug) + 1}</Tag>}
                <Checkbox checked={on} onChange={() => (on || !full ? toggle(g.slug) : notify(`Up to ${s.count} galleries — untick one first`))}>
                  <span className="sr-only">Feature {g.title}</span>
                </Checkbox>
              </li>
            )
          })}
        </ul>
        {shown < all.length && (
          <button onClick={() => setShown((n) => n + 12)} className="w-full rounded-full bg-surface-2 py-2.5 text-13-m text-type-0 transition hover:bg-[#ececec]">
            Show more ({all.length - shown})
          </button>
        )}
        <p className="rounded-xl bg-surface-2 px-3 py-2.5 text-12-r-p text-type-2">
          Only galleries shown on your portfolio are listed. Hide or rename them in{' '}
          <Link to="/dashboard/portfolio" className="text-type-0 underline underline-offset-2">Portfolio</Link>.
        </p>
      </Section>
    </div>
  )
}

// ── Pricing ─────────────────────────────────────────────────────────────────

const CURRENCIES = ['$', '€', '£'].map((c) => ({ id: c, label: c }))

function PricingEditor({ w }) {
  const s = w.state.pricing
  const [open, setOpen] = useState(null)
  const set = (packages) => w.setPricing({ packages })
  const update = (id, patch) => w.setPricing((p) => ({
    packages: p.packages.map((x) => (x.id === id ? { ...x, ...patch } : patch.featured ? { ...x, featured: false } : x)),
  }))
  const add = () => {
    const id = newId('pkg')
    set([...s.packages, { id, name: `Package ${s.packages.length + 1}`, price: 0, unit: '', description: '', features: [], featured: false }])
    setOpen(id)
  }
  const remove = (i) => {
    const before = s.packages
    const removed = before[i]
    set(before.filter((_, k) => k !== i))
    notify(`“${removed.name || 'Package'}” removed`, { label: 'Undo', onClick: () => w.setPricing({ packages: before }) })
  }
  return (
    <div>
      <Section title="Text">
        <Text label="Heading" value={s.heading} onChange={(v) => w.setPricing({ heading: v })} limit={LIMITS.heading} placeholder={w.fallbacks.pricingHeading} />
        <Text label="Intro" value={s.intro} onChange={(v) => w.setPricing({ intro: v })} limit={LIMITS.intro} placeholder={w.fallbacks.pricingIntro} multiline />
      </Section>
      <Section title="Packages" hint={`Up to ${LIMITS.packages}. A package without a name isn’t shown.`}>
        <Segmented label="Currency" options={CURRENCIES} value={s.currency} onChange={(c) => w.setPricing({ currency: c })} />
        {s.packages.length === 0 && (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-13-r text-type-2">No packages yet — the Pricing section is hidden until you add one.</p>
        )}
        <ul className="space-y-1.5">
          {s.packages.map((p, i) => (
            <Card
              key={p.id}
              open={open === p.id}
              onToggle={() => setOpen(open === p.id ? null : p.id)}
              title={<span className="flex items-center gap-1.5">{p.name || 'Untitled package'}{p.featured && <Star size={12} weight="fill" className="text-type-0" />}</span>}
              meta={`${formatPrice(p.price, s.currency)}${p.unit ? ` ${p.unit}` : ''} · ${p.features.filter((f) => f.trim()).length} inclusions`}
              actions={<RowActions i={i} n={s.packages.length} label={p.name || 'package'} onMove={(by) => set(move(s.packages, i, by))} onRemove={() => remove(i)} />}
            >
              <TextField label="Name" value={p.name} onChange={(v) => update(p.id, { name: v })} limit={LIMITS.packageName} />
              <div className="flex items-start gap-3">
                <div>
                  <p className="mb-1.5 text-13-m text-type-0">Price</p>
                  <PriceInput value={p.price} onChange={(v) => update(p.id, { price: v ?? 0 })} prefix={s.currency} label={`${p.name} price`} className="h-10 w-[120px] bg-surface-1" />
                </div>
                <div className="min-w-0 flex-1">
                  <TextField label="Per" value={p.unit} onChange={(v) => update(p.id, { unit: v })} limit={LIMITS.unit} placeholder="per wedding" />
                </div>
              </div>
              <TextField label="Description" value={p.description} onChange={(v) => update(p.id, { description: v })} limit={LIMITS.packageDesc} multiline />
              <Features list={p.features} onChange={(features) => update(p.id, { features })} />
              <Toggle label="Most popular" hint="Highlighted; only one package can be" checked={p.featured} onChange={(v) => update(p.id, { featured: v })} />
            </Card>
          ))}
        </ul>
        {s.packages.length < LIMITS.packages && (
          <button onClick={add} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-surface-2 text-13-m text-type-0 transition hover:bg-[#ececec]">
            <Plus size={14} /> Add package
          </button>
        )}
      </Section>
      <Section title="Small print">
        <Text label="Note under the packages" value={s.note} onChange={(v) => w.setPricing({ note: v })} limit={LIMITS.note} placeholder={w.fallbacks.pricingNote} multiline />
      </Section>
    </div>
  )
}

/** A package's inclusions: one line each, with remove and an Add field. */
function Features({ list, onChange }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim().slice(0, LIMITS.feature)
    if (v) onChange([...list.filter((f) => f.trim()), v])
    setDraft('')
  }
  return (
    <div>
      <p className="mb-1.5 text-13-m text-type-0">What’s included</p>
      <ul className="space-y-1">
        {list.map((f, i) => (
          <li key={i} className="flex items-center gap-1 rounded-lg bg-surface-1 pl-3 pr-1">
            <input
              value={f}
              onChange={(e) => onChange(list.map((x, k) => (k === i ? e.target.value.slice(0, LIMITS.feature) : x)))}
              onBlur={() => !f.trim() && onChange(list.filter((_, k) => k !== i))}
              placeholder="Inclusion"
              aria-label={`Inclusion ${i + 1}`}
              className="h-9 min-w-0 flex-1 bg-transparent text-13-r text-type-0 outline-none"
            />
            <button onClick={() => onChange(list.filter((_, k) => k !== i))} aria-label={`Remove ${f}`} className={iconBtn}><X size={11} weight="bold" /></button>
          </li>
        ))}
      </ul>
      {list.filter((f) => f.trim()).length < LIMITS.features && (
        <form onSubmit={(e) => { e.preventDefault(); add() }} className={cn('flex gap-2', list.length > 0 && 'mt-2')}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={LIMITS.feature}
            placeholder="Add an inclusion"
            aria-label="Add an inclusion"
            className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-surface-1 px-3 text-13-r text-type-0 outline-none transition placeholder:text-type-3 focus:border-type-0 focus:ring-4 focus:ring-black/5"
          />
          <button type="submit" disabled={!draft.trim()} className="flex h-9 items-center gap-1 rounded-full bg-primary px-3.5 text-13-m text-primary-foreground transition disabled:opacity-40">
            <Plus size={13} /> Add
          </button>
        </form>
      )}
    </div>
  )
}

// ── FAQ ─────────────────────────────────────────────────────────────────────

function FaqEditor({ w }) {
  const s = w.state.faq
  const [open, setOpen] = useState(null)
  const set = (items) => w.setFaq({ items })
  const update = (id, patch) => w.setFaq((f) => ({ items: f.items.map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
  const add = () => {
    const id = newId('faq')
    set([...s.items, { id, q: '', a: '' }])
    setOpen(id)
  }
  const remove = (i) => {
    const before = s.items
    set(before.filter((_, k) => k !== i))
    notify('Question removed', { label: 'Undo', onClick: () => w.setFaq({ items: before }) })
  }
  return (
    <div>
      <Section title="Text">
        <Text label="Heading" value={s.heading} onChange={(v) => w.setFaq({ heading: v })} limit={LIMITS.heading} placeholder={w.fallbacks.faqHeading} />
      </Section>
      <Section title="Questions" hint={`Up to ${LIMITS.faqs}. The first one starts open. A question needs an answer to be shown.`}>
        {s.items.length === 0 && (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-13-r text-type-2">No questions yet — the FAQ section is hidden until you add one.</p>
        )}
        <ul className="space-y-1.5">
          {s.items.map((x, i) => {
            const incomplete = !x.q.trim() || !x.a.trim()
            return (
              <Card
                key={x.id}
                open={open === x.id}
                onToggle={() => setOpen(open === x.id ? null : x.id)}
                title={x.q || 'New question'}
                meta={incomplete ? <span className="text-amber-700">Not shown — {x.q.trim() ? 'add an answer' : 'add a question'}</span> : x.a}
                actions={<RowActions i={i} n={s.items.length} label="question" onMove={(by) => set(move(s.items, i, by))} onRemove={() => remove(i)} />}
              >
                <TextField label="Question" value={x.q} onChange={(v) => update(x.id, { q: v })} limit={LIMITS.question} />
                <TextField label="Answer" value={x.a} onChange={(v) => update(x.id, { a: v })} limit={LIMITS.answer} multiline />
              </Card>
            )
          })}
        </ul>
        {s.items.length < LIMITS.faqs && (
          <button onClick={add} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-surface-2 text-13-m text-type-0 transition hover:bg-[#ececec]">
            <Plus size={14} /> Add question
          </button>
        )}
      </Section>
    </div>
  )
}

// ── Contact ─────────────────────────────────────────────────────────────────

function ContactEditor({ w }) {
  const s = w.state.contact
  const p = w.profile
  return (
    <div>
      <Section title="Text">
        <Text label="Heading" value={s.heading} onChange={(v) => w.setContact({ heading: v })} limit={LIMITS.heading} placeholder={w.fallbacks.contactHeading} multiline />
        <Text label="Intro" value={s.body} onChange={(v) => w.setContact({ body: v })} limit={LIMITS.intro} placeholder={w.fallbacks.contactBody} multiline />
        <Text label="Button" value={s.button} onChange={(v) => w.setContact({ button: v })} limit={LIMITS.button} placeholder={w.fallbacks.contactButton} hint={s.form ? 'Sends the form' : 'Opens an email to you'} />
      </Section>
      <Section title="Enquiry form" hint={`Enquiries go to ${p.email}.`}>
        <Toggle label="Show the form" hint="Name, email and message. Off: an email button instead" checked={s.form} onChange={(v) => w.setContact({ form: v })} />
        <Toggle label="Ask for the event date" hint="Optional for visitors" checked={s.date} disabled={!s.form} onChange={(v) => w.setContact({ date: v })} />
      </Section>
      <Section title="Details beside it">
        <Toggle label="Email" hint={p.email} checked={s.email} onChange={(v) => w.setContact({ email: v })} />
        <Toggle label="Location" hint={p.location} checked={s.location} onChange={(v) => w.setContact({ location: v })} />
        <Toggle label="Instagram" hint={p.instagram} checked={s.social} onChange={(v) => w.setContact({ social: v })} />
      </Section>
    </div>
  )
}
