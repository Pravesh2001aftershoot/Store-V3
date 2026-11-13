import { useEffect, useState } from 'react'
import { ArrowCounterClockwise, Info, Warning } from '@phosphor-icons/react'
import { cn, money } from '../../lib/utils'
import { original, LIMITS } from '../../data/storeConfig'
import { notify } from '../../gallery/lib/actions'
import EditorPane from '../../gallery/templates/editor/EditorPane'
import { Section, Switch, TextField } from '../../gallery/templates/cover/controls'
import { PriceInput } from '../components/ui'

const MODE_HINT = {
  unit: 'Each photo the client picks makes one item, so more photos means a higher quantity.',
  set: 'Every few photos make one item (a triptych takes three).',
  book: 'One item holding a range of photos. Photos above the minimum cost extra.',
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
  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'sizes', label: 'Sizes' },
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
      {tab === 'sizes' && (
        <Section title="Sizes" hint="Base price for each size. Switch a size off to stop offering it.">
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
