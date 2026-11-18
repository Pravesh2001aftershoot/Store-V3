import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X } from '@phosphor-icons/react'
import { BottomSheet, Button } from '../../components/ui'
import { cn } from '../../lib/utils'
import { Allowance } from './DownloadPane'

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

/**
 * Two modes, a centred dialog on tablet and desktop and a bottom sheet on phones:
 * - "Download photo" (`mode: 'download'`): asks which size one photo downloads in (web size or high res),
 *   with "Remember my choice" so the next single downloads skip the question. With a download limit the
 *   allowance card says whether this photo uses one or is a free re-download.
 * - "Download size" (`mode: 'change'`, from the toast's Change): changes the saved size without
 *   downloading anything. Web size / High res / Ask every time, and an unticked "Also download this
 *   photo again" for the photo just saved.
 *
 * `prompt`: { mode, photo, size, remember? } while open, else null. `sizes`: the sizes the photographer
 * offers ([{ id, label, hint }]). `onDone(sizeId, flag)`: download mode → (size, remember); change mode →
 * (size, or null for Ask every time; alsoDownload). `dl` (useDownloads) and `photographer` for the allowance.
 */
export default function SizePrompt({ prompt, sizes, dl, photographer, onClose, onDone }) {
  const isPhone = useIsPhone()
  const open = !!prompt
  const title = prompt?.mode === 'change' ? 'Download size' : 'Download photo'
  const body = prompt && (
    <Body key={`${prompt.mode}:${prompt.photo.id}`} prompt={prompt} sizes={sizes} dl={dl} photographer={photographer} onClose={onClose} onDone={onDone} />
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
                  <div className="mb-4 flex items-center justify-between">
                    <Dialog.Title className="text-16-sb text-type-0">{title}</Dialog.Title>
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

function Body({ prompt, sizes, dl, photographer, onClose, onDone }) {
  const { photo, mode } = prompt
  const changing = mode === 'change'
  const options = changing ? [...sizes, ASK] : sizes
  const [size, setSize] = useState(options.some((z) => z.id === prompt.size) ? prompt.size : options[0]?.id)
  const [remember, setRemember] = useState(!!prompt.remember)
  const [again, setAgain] = useState(false)
  const limited = dl?.rules.limit != null
  const isNew = dl ? dl.isNew(photo) : true
  const sizeLabel = sizes.find((z) => z.id === size)?.label

  return (
    <div>
      {changing ? (
        <p className="text-13-r text-type-2">For photos you download one at a time, from the gallery or a full-screen photo. Nothing downloads until you choose to.</p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <img src={photo.thumb} alt="" draggable={false} className="h-11 w-11 shrink-0 rounded-lg bg-surface-2 object-cover" />
            <p className="min-w-0 truncate text-14-m text-type-0">{photo.name}</p>
          </div>
          {limited && (
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
        {options.map((z) => (
          <SizeCard key={z.id} size={z} on={size === z.id} onPick={() => setSize(z.id)} />
        ))}
      </div>

      {changing ? (
        size !== ASK.id && (
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

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" size="md" onClick={onClose} className="max-sm:flex-1">Cancel</Button>
        {changing ? (
          <Button size="md" onClick={() => onDone(size === ASK.id ? null : size, size !== ASK.id && again)} className="max-sm:flex-1">
            {again && size !== ASK.id ? 'Save and download' : 'Save'}
          </Button>
        ) : (
          <Button size="md" onClick={() => onDone(size, remember)} className="max-sm:flex-1">Download</Button>
        )}
      </div>
    </div>
  )
}

function SizeCard({ size, on, onPick }) {
  return (
    <button
      role="radio"
      aria-checked={on}
      onClick={onPick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-ring',
        on ? 'border-type-0 bg-surface-2' : 'border-border hover:bg-surface-2'
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-14-m text-type-0">{size.label}</span>
        <span className="block text-12-r text-type-2">{size.hint}</span>
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
