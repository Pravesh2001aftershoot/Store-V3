import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowSquareOut, Check, CopySimple, Circle, Storefront, UserCircle } from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import { cn, plural } from '../../lib/utils'
import { notify } from '../../gallery/lib/actions'
import { ALL_TEMPLATES as COVER_TEMPLATES } from '../../gallery/templates/cover/config'
import { PageHeader } from '../components/ui'
import { galleryPath } from '../../data/galleries'

/**
 * Step 3 — Share. The client's link, a check that the gallery is ready, and where to go next.
 * (Sending is out of scope for the prototype: there's no client list or email service.)
 */
export default function ShareStep({ ws }) {
  const { library, photos, sections, cover, media, footer } = ws
  const path = galleryPath(ws.gallery.id)
  const url = `${window.location.origin}${path}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      notify('Link copied')
    } catch {
      notify('Couldn’t copy — select the link and copy it')
    }
  }

  const checks = [
    { done: photos.length > 0, title: plural(photos.length, 'photo'), detail: `${plural(sections.length, 'collection')}${library.removed.length ? ` · ${library.removed.length} removed` : ''}`, to: 'photos' },
    { done: !media.isDefault, title: media.isDefault ? 'Using the default cover photo' : 'Cover photo chosen', detail: `Template: ${COVER_TEMPLATES.find((t) => t.id === cover.template)?.name ?? 'Custom'}`, to: 'design' },
    { done: !!cover.config.content.title, title: `Titled “${cover.config.content.title}”`, detail: cover.config.content.subtitle || 'No subtitle', to: 'design' },
    { done: true, title: 'Footer', detail: footer.edited ? 'Customised' : 'Using the template as is', to: 'design' },
  ]

  return (
    <div className="mx-auto max-w-[960px] px-4 pb-40 pt-6 md:px-6 md:pt-10">
      <PageHeader title="Share with your client" description="Your client opens the gallery from this link. Everything you change keeps updating it — there’s nothing to republish." />

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface-1">
        <div className="relative aspect-[21/9] max-h-[280px] w-full overflow-hidden bg-type-0">
          <img src={media.photo.src} alt="" className="h-full w-full object-cover opacity-90" style={{ objectPosition: `${media.photo.focus.x}% ${media.photo.focus.y}%` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-6">
            <p className="text-12-sb uppercase text-white/70">{ws.gallery.date}</p>
            <p className="mt-1 truncate text-24-m">{cover.config.content.title || ws.gallery.client}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center md:p-5">
          <div className="flex h-11 min-w-0 flex-1 items-center rounded-full border border-input bg-surface-0 px-4">
            <span className="truncate text-14-r text-type-1">{url}</span>
          </div>
          <div className="flex gap-2">
            <Button size="md" onClick={copy} className="flex-1 sm:flex-none">
              <CopySimple size={16} /> Copy link
            </Button>
            <Button as="a" href={path} target="_blank" rel="noreferrer" variant="outline" size="md" className="flex-1 sm:flex-none">
              Open <ArrowSquareOut size={14} />
            </Button>
          </div>
        </div>
      </div>

      <h2 className="mt-10 text-16-sb text-type-0">Before you send</h2>
      <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface-1">
        {checks.map((c) => (
          <li key={c.title}>
            <Link to={`${ws.base}/${c.to}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface-2/60">
              <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full', c.done ? 'bg-success-bg text-success' : 'bg-surface-2 text-type-3')}>
                {c.done ? <Check size={12} weight="bold" /> : <Circle size={10} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-14-m text-type-0">{c.title}</span>
                <span className="block truncate text-12-r text-type-2">{c.detail}</span>
              </span>
              <span className="text-13-m text-type-2">Edit</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-16-sb text-type-0">Also part of the gallery</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {[
          { to: '/dashboard/portfolio', icon: UserCircle, title: 'Portfolio', body: 'Your name in the gallery links here. Check your profile and work.' },
          { to: `/dashboard/store/${ws.meta.catalogId}`, icon: Storefront, title: 'Print store', body: 'Clients order prints from their photos. Set products and prices for this gallery’s catalog.' },
        ].map((x) => (
          <Link key={x.to} to={x.to} className="group flex gap-3 rounded-2xl border border-border bg-surface-1 p-4 transition hover:border-type-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2"><x.icon size={20} /></span>
            <span>
              <span className="block text-14-m text-type-0">{x.title}</span>
              <span className="block text-13-r-p text-type-2">{x.body}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <Button as={Link} to={`${ws.base}/design`} variant="ghost" size="sm" className="-ml-2">
          <ArrowLeft size={14} /> Design
        </Button>
      </div>
    </div>
  )
}
