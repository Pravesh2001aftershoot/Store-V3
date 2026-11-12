import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import {
  X, Check, CheckCircle, ArrowLeft, ArrowRight, ArrowsOut, CaretLeft, CaretRight, MagnifyingGlassMinus, MagnifyingGlassPlus,
  ArrowCounterClockwise, Rectangle, Warning, Hand, Trash, PencilSimple, Tag, ShieldCheck, Info,
} from '@phosphor-icons/react'
import { productById, packageById } from '../data/catalog'
import { gallery, photos, getPhoto } from '../data/gallery'
import {
  cellAspect, defaultOrientation, defaultVariant, lineQty, lineTotal, packagePrice, packageValue, requirement, requirementText,
  sizeOf, unitPrice, validate, variantLabel, bookExtras, frameInches,
} from '../lib/pricing'
import { DEFAULT_CROP, printDpi, quality } from '../lib/crop'
import { useStore } from '../state/store'
import { AnimatedNumber, Badge, Button } from '../components/ui'
import CropEditor from '../components/CropEditor'
import CroppedImage from '../components/CroppedImage'
import ProductMockup from '../components/ProductMockup'
import { cn, money, plural } from '../lib/utils'

const ease = [0.22, 1, 0.36, 1]
const STEPS = ['Photos', 'Crop', 'Review']

// ---------------------------------------------------------------------------
// setup

function initFrom(kind, id, params, lines) {
  if (kind === 'product') {
    const product = productById[id]
    return { kind, productId: id, slots: [{ key: 'main', product, variant: defaultVariant(product, params), qty: null, photos: [] }] }
  }
  if (kind === 'package') {
    const pkg = packageById[id]
    return {
      kind,
      packageId: id,
      slots: pkg.slots.map((s) => {
        const product = productById[s.productId]
        return { key: s.id, product, variant: defaultVariant(product, s.variant), qty: s.qty, photos: [] }
      }),
    }
  }
  const line = lines.find((l) => l.id === id)
  if (!line) return null
  if (line.kind === 'package') {
    const pkg = packageById[line.packageId]
    return {
      kind: 'package',
      editId: id,
      packageId: line.packageId,
      slots: line.slots.map((s) => {
        const product = productById[s.productId]
        return { key: s.slotId, product, variant: s.variant, qty: pkg.slots.find((x) => x.id === s.slotId).qty, photos: s.photos }
      }),
    }
  }
  const product = productById[line.productId]
  return { kind: 'product', editId: id, productId: line.productId, slots: [{ key: 'main', product, variant: line.variant, qty: null, photos: line.photos }] }
}

const slotTotal = (s) => lineTotal(s.product, s.variant, s.photos.length)

// ---------------------------------------------------------------------------

function TopBar({ title, step, setStep, canGo, total, compareAt, onClose }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface-0/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-3 px-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 transition hover:bg-[#ececec]" aria-label="Close">
            <X size={16} />
          </button>
          <p className="hidden truncate text-[14px] font-medium md:block">{title}</p>
        </div>
        <nav className="flex items-center gap-1">
          {STEPS.map((s, i) => {
            const done = i < step
            const active = i === step
            return (
              <div key={s} className="flex items-center gap-1">
                {i > 0 && <span className={cn('h-px w-4 transition-colors sm:w-8', done || active ? 'bg-type-0' : 'bg-border')} />}
                <button
                  onClick={() => canGo(i) && setStep(i)}
                  disabled={!canGo(i)}
                  className={cn(
                    'relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] transition disabled:cursor-not-allowed',
                    active ? 'text-white' : done ? 'text-type-0 hover:bg-surface-2' : 'text-type-3'
                  )}
                >
                  {active && <motion.span layoutId="step-pill" className="absolute inset-0 rounded-full bg-type-0" transition={{ duration: 0.45, ease }} />}
                  <span className={cn('relative grid h-5 w-5 place-items-center rounded-full text-[11px] font-medium', active ? 'bg-white/15' : done ? 'bg-type-0 text-white' : 'bg-surface-2')}>
                    {done ? <Check size={11} weight="bold" /> : i + 1}
                  </span>
                  <span className="relative hidden sm:inline">{s}</span>
                </button>
              </div>
            )
          })}
        </nav>
        <div className="flex shrink-0 items-baseline gap-2 text-right">
          {compareAt && <span className="hidden text-[13px] text-type-3 line-through sm:inline">{money(compareAt)}</span>}
          <span className="text-[16px] font-medium">
            <AnimatedNumber value={total} format={money} />
          </span>
        </div>
      </div>
    </header>
  )
}

function SlotPill({ slot, active, onClick, index }) {
  const v = validate(slot.product, slot.photos.length, slot.qty)
  const req = requirement(slot.product, slot.qty)
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full shrink-0 items-center gap-3 rounded-xl border p-2 text-left transition',
        active ? 'border-type-0 bg-surface-1 shadow-[0_0_0_1px_var(--type-0)]' : 'border-border bg-surface-1 hover:border-type-3',
        'max-lg:w-auto max-lg:pr-4'
      )}
    >
      <div className="w-12 shrink-0 overflow-hidden rounded-lg">
        <ProductMockup product={slot.product} variant={slot.variant} items={slot.photos} className="aspect-square" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">
          {slot.qty > 1 && `${slot.qty} × `}
          {slot.product.name}
        </p>
        <p className="text-[12px] text-type-2">{sizeOf(slot.product, slot.variant).label}</p>
      </div>
      <span className={cn('flex items-center gap-1 text-[12px] tabular-nums', v.ok ? 'text-success' : 'text-type-2')}>
        {v.ok ? <CheckCircle size={16} weight="fill" /> : `${slot.photos.length}/${req.min === req.max ? req.max : req.min + '+'}`}
        <span className="sr-only">{index}</span>
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Step 1 – Photos

function Lightbox({ index, setIndex, selected, onToggle }) {
  const photo = index != null ? photos[index] : null
  return (
    <Dialog.Root open={index != null} onOpenChange={(o) => !o && setIndex(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90" />
        <Dialog.Content aria-describedby={undefined} className="fixed inset-0 z-50 flex flex-col p-4 outline-none" onKeyDown={(e) => {
          if (e.key === 'ArrowRight') setIndex((index + 1) % photos.length)
          if (e.key === 'ArrowLeft') setIndex((index - 1 + photos.length) % photos.length)
        }}>
          <Dialog.Title className="sr-only">Photo preview</Dialog.Title>
          {photo && (
            <>
              <div className="flex items-center justify-between text-white">
                <p className="text-[13px] text-white/60">
                  {photo.name} · {index + 1} / {photos.length}
                </p>
                <Dialog.Close className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20">
                  <X size={18} />
                </Dialog.Close>
              </div>
              <div className="relative flex flex-1 items-center justify-center py-4">
                <button onClick={() => setIndex((index - 1 + photos.length) % photos.length)} className="absolute left-0 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
                  <CaretLeft size={20} />
                </button>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={photo.id}
                    src={photo.src}
                    alt=""
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="max-h-[78vh] max-w-full rounded object-contain"
                  />
                </AnimatePresence>
                <button onClick={() => setIndex((index + 1) % photos.length)} className="absolute right-0 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
                  <CaretRight size={20} />
                </button>
              </div>
              <div className="flex justify-center">
                <Button variant={selected(photo.id) ? 'light' : 'outline'} className={selected(photo.id) ? '' : 'border-white/30 bg-transparent text-white hover:bg-white/10'} onClick={() => onToggle(photo)}>
                  {selected(photo.id) ? <><Check size={16} weight="bold" /> Selected</> : 'Select photo'}
                </Button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function PhotosStep({ slot, toggle, selectMany, clear, flash }) {
  const [col, setCol] = useState('All')
  const [lightbox, setLightbox] = useState(null)
  const visible = photos.filter((p) => col === 'All' || p.collection === col)
  const order = (id) => slot.photos.findIndex((p) => p.photoId === id)
  const req = requirement(slot.product, slot.qty)

  return (
    <div>
      <div className="sticky top-16 z-20 -mx-3 flex flex-wrap items-center justify-between gap-3 bg-surface-0/90 px-3 py-3 backdrop-blur-xl md:-mx-6 md:px-6">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {gallery.collections.map((c) => (
            <button
              key={c}
              onClick={() => setCol(c)}
              className={cn('relative shrink-0 rounded-full px-3.5 py-1.5 text-[13px] transition', col === c ? 'text-white' : 'text-type-1 hover:bg-surface-2')}
            >
              {col === c && <motion.span layoutId="col-pill" className="absolute inset-0 rounded-full bg-type-0" transition={{ duration: 0.4, ease }} />}
              <span className="relative">{c}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {req.max > 1 && (
            <Button variant="ghost" size="sm" onClick={() => selectMany(visible)}>
              {req.max >= 100 ? 'Select all' : slot.product.mode === 'book' ? `Fill to ${req.min}` : 'Fill selection'}
            </Button>
          )}
          {slot.photos.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clear}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed left-1/2 top-20 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-type-0 px-4 py-2 text-[13px] text-white shadow-lg"
          >
            <Info size={15} /> {flash}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout className="columns-2 gap-3 pt-2 sm:columns-3 xl:columns-4 2xl:columns-5">
        {visible.map((p, i) => {
          const o = order(p.id)
          const sel = o > -1
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: Math.min(i, 12) * 0.03 }}
              className="group relative mb-3 break-inside-avoid"
            >
              <button
                onClick={() => toggle(p)}
                className={cn('relative block w-full overflow-hidden rounded-xl transition-all duration-300', sel ? 'bg-type-0 p-1.5' : 'bg-transparent p-0')}
                aria-pressed={sel}
              >
                <img
                  src={p.thumb}
                  alt={p.name}
                  loading="lazy"
                  className={cn('block w-full rounded-[10px] transition-transform duration-700', !sel && 'group-hover:scale-[1.03]')}
                  style={{ aspectRatio: p.w / p.h }}
                />
                <span
                  className={cn(
                    'absolute right-3 top-3 grid h-7 min-w-7 place-items-center rounded-full px-1.5 text-[12px] font-semibold transition-all duration-300',
                    sel ? 'scale-100 bg-white text-type-0' : 'scale-90 bg-black/25 text-transparent ring-2 ring-white/80 backdrop-blur group-hover:scale-100'
                  )}
                >
                  {sel ? o + 1 : <Check size={12} />}
                </span>
              </button>
              <button
                onClick={() => setLightbox(photos.indexOf(p))}
                className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur transition group-hover:opacity-100"
                aria-label="Preview"
              >
                <ArrowsOut size={14} />
              </button>
            </motion.div>
          )
        })}
      </motion.div>

      <Lightbox index={lightbox} setIndex={setLightbox} selected={(id) => order(id) > -1} onToggle={toggle} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2 – Crop

function CropStep({ slots, items, index, setIndex, updatePhoto, removePhoto }) {
  const cur = items[index]
  if (!cur) return null
  const slot = slots[cur.si]
  const entry = slot.photos[cur.pi]
  const photo = getPhoto(entry.photoId)
  const aspect = cellAspect(slot.product, slot.variant, entry.orientation)
  const inches = frameInches(slot.product, slot.variant, entry.orientation)
  const dpi = printDpi(photo, entry.crop, aspect, inches.w)
  const q = quality(dpi)
  const crop = entry.crop || DEFAULT_CROP
  const canRemove = validate(slot.product, slot.photos.length - 1, slot.qty).ok
  const setZoom = (z) => updatePhoto(cur.si, cur.pi, { crop: { ...crop, zoom: Math.min(3, Math.max(1, z)) } })

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        <div className="relative overflow-hidden rounded-2xl bg-[#ececec]">
          <CropEditor
            photo={photo}
            crop={crop}
            aspect={aspect}
            onChange={(c) => updatePhoto(cur.si, cur.pi, { crop: c })}
            className="h-[48svh] min-h-[320px] lg:h-[calc(100svh-300px)]"
          />
          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-[12px] text-type-1 backdrop-blur">
            <Hand size={14} /> Drag to reposition · scroll or pinch to zoom
          </div>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
            <button onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow disabled:opacity-40">
              <CaretLeft size={16} />
            </button>
            <span className="rounded-full bg-white px-3 py-2 text-[12px] font-medium tabular-nums shadow">
              {index + 1} / {items.length}
            </span>
            <button onClick={() => setIndex(Math.min(items.length - 1, index + 1))} disabled={index === items.length - 1} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow disabled:opacity-40">
              <CaretRight size={16} />
            </button>
          </div>
        </div>

        {/* filmstrip */}
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto p-1.5">
          {items.map((it, i) => {
            const s = slots[it.si]
            const e = s.photos[it.pi]
            const first = it.pi === 0 && slots.length > 1
            return (
              <div key={`${it.si}-${it.pi}`} className="flex shrink-0 items-end gap-2">
                {first && it.si > 0 && <span className="mx-1 h-12 w-px bg-border" />}
                <button
                  onClick={() => setIndex(i)}
                  className={cn('relative overflow-hidden rounded-md transition', i === index ? 'ring-2 ring-type-0 ring-offset-2' : 'opacity-70 hover:opacity-100')}
                >
                  <CroppedImage photo={getPhoto(e.photoId)} crop={e.crop} aspect={cellAspect(s.product, s.variant, e.orientation)} className="h-16" />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* controls */}
      <aside className="space-y-5 rounded-2xl border border-border bg-surface-1 p-5 lg:sticky lg:top-24 lg:self-start">
        <div>
          <p className="text-[12px] uppercase tracking-[0.14em] text-type-3">Photo {index + 1} of {items.length}</p>
          <p className="mt-1 text-[16px] font-medium">{slot.product.name}</p>
          <p className="text-[13px] text-type-2">
            {inches.w} × {inches.h}" · {variantLabel(slot.product, slot.variant, { skipSize: true })}
          </p>
        </div>

        {slot.product.allowOrientation && (
          <div>
            <p className="mb-2 text-[13px] font-medium">Orientation</p>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
              {['portrait', 'landscape'].map((o) => (
                <button
                  key={o}
                  onClick={() => updatePhoto(cur.si, cur.pi, { orientation: o, crop: DEFAULT_CROP })}
                  className={cn('relative flex items-center justify-center gap-2 rounded-lg py-2 text-[13px] capitalize transition', entry.orientation === o ? 'text-type-0' : 'text-type-2')}
                >
                  {entry.orientation === o && <motion.span layoutId="orient" className="absolute inset-0 rounded-lg bg-surface-1 shadow-sm" transition={{ duration: 0.35, ease }} />}
                  <Rectangle size={16} className={cn('relative', o === 'portrait' && 'rotate-90')} />
                  <span className="relative">{o}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-medium">Zoom</p>
            <span className="text-[12px] tabular-nums text-type-2">{Math.round(crop.zoom * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setZoom(crop.zoom - 0.1)} className="text-type-2 hover:text-type-0"><MagnifyingGlassMinus size={18} /></button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={crop.zoom}
              onChange={(e) => setZoom(+e.target.value)}
              className="range flex-1"
              style={{ '--p': `${((crop.zoom - 1) / 2) * 100}%` }}
            />
            <button onClick={() => setZoom(crop.zoom + 0.1)} className="text-type-2 hover:text-type-0"><MagnifyingGlassPlus size={18} /></button>
          </div>
        </div>

        <div
          className={cn(
            'flex items-start gap-2.5 rounded-xl p-3 text-[13px]',
            q.tone === 'good' && 'bg-success-bg text-success',
            q.tone === 'ok' && 'bg-surface-2 text-type-1',
            q.tone === 'low' && 'bg-amber-50 text-amber-800'
          )}
        >
          {q.tone === 'low' ? <Warning size={17} className="mt-px shrink-0" /> : <CheckCircle size={17} className="mt-px shrink-0" />}
          <div>
            <p className="font-medium">{q.label}</p>
            <p className="opacity-80">
              {q.tone === 'low' ? 'Zoom out or choose a smaller size for a sharper print.' : `Prints at ~${dpi} DPI at this size.`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => updatePhoto(cur.si, cur.pi, { crop: DEFAULT_CROP })}>
            <ArrowCounterClockwise size={14} /> Reset
          </Button>
          {canRemove && (
            <Button variant="ghost" size="sm" onClick={() => removePhoto(cur.si, cur.pi)}>
              <Trash size={14} /> Remove photo
            </Button>
          )}
        </div>
        <p className="border-t border-border pt-4 text-[12px] leading-relaxed text-type-3">
          {gallery.photographer} reviews every crop before your order goes to print.
        </p>
      </aside>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3 – Review

function ReviewStep({ state, slots, goCrop, total, compareAt }) {
  const pkg = state.packageId && packageById[state.packageId]
  return (
    <div className="mx-auto max-w-3xl space-y-4 py-4">
      <div>
        <h2 className="text-[30px] font-medium tracking-[-0.03em] md:text-[40px]">Review your order</h2>
        <p className="mt-1 text-[15px] text-type-2">Check sizes, quantities and crops before adding to your cart.</p>
      </div>

      {pkg && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-type-0 p-5 text-white">
          <div>
            <p className="text-[12px] uppercase tracking-[0.14em] text-white/50">Package</p>
            <p className="text-[20px] font-medium">{pkg.name}</p>
          </div>
          <div className="text-right">
            <p className="text-[13px] text-white/50 line-through">{money(compareAt)}</p>
            <p className="text-[22px] font-medium">{money(total)}</p>
          </div>
          <Badge tone="success" className="w-full justify-center border-0 py-1 sm:w-auto">
            <Tag size={12} /> You save {money(compareAt - total)}
          </Badge>
        </div>
      )}

      {slots.map((s, si) => {
        const qty = lineQty(s.product, s.photos.length)
        const extras = bookExtras(s.product, s.photos.length)
        return (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: si * 0.08 }}
            className="flex flex-col gap-5 rounded-2xl border border-border bg-surface-1 p-4 sm:flex-row"
          >
            <div className="w-full shrink-0 overflow-hidden rounded-xl sm:w-44">
              <ProductMockup product={s.product} variant={s.variant} items={s.photos} className="aspect-square" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[17px] font-medium">{s.product.name}</p>
                  <p className="text-[13px] text-type-2">{variantLabel(s.product, s.variant)}</p>
                </div>
                {!pkg && <p className="text-[16px] font-medium">{money(slotTotal(s))}</p>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
                <Badge tone="muted">Qty {qty}</Badge>
                <Badge tone="muted">{plural(s.photos.length, 'photo')}</Badge>
                {!pkg && s.product.mode !== 'book' && <Badge tone="muted">{money(unitPrice(s.product, s.variant))} each</Badge>}
                {extras > 0 && <Badge tone="muted">+{money(extras)} extra photos</Badge>}
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {s.photos.slice(0, 14).map((e, i) => (
                  <CroppedImage key={i} photo={getPhoto(e.photoId)} crop={e.crop} aspect={cellAspect(s.product, s.variant, e.orientation)} className="h-12 rounded-[3px] ring-1 ring-black/5" />
                ))}
                {s.photos.length > 14 && <span className="self-center text-[12px] text-type-2">+{s.photos.length - 14}</span>}
              </div>
              <button onClick={() => goCrop(si)} className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-type-1 hover:text-type-0">
                <PencilSimple size={14} /> Edit crops
              </button>
            </div>
          </motion.div>
        )
      })}

      <div className="flex items-center gap-2 rounded-xl bg-surface-2 p-4 text-[13px] text-type-1">
        <ShieldCheck size={18} className="shrink-0" /> {gallery.photographer} will review your crops and colour before printing.
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

export default function Builder() {
  const { kind, id } = useParams()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { lines, dispatch, setDrawer } = useStore()
  const [state, setState] = useState(() => initFrom(kind, id, Object.fromEntries(params), lines))
  const [step, setStep] = useState(kind === 'edit' ? 1 : 0)
  const [active, setActive] = useState(0)
  const [cropIndex, setCropIndex] = useState(0)
  const [flash, setFlash] = useState(null)

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 2200)
    return () => clearTimeout(t)
  }, [flash])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [step])

  const slots = state?.slots || []
  const items = useMemo(() => slots.flatMap((s, si) => s.photos.map((_, pi) => ({ si, pi }))), [slots])

  if (!state) return <p className="p-20 text-center">Nothing to edit. <button className="underline" onClick={() => nav('/cart')}>Back to cart</button></p>

  const pkg = state.packageId && packageById[state.packageId]
  const extras = slots.reduce((s, x) => s + bookExtras(x.product, x.photos.length), 0)
  const total = pkg ? packagePrice(pkg) + extras : slotTotal(slots[0])
  const compareAt = pkg ? packageValue(pkg) + extras : null
  const allValid = slots.every((s) => validate(s.product, s.photos.length, s.qty).ok)
  const slot = slots[active]

  const setSlots = (fn) => setState((st) => ({ ...st, slots: fn(st.slots) }))
  const updateSlotPhotos = (si, fn) => setSlots((ss) => ss.map((s, i) => (i === si ? { ...s, photos: fn(s.photos) } : s)))
  const newEntry = (p) => ({ photoId: p.id, crop: DEFAULT_CROP, orientation: defaultOrientation(slot.product, p) })

  const toggle = (p) => {
    const has = slot.photos.some((e) => e.photoId === p.id)
    if (has) return updateSlotPhotos(active, (ph) => ph.filter((e) => e.photoId !== p.id))
    const { max } = requirement(slot.product, slot.qty)
    if (slot.photos.length >= max) return setFlash(`This item holds ${plural(max, 'photo')}. Deselect one to swap.`)
    updateSlotPhotos(active, (ph) => [...ph, newEntry(p)])
  }
  const selectMany = (list) => {
    const { min, max: hardMax, step: st } = requirement(slot.product, slot.qty)
    const max = slot.product.mode === 'book' ? Math.max(min, slot.photos.length) : hardMax
    updateSlotPhotos(active, (ph) => {
      const out = [...ph]
      for (const p of list) if (out.length < max && !out.some((e) => e.photoId === p.id)) out.push(newEntry(p))
      // keep sets whole
      return st > 1 && max >= 100 ? out.slice(0, out.length - (out.length % st)) : out
    })
  }
  const updatePhoto = (si, pi, patch) => updateSlotPhotos(si, (ph) => ph.map((e, i) => (i === pi ? { ...e, ...patch } : e)))
  const removePhoto = (si, pi) => {
    updateSlotPhotos(si, (ph) => ph.filter((_, i) => i !== pi))
    setCropIndex((i) => Math.max(0, Math.min(i, items.length - 2)))
  }

  const canGo = (i) => i <= step || allValid
  const close = () => nav(-1)

  const next = () => {
    if (step === 0) {
      const bad = slots.findIndex((s) => !validate(s.product, s.photos.length, s.qty).ok)
      if (bad > -1) {
        setActive(bad)
        setFlash(validate(slots[bad].product, slots[bad].photos.length, slots[bad].qty).message)
        return
      }
      setCropIndex(0)
      setStep(1)
    } else if (step === 1) setStep(2)
    else addToCart()
  }

  const addToCart = () => {
    const line =
      state.kind === 'package'
        ? { kind: 'package', packageId: state.packageId, slots: slots.map((s) => ({ slotId: s.key, productId: s.product.id, variant: s.variant, photos: s.photos })) }
        : { kind: 'product', productId: slots[0].product.id, variant: slots[0].variant, photos: slots[0].photos }
    if (state.editId) {
      dispatch({ type: 'update', id: state.editId, line })
      nav('/cart')
      return
    }
    dispatch({ type: 'add', line })
    nav(state.kind === 'package' ? `/packages/${state.packageId}` : `/product/${state.productId}?${new URLSearchParams(slots[0].variant)}`)
    setTimeout(() => setDrawer(true), 350)
  }

  const goCrop = (si) => {
    setCropIndex(items.findIndex((it) => it.si === si))
    setStep(1)
  }

  const title = pkg ? `${pkg.name} Package` : `${slot.product.name} · ${variantLabel(slot.product, slot.variant)}`

  // bottom bar summary text
  const v = validate(slot.product, slot.photos.length, slot.qty)
  const qty = lineQty(slot.product, slot.photos.length)
  let summary
  if (step === 0) {
    if (!slot.photos.length) summary = requirementText(slot.product, slot.qty)
    else if (slot.product.mode === 'book') summary = `${plural(slot.photos.length, 'photo')} → 1 × ${slot.product.name} ${sizeOf(slot.product, slot.variant).label}`
    else summary = `${plural(slot.photos.length, 'photo')} → ${qty} × ${slot.product.name} ${sizeOf(slot.product, slot.variant).label}`
  } else if (step === 1) summary = 'Adjust each crop, then review your order'
  else summary = 'Everything look right?'

  return (
    <div className="min-h-screen bg-surface-0 pb-32">
      <TopBar title={title} step={step} setStep={setStep} canGo={canGo} total={total} compareAt={compareAt} onClose={close} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.45, ease }}
          className="mx-auto max-w-[1600px] px-3 md:px-6"
        >
          {step === 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
              <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start lg:pt-4">
                {!pkg && (
                  <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface-1 lg:block">
                    <ProductMockup product={slot.product} variant={slot.variant} items={slot.photos} className="aspect-square" />
                    <div className="p-4">
                      <p className="text-[15px] font-medium">{slot.product.name}</p>
                      <p className="text-[13px] text-type-2">{variantLabel(slot.product, slot.variant)}</p>
                      <button onClick={close} className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-type-1 hover:text-type-0">
                        <ArrowLeft size={12} /> Change options
                      </button>
                    </div>
                  </div>
                )}
                {pkg && (
                  <>
                    <p className="mb-3 hidden text-[12px] uppercase tracking-[0.14em] text-type-3 lg:block">Fill each item</p>
                    <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 pt-3 lg:mx-0 lg:flex-col lg:px-0 lg:pt-0">
                      {slots.map((s, i) => (
                        <SlotPill key={s.key} slot={s} index={i} active={i === active} onClick={() => setActive(i)} />
                      ))}
                    </div>
                  </>
                )}
                <div className="mt-3 hidden rounded-xl bg-surface-2 p-3 text-[13px] text-type-1 lg:block">{requirementText(slot.product, slot.qty)}</div>
              </aside>
              <div>
                {pkg && (
                  <p className="pt-4 text-[13px] text-type-2">
                    Choosing for <span className="font-medium text-type-0">{slot.qty > 1 && `${slot.qty} × `}{slot.product.name}</span> · {requirementText(slot.product, slot.qty)}
                  </p>
                )}
                <PhotosStep
                  slot={slot}
                  toggle={toggle}
                  selectMany={selectMany}
                  clear={() => updateSlotPhotos(active, () => [])}
                  flash={flash}
                />
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="pt-4">
              <CropStep slots={slots} items={items} index={Math.min(cropIndex, items.length - 1)} setIndex={setCropIndex} updatePhoto={updatePhoto} removePhoto={removePhoto} />
            </div>
          )}
          {step === 2 && <ReviewStep state={state} slots={slots} goCrop={goCrop} total={total} compareAt={compareAt} />}
        </motion.div>
      </AnimatePresence>

      {/* bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface-1/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-3 py-3 md:px-6">
          {step === 0 && slot.photos.length > 0 && (
            <div className="no-scrollbar hidden max-w-[40%] items-center gap-1.5 overflow-x-auto md:flex">
              <AnimatePresence initial={false}>
                {slot.photos.map((e) => (
                  <motion.button
                    key={e.photoId}
                    layout
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    onClick={() => toggle(getPhoto(e.photoId))}
                    className="group relative h-11 w-11 shrink-0 overflow-hidden rounded-lg"
                  >
                    <img src={getPhoto(e.photoId).thumb} alt="" className="h-full w-full object-cover" />
                    <span className="absolute inset-0 grid place-items-center bg-black/50 text-white opacity-0 transition group-hover:opacity-100">
                      <X size={14} />
                    </span>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium">{summary}</p>
            <p className={cn('truncate text-[12px]', step === 0 && !v.ok && slot.photos.length ? 'text-amber-700' : 'text-type-2')}>
              {step === 0 && !v.ok && slot.photos.length
                ? v.message
                : pkg
                  ? `${money(total)} package price${extras ? ` incl. ${money(extras)} extra photos` : ''}`
                  : slot.photos.length
                    ? `${money(total)} total`
                    : `From ${money(unitPrice(slot.product, slot.variant, slot.product.mode === 'book' ? slot.product.book.min : 0))}`}
            </p>
          </div>
          {step > 0 && (
            <Button variant="outline" size="lg" onClick={() => setStep(step - 1)} className="max-sm:px-4">
              <ArrowLeft size={16} /> <span className="max-sm:hidden">Back</span>
            </Button>
          )}
          <Button size="lg" onClick={next} disabled={step === 0 && slots.every((s) => !s.photos.length)}>
            {step === 0 ? 'Continue to crop' : step === 1 ? 'Review' : state.editId ? 'Update cart' : 'Add to cart'}
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
