import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'

/**
 * Gallery card. On hover (fine pointers), moving across the cover scrubs through a few
 * photos from the gallery, so visitors can preview a shoot without opening it.
 */
export function ProjectCard({ g, eager }) {
  const [frame, setFrame] = useState(0)
  const [hover, setHover] = useState(false)
  const frames = g.previews

  const scrub = (e) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    setFrame(Math.min(frames.length - 1, Math.floor(((e.clientX - r.left) / r.width) * frames.length)))
  }

  return (
    <Link to={`/portfolio/${g.slug}`} className="group block outline-none">
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-lg bg-surface-2 ring-ring ring-offset-2 ring-offset-surface-0 group-focus-visible:ring-2"
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
        onPointerMove={scrub}
        onPointerLeave={() => { setHover(false); setFrame(0) }}
      >
        <img
          src={g.cover.src}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03]"
        />
        {/* Scrub frames mount on first hover only, so a long grid doesn't load every preview. */}
        {hover &&
          frames.slice(1).map((p, i) => (
            <img
              key={p.id}
              src={p.src}
              alt=""
              decoding="async"
              className={cn('absolute inset-0 h-full w-full scale-[1.03] object-cover', frame === i + 1 ? 'opacity-100' : 'opacity-0')}
            />
          ))}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/45 to-transparent p-3 pt-12 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex gap-1">
            {frames.map((p, i) => (
              <span key={p.id} className={cn('h-0.5 w-5 rounded-full transition-colors', i === frame ? 'bg-white' : 'bg-white/40')} />
            ))}
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-type-0">
            <ArrowUpRight size={16} weight="bold" />
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-16-m text-type-0">{g.title}</p>
          <p className="mt-0.5 truncate text-13-r text-type-2">
            {g.genreLabel} · {g.location}
          </p>
        </div>
        <p className="shrink-0 text-13-r tabular-nums text-type-3">{g.count} photos</p>
      </div>
    </Link>
  )
}

/** Compact list row — the faster way to scan dozens of galleries. */
export function ProjectRow({ g }) {
  return (
    <Link
      to={`/portfolio/${g.slug}`}
      className="group -mx-3 grid grid-cols-[56px_1fr_auto] items-center gap-4 rounded-lg px-3 py-3 transition hover:bg-surface-2 md:grid-cols-[72px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_80px_24px] md:gap-6"
    >
      <img src={g.cover.src} alt="" loading="lazy" decoding="async" className="aspect-square w-full rounded-md bg-surface-2 object-cover" />
      <div className="min-w-0">
        <p className="truncate text-16-m text-type-0">{g.title}</p>
        <p className="mt-0.5 truncate text-13-r text-type-2 md:hidden">
          {g.genreLabel} · {g.location}
        </p>
      </div>
      <p className="hidden truncate text-14-r text-type-1 md:block">{g.genreLabel}</p>
      <p className="hidden truncate text-14-r text-type-2 md:block">{g.location}</p>
      <p className="text-right text-13-r tabular-nums text-type-3 md:text-14-r">
        <span className="md:hidden">’{String(g.year).slice(2)}</span>
        <span className="hidden md:inline">{g.count} photos</span>
      </p>
      <ArrowUpRight size={18} className="hidden text-type-3 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-type-0 md:block" />
    </Link>
  )
}
