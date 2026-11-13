import { GalleryProvider } from '../../data/galleries'
import { useGalleryLibrary } from '../../gallery/lib/library'
import { fallbackCover, useGalleryData } from '../../gallery/lib/useGalleryData'
import { useCoverPhoto } from '../../gallery/templates/cover/photo'

/**
 * Reads one gallery's cover photo and photo count, for lists (cards, the sidebar). Render prop:
 * `children({ photo, count, collections })`. Each gallery's settings are read inside its own provider.
 */
export default function WithGallery({ id, children }) {
  return (
    <GalleryProvider id={id}>
      <Inner id={id}>{children}</Inner>
    </GalleryProvider>
  )
}

function Inner({ id, children }) {
  const data = useGalleryData(id)
  const lib = useGalleryLibrary(data.base, data.baseCollections)
  const media = useCoverPhoto(fallbackCover(data, lib.photos), lib.photos)
  return children({ photo: media.photo, count: lib.photos.length, collections: lib.collections.length, empty: lib.photos.length === 0 })
}

/** The cover photo, cropped around its focal point. */
export function CoverImage({ photo, className }) {
  return (
    <img
      src={photo.thumb ?? photo.src}
      alt=""
      loading="lazy"
      draggable={false}
      className={className}
      style={{ objectPosition: photo.focus ? `${photo.focus.x}% ${photo.focus.y}%` : undefined }}
    />
  )
}
