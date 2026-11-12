import { useState } from 'react'
import { Heart, Handbag, DownloadSimple, ShareNetwork } from '@phosphor-icons/react'
import { downloadPhoto, sharePhoto } from '../lib/actions'
import { cn } from '../../lib/utils'

/** One gallery tile. Keeps its aspect ratio; the parent decides its width. */
export default function Photo({ photo, rounded, favorite, onFavorite, onOpen, onBuy, style, className }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <figure
      style={{ aspectRatio: `${photo.w} / ${photo.h}`, ...style }}
      className={cn('group relative overflow-hidden bg-surface-2', rounded && 'rounded-sm', className)}
    >
      <button onClick={onOpen} className="absolute inset-0 block cursor-zoom-in" aria-label={`Open ${photo.name}`}>
        <img
          src={photo.thumb}
          alt={photo.name}
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
          className={cn(
            'h-full w-full select-none object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.02]',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      </button>

      {/* Hover actions. Always visible on touch screens, which have no hover. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 [@media(hover:none)]:opacity-0" />
      <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
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
      {favorite && (
        <Heart size={14} weight="fill" className="pointer-events-none absolute left-2 top-2 text-white drop-shadow group-hover:opacity-0" />
      )}
    </figure>
  )
}
