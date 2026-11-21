import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, FileZip, Handbag, Images, Info, LockSimple, X } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../state/store'
import { Button } from '../../components/ui'
import { cn, money } from '../../lib/utils'
import { downloadPhotos } from '../lib/actions'
import { addOrderToCart, fitAllowance } from '../lib/downloads'
import { GalleryOffer, OrderSummary } from './BuyDownloads'

const ease = [0.22, 1, 0.36, 1]
/** Up to this many photos are saved as real files. Above it the zip is simulated (prototype). */
const REAL_FILES_MAX = 10
const plural = (n, word = 'photo') => `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`

/**
 * "Download": a side panel to download many photos at once. Tick what (the selection, the people
 * shown, the whole gallery, favourites, sets of your own, collections — any mix; Whole gallery on its
 * own) and a size, then Download. Photos in more than one ticked source download once. The photographer's rules apply: a download PIN asked once per visit, the sizes offered,
 * and a per-visitor limit (photos downloaded before don't count again).
 *
 * `sources`: [{ id, label, group?, photos }] in display order. `initial` is the source ticked on open.
 * `dl` comes from useDownloads(). `onStarted(sourceIds)` runs once the files are on their way.
 * `sizePref` is the size saved for single photos ("Remember my choice", or null to ask each time); the
 * pane starts on it, and its "Single photos" switch changes it with `onSizePref(sizeId | null)`.
 * `initialSize` overrides that (e.g. 'high' when opened from "Whole gallery in high res").
 *
 * High res sold in the store (dl.rules.paid): Web size is free and counts against the limit; High res
 * is bought. With High res chosen the pane shows the price (photos already bought are free; past the
 * whole-gallery price the order becomes the Whole Gallery Download), and Download becomes "Add to cart ·
 * $X", which puts the order in the store cart (addOrderToCart) and shows "Added to cart" with Checkout.
 * Bought photos download in High res for free and don't use the allowance.
 */
export default function DownloadPane({ open, onClose, ...props }) {
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
            <Dialog.Content asChild aria-describedby={undefined} onOpenAutoFocus={(e) => e.preventDefault()}>
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.55, ease }}
                className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col bg-surface-1 shadow-2xl outline-none sm:inset-y-2 sm:right-2 sm:rounded-2xl"
              >
                <Pane onClose={onClose} {...props} />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

// step: 'pick' → 'pin' (only with a download PIN, once per visit) → 'preparing' (2+ photos) → 'done'
//       'pick' → 'added' (High res not bought yet: the order went to the store cart)
function Pane({ onClose, sources, initial, initialSize, dl, sizePref, onSizePref, gallery, hiddenCount, onStarted }) {
  const { rules } = dl
  const [step, setStep] = useState('pick')
  const [dir, setDir] = useState(1)
  // The sources ticked, in the order chosen. Whole gallery is all-or-nothing: it already has everything.
  const [chosen, setChosen] = useState(() => [sources.some((s) => s.id === initial && s.photos.length) ? initial : 'all'])
  const [size, setSize] = useState(() => [initialSize, sizePref].find((id) => rules.sizes.some((z) => z.id === id)) ?? rules.sizes[0]?.id)
  const [job, setJob] = useState(null) // { photos, sourceIds, sizeLabel, file }
  const [added, setAdded] = useState(null) // the order put in the cart
  const store = useStore()
  const nav = useNavigate()
  const bodyRef = useRef(null)

  const toggle = (id) => setChosen((cur) => {
    if (id === 'all') return cur.includes('all') ? [] : ['all']
    const rest = cur.filter((x) => x !== 'all')
    return rest.includes(id) ? rest.filter((x) => x !== id) : [...rest, id]
  })
  const picked = sources.filter((s) => chosen.includes(s.id))
  const photos = mergePhotos(picked, sources.find((s) => s.id === 'all')?.photos ?? [])
  const everything = sources.find((s) => s.id === 'all')?.photos ?? []
  // High res for sale: priced, and outside the free allowance.
  const paidSize = dl.isPaid(size)
  const quote = paidSize ? dl.quote(photos, everything) : null
  const fit = paidSize ? { take: photos, fresh: 0, cut: 0 } : fitAllowance(photos, dl.isNew, dl.left)
  // Ticked sources can share photos (a set made from a collection); each downloads once.
  const overlap = picked.reduce((sum, s) => sum + s.photos.length, 0) - photos.length
  const sizeLabel = rules.sizes.find((z) => z.id === size)?.label ?? rules.sizes[0]?.label

  const go = (s, d = 1) => { setDir(d); setStep(s) }

  const deliver = (j) => {
    if (!j.paid) dl.record(j.photos)
    if (j.photos.length <= REAL_FILES_MAX) downloadPhotos(j.photos)
    onStarted?.(j.sourceIds)
  }

  const run = () => {
    const take = fit.take
    const one = take.length === 1
    const j = {
      photos: take,
      sourceIds: picked.map((s) => s.id),
      sizeLabel,
      file: one ? take[0].name : `${gallery.title} – ${zipName(picked)}.zip`,
      paid: paidSize,
    }
    setJob(j)
    proceed(j)
  }

  // High res not bought yet: the order goes to the store cart instead (no PIN needed to buy).
  const toCart = () => {
    addOrderToCart(store, quote)
    setAdded(quote)
    go('added')
  }

  const proceed = (j) => {
    if (j.photos.length === 1) {
      deliver(j)
      go('done')
    } else go('preparing')
  }

  const start = () => (quote?.count ? toCart() : dl.locked ? go('pin') : run())

  const title = step === 'pin' ? 'Download PIN' : step === 'added' ? 'Added to cart' : 'Download'
  const back = step === 'pin'

  return (
    <>
      <div className="flex items-center gap-2 border-b border-border px-5 pb-3 pt-4">
        {back && (
          <button onClick={() => go('pick', -1)} aria-label="Back" className="-ml-1.5 grid h-9 w-9 place-items-center rounded-full transition hover:bg-surface-2">
            <ArrowLeft size={16} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <Dialog.Title className="truncate text-16-sb">{title}</Dialog.Title>
          {step === 'pick' && <p className="truncate text-12-r text-type-2">Choose one or more to download</p>}
        </div>
        <Dialog.Close className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 transition hover:bg-[#ececec]" aria-label="Close">
          <X size={16} />
        </Dialog.Close>
      </div>

      <div ref={bodyRef} className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
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
            {step === 'pick' && (
              <PickStep
                sources={sources}
                chosen={chosen}
                onToggle={toggle}
                overlap={overlap}
                size={size}
                onSize={setSize}
                sizePref={sizePref}
                onSizePref={onSizePref}
                dl={dl}
                photographer={gallery.photographer}
                hiddenCount={hiddenCount}
                quote={quote}
                galleryCount={everything.length}
                onWholeGallery={() => { setChosen(['all']); setSize('high') }}
              />
            )}
            {step === 'added' && added && (
              <AddedStep
                order={added}
                galleryCount={everything.length}
                itemCount={store.totals.itemCount}
                onCheckout={() => { onClose(); nav('/checkout') }}
                onCart={() => { onClose(); nav('/cart') }}
                onAgain={() => go('pick', -1)}
                onClose={onClose}
              />
            )}
            {step === 'pin' && <PinStep photographer={gallery.photographer} onUnlock={(code) => dl.unlock(code) && (run(), true)} />}
            {step === 'preparing' && job && (
              <PreparingStep job={job} onReady={() => { deliver(job); go('done') }} onCancel={() => go('pick', -1)} />
            )}
            {step === 'done' && job && (
              <DoneStep job={job} dl={dl} onAgain={() => go('pick', -1)} onClose={onClose} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {step === 'pick' && (
        <PickFooter picked={picked} photos={photos} fit={fit} dl={dl} sizeLabel={sizeLabel} quote={quote} onStart={start} />
      )}
    </>
  )
}

// ── Pick ────────────────────────────────────────────────────────────────────

/**
 * The photos of every chosen source, each once, in gallery order (photos outside the gallery order,
 * such as a hidden photo picked from the Hidden view, go last).
 */
function mergePhotos(picked, order) {
  if (picked.length === 1) return picked[0].photos
  const byId = new Map()
  picked.forEach((s) => s.photos.forEach((p) => byId.set(p.id, p)))
  const pos = new Map(order.map((p, i) => [p.id, i]))
  return [...byId.values()].sort((a, b) => (pos.get(a.id) ?? Infinity) - (pos.get(b.id) ?? Infinity))
}

/** "Portraits", "Portraits + Details", "Portraits + 2 more". */
const zipName = (picked) =>
  picked.length <= 2 ? picked.map((s) => s.label).join(' + ') : `${picked[0].label} + ${picked.length - 1} more`

function PickStep({ sources, chosen, onToggle, overlap, size, onSize, sizePref, onSizePref, dl, photographer, hiddenCount, quote, galleryCount, onWholeGallery }) {
  const { rules } = dl
  // Ungrouped sources first, then each group under its heading, in the order they come.
  const groups = []
  for (const s of sources) {
    const g = groups.find((x) => x.title === (s.group ?? null))
    g ? g.items.push(s) : groups.push({ title: s.group ?? null, items: [s] })
  }

  return (
    <div className="space-y-6">
      {/* Size first: it applies to whatever is ticked below. */}
      <div>
        <p className="mb-2 text-11-sb uppercase text-type-2">Size</p>
        {rules.sizes.length > 1 ? (
          <>
            <div role="radiogroup" aria-label="Size" className="grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1">
              {rules.sizes.map((z) => (
                <button
                  key={z.id}
                  role="radio"
                  aria-checked={size === z.id}
                  onClick={() => onSize(z.id)}
                  className={cn('relative h-8 rounded-full text-13-m text-type-2 transition hover:text-type-0', size === z.id && 'text-type-0')}
                >
                  {size === z.id && (
                    <motion.span layoutId="download-size" className="absolute inset-0 rounded-full bg-surface-1 shadow-[0_1px_2px_rgba(0,0,0,.08)]" transition={{ duration: 0.35, ease }} />
                  )}
                  <span className="relative">
                    {z.label}
                    {rules.paid && <span className="ml-1 text-12-r tabular-nums text-type-3">{z.price ? money(z.price) : 'Free'}</span>}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-12-r text-type-3">{rules.sizes.find((z) => z.id === size)?.hint}</p>
            <SingleSize sizes={rules.sizes} value={sizePref} onChange={onSizePref} />
          </>
        ) : (
          <p className="text-14-r text-type-1">
            {rules.sizes[0]?.label} <span className="text-12-r text-type-3">· {rules.sizes[0]?.hint}</span>
          </p>
        )}
      </div>

      {quote ? (
        <OrderSummary quote={quote} galleryCount={galleryCount} />
      ) : (
        rules.limit != null && <Allowance limit={rules.limit} used={dl.used} left={dl.left} photographer={photographer} />
      )}
      {rules.paid && !dl.ownsAll && !(quote && chosen.includes('all')) && (
        <div className="-mt-3">
          <GalleryOffer quote={quote ?? dl.quote([], [])} galleryCount={galleryCount} onPick={onWholeGallery} />
        </div>
      )}

      <div role="group" aria-label="What to download" className="space-y-5">
        {groups.map((g) => (
          <div key={g.title ?? 'main'}>
            {g.title && <p className="mb-1.5 px-2 text-11-sb uppercase text-type-2">{g.title}</p>}
            <div className="-mx-2 space-y-0.5">
              {g.items.map((s) => (
                <SourceRow key={s.id} source={s} on={chosen.includes(s.id)} onPick={() => onToggle(s.id)} isNew={dl.isNew} />
              ))}
            </div>
          </div>
        ))}
        {(overlap > 0 || hiddenCount > 0) && (
          <div className="space-y-1 text-12-r text-type-3">
            {overlap > 0 && <p>{plural(overlap)} {overlap === 1 ? 'is' : 'are'} in more than one of these, so {overlap === 1 ? 'it downloads' : 'they download'} once.</p>}
            {hiddenCount > 0 && <p>Photos you’ve hidden aren’t included.</p>}
          </div>
        )}
      </div>

    </div>
  )
}

/**
 * "Single photos": the size a tile or full-screen download uses without asking (Web size / High res), or
 * Ask every time. The same setting as "Remember my choice" in SizePrompt. Changing it downloads nothing.
 */
function SingleSize({ sizes, value, onChange }) {
  const options = [...sizes, { id: 'ask', label: 'Ask every time' }]
  const current = value ?? 'ask'
  return (
    <div className="mt-5">
      <p className="mb-2 text-11-sb uppercase text-type-2">Single photos</p>
      <div role="radiogroup" aria-label="Single photos" className="grid grid-cols-3 gap-1 rounded-full bg-surface-2 p-1">
        {options.map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={current === o.id}
            onClick={() => onChange(o.id === 'ask' ? null : o.id)}
            className={cn('relative h-8 rounded-full px-1 text-13-m text-type-2 transition hover:text-type-0', current === o.id && 'text-type-0')}
          >
            {current === o.id && (
              <motion.span layoutId="single-size" className="absolute inset-0 rounded-full bg-surface-1 shadow-[0_1px_2px_rgba(0,0,0,.08)]" transition={{ duration: 0.35, ease }} />
            )}
            <span className="relative truncate">{o.label}</span>
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-12-r text-type-3">
        {value
          ? `Downloading one photo from the gallery or full screen saves it in ${sizes.find((z) => z.id === value)?.label} without asking.`
          : 'Downloading one photo from the gallery or full screen asks which size first.'}
      </p>
    </div>
  )
}

/**
 * How many of the photographer's downloads this visitor has left. Also used by SizePrompt for one
 * photo, with its own `note` in place of the general one.
 */
export function Allowance({ limit, used, left, photographer, note }) {
  const out = left === 0
  return (
    <div className="rounded-xl bg-surface-2 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-14-sb text-type-0 tabular-nums">
          {out ? `You’ve used all ${limit.toLocaleString()} downloads` : `${left.toLocaleString()} of ${limit.toLocaleString()} downloads left`}
        </p>
        {!out && used > 0 && <p className="shrink-0 text-12-r tabular-nums text-type-3">{used.toLocaleString()} used</p>}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-1" aria-hidden>
        <motion.div
          className="h-full rounded-full bg-type-0"
          initial={false}
          animate={{ width: `${(left / limit) * 100}%` }}
          transition={{ duration: 0.5, ease }}
        />
      </div>
      <p className="mt-2 text-12-r-p text-type-2">
        {note ?? (out
          ? `You can still download photos you’ve downloaded before. Ask ${photographer} if you need more.`
          : 'Each photo counts once. Downloading it again is free.')}
      </p>
    </div>
  )
}

function SourceRow({ source, on, onPick, isNew }) {
  const n = source.photos.length
  const before = n - source.photos.filter(isNew).length
  const cover = source.photos[0]
  return (
    <button
      role="checkbox"
      aria-checked={on}
      onClick={onPick}
      disabled={!n}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left outline-none transition hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40',
        on && 'bg-surface-2'
      )}
    >
      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface-2">
        {cover ? (
          <img src={cover.thumb} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-type-3"><Images size={18} /></span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-14-m text-type-0">{source.label}</span>
        <span className="block truncate text-12-r tabular-nums text-type-2">
          {n ? plural(n) : source.empty ?? 'No photos'}
          {before > 0 && <span className="text-type-3"> · {before === n ? 'all' : before.toLocaleString()} downloaded before</span>}
        </span>
      </span>
      <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-sm border transition', on ? 'border-type-0 bg-type-0 text-surface-1' : 'border-type-3 bg-surface-1')}>
        <AnimatePresence>
          {on && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.2, ease }}>
              <Check size={12} weight="bold" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  )
}

function PickFooter({ picked, photos, fit, dl, sizeLabel, quote, onStart }) {
  const n = photos.length
  const limited = dl.rules.limit != null
  const uses = Math.min(fit.fresh, dl.left)
  const before = n - fit.fresh

  const label = !picked.length ? 'Choose what to download'
    : !n ? 'Nothing to download'
    : !fit.take.length ? 'No downloads left'
    : quote?.count ? `Add to cart · ${money(quote.total)}`
    : fit.cut > 0 ? `Download ${fit.take.length.toLocaleString()} of ${n.toLocaleString()}`
    : `Download ${plural(n)}`

  const summary = (quote
    ? [sizeLabel, plural(n), quote.owned > 0 && !quote.whole && (quote.count ? `${quote.owned.toLocaleString()} already yours` : 'already yours')]
    : [sizeLabel, limited && n > 0 && (uses ? `uses ${plural(uses, 'download')}` : 'free re-download')])
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="space-y-3 border-t border-border px-5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
      <AnimatePresence initial={false}>
        {fit.cut > 0 && fit.take.length > 0 && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <span className="flex gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-12-r-p text-type-1">
              <Info size={16} className="mt-px shrink-0 text-type-2" />
              <span>
                {dl.left === 0
                  ? `You have no downloads left, so only the ${plural(before)} you’ve downloaded before ${before === 1 ? 'is' : 'are'} included.`
                  : `Only ${plural(dl.left, 'download')} left, and ${plural(fit.fresh)} here ${fit.fresh === 1 ? 'is' : 'are'} new to you. We’ll download the first ${dl.left.toLocaleString()} new${before > 0 ? `, plus the ${before.toLocaleString()} you’ve downloaded before` : ''}.`}
              </span>
            </span>
          </motion.p>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-3 max-sm:flex-col max-sm:items-stretch">
        <p className="min-w-0 flex-1 truncate text-12-r text-type-2 max-sm:text-center">{summary}</p>
        <Button size="md" onClick={onStart} disabled={!fit.take.length} className="max-sm:w-full">
          {label}
        </Button>
      </div>
    </div>
  )
}

// ── PIN ─────────────────────────────────────────────────────────────────────

/** Four digits. Tries as soon as the fourth is typed; a wrong PIN shakes, clears and says so. */
function PinStep({ photographer, onUnlock }) {
  const [code, setCode] = useState('')
  const [wrong, setWrong] = useState(0) // bumped per wrong try: remounts the field to replay the shake

  const tryCode = (c) => {
    if (c.length < 4) return
    if (onUnlock(c)) return
    setWrong((w) => w + 1)
    setCode('')
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); tryCode(code) }}
      className="flex flex-col items-center pt-2 text-center"
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-2 text-type-0">
        <LockSimple size={24} />
      </span>
      <p className="mt-5 text-20-m text-type-0">Enter your download PIN</p>
      <p className="mt-1 max-w-[300px] text-13-r text-type-2">{photographer} shared a 4-digit PIN with you for downloads.</p>
      <motion.input
        key={wrong}
        autoFocus
        value={code}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 4)
          setCode(v)
          if (v.length === 4) tryCode(v)
        }}
        animate={wrong ? { x: [0, -10, 10, -6, 6, 0] } : undefined}
        transition={{ duration: 0.4, ease }}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="Download PIN"
        aria-invalid={wrong > 0 && !code}
        placeholder="••••"
        className={cn(
          'mt-6 h-14 w-full max-w-[220px] rounded-xl border bg-surface-1 text-center text-24-m tabular-nums tracking-[0.5em] text-type-0 outline-none transition placeholder:text-type-3 focus:border-type-0',
          wrong > 0 && !code ? 'border-destructive' : 'border-input'
        )}
      />
      <p className="mt-2 min-h-[18px] text-12-r text-destructive" aria-live="polite">
        {wrong > 0 && !code ? `That PIN isn’t right. Check the message from ${photographer}.` : ''}
      </p>
      <div className="mt-4 grid w-full gap-2">
        <Button type="submit" size="lg" disabled={code.length < 4}>
          Unlock and download
        </Button>
      </div>
      <p className="mt-4 text-12-r text-type-3">You’ll only need it once per visit.</p>
    </form>
  )
}

// ── Preparing / done ────────────────────────────────────────────────────────

/** A simulated zip: the bar fills over 1.2–4s depending on how many photos, then `onReady`. */
function PreparingStep({ job, onReady, onCancel }) {
  const n = job.photos.length
  const [p, setP] = useState(0)
  const ready = useRef(onReady)
  ready.current = onReady

  useEffect(() => {
    const ms = Math.min(4000, 1200 + n * 10)
    const t0 = performance.now()
    let frame = requestAnimationFrame(function tick(t) {
      const k = Math.min(1, (t - t0) / ms)
      setP(k)
      if (k < 1) frame = requestAnimationFrame(tick)
      else ready.current()
    })
    return () => cancelAnimationFrame(frame)
  }, [n])

  return (
    <div className="flex flex-col items-center pt-2 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-2 text-type-0">
        <FileZip size={24} />
      </span>
      <p className="mt-5 text-20-m text-type-0">Preparing your download</p>
      <p className="mt-1 max-w-full truncate text-13-r text-type-2">{job.file}</p>
      <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)}>
        <div className="h-full rounded-full bg-type-0" style={{ width: `${p * 100}%` }} />
      </div>
      <p className="mt-2 text-12-r tabular-nums text-type-3">
        Packing {Math.max(1, Math.round(p * n)).toLocaleString()} of {plural(n)} · {job.sizeLabel}
      </p>
      <div className="mt-6 grid w-full gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

function DoneStep({ job, dl, onAgain, onClose }) {
  const n = job.photos.length
  return (
    <div className="flex flex-col items-center pt-2 text-center">
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease }}
        className="grid h-14 w-14 place-items-center rounded-full bg-success text-white"
      >
        <Check size={24} weight="bold" />
      </motion.span>
      <p className="mt-5 text-20-m text-type-0">Your download has started</p>
      <p className="mt-1 max-w-full truncate text-14-m text-type-1">{job.file}</p>
      <p className="mt-0.5 text-13-r tabular-nums text-type-2">
        {plural(n)} · {job.sizeLabel}
      </p>
      {dl.rules.limit != null && !job.paid && (
        <p className="mt-4 rounded-full bg-surface-2 px-3 py-1 text-12-r tabular-nums text-type-1">
          {dl.left ? `${plural(dl.left, 'download')} left` : 'No downloads left'}
        </p>
      )}
      <div className="mt-6 grid w-full gap-2">
        <Button size="lg" onClick={onClose}>Done</Button>
        <Button variant="ghost" onClick={onAgain}>Download something else</Button>
      </div>
    </div>
  )
}

/** The High res order went to the store cart: what was added, then Checkout / View cart / back. */
function AddedStep({ order, galleryCount, itemCount, onCheckout, onCart, onAgain, onClose }) {
  return (
    <div className="flex flex-col items-center pt-2 text-center">
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease }}
        className="grid h-14 w-14 place-items-center rounded-full bg-success text-white"
      >
        <Handbag size={24} />
      </motion.span>
      <p className="mt-5 text-20-m text-type-0">In your cart</p>
      <p className="mt-1 text-14-m tabular-nums text-type-1">
        {order.whole ? 'Whole Gallery Download' : `Digital Download · ${plural(order.count)}`} · {money(order.total)}
      </p>
      <p className="mt-1 max-w-[320px] text-13-r text-type-2">
        {order.whole ? `All ${plural(galleryCount)} in high res, no watermark.` : 'Original resolution, no watermark.'} Pay at checkout and {order.whole || order.count > 1 ? 'they unlock' : 'it unlocks'} here straight away.
      </p>
      <div className="mt-6 grid w-full gap-2">
        <Button size="lg" onClick={onCheckout}>Checkout</Button>
        <Button variant="outline" size="lg" onClick={onCart}>View cart ({itemCount.toLocaleString()})</Button>
        <Button variant="ghost" onClick={onAgain}>Download something else</Button>
        <Button variant="ghost" onClick={onClose}>Keep browsing</Button>
      </div>
    </div>
  )
}
