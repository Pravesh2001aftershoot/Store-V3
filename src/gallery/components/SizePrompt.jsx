import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, X } from '@phosphor-icons/react'
import { BottomSheet, Button } from '../../components/ui'
import { cn, money } from '../../lib/utils'
import { usePortfolio } from '../../portfolio/data/config'
import { Allowance } from './DownloadPane'
import { GalleryOffer, OrderSummary } from './BuyDownloads'

const ease = [0.22, 1, 0.36, 1]
const PHONE = '(max-width: 639px)'

function useIsPhone() {
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia(PHONE).matches)
  useEffect(() => {
    const mq = window.matchMedia(PHONE)
    const on = () => setPhone(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return phone
}

/** The extra choice in "Download size": no saved size, so each single download asks. */
const ASK = { id: 'ask', label: 'Ask every time', hint: 'Choose a size each time you download a photo.' }
/** The card several paid file versions share; the actual size is the file picked under it. */
const HIGH = 'high-res'

/**
 * Two modes, a centred dialog on tablet and desktop and a bottom sheet on phones:
 * - "Download photo" (`mode: 'download'`): asks which size one photo downloads in (web size or high res),
 *   with "Remember my choice" so the next single downloads skip the question. With a download limit the
 *   allowance card says whether this photo uses one or is a free re-download.
 * - "Download size" (`mode: 'change'`, from the toast's Change): changes the saved size without
 *   downloading anything. Web size / High res / Ask every time, and an unticked "Also download this
 *   photo again" for the photo just saved.
 *
 * When the photographer turns on "Personal use only" and the visitor hasn't agreed once in this gallery yet
 * (`termsAgreed` false, saved by the page), "Download photo" also
 * shows an unticked "I’ll use these photos for personal, non-commercial use only" box, with a line to email
 * the photographer for commercial use. Download stays disabled until it's ticked; after that it's not shown again.
 *
 * With High res sold in the store (dl.rules.paid) each size card shows its price (Free / $15 / Yours). With
 * several Digital Download files, they share one "High res · from $9" card, so the first step is always just
 * Web size or High res. Picking High res opens a second step in the same dialog ("High res": ← Back, one card
 * per file with its price, the whole-gallery offer, Back / Buy for $X) and the dialog doesn't grow. Back keeps
 * the file: the High res card then reads "{file} · tap to change" with that file's price.
 * Choosing a paid size for a photo not bought in it yet turns the button into "Buy for $15": `onBuy(photo, sizeId)`
 * closes this and opens Quick buy on the Digital Download for that photo, so it goes through the store
 * cart and checkout. A card under the sizes offers the Whole Gallery Download (`onBuyGallery`).
 *
 * `prompt`: { mode, photo, size, remember? } while open, else null. `sizes`: the sizes the photographer
 * offers ([{ id, label, hint, price? }]). `onDone(sizeId, flag)`: download mode → (size, remember); change
 * mode → (size, or null for Ask every time; alsoDownload). `dl` (useDownloads) and `photographer` for the
 * allowance. `galleryPhotos`: every photo in the gallery, for the whole-gallery price.
 */
export default function SizePrompt({ prompt, sizes, dl, photographer, termsAgreed = true, galleryPhotos = [], onBuy, onBuyGallery, onClose, onDone }) {
  const isPhone = useIsPhone()
  const open = !!prompt
  const title = prompt?.mode === 'change' ? 'Download size' : 'Download photo'
  const body = prompt && (
    <Body
      key={`${prompt.mode}:${prompt.photo.id}`}
      prompt={prompt}
      sizes={sizes}
      dl={dl}
      photographer={photographer}
      termsAgreed={termsAgreed}
      galleryPhotos={galleryPhotos}
      onBuyGallery={onBuyGallery}
      onClose={onClose}
      onDone={onDone}
      onBuy={onBuy}
    />
  )

  if (isPhone) {
    return (
      <BottomSheet open={open} onClose={onClose} title={title}>
        {body}
      </BottomSheet>
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            </Dialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-[70] grid place-items-center p-4">
              <Dialog.Content asChild aria-describedby={undefined} onOpenAutoFocus={(e) => e.preventDefault()}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 4 }}
                  transition={{ duration: 0.3, ease }}
                  className="pointer-events-auto w-full max-w-[400px] rounded-2xl bg-surface-1 p-5 shadow-2xl outline-none"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <Dialog.Title className="flex-1 text-16-sb text-type-0">{title}</Dialog.Title>
                    <Dialog.Close className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 transition hover:bg-[#ececec]" aria-label="Close">
                      <X size={16} />
                    </Dialog.Close>
                  </div>
                  {body}
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

function Body({ prompt, sizes, dl, photographer, termsAgreed, galleryPhotos, onBuyGallery, onClose, onDone, onBuy }) {
  const { photo, mode } = prompt
  const changing = mode === 'change'
  const options = changing ? [...sizes, ASK] : sizes
  const limited = dl?.rules.limit != null
  const isNew = dl ? dl.isNew(photo) : true
  const paid = !!dl?.rules.paid
  // Bought in the original resolution (or the whole gallery): every paid size is free for this photo.
  const owned = paid && dl.owns(photo)
  const ownsSize = (z) => paid && dl.ownsSize(photo, z.id)
  // Out of free downloads: the free size can't be picked for a new photo (High res can still be bought).
  const freeOut = paid && limited && isNew && dl.left < 1
  const usable = (z) => !(freeOut && z.id === 'web')
  const [size, setSize] = useState(() => {
    // A photo already bought starts on the best size they own: it's free for them.
    const mine = paid && !prompt.size && options.find((z) => dl.isPaid(z.id) && ownsSize(z))
    const want = options.find((z) => z.id === (prompt.size ?? mine?.id) && usable(z))
    return (want ?? options.find(usable) ?? options[0])?.id
  })
  const [remember, setRemember] = useState(!!prompt.remember)
  const [again, setAgain] = useState(false)
  // Asked until agreed once; read when the prompt opens so it doesn't vanish the moment it's saved.
  const [askTerms] = useState(() => !changing && !termsAgreed)
  const [agree, setAgree] = useState(false)
  const email = usePortfolio().profile?.email
  const sizeLabel = sizes.find((z) => z.id === size)?.label
  const mustBuy = paid && dl.isPaid(size) && !dl.ownsSize(photo, size)
  const quote = paid ? dl.quote([photo], galleryPhotos, size) : null
  // The allowance only matters for free downloads.
  const showAllowance = limited && !(paid && dl.isPaid(size))
  // Several paid files share one "High res" card (in place of the first one). Picking it opens a second
  // step, "High res", listing the files, so the first step stays two short cards.
  const paidSizes = paid ? options.filter((z) => dl.isPaid(z.id)) : []
  const grouped = paidSizes.length > 1
  const [step, setStep] = useState('size') // 'size' | 'files'
  const tier = grouped && dl.isPaid(size) ? HIGH : size
  const current = sizes.find((z) => z.id === size)
  const cards = grouped
    ? options.flatMap((z) => (!dl.isPaid(z.id) ? [z] : z === paidSizes[0]
      ? [{ id: HIGH, label: 'High res', hint: tier === HIGH ? `${current.label} · tap to change` : `Best for printing. Choose from ${paidSizes.length} file sizes.` }]
      : []))
    : options
  // Back on High res, start on the file picked last, else one they own, else the original resolution.
  const lastPaid = useRef(null)
  if (dl?.isPaid(size)) lastPaid.current = size
  const pick = (id) => {
    if (id !== HIGH) return setSize(id)
    const back = paidSizes.find((z) => z.id === lastPaid.current) ?? paidSizes.find(ownsSize)
    setSize(back?.id ?? dl.rules.paid.full)
    setStep('files')
  }
  const priceOf = (z) => {
    if (!paid || z.id === ASK.id) return null
    // The High res card shows the file picked (once there is one), else the lowest price.
    if (z.id === HIGH) return tier === HIGH ? priceOf(current) : paidSizes.some(ownsSize) ? { text: 'Yours', tone: 'owned' } : { text: `from ${money(dl.rules.paid.from)}`, tone: 'paid' }
    if (z.price == null || z.price === 0) return { text: 'Free' }
    return ownsSize(z) ? { text: 'Yours', tone: 'owned' } : { text: money(z.price), tone: 'paid' }
  }
  const needsAgree = askTerms && !mustBuy && !agree
  const primary = !changing && mustBuy
    ? { label: `Buy for ${money(quote.total)}`, run: () => onBuy(photo, size) }
    : { label: 'Download', run: () => onDone(size, remember) }

  if (step === 'files') {
    return (
      <Step key="files">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep('size')}
            aria-label="Back"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 outline-none transition hover:bg-[#ececec] focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="min-w-0">
            <p className="text-14-m text-type-0">High res</p>
            <p className="text-12-r text-type-2">{changing ? 'Choose a file size.' : 'Choose a file size. Pay once, download any time.'}</p>
          </div>
        </div>
        <div role="radiogroup" aria-label="File size" className="mt-4 space-y-2">
          {paidSizes.map((z) => (
            <SizeCard
              key={z.id}
              size={z}
              on={size === z.id}
              onPick={() => setSize(z.id)}
              price={priceOf(z)}
              hint={dl.rules.paid.versions.find((v) => v.id === z.version)?.note} // one short line ("No watermark") keeps the step compact
            />
          ))}
        </div>
        {!changing && !owned && !dl.ownsAll && onBuyGallery && (
          <GalleryOffer quote={quote} galleryCount={galleryPhotos.length} onPick={() => onBuyGallery(`file:${quote.version}`)} />
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="md" onClick={() => setStep('size')} className="max-sm:flex-1">Back</Button>
          {changing || needsAgree ? (
            // Change mode, or the personal-use box still to tick: confirm the file and go back to the first step.
            <Button size="md" onClick={() => setStep('size')} className="max-sm:flex-1">Done</Button>
          ) : (
            <Button size="md" onClick={primary.run} className="max-sm:flex-1 tabular-nums">{primary.label}</Button>
          )}
        </div>
      </Step>
    )
  }

  return (
    <Step key="size">
      {changing ? (
        <p className="text-13-r text-type-2">For photos you download one at a time, from the gallery or a full-screen photo. Nothing downloads until you choose to.</p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <img
              src={photo.thumb}
              alt=""
              draggable={false}
              className="h-11 w-auto max-w-[88px] shrink-0 bg-surface-2 object-cover"
              style={{ aspectRatio: `${photo.w || 3} / ${photo.h || 2}` }}
            />
            <p className="min-w-0 truncate text-14-m text-type-0">{photo.name}</p>
          </div>
          {showAllowance && (
            <div className="mt-4">
              <Allowance
                limit={dl.rules.limit}
                used={dl.used}
                left={dl.left}
                photographer={photographer}
                note={isNew
                  ? `This photo uses 1 download, leaving ${(dl.left - 1).toLocaleString()}.`
                  : 'You’ve downloaded this photo before, so it’s free.'}
              />
            </div>
          )}
        </>
      )}

      <p className={cn('mb-2 text-11-sb uppercase text-type-2', changing ? 'mt-4' : 'mt-5')}>Size</p>
      <div role="radiogroup" aria-label="Size" className="space-y-2">
        {cards.map((z) => (
          <SizeCard
            key={z.id}
            size={z}
            on={tier === z.id}
            onPick={() => pick(z.id)}
            price={priceOf(z)}
            disabled={!usable(z)}
            hint={!usable(z) ? 'You’ve used all your free downloads.' : undefined}
          />
        ))}
      </div>
      {/* One paid file (no second step): its order and the whole-gallery offer stay here. */}
      {!grouped && !changing && mustBuy && (
        <div className="mt-3">
          <OrderSummary quote={quote} galleryCount={galleryPhotos.length} />
        </div>
      )}
      {!grouped && !changing && paid && !owned && !dl.ownsAll && onBuyGallery && (
        <GalleryOffer quote={quote} galleryCount={galleryPhotos.length} onPick={() => onBuyGallery(`file:${quote.version}`)} />
      )}

      {changing ? (
        size !== ASK.id && !mustBuy && (
          <CheckRow
            on={again}
            onToggle={() => setAgain((a) => !a)}
            label={`Also download this photo again in ${sizeLabel}`}
            hint={limited ? (isNew ? 'Uses 1 download' : 'Free · you’ve downloaded it before') : photo.name}
            thumb={photo.thumb}
          />
        )
      ) : (
        <CheckRow
          on={remember}
          onToggle={() => setRemember((r) => !r)}
          label="Remember my choice"
          hint="Don’t ask again in this gallery. You can change it any time."
        />
      )}
      {askTerms && !mustBuy && (
        <>
          <CheckRow
            on={agree}
            onToggle={() => setAgree((a) => !a)}
            label="I’ll use these photos for personal, non-commercial use only"
            hint="We’ll remember this for your next downloads."
          />
          <p className="mt-1 pl-8 text-12-r text-type-2">
            Need them for commercial use?{' '}
            {email ? (
              <a href={`mailto:${email}`} className="text-type-0 underline underline-offset-2">Contact {photographer}</a>
            ) : (
              <>Contact {photographer}.</>
            )}
          </p>
        </>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" size="md" onClick={onClose} className="max-sm:flex-1">Cancel</Button>
        {changing ? (
          <Button size="md" onClick={() => onDone(size === ASK.id ? null : size, size !== ASK.id && again)} className="max-sm:flex-1">
            {again && size !== ASK.id ? 'Save and download' : 'Save'}
          </Button>
        ) : (
          <Button size="md" disabled={needsAgree} onClick={primary.run} className="max-sm:flex-1 tabular-nums">{primary.label}</Button>
        )}
      </div>
    </Step>
  )
}

/** One step of the prompt: slides in sideways when the step changes. */
function Step({ children }) {
  return (
    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, ease }}>
      {children}
    </motion.div>
  )
}

/** `price`: { text, tone? } shown right of the label with paid downloads (Free / $15 / Yours). */
function SizeCard({ size, on, onPick, price, disabled, hint }) {
  return (
    <button
      role="radio"
      aria-checked={on}
      onClick={onPick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        on ? 'border-type-0 bg-surface-2' : 'border-border hover:bg-surface-2'
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-14-m text-type-0">{size.label}</span>
          {price && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-11-sb tabular-nums',
                price.tone === 'paid' ? 'bg-type-0 text-surface-1' : price.tone === 'owned' ? 'bg-success-bg text-success' : 'bg-surface-1 text-type-1 ring-1 ring-border'
              )}
            >
              {price.text}
            </span>
          )}
        </span>
        <span className="block text-12-r text-type-2">{hint ?? size.hint}</span>
      </span>
      <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full border transition', on ? 'border-type-0' : 'border-type-3')}>
        <AnimatePresence>
          {on && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2, ease }}
              className="h-2.5 w-2.5 rounded-full bg-type-0"
            />
          )}
        </AnimatePresence>
      </span>
    </button>
  )
}

function CheckRow({ on, onToggle, label, hint, thumb }) {
  return (
    <button
      role="checkbox"
      aria-checked={on}
      onClick={onToggle}
      className="-mx-2 mt-3 flex w-[calc(100%+16px)] items-start gap-3 rounded-xl px-2 py-2 text-left outline-none transition hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-sm border transition', on ? 'border-type-0 bg-type-0 text-surface-1' : 'border-type-3 bg-surface-1')}>
        <AnimatePresence>
          {on && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.2, ease }}>
              <Check size={12} weight="bold" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-14-m text-type-0">{label}</span>
        <span className="block truncate text-12-r text-type-2">{hint}</span>
      </span>
      {thumb && <img src={thumb} alt="" draggable={false} className="h-9 w-9 shrink-0 rounded-md bg-surface-2 object-cover" />}
    </button>
  )
}
