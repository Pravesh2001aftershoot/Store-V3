import { Fragment, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Handbag, PencilSimple } from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import PhotographerLink from '../../components/PhotographerLink'
import { cn } from '../../lib/utils'
import { WIDTH } from './config'

const ease = [0.22, 1, 0.36, 1]

// Title sizes step up with the cover's own width (container queries), not the window's,
// so the preview stays true while the editor pane narrows it.
const TITLE = {
  s: 'text-36-sb @xl:text-48-sb',
  m: 'text-48-sb @xl:text-60-sb @5xl:text-72-sb',
  l: 'text-48-sb @xl:text-72-sb @5xl:text-96-sb',
}
const ITEMS = { left: 'items-start', center: 'items-center', right: 'items-end' }
const JUSTIFY = { left: 'justify-start', center: 'justify-center', right: 'justify-end' }
const V_JUSTIFY = { top: 'justify-start', middle: 'justify-center', bottom: 'justify-end' }
const H_ITEMS = { left: 'items-start', center: 'items-center', right: 'items-end' }

/**
 * Margins are set for a full desktop cover (1280px) and shrink with the cover's width,
 * never below 16px (unless set lower than that).
 */
const fluid = (px) => `clamp(${Math.min(16, px)}px, ${(px / 12.8).toFixed(2)}cqw, ${px}px)`

/** Overlay darkens most where the text sits. `strength` 50 matches the original cover. */
function overlay(strength, vertical) {
  const k = strength / 50
  const a = (n) => Math.min(0.92, n * k).toFixed(3)
  if (vertical === 'middle') return `radial-gradient(120% 90% at 50% 50%, rgba(0,0,0,${a(0.45)}), rgba(0,0,0,${a(0.25)}))`
  const [near, far] = [a(0.65), a(0.35)]
  const dir = vertical === 'top' ? 'to top' : 'to bottom'
  return `linear-gradient(${dir}, rgba(0,0,0,${far}), rgba(0,0,0,${a(0.1)}) 45%, rgba(0,0,0,${near}))`
}

/** Renders the subtitle, turning the photographer's name (if it's in there) into the portfolio link. */
function Subtitle({ text, photographer }) {
  const i = text.indexOf(photographer)
  if (i === -1) return text
  return (
    <Fragment>
      {text.slice(0, i)}
      <PhotographerLink className="hover:text-white" />
      {text.slice(i + photographer.length)}
    </Fragment>
  )
}

/**
 * Full-screen gallery cover, laid out from `config` (see ./config.js).
 * `inset` shrinks the visible frame so the editor pane can sit beside (desktop) or below (phone) a true preview.
 */
export default function Cover({ gallery, photo, config, inset = { left: 0, bottom: 0 }, editing, onEnter, onEdit }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const fade = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  const { layout: L, show, content: C } = config
  const [vertical, horizontal] = L.position.split('-')
  const logoInBar = L.logo.startsWith('top-')
  // The store link and edit button share the side the logo isn't on.
  const actionsSide = L.logo === 'top-right' ? 'left' : 'right'
  const hasBar = logoInBar || show.storeLink || !editing
  const maxWidth = WIDTH.find((w) => w.id === L.width)?.px ?? 960
  const ctas = [show.primaryCta && C.primaryCta, show.secondaryCta && C.secondaryCta].filter(Boolean)

  const logo = (className) => (
    <img src={gallery.logo} alt={gallery.studio} className={cn('w-auto brightness-0 invert', className)} draggable={false} />
  )

  const actions = (
    <div className={cn('flex items-center gap-2', actionsSide === 'left' && 'flex-row-reverse')}>
      {!editing && onEdit && (
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-13-m text-white backdrop-blur-md transition hover:bg-white/25"
        >
          <PencilSimple size={15} /> <span className="max-sm:hidden">Edit cover</span><span className="sm:hidden">Edit</span>
        </button>
      )}
      {show.storeLink && (
        <Link
          to="/store"
          className="flex items-center gap-2 rounded-full border border-white/30 px-3.5 py-2 text-13-m text-white backdrop-blur-sm transition hover:bg-white/10"
        >
          <Handbag size={15} /> Print store
        </Link>
      )}
    </div>
  )

  const slot = (side) => {
    if (L.logo === `top-${side}`) return logo('h-7 @3xl:h-8')
    return side === actionsSide ? actions : null
  }

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[520px] overflow-hidden bg-type-0 text-white">
      <div
        className="@container absolute right-0 top-0 overflow-hidden transition-[left,bottom] duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ left: inset.left, bottom: inset.bottom }}
      >
        <motion.img
          key={photo.src}
          src={photo.src}
          alt=""
          style={{ y }}
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: overlay(L.overlay, vertical) }} />

        <div className="absolute inset-0" style={{ '--mx': fluid(L.marginX), '--my': fluid(L.marginY) }}>
          {hasBar && (
            <div className="absolute inset-x-0 top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-5" style={{ paddingInline: 'max(16px, var(--mx))' }}>
              <div className="flex justify-start">{slot('left')}</div>
              <div className="flex justify-center">{slot('center')}</div>
              <div className="flex justify-end">{slot('right')}</div>
            </div>
          )}

          <motion.div
            style={{
              opacity: fade,
              paddingInline: 'var(--mx)',
              paddingBottom: 'var(--my)',
              // Keep top-aligned text clear of the top bar.
              paddingTop: vertical === 'top' && hasBar ? 'calc(var(--my) + 72px)' : vertical === 'middle' && hasBar ? '72px' : 'var(--my)',
            }}
            className={cn('absolute inset-0 flex flex-col', V_JUSTIFY[vertical], H_ITEMS[horizontal])}
          >
            <motion.div
              layout="position"
              transition={{ layout: { duration: 0.5, ease } }}
              className={cn('flex w-full flex-col', ITEMS[L.align])}
              style={{ maxWidth, textAlign: L.align }}
            >
              {L.logo === 'inline' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.2 }} className="mb-6">
                  {logo('h-8 @3xl:h-10')}
                </motion.div>
              )}
              {show.eyebrow && C.eyebrow && (
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, ease, delay: 0.3 }}
                  className="mb-4 text-12-sb uppercase text-white/75"
                >
                  {C.eyebrow}
                </motion.p>
              )}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease, delay: 0.4 }}
                className={cn('max-w-full break-words', TITLE[L.titleSize])}
              >
                {C.title || gallery.client}
              </motion.h1>
              {show.subtitle && C.subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, ease, delay: 0.55 }}
                  className="mt-3 text-16-r text-white/80"
                >
                  <Subtitle text={C.subtitle} photographer={gallery.photographer} />
                </motion.p>
              )}
              {ctas.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, ease, delay: 0.7 }}
                  className={cn('mt-8 gap-3', L.ctaLayout === 'stack' ? 'inline-grid' : cn('flex flex-wrap', JUSTIFY[L.align]))}
                >
                  {show.primaryCta && C.primaryCta && (
                    <Button variant="light" size={L.ctaSize} onClick={onEnter}>
                      {C.primaryCta}
                    </Button>
                  )}
                  {show.secondaryCta && C.secondaryCta && (
                    <Button
                      as={Link}
                      to="/store"
                      size={L.ctaSize}
                      className="border border-white/30 bg-transparent text-white shadow-none hover:bg-white/10"
                      arrow
                    >
                      {C.secondaryCta}
                    </Button>
                  )}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
