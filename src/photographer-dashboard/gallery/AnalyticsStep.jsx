import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CaretRight, ChartBar, ChatCircle, CopySimple, CurrencyDollar, DownloadSimple, EnvelopeSimple,
  FileZip, Heart, Images, MagnifyingGlass, ShareNetwork, ShoppingBag, Users, X,
} from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import { cn, money, plural } from '../../lib/utils'
import { notify } from '../../gallery/lib/actions'
import { Chip, Empty, PageHeader, Select, Tag } from '../components/ui'
import Modal from '../components/Modal'
import { ago, buildAnalytics, downloadCount, shortDate, toCSV } from './analytics'

const SORTS = [
  { value: 'recent', label: 'Most recent', by: (p) => p.lastActive },
  { value: 'downloads', label: 'Most downloads', by: downloadCount },
  { value: 'favourites', label: 'Most favourites', by: (p) => p.favourites.length },
  { value: 'shares', label: 'Most shares', by: (p) => p.shares.length },
  { value: 'spent', label: 'Highest spend', by: (p) => p.spent },
]

/**
 * Step 4 — Analytics. Gallery-wide totals (visitors, downloads split into single photos and full
 * gallery, revenue, favourites / shares / comments), then every visitor who gave an email with
 * their counts. A row opens that person: the photos they downloaded, favourited, shared and
 * commented on, and their orders. Sample data (see analytics.js).
 */
export default function AnalyticsStep({ ws }) {
  const ids = ws.photos.map((p) => p.id).join()
  const data = useMemo(() => buildAnalytics(ws.gallery.id, ws.gallery.client, ws.photos), [ws.gallery.id, ws.gallery.client, ids])
  const photoById = useMemo(() => new Map(ws.photos.map((p) => [p.id, p])), [ws.photos])
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('recent')
  const [openId, setOpenId] = useState(null)

  const people = useMemo(() => {
    if (!data) return []
    const t = q.trim().toLowerCase()
    const by = SORTS.find((s) => s.value === sort).by
    return data.people.filter((p) => !t || `${p.email} ${p.name}`.toLowerCase().includes(t)).sort((a, b) => by(b) - by(a))
  }, [data, q, sort])

  if (!data) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 pb-40 pt-6 md:px-6 md:pt-10">
        <PageHeader title="Analytics" description="Who opened this gallery and what they did with your photos." />
        <div className="mt-8">
          <Empty icon={ChartBar} title="No activity yet" action={<Button as={Link} to={`${ws.base}/photos`} size="sm">Add photos</Button>}>
            Visits, downloads and orders show here once the gallery has photos and your client opens the link.
          </Empty>
        </div>
      </div>
    )
  }

  const { totals } = data
  const open = data.people.find((p) => p.id === openId)

  const exportCSV = () => {
    const blob = new Blob([toCSV(people)], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${ws.gallery.id}-analytics.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    notify(`Exported ${plural(people.length, 'person', 'people')}`)
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-40 pt-6 md:px-6 md:pt-10">
      <PageHeader
        title="Analytics"
        description="Who opened this gallery and what they did with your photos. Showing sample activity: the prototype doesn’t record real visits."
        actions={<Button variant="outline" size="md" onClick={exportCSV}><DownloadSimple size={16} /> Export CSV</Button>}
      />

      {/* Headline numbers */}
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card icon={Users} label="Visitors" value={totals.visitors.toLocaleString()} hint={`${totals.identified} with email · ${data.anonymous} anonymous`} />
        <Card icon={DownloadSimple} label="Downloads" value={totals.downloads.toLocaleString()} hint={`${totals.singleDownloads} photos · ${totals.fullDownloads} full gallery`} />
        <Card icon={CurrencyDollar} label="Revenue" value={money(totals.revenue)} hint={totals.orders ? `${plural(totals.orders, 'order')} · ${money(Math.round(totals.revenue / totals.orders))} average` : 'No orders yet'} />
        <Card icon={Heart} label="Favourites" value={totals.favourites.toLocaleString()} hint={`${plural(totals.shares, 'share')} · ${plural(totals.comments, 'comment')}`} />
      </div>

      <DownloadSplit totals={totals} />

      {/* People */}
      <div className="mt-10 flex flex-wrap items-end gap-x-3 gap-y-1">
        <h2 className="text-16-sb text-type-0">People</h2>
        <p className="text-13-r text-type-3">Everyone who opened the gallery with their email</p>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full border border-input bg-surface-1 px-3.5 transition focus-within:border-type-0 sm:max-w-[320px]">
          <MagnifyingGlass size={16} className="shrink-0 text-type-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people" aria-label="Search people" className="h-full min-w-0 flex-1 bg-transparent text-14-r text-type-0 outline-none placeholder:text-type-3" />
          {q && <button onClick={() => setQ('')} aria-label="Clear search" className="text-type-3 hover:text-type-0"><X size={14} /></button>}
        </label>
        <Select value={sort} onChange={setSort} options={SORTS} label="Sort people" className="w-[150px] shrink-0 sm:w-[170px]" />
        <p className="ml-auto hidden shrink-0 text-13-r tabular-nums text-type-3 sm:block">{plural(people.length, 'person', 'people')}</p>
      </div>

      {people.length === 0 ? (
        <div className="mt-4">
          <Empty icon={Users} title={`No one matches “${q}”`} action={<Button variant="outline" size="sm" onClick={() => setQ('')}>Clear search</Button>}>
            Search looks at email addresses and names.
          </Empty>
        </div>
      ) : (
        <PeopleList people={people} onOpen={setOpenId} />
      )}

      <PersonSheet person={open} photoById={photoById} onClose={() => setOpenId(null)} />
    </div>
  )
}

function Card({ icon: Icon, label, value, hint }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-surface-1 p-4 md:p-5">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-type-1"><Icon size={18} /></span>
      <p className="mt-3 text-12-sb uppercase text-type-3">{label}</p>
      <p className="mt-0.5 truncate text-24-m tabular-nums text-type-0">{value}</p>
      <p className="mt-0.5 text-12-r text-type-2 sm:truncate">{hint}</p>
    </div>
  )
}

/** How downloads divide between single photos and the whole gallery, by downloads and by people. */
function DownloadSplit({ totals }) {
  const single = totals.downloads ? (totals.singleDownloads / totals.downloads) * 100 : 0
  const halves = [
    { key: 'single', icon: Images, label: 'Single photos', n: totals.singleDownloads, people: totals.singleDownloaders, dot: 'bg-primary' },
    { key: 'full', icon: FileZip, label: 'Full gallery', n: totals.fullDownloads, people: totals.fullDownloaders, dot: 'bg-type-3' },
  ]
  return (
    <div className="mt-3 rounded-2xl border border-border bg-surface-1 p-4 md:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-14-m text-type-0">How people download</p>
        <p className="text-12-r tabular-nums text-type-3">{plural(totals.downloads, 'download')}</p>
      </div>
      <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={`${Math.round(single)}% single photos, ${100 - Math.round(single)}% full gallery`}>
        <span className="h-full rounded-full bg-primary" style={{ width: `${single}%` }} />
        <span className="h-full flex-1 rounded-full bg-type-3" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {halves.map((h) => (
          <div key={h.key} className="flex items-center gap-3 rounded-xl bg-surface-0 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-1 text-type-1"><h.icon size={18} /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-13-m text-type-0"><span className={cn('h-2 w-2 rounded-full', h.dot)} />{h.label}</span>
              <span className="block truncate text-12-r text-type-2">by {plural(h.people, 'person', 'people')}</span>
            </span>
            <span className="text-right">
              <span className="block text-20-m tabular-nums text-type-0">{h.n}</span>
              <span className="block text-11-r text-type-3">{h.n === 1 ? 'download' : 'downloads'}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const COLUMNS = [
  { key: 'downloads', label: 'Downloads', icon: DownloadSimple, n: downloadCount },
  { key: 'favourites', label: 'Favourites', icon: Heart, n: (p) => p.favourites.length },
  { key: 'shares', label: 'Shares', icon: ShareNetwork, n: (p) => p.shares.length },
  { key: 'comments', label: 'Comments', icon: ChatCircle, n: (p) => p.comments.length },
]
const GRID = 'lg:grid lg:grid-cols-[minmax(0,2.4fr)_repeat(4,minmax(0,0.9fr))_minmax(0,1fr)_minmax(0,1.1fr)_16px] lg:items-center lg:gap-3'
const Num = ({ n, className }) => <span className={cn('tabular-nums', n ? 'text-type-0' : 'text-type-3', className)}>{n || '–'}</span>

/** A table from 1024px; stacked cards below. Every row opens the person. */
function PeopleList({ people, onOpen }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface-1">
      <div className={cn(GRID, 'hidden border-b border-border px-4 py-2.5 text-11-sb uppercase text-type-3')}>
        <span>Person</span>
        {COLUMNS.map((c) => <span key={c.key} className="text-right">{c.label}</span>)}
        <span className="text-right">Spent</span>
        <span className="text-right">Last active</span>
        <span />
      </div>
      <ul className="divide-y divide-border">
        {people.map((p) => (
          <li key={p.id}>
            <button onClick={() => onOpen(p.id)} className={cn(GRID, 'block w-full px-4 py-3 text-left transition hover:bg-surface-2/60')}>
              <span className="flex min-w-0 items-center gap-3">
                <Avatar person={p} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-14-m text-type-0">{p.email}</span>
                    {p.isClient && <Tag tone="dark">Client</Tag>}
                  </span>
                  <span className="block truncate text-12-r text-type-2">
                    {p.name} · {plural(p.visits, 'visit')}<span className="lg:hidden"> · {ago(p.lastActive)}</span>
                  </span>
                </span>
                <CaretRight size={14} className="shrink-0 text-type-3 lg:hidden" />
              </span>
              {/* Phones and tablets: the counts as a strip under the name. */}
              <span className="mt-3 grid grid-cols-5 gap-2 pl-12 lg:hidden">
                {COLUMNS.map((c) => (
                  <span key={c.key} className="flex items-center gap-1 text-13-r" aria-label={`${c.n(p)} ${c.label.toLowerCase()}`}>
                    <c.icon size={14} className="shrink-0 text-type-3" /><Num n={c.n(p)} />
                  </span>
                ))}
                <Num n={p.spent && money(p.spent)} className="text-13-m" />
              </span>
              {COLUMNS.map((c) => <Num key={c.key} n={c.n(p)} className="hidden text-right text-14-r lg:block" />)}
              <Num n={p.spent && money(p.spent)} className="hidden text-right text-14-r lg:block" />
              <span className="hidden text-right text-13-r text-type-2 lg:block">{ago(p.lastActive)}</span>
              <CaretRight size={14} className="hidden text-type-3 lg:block" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Avatar({ person, large }) {
  const initials = person.name.split(/[\s&]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-full text-12-sb', large ? 'h-11 w-11' : 'h-9 w-9', person.isClient ? 'bg-primary text-primary-foreground' : 'bg-surface-2 text-type-1')}>
      {initials}
    </span>
  )
}

const TABS = [
  { id: 'downloads', label: 'Downloads', n: downloadCount },
  { id: 'favourites', label: 'Favourites', n: (p) => p.favourites.length },
  { id: 'shares', label: 'Shares', n: (p) => p.shares.length },
  { id: 'comments', label: 'Comments', n: (p) => p.comments.length },
  { id: 'orders', label: 'Orders', n: (p) => p.orders.length },
]

/** One person: their activity by kind, down to the photo. */
function PersonSheet({ person, photoById, onClose }) {
  const [tab, setTab] = useState(null)
  // Keep the last person while the dialog animates out.
  const [shown, setShown] = useState(person)
  if (person && person !== shown) {
    setShown(person)
    setTab(TABS.find((t) => t.n(person))?.id ?? 'downloads')
  }
  const p = person ?? shown

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(p.email)
      notify('Email copied')
    } catch {
      notify('Couldn’t copy the email')
    }
  }

  return (
    <Modal
      open={!!person}
      onOpenChange={(o) => !o && onClose()}
      title={p?.email ?? ''}
      description={p && `${p.name}${p.isClient ? ' (client)' : ''} · ${plural(p.visits, 'visit')} · First visit ${shortDate(p.firstVisit)} · Active ${ago(p.lastActive).toLowerCase()}${p.spent ? ` · Spent ${money(p.spent)}` : ''}`}
      footer={p && (
        <>
          <Button variant="outline" size="sm" onClick={copy}><CopySimple size={14} /> Copy email</Button>
          <Button as="a" href={`mailto:${p.email}`} size="sm"><EnvelopeSimple size={14} /> Email</Button>
        </>
      )}
    >
      {p && (
        <>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-none sm:flex-wrap" role="tablist" aria-label="Activity">
            {TABS.map((t) => (
              <Chip key={t.id} role="tab" aria-selected={tab === t.id} active={tab === t.id} count={t.n(p)} onClick={() => setTab(t.id)}>{t.label}</Chip>
            ))}
          </div>
          <div className="mt-4 pb-2" role="tabpanel">
            {tab === 'downloads' && <Downloads person={p} photoById={photoById} />}
            {tab === 'favourites' && <PhotoGrid items={p.favourites} photoById={photoById} empty="No favourites" caption={(x) => shortDate(x.at)} />}
            {tab === 'shares' && <PhotoGrid items={p.shares} photoById={photoById} empty="No shares" caption={(x) => `${x.via} · ${shortDate(x.at)}`} />}
            {tab === 'comments' && <Comments items={p.comments} photoById={photoById} />}
            {tab === 'orders' && <Orders items={p.orders} photoById={photoById} />}
          </div>
        </>
      )}
    </Modal>
  )
}

const Nothing = ({ children }) => <p className="rounded-xl bg-surface-0 px-4 py-8 text-center text-13-r text-type-3">{children}</p>

function Thumb({ photo, className }) {
  return photo
    ? <img src={photo.thumb ?? photo.src} alt={photo.name ?? ''} loading="lazy" className={cn('bg-surface-2 object-cover', className)} />
    : <span className={cn('grid place-items-center bg-surface-2 text-11-m text-type-3', className)}>Removed</span>
}

function PhotoGrid({ items, photoById, empty, caption }) {
  if (!items.length) return <Nothing>{empty}</Nothing>
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {items.map((x, i) => {
        const photo = photoById.get(x.photoId)
        return (
          <li key={`${x.photoId}-${i}`} className="min-w-0">
            <Thumb photo={photo} className="aspect-square w-full rounded-lg" />
            <p className="mt-1 truncate text-11-m text-type-1">{photo?.name ?? 'Removed photo'}</p>
            <p className="truncate text-11-r text-type-3">{caption(x)}</p>
          </li>
        )
      })}
    </ul>
  )
}

function Downloads({ person, photoById }) {
  if (!downloadCount(person)) return <Nothing>No downloads</Nothing>
  return (
    <div className="space-y-4">
      {person.fullDownloads.length > 0 && (
        <ul className="space-y-2">
          {person.fullDownloads.map((d, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl bg-surface-0 p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-1 text-type-1"><FileZip size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-13-m text-type-0">Full gallery</span>
                <span className="block truncate text-12-r text-type-2">{d.size} · every photo</span>
              </span>
              <span className="shrink-0 text-12-r text-type-3">{shortDate(d.at)}</span>
            </li>
          ))}
        </ul>
      )}
      {person.downloads.length > 0 && (
        <div>
          <p className="mb-2 text-12-sb uppercase text-type-3">Single photos · {person.downloads.length}</p>
          <PhotoGrid items={person.downloads} photoById={photoById} caption={(x) => shortDate(x.at)} />
        </div>
      )}
    </div>
  )
}

function Comments({ items, photoById }) {
  if (!items.length) return <Nothing>No comments</Nothing>
  return (
    <ul className="space-y-3">
      {items.map((c, i) => {
        const photo = photoById.get(c.photoId)
        return (
          <li key={i} className="flex gap-3">
            <Thumb photo={photo} className="h-14 w-14 shrink-0 rounded-lg" />
            <span className="min-w-0 flex-1">
              <span className="block text-14-r-p text-type-0">“{c.text}”</span>
              <span className="block truncate text-12-r text-type-3">{photo?.name ?? 'Removed photo'} · {shortDate(c.at)}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function Orders({ items, photoById }) {
  if (!items.length) return <Nothing>No orders</Nothing>
  return (
    <ul className="space-y-3">
      {items.map((o) => (
        <li key={o.id} className="rounded-xl border border-border">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <ShoppingBag size={16} className="text-type-2" />
            <span className="text-13-m text-type-0">Order {o.id}</span>
            <span className="text-12-r text-type-3">{shortDate(o.at)}</span>
            <span className="ml-auto text-14-m tabular-nums text-type-0">{money(o.total)}</span>
          </div>
          <ul className="divide-y divide-border">
            {o.items.map((it, i) => (
              <li key={i} className="flex items-center gap-3 px-3 py-2.5">
                <Thumb photo={photoById.get(it.photoId)} className="h-10 w-10 shrink-0 rounded-md" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-13-m text-type-0">{it.name}</span>
                  <span className="block truncate text-12-r text-type-2">{it.size} · Qty {it.qty}</span>
                </span>
                <span className="shrink-0 text-13-r tabular-nums text-type-1">{money(it.price)}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}
