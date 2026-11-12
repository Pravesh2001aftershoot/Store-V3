import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CaretLeft, CaretRight, DownloadSimple, Handbag, Heart, ShareNetwork, X } from '@phosphor-icons/react'
import { downloadPhoto, sharePhoto } from '../lib/actions'

/** Full-screen photo viewer. Arrow keys / Esc supported. */
export default function Lightbox({ photos, index, onIndex, onClose, favorites, onFavorite }) {
  const open = index != null && photos[index]
  const photo = open ? photos[index] : null

  useEffect(() => {
    if (!open) return
    const key = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndex((index + 1) % photos.length)
      if (e.key === 'ArrowLeft') onIndex((index - 1 + photos.length) % photos.length)
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
              <button onClick={() => downloadPhoto(photo)} className={btn} aria-label="Download photo" title="Download">
                <DownloadSimple size={20} />
              </button>
              <button onClick={() => sharePhoto(photo)} className={btn} aria-label="Share photo" title="Share">
                <ShareNetwork size={20} />
              </button>
              <Link to="/store" className="mx-1 flex h-10 items-center gap-2 rounded-full bg-white px-4 text-14-m text-type-0 transition hover:bg-white/90">
                <Handbag size={16} /> <span className="max-sm:hidden">Buy print</span>
              </Link>
              <button onClick={onClose} className={btn} aria-label="Close">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6 md:px-20">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.img
                key={photo.id}
                src={photo.src}
                alt={photo.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="max-h-full max-w-full select-none object-contain"
                draggable={false}
              />
            </AnimatePresence>
            <button onClick={() => onIndex((index - 1 + photos.length) % photos.length)} className={`${btn} absolute left-2 top-1/2 -translate-y-1/2 md:left-6`} aria-label="Previous photo">
              <CaretLeft size={22} />
            </button>
            <button onClick={() => onIndex((index + 1) % photos.length)} className={`${btn} absolute right-2 top-1/2 -translate-y-1/2 md:right-6`} aria-label="Next photo">
              <CaretRight size={22} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
