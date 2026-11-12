import { useEffect, useMemo, useRef, useState } from 'react'
import { coverPhoto, gallery, photos as allPhotos } from './data/photos'
import { useGridSettings } from './lib/settings'
import { useMeasuredPhotos } from './lib/hooks'
import Cover from './components/Cover'
import NavBar from './components/NavBar'
import GalleryGrid from './components/GalleryGrid'
import Lightbox from './components/Lightbox'
import Toaster from './components/Toaster'
import { useFavorites } from './lib/actions'

/** Client gallery — the app's entry page. Cover → nav → infinite grid, with a way into the store. */
export default function GalleryPage() {
  const [settings, setSetting] = useGridSettings()
  const [collection, setCollection] = useState('All')
  const [favorites, toggleFav, clearFavs] = useFavorites(gallery.client)
  const [showFavs, setShowFavs] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const gridRef = useRef(null)

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [])

  const photos = useMeasuredPhotos(allPhotos)
  const counts = useMemo(() => {
    const c = { All: photos.length }
    photos.forEach((p) => { c[p.collection] = (c[p.collection] || 0) + 1 })
    return c
  }, [photos])

  const visible = useMemo(() => {
    if (showFavs) return photos.filter((p) => favorites.has(p.id))
    return collection === 'All' ? photos : photos.filter((p) => p.collection === collection)
  }, [photos, collection, showFavs, favorites])

  // Keep the nav pinned at the top of the grid when switching views.
  const toGrid = () => {
    const top = gridRef.current?.offsetTop ?? 0
    if (window.scrollY > top) window.scrollTo({ top, behavior: 'instant' })
  }

  return (
    <div className="min-h-screen bg-background">
      <Cover gallery={gallery} photo={coverPhoto} total={photos.length} onEnter={() => gridRef.current?.scrollIntoView({ behavior: 'smooth' })} />

      <div ref={gridRef}>
        <NavBar
          gallery={gallery}
          collection={collection}
          onCollection={(c) => { setCollection(c); setShowFavs(false); toGrid() }}
          counts={counts}
          settings={settings}
          onSetting={setSetting}
          favCount={favorites.size}
          showFavs={showFavs}
          onToggleFavs={() => { setShowFavs((v) => !v); toGrid() }}
          onClearFavs={() => { clearFavs(); setShowFavs(false) }}
        />
        <GalleryGrid
          photos={visible}
          settings={settings}
          favorites={favorites}
          onFavorite={toggleFav}
          onOpen={setLightbox}
          resetKey={`${collection}|${showFavs}`}
          emptyMessage={showFavs ? 'No favourites yet. Tap the heart on any photo to add it here.' : undefined}
        />
      </div>

      <footer className="border-t border-border px-4 py-10 text-center">
        <img src={gallery.logo} alt={gallery.studio} className="mx-auto h-6 w-auto opacity-70" draggable={false} />
        <p className="mt-3 text-12-r text-type-3">© 2026 {gallery.studio} · {gallery.photographer}</p>
      </footer>

      <Lightbox
        photos={visible}
        index={lightbox}
        onIndex={setLightbox}
        onClose={() => setLightbox(null)}
        favorites={favorites}
        onFavorite={toggleFav}
      />
      <Toaster />
    </div>
  )
}
