import { useState } from 'react'
import { Tag, X } from '@phosphor-icons/react'
import { useStore, PROMOS } from '../state/store'
import { lineSubtotal } from '../lib/pricing'
import { money } from '../lib/utils'
import { LineThumb, lineParts, lineTitle, PartSummary } from './CartBits'
import { Button } from './ui'

export function PromoField() {
  const { promo, dispatch } = useStore()
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  if (promo)
    return (
      <div className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-13-r">
        <span className="flex items-center gap-1.5 font-medium">
          <Tag size={14} /> {promo} · {PROMOS[promo] * 100}% off
        </span>
        <button onClick={() => dispatch({ type: 'promo', value: null })} className="text-type-2 hover:text-type-0" aria-label="Remove code">
          <X size={14} />
        </button>
      </div>
    )
  const apply = (e) => {
    e.preventDefault()
    const c = code.trim().toUpperCase()
    if (PROMOS[c]) {
      dispatch({ type: 'promo', value: c })
      setErr('')
    } else setErr('That code isn’t valid')
  }
  return (
    <form onSubmit={apply}>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Discount code"
          className="h-10 flex-1 rounded-lg border border-input bg-surface-1 px-3 text-14-r uppercase outline-none placeholder:normal-case placeholder:text-type-3 focus:border-type-0"
        />
        <Button type="submit" variant="secondary" className="rounded-lg">
          Apply
        </Button>
      </div>
      {err && <p className="mt-1 text-12-r text-destructive">{err}</p>}
    </form>
  )
}

export function Totals({ showShipping = true }) {
  const { totals, promo } = useStore()
  const row = (l, v, cls = '') => (
    <div className={`flex items-center justify-between ${cls}`}>
      <span className="text-type-2">{l}</span>
      <span>{v}</span>
    </div>
  )
  return (
    <div className="space-y-2 text-14-r">
      {row('Subtotal', money(totals.subtotal))}
      {promo && row(`Discount (${promo})`, `−${money(totals.promoOff)}`, '[&>span:last-child]:text-success')}
      {showShipping ? row('Shipping', totals.ship ? money(totals.ship) : 'Free') : row('Shipping', 'Calculated next')}
      {row('Estimated tax', money(totals.tax))}
      <div className="flex items-center justify-between border-t border-border pt-3 text-16-sb">
        <span>Total</span>
        <span>{money(showShipping ? totals.total : totals.total - totals.ship)}</span>
      </div>
      {totals.savings + totals.promoOff > 0 && (
        <p className="flex items-center justify-center gap-1.5 rounded-lg bg-success-bg py-2 text-13-r text-success">
          <Tag size={14} /> You’re saving {money(totals.savings + totals.promoOff)} on this order
        </p>
      )}
    </div>
  )
}

export default function OrderSummary({ children }) {
  const { lines } = useStore()
  return (
    <div className="rounded-2xl border border-border bg-surface-1 p-5">
      <p className="mb-4 text-16-sb">Order summary</p>
      <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
        {lines.map((l) => (
          <div key={l.id} className="flex gap-3">
            <LineThumb line={l} className="w-14 shrink-0 overflow-hidden rounded-lg" />
            <div className="min-w-0 flex-1 text-13-r">
              <div className="flex justify-between gap-2">
                <p className="text-13-m">{lineTitle(l)}</p>
                <p>{money(lineSubtotal(l))}</p>
              </div>
              {lineParts(l).map((p, i) => (
                <p key={i} className="text-12-r text-type-2">
                  <PartSummary part={p} />
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-4 border-t border-border pt-5">{children}</div>
    </div>
  )
}
