import { Link } from 'react-router-dom'
import { CaretLeft } from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import { usePortfolio } from '../data/config'

/** Sticky top bar: a way back (to the client gallery or the portfolio), the name, section links and the enquiry CTA. */
export default function PortfolioHeader({ back, links = [] }) {
  const { profile, contact } = usePortfolio()
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface-0">
      <div className="mx-auto flex h-16 max-w-[1800px] items-center gap-3 px-4 md:px-8">
        <Link
          to={back.to}
          className="-ml-2 flex h-10 shrink-0 items-center gap-1 rounded-full px-2 text-14-r text-type-2 transition hover:bg-surface-2 hover:text-type-0"
        >
          <CaretLeft size={16} />
          <span className="hidden sm:inline">{back.label}</span>
        </Link>
        <span className="hidden h-5 w-px bg-border sm:block" />
        <Link to="/portfolio" className="min-w-0 truncate text-16-sb text-type-0">
          {profile.name}
        </Link>

        <nav aria-label="Sections" className="ml-auto hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="rounded-full px-3 py-2 text-14-r text-type-1 transition hover:bg-surface-2 hover:text-type-0">
              {l.label}
            </a>
          ))}
        </nav>
        {contact.enquire && (
          <Button as="a" href={`mailto:${profile.email}`} size="sm" className="ml-auto shrink-0 md:ml-2">
            Enquire
          </Button>
        )}
      </div>
    </header>
  )
}
