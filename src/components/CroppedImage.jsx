import { useState } from 'react'
import { imageStyle } from '../lib/crop'
import { cn } from '../lib/utils'

/** Renders a photo inside a frame of `aspect` using a stored crop. Purely percentage based. */
export default function CroppedImage({ photo, crop, aspect, className, hi = false, style, fill = false }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div
      className={cn('relative overflow-hidden bg-[#e7e6e3]', className)}
      style={{ ...(fill ? { width: '100%', height: '100%' } : { aspectRatio: aspect }), ...style }}
    >
      <img
        src={hi ? photo.src : photo.thumb}
        alt=""
        draggable={false}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={cn('select-none transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0')}
        style={imageStyle(photo, crop, aspect)}
      />
    </div>
  )
}
