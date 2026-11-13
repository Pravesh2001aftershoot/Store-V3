import { useMemo } from 'react'
import { DEFAULT_GALLERY, useGalleries, withBranding } from '../../data/galleries'
import { gallery as sample } from '../../data/gallery'
import { coverPhoto as sampleCover, photos as samplePhotos } from '../data/photos'

const NONE = []

/** Cover for a gallery with no photos yet: a neutral wide placeholder. */
export const PLACEHOLDER_COVER = {
  id: 'placeholder-cover',
  name: 'Placeholder',
  src: 'https://picsum.photos/id/1047/2400/1600',
  thumb: 'https://picsum.photos/id/1047/720/480',
  w: 2400,
  h: 1600,
  collection: null,
}

/**
 * What a gallery page renders from: the gallery object (registry details + branding), its base
 * photos (the bundled sample photos for the sample gallery, none for a new one — those only have
 * uploads), its starting collections, and its default cover. Null for an unknown id.
 */
export function useGalleryData(id) {
  const { galleries } = useGalleries()
  const meta = galleries.find((g) => g.id === id)
  return useMemo(() => {
    if (!meta) return null
    return {
      meta,
      gallery: withBranding(meta),
      base: meta.sample ? samplePhotos : NONE,
      baseCollections: meta.collections,
      defaultCover: meta.sample ? sampleCover : null,
      /** Key for the client's own favourites / hidden / sets. The sample keeps its original key. */
      clientKey: id === DEFAULT_GALLERY ? sample.client : `gallery:${id}`,
    }
  }, [meta, id])
}

/** The cover to fall back to: the gallery's default, else its first photo, else a placeholder. */
export const fallbackCover = (data, photos) => data.defaultCover ?? photos[0] ?? PLACEHOLDER_COVER
