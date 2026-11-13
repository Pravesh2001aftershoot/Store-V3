import { Link } from 'react-router-dom'
import { ArrowUpRight, InstagramLogo } from '@phosphor-icons/react'
import { Button, Reveal } from '../../components/ui'
import { profile } from '../data/portfolio'

/** Closing call to action + footer. */
export default function Contact({ workHref = '#work' }) {
  return (
    <footer id="contact" className="mt-10 scroll-mt-16 border-t border-border bg-surface-1">
      <div className="mx-auto max-w-[1800px] px-4 py-16 md:px-8 md:py-24">
        <div className="grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-8">
            <p className="text-12-sb uppercase text-type-3">Contact</p>
            <h2 className="mt-4 text-36-sb text-type-0 md:text-60-sb">Have a day worth remembering? Let’s talk.</h2>
            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button as="a" href={`mailto:${profile.email}`} size="lg" arrow className="w-full sm:w-auto">
                {profile.email}
              </Button>
              <Button as={workHref.startsWith('#') ? 'a' : Link} href={workHref} to={workHref} size="lg" variant="outline" className="w-full sm:w-auto">
                Browse galleries
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="space-y-6 lg:col-span-4 lg:pt-10">
            {[
              { k: 'Availability', v: profile.availability },
              { k: 'Based in', v: profile.location },
              { k: 'Social', v: profile.instagram, icon: InstagramLogo },
            ].map((r) => (
              <div key={r.k} className="flex items-baseline justify-between gap-4 border-b border-border pb-4">
                <p className="text-14-r text-type-2">{r.k}</p>
                <p className="flex items-center gap-1.5 text-right text-14-m text-type-0">
                  {r.icon && <r.icon size={16} />}
                  {r.v}
                </p>
              </div>
            ))}
          </Reveal>
        </div>

        <div className="mt-16 flex flex-col gap-2 text-12-r text-type-3 sm:flex-row sm:items-center sm:justify-between md:mt-24">
          <p>© 2026 {profile.name}</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-1 self-start transition hover:text-type-0">
            Back to top <ArrowUpRight size={12} className="-rotate-45" />
          </button>
        </div>
      </div>
    </footer>
  )
}
