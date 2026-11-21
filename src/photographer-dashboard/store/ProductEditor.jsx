import { useEffect, useState } from 'react'
import { ArrowCounterClockwise, Info, Plus, Warning, X } from '@phosphor-icons/react'
import { cn, money } from '../../lib/utils'
import { original, DISCOUNT, FILE_EDGES, LIMITS } from '../../data/storeConfig'
import { gallerySale } from '../../data/catalog'
import { notify } from '../../gallery/lib/actions'
import EditorPane from '../../gallery/templates/editor/EditorPane'
import { Section, Slider, Switch, TextField } from '../../gallery/templates/cover/controls'
import { Button } from '../../components/ui'
import { Checkbox, PriceInput, Select } from '../components/ui'

const MODE_HINT = {
  unit: 'Each photo the client picks makes one item, so more photos means a higher quantity.',
  set: 'Every few photos make one item (a triptych takes three).',
  book: 'One item holding a range of photos. Photos above the minimum cost extra.',
  gallery: 'One item covering every photo in the gallery, including ones added later. Nothing to pick.',
}

/**
 * Edits one product: Details (visibility, name, tagline, badge), Sizes (price per size, which sizes
 * are offered) and Options (add-on price per choice, which choices are offered). Values the
 * photographer hasn't touched show the catalog's own.
 */
export default function ProductEditor({ id, s, ...pane }) {
  const [tab, setTab] = useState('details')
  useEffect(() => { setTab('details') }, [id])
  const orig = id && original.productById[id]
  if (!orig) return <EditorPane {...pane} open={false} tabs={[]} />

  const live = s.allProducts.find((p) => p.id === id)
  const edit = s.cfg.products[id] ?? {}
  const extras = orig.options.filter((o) => o.id !== 'size')
  // Digital Download sells several file versions (resolution × watermark), each with its own price.
  const versions = orig.digital && orig.mode === 'unit'
  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'sizes', label: orig.digital ? 'Files' : 'Sizes' },
    ...(extras.length ? [{ id: 'options', label: 'Options' }] : []),
  ]

  const priceOf = (opt, v) => edit.prices?.[opt.id]?.[v.id] ?? (opt.id === 'size' ? v.price : v.delta ?? 0)
  const isOff = (opt, v) => edit.off?.[opt.id]?.includes(v.id) ?? false
  const toggle = (opt, v) => {
    const offered = opt.values.filter((x) => !isOff(opt, x))
    if (!isOff(opt, v) && offered.length === 1) return notify(`${opt.label} needs at least one choice`)
    s.toggleValue(id, opt.id, v.id)
  }

  return (
    <EditorPane
      {...pane}
      modal={false}
      title={live.name}
      subtitle={live.hidden ? 'Hidden from the store' : s.isEdited(id) ? 'Customised' : 'As in the catalog'}
      previewLabel="See the list"
      tabs={tabs}
      tab={tab}
      onTab={setTab}
      resetLabel="Reset product"
      onReset={() => { s.resetProduct(id); notify(`${orig.name} reset`) }}
    >
      {tab === 'details' && <Details id={id} s={s} orig={orig} live={live} edit={edit} />}
      {tab === 'sizes' && versions && (
        <Section
          title="Files"
          hint={`The versions clients can buy, each with its own price per photo and, if you like, a price for the whole gallery. Galleries sell them unless they make High res free. Up to ${LIMITS.files}.`}
        >
          <FileList
            files={live.options.find((o) => o.id === 'size').values.map((v) => ({ id: v.id, edge: v.edge ?? null, watermark: !!v.watermark, price: v.price, gallery: v.gallery ?? { on: false, price: 0, discount: 0 } }))}
            onChange={(files) => s.editProduct(id, { files })}
          />
        </Section>
      )}
      {tab === 'sizes' && orig.galleryOf && (
        <Section title="Files" hint="The whole gallery sells in each Digital Download file that has a whole-gallery price. Set those prices and discounts in Digital Download → Files.">
          <ul className="space-y-1.5">
            {live.options.find((o) => o.id === 'size').values.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate text-13-m text-type-0">{v.label}</span>
                  <span className="block truncate text-12-r text-type-3">{v.note}{v.discount ? ` · ${Math.round(v.discount * 100)}% off` : ''}</span>
                </span>
                <span className="shrink-0 text-13-m tabular-nums text-type-0">
                  {money(v.price)}
                  {v.compareAt && <s className="ml-1.5 text-12-r text-type-3">{money(v.compareAt)}</s>}
                </span>
              </li>
            ))}
          </ul>
          {live.hidden && <p className="text-12-r text-type-3">No file has a whole-gallery price, so it isn’t offered.</p>}
        </Section>
      )}
      {tab === 'sizes' && !versions && !orig.galleryOf && (
        <Section
          title={orig.digital ? 'Price' : 'Sizes'}
          hint={orig.digital
            ? orig.mode === 'gallery' ? 'One price for every photo in the gallery, as original files.' : 'Price per photo, as the original file. Galleries sell High res at this price unless they make it free.'
            : 'Base price for each size. Switch a size off to stop offering it.'}
        >
          <ValueList opt={orig.options.find((o) => o.id === 'size')} priceOf={priceOf} isOff={isOff} onToggle={toggle} onPrice={(opt, v, n) => s.setPrice(id, opt.id, v.id, n)} />
        </Section>
      )}
      {tab === 'options' && extras.map((opt) => (
        <Section key={opt.id} title={opt.label} hint="Added to the size price. 0 means included.">
          <ValueList opt={opt} priceOf={priceOf} isOff={isOff} onToggle={toggle} onPrice={(o, v, n) => s.setPrice(id, o.id, v.id, n)} prefix="+$" />
        </Section>
      ))}
    </EditorPane>
  )
}

function Details({ id, s, orig, live, edit }) {
  const usedIn = s.allPackages.filter((p) => p.slots.some((x) => x.productId === id))
  const category = s.categories.find((c) => c.id === orig.category)?.name
  return (
    <div>
      <Section title="In the store">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-13-m text-type-0">Show in the store</p>
            <p className="text-12-r text-type-2">{live.hidden ? 'Clients can’t order it right now' : 'Clients can order it'}</p>
          </div>
          <Switch checked={!live.hidden} onChange={(on) => s.editProduct(id, { hidden: !on })} label="Show in the store" />
        </div>
        {live.hidden && usedIn.length > 0 && (
          <p className="flex gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-12-r-p text-amber-800">
            <Warning size={16} className="mt-px shrink-0" />
            Still sold inside {usedIn.map((p) => p.name).join(', ')}. Hide {usedIn.length === 1 ? 'that package' : 'those packages'} too to stop it completely.
          </p>
        )}
      </Section>
      <Section title="How it’s listed">
        <TextField label="Name" value={edit.name ?? orig.name} onChange={(v) => s.editProduct(id, { name: v })} limit={LIMITS.name} placeholder={orig.name} hint="Empty uses the original name" />
        <TextField label="Tagline" value={edit.tagline ?? orig.tagline ?? ''} onChange={(v) => s.editProduct(id, { tagline: v })} limit={LIMITS.tagline} placeholder={orig.tagline} multiline />
        <TextField label="Badge" value={edit.badge ?? orig.badge ?? ''} onChange={(v) => s.editProduct(id, { badge: v })} limit={LIMITS.badge} placeholder="e.g. Bestseller" hint="A small label on the product card. Empty for none." />
      </Section>
      <Section title="About this product">
        <dl className="space-y-2 text-13-r">
          <div className="flex justify-between gap-4"><dt className="text-type-2">Category</dt><dd className="text-type-0">{category}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-type-2">Packages</dt><dd className="text-right text-type-0">{usedIn.length ? usedIn.map((p) => p.name).join(', ') : 'None'}</dd></div>
        </dl>
        <p className="flex gap-2 rounded-xl bg-surface-2 px-3 py-2.5 text-12-r-p text-type-2">
          <Info size={16} className="mt-px shrink-0" />
          {MODE_HINT[orig.mode]}
          {orig.mode === 'book' && ` ${orig.book.min}–${orig.book.max} photos, ${money(orig.book.perExtra)} per extra photo.`}
        </p>
      </Section>
    </div>
  )
}

/** One option's choices: swatch / label, price, offered on/off. */
function ValueList({ opt, priceOf, isOff, onToggle, onPrice, prefix }) {
  return (
    <ul className="space-y-1.5">
      {opt.values.map((v) => {
        const off = isOff(opt, v)
        const was = opt.id === 'size' ? v.price : v.delta ?? 0
        const now = priceOf(opt, v)
        return (
          <li key={v.id} className={cn('flex items-center gap-3 rounded-xl border border-border p-2 pl-3 transition', off && 'bg-surface-2/60')}>
            {v.hex && <span className="h-6 w-6 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: v.hex }} />}
            <div className={cn('min-w-0 flex-1', off && 'opacity-50')}>
              <p className="truncate text-13-m text-type-0">{v.label}</p>
              <p className="truncate text-12-r text-type-3">
                {now !== was ? (
                  <button onClick={() => onPrice(opt, v, null)} className="inline-flex items-center gap-1 hover:text-type-0" title="Back to the original price">
                    was {prefix ? `+${money(was)}` : money(was)} <ArrowCounterClockwise size={11} />
                  </button>
                ) : off ? 'Not offered' : v.note ?? 'Offered'}
              </p>
            </div>
            <PriceInput value={now} original={was} onChange={(n) => onPrice(opt, v, n)} label={`${v.label} price`} prefix={prefix} className={cn(off && 'opacity-50')} />
            <Switch checked={!off} onChange={() => onToggle(opt, v)} label={`Offer ${v.label}`} />
          </li>
        )
      })}
    </ul>
  )
}

const RESOLUTIONS = [
  { value: 'original', label: 'Original resolution' },
  ...FILE_EDGES.map((e) => ({ value: String(e), label: `${e.toLocaleString('en-US')}px long edge` })),
]
const fileName = (f) => `${f.edge ? `${f.edge.toLocaleString('en-US')}px` : 'Original'}${f.watermark ? ', watermarked' : ''}`

/**
 * Digital Download's file versions: a resolution (the original, or a long edge in px), whether it's
 * watermarked, and a price. Add, change or remove them; at least one stays.
 */
function FileList({ files, onChange }) {
  const set = (fid, patch) => onChange(files.map((f) => (f.id === fid ? { ...f, ...patch } : f)))
  const same = (f) => files.some((g) => g.id !== f.id && g.edge === f.edge && g.watermark === f.watermark)
  const add = () => {
    const used = new Set(files.filter((f) => !f.watermark).map((f) => f.edge))
    const edge = [null, ...FILE_EDGES].find((e) => !used.has(e))
    const price = Math.min(...files.map((f) => f.price))
    onChange([...files, { id: `f-${Date.now().toString(36)}`, edge: edge === undefined ? FILE_EDGES.at(-1) : edge, watermark: edge === undefined, price, gallery: { on: false, price: 0, discount: 0 } }])
  }
  return (
    <>
      <ul className="space-y-2">
        {files.map((f) => (
          <li key={f.id} className="space-y-2.5 rounded-xl border border-border p-2.5">
            <div className="flex items-center gap-2">
              <Select
                label={`${fileName(f)} resolution`}
                value={f.edge ? String(f.edge) : 'original'}
                onChange={(v) => set(f.id, { edge: v === 'original' ? null : Number(v) })}
                options={RESOLUTIONS}
                className="min-w-0 flex-1"
              />
              <PriceInput value={f.price} onChange={(n) => set(f.id, { price: n ?? 0 })} label={`${fileName(f)} price`} />
              <button
                onClick={() => onChange(files.filter((g) => g.id !== f.id))}
                disabled={files.length === 1}
                aria-label={`Remove ${fileName(f)}`}
                title={`Remove ${fileName(f)}`}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-type-2 transition hover:bg-surface-2 hover:text-type-0 disabled:pointer-events-none disabled:opacity-30"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pl-0.5">
              <Checkbox checked={f.watermark} onChange={(v) => set(f.id, { watermark: v })}>Watermark</Checkbox>
              {same(f) && <span className="text-12-r text-amber-700">Same as another file</span>}
            </div>
            <WholeGallery
              name={fileName(f)}
              gallery={f.gallery}
              each={f.price}
              onChange={(patch) => set(f.id, { gallery: { ...f.gallery, ...patch } })}
            />
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" className="self-start max-sm:h-10 max-sm:w-full" disabled={files.length >= LIMITS.files} onClick={add}>
        <Plus size={14} /> Add a file
      </Button>
      {files.length === 1 && <p className="text-12-r text-type-3">Digital Download needs at least one file.</p>}
    </>
  )
}

/** A whole-gallery price that switches orders of this many photos or fewer gets a warning. */
const RISKY_PHOTOS = 3

/**
 * A file version's whole-gallery offer: on/off, its price and a discount (0–40%, like packages) that
 * sets what clients pay, shown with the full price struck through.
 */
function WholeGallery({ name, gallery, each, onChange }) {
  const sale = gallerySale(gallery)
  // Orders switch to the whole gallery once photos one by one would cost more, so a whole-gallery price
  // within a few photos' worth undercuts per-photo sales. Warn (don't block) up to 3 photos.
  const switchAt = each > 0 ? Math.floor(sale / each) + 1 : Infinity
  const risk = !gallery.on || switchAt > RISKY_PHOTOS ? null
    : switchAt === 1 ? `Cheaper than one photo (${money(each)}): buying any single photo will get the whole gallery for ${money(sale)} instead.`
    : `Clients buying just ${switchAt} photos would get the whole gallery for ${money(sale)} instead of paying ${money(switchAt * each)}.`
  return (
    <div className="border-t border-border pt-2.5 pl-0.5">
      <Checkbox
        checked={gallery.on}
        onChange={(on) => onChange(on && !gallery.price ? { on, price: Math.max(each * 10, 1) } : { on })}
      >
        Sell the whole gallery in this file
      </Checkbox>
      {gallery.on && (
        <div className="ml-7 mt-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-13-m text-type-0">Whole-gallery price</span>
            <PriceInput value={gallery.price} onChange={(n) => onChange({ price: n ?? 0 })} label={`${name} whole-gallery price`} />
          </div>
          <Slider
            label="Discount"
            value={Math.round(gallery.discount * 100)}
            onChange={(n) => onChange({ discount: n / 100 })}
            min={DISCOUNT.min * 100}
            max={DISCOUNT.max * 100}
            step={DISCOUNT.step * 100}
            format={(n) => (n ? `${n}% off` : 'None')}
          />
          <p className="flex flex-wrap items-baseline gap-x-1.5 rounded-lg bg-surface-2 px-3 py-2 text-12-r text-type-2">
            Clients pay <span className="text-13-m tabular-nums text-type-0">{money(sale)}</span>
            {gallery.discount > 0 && <s className="tabular-nums text-type-3">{money(gallery.price)}</s>}
            {gallery.discount > 0 && <span className="text-success">· save {money(gallery.price - sale)}</span>}
            <span>for every photo, including ones added later</span>
          </p>
          {risk && (
            <p className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-12-r-p text-amber-800">
              <Warning size={16} className="mt-px shrink-0" />
              <span>{risk}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
