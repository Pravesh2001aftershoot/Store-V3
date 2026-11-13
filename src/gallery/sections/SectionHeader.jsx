import { PencilSimple } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { font } from './config'

// The heading above each collection in the grid, drawn from `style` (layout · show · type, shared by
// every collection) and `words` (this collection's eyebrow, title and description). See ./config.js.
//
// Sizes are in container units (`cqw`), so a heading looks the same in the page, the editor's
// preview and the template thumbnails, whatever width each one has.

const TITLE_SIZE = {
  s: 'clamp(24px, 3.4cqw, 44px)',
  m: 'clamp(34px, 5.4cqw, 76px)',
  l: 'clamp(42px, 8cqw, 120px)',
}
const PAD_Y = {
  compact: 'clamp(16px, 2cqw, 28px)',
  regular: 'clamp(20px, 4.2cqw, 64px)',
  airy: 'clamp(32px, 7.5cqw, 120px)',
}
const ITEMS = { left: 'items-start text-left', center: 'items-center text-center', right: 'items-end text-right' }

/** Inline style for the title: typeface, weight, case, and tracking that suits them. */
function titleStyle(type, size) {
  const f = font(type.font)
  const upper = type.case === 'uppercase'
  const tracking = upper ? '0.04em' : type.font === 'sans' ? (type.weight >= 600 ? '-0.035em' : '-0.02em') : type.font === 'mono' ? '-0.04em' : '-0.01em'
  return {
    fontFamily: f.family,
    fontWeight: type.weight,
    textTransform: upper ? 'uppercase' : 'none',
    letterSpacing: tracking,
    fontSize: TITLE_SIZE[size] ?? TITLE_SIZE.m,
    // Fine serifs need a touch more room between lines than Geist.
    lineHeight: type.font === 'garamond' || type.font === 'serif' ? 1.04 : 0.98,
  }
}

const Eyebrow = ({ children, className }) => <p className={cn('text-12-sb uppercase text-type-2', className)}>{children}</p>
const Description = ({ children, className }) =>
  children ? <p className={cn('max-w-[60ch] whitespace-pre-line text-16-r-p text-type-1', className)}>{children}</p> : null
const Rule = ({ className }) => <span aria-hidden className={cn('h-px bg-border', className)} />

export default function SectionHeader({ id, style, words, index = 0, onEdit, className }) {
  const { layout: L, show, type } = style
  const Template = TEMPLATES[L.template] ?? Classic
  const title = (extra) => (
    <h2 className={cn('max-w-full break-words text-type-0', extra)} style={titleStyle(type, L.size)}>
      {words.title}
    </h2>
  )
  return (
    <header id={id} className={cn('@container group/heading relative px-1', className)} style={{ paddingTop: PAD_Y[L.spacing], paddingBottom: PAD_Y[L.spacing] }}>
      <Template L={L} show={show} w={words} title={title} index={index} />
      {onEdit && (
        <button
          onClick={onEdit}
          aria-label={`Edit the ${words.title} heading`}
          title="Edit heading"
          className={cn(
            'absolute top-2 grid h-9 w-9 place-items-center rounded-full border border-input bg-surface-1 text-type-1 shadow-[0_1px_2px_rgba(0,0,0,.06)] transition hover:bg-surface-2 hover:text-type-0',
            // Keep it on the side the text isn't, so it never sits on the title.
            L.template !== 'split' && L.align === 'right' ? 'left-1' : L.template === 'split' && L.flip ? 'left-1' : 'right-1',
            'opacity-0 focus-visible:opacity-100 group-hover/heading:opacity-100 [@media(hover:none)]:opacity-100'
          )}
        >
          <PencilSimple size={15} />
        </button>
      )}
    </header>
  )
}

// ── Templates ───────────────────────────────────────────────────────────────

/** Photo count over a large title, then the note. */
function Classic({ L, show, w, title }) {
  return (
    <div className={cn('flex flex-col', ITEMS[L.align])}>
      {show.divider && <Rule className="mb-[clamp(16px,3cqw,40px)] w-full" />}
      {show.eyebrow && w.eyebrow && <Eyebrow className="mb-[clamp(10px,1.4cqw,18px)]">{w.eyebrow}</Eyebrow>}
      {title()}
      <Description className="mt-[clamp(12px,1.6cqw,20px)]">{w.description}</Description>
    </div>
  )
}

/** Centred title, with fine rules running out to either side. */
function Centered({ show, w, title }) {
  return (
    <div className="flex flex-col items-center text-center">
      {show.eyebrow && w.eyebrow && <Eyebrow className="mb-[clamp(10px,1.4cqw,18px)]">{w.eyebrow}</Eyebrow>}
      <div className="flex w-full items-center gap-[clamp(12px,2.4cqw,40px)]">
        {show.divider && <Rule className="min-w-6 flex-1" />}
        {title('shrink')}
        {show.divider && <Rule className="min-w-6 flex-1" />}
      </div>
      <Description className="mt-[clamp(12px,1.6cqw,20px)]">{w.description}</Description>
    </div>
  )
}

/** Title on one side, the note (and count) on the other. Stacks when narrow. */
function Split({ L, show, w, title }) {
  return (
    <div className={cn(show.divider && 'border-b border-border pb-[clamp(16px,3cqw,40px)]')}>
      <div className={cn('grid items-end gap-x-[clamp(24px,5cqw,96px)] gap-y-4 @2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]', L.flip && '@2xl:[direction:rtl]')}>
        <div className="min-w-0 [direction:ltr]">{title()}</div>
        <div className={cn('flex min-w-0 flex-col gap-3 [direction:ltr]', L.flip ? '@2xl:items-start' : '@2xl:items-end @2xl:text-right')}>
          <Description>{w.description}</Description>
          {show.eyebrow && w.eyebrow && <Eyebrow>{w.eyebrow}</Eyebrow>}
        </div>
      </div>
    </div>
  )
}

/** A chapter number beside the title. */
function Numbered({ L, show, w, title, index }) {
  const center = L.align === 'center'
  const right = L.align === 'right'
  return (
    <div className={cn(show.divider && 'border-t border-border pt-[clamp(16px,3cqw,40px)]')}>
      <div className={cn('flex gap-[clamp(14px,2.6cqw,40px)]', center ? 'flex-col items-center text-center' : 'items-start', right && 'flex-row-reverse text-right')}>
        <span
          aria-hidden
          className="shrink-0 font-light tabular-nums leading-none text-type-3"
          style={{ fontFamily: font('mono').family, fontSize: 'clamp(14px, 1.6cqw, 22px)', paddingTop: center ? 0 : '0.35em' }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className={cn('flex min-w-0 flex-col', ITEMS[L.align])}>
          {title()}
          <Description className="mt-[clamp(12px,1.6cqw,20px)]">{w.description}</Description>
          {show.eyebrow && w.eyebrow && <Eyebrow className="mt-[clamp(10px,1.4cqw,18px)]">{w.eyebrow}</Eyebrow>}
        </div>
      </div>
    </div>
  )
}

/** Title and count on one hairline. */
function Inline({ show, w, title }) {
  return (
    <div>
      <div className="flex items-baseline gap-4">
        {title('min-w-0')}
        <Rule className="hidden min-w-8 flex-1 self-center @md:block" />
        {show.eyebrow && w.eyebrow && <Eyebrow className="ml-auto shrink-0 @md:ml-0">{w.eyebrow}</Eyebrow>}
      </div>
      <Description className="mt-3">{w.description}</Description>
    </div>
  )
}

const TEMPLATES = { classic: Classic, centered: Centered, split: Split, numbered: Numbered, inline: Inline }
