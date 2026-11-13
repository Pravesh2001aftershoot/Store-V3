import { useMemo } from 'react'
import { fallbackCover } from '../../gallery/lib/useGalleryData'
import { useMeasuredPhotos } from '../../gallery/lib/hooks'
import { useGalleryLibrary } from '../../gallery/lib/library'
import { useGridDefaults } from '../../gallery/lib/settings'
import { defaultContent as coverDefaults, useCoverConfig } from '../../gallery/templates/cover/config'
import { useCoverPhoto } from '../../gallery/templates/cover/photo'
import { useSectionConfig } from '../../gallery/templates/set-header/config'
import { defaultContent as footerDefaults, defaultSocials, useFooterConfig } from '../../gallery/templates/footer/config'
import { usePortfolio } from '../../portfolio/data/config'

/**
 * Everything the gallery editor edits for one gallery (`data` from useGalleryData; render inside its
 * GalleryProvider), wired the same way the client gallery (GalleryPage) wires it,
 * so both read and write the same saved settings:
 *   library  — photos, collections, order, uploads (gallery/lib/library.js)
 *   cover    — cover settings + `media` (the cover photos)
 *   headings — collection heading settings, following the cover's style
 *   footer   — footer settings, with contact details from the portfolio profile
 *   grid     — the default grid layout clients see
 */
export function useGalleryWorkspace(data) {
  const { gallery } = data
  const library = useGalleryLibrary(data.base, data.baseCollections)
  const photos = useMeasuredPhotos(library.photos)

  // Grouped by collection, in tab order, with each collection's range — what the gallery shows
  // (before any client hides photos on their own device).
  const sections = useMemo(() => {
    let start = 0
    return library.collections
      .map((title) => {
        const n = photos.filter((p) => p.collection === title).length
        const s = { title, start, end: start + n }
        start += n
        return s
      })
      .filter((s) => s.end > s.start)
  }, [photos, library.collections])

  const coverPhoto = fallbackCover(data, photos)
  const coverText = useMemo(() => coverDefaults(gallery, photos.length), [gallery, photos.length])
  const cover = useCoverConfig(coverText)
  const media = useCoverPhoto(coverPhoto, photos)
  const headings = useSectionConfig(cover.config)

  const { profile } = usePortfolio()
  const fDefaults = useMemo(() => footerDefaults(gallery, profile), [gallery, profile])
  const fSocials = useMemo(() => defaultSocials(profile), [profile])
  const footer = useFooterConfig(fDefaults, fSocials)
  const footerPhoto = (footer.config.layout.photoId && photos.find((p) => p.id === footer.config.layout.photoId)) || coverPhoto

  const [grid, setGrid, resetGrid] = useGridDefaults()

  return {
    gallery, meta: data.meta, library, photos, sections, coverPhoto,
    cover, media, headings, footer, footerPhoto,
    grid, setGrid, resetGrid,
  }
}
