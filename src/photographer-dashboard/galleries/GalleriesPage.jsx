import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowSquareOut, DotsThree, GearSix, Images, MagnifyingGlass, PencilSimple, Plus, Storefront, Trash, X } from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import { cn, plural } from '../../lib/utils'
import { galleryKey, galleryPath, useGalleries } from '../../data/galleries'
import { useCatalogs } from '../../data/storeConfig'
import { purgeUploads } from '../../gallery/lib/library'
import { notify } from '../../gallery/lib/actions'
import { Empty, Menu, PageHeader, Tag } from '../components/ui'
import WithGallery, { CoverImage } from './GalleryCover'
import GalleryForm from './GalleryForm'

/**
 * Every client gallery, newest first, as cover cards. Search by title or client; each card opens
 * the gallery editor, and its menu has Settings, View as client and Delete.
 */
export default function GalleriesPage() {
  const { galleries, remove } = useGalleries()
  const { catalogs } = useCatalogs()
  const [q, setQ] = useState('')
  const [form, setForm] = useState(null) // null | 'new' | gallery
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    return t ? galleries.filter((g) => `${g.title} ${g.client} ${g.date}`.toLowerCase().includes(t)) : galleries
  }, [galleries, q])
  const catalogName = (id) => catalogs.find((c) => c.id === id)?.name ?? 'Main catalog'

  const del = async (g) => {
    if (galleries.length < 2) return notify('You need at least one gallery')
    if (!window.confirm(`Delete “${g.title}”? Its photos, design and link are removed for good.`)) return
    await purgeUploads(galleryKey(g.id, 'library'))
    remove(g.id)
    notify(`${g.title} deleted`)
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-24 pt-6 md:px-8 md:pt-10">
      <PageHeader
        title="Galleries"
        description="Each client gets their own gallery, with its own photos, design and print store."
        actions={<Button size="md" onClick={() => setForm('new')}><Plus size={16} /> New gallery</Button>}
      />

      <div className="mt-8 flex items-center gap-3">
        <label className="flex h-10 w-full max-w-[360px] items-center gap-2 rounded-full border border-input bg-surface-1 px-3.5 transition focus-within:border-type-0">
          <MagnifyingGlass size={16} className="shrink-0 text-type-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search galleries" aria-label="Search galleries" className="h-full min-w-0 flex-1 bg-transparent text-14-r text-type-0 outline-none placeholder:text-type-3" />
          {q && <button onClick={() => setQ('')} aria-label="Clear search" className="text-type-3 hover:text-type-0"><X size={14} /></button>}
        </label>
        <p className="ml-auto shrink-0 text-13-r text-type-3 tabular-nums">{plural(shown.length, 'gallery', 'galleries')}</p>
      </div>

      {shown.length === 0 ? (
        <div className="mt-6">
          <Empty icon={Images} title={`No galleries match “${q}”`} action={<Button variant="outline" size="sm" onClick={() => setQ('')}>Clear search</Button>}>
            Search looks at the title, client and date.
          </Empty>
        </div>
      ) : (
        <ul className="mt-6 grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {!q && (
            <li>
              <button
                onClick={() => setForm('new')}
                className="group flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border text-type-2 transition hover:border-type-2 hover:text-type-0"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 transition group-hover:scale-105"><Plus size={20} /></span>
                <span className="text-14-m">New gallery</span>
              </button>
            </li>
          )}
          {shown.map((g) => (
            <li key={g.id}>
              <GalleryCard g={g} catalog={catalogName(g.catalogId)} onSettings={() => setForm(g)} onDelete={() => del(g)} canDelete={galleries.length > 1} />
            </li>
          ))}
        </ul>
      )}

      <GalleryForm open={!!form} onOpenChange={(o) => !o && setForm(null)} gallery={form === 'new' ? null : form} />
    </div>
  )
}

function GalleryCard({ g, catalog, onSettings, onDelete, canDelete }) {
  const navigate = useNavigate()
  const to = `/dashboard/galleries/${g.id}`
  return (
    <WithGallery id={g.id}>
      {({ photo, count, empty }) => (
        <div className="group relative">
          <Link to={to} className="block overflow-hidden rounded-2xl bg-surface-2">
            <div className="relative aspect-[4/3]">
              {empty ? (
                <div className="grid h-full place-items-center text-type-3">
                  <span className="flex flex-col items-center gap-2">
                    <Images size={28} />
                    <span className="text-12-r">No photos yet</span>
                  </span>
                </div>
              ) : (
                <CoverImage photo={photo} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              )}
              <div className="absolute left-3 top-3 flex gap-1.5">
                {g.sample && <Tag tone="dark">Sample</Tag>}
              </div>
            </div>
          </Link>
          <div className="mt-3 flex items-start gap-2">
            <Link to={to} className="min-w-0 flex-1">
              <p className="truncate text-14-m text-type-0">{g.title}</p>
              <p className="mt-0.5 truncate text-12-r text-type-2">
                {g.date} · {plural(count, 'photo')}
              </p>
              <p className="mt-1 flex items-center gap-1 truncate text-12-r text-type-3">
                <Storefront size={12} className="shrink-0" /> {catalog}
              </p>
            </Link>
            <Menu
              label={`${g.title} options`}
              trigger={({ toggle, open }) => (
                <button onClick={toggle} aria-label={`${g.title} options`} aria-expanded={open} className={cn('-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-type-2 transition hover:bg-surface-2 hover:text-type-0', open && 'bg-surface-2 text-type-0')}>
                  <DotsThree size={20} weight="bold" />
                </button>
              )}
              items={[
                { label: 'Edit gallery', icon: PencilSimple, onClick: () => navigate(to) },
                { label: 'Settings', icon: GearSix, onClick: onSettings },
                { label: 'View as client', icon: ArrowSquareOut, onClick: () => window.open(galleryPath(g.id), '_blank') },
                null,
                { label: 'Delete', icon: Trash, danger: true, disabled: !canDelete, onClick: onDelete },
              ]}
            />
          </div>
        </div>
      )}
    </WithGallery>
  )
}
