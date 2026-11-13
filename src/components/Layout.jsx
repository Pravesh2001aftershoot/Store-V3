import { Fragment, useEffect, useState } from 'react'
import { Link, NavLink, useOutlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from 'framer-motion'
import { ArrowLeft, ArrowUpRight, Handbag, List, X, Images } from '@phosphor-icons/react'
import { categories } from '../data/catalog'
import { useCatalogVersion } from '../data/storeConfig'
import { gallery } from '../data/gallery'
import { galleryPath, useActiveGallery, DEFAULT_GALLERY } from '../data/galleries'
import { useStore } from '../state/store'
import { cn } from '../lib/utils'
import CartDrawer from './CartDrawer'
import PhotographerLink from './PhotographerLink'

const ease = [0.22, 1, 0.36, 1]

/** Photographer branding — swap `gallery.logo` for the photographer's own logo. */
export function Wordmark({ className, inverted = false }) {
  return (
    <Link to="/store" className={cn('flex shrink-0 items-center', className)} aria-label={`${gallery.studio} home`}>
      <img
        src={gallery.logo}
        alt={gallery.studio}
        className={cn('h-7 w-auto select-none md:h-8', inverted && 'brightness-0 invert')}
        draggable={false}
      />
    </Link>
  )
}

function CartButton() {
  const { totals, setDrawer } = useStore()
  return (
    <button
      onClick={() => setDrawer(true)}
      className="relative flex h-10 items-center gap-2 rounded-full bg-type-0 pl-3.5 pr-4 text-14-m text-white transition hover:bg-[#2c2c2c]"
      aria-label="Open cart"
    >
      <Handbag size={18} weight="regular" />
      <span className="hidden sm:inline">Cart</span>
      <span className="grid h-5 min-w-5 place-items-center overflow-hidden rounded-full bg-white px-1.5 text-11-sb text-type-0">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={totals.itemCount} initial={{ y: 12 }} animate={{ y: 0 }} exit={{ y: -12 }} transition={{ duration: 0.3, ease }}>
            {totals.itemCount}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  )
}

function Header() {
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menu, setMenu] = useState(false)
  const loc = useLocation()

  useEffect(() => { setMenu(false) }, [loc.pathname])
  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setHidden(y > prev && y > 240)
    setScrolled(y > 12)
  })

  // The gallery the client came from: its name in the banner, and where "Back to gallery" goes.
  const active = useActiveGallery()
  const back = active.id === DEFAULT_GALLERY ? '/' : galleryPath(active.id)

  const links = [
    { to: '/shop', label: 'Shop all' },
    ...categories.map((c) => ({ to: `/shop/${c.id}`, label: c.name })),
    { to: '/packages', label: 'Packages' },
  ]

  return (
    <>
      <motion.header
        animate={{ y: hidden && !menu ? '-100%' : 0 }}
        transition={{ duration: 0.45, ease }}
        className="fixed inset-x-0 top-0 z-40"
      >
        <div className="truncate bg-type-0 px-4 py-2 text-center text-12-r text-white/80">
          <span className="max-sm:hidden">Ordering from <span className="font-medium text-white">{active.title}</span> · </span>Use code{' '}
          <span className="font-mono font-medium text-white">LEXIE10</span> for 10% off
        </div>
        <div
          className={cn(
            'border-b bg-surface-0 transition-colors duration-500',
            scrolled || menu ? 'border-border' : 'border-transparent'
          )}
        >
          <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between gap-4 px-4 md:px-8">
            <div className="flex h-full items-center gap-8">
              <Wordmark />
              <nav className="hidden items-center gap-6 lg:flex">
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.to === '/shop'}
                    className={({ isActive }) =>
                      cn(
                        'relative py-1.5 text-14-r text-type-2 transition hover:text-type-0',
                        isActive && 'text-type-0'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span layoutId="nav-underline" className="absolute inset-x-0 bottom-0 h-0.5 bg-type-0" transition={{ duration: 0.4, ease }} />
                        )}
                        <span className="relative">{l.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={back}
                className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-14-r text-type-1 transition hover:bg-surface-2 hover:text-type-0 md:flex"
              >
                <ArrowLeft size={15} /> Back to gallery
              </Link>
              <CartButton />
              <button
                onClick={() => setMenu((m) => !m)}
                className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 lg:hidden"
                aria-label="Menu"
              >
                {menu ? <X size={18} /> : <List size={18} />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.6, ease }}
            className="fixed inset-0 z-30 flex flex-col bg-surface-0 px-4 pb-8 pt-32 lg:hidden"
          >
            <nav className="flex flex-col">
              {links.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease }}
                >
                  <Link to={l.to} className="flex items-center justify-between border-b border-border py-4 text-30-m">
                    {l.label}
                    <ArrowUpRight size={22} className="text-type-3" />
                  </Link>
                </motion.div>
              ))}
            </nav>
            <Link to={back} className="mt-auto flex items-center gap-2 text-14-r text-type-2">
              <Images size={16} /> Back to {active.client} gallery
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Footer() {
  return (
    <footer className="mt-24 bg-type-0 text-white">
      <div className="mx-auto max-w-[1360px] px-4 pb-10 pt-16 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Wordmark inverted className="mb-6" />
            <p className="max-w-sm text-24-m text-white/90">
              Printed with care for the people in the photographs.
            </p>
            <p className="mt-4 text-14-r text-white/50">
              {gallery.studio} · <PhotographerLink className="hover:text-white" />
            </p>
          </div>
          {[
            ['Shop', categories.map((c) => [c.name, `/shop/${c.id}`])],
            ['Help', [['Shipping', '#'], ['Returns', '#'], ['Print quality', '#']]],
            ['Studio', [['Gallery', '/'], ['Contact', '#'], ['Instagram', '#']]],
          ].map(([h, ls]) => (
            <div key={h}>
              <p className="mb-4 text-12-sb uppercase text-white/40">{h}</p>
              <ul className="space-y-2.5">
                {ls.map(([t, to]) => (
                  <li key={t}>
                    <Link to={to} className="text-14-r text-white/75 transition hover:text-white">
                      {t}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 overflow-hidden">
          <p className="select-none whitespace-nowrap text-[18vw] font-semibold leading-[0.8] tracking-[-0.06em] text-white/[0.06] md:text-[15vw]">
            {gallery.studio.toLowerCase()}
          </p>
        </div>
        <div className="mt-6 flex flex-col justify-between gap-2 border-t border-white/10 pt-6 text-12-r text-white/40 sm:flex-row">
          <span>© 2026 {gallery.studio}. Prototype store.</span>
          <span>Powered by your photographer’s gallery</span>
        </div>
      </div>
    </footer>
  )
}

export default function Layout() {
  const loc = useLocation()
  const outlet = useOutlet()
  // Store edits (dashboard) change the catalog in place; re-mount the page so it re-reads it.
  const catalog = useCatalogVersion()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [loc.pathname])
  return (
    <div className="min-h-screen">
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          key={loc.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease }}
          className="pt-[104px]"
        >
          <Fragment key={catalog}>{outlet}</Fragment>
        </motion.main>
      </AnimatePresence>
      <Footer />
      <CartDrawer />
    </div>
  )
}
