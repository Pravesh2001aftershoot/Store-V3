import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowClockwise, ArrowLeft, Camera, CameraSlash, Check, ScanSmiley, UploadSimple, X } from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import { cn } from '../../lib/utils'
import { SCAN_MATCH, people, personById, withFaces } from '../data/faces'

const ease = [0.22, 1, 0.36, 1]
const SCAN_MS = 2200 // how long the simulated scan runs

export const MATCH = [
  { id: 'any', label: 'Any of them', hint: 'Photos with at least one of these people.' },
  { id: 'all', label: 'All together', hint: 'Only photos where they’re all in the same shot.' },
]

/**
 * A person's face, cropped from their best photo into a circle (or whatever the parent's shape is).
 * The crop is a square around the face box with room for hair and chin, positioned in percentages,
 * so it scales with the container.
 */
export function FaceAvatar({ person, className }) {
  const { photo, box } = person
  const W = photo.w || 3
  const H = photo.h || 2
  const [x, y, w, h] = box
  const side = Math.max(w * W, h * H) * 1.7 // the visible square, in photo pixels
  const cx = (x + w / 2) * W
  const cy = (y + h / 2) * H - h * H * 0.05 // nudge up a touch: hair reads better than neck
  return (
    <span className={cn('relative block overflow-hidden rounded-full bg-surface-2', className)}>
      <img
        src={photo.thumb}
        alt=""
        draggable={false}
        loading="lazy"
        className="absolute max-w-none select-none"
        style={{
          width: `${(W / side) * 100}%`,
          height: `${(H / side) * 100}%`,
          left: `${-((cx - side / 2) / side) * 100}%`,
          top: `${-((cy - side / 2) / side) * 100}%`,
        }}
      />
    </span>
  )
}

/** Overlapping avatars for a few people (the nav's People header, the match screen). */
export function FaceStack({ ids, size = 'h-6 w-6', max = 3 }) {
  const shown = ids.slice(0, max).map((id) => personById[id]).filter(Boolean)
  return (
    <span className="flex shrink-0 -space-x-2">
      {shown.map((p) => (
        <FaceAvatar key={p.id} person={p} className={cn(size, 'ring-2 ring-surface-0')} />
      ))}
    </span>
  )
}

/**
 * "Find people": a side panel to filter the gallery by face. Scan your own face (camera, or a selfie
 * upload), or pick one or more of the key faces, choose whether they must all be in the same shot,
 * then show the matching photos. Nothing changes in the gallery until "Show N photos".
 *
 * `photos` is the browsable gallery (hidden photos already left out), used for every count.
 */
export default function FacePane({ open, onClose, photos, filter, onApply }) {
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
                <Pane photos={photos} filter={filter} onApply={onApply} />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

// step: 'pick' (key faces) → 'scan' (camera / upload) → 'match' (is this you?)
function Pane({ photos, filter, onApply }) {
  const [step, setStep] = useState('pick')
  const [dir, setDir] = useState(1)
  const [ids, setIds] = useState(filter.ids)
  const [mode, setMode] = useState(filter.mode)
  const [selfie, setSelfie] = useState(null) // the captured / uploaded image (object or data URL)
  const [notMe, setNotMe] = useState(false) // came back from a wrong match: nudge to pick yourself
  const bodyRef = useRef(null)

  const go = (s, d = 1) => { setDir(d); setStep(s) }
  const countOf = (pid) => withFaces(photos, [pid]).length
  const matches = withFaces(photos, ids, mode).length

  const toggle = (pid) => setIds((cur) => (cur.includes(pid) ? cur.filter((x) => x !== pid) : [...cur, pid]))
  const found = (img) => { setSelfie(img); go('match') }

  const title = step === 'scan' ? 'Scan your face' : step === 'match' ? 'Is this you?' : 'Find people'

  return (
    <>
      <div className="flex items-center gap-2 border-b border-border px-5 pb-3 pt-4">
        {step !== 'pick' && (
          <button onClick={() => go('pick', -1)} aria-label="Back" className="-ml-1.5 grid h-9 w-9 place-items-center rounded-full transition hover:bg-surface-2">
            <ArrowLeft size={16} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <Dialog.Title className="truncate text-16-sb">{title}</Dialog.Title>
          {step === 'pick' && <p className="truncate text-12-r text-type-2">Show only the photos of the people you choose</p>}
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
              <PickStep ids={ids} onToggle={toggle} mode={mode} onMode={setMode} countOf={countOf} notMe={notMe} onScan={() => { setNotMe(false); go('scan') }} />
            )}
            {step === 'scan' && <ScanStep total={photos.length} onFound={found} />}
            {step === 'match' && (
              <MatchStep
                selfie={selfie}
                person={personById[SCAN_MATCH]}
                count={countOf(SCAN_MATCH)}
                onYes={() => onApply([SCAN_MATCH], 'any')}
                onAddOthers={() => { setIds((cur) => (cur.includes(SCAN_MATCH) ? cur : [SCAN_MATCH, ...cur])); go('pick', -1) }}
                onNotMe={() => { setNotMe(true); setIds((cur) => cur.filter((x) => x !== SCAN_MATCH)); go('pick', -1) }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {step === 'pick' && (
        <div className="flex items-center gap-2 border-t border-border px-5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
          {ids.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setIds([])} className="-ml-2">
              Clear
            </Button>
          )}
          <span className="flex-1" />
          <Button size="md" disabled={!ids.length || !matches} onClick={() => onApply(ids, ids.length > 1 ? mode : 'any')}>
            {!ids.length ? 'Choose people' : !matches ? 'No photos together' : `Show ${matches} photo${matches === 1 ? '' : 's'}`}
          </Button>
        </div>
      )}
    </>
  )
}

function PickStep({ ids, onToggle, mode, onMode, countOf, notMe, onScan }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-1 text-type-0">
          <ScanSmiley size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-14-sb text-type-0">Find yourself</p>
          <p className="text-12-r text-type-2">Take a selfie and we’ll show every photo you’re in.</p>
        </div>
        <Button size="sm" onClick={onScan}>
          Scan
        </Button>
      </div>

      <div>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <p className="text-11-sb uppercase text-type-2">People in this gallery</p>
          <p className="text-12-r text-type-3">{ids.length ? `${ids.length} chosen` : 'Choose one or more'}</p>
        </div>
        {notMe && (
          <p className="mb-3 rounded-lg bg-surface-2 px-3 py-2 text-12-r text-type-1">Sorry about that. Tap your face below to see your photos.</p>
        )}
        <div className="grid grid-cols-4 gap-x-3 gap-y-4">
          {people.map((p) => {
            const on = ids.includes(p.id)
            const n = countOf(p.id)
            return (
              <button
                key={p.id}
                onClick={() => onToggle(p.id)}
                aria-pressed={on}
                aria-label={`${p.label}, in ${n} photo${n === 1 ? '' : 's'}`}
                className="group flex flex-col items-center gap-1.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="relative w-full">
                  <FaceAvatar
                    person={p}
                    className={cn(
                      'aspect-square w-full ring-offset-2 ring-offset-surface-1 transition',
                      on ? 'ring-2 ring-type-0' : 'ring-1 ring-border group-hover:ring-type-3'
                    )}
                  />
                  <AnimatePresence>
                    {on && (
                      <motion.span
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.4, opacity: 0 }}
                        transition={{ duration: 0.2, ease }}
                        className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full bg-type-0 text-surface-1 ring-2 ring-surface-1"
                      >
                        <Check size={12} weight="bold" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <span className={cn('text-12-r tabular-nums transition', on ? 'text-type-0' : 'text-type-2')}>{n} photos</span>
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {ids.length > 1 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <p className="mb-2 text-11-sb uppercase text-type-2">Show photos with</p>
            <div role="radiogroup" aria-label="Show photos with" className="grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1">
              {MATCH.map((o) => (
                <button
                  key={o.id}
                  role="radio"
                  aria-checked={mode === o.id}
                  onClick={() => onMode(o.id)}
                  className={cn('relative h-8 rounded-full text-13-m text-type-2 transition hover:text-type-0', mode === o.id && 'text-type-0')}
                >
                  {mode === o.id && (
                    <motion.span layoutId="face-match" className="absolute inset-0 rounded-full bg-surface-1 shadow-[0_1px_2px_rgba(0,0,0,.08)]" transition={{ duration: 0.35, ease }} />
                  )}
                  <span className="relative">{o.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-12-r text-type-3">{MATCH.find((o) => o.id === mode).hint}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Camera → capture → simulated scan. Falls back to uploading a selfie when there's no camera or
 * permission is refused. The selfie never leaves the device.
 */
function ScanStep({ total, onFound }) {
  const [state, setState] = useState('starting') // starting | live | blocked | scanning
  const [still, setStill] = useState(null)
  const video = useRef(null)
  const stream = useRef(null)
  const fileRef = useRef(null)
  const attempt = useRef(0) // bumped by every start/stop, so a camera that opens late is shut straight away
  const foundRef = useRef(onFound)
  foundRef.current = onFound

  const stop = () => {
    attempt.current++
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
  }

  const start = async () => {
    stop()
    const mine = attempt.current
    setState('starting')
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('no camera')
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } }, audio: false })
      if (mine !== attempt.current) return s.getTracks().forEach((t) => t.stop()) // closed or restarted meanwhile
      stream.current = s
      if (video.current) video.current.srcObject = s
      setState('live')
    } catch {
      if (mine === attempt.current) setState('blocked')
    }
  }

  useEffect(() => {
    start()
    return stop
  }, [])

  // The scan itself: a short sweep over the still, then the match.
  useEffect(() => {
    if (state !== 'scanning') return
    const t = setTimeout(() => foundRef.current(still), SCAN_MS)
    return () => clearTimeout(t)
  }, [state, still])

  const capture = () => {
    const v = video.current
    if (!v?.videoWidth) return
    const side = Math.min(v.videoWidth, v.videoHeight)
    const c = document.createElement('canvas')
    c.width = c.height = side
    const g = c.getContext('2d')
    // Mirror it, like the preview, and keep the centre square.
    g.translate(side, 0)
    g.scale(-1, 1)
    g.drawImage(v, (v.videoWidth - side) / 2, (v.videoHeight - side) / 2, side, side, 0, 0, side, side)
    setStill(c.toDataURL('image/jpeg', 0.85))
    stop()
    setState('scanning')
  }

  // A data URL rather than an object URL, so nothing needs revoking when the pane closes.
  const upload = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    stop()
    const reader = new FileReader()
    reader.onload = () => {
      setStill(reader.result)
      setState('scanning')
    }
    reader.readAsDataURL(file)
  }

  const scanning = state === 'scanning'

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mx-auto aspect-square w-full max-w-[300px]">
        <div className="absolute inset-0 overflow-hidden rounded-full bg-[#111]">
          {/* Live preview, mirrored so moving left moves left. Kept mounted so the stream can attach. */}
          <video
            ref={video}
            autoPlay
            playsInline
            muted
            className={cn('h-full w-full -scale-x-100 object-cover transition-opacity duration-300', state === 'live' ? 'opacity-100' : 'opacity-0')}
          />
          {still && <img src={still} alt="Your selfie" className="absolute inset-0 h-full w-full object-cover" />}
          {state === 'starting' && (
            <div className="absolute inset-0 grid place-items-center text-white/70">
              <Camera size={32} />
            </div>
          )}
          {state === 'blocked' && (
            <div className="absolute inset-0 grid place-items-center text-white/70">
              <CameraSlash size={32} />
            </div>
          )}
          {scanning && (
            <motion.span
              aria-hidden
              className="absolute inset-x-0 h-16 bg-linear-to-b from-transparent via-white/35 to-transparent"
              initial={{ top: '-20%' }}
              animate={{ top: ['-20%', '100%', '-20%'] }}
              transition={{ duration: SCAN_MS / 1000, ease: 'easeInOut' }}
            />
          )}
        </div>
        {/* Guide ring: dashed while waiting, spinning while scanning */}
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)]" aria-hidden>
          <motion.circle
            cx="50"
            cy="50"
            r="49"
            fill="none"
            stroke="var(--type-0)"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeDasharray={scanning ? '60 248' : '2 4'}
            animate={{ rotate: scanning ? 360 : 0 }}
            transition={scanning ? { duration: 1.1, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
            style={{ originX: '50px', originY: '50px' }}
          />
        </svg>
      </div>

      <div className="mt-6 min-h-[64px]" aria-live="polite">
        {state === 'starting' && <p className="text-14-r text-type-2">Starting the camera…</p>}
        {state === 'live' && (
          <>
            <p className="text-16-sb text-type-0">Centre your face in the circle</p>
            <p className="mt-1 text-13-r text-type-2">Look straight at the camera, in good light.</p>
          </>
        )}
        {state === 'blocked' && (
          <>
            <p className="text-16-sb text-type-0">We can’t use your camera</p>
            <p className="mt-1 text-13-r text-type-2">Allow camera access in your browser, or upload a selfie instead.</p>
          </>
        )}
        {scanning && (
          <>
            <p className="text-16-sb text-type-0">Looking for you…</p>
            <p className="mt-1 text-13-r tabular-nums text-type-2">Checking {total} photos</p>
          </>
        )}
      </div>

      {!scanning && (
        <div className="mt-4 grid w-full gap-2">
          {state === 'live' && (
            <Button size="lg" onClick={capture}>
              <Camera size={18} /> Take selfie
            </Button>
          )}
          {state === 'blocked' && (
            <Button size="lg" onClick={() => fileRef.current?.click()}>
              <UploadSimple size={18} /> Upload a selfie
            </Button>
          )}
          {state === 'blocked' ? (
            <Button variant="ghost" onClick={start}>
              <ArrowClockwise size={16} /> Try the camera again
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => fileRef.current?.click()}>
              <UploadSimple size={16} /> Upload a photo instead
            </Button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        </div>
      )}

      <p className="mt-6 text-12-r-p text-type-3">Your selfie is only used to find you in this gallery. It isn’t saved or shared.</p>
    </div>
  )
}

function MatchStep({ selfie, person, count, onYes, onAddOthers, onNotMe }) {
  if (!person) return null
  return (
    <div className="flex flex-col items-center pt-2 text-center">
      <div className="relative flex items-center justify-center">
        {selfie && (
          <motion.img
            src={selfie}
            alt="Your selfie"
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.45, ease }}
            className="h-24 w-24 rounded-full object-cover ring-4 ring-surface-1"
          />
        )}
        <motion.span
          initial={{ x: -24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease }}
          className={cn('relative', selfie && '-ml-5')}
        >
          <FaceAvatar person={person} className="h-32 w-32 ring-4 ring-surface-1" />
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.35, ease }}
            className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-success text-white ring-4 ring-surface-1"
          >
            <Check size={15} weight="bold" />
          </motion.span>
        </motion.span>
      </div>

      <p className="mt-6 text-20-m text-type-0">We found you in {count} photos</p>
      <p className="mt-1 text-13-r text-type-2">Check it’s you before we filter the gallery.</p>

      <div className="mt-6 grid w-full gap-2">
        <Button size="lg" onClick={onYes}>
          Yes, show my photos
        </Button>
        <Button variant="outline" size="lg" onClick={onAddOthers}>
          Add other people
        </Button>
        <Button variant="ghost" onClick={onNotMe}>
          That’s not me
        </Button>
      </div>
    </div>
  )
}
