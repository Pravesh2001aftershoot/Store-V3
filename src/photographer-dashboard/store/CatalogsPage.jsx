import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowSquareOut, Copy, DotsThree, Images, Plus, PencilSimple, SquaresFour, Storefront, Trash } from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import ProductMockup from '../../components/ProductMockup'
import { cn, money, plural } from '../../lib/utils'
import { DEFAULT_CATALOG, LIMITS, original, useCatalogs } from '../../data/storeConfig'
import { useGalleries } from '../../data/galleries'
import { notify } from '../../gallery/lib/actions'
import { TextField } from '../../gallery/templates/cover/controls'
import Modal from '../components/Modal'
import { Menu, PageHeader, Select, Tag } from '../components/ui'

/**
 * Store: the photographer's catalogs. Each gallery sells from one catalog, so a wedding and a
 * newborn shoot can offer different products, packages and prices. Opening one edits it.
 */
export default function CatalogsPage() {
  const { catalogs, remove, summary } = useCatalogs()
  const { galleries, reassignCatalog } = useGalleries()
  const [form, setForm] = useState(null) // null | { from }
  const [renaming, setRenaming] = useState(null)

  const del = (c, usedBy) => {
    const note = usedBy.length ? ` ${plural(usedBy.length, 'gallery', 'galleries')} using it will sell from the Main catalog instead.` : ''
    if (!window.confirm(`Delete “${c.name}”?${note}`)) return
    reassignCatalog(c.id, DEFAULT_CATALOG)
    remove(c.id)
    notify(`${c.name} deleted`)
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-24 pt-6 md:px-8 md:pt-10">
      <PageHeader
        title="Store"
        description="Catalogs are the products, packages and prices a gallery’s clients can order. Make one per kind of shoot, then pick it in each gallery’s settings."
        actions={<Button size="md" onClick={() => setForm({ from: 'all' })}><Plus size={16} /> New catalog</Button>}
      />

      <ul className="mt-8 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {catalogs.map((c) => {
          const sum = summary(c)
          const usedBy = galleries.filter((g) => g.catalogId === c.id)
          return (
            <li key={c.id}>
              <CatalogCard
                c={c}
                sum={sum}
                usedBy={usedBy}
                onRename={() => setRenaming(c)}
                onDuplicate={() => setForm({ from: c.id, name: `${c.name} copy`.slice(0, LIMITS.catalog) })}
                onDelete={() => del(c, usedBy)}
              />
            </li>
          )
        })}
        <li>
          <button
            onClick={() => setForm({ from: 'all' })}
            className="group flex h-full min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border text-type-2 transition hover:border-type-2 hover:text-type-0"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 transition group-hover:scale-105"><Plus size={20} /></span>
            <span className="text-14-m">New catalog</span>
          </button>
        </li>
      </ul>

      <NewCatalog open={!!form} preset={form} onOpenChange={(o) => !o && setForm(null)} />
      <RenameCatalog catalog={renaming} onClose={() => setRenaming(null)} />
    </div>
  )
}

function CatalogCard({ c, sum, usedBy, onRename, onDuplicate, onDelete }) {
  const navigate = useNavigate()
  const to = `/dashboard/store/${c.id}`
  const main = c.id === DEFAULT_CATALOG
  return (
    <div className="group flex h-full flex-col rounded-2xl border border-border bg-surface-1 p-4 transition hover:border-type-3 md:p-5">
      <div className="flex items-start gap-3">
        <Link to={to} className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-16-m text-type-0">{c.name}</span>
            {main && <Tag tone="dark">Main</Tag>}
          </span>
          <span className="mt-0.5 block text-12-r text-type-2">
            {plural(sum.products, 'product')} · {plural(sum.packages, 'package')}{sum.from != null && ` · from ${money(sum.from)}`}
          </span>
        </Link>
        <Menu
          label={`${c.name} options`}
          trigger={({ toggle, open }) => (
            <button onClick={toggle} aria-label={`${c.name} options`} aria-expanded={open} className={cn('-mr-1.5 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-type-2 transition hover:bg-surface-2 hover:text-type-0', open && 'bg-surface-2 text-type-0')}>
              <DotsThree size={20} weight="bold" />
            </button>
          )}
          items={[
            { label: 'Edit catalog', icon: PencilSimple, onClick: () => navigate(to) },
            { label: 'Rename', icon: PencilSimple, onClick: onRename },
            { label: 'Duplicate', icon: Copy, onClick: onDuplicate },
            { label: 'Preview store', icon: ArrowSquareOut, onClick: () => window.open(`/store?catalog=${c.id}`, '_blank') },
            null,
            { label: main ? 'Main catalog can’t be deleted' : 'Delete', icon: Trash, danger: true, disabled: main, onClick: onDelete },
          ]}
        />
      </div>

      <Link to={to} className="mt-4 grid grid-cols-4 gap-2" aria-label={`Edit ${c.name}`}>
        {Array.from({ length: 4 }, (_, i) => {
          const id = sum.thumbs[i]
          return (
            <span key={i} className="aspect-square overflow-hidden rounded-xl bg-surface-2">
              {id && <ProductMockup product={original.productById[id]} className="h-full w-full" />}
            </span>
          )
        })}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-3 text-12-r text-type-2">
        {usedBy.length ? (
          <>
            <Images size={13} className="shrink-0" />
            <span className="min-w-0 truncate">
              {usedBy.length === 1 ? usedBy[0].title : `${plural(usedBy.length, 'gallery', 'galleries')}: ${usedBy.map((g) => g.client).join(', ')}`}
            </span>
          </>
        ) : (
          <span className="text-type-3">Not used by a gallery yet</span>
        )}
        {sum.edits > 0 && <Tag tone="success" className="ml-auto">Customised</Tag>}
      </div>
    </div>
  )
}

const STARTS = [
  { id: 'all', icon: SquaresFour, title: 'Everything', body: 'Every product on, then switch off what you don’t sell' },
  { id: 'none', icon: Storefront, title: 'Nothing', body: 'Everything off, then switch on what you sell' },
  { id: 'copy', icon: Copy, title: 'A copy', body: 'Start from another catalog’s prices and packages' },
]

function NewCatalog({ open, preset, onOpenChange }) {
  const { catalogs, create } = useCatalogs()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [start, setStart] = useState('all')
  const [source, setSource] = useState(DEFAULT_CATALOG)
  const [seen, setSeen] = useState(null)
  // Reset the form each time it opens (Duplicate opens it as a copy of that catalog).
  if (open && preset !== seen) {
    setSeen(preset)
    const copy = preset?.from && preset.from !== 'all' && preset.from !== 'none'
    setName(preset?.name ?? '')
    setStart(copy ? 'copy' : 'all')
    setSource(copy ? preset.from : DEFAULT_CATALOG)
  }

  const submit = (e) => {
    e?.preventDefault()
    if (!name.trim()) return
    const c = create(name, start === 'copy' ? source : start)
    onOpenChange(false)
    notify(`${c.name} created`)
    navigate(`/dashboard/store/${c.id}`)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New catalog"
      description="For a kind of shoot with its own products or prices — weddings, newborns, schools."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={!name.trim()}>Create catalog</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <TextField label="Name" value={name} onChange={setName} limit={LIMITS.catalog} placeholder="Weddings" />
        <div>
          <p className="mb-1.5 text-13-m text-type-0">Start with</p>
          <div className="space-y-2" role="radiogroup" aria-label="Start with">
            {STARTS.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={start === s.id}
                onClick={() => setStart(s.id)}
                className={cn('flex w-full items-center gap-3 rounded-xl border p-3 text-left transition', start === s.id ? 'border-type-0 ring-4 ring-black/5' : 'border-border hover:border-type-3')}
              >
                <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full', start === s.id ? 'bg-primary text-primary-foreground' : 'bg-surface-2 text-type-1')}>
                  <s.icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-13-m text-type-0">{s.title}</span>
                  <span className="block text-12-r text-type-2">{s.body}</span>
                </span>
              </button>
            ))}
          </div>
          {start === 'copy' && (
            <Select label="Catalog to copy" value={source} onChange={setSource} options={catalogs.map((c) => ({ value: c.id, label: c.name }))} className="mt-2 w-full" />
          )}
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}

function RenameCatalog({ catalog, onClose }) {
  const { rename } = useCatalogs()
  const [name, setName] = useState('')
  const [seen, setSeen] = useState(null)
  if (catalog && catalog !== seen) { setSeen(catalog); setName(catalog.name) }
  const submit = (e) => {
    e?.preventDefault()
    if (!name.trim()) return
    rename(catalog.id, name.trim())
    notify('Catalog renamed')
    onClose()
  }
  return (
    <Modal
      open={!!catalog}
      onOpenChange={(o) => !o && onClose()}
      title="Rename catalog"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={!name.trim()}>Save</Button>
        </>
      }
    >
      <form onSubmit={submit}>
        <TextField label="Name" value={name} onChange={setName} limit={LIMITS.catalog} />
      </form>
    </Modal>
  )
}
