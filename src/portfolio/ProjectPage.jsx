import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useBreakpoint } from '../gallery/lib/hooks'
import { masonry } from '../gallery/lib/layout'
import { Reveal } from '../components/ui'
import { formatDate, galleries, galleryBySlug } from './data/portfolio'
import PortfolioHeader from './components/PortfolioHeader'
import { ProjectCard } from './components/ProjectCard'
import Contact from './components/Contact'

const COLUMNS = { mobile: 2, tablet: 3, desktop: 3 }

/** One published gallery from the portfolio: title, details, then its photos in masonry columns. */
export default function ProjectPage() {
  const { slug } = useParams()
  const g = galleryBySlug[slug]
  const bp = useBreakpoint()

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [slug])

  const columns = useMemo(() => (g ? masonry(g.photos, COLUMNS[bp]) : []), [g, bp])
  // More from the same genre, nearest in time first.
  const more = useMemo(
    () => (g ? galleries.filter((x) => x.genre === g.genre && x !== g).sort((a, b) => Math.abs(a.date - g.date) - Math.abs(b.date - g.date)).slice(0, 4) : []),
    [g]
  )

  if (!g) {
    return (
      <div className="min-h-screen bg-surface-0">
        <PortfolioHeader back={{ to: '/portfolio', label: 'Portfolio' }} />
        <div className="py-32 text-center">
          <p className="text-20-m text-type-0">This gallery isn’t available</p>
          <Link to="/portfolio" className="mt-4 inline-block text-14-m text-type-0 underline underline-offset-4">Back to portfolio</Link>
        </div>
      </div>
    )
  }

  const details = [
    { k: 'Category', v: g.genreLabel },
    { k: 'Location', v: g.location },
    { k: 'Date', v: formatDate(g.date) },
    { k: 'Photos', v: g.count },
  ]

  return (
    <div className="min-h-screen bg-surface-0">
      <PortfolioHeader back={{ to: '/portfolio#work', label: 'Portfolio' }} links={[{ href: '#contact', label: 'Contact' }]} />

      <main className="mx-auto max-w-[1800px] px-4 md:px-8">
        <section className="grid gap-8 pb-10 pt-10 md:pb-14 md:pt-16 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Link to={`/portfolio?genre=${g.genre}#work`} className="text-12-sb uppercase text-type-3 transition hover:text-type-0">
              {g.genreLabel}
            </Link>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 text-48-sb text-type-0 md:text-72-sb"
            >
              {g.title}
            </motion.h1>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 lg:col-span-5">
            {details.map((d) => (
              <div key={d.k} className="min-w-0">
                <dt className="text-11-sb uppercase text-type-3">{d.k}</dt>
                <dd className="mt-1 truncate text-14-m text-type-0">{d.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="flex gap-1 md:gap-2">
          {columns.map((col, c) => (
            <div key={c} className="flex min-w-0 flex-1 flex-col gap-1 md:gap-2">
              {col.map(({ item: p, index }) => (
                <img
                  key={p.id}
                  src={p.src}
                  alt=""
                  loading={index < 6 ? 'eager' : 'lazy'}
                  decoding="async"
                  style={{ aspectRatio: `${p.w} / ${p.h}` }}
                  className="w-full bg-surface-2 object-cover"
                />
              ))}
            </div>
          ))}
        </div>

        {more.length > 0 && (
          <section className="pt-20 md:pt-28">
            <div className="mb-6 flex items-baseline justify-between gap-4">
              <h2 className="text-30-m text-type-0">More {g.genreLabel.toLowerCase()}</h2>
              <Link to={`/portfolio?genre=${g.genre}#work`} className="shrink-0 text-14-m text-type-1 underline-offset-4 hover:text-type-0 hover:underline">
                View all
              </Link>
            </div>
            <Reveal className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-6">
              {more.map((x) => <ProjectCard key={x.slug} g={x} />)}
            </Reveal>
          </section>
        )}
      </main>

      <Contact workHref="/portfolio#work" />
    </div>
  )
}
