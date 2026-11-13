import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowSquareOut, Images, List, Plus, Storefront, UserCircle, X } from '@phosphor-icons/react'
import { gallery as brand } from '../data/gallery'
import { DEFAULT_GALLERY, useGalleries } from '../data/galleries'
import { useCatalogs } from '../data/storeConfig'
import { cn } from '../lib/utils'
import Toaster from '../gallery/components/Toaster'
import { usePortfolio } from '../portfolio/data/config'
import { ease } from './components/ui'
import { PHONE_BAR_H, usePhone, useWideNav } from './lib/hooks'
import GalleriesPage from './galleries/GalleriesPage'
import GalleryForm from './galleries/GalleryForm'
import WithGallery, { CoverImage } from './galleries/GalleryCover'
import GalleryTab from './gallery/GalleryTab'
import PortfolioTab from './portfolio/PortfolioTab'
import CatalogsPage from './store/CatalogsPage'
import StoreTab from './store/StoreTab'

const RECENT = 5

/**
 * Photographer dashboard — where the photographer sets up what clients see:
 *   Galleries — one per client: photos, then the cover, grid, collection headings and footer
 *   Portfolio — profile, intro, which work is shown, contact
 *   Store     — catalogs of products, packages and prices; each gallery sells from one
 * Every change saves as it's made and shows on the client pages straight away.
 *
 * Layout: a sidebar on the left (full from 1024px, an icon rail from 640px); on phones a top bar
 * with a menu that opens the same sidebar as a drawer.
 */
export default function PhotographerDashboard() {
  const phone = usePhone()
  const wide = useWideNav()
  const [drawer, setDrawer] = useState(false)
  const [creating, setCreating] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { setDrawer(false) }, [pathname])

  const nav = (full) => <Sidebar full={full} onNew={() => { setDrawer(false); setCreating(true) }} />

  return (
    <div className="flex min-h-svh bg-surface-0">
      {!phone && (
        <aside className={cn('sticky top-0 h-svh shrink-0 border-r border-border bg-surface-1', wide ? 'w-[248px]' : 'w-[72px]')}>
          {nav(wide)}
        </aside>
      )}

      <div className="min-w-0 flex-1">
        {phone && <PhoneBar onMenu={() => setDrawer(true)} />}
        <Routes>
          <Route index element={<Navigate to="galleries" replace />} />
          <Route path="galleries" element={<GalleriesPage />} />
          <Route path="galleries/:galleryId/:step?" element={<GalleryTab />} />
          <Route path="portfolio" element={<PortfolioTab />} />
          <Route path="store" element={<CatalogsPage />} />
          <Route path="store/:catalogId" element={<StoreTab />} />
          {/* Before galleries: the one gallery lived at /dashboard/gallery. */}
          <Route path="gallery/:step?" element={<LegacyGallery />} />
          <Route path="*" element={<Navigate to="galleries" replace />} />
        </Routes>
      </div>

      {phone && (
        <AnimatePresence>
          {drawer && (
            <>
              <motion.div className="fixed inset-0 z-50 bg-black/40" onClick={() => setDrawer(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
              <motion.aside
                role="dialog"
                aria-label="Menu"
                className="fixed inset-y-0 left-0 z-50 w-[min(300px,86vw)] bg-surface-1 shadow-[20px_0_60px_-20px_rgba(0,0,0,.4)]"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.4, ease }}
              >
                <button onClick={() => setDrawer(false)} aria-label="Close menu" className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full text-type-1 hover:bg-surface-2">
                  <X size={18} />
                </button>
                {nav(true)}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      )}

      <GalleryForm open={creating} onOpenChange={setCreating} />
      <Toaster />
    </div>
  )
}

function LegacyGallery() {
  const { step } = useParams()
  return <Navigate to={`/dashboard/galleries/${DEFAULT_GALLERY}${step ? `/${step}` : ''}`} replace />
}

/** Phones: logo, the section's name and the menu. */
function PhoneBar({ onMenu }) {
  const { pathname } = useLocation()
  const section = SECTIONS.find((s) => pathname.startsWith(s.to))
  return (
    <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border bg-surface-0/90 px-2 backdrop-blur-md" style={{ height: PHONE_BAR_H }}>
      <button onClick={onMenu} aria-label="Open menu" className="grid h-10 w-10 place-items-center rounded-full text-type-0 hover:bg-surface-2">
        <List size={20} />
      </button>
      <img src={brand.logo} alt={brand.studio} className="h-5 w-auto select-none" draggable={false} />
      <span className="h-4 w-px bg-border" />
      <span className="truncate text-14-m text-type-0">{section?.label ?? 'Dashboard'}</span>
    </header>
  )
}

const SECTIONS = [
  { to: '/dashboard/galleries', label: 'Galleries', icon: Images },
  { to: '/dashboard/portfolio', label: 'Portfolio', icon: UserCircle },
  { to: '/dashboard/store', label: 'Store', icon: Storefront },
]

/** Logo, the three sections (with counts), recent galleries, New gallery and the profile. */
function Sidebar({ full, onNew }) {
  const { galleries } = useGalleries()
  const { catalogs } = useCatalogs()
  const { profile } = usePortfolio()
  const counts = { '/dashboard/galleries': galleries.length, '/dashboard/store': catalogs.length }
  const initials = profile.name.split(' ').map((w) => w[0]).slice(0, 2).join('')

  return (
    <div className="flex h-full flex-col">
      <Link to="/dashboard" className={cn('flex h-16 shrink-0 items-center gap-2.5', full ? 'px-5' : 'justify-center')} aria-label="Dashboard home">
        {/* The rail shows only the mark (the logo's first ~22px). */}
        <span className={cn('block overflow-hidden', !full && 'w-[22px]')}>
          <img src={brand.logo} alt={brand.studio} className="h-6 w-auto max-w-none select-none" draggable={false} />
        </span>
        {full && <span className="text-11-sb uppercase text-type-3">Studio</span>}
      </Link>

      <div className={cn('shrink-0', full ? 'px-3' : 'px-3')}>
        <button
          onClick={onNew}
          title={full ? undefined : 'New gallery'}
          aria-label="New gallery"
          className={cn('flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-13-m text-primary-foreground transition hover:opacity-90 active:scale-[.98]', !full && 'w-10 mx-auto')}
        >
          <Plus size={16} weight="bold" />
          {full && 'New gallery'}
        </button>
      </div>

      <nav aria-label="Dashboard" className="mt-4 space-y-0.5 px-3">
        {SECTIONS.map((s) => (
          <NavLink
            key={s.to}
            to={s.to}
            title={full ? undefined : s.label}
            className={({ isActive }) => cn(
              'relative flex h-10 items-center gap-3 rounded-lg text-13-m transition',
              full ? 'px-3' : 'justify-center',
              isActive ? 'text-type-0' : 'text-type-2 hover:bg-surface-2/60 hover:text-type-0'
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId={`dash-nav-${full}`} className="absolute inset-0 rounded-lg bg-surface-2" transition={{ duration: 0.3, ease }} />}
                <s.icon size={18} weight={isActive ? 'fill' : 'regular'} className="relative shrink-0" />
                {full && <span className="relative flex-1">{s.label}</span>}
                {full && counts[s.to] != null && <span className="relative text-12-r tabular-nums text-type-3">{counts[s.to]}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {full && (
        <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-3">
          <p className="px-3 text-11-sb uppercase text-type-3">Recent galleries</p>
          <ul className="mt-2 space-y-0.5">
            {galleries.slice(0, RECENT).map((g) => (
              <li key={g.id}>
                <NavLink
                  to={`/dashboard/galleries/${g.id}`}
                  className={({ isActive }) => cn('flex h-10 items-center gap-2.5 rounded-lg px-2 text-13-r transition', isActive ? 'bg-surface-2 text-type-0' : 'text-type-1 hover:bg-surface-2/60 hover:text-type-0')}
                >
                  <WithGallery id={g.id}>
                    {({ photo, empty }) => (
                      <span className="h-7 w-7 shrink-0 overflow-hidden rounded-md bg-surface-2">
                        {empty ? <Images size={14} className="m-auto mt-[7px] text-type-3" /> : <CoverImage photo={photo} className="h-full w-full object-cover" />}
                      </span>
                    )}
                  </WithGallery>
                  <span className="truncate">{g.title}</span>
                </NavLink>
              </li>
            ))}
          </ul>
          {galleries.length > RECENT && (
            <Link to="/dashboard/galleries" className="mt-1 block px-3 py-2 text-12-m text-type-2 hover:text-type-0">
              All {galleries.length} galleries
            </Link>
          )}
        </div>
      )}

      <div className={cn('mt-auto shrink-0 border-t border-border p-3', !full && 'flex justify-center')}>
        <a
          href="/portfolio"
          target="_blank"
          rel="noreferrer"
          title={full ? 'View your portfolio' : `${profile.name} — view portfolio`}
          className={cn('group flex items-center gap-2.5 rounded-lg transition hover:bg-surface-2/60', full ? 'p-2' : 'p-1')}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-12-sb text-primary-foreground">{initials}</span>
          {full && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-13-m text-type-0">{profile.name}</span>
              <span className="block truncate text-12-r text-type-3">View portfolio</span>
            </span>
          )}
          {full && <ArrowSquareOut size={14} className="shrink-0 text-type-3 transition group-hover:text-type-0" />}
        </a>
      </div>
    </div>
  )
}
