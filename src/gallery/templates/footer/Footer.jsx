import { Link } from 'react-router-dom'
import { ArrowUp, ArrowUpRight, PencilSimple } from '@phosphor-icons/react'
import { Button, Eyebrow } from '../../../components/ui'
import PhotographerLink from '../../../components/PhotographerLink'
import { cn } from '../../../lib/utils'
import { SURFACES, isEmail, platform, socialUrl } from './config'

// Gallery footer, laid out from `config` (see ./config.js). Six templates, each its own structure,
// all built from the design system: `surface-*` / `type-*` / `border` colours, type tokens, `Button`.
//
// Everything responds to the footer's own width (container queries, `@3xl:` etc.), not the window's,
// so the editor's preview — squeezed beside the pane — shows the layout a client would get at that width.

const YEAR = 2026

/**
 * The Dark background re-maps the colour tokens inside the footer, so templates never branch on it.
 * Values come from the existing palette (type-0, primary-foreground, the primary hover…).
 */
const DARK_TOKENS = {
  '--surface-0': '#181818',
  '--surface-1': '#181818',
  '--surface-2': '#2c2c2c',
  '--type-0': '#fafafa',
  '--type-1': '#e4e4e7',
  '--type-2': '#919191',
  '--type-3': '#71717a',
  '--border': '#2c2c2c',
  '--input': '#474747',
  '--primary': '#fafafa',
  '--primary-foreground': '#181818',
  '--ring': '#fafafa',
}

/** Everything the templates draw, resolved once: empty or invalid pieces come back null. */
function resolve(gallery, config, photo) {
  const { layout: L, show, content: C, socials } = config
  const surface = SURFACES.find((s) => s.id === L.surface) ?? SURFACES[0]
  const text = (key) => (show[key] && C[key]?.trim()) || null
  const email = show.email && isEmail(C.email ?? '') ? C.email.trim() : null
  return {
    L,
    show,
    surface,
    dark: !!surface.dark,
    tagline: text('tagline'),
    email,
    location: text('location'),
    cta: show.cta && C.cta?.trim() ? { label: C.cta.trim(), href: email ? `mailto:${email}` : null } : null,
    wordmark: show.wordmark ? C.wordmark?.trim() || gallery.studio : null,
    socials: show.socials
      ? socials.map((s) => ({ ...s, href: socialUrl(s), meta: platform(s.platform) })).filter((s) => s.href && s.meta)
      : [],
    photo,
  }
}

export default function Footer({ gallery, config, photo, onGallery, onEdit, className }) {
  const d = resolve(gallery, config, photo)
  const Template = TEMPLATES[d.L.template] ?? Simple
  return (
    <footer
      className={cn('@container relative border-t border-border text-type-0', d.surface.className, className)}
      style={d.dark ? DARK_TOKENS : undefined}
    >
      {onEdit && (
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          aria-label="Edit footer"
          className="absolute right-3 top-3 z-10 @max-md:w-8 @max-md:px-0"
        >
          <PencilSimple size={14} /> <span className="@max-md:hidden">Edit footer</span>
        </Button>
      )}
      <Template d={d} gallery={gallery} onGallery={onGallery} />
    </footer>
  )
}

// ── Shared pieces ───────────────────────────────────────────────────────────

const PAD = 'mx-auto w-full max-w-[1800px] px-4 @3xl:px-8'
const LINK = 'text-14-r text-type-1 transition hover:text-type-0'
const LINK_SM = 'text-13-m text-type-1 transition hover:text-type-0'
const SMALL = 'text-12-r text-type-3'

const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

function Logo({ gallery, dark, className }) {
  return <img src={gallery.logo} alt={gallery.studio} draggable={false} className={cn('h-6 w-auto', dark && 'brightness-0 invert', className)} />
}

/** Key–value label: the design system's `11-SB` uppercase `type-3`. */
const Label = ({ children }) => <p className="mb-4 text-11-sb uppercase text-type-3">{children}</p>

/** View gallery / print store / portfolio. */
function NavLinks({ onGallery, className, itemClassName = LINK }) {
  return (
    <ul className={className}>
      <li><button onClick={onGallery} className={cn(itemClassName, 'text-left')}>View gallery</button></li>
      <li><Link to="/store" className={itemClassName}>Print store</Link></li>
      <li><Link to="/portfolio" className={itemClassName}>Portfolio</Link></li>
    </ul>
  )
}

/** Social links: outline icon buttons, or text links stacked (`stack`) or inline. */
function Socials({ list, style, stack, className, itemClassName = LINK }) {
  if (!list.length) return null
  if (style === 'names') {
    return (
      <ul className={cn(stack ? 'flex flex-col gap-2.5' : 'flex flex-wrap gap-x-5 gap-y-2', className)}>
        {list.map((s) => (
          <li key={s.platform}>
            <a href={s.href} target="_blank" rel="noreferrer" className={itemClassName}>{s.meta.label}</a>
          </li>
        ))}
      </ul>
    )
  }
  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {list.map((s) => (
        <li key={s.platform}>
          <Button as="a" href={s.href} target="_blank" rel="noreferrer" variant="outline" size="icon" aria-label={s.meta.label} title={s.meta.label}>
            <s.meta.icon size={16} />
          </Button>
        </li>
      ))}
    </ul>
  )
}

function Credit({ d, gallery }) {
  return (
    <span>
      © {YEAR} {gallery.studio}
      {d.show.credit && <> · Photographed by <PhotographerLink className="text-type-2 hover:text-type-0" /></>}
    </span>
  )
}

function BackToTop({ d, className }) {
  if (!d.show.backToTop) return null
  return (
    <button onClick={toTop} className={cn('inline-flex items-center gap-1 transition hover:text-type-0', className)}>
      Back to top <ArrowUp size={12} weight="bold" />
    </button>
  )
}

/** The last line of most templates: credit on one side, back to top on the other. */
function SmallPrint({ d, gallery, className }) {
  return (
    <div className={cn('flex flex-col gap-2 @xl:flex-row @xl:items-center @xl:justify-between', SMALL, className)}>
      <Credit d={d} gallery={gallery} />
      <BackToTop d={d} className="self-start @xl:self-auto" />
    </div>
  )
}

/** An email, allowed to wrap after the @ (and anywhere only as a last resort) in narrow columns. */
const EmailText = ({ email }) => {
  const at = email.indexOf('@')
  return <>{email.slice(0, at + 1)}<wbr />{email.slice(at + 1)}</>
}
const Email = ({ d, className = LINK }) => d.email && <a href={`mailto:${d.email}`} className={cn('[overflow-wrap:anywhere]', className)}><EmailText email={d.email} /></a>

/** Email and location, stacked. */
function Contact({ d, className }) {
  if (!d.email && !d.location) return null
  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <Email d={d} />
      {d.location && <span className="text-14-r text-type-2">{d.location}</span>}
    </div>
  )
}

/**
 * The studio name drawn edge to edge. An SVG with `textLength` fills any width exactly,
 * so it never wraps or overflows on a phone.
 */
function Wordmark({ text, className }) {
  const w = Math.max(3, text.length) * 58
  return (
    <div className={className}>
      <svg viewBox={`0 0 ${w} 76`} className="block w-full overflow-visible" aria-hidden>
        <text x="0" y="72" textLength={w} lengthAdjust="spacingAndGlyphs" fontSize="100" fontWeight="500" letterSpacing="-3" fill="currentColor">
          {text}
        </text>
      </svg>
    </div>
  )
}

/** Up to three titled columns: Gallery, Contact, Follow. Empty ones are left out. */
function columns(d, onGallery) {
  return [
    d.show.links && { t: 'Gallery', c: <NavLinks onGallery={onGallery} className="flex flex-col gap-2.5" /> },
    (d.email || d.location) && { t: 'Contact', c: <Contact d={d} /> },
    d.socials.length > 0 && { t: 'Follow', c: <Socials list={d.socials} style={d.L.socialStyle} stack /> },
  ].filter(Boolean)
}

// ── Templates ───────────────────────────────────────────────────────────────

/** Centred and quiet: logo, socials, contact and small print. */
function Simple({ d, gallery, onGallery }) {
  const contact = [
    d.email && <Email key="e" d={d} className="text-type-2 transition hover:text-type-0" />,
    d.location && <span key="l">{d.location}</span>,
  ].filter(Boolean)
  return (
    <div className={cn('flex flex-col items-center gap-6 py-12 text-center @3xl:py-16', PAD)}>
      {d.show.logo && <Logo gallery={gallery} dark={d.dark} />}
      {d.tagline && <p className="max-w-sm text-14-r-p text-type-2">{d.tagline}</p>}
      <Socials list={d.socials} style={d.L.socialStyle} className="justify-center" itemClassName={LINK_SM} />
      {contact.length > 0 && (
        <p className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-13-r text-type-2">
          {contact.flatMap((c, i) => (i ? [<span key={`s${i}`} aria-hidden className="text-type-3">·</span>, c] : [c]))}
        </p>
      )}
      {d.show.links && <NavLinks onGallery={onGallery} className="flex flex-wrap justify-center gap-x-6 gap-y-2" itemClassName={LINK_SM} />}
      <div className={cn('flex flex-col items-center gap-2', SMALL)}>
        <Credit d={d} gallery={gallery} />
        <BackToTop d={d} />
      </div>
    </div>
  )
}

/** Tagline beside link columns, a faint wordmark underneath. */
function Statement({ d, gallery, onGallery }) {
  const cols = columns(d, onGallery)
  return (
    <div className="py-16 @3xl:py-24">
      <div className={cn('grid gap-12 @4xl:grid-cols-12', PAD)}>
        <div className="@4xl:col-span-5">
          {d.show.logo && <Logo gallery={gallery} dark={d.dark} className="mb-8" />}
          {d.tagline && <p className="max-w-md text-20-m @3xl:text-24-m">{d.tagline}</p>}
          {d.location && <p className="mt-3 text-14-r text-type-2">{d.location}</p>}
        </div>
        {cols.length > 0 && (
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] @4xl:col-span-7 @4xl:col-start-6">
            {cols.map((c) => (
              <div key={c.t} className={cn('min-w-0', cols.length === 3 && c.t === 'Contact' && '@max-xl:order-last @max-xl:col-span-2')}>
                <Label>{c.t}</Label>
                {/* The location already sits under the tagline. */}
                {c.t === 'Contact' ? <Email d={d} /> : c.c}
              </div>
            ))}
          </div>
        )}
      </div>
      {d.wordmark && <Wordmark text={d.wordmark} className={cn('mt-16 text-border @3xl:mt-24', PAD)} />}
      <SmallPrint d={d} gallery={gallery} className={cn('mt-8', PAD)} />
    </div>
  )
}

/** An invitation to get in touch with a button, then one line of links, socials and small print. */
function Talk({ d, gallery, onGallery }) {
  return (
    <div className={cn('py-16 @3xl:py-24', PAD)}>
      <div className="grid gap-10 @4xl:grid-cols-12 @4xl:items-end">
        <div className="@4xl:col-span-7">
          {d.show.logo && <Logo gallery={gallery} dark={d.dark} className="mb-8" />}
          <Eyebrow>Get in touch</Eyebrow>
          {d.tagline && <p className="mt-4 max-w-xl text-24-m @3xl:text-30-m">{d.tagline}</p>}
        </div>
        {(d.cta || d.email || d.location) && (
          <div className="flex flex-col items-start gap-4 @4xl:col-span-5 @4xl:items-end @4xl:text-right">
            {d.cta && (
              <Button as={d.cta.href ? 'a' : Link} href={d.cta.href ?? undefined} to={d.cta.href ? undefined : '/portfolio'} variant="outline" arrow>
                {d.cta.label}
              </Button>
            )}
            {(d.email || d.location) && (
              <p className="flex flex-col gap-1 text-14-r text-type-2">
                <Email d={d} className="text-type-2 transition hover:text-type-0" />
                {d.location && <span>{d.location}</span>}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="mt-16 flex flex-col gap-6 border-t border-border pt-6 @3xl:mt-20 @5xl:flex-row @5xl:items-center @5xl:justify-between">
        <div className="flex flex-col gap-4 @xl:flex-row @xl:items-center @xl:gap-8">
          {d.show.links && <NavLinks onGallery={onGallery} className="flex flex-wrap gap-x-6 gap-y-2" itemClassName={LINK_SM} />}
          <Socials list={d.socials} style={d.L.socialStyle} itemClassName={LINK_SM} />
        </div>
        <div className={cn('flex flex-col gap-2 @xl:flex-row @xl:items-center @xl:gap-6', SMALL)}>
          <Credit d={d} gallery={gallery} />
          <BackToTop d={d} className="self-start @xl:self-auto" />
        </div>
      </div>
    </div>
  )
}

/** Text and links beside a photo, with a short call to action under it. */
function Card({ d, gallery, onGallery }) {
  return (
    // Phone: text, photo, small print. Wider: text and small print on the left, the photo spanning both rows.
    <div className={cn('grid gap-x-16 gap-y-10 py-16 @3xl:py-24 @4xl:grid-cols-2', PAD)}>
      <div className="min-w-0 @4xl:self-center">
        {d.show.logo && <Logo gallery={gallery} dark={d.dark} className="mb-8" />}
        {d.tagline && <p className="max-w-md text-20-m @3xl:text-24-m">{d.tagline}</p>}
        {d.show.links && <NavLinks onGallery={onGallery} className="mt-8 flex flex-wrap gap-x-6 gap-y-2" />}
        <Contact d={d} className="mt-6" />
        <Socials list={d.socials} style={d.L.socialStyle} className="mt-6" />
      </div>
      <SmallPrint d={d} gallery={gallery} className="order-last self-end @4xl:order-none @4xl:col-start-1 @4xl:row-start-2" />
      {d.photo && (
        <figure className="min-w-0 @4xl:col-start-2 @4xl:row-span-2 @4xl:row-start-1">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface-2 @4xl:aspect-[5/4]">
            <img
              src={d.photo.src}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: d.photo.focus ? `${d.photo.focus.x}% ${d.photo.focus.y}%` : undefined }}
            />
          </div>
          <figcaption className="mt-4 flex flex-col gap-3 @md:flex-row @md:items-center @md:justify-between">
            <div>
              <p className="text-14-m">Loved these photos?</p>
              <p className="text-13-r text-type-2">Work with {gallery.photographer} on your next story.</p>
            </div>
            {d.cta && (
              <Button
                as={d.cta.href ? 'a' : Link}
                href={d.cta.href ?? undefined}
                to={d.cta.href ? undefined : '/portfolio'}
                variant="outline"
                size="sm"
                className="self-start @md:self-auto"
              >
                {d.cta.label}
              </Button>
            )}
          </figcaption>
        </figure>
      )}
    </div>
  )
}

// Phone: two side by side; a third (Contact, the widest) takes a full row underneath.
const COLS = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-2 @md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' }

/** Everything set in a rounded grid of hairlines. */
function Grid({ d, gallery, onGallery }) {
  const cell = cn(d.surface.className, 'p-5 @3xl:p-6')
  const cols = columns(d, onGallery)
  return (
    <div className={cn('py-12 @3xl:py-16', PAD)}>
      <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border @4xl:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div className={cn(cell, 'flex min-h-[200px] flex-col justify-between gap-10 @4xl:row-span-2 @4xl:min-h-[320px]')}>
          {d.show.logo ? <Logo gallery={gallery} dark={d.dark} className="self-start" /> : <span />}
          {d.tagline && <p className="max-w-sm text-20-m @3xl:text-24-m">{d.tagline}</p>}
        </div>
        {cols.length > 0 && (
          <div className={cn('grid gap-px', COLS[cols.length])}>
            {cols.map((c) => (
              <div key={c.t} className={cn(cell, 'min-w-0 @md:min-h-[160px]', cols.length === 3 && c.t === 'Contact' && 'order-last col-span-2 @md:order-none @md:col-span-1')}>
                <Label>{c.t}</Label>
                {c.c}
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-px">
          <div className={cn(cell, 'flex items-end', SMALL)}>
            <Credit d={d} gallery={gallery} />
          </div>
          {d.show.backToTop && (
            <div className={cn(cell, 'flex items-end', SMALL)}>
              <BackToTop d={d} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Tagline and email, columns, then the studio name edge to edge. */
function WordmarkTemplate({ d, gallery, onGallery }) {
  return (
    <div className="pt-16 @3xl:pt-24">
      <div className={cn('grid gap-10 @4xl:grid-cols-12', PAD)}>
        <div className="@4xl:col-span-6">
          {d.show.logo && <Logo gallery={gallery} dark={d.dark} className="mb-8" />}
          {d.tagline && <p className="max-w-md text-20-m @3xl:text-24-m">{d.tagline}</p>}
        </div>
        {d.email && (
          <div className="@4xl:col-span-5 @4xl:col-start-8">
            <Label>Get in touch</Label>
            <a href={`mailto:${d.email}`} className="group flex items-center justify-between gap-4 border-b border-border pb-3 text-16-m transition hover:border-type-0">
              <span className="min-w-0 [overflow-wrap:anywhere]"><EmailText email={d.email} /></span>
              <ArrowUpRight size={16} className="shrink-0 text-type-2 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-type-0" />
            </a>
          </div>
        )}
      </div>
      <div className={cn('mt-14 grid grid-cols-2 gap-x-6 gap-y-10 @3xl:mt-20 @3xl:grid-cols-4', PAD)}>
        {d.show.links && (
          <div>
            <Label>Gallery</Label>
            <NavLinks onGallery={onGallery} className="flex flex-col gap-2.5" />
          </div>
        )}
        {d.socials.length > 0 && (
          <div>
            <Label>Follow</Label>
            <Socials list={d.socials} style={d.L.socialStyle} stack />
          </div>
        )}
        {(d.location || d.show.credit) && (
          <div>
            <Label>Studio</Label>
            <div className="flex flex-col gap-2.5 text-14-r text-type-1">
              {d.location && <span>{d.location}</span>}
              {d.show.credit && <span>Photos by <PhotographerLink className="hover:text-type-0" /></span>}
            </div>
          </div>
        )}
      </div>
      {d.wordmark && <Wordmark text={d.wordmark} className={cn('mt-14 @3xl:mt-20', PAD)} />}
      <div className={cn('flex items-center justify-between gap-4 py-6', SMALL, PAD)}>
        <span>© {YEAR} {gallery.studio}</span>
        <BackToTop d={d} />
      </div>
    </div>
  )
}

const TEMPLATES = { simple: Simple, statement: Statement, talk: Talk, card: Card, grid: Grid, wordmark: WordmarkTemplate }
