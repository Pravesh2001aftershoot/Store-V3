import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CaretLeft, Handbag, Heart, SlidersHorizontal, X } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { ORIENTATION, SIZE, SPACING } from '../lib/settings'
import { useBreakpoint } from '../lib/hooks'

const ease = [0.22, 1, 0.36, 1]

function Segmented({ label, options, value, onChange }) {
  return (
    <div>
      <p className="mb-2 text-11-sb uppercase text-type-2">{label}</p>
      <div className="grid gap-1 rounded-full bg-surface-2 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
            title={o.hint}
            className={cn(
              'relative h-8 rounded-full text-13-m text-type-1 transition hover:text-type-0',
              value === o.id && 'text-type-0'
            )}
          >
            {value === o.id && (
              <motion.span
                layoutId={`seg-${label}`}
                className="absolute inset-0 rounded-full bg-surface-1 shadow-[0_1px_2px_rgba(0,0,0,.08)]"
                transition={{ duration: 0.35, ease }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        ))}
      </div>
      {options.find((o) => o.id === value)?.hint && (
        <p className="mt-1.5 text-12-r text-type-3">{options.find((o) => o.id === value).hint}</p>
      )}
    </div>
  )
}

function LayoutControls({ settings, onChange }) {
  return (
    <>
      <Segmented label="Orientation" options={ORIENTATION} value={settings.orientation} onChange={(v) => onChange('orientation', v)} />
      <Segmented label="Thumbnail size" options={SIZE} value={settings.size} onChange={(v) => onChange('size', v)} />
      <Segmented label="Spacing" options={SPACING} value={settings.spacing} onChange={(v) => onChange('spacing', v)} />
    </>
  )
}

/** Phone: the layout controls slide up from the bottom. Drag down, tap the backdrop or press Esc to close. */
function LayoutSheet({ open, onClose, settings, onChange }) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Grid layout"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => (info.offset.y > 80 || info.velocity.y > 500) && onClose()}
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-surface-1 px-4 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-[0_-20px_50px_-20px_rgba(0,0,0,.25)]"
          >
            <div className="flex justify-center pb-2 pt-3">
              <span className="h-1 w-10 rounded-full bg-border" />
            </div>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-16-sb text-type-0">Grid layout</p>
              <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-type-2 hover:bg-surface-2">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-5">
              <LayoutControls settings={settings} onChange={onChange} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

/** Grid properties: a popover on tablet/desktop, a bottom sheet on phones. */
function LayoutMenu({ settings, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const isPhone = useBreakpoint() === 'mobile'
  useEffect(() => {
    if (!open) return
    // The sheet is portalled outside `ref`, so it handles its own outside taps via the backdrop.
    const close = (e) => !isPhone && !ref.current?.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open, isPhone])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Grid layout"
        className={cn(
          'flex h-10 items-center gap-2 rounded-full px-3 text-14-r text-type-1 transition hover:bg-surface-2 hover:text-type-0',
          open && 'bg-surface-2 text-type-0'
        )}
      >
        <SlidersHorizontal size={18} />
        <span className="hidden md:inline">Layout</span>
      </button>
      {isPhone ? (
        <LayoutSheet open={open} onClose={() => setOpen(false)} settings={settings} onChange={onChange} />
      ) : (
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2, ease }}
              className="absolute right-0 top-12 z-50 w-[min(320px,calc(100vw-32px))] origin-top-right space-y-5 rounded-lg border border-border bg-surface-1 p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,.25)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-14-sb text-type-0">Grid layout</p>
                <button onClick={() => setOpen(false)} aria-label="Close" className="grid h-7 w-7 place-items-center rounded-full text-type-2 hover:bg-surface-2">
                  <X size={14} />
                </button>
              </div>
              <LayoutControls settings={settings} onChange={onChange} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

/** Sticky gallery nav: title, collections, layout, favourites, and the entry to the store. */
export default function NavBar({ navRef, collections, collection, onCollection, gallery, counts, settings, onSetting, favCount, showFavs, onToggleFavs, onClearFavs }) {
  // Keep the active tab in view when it changes (the tab row scrolls sideways on small screens).
  const tabsRef = useRef(null)
  const isPhone = useBreakpoint() === 'mobile'
  useEffect(() => {
    const row = tabsRef.current
    const btn = row?.querySelector('[aria-current="true"]')
    if (!row || !btn) return
    const r = row.getBoundingClientRect()
    const b = btn.getBoundingClientRect()
    const left = row.scrollLeft + (b.left - r.left) - (r.width - b.width) / 2
    row.scrollTo({ left, behavior: 'smooth' })
  }, [collection, showFavs, isPhone])

  const tabs = showFavs ? (
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={onToggleFavs}
          className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-14-r text-type-2 transition hover:bg-surface-2 hover:text-type-0"
        >
          <CaretLeft size={14} /> All photos
        </button>
        <span className="h-4 w-px bg-border" />
        <p className="truncate text-14-m text-type-0">
          Favourites <span className="text-type-3">{favCount}</span>
        </p>
        {favCount > 0 && (
          <button
            onClick={() => window.confirm(`Remove all ${favCount} favourites?`) && onClearFavs()}
            className="shrink-0 rounded-full px-3 py-1.5 text-13-r text-type-2 transition hover:bg-surface-2 hover:text-type-0"
          >
            Clear all
          </button>
        )}
      </div>
    ) : (
      <nav ref={tabsRef} aria-label="Collections" className="no-scrollbar flex h-full min-w-0 gap-6 overflow-x-auto">
        {collections.map((c) => (
          <button
            key={c}
            onClick={() => onCollection(c)}
            aria-current={collection === c && !showFavs}
            className={cn(
              'relative h-full shrink-0 text-14-r text-type-2 transition hover:text-type-0',
              collection === c && !showFavs && 'text-type-0'
            )}
          >
            {collection === c && !showFavs && (
              <motion.span layoutId="collection-underline" className="absolute inset-x-0 bottom-0 h-0.5 bg-type-0" transition={{ duration: 0.4, ease }} />
            )}
            <span className="relative">
              {c}
            </span>
          </button>
        ))}
      </nav>
    )

  return (
    <div ref={navRef} className="sticky top-0 z-40 border-b border-border bg-surface-0">
      <div className="mx-auto flex h-16 max-w-[1800px] items-center gap-3 px-4 md:gap-6 md:px-8">
        <div className={cn('min-w-0', isPhone ? 'flex-1' : 'max-w-[40%] shrink-0 md:max-w-[240px]')}>
          <p className="truncate text-16-sb text-type-0">{gallery.client}</p>
          <Link
            to="/portfolio"
            title={`View ${gallery.photographer}’s portfolio`}
            className="block truncate text-12-r text-type-2 underline-offset-2 transition hover:text-type-0 hover:underline"
          >
            {gallery.photographer}
          </Link>
        </div>

        {!isPhone && <span className="h-6 w-px shrink-0 bg-border" />}

        {!isPhone && <div className="flex h-full min-w-0 flex-1 items-center">{tabs}</div>}

        <div className="flex shrink-0 items-center gap-1">
          <LayoutMenu settings={settings} onChange={onSetting} />
          <button
            onClick={onToggleFavs}
            aria-pressed={showFavs}
            aria-label={showFavs ? 'Show all photos' : 'Show favourites'}
            title={showFavs ? 'Show all photos' : 'Show favourites'}
            className={cn(
              'flex h-10 items-center gap-2 rounded-full px-3 text-14-r text-type-1 transition hover:bg-surface-2 hover:text-type-0',
              showFavs && 'bg-surface-2 text-type-0'
            )}
          >
            <Heart size={18} weight={showFavs || favCount ? 'fill' : 'regular'} className={showFavs || favCount ? 'text-destructive' : undefined} />
            <span className="hidden md:inline">Favourites</span>
            <span className="tabular-nums">{favCount}</span>
          </button>
          <Link
            to="/store"
            className="ml-1 flex h-10 items-center gap-2 rounded-full bg-primary pl-3.5 pr-4 text-14-m text-primary-foreground transition hover:bg-[#2c2c2c]"
          >
            <Handbag size={18} />
            <span>
              Shop<span className="hidden sm:inline"> prints</span>
            </span>
          </Link>
        </div>
      </div>

      {/* Phone: collections get their own row under the bar. */}
      {isPhone && <div className="flex h-11 items-center border-t border-border px-4">{tabs}</div>}
    </div>
  )
}
