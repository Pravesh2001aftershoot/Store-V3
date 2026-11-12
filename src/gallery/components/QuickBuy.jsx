import { useReducer, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowRight,
  CaretRight,
  CheckCircle,
  Hand,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Minus,
  Plus,
  Rectangle,
  Storefront,
  Warning,
  X,
} from '@phosphor-icons/react'
import { productById } from '../../data/catalog'
import { gallery } from '../../data/gallery'
import { cellAspect, defaultOrientation, defaultVariant, frameInches, fromPrice, sizeOf, unitPrice } from '../../lib/pricing'
import { DEFAULT_CROP, printDpi, quality } from '../../lib/crop'
import { useStore } from '../../state/store'
import { AnimatedNumber, Badge, Button } from '../../components/ui'
import ProductMockup from '../../components/ProductMockup'
import OptionGroup from '../../components/OptionGroup'
import CropEditor from '../../components/CropEditor'
import { cn, money } from '../../lib/utils'

// A short list of single-photo products. The full range (sets, albums, packages) lives in the store.
const QUICK_PRODUCTS = ['framed-print', 'canvas', 'metal', 'fine-art-print'].map((id) => productById[id])
const STEPS = ['Product', 'Size & finish', 'Crop']
const MAX_QTY = 20
const ease = [0.22, 1, 0.36, 1]

/**
 * Quick buy: a side panel that turns one gallery photo into a print without leaving the gallery.
 * Same flow as the store (product → options → crop → cart) with fewer products, and the photo already chosen.
 * `photo` must already be registered with the store (see `registerPhoto`); null closes the panel.
 */
export default function QuickBuy({ photo, onClose }) {
  // Keep the last photo so the panel can animate out after `photo` goes null.
  const last = useRef(photo)
  if (photo) last.current = photo
  const open = !!photo

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild aria-describedby={undefined}>
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.55, ease }}
                className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col bg-surface-1 shadow-2xl sm:inset-y-2 sm:right-2 sm:rounded-2xl"
              >
                <Flow key={last.current.id} photo={last.current} onClose={onClose} />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

// ---------------------------------------------------------------------------
// Flow state machine
//
//   PRODUCT ──pick──▶ OPTIONS ──next──▶ CROP ──added──▶ ADDED
//      ▲                 │  ◀──back──     │                │
//      └──────back───────┘                │                │
//      └───────────────────restart────────────────────────┘
//
// `product`, `variant` and `entry` are set together by `pick`, the only way out of PRODUCT,
// so every later step can rely on them. Events that don't apply to the current step are ignored.

const QB ={ PRODUCT: 0, OPTIONS: 1, CROP: 2, ADDED: 3 }
const FLOW_START = { step: QB.PRODUCT, dir: 1, product: null, variant: null, qty: 1, entry: null }
const resolve = (next, prev) => (typeof next === 'function' ? next(prev) : next)

function flowReducer(s, a) {
  switch (a.type) {
    case 'pick':
      if (s.step !== QB.PRODUCT) return s
      return {
        step: QB.OPTIONS,
        dir: 1,
        product: a.product,
        variant: defaultVariant(a.product),
        qty: 1,
        entry: { photoId: a.photo.id, crop: DEFAULT_CROP, orientation: defaultOrientation(a.product, a.photo) },
      }
    case 'next':
      return s.step === QB.OPTIONS ? { ...s, step: QB.CROP, dir: 1 } : s
    case 'back':
      return s.step === QB.OPTIONS || s.step === QB.CROP ? { ...s, step: s.step - 1, dir: -1 } : s
    case 'added':
      return s.step === QB.CROP ? { ...s, step: QB.ADDED, dir: 1 } : s
    case 'restart':
      return s.step === QB.ADDED ? { ...FLOW_START, dir: -1 } : s
    case 'option':
      return { ...s, variant: { ...s.variant, [a.id]: a.value } }
    case 'qty':
      return { ...s, qty: resolve(a.qty, s.qty) }
    case 'entry':
      return { ...s, entry: resolve(a.entry, s.entry) }
    default:
      return s
  }
}

function Flow({ photo, onClose }) {
  const { dispatch, totals } = useStore()
  const nav = useNavigate()
  const bodyRef = useRef(null)
  const [flow, send] = useReducer(flowReducer, FLOW_START)
  const { step, dir, product, variant, qty, entry } = flow

  const pick = (p) => send({ type: 'pick', product: p, photo })
  const setQty = (q) => send({ type: 'qty', qty: q })
  const setEntry = (e) => send({ type: 'entry', entry: e })

  const addToCart = () => {
    dispatch({
      type: 'add',
      line: { kind: 'product', productId: product.id, variant, photos: Array.from({ length: qty }, () => ({ ...entry })) },
    })
    send({ type: 'added' })
  }

  const leave = (to) => {
    onClose()
    nav(to)
  }

  const total = product ? unitPrice(product, variant) * qty : 0
  const size = product && sizeOf(product, variant)

  return (
    <>
      {/* header */}
      <div className="border-b border-border px-5 pb-3 pt-4">
        <div className="flex items-center gap-2">
          {step === QB.OPTIONS || step === QB.CROP ? (
            <button
              onClick={() => send({ type: 'back' })}
              aria-label="Back"
              className="-ml-1.5 grid h-9 w-9 place-items-center rounded-full transition hover:bg-surface-2"
            >
              <ArrowLeft size={16} />
            </button>
          ) : null}
          <Dialog.Title className="min-w-0 flex-1 truncate text-16-sb">
            {step === QB.ADDED ? 'Added to cart' : step === QB.PRODUCT ? 'Buy a print' : product.name}
          </Dialog.Title>
          <Dialog.Close className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 transition hover:bg-[#ececec]" aria-label="Close">
            <X size={16} />
          </Dialog.Close>
        </div>
        {step !== QB.ADDED && (
          <div className="mt-3 grid grid-cols-3 gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>
            {STEPS.map((s, i) => (
              <div key={s}>
                <div className="h-1 overflow-hidden rounded-full bg-surface-2">
                  <motion.div
                    className="h-full rounded-full bg-type-0"
                    initial={false}
                    animate={{ width: i <= step ? '100%' : '0%' }}
                    transition={{ duration: 0.45, ease }}
                  />
                </div>
                {/* labels drop on short screens (phone landscape) to leave room for the step itself */}
                <p className={cn('mt-1.5 text-11-m [@media(max-height:480px)]:hidden', i === step ? 'text-type-0' : 'text-type-3')}>{s}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* body */}
      <div ref={bodyRef} className="relative flex-1 overflow-y-auto overflow-x-hidden">
        {/* each step starts at the top, once the previous one has animated out */}
        <AnimatePresence mode="wait" initial={false} custom={dir} onExitComplete={() => bodyRef.current?.scrollTo(0, 0)}>
          <motion.div
            key={step}
            custom={dir}
            variants={{
              enter: (d) => ({ opacity: 0, x: d * 24 }),
              center: { opacity: 1, x: 0 },
              exit: (d) => ({ opacity: 0, x: d * -24 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease }}
            className="p-5"
          >
            {step === QB.PRODUCT && <ProductStep photo={photo} onPick={pick} onStore={() => leave('/store')} />}
            {step === QB.OPTIONS && (
              <OptionsStep
                product={product}
                variant={variant}
                entry={entry}
                qty={qty}
                setQty={setQty}
                onOption={(id, value) => send({ type: 'option', id, value })}
              />
            )}
            {step === QB.CROP && <CropStep photo={photo} product={product} variant={variant} entry={entry} setEntry={setEntry} />}
            {step === QB.ADDED && (
              <AddedStep
                product={product}
                variant={variant}
                entry={entry}
                qty={qty}
                total={total}
                itemCount={totals.itemCount}
                onCheckout={() => leave('/checkout')}
                onCart={() => leave('/cart')}
                onAnother={() => send({ type: 'restart' })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* action bar */}
      {(step === QB.OPTIONS || step === QB.CROP) && (
        <div className="flex items-center gap-3 border-t border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-12-r text-type-2">
              {qty} × {product.name} · {size.label}
            </p>
            <p className="text-16-sb">
              <AnimatedNumber value={total} format={money} />
            </p>
          </div>
          {step === QB.OPTIONS ? (
            <Button size="lg" onClick={() => send({ type: 'next' })}>
              Continue<span className="max-sm:hidden"> to crop</span> <ArrowRight size={16} />
            </Button>
          ) : (
            <Button size="lg" onClick={addToCart}>
              Add to cart <ArrowRight size={16} />
            </Button>
          )}
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------

function ProductStep({ photo, onPick, onStore }) {
  return (
    <div>
      <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-2.5">
        <img src={photo.thumb} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0">
          <p className="text-13-m text-type-0">Your photo</p>
          <p className="truncate text-12-r text-type-2">{photo.name}</p>
        </div>
      </div>

      <p className="mb-3 mt-6 text-13-m text-type-0">What would you like to make?</p>
      <div className="space-y-2">
        {QUICK_PRODUCTS.map((p) => {
          const items = [{ photoId: photo.id, crop: DEFAULT_CROP, orientation: defaultOrientation(p, photo) }]
          return (
            <button
              key={p.id}
              onClick={() => onPick(p)}
              className="group flex w-full items-center gap-3.5 rounded-xl border border-border bg-surface-1 p-2 pr-3 text-left transition hover:border-type-3"
            >
              <ProductMockup product={p} items={items} className="aspect-square w-[84px] shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-14-sb text-type-0">{p.name}</p>
                  {p.badge && <Badge tone="muted">{p.badge}</Badge>}
                </div>
                <p className="mt-0.5 line-clamp-2 text-12-r text-type-2">{p.tagline}</p>
                <p className="mt-1 text-13-m text-type-0">From {money(fromPrice(p))}</p>
              </div>
              <CaretRight size={16} className="shrink-0 text-type-3 transition group-hover:translate-x-0.5 group-hover:text-type-0" />
            </button>
          )
        })}
      </div>

      <button
        onClick={onStore}
        className="mt-5 flex w-full items-center justify-between rounded-xl px-3 py-3 text-13-r text-type-1 transition hover:bg-surface-2 hover:text-type-0"
      >
        <span className="flex items-center gap-2">
          <Storefront size={16} /> Albums, sets and packages are in the full store
        </span>
        <ArrowRight size={14} />
      </button>
    </div>
  )
}

function OptionsStep({ product, variant, entry, qty, setQty, onOption }) {
  return (
    <div>
      <ProductMockup product={product} variant={variant} items={[entry]} className="aspect-[5/4] rounded-xl" />
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <p className="text-13-r text-type-2">{product.tagline}</p>
        <p className="shrink-0 text-14-m">
          <AnimatedNumber value={unitPrice(product, variant)} format={money} />
          <span className="text-12-r text-type-2"> each</span>
        </p>
      </div>

      <div className="mt-5 space-y-6 border-t border-border pt-5">
        {product.options.map((o) => (
          <OptionGroup key={o.id} option={o} value={variant[o.id]} onChange={(v) => onOption(o.id, v)} compact />
        ))}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-13-m text-type-0">Quantity</p>
            <p className="text-12-r text-type-2">Copies of this photo</p>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-border p-1">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="Fewer"
              className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-surface-2 disabled:opacity-40"
            >
              <Minus size={14} />
            </button>
            <span className="w-7 text-center text-14-m tabular-nums" aria-live="polite">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
              disabled={qty >= MAX_QTY}
              aria-label="More"
              className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-surface-2 disabled:opacity-40"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CropStep({ photo, product, variant, entry, setEntry }) {
  const crop = entry.crop || DEFAULT_CROP
  const aspect = cellAspect(product, variant, entry.orientation)
  const inches = frameInches(product, variant, entry.orientation)
  const dpi = printDpi(photo, crop, aspect, inches.w)
  const q = quality(dpi)
  const update = (patch) => setEntry((e) => ({ ...e, ...patch }))
  const setZoom = (z) => update({ crop: { ...crop, zoom: Math.min(3, Math.max(1, z)) } })

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-xl bg-[#ececec]">
        <CropEditor photo={photo} crop={crop} aspect={aspect} onChange={(c) => update({ crop: c })} className="h-[clamp(160px,45svh,340px)]" />
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-11-r text-type-1 backdrop-blur">
          <Hand size={13} /> Drag to reposition · scroll or pinch to zoom
        </div>
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-white/85 px-2.5 py-1 text-11-m tabular-nums text-type-1 backdrop-blur">
          {inches.w} × {inches.h}"
        </div>
      </div>

      {product.allowOrientation && (
        <div>
          <p className="mb-2 text-13-m">Orientation</p>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
            {['portrait', 'landscape'].map((o) => (
              <button
                key={o}
                onClick={() => update({ orientation: o, crop: DEFAULT_CROP })}
                className={cn('relative flex items-center justify-center gap-2 rounded-lg py-2 text-13-r capitalize transition', entry.orientation === o ? 'text-type-0' : 'text-type-2')}
              >
                {entry.orientation === o && <motion.span layoutId="qb-orient" className="absolute inset-0 rounded-lg bg-surface-1 shadow-sm" transition={{ duration: 0.35, ease }} />}
                <Rectangle size={16} className={cn('relative', o === 'portrait' && 'rotate-90')} />
                <span className="relative">{o}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-13-m">Zoom</p>
          <span className="text-12-r tabular-nums text-type-2">{Math.round(crop.zoom * 100)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setZoom(crop.zoom - 0.1)} aria-label="Zoom out" className="text-type-2 hover:text-type-0">
            <MagnifyingGlassMinus size={18} />
          </button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={crop.zoom}
            onChange={(e) => setZoom(+e.target.value)}
            aria-label="Zoom"
            className="range flex-1"
            style={{ '--p': `${((crop.zoom - 1) / 2) * 100}%` }}
          />
          <button onClick={() => setZoom(crop.zoom + 0.1)} aria-label="Zoom in" className="text-type-2 hover:text-type-0">
            <MagnifyingGlassPlus size={18} />
          </button>
        </div>
      </div>

      <div
        className={cn(
          'flex items-start gap-2.5 rounded-xl p-3 text-13-r',
          q.tone === 'good' && 'bg-success-bg text-success',
          q.tone === 'ok' && 'bg-surface-2 text-type-1',
          q.tone === 'low' && 'bg-amber-50 text-amber-800'
        )}
      >
        {q.tone === 'low' ? <Warning size={17} className="mt-px shrink-0" /> : <CheckCircle size={17} className="mt-px shrink-0" />}
        <div className="flex-1">
          <p className="text-13-m">{q.label}</p>
          <p className="opacity-80">{q.tone === 'low' ? 'Zoom out or choose a smaller size for a sharper print.' : `Prints at ~${dpi} DPI at this size.`}</p>
        </div>
        <Button variant="ghost" size="sm" className="-my-1 -mr-1.5" onClick={() => update({ crop: DEFAULT_CROP })}>
          <ArrowCounterClockwise size={14} /> Reset
        </Button>
      </div>

      <p className="text-12-r-p text-type-3">{gallery.photographer} reviews every crop before your order goes to print.</p>
    </div>
  )
}

function AddedStep({ product, variant, entry, qty, total, itemCount, onCheckout, onCart, onAnother }) {
  return (
    <div className="flex flex-col items-center pt-2 text-center">
      <div className="relative w-full">
        <ProductMockup product={product} variant={variant} items={[entry]} className="aspect-[5/4] rounded-xl" />
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4, ease }}
          className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-success-bg px-3 py-1.5 text-12-m text-success shadow-sm"
        >
          <CheckCircle size={15} weight="fill" /> In your cart
        </motion.div>
      </div>
      <p className="mt-5 text-16-sb">
        {qty} × {product.name}
      </p>
      <p className="mt-0.5 text-13-r text-type-2">
        {sizeOf(product, variant).label} · {money(total)}
      </p>

      <div className="mt-6 grid w-full gap-2">
        <Button size="lg" onClick={onCheckout} arrow>
          Checkout
        </Button>
        <Button variant="outline" size="lg" onClick={onCart}>
          View cart ({itemCount})
        </Button>
        <Button variant="ghost" onClick={onAnother}>
          Make something else with this photo
        </Button>
      </div>
      <Dialog.Close asChild>
        <button className="mt-2 text-13-r text-type-2 underline-offset-4 transition hover:text-type-0 hover:underline">Keep browsing the gallery</button>
      </Dialog.Close>
    </div>
  )
}
