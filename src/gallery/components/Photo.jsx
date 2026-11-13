import { useRef, useState } from 'react'
import { Heart, Handbag, DownloadSimple, ShareNetwork, Eye, EyeSlash, Check } from '@phosphor-icons/react'
import { downloadPhoto, sharePhoto } from '../lib/actions'
import { cn } from '../../lib/utils'

/**
 * One gallery tile. Keeps its aspect ratio; the parent decides its width.
 * `selecting` switches the tile into multi-select: a tap toggles it (`onSelect(event)`, so the
 * parent can read Shift for range selection) instead of opening the loupe, and the hover actions step aside.
 * On touch screens a long press selects the photo, which is how multi-select starts there.
 */
export default function Photo({ photo, favorite, onFavorite, hidden, onHide, onOpen, onBuy, selecting, selected, onSelect, style, className }) {
  const [loaded, setLoaded] = useState(false)
  const press = useLongPress(onSelect)
  return (
    <figure
      style={{ aspectRatio: `${photo.w} / ${photo.h}`, ...style }}
      className={cn('group relative overflow-hidden bg-surface-2', className)}
    >
      <button
        onClick={(e) => { if (!press.consumeClick()) (selecting ? onSelect : onOpen)(e) }}
        {...press.handlers}
        className={cn('absolute inset-0 block', selecting ? 'cursor-pointer' : 'cursor-zoom-in')}
        aria-label={selecting ? `Select ${photo.name}` : `Open ${photo.name}`}
        aria-pressed={selecting ? !!selected : undefined}
      >
        <img
          src={photo.thumb}
          alt={photo.name}
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
          className={cn(
            'h-full w-full select-none object-cover [-webkit-touch-callout:none] transition-[opacity,transform,border-radius] duration-500 ease-out',
            !selecting && 'group-hover:scale-[1.02]',
            selected && 'scale-[0.9] rounded-[4px]',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      </button>

      {/* Hover actions. Hidden on touch screens: tapping opens the loupe, which carries the same actions. */}
      {!selecting && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 [@media(hover:none)]:hidden" />
          <button
            onClick={onHide}
            aria-label={hidden ? 'Unhide photo' : 'Hide photo'}
            aria-pressed={hidden}
            title={hidden ? 'Unhide' : 'Hide'}
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-surface-1/90 text-type-0 opacity-0 backdrop-blur transition hover:bg-surface-1 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:hidden"
          >
            {hidden ? <Eye size={15} /> : <EyeSlash size={15} />}
          </button>
          <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:hidden">
            <button
              onClick={onFavorite}
              aria-label={favorite ? 'Remove from favourites' : 'Add to favourites'}
              aria-pressed={favorite}
              title={favorite ? 'Remove from favourites' : 'Add to favourites'}
              className="grid h-8 w-8 place-items-center rounded-full bg-surface-1/90 text-type-0 backdrop-blur transition hover:bg-surface-1"
            >
              <Heart size={15} weight={favorite ? 'fill' : 'regular'} className={favorite ? 'text-destructive' : undefined} />
            </button>
            <button
              onClick={() => downloadPhoto(photo)}
              aria-label="Download photo"
              title="Download"
              className="grid h-8 w-8 place-items-center rounded-full bg-surface-1/90 text-type-0 backdrop-blur transition hover:bg-surface-1"
            >
              <DownloadSimple size={15} />
            </button>
            <button
              onClick={() => sharePhoto(photo)}
              aria-label="Share photo"
              title="Share"
              className="grid h-8 w-8 place-items-center rounded-full bg-surface-1/90 text-type-0 backdrop-blur transition hover:bg-surface-1"
            >
              <ShareNetwork size={15} />
            </button>
            <button
              onClick={onBuy}
              aria-label="Buy a print of this photo"
              title="Buy a print"
              className="grid h-8 w-8 place-items-center rounded-full bg-surface-1/90 text-type-0 backdrop-blur transition hover:bg-surface-1"
            >
              <Handbag size={15} />
            </button>
          </div>
        </>
      )}

      {/* Select check: always shown while selecting; otherwise appears on hover as the way into multi-select.
          Left out where the grid doesn't offer multi-select (no `onSelect`), e.g. inside a client's set. */}
      {onSelect && (
      <button
        onClick={onSelect}
        tabIndex={selecting ? -1 : 0}
        aria-label={selected ? `Deselect ${photo.name}` : `Select ${photo.name}`}
        aria-pressed={!!selected}
        title={selected ? 'Deselect' : 'Select'}
        className={cn(
          'absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full border-2 transition duration-200',
          selected
            ? 'border-white bg-primary text-primary-foreground shadow-[0_1px_4px_rgba(0,0,0,.3)]'
            : 'border-white/90 bg-black/15 text-transparent shadow-[0_1px_4px_rgba(0,0,0,.25)] hover:bg-black/30',
          !selecting && 'opacity-0 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:hidden',
          selecting && 'pointer-events-none' // the whole tile toggles while selecting
        )}
      >
        <Check size={12} weight="bold" />
      </button>
      )}

      {favorite && (
        <Heart
          size={14}
          weight="fill"
          className={cn(
            'pointer-events-none absolute text-white drop-shadow transition-opacity',
            selecting ? 'bottom-2 left-2' : 'left-2 top-2 group-hover:opacity-0'
          )}
        />
      )}
    </figure>
  )
}

const HOLD_MS = 450
const SLOP = 10 // px a finger may drift before the hold counts as a scroll

/**
 * Touch long-press. Fires `onLongPress` after a still hold; the click that follows the release is
 * swallowed (`consumeClick`) so the tile doesn't also open. Scrolling cancels it (pointercancel / movement).
 */
function useLongPress(onLongPress) {
  const timer = useRef(0)
  const start = useRef(null)
  const fired = useRef(false)
  const cancel = () => {
    clearTimeout(timer.current)
    start.current = null
  }
  return {
    consumeClick: () => {
      const was = fired.current
      fired.current = false
      return was
    },
    handlers: {
      onPointerDown: (e) => {
        if (e.pointerType !== 'touch' || !onLongPress) return
        fired.current = false
        start.current = { x: e.clientX, y: e.clientY }
        clearTimeout(timer.current)
        timer.current = setTimeout(() => {
          fired.current = true
          start.current = null
          navigator.vibrate?.(10)
          onLongPress?.()
        }, HOLD_MS)
      },
      onPointerMove: (e) => {
        const s = start.current
        if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > SLOP) cancel()
      },
      onPointerUp: cancel,
      onPointerCancel: cancel,
      onPointerLeave: cancel,
      // Stop the system image menu (save / share) popping up over the hold.
      onContextMenu: (e) => e.nativeEvent.pointerType !== 'mouse' && e.preventDefault(),
    },
  }
}
