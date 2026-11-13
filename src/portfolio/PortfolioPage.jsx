import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import PortfolioHeader from './components/PortfolioHeader'
import Hero from './components/Hero'
import WorkGrid from './components/WorkGrid'
import Contact from './components/Contact'

const LINKS = [
  { href: '#work', label: 'Work' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
]

/**
 * Photographer portfolio — opened from the photographer's name in the client gallery.
 * Hero (intro + portrait) → "Selected work" (every published gallery, filterable) → contact.
 */
export default function PortfolioPage() {
  // Arriving with a hash (e.g. "View all" from a gallery → /portfolio#work) lands on that section.
  // Runs on arrival only: in-page links (#work, #about…) change the hash too, and re-running here
  // would cut their smooth scroll (html has `scroll-behavior: smooth`) short with an instant jump.
  const { hash } = useLocation()
  useEffect(() => {
    const el = hash && document.getElementById(hash.slice(1))
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: 'instant' }))
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-surface-0">
      <PortfolioHeader back={{ to: '/', label: 'Gallery' }} links={LINKS} />
      <main>
        <Hero />
        <WorkGrid />
      </main>
      <Contact />
    </div>
  )
}
