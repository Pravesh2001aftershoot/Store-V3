import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CaretLeft, Handbag, Heart, SlidersHorizontal, X } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { ORIENTATION, SIZE, SPACING } from '../lib/settings'

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

/** Popover with the three grid properties. */
function LayoutMenu({ settings, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

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
            <Segmented label="Orientation" options={ORIENTATION} value={settings.orientation} onChange={(v) => onChange('orientation', v)} />
            <Segmented label="Thumbnail size" options={SIZE} value={settings.size} onChange={(v) => onChange('size', v)} />
            <Segmented label="Spacing" options={SPACING} value={settings.spacing} onChange={(v) => onChange('spacing', v)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Sticky gallery nav: title, collections, layout, favourites, and the entry to the store. */
export default function NavBar({ navRef, collections, collection, onCollection, gallery, counts, settings, onSetting, favCount, showFavs, onToggleFavs, onClearFavs }) {
  // Keep the active tab in view when it changes (the tab row scrolls sideways on small screens).
  const tabsRef = useRef(null)
  useEffect(() => {
    const row = tabsRef.current
    const btn = row?.querySelector('[aria-current="true"]')
    if (!row || !btn) return
    const r = row.getBoundingClientRect()
    const b = btn.getBoundingClientRect()
    const left = row.scrollLeft + (b.left - r.left) - (r.width - b.width) / 2
    row.scrollTo({ left, behavior: 'smooth' })
  }, [collection, showFavs])

  return (
    <div ref={navRef} className="sticky top-0 z-40 border-b border-border bg-surface-0">
      <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between gap-3 px-4 md:px-8">
        <div className="min-w-0">
          <p className="truncate text-16-sb text-type-0">{gallery.client}</p>
          <p className="truncate text-12-r text-type-2">{gallery.photographer}</p>
        </div>

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

      {showFavs ? (
        <div className="mx-auto flex h-[38px] max-w-[1800px] items-center justify-between gap-3 px-4 pb-2 md:px-8">
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
          </div>
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
      <nav ref={tabsRef} aria-label="Collections" className="no-scrollbar mx-auto flex max-w-[1800px] gap-1 overflow-x-auto px-4 pb-2 md:px-8">
        {collections.map((c) => (
          <button
            key={c}
            onClick={() => onCollection(c)}
            aria-current={collection === c && !showFavs}
            className={cn(
              'relative shrink-0 rounded-full px-3 py-1.5 text-14-r text-type-2 transition hover:text-type-0',
              collection === c && !showFavs && 'text-type-0'
            )}
          >
            {collection === c && !showFavs && (
              <motion.span layoutId="collection-pill" className="absolute inset-0 rounded-full bg-surface-2" transition={{ duration: 0.4, ease }} />
            )}
            <span className="relative">
              {c} <span className="text-type-3">{counts[c]}</span>
            </span>
          </button>
        ))}
      </nav>
      )}
    </div>
  )
}
