import { useEffect, useState } from 'react'
import { Minus, Plus, Trash, Warning, X } from '@phosphor-icons/react'
import { money } from '../../lib/utils'
import { packagePrice, packageValue, slotValue, variantLabel } from '../../lib/pricing'
import { productById } from '../../data/catalog'
import { DISCOUNT, LIMITS, original } from '../../data/storeConfig'
import { notify } from '../../gallery/lib/actions'
import EditorPane from '../../gallery/templates/editor/EditorPane'
import { Section, Slider, Switch, TextField } from '../../gallery/templates/cover/controls'
import { Button } from '../../components/ui'
import { Select } from '../components/ui'

const TABS = [
  { id: 'details', label: 'Details' },
  { id: 'pricing', label: 'Pricing' },
]

/**
 * Edits one package: Details (visibility, name, tagline, Most popular) and Pricing (the discount,
 * with the live price, value and saving). Contents of the catalog's own packages are fixed; packages
 * the photographer built (custom) also edit their contents and can be deleted.
 */
export default function PackageEditor({ id, s, ...pane }) {
  const [tab, setTab] = useState('details')
  useEffect(() => { setTab('details') }, [id])
  const custom = id ? s.cfg.custom.find((p) => p.id === id) : null
  const orig = id && (original.packageById[id] ?? custom)
  const live = orig && s.allPackages.find((p) => p.id === id)
  if (!orig || !live) return <EditorPane {...pane} open={false} tabs={[]} />

  const edit = s.cfg.packages[id] ?? {}
  // Custom packages edit their own name and tagline; catalog packages keep the original as a fallback.
  const setText = (patch) => (custom ? s.editCustom(id, patch) : s.editPackage(id, patch))
  const text = (k) => (custom ? custom[k] : edit[k] ?? orig[k])
  const price = packagePrice(live)
  const value = packageValue(live)

  return (
    <EditorPane
      {...pane}
      modal={false}
      title={live.name}
      subtitle={live.slots.length ? `${money(price)} · ${Math.round(live.discount * 100)}% off${live.hidden ? ' · hidden' : ''}` : 'Add something to sell it'}
      previewLabel="See the list"
      tabs={TABS}
      tab={tab}
      onTab={setTab}
      resetLabel="Reset package"
      onReset={() => { s.resetPackage(id); notify(`${orig.name} reset`) }}
    >
      {tab === 'details' && (
        <div>
          <Section title="In the store">
            <Row label="Show in the store" hint={live.hidden ? 'Clients can’t order it right now' : 'Clients can order it'}>
              <Switch checked={!live.hidden} onChange={(on) => s.editPackage(id, { hidden: !on })} label="Show in the store" />
            </Row>
            <Row label="Most popular" hint="Highlights it among the packages">
              <Switch checked={!!live.popular} onChange={(on) => s.editPackage(id, { popular: on })} label="Most popular" />
            </Row>
          </Section>
          <Section title="How it’s listed">
            <TextField label="Name" value={text('name')} onChange={(v) => setText({ name: v })} limit={LIMITS.name} placeholder={custom ? 'Package name' : orig.name} hint={custom ? undefined : 'Empty uses the original name'} />
            <TextField label="Tagline" value={text('tagline') ?? ''} onChange={(v) => setText({ tagline: v })} limit={LIMITS.tagline} placeholder={custom ? 'One line on what it’s for' : orig.tagline} multiline />
          </Section>
          {custom ? <EditContents pkg={custom} s={s} /> : <Contents live={live} />}
          {custom && (
            <Section title="Delete">
              <Button
                variant="outline"
                size="sm"
                className="self-start text-destructive max-sm:h-10 max-sm:w-full"
                onClick={() => {
                  if (!window.confirm(`Delete “${live.name}”? Clients can no longer order it.`)) return
                  pane.onClose()
                  s.deletePackage(id)
                  notify(`${live.name} deleted`)
                }}
              >
                <Trash size={14} /> Delete package
              </Button>
            </Section>
          )}
        </div>
      )}
      {tab === 'pricing' && (
        <div>
          <Section title="Discount" hint="Off the price of buying each piece on its own, rounded to the nearest $5.">
            <Slider
              label="Package discount"
              value={Math.round(live.discount * 100)}
              onChange={(n) => s.editPackage(id, { discount: n / 100 })}
              min={DISCOUNT.min * 100}
              max={DISCOUNT.max * 100}
              step={DISCOUNT.step * 100}
              format={(n) => `${n}%`}
            />
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-surface-2 p-3 text-center">
              <Figure label="Separately" value={money(value)} muted />
              <Figure label="Package" value={money(price)} />
              <Figure label="Client saves" value={money(value - price)} good />
            </div>
            <p className="text-12-r-p text-type-3">The package price follows your product prices too — change a size’s price and it updates here.</p>
          </Section>
          <Contents live={live} prices />
        </div>
      )}
    </EditorPane>
  )
}

function Row({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-13-m text-type-0">{label}</p>
        {hint && <p className="text-12-r text-type-2">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function Figure({ label, value, muted, good }) {
  return (
    <div>
      <p className="text-11-sb uppercase text-type-3">{label}</p>
      <p className={`mt-1 text-16-sb tabular-nums ${muted ? 'text-type-2 line-through' : good ? 'text-success' : 'text-type-0'}`}>{value}</p>
    </div>
  )
}

/** What's in the package, flagging products that are hidden from the store. */
function Contents({ live, prices }) {
  return (
    <Section title="In this package" hint="Contents come from the catalog.">
      <ul className="divide-y divide-border rounded-xl border border-border">
        {live.slots.map((slot) => {
          const product = productById[slot.productId]
          return (
            <li key={slot.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="grid h-7 min-w-7 place-items-center rounded-full bg-surface-2 px-1.5 text-12-sb tabular-nums text-type-0">{slot.qty}×</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-13-m text-type-0">{product.name}</p>
                <p className="truncate text-12-r text-type-2">{variantLabel(product, slot.variant)}</p>
              </div>
              {product.hidden && (
                <span title="Hidden from the store, but still sold in this package" className="text-amber-600"><Warning size={16} /></span>
              )}
              {prices && <span className="text-13-r tabular-nums text-type-1">{money(slotValue(slot))}</span>}
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

/** A custom package's contents: product, size and quantity per line, plus add and remove. */
function EditContents({ pkg, s }) {
  const products = original.products.map((p) => ({ value: p.id, label: `${p.name}${productById[p.id].hidden ? ' (hidden)' : ''}` }))
  return (
    <Section title="In this package" hint={`Up to ${LIMITS.slots} lines. The client picks a photo for each item.`}>
      {pkg.slots.length === 0 && <p className="rounded-xl bg-surface-2 p-3 text-13-r text-type-2">Empty packages stay hidden from the store. Add a product to sell it.</p>}
      <ul className="space-y-2">
        {pkg.slots.map((slot) => {
          const product = productById[slot.productId]
          const sizes = product.options.find((o) => o.id === 'size').values
          const book = product.mode === 'book'
          return (
            <li key={slot.id} className="rounded-xl border border-border p-2.5">
              <div className="flex items-center gap-2">
                <Select label="Product" value={slot.productId} options={products} onChange={(v) => s.editSlot(pkg.id, slot.id, { productId: v })} className="min-w-0 flex-1" />
                <button
                  onClick={() => s.removeSlot(pkg.id, slot.id)}
                  aria-label={`Remove ${product.name}`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-type-2 transition hover:bg-surface-2 hover:text-type-0"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Select label="Size" value={slot.variant.size} options={sizes.map((v) => ({ value: v.id, label: v.label }))} onChange={(v) => s.editSlot(pkg.id, slot.id, { variant: { ...slot.variant, size: v } })} className="min-w-0 flex-1" />
                {book ? (
                  <span className="shrink-0 text-12-r text-type-3">1 book</span>
                ) : (
                  <Stepper value={slot.qty} onChange={(n) => s.editSlot(pkg.id, slot.id, { qty: n })} label={`${product.name} quantity`} />
                )}
                <span className="w-14 shrink-0 text-right text-13-r tabular-nums text-type-1">{money(slotValue(slot))}</span>
              </div>
              {product.hidden && <p className="mt-2 flex items-center gap-1.5 text-12-r text-amber-600"><Warning size={13} /> Hidden from the store, but still sold in this package</p>}
            </li>
          )
        })}
      </ul>
      <Button variant="outline" size="sm" className="self-start max-sm:h-10 max-sm:w-full" disabled={pkg.slots.length >= LIMITS.slots} onClick={() => s.addSlot(pkg.id)}>
        <Plus size={14} /> Add a product
      </Button>
    </Section>
  )
}

function Stepper({ value, onChange, label }) {
  const btn = 'grid h-9 w-8 place-items-center text-type-1 transition hover:text-type-0 disabled:opacity-30'
  return (
    <span className="flex h-9 shrink-0 items-center rounded-lg border border-input" role="group" aria-label={label}>
      <button className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Fewer"><Minus size={12} /></button>
      <span className="w-6 text-center text-13-m tabular-nums text-type-0">{value}</span>
      <button className={btn} onClick={() => onChange(value + 1)} disabled={value >= LIMITS.qty} aria-label="More"><Plus size={12} /></button>
    </span>
  )
}
