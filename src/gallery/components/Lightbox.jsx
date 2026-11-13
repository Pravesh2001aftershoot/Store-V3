import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CaretLeft, CaretRight, DownloadSimple, Eye, EyeSlash, Handbag, Heart, ShareNetwork, X } from '@phosphor-icons/react'
import { downloadPhoto, sharePhoto } from '../lib/actions'

const SWIPE_DISTANCE = 60 // px dragged before release counts as a swipe
const SWIPE_VELOCITY = 400 // px/s flick counts as a swipe even if short

const slide = {
  enter: (dir) => ({ x: dir * 80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir * -80, opacity: 0 }),
}

/** Touch devices get swipe-to-navigate on the photo; mouse users keep the arrow buttons. */
function useCoarsePointer() {
  const [coarse, setCoarse] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const onChange = () => setCoarse(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return coarse
}

/** Full-screen photo viewer. Arrow keys / Esc, and swipe on touch devices. */
export default function Lightbox({ photos, index, onIndex, onClose, favorites, onFavorite, hidden, onHide, onBuy }) {
  const open = index != null && photos[index]
  const photo = open ? photos[index] : null
  const dir = useRef(1) // 1 = moving forward, -1 = backward; drives slide direction
  const swipeable = useCoarsePointer()

  const go = (delta) => {
    dir.current = delta
    onIndex((index + delta + photos.length) % photos.length)
  }
  const jump = (i) => {
    if (i === index) return
    dir.current = i > index ? 1 : -1
    onIndex(i)
  }
  const onDragEnd = (_, { offset, velocity }) => {
    if (Math.abs(offset.x) > SWIPE_DISTANCE || Math.abs(velocity.x) > SWIPE_VELOCITY) {
      go(offset.x < 0 ? 1 : -1)
    }
  }

  useEffect(() => {
    if (!open) return
    const key = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('keydown', key)
      document.body.style.overflow = prev
    }
  }, [open, index, photos.length, onIndex, onClose])

  const btn = 'grid h-10 w-10 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white'

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={photo.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col bg-type-0 text-white"
        >
          <div className="flex items-center justify-between px-3 py-3 md:px-6">
            <p className="text-13-r tabular-nums text-white/60">
              {index + 1} / {photos.length} <span className="ml-2 max-sm:hidden">{photo.name}</span>
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => onFavorite(photo.id)} className={btn} aria-label="Favourite" title="Favourite" aria-pressed={favorites.has(photo.id)}>
                <Heart size={20} weight={favorites.has(photo.id) ? 'fill' : 'regular'} className={favorites.has(photo.id) ? 'text-destructive' : undefined} />
              </button>
              <button
                onClick={() => onHide(photo.id)}
                className={btn}
                aria-label={hidden.has(photo.id) ? 'Unhide photo' : 'Hide photo'}
                title={hidden.has(photo.id) ? 'Unhide' : 'Hide'}
                aria-pressed={hidden.has(photo.id)}
              >
                {hidden.has(photo.id) ? <Eye size={20} /> : <EyeSlash size={20} />}
              </button>
              <button onClick={() => downloadPhoto(photo)} className={btn} aria-label="Download photo" title="Download">
                <DownloadSimple size={20} />
              </button>
              <button onClick={() => sharePhoto(photo)} className={btn} aria-label="Share photo" title="Share">
                <ShareNetwork size={20} />
              </button>
              <button onClick={() => onBuy(photo)} className="mx-1 flex h-10 items-center gap-2 rounded-full bg-white px-4 text-14-m text-type-0 transition hover:bg-white/90">
                <Handbag size={16} /> <span className="max-sm:hidden">Buy print</span>
              </button>
              <button onClick={onClose} className={btn} aria-label="Close">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
          <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center px-2 pb-4 md:px-20">
            <AnimatePresence mode="popLayout" initial={false} custom={dir.current}>
              <motion.img
                key={photo.id}
                src={photo.src}
                alt={photo.name}
                custom={dir.current}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeOut' }}
                drag={swipeable ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                dragSnapToOrigin
                onDragEnd={onDragEnd}
                className="max-h-full max-w-full select-none object-contain"
                draggable={false}
              />
            </AnimatePresence>
            <button onClick={() => go(-1)} className={`${btn} absolute left-2 top-1/2 -translate-y-1/2 md:left-6`} aria-label="Previous photo">
              <CaretLeft size={22} />
            </button>
            <button onClick={() => go(1)} className={`${btn} absolute right-2 top-1/2 -translate-y-1/2 md:right-6`} aria-label="Next photo">
              <CaretRight size={22} />
            </button>
          </div>
          <FilmStrip photos={photos} index={index} onIndex={jump} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Thumbnail rail: vertical on the right on desktop (lg+), horizontal along the bottom on tablet / mobile. */
function FilmStrip({ photos, index, onIndex }) {
  const active = useRef(null)

  useEffect(() => {
    active.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [index])

  return (
    <nav
      aria-label="Film strip"
      className="no-scrollbar shrink-0 overflow-x-auto px-3 pb-3 md:px-6 md:pb-5"
    >
      <div className="mx-auto flex w-max gap-2 p-1">
      {photos.map((p, i) => {
        const current = i === index
        return (
          <button
            key={p.id}
            ref={current ? active : undefined}
            onClick={() => onIndex(i)}
            aria-label={`View ${p.name}`}
            aria-current={current ? 'true' : undefined}
            className={`shrink-0 overflow-hidden rounded-none ring-2 ring-offset-2 ring-offset-type-0 transition ${
              current ? 'opacity-100 ring-white' : 'opacity-50 ring-transparent hover:opacity-80'
            }`}
          >
            <img
              src={p.thumb || p.src}
              alt=""
              loading="lazy"
              draggable={false}
              className="block h-14 w-auto max-w-none select-none object-cover md:h-20"
            />
          </button>
        )
      })}
      </div>
    </nav>
  )
}
