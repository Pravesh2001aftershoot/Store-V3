import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Reorder, useDragControls } from 'framer-motion'
import { ArrowCounterClockwise, ArrowSquareOut, CaretLeft, CaretRight, DotsSixVertical, Images, Package as PackageIcon, Plus, Storefront } from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import ProductMockup from '../../components/ProductMockup'
import { cn, money, plural } from '../../lib/utils'
import { fromPrice, packageItemCount, packagePrice, packageValue } from '../../lib/pricing'
import { DEFAULT_CATALOG, LIMITS, original, useCatalogs, useStoreConfig } from '../../data/storeConfig'
import { useGalleries } from '../../data/galleries'
import { notify } from '../../gallery/lib/actions'
import { Segmented, Switch } from '../../gallery/templates/cover/controls'
import { Chip, Empty, PageHeader, Stat, Tag } from '../components/ui'
import { useMedia, useTopOffset } from '../lib/hooks'
import { InlineName } from '../components/InlineName'
import ProductEditor from './ProductEditor'
import PackageEditor from './PackageEditor'

const VIEWS = [
  { id: 'products', label: 'Products' },
  { id: 'packages', label: 'Packages' },
]

/**
 * One catalog: what the print store sells to the galleries using it, in what order, and at what
 * price. A list of products (or packages) with quick visibility switches and drag-to-reorder;
 * picking one opens its editor — docked on the right on wide screens, a bottom sheet otherwise.
 */
export default function StoreTab() {
  const { catalogId } = useParams()
  const { catalogs } = useCatalogs()
  if (!catalogs.some((c) => c.id === catalogId)) return <Navigate to="/dashboard/store" replace />
  return <CatalogEditor key={catalogId} catalogId={catalogId} />
}

function CatalogEditor({ catalogId }) {
  const s = useStoreConfig(catalogId)
  const { rename } = useCatalogs()
  const { galleries } = useGalleries()
  const usedBy = galleries.filter((g) => g.catalogId === catalogId)
  const docked = useMedia('(min-width: 1100px)')
  const top = useTopOffset()
  const [view, setView] = useState('products')
  const [cat, setCat] = useState('all')
  const [openId, setOpenId] = useState(null)
  const [peek, setPeek] = useState(false)
  useEffect(() => { setOpenId(null) }, [view])
  useEffect(() => { setPeek(false) }, [openId])

  const live = s.allProducts.filter((p) => !p.hidden)
  const prices = live.map(fromPrice)
  const products = cat === 'all' ? s.allProducts : s.allProducts.filter((p) => p.category === cat)
  const catCount = useMemo(() => Object.fromEntries(s.categories.map((c) => [c.id, s.allProducts.filter((p) => p.category === c.id).length])), [s.allProducts, s.categories])

  // Keep the last one mounted while its sheet slides away.
  const last = useRef(null)
  if (openId) last.current = openId
  const pane = { onClose: () => setOpenId(null), inline: docked, phone: !docked, peek, onPeek: setPeek, open: !!openId, id: openId ?? last.current, s }
  const editor = view === 'products' ? <ProductEditor {...pane} /> : <PackageEditor {...pane} />

  const list = (
    <div className="mx-auto max-w-[1100px] px-4 pb-40 pt-6 md:px-6 md:pt-8">
      <Link to="/dashboard/store" className="-ml-1 inline-flex items-center gap-1 rounded-full px-1 text-13-m text-type-2 transition hover:text-type-0">
        <CaretLeft size={13} /> Catalogs
      </Link>
      <PageHeader
        className="mt-3"
        eyebrow={catalogId === DEFAULT_CATALOG ? 'Main catalog' : 'Catalog'}
        title={<InlineName value={s.catalog.name} onSave={(v) => { rename(catalogId, v); notify('Catalog renamed') }} limit={LIMITS.catalog} label="Catalog name" />}
        description={
          usedBy.length
            ? <>Sold in {usedBy.length === 1 ? <Link to={`/dashboard/galleries/${usedBy[0].id}`} className="text-type-0 underline-offset-2 hover:underline">{usedBy[0].title}</Link> : `${usedBy.length} galleries`}. Changes go live in their print store straight away.</>
            : 'No gallery uses this catalog yet. Pick it in a gallery’s settings to sell from it.'
        }
        actions={
          <>
            {s.edited && (
              <Button variant="ghost" size="sm" onClick={() => window.confirm('Reset every product and package in this catalog to the original? Packages you built stay.') && (s.reset(), setOpenId(null), notify('Catalog reset'))}>
                <ArrowCounterClockwise size={14} /> Reset
              </Button>
            )}
            <Button as="a" href={`/store?catalog=${catalogId}`} target="_blank" rel="noreferrer" variant="outline" size="sm">
              Preview store <ArrowSquareOut size={14} />
            </Button>
          </>
        }
      />
      {usedBy.length > 1 && (
        <div className="no-scrollbar -mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {usedBy.map((g) => (
            <Link key={g.id} to={`/dashboard/galleries/${g.id}`} className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-12-m text-type-1 transition hover:text-type-0">
              <Images size={13} /> {g.title}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl border border-border bg-surface-1 p-4 md:grid-cols-4 md:p-5">
        <Stat label="Products live" value={`${live.length}/${s.allProducts.length}`} hint={plural(s.categories.length, 'category', 'categories')} />
        <Stat label="Packages live" value={`${s.allPackages.filter((p) => !p.hidden).length}/${s.allPackages.length}`} hint="Bundles at a discount" />
        <Stat label="Prices from" value={prices.length ? money(Math.min(...prices)) : '—'} hint={prices.length ? `up to ${money(Math.max(...prices))} starting` : 'Nothing on sale'} />
        <Stat label="Customised" value={s.allProducts.filter((p) => s.isEdited(p.id)).length + s.allPackages.filter((p) => s.isPackageEdited(p.id)).length} hint="Products and packages" />
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:w-[260px]">
            <Segmented options={VIEWS} value={view} onChange={setView} />
          </div>
          {view === 'packages' && (
            <Button size="sm" className="shrink-0 max-sm:h-10 max-sm:w-full" onClick={() => { const pkg = s.createPackage('New package'); setOpenId(pkg.id); notify('Package added — choose what’s in it') }}>
              <Plus size={14} /> New package
            </Button>
          )}
        </div>
        {view === 'products' && (
          <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <Chip active={cat === 'all'} count={s.allProducts.length} onClick={() => setCat('all')}>All</Chip>
            {s.categories.map((c) => (
              <Chip key={c.id} active={cat === c.id} count={catCount[c.id]} onClick={() => setCat(c.id)}>{c.name}</Chip>
            ))}
          </div>
        )}
      </div>
      <p className="mt-3 text-12-r text-type-3">
        {view === 'packages' || cat === 'all' ? 'Drag the handle to reorder — clients see them in this order.' : 'Showing one category. Choose All to reorder.'}
      </p>

      {view === 'products' ? (
        products.length === 0 ? (
          <Empty icon={Storefront} title="No products in this category" />
        ) : cat === 'all' ? (
          <Reorder.Group axis="y" values={products.map((p) => p.id)} onReorder={s.setOrder} className="mt-3 space-y-2">
            {products.map((p) => (
              <Sortable key={p.id} id={p.id}>
                {(handle) => <ProductRow p={p} s={s} active={openId === p.id} onOpen={() => setOpenId(p.id)} handle={handle} />}
              </Sortable>
            ))}
          </Reorder.Group>
        ) : (
          <div className="mt-3 space-y-2">
            {products.map((p) => <ProductRow key={p.id} p={p} s={s} active={openId === p.id} onOpen={() => setOpenId(p.id)} />)}
          </div>
        )
      ) : (
        s.allPackages.length === 0 ? (
          <Empty icon={PackageIcon} title="No packages yet" action={<Button size="sm" onClick={() => setOpenId(s.createPackage('New package').id)}><Plus size={14} /> New package</Button>}>
            Bundle a few products at a discount.
          </Empty>
        ) : (<Reorder.Group axis="y" values={s.allPackages.map((p) => p.id)} onReorder={s.setPackageOrder} className="mt-3 space-y-2">
          {s.allPackages.map((p) => (
            <Sortable key={p.id} id={p.id}>
              {(handle) => <PackageRow p={p} s={s} active={openId === p.id} onOpen={() => setOpenId(p.id)} handle={handle} />}
            </Sortable>
          ))}
        </Reorder.Group>
        )
      )}
    </div>
  )

  if (docked) {
    return (
      <div className="flex" style={{ height: `calc(100svh - ${top}px)` }}>
        <div className="min-w-0 flex-1 overflow-y-auto">{list}</div>
        <aside className="flex w-[420px] shrink-0 flex-col border-l border-border bg-surface-1">
          {openId ? editor : (
            <div className="grid flex-1 place-items-center p-8 text-center">
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-type-1">
                  {view === 'products' ? <Storefront size={22} /> : <PackageIcon size={22} />}
                </span>
                <p className="mt-4 text-16-m text-type-0">Pick a {view === 'products' ? 'product' : 'package'}</p>
                <p className="mt-1 text-14-r-p text-type-2">Edit its name, {view === 'products' ? 'sizes, prices and options' : 'discount and contents'} here.</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    )
  }

  return (
    <div>
      {list}
      {editor}
    </div>
  )
}

/** A row that can be dragged by its handle only, so the rest of the row stays tappable and scrollable. */
function Sortable({ id, children }) {
  const controls = useDragControls()
  return (
    <Reorder.Item value={id} dragListener={false} dragControls={controls} className="relative" whileDrag={{ scale: 1.01, boxShadow: '0 20px 40px -20px rgba(0,0,0,.35)', zIndex: 10 }}>
      {children(
        <button
          onPointerDown={(e) => controls.start(e)}
          aria-label="Drag to reorder"
          title="Drag to reorder"
          className="grid h-10 w-7 shrink-0 cursor-grab touch-none place-items-center rounded-md text-type-3 transition hover:bg-surface-2 hover:text-type-0 active:cursor-grabbing"
        >
          <DotsSixVertical size={18} weight="bold" />
        </button>
      )}
    </Reorder.Item>
  )
}

function Row({ active, hidden, onOpen, handle, thumb, title, tags, meta, price, toggle }) {
  return (
    <div className={cn('flex items-center gap-2 rounded-2xl border bg-surface-1 p-2 pr-3 transition sm:gap-3', active ? 'border-type-0 ring-4 ring-black/5' : 'border-border hover:border-type-3')}>
      {handle ?? <span className="w-1" />}
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className={cn('h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-2 transition', hidden && 'opacity-40 grayscale')}>{thumb}</span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className={cn('truncate text-14-m', hidden ? 'text-type-2' : 'text-type-0')}>{title}</span>
            {tags}
          </span>
          <span className="block truncate text-12-r text-type-2">{meta}</span>
        </span>
        <span className="hidden shrink-0 text-right sm:block">{price}</span>
        <CaretRight size={14} className="shrink-0 text-type-3" />
      </button>
      {toggle}
    </div>
  )
}

const MODE = { unit: 'One photo per item', set: 'Photo set', book: 'Album / book' }

function ProductRow({ p, s, active, onOpen, handle }) {
  const orig = original.productById[p.id]
  const now = fromPrice(p)
  const was = fromPrice(orig)
  const category = s.categories.find((c) => c.id === p.category)?.name
  return (
    <Row
      active={active}
      hidden={p.hidden}
      onOpen={onOpen}
      handle={handle}
      // The store's own mockup, scaled down: rendered at card size, then fitted to the thumbnail.
      thumb={<span className="block h-[224px] w-[224px] origin-top-left scale-[0.25]"><ProductMockup product={p} /></span>}
      title={p.name}
      tags={<>{p.hidden && <Tag>Hidden</Tag>}{s.isEdited(p.id) && !p.hidden && <Tag tone="success">Edited</Tag>}{p.badge && !p.hidden && <Tag className="max-sm:hidden">{p.badge}</Tag>}</>}
      meta={`${category} · ${MODE[p.mode]} · ${p.options.find((o) => o.id === 'size').values.length} sizes`}
      price={
        <>
          <span className="block text-11-r text-type-3">from</span>
          <span className="text-14-m tabular-nums text-type-0">{money(now)}</span>
          {now !== was && <span className="ml-1 text-12-r tabular-nums text-type-3 line-through">{money(was)}</span>}
        </>
      }
      toggle={<Switch checked={!p.hidden} onChange={(on) => { s.editProduct(p.id, { hidden: !on }); notify(on ? `${p.name} is back in the store` : `${p.name} hidden from the store`) }} label={`Show ${p.name} in the store`} />}
    />
  )
}

function PackageRow({ p, s, active, onOpen, handle }) {
  const price = packagePrice(p)
  const value = packageValue(p)
  return (
    <Row
      active={active}
      hidden={p.hidden}
      onOpen={onOpen}
      handle={handle}
      thumb={<span className="grid h-full w-full place-items-center text-type-1"><PackageIcon size={24} /></span>}
      title={p.name}
      tags={<>{p.hidden && <Tag>{p.slots.length ? 'Hidden' : 'Empty'}</Tag>}{s.isCustom(p.id) && !p.hidden && <Tag tone="dark">Yours</Tag>}{s.isPackageEdited(p.id) && !p.hidden && !s.isCustom(p.id) && <Tag tone="success">Edited</Tag>}{p.popular && !p.hidden && <Tag tone="dark" className="max-sm:hidden">Popular</Tag>}</>}
      meta={`${plural(packageItemCount(p), 'item')} · ${Math.round(p.discount * 100)}% off`}
      price={
        <>
          <span className="text-14-m tabular-nums text-type-0">{money(price)}</span>
          <span className="block text-12-r tabular-nums text-type-3 line-through">{money(value)}</span>
        </>
      }
      toggle={<Switch checked={!p.hidden} onChange={(on) => { s.editPackage(p.id, { hidden: !on }); notify(on ? `${p.name} is back in the store` : `${p.name} hidden from the store`) }} label={`Show ${p.name} in the store`} />}
    />
  )
}
