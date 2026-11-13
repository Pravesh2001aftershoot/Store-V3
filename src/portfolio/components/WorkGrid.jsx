import { useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ListBullets, MagnifyingGlass, SquaresFour, X } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { Select } from '../../components/ui'
import { useInfinite } from '../../gallery/lib/hooks'
import { galleries, genres } from '../data/portfolio'
import { ProjectCard, ProjectRow } from './ProjectCard'

const ease = [0.22, 1, 0.36, 1]

const SORTS = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'largest', label: 'Most photos' },
]
const DEFAULTS = { genre: 'all', sort: 'newest', view: 'grid', q: '' }
const BATCH = { grid: 12, list: 30 }

/** Filter state lives in the URL, so a filtered portfolio can be shared by link. Defaults are left out. */
function useWorkParams() {
  const [params, setParams] = useSearchParams()
  const get = (k) => params.get(k) ?? DEFAULTS[k]
  const set = (k, v) =>
    setParams(
      (p) => {
        const next = new URLSearchParams(p)
        v === DEFAULTS[k] ? next.delete(k) : next.set(k, v)
        return next
      },
      { replace: true, preventScrollReset: true }
    )
  return { genre: get('genre'), sort: get('sort'), view: get('view'), q: get('q'), set }
}

/** "Selected work": filter by genre, search, sort, grid/list — then an infinite list grouped by year. */
export default function WorkGrid() {
  const { genre, sort, view, q, set } = useWorkParams()
  const sectionRef = useRef(null)

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    const list = galleries.filter(
      (g) =>
        (genre === 'all' || g.genre === genre) &&
        (!term || `${g.title} ${g.location} ${g.genreLabel} ${g.year}`.toLowerCase().includes(term))
    )
    const by = { newest: (a, b) => b.date - a.date, oldest: (a, b) => a.date - b.date, largest: (a, b) => b.count - a.count }
    return list.sort(by[sort] || by.newest)
  }, [genre, sort, q])

  const { count, ref: sentinel, done, loading } = useInfinite(filtered.length, {
    batch: BATCH[view] || BATCH.grid,
    resetKey: `${genre}|${sort}|${q}|${view}`,
  })

  // Group the shown galleries by year (date sorts only), keeping the year's full count for the heading.
  const groups = useMemo(() => {
    const shown = filtered.slice(0, count)
    if (sort === 'largest') return [{ key: 'all', items: shown }]
    const totals = {}
    filtered.forEach((g) => (totals[g.year] = (totals[g.year] || 0) + 1))
    const out = []
    shown.forEach((g) => {
      if (out.at(-1)?.key !== g.year) out.push({ key: g.year, total: totals[g.year], items: [] })
      out.at(-1).items.push(g)
    })
    return out
  }, [filtered, count, sort])

  // After changing a filter while the toolbar is stuck, bring the top of the results back into view.
  const change = (k, v) => {
    set(k, v)
    const top = sectionRef.current?.getBoundingClientRect().top ?? 0
    if (top < 0) window.scrollTo({ top: window.scrollY + top - 8, behavior: 'smooth' })
  }

  const tabs = [{ id: 'all', label: 'All', count: galleries.length }, ...genres]

  return (
    <section id="work" ref={sectionRef} className="mx-auto max-w-[1800px] scroll-mt-16 px-4 pt-16 md:px-8 md:pt-24">
      <div className="flex items-end justify-between gap-6">
        <h2 className="text-36-sb text-type-0 md:text-48-sb">
          Selected work<span className="ml-2 align-baseline text-16-m text-type-3 md:text-20-m">({galleries.length})</span>
        </h2>
      </div>

      {/* Toolbar */}
      <div className="sticky top-16 z-30 -mx-4 mt-6 bg-surface-0 px-4 md:-mx-8 md:px-8">
        <div className="flex flex-col lg:flex-row lg:items-stretch lg:gap-6">
          {/* Bottom-stroke tabs, same pattern as the gallery's collection tabs. The stroke sits on the toolbar's bottom border. */}
          <nav aria-label="Genres" className="no-scrollbar -mx-4 flex h-12 min-w-0 flex-1 gap-6 overflow-x-auto border-b border-border px-4 md:-mx-8 md:px-8 lg:mx-0 lg:h-14 lg:border-0 lg:px-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => change('genre', t.id)}
                aria-current={genre === t.id}
                className={cn('relative h-full shrink-0 text-14-r text-type-2 transition hover:text-type-0', genre === t.id && 'text-type-0')}
              >
                {genre === t.id && <motion.span layoutId="genre-underline" className="absolute inset-x-0 bottom-0 h-0.5 bg-type-0" transition={{ duration: 0.4, ease }} />}
                <span className="relative">
                  {t.label} <span className="tabular-nums text-type-3">{t.count}</span>
                </span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 py-3 lg:py-0">
            <label className="relative flex h-9 min-w-0 flex-1 items-center lg:w-64 lg:flex-none">
              <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 text-type-3" />
              <input
                value={q}
                onChange={(e) => set('q', e.target.value)}
                placeholder="Search galleries"
                aria-label="Search galleries"
                className="h-full w-full rounded-full border border-input bg-surface-1 pl-9 pr-8 text-14-r text-type-0 outline-none transition placeholder:text-type-3 focus:border-type-0"
              />
              {q && (
                <button onClick={() => set('q', '')} aria-label="Clear search" className="absolute right-1.5 grid h-6 w-6 place-items-center rounded-full text-type-2 hover:bg-surface-2">
                  <X size={12} />
                </button>
              )}
            </label>

            {/* Native select on tablet/desktop; a bottom sheet of options on phones. */}
            <Select
              value={sort}
              onChange={(v) => change('sort', v)}
              options={SORTS.map((s) => ({ value: s.id, label: s.label }))}
              title="Sort by"
              className="w-auto shrink-0 md:w-auto"
              triggerClassName="h-9 w-auto border-input pl-3.5 pr-9 text-type-0 transition hover:bg-surface-2 focus:border-type-0"
            />

            <div className="flex h-9 shrink-0 rounded-full bg-surface-2 p-0.5" role="group" aria-label="View">
              {[
                { id: 'grid', Icon: SquaresFour, label: 'Grid view' },
                { id: 'list', Icon: ListBullets, label: 'List view' },
              ].map(({ id, Icon, label }) => (
                <button
                  key={id}
                  onClick={() => change('view', id)}
                  aria-pressed={view === id}
                  aria-label={label}
                  title={label}
                  className={cn('grid w-9 place-items-center rounded-full text-type-2 transition hover:text-type-0', view === id && 'bg-surface-1 text-type-0 shadow-[0_1px_2px_rgba(0,0,0,.08)]')}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-16-m text-type-0">No galleries match “{q}”</p>
          <p className="mt-1 text-14-r text-type-2">Try a client name, a place or a year.</p>
          <button onClick={() => { set('q', ''); set('genre', 'all') }} className="mt-5 rounded-full bg-surface-2 px-4 py-2 text-14-m text-type-0 transition hover:bg-[#ededed]">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="pt-6 md:pt-8">
          {groups.map((grp) => (
            <div key={grp.key} className="mb-10 md:mb-14">
              {grp.key !== 'all' && (
                <div className="mb-4 flex items-baseline gap-3 md:mb-5">
                  <p className="text-24-m text-type-0">{grp.key}</p>
                  <p className="text-13-r text-type-3">{grp.total} {grp.total === 1 ? 'gallery' : 'galleries'}</p>
                  <span className="h-px flex-1 self-center bg-border" />
                </div>
              )}
              {view === 'list' ? (
                <div className="divide-y divide-border">
                  {grp.items.map((g) => <ProjectRow key={g.slug} g={g} />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-x-4 gap-y-8 min-[480px]:grid-cols-2 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-10 2xl:grid-cols-4">
                  {grp.items.map((g) => (
                    <motion.div key={g.slug} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
                      <ProjectCard g={g} eager={filtered.indexOf(g) < 6} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div ref={sentinel} className="flex h-16 items-center justify-center text-13-r text-type-3">
            {loading ? 'Loading more galleries…' : done && `Showing all ${filtered.length} ${filtered.length === 1 ? 'gallery' : 'galleries'}`}
          </div>
        </div>
      )}
    </section>
  )
}
