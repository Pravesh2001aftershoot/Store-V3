import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../../components/ui'
import PhotographerLink from '../../components/PhotographerLink'
import { cn } from '../../lib/utils'
import { SURFACES, shapeRatio } from './config'
import { CENTER } from './photo'

const ease = [0.22, 1, 0.36, 1]

// Composed covers: the photo sits on a solid backdrop instead of filling the screen.
//
// The root is a size container, so everything inside is sized against the cover itself
// (cqw / cqh), never the window: the preview beside the editor and the template thumbnails
// render exactly like the real cover, just smaller.
//
// `still` renders without motion or interactive elements (template thumbnails).

/** Title scale per `titleSize`. */
const TK = { s: 0.75, m: 1, l: 1.3 }

/** A title `base`cqw wide on the cover, capped at its 1280px-wide size, with a floor that still reads as a headline on phones. */
const fs = (base) => `clamp(${(base * 5.6).toFixed(1)}px, ${base.toFixed(2)}cqw, ${(base * 12.8).toFixed(1)}px)`

/** Room for the Edit / Print store buttons that sit over the top of every cover. */
const BAR = 'max(72px, var(--my))'

/** Width for a photo of ratio `r` that's `h`cqh tall, but never wider than `maxW`. */
const framed = (h, r, maxW) => ({ width: `min(${maxW}, ${(h * r).toFixed(2)}cqh)`, aspectRatio: r })

const PAD = 'var(--my) var(--mx)'

export default function Composed({ gallery, slots, config, still, onEnter }) {
  const { layout: L, show, content: C } = config
  const surface = SURFACES.find((s) => s.id === L.surface) ?? SURFACES[0]
  const k = TK[L.titleSize] ?? 1
  const [p0] = slots
  const r = shapeRatio(L.shape, p0)

  const title = (base, className, style) => (
    <Up still={still} as="h1" delay={0.1} className={cn('max-w-full break-words font-light uppercase leading-[0.95]', className)} style={{ fontSize: fs(base * k), ...style }}>
      {C.title || gallery.client}
    </Up>
  )
  const eyebrow = (className) =>
    show.eyebrow && C.eyebrow ? (
      <Up still={still} delay={0.2} className={cn('text-[clamp(12px,1.15cqw,15px)] tracking-[0.04em] opacity-75', className)}>
        {C.eyebrow}
      </Up>
    ) : null
  const subtitle = (className) =>
    show.subtitle && C.subtitle ? (
      <Up still={still} delay={0.28} className={cn('text-[clamp(13px,1.25cqw,16px)] opacity-70', className)}>
        <Subtitle text={C.subtitle} photographer={gallery.photographer} still={still} />
      </Up>
    ) : null
  const logo = (h = 'clamp(18px, 2.4cqw, 30px)') =>
    L.logo !== 'hidden' ? (
      <Up still={still} delay={0.05}>
        <img src={gallery.logo} alt={gallery.studio} draggable={false} className={cn('w-auto opacity-85 brightness-0', surface.dark && 'invert')} style={{ height: h }} />
      </Up>
    ) : null
  const ctas = (align = 'left', className) => (
    <Ctas show={show} C={C} L={L} dark={surface.dark} align={align} still={still} onEnter={onEnter} className={className} />
  )
  const pic = (p, className, style, delay) => <Pic photo={p} className={className} style={style} still={still} delay={delay} />

  let body
  switch (L.composition) {
    case 'banner': {
      const h = { s: 56, m: 70, l: 80 }[L.photoSize]
      const align = L.flip ? 'right' : 'left'
      body = (
        <div className="flex h-full flex-col" style={{ padding: PAD, gap: 'clamp(14px, 2.4cqw, 32px)' }}>
          {pic(p0, 'w-full shrink-0', { height: `${h}%` })}
          <div className={cn('flex min-h-0 flex-1 items-start justify-between gap-6', L.flip && 'flex-row-reverse')}>
            <div className={cn('flex min-w-0 flex-col gap-[clamp(6px,1cqw,14px)]', align === 'right' ? 'items-end text-right' : 'items-start')}>
              {title(3.6)}
              {eyebrow()}
              {subtitle()}
              {ctas(align, 'mt-2')}
            </div>
            <div className="shrink-0 pt-2">{logo('clamp(16px, 2cqw, 26px)')}</div>
          </div>
        </div>
      )
      break
    }

    case 'split': {
      const share = { s: 40, m: 50, l: 62 }[L.photoSize]
      body = (
        <div className={cn('flex h-full flex-col @3xl:flex-row', L.flip && '@3xl:flex-row-reverse')} style={{ '--share': `${share}%` }}>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between gap-6" style={{ padding: PAD }}>
            <div className="flex items-start justify-between gap-4">
              {logo() ?? <span />}
              {eyebrow('text-right')}
            </div>
            <div className="flex flex-col items-start gap-[clamp(8px,1.2cqw,16px)]">
              {title(6.6)}
              {subtitle()}
              {ctas('left', 'mt-2')}
            </div>
          </div>
          {pic(p0, 'order-first h-[var(--share)] w-full shrink-0 @3xl:order-none @3xl:h-full @3xl:w-[var(--share)]')}
        </div>
      )
      break
    }

    case 'frame': {
      const h = { s: 50, m: 64, l: 76 }[L.photoSize]
      const hasCtas = show.primaryCta || show.secondaryCta
      body = (
        <div className="relative h-full">
          <div className="absolute inset-x-0 top-0 flex justify-center" style={{ paddingTop: BAR }}>{logo()}</div>
          <div className="absolute inset-0 grid place-items-center">{pic(p0, '', framed(h, r, '84cqw'))}</div>
          {/* Difference blend keeps the title readable across both the backdrop and the photo. */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-[clamp(10px,3cqh,32px)] text-center">
            {title(4.6, 'text-white mix-blend-difference', { letterSpacing: '0.32em', marginRight: '-0.32em' })}
            {show.eyebrow && C.eyebrow && (
              <Up still={still} delay={0.2} className="text-[clamp(13px,1.6cqw,22px)] tracking-[0.12em] text-white mix-blend-difference">{C.eyebrow}</Up>
            )}
            {subtitle('text-white mix-blend-difference opacity-100')}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex justify-center" style={{ paddingBottom: 'max(16px, calc(var(--my) * 0.6))' }}>
            {hasCtas ? ctas('center') : (
              <Up still={still} delay={0.5}>
                {still ? <span className="block h-[clamp(20px,5cqh,40px)] w-px bg-current opacity-50" /> : (
                  <button onClick={onEnter} aria-label="View gallery" className="block px-3 py-1 opacity-50 transition hover:opacity-100">
                    <span className="block h-[clamp(20px,5cqh,40px)] w-px bg-current" />
                  </button>
                )}
              </Up>
            )}
          </div>
        </div>
      )
      break
    }

    case 'strip': {
      const panel = { s: 38, m: 30, l: 22 }[L.photoSize]
      body = (
        <div className={cn('flex h-full flex-col-reverse @3xl:flex-row', L.flip && '@3xl:flex-row-reverse')} style={{ '--panel': `${panel}%` }}>
          <div className="flex shrink-0 flex-col items-center justify-between gap-5 text-center @3xl:h-full @3xl:w-[var(--panel)]" style={{ padding: PAD }}>
            {logo() ?? <span />}
            <div className="flex min-h-0 flex-col items-center gap-[clamp(10px,2cqh,22px)]">
              {title(6, '@3xl:max-h-full @3xl:text-start @3xl:rotate-180 @3xl:[inline-size:fit-content] @3xl:[writing-mode:vertical-rl]')}
              {eyebrow()}
              {subtitle()}
              {ctas('center')}
            </div>
          </div>
          {pic(p0, 'min-h-0 flex-1')}
        </div>
      )
      break
    }

    case 'triptych': {
      const w = { s: 0.7, m: 0.84, l: 0.96 }[L.photoSize]
      const head = `${(3.6 * k * 1.1).toFixed(2)}cqw`
      // As wide as asked, unless three photos of this shape would then be too tall to fit under the title.
      const rowW = `min(calc((100cqw - 2 * var(--mx)) * ${w}), calc((100cqh - 2 * var(--my) - 6rem - ${head}) * ${(3 * r).toFixed(3)}))`
      body = (
        <div className="flex h-full flex-col items-center justify-center" style={{ padding: PAD }}>
          <div className="flex max-w-full flex-col gap-[clamp(14px,2.4cqw,32px)]" style={{ width: rowW }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col items-start gap-[clamp(6px,1cqw,12px)]">
                {title(3.6)}
                {eyebrow()}
                {subtitle()}
              </div>
              <div className="shrink-0 pt-1">{logo('clamp(16px, 2cqw, 26px)')}</div>
            </div>
            <div className="grid grid-cols-3 gap-[clamp(4px,1cqw,14px)]">
              {slots.slice(0, 3).map((p, i) => <Fragment key={i}>{pic(p, '', { aspectRatio: r }, i * 0.08)}</Fragment>)}
            </div>
            {ctas('left')}
          </div>
        </div>
      )
      break
    }

    case 'corner': {
      const h = { s: 40, m: 55, l: 68 }[L.photoSize]
      const end = L.flip ? 'left' : 'right'
      body = (
        <div className="relative h-full">
          <div className={cn('absolute top-0 flex flex-col gap-[clamp(8px,1.4cqw,16px)]', end === 'right' ? 'right-0 items-end text-right' : 'left-0 items-start')} style={{ padding: `${BAR} var(--mx) var(--my)` }}>
            {pic(p0, '', framed(h, r, 'max(46cqw, min(72cqw, 300px))'))}
            {eyebrow()}
          </div>
          <div className={cn('absolute top-0', end === 'right' ? 'left-0' : 'right-0')} style={{ padding: 'max(20px, var(--my)) var(--mx)' }}>{logo()}</div>
          <div
            className={cn('absolute bottom-0 flex max-w-full flex-col gap-[clamp(8px,1.2cqw,16px)]', end === 'right' ? 'left-0 items-start' : 'right-0 items-end text-right')}
            style={{ padding: PAD }}
          >
            {title(7.4)}
            {subtitle()}
            {ctas(end === 'right' ? 'left' : 'right', 'mt-2')}
          </div>
        </div>
      )
      break
    }

    case 'stacked':
    default: {
      const h = { s: 46, m: 58, l: 68 }[L.photoSize]
      body = (
        <div className="flex h-full flex-col items-center justify-center text-center" style={{ padding: PAD, gap: 'clamp(12px, 3cqh, 28px)' }}>
          <div className="flex flex-col items-center gap-x-[clamp(16px,3cqw,36px)] gap-y-2 @xl:flex-row">
            {title(2.4, 'font-normal', { letterSpacing: '0.26em', marginRight: '-0.26em' })}
            {show.eyebrow && C.eyebrow && (
              <>
                <span className="hidden h-[clamp(28px,3.4cqw,44px)] w-px bg-current opacity-30 @xl:block" />
                {eyebrow('opacity-90 text-[clamp(13px,1.4cqw,18px)]')}
              </>
            )}
          </div>
          {subtitle()}
          {pic(p0, 'shrink-0', framed(h, r, '80cqw'))}
          {ctas('center')}
          {logo('clamp(16px, 2cqw, 26px)')}
        </div>
      )
    }
  }

  return wrap(body)

  function wrap(children) {
    return (
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ containerType: 'size', background: surface.bg, color: surface.ink, '--mx': fluid(L.marginX), '--my': fluid(L.marginY) }}
      >
        {children}
      </div>
    )
  }
}

/** Fades and rises into place on first show. */
function Up({ still, delay = 0, className, style, children, as = 'div' }) {
  const M = motion[as]
  return (
    <M
      initial={still ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease, delay: 0.25 + delay }}
      className={className}
      style={style}
    >
      {children}
    </M>
  )
}

/** Same margin scaling as the full-bleed cover: set for a 1280px cover, shrinking with it. */
export const fluid = (px) => `clamp(${Math.min(16, px)}px, ${(px / 12.8).toFixed(2)}cqw, ${px}px)`

/** A cropped photo. Its focal point (`photo.focus`) stays in view whatever the frame's shape. */
export function Pic({ photo, className, style, still, delay = 0 }) {
  const f = photo.focus ?? CENTER
  return (
    <div className={cn('relative overflow-hidden bg-black/10', className)} style={style}>
      <motion.img
        key={photo.src}
        src={still ? photo.thumb ?? photo.src : photo.src}
        alt=""
        draggable={false}
        initial={still ? false : { scale: 1.06, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease, delay }}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: `${f.x}% ${f.y}%` }}
      />
    </div>
  )
}

function Subtitle({ text, photographer, still }) {
  const i = text.indexOf(photographer)
  if (i === -1 || still) return text
  return (
    <>
      {text.slice(0, i)}
      <PhotographerLink />
      {text.slice(i + photographer.length)}
    </>
  )
}

const JUSTIFY = { left: 'justify-start', center: 'justify-center', right: 'justify-end' }

/** The cover buttons, in the backdrop's colors. Thumbnails get look-alike spans (no nested buttons). */
function Ctas({ show, C, L, dark, align, still, onEnter, className }) {
  const primary = show.primaryCta && C.primaryCta
  const secondary = show.secondaryCta && C.secondaryCta
  if (!primary && !secondary) return null
  const outline = dark
    ? 'border border-white/30 bg-transparent text-white shadow-none hover:bg-white/10'
    : 'border border-black/20 bg-transparent text-[inherit] shadow-none hover:bg-black/5'
  return (
    <motion.div
      initial={still ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease, delay: 0.6 }}
      className={cn('gap-3 @max-xl:w-full', L.ctaLayout === 'stack' ? 'inline-grid @max-xl:grid' : cn('flex flex-wrap', JUSTIFY[align]), className)}
    >
      {primary && (
        <Button as={still ? 'span' : 'button'} variant={dark ? 'light' : 'default'} size={L.ctaSize} onClick={still ? undefined : onEnter} className="@max-xl:flex-1">
          {C.primaryCta}
        </Button>
      )}
      {secondary && (
        <Button as={still ? 'span' : Link} to={still ? undefined : '/store'} size={L.ctaSize} className={cn(outline, '@max-xl:flex-1')} arrow>
          {C.secondaryCta}
        </Button>
      )}
    </motion.div>
  )
}
