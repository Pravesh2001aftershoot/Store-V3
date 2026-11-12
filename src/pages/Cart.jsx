import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Handbag, PencilSimple, Copy, Trash, Package as PackageIcon, ShieldCheck, Truck } from '@phosphor-icons/react'
import { useStore } from '../state/store'
import { lineCompareAt, lineSubtotal, unitPrice, sizeOf } from '../lib/pricing'
import { money, plural } from '../lib/utils'
import { Badge, Button, SplitText } from '../components/ui'
import { LineThumb, lineParts, lineTitle, PartSummary, PhotoStrip, partVariantText } from '../components/CartBits'
import { PromoField, Totals } from '../components/OrderSummary'

const ease = [0.22, 1, 0.36, 1]

function CartLine({ line }) {
  const { dispatch } = useStore()
  const nav = useNavigate()
  const parts = lineParts(line)
  const pkg = line.kind === 'package'
  const compare = lineCompareAt(line)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, transition: { duration: 0.3 } }}
      transition={{ duration: 0.5, ease }}
      className="rounded-2xl border border-border bg-surface-1 p-4"
    >
      <div className="flex gap-4">
        <LineThumb line={line} className="w-24 shrink-0 overflow-hidden rounded-xl sm:w-32" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-16-sb">{lineTitle(line)}</p>
                {pkg && (
                  <Badge tone="success">
                    <PackageIcon size={11} /> Package
                  </Badge>
                )}
              </div>
              {!pkg && <p className="mt-0.5 text-13-r text-type-2">{sizeOf(parts[0].product, parts[0].variant).label} · {partVariantText(parts[0])}</p>}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-16-sb">{money(lineSubtotal(line))}</p>
              {compare && <p className="text-13-r text-type-3 line-through">{money(compare)}</p>}
            </div>
          </div>

          {!pkg ? (
            <div className="mt-3 space-y-2">
              <p className="text-13-r text-type-1">
                <span className="font-medium">Qty {parts[0].product.mode === 'book' ? 1 : parts[0].product.mode === 'set' ? parts[0].photos.length / parts[0].product.setSize : parts[0].photos.length}</span>
                <span className="text-type-3">
                  {' '}· {plural(parts[0].photos.length, 'photo')}
                  {parts[0].product.mode === 'unit' && ` · ${money(unitPrice(parts[0].product, parts[0].variant))} each`}
                </span>
              </p>
              <PhotoStrip part={parts[0]} max={10} />
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {parts.map((p, i) => (
                <div key={i} className="border-l-2 border-border pl-3">
                  <p className="text-13-m text-type-1">
                    <PartSummary part={p} />
                  </p>
                  <p className="mb-1.5 text-12-r text-type-3">{partVariantText(p)}</p>
                  <PhotoStrip part={p} max={8} size="h-8" />
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-1">
            <Button variant="ghost" size="sm" onClick={() => nav(`/build/edit/${line.id}`)}>
              <PencilSimple size={14} /> Edit crops & options
            </Button>
            <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'duplicate', id: line.id })}>
              <Copy size={14} /> Duplicate
            </Button>
            <Button variant="ghost" size="sm" className="hover:text-destructive" onClick={() => dispatch({ type: 'remove', id: line.id })}>
              <Trash size={14} /> Remove
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Cart() {
  const { lines, totals } = useStore()
  const nav = useNavigate()

  if (!lines.length)
    return (
      <div className="mx-auto flex max-w-[560px] flex-col items-center px-4 py-28 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-surface-2">
          <Handbag size={26} />
        </div>
        <h1 className="mt-6 text-30-m">Your cart is empty</h1>
        <p className="mt-2 text-type-2">Pick a product, choose your favourite photos and we’ll take care of the rest.</p>
        <div className="mt-8 flex gap-3">
          <Button as={Link} to="/shop" size="lg" arrow>
            Shop products
          </Button>
          <Button as={Link} to="/packages" size="lg" variant="outline">
            See packages
          </Button>
        </div>
      </div>
    )

  return (
    <div className="mx-auto max-w-[1360px] px-4 pt-10 md:px-8 md:pt-14">
      <SplitText text="Your cart" className="text-48-sb md:text-60-sb" />
      <p className="mt-3 text-type-2">{plural(totals.itemCount, 'item')} · {plural(lines.length, 'line')}</p>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {lines.map((l) => (
              <CartLine key={l.id} line={l} />
            ))}
          </AnimatePresence>
          <Link to="/shop" className="inline-block pt-2 text-14-m text-type-1 underline-offset-4 hover:underline">
            ← Continue shopping
          </Link>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="space-y-5 rounded-2xl border border-border bg-surface-1 p-5">
            <p className="text-16-sb">Summary</p>
            <PromoField />
            <Totals showShipping={false} />
            <Button size="lg" className="h-13 w-full" onClick={() => nav('/checkout')} arrow>
              Checkout
            </Button>
            <div className="space-y-2 border-t border-border pt-4 text-12-r text-type-2">
              <p className="flex items-center gap-2"><ShieldCheck size={15} /> Every crop reviewed by your photographer</p>
              <p className="flex items-center gap-2"><Truck size={15} /> Tracked & insured shipping</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
