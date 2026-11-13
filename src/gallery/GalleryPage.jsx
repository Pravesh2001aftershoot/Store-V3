import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { coverPhoto, gallery, photos as allPhotos } from './data/photos'
import { useGridSettings } from './lib/settings'
import { useMeasuredPhotos } from './lib/hooks'
import CoverSection from './cover/CoverSection'
import NavBar from './components/NavBar'
import GalleryGrid, { sectionId } from './components/GalleryGrid'
import Lightbox from './components/Lightbox'
import Toaster from './components/Toaster'
import QuickBuy from './components/QuickBuy'
import { registerPhoto } from '../data/gallery'
import { notify, useFavorites, useHidden } from './lib/actions'
import FooterSection from './footer/FooterSection'

// Every collection is a section of one continuous scroll, so there's no "All" tab.
const COLLECTIONS = gallery.collections.filter((c) => c !== 'All')
const BATCH = 24

/**
 * Client gallery — the app's entry page. Cover → nav → one infinite grid of all collections, in order.
 * The collection tabs follow the scroll (scroll-spy); tapping one jumps to that section.
 */
export default function GalleryPage() {
  const [settings, setSetting] = useGridSettings()
  const [collection, setCollection] = useState(COLLECTIONS[0])
  const [favorites, toggleFav, clearFavs] = useFavorites(gallery.client)
  const [hidden, toggleHidden, clearHidden] = useHidden(gallery.client)
  const [view, setView] = useState('all') // 'all' | 'favs' | 'hidden'
  const inBucket = view !== 'all' // a flat list (favourites / hidden), not the sectioned gallery
  const [lightboxId, setLightboxId] = useState(null) // id of the photo open in the lightbox
  const [buying, setBuying] = useState(null) // photo open in the quick-buy panel
  const [minCount, setMinCount] = useState(0)
  const [jump, setJump] = useState(null)
  const gridRef = useRef(null)
  const navRef = useRef(null)
  const lock = useRef(null) // set while a tab jump is scrolling, so the spy doesn't flick through tabs

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [])

  const photos = useMeasuredPhotos(allPhotos)

  // All photos in collection (tab order) — the cover and footer use the full set, hidden or not.
  const everything = useMemo(() => COLLECTIONS.flatMap((title) => photos.filter((p) => p.collection === title)), [photos])

  // The browsable gallery: hidden photos left out, grouped by collection, plus each collection's range.
  const { ordered, sections } = useMemo(() => {
    const ordered = []
    const sections = COLLECTIONS.map((title) => {
      const start = ordered.length
      photos.forEach((p) => p.collection === title && !hidden.has(p.id) && ordered.push(p))
      return { title, start, end: ordered.length }
    }).filter((s) => s.end > s.start)
    return { ordered, sections }
  }, [photos, hidden])

  const counts = useMemo(() => Object.fromEntries(sections.map((s) => [s.title, s.end - s.start])), [sections])
  const tabs = useMemo(() => sections.map((s) => s.title), [sections])

  const favPhotos = useMemo(() => ordered.filter((p) => favorites.has(p.id)), [ordered, favorites])
  const hiddenPhotos = useMemo(() => everything.filter((p) => hidden.has(p.id)), [everything, hidden])
  const visible = view === 'favs' ? favPhotos : view === 'hidden' ? hiddenPhotos : ordered

  // The lightbox tracks a photo id, not a position, so it can't drift onto another photo when `visible` changes.
  const lightboxIndex = lightboxId == null ? -1 : visible.findIndex((p) => p.id === lightboxId)
  const openAt = (i) => setLightboxId(visible[i]?.id ?? null)
  // The open photo left the view (e.g. unfavourited while browsing favourites): close for good.
  useEffect(() => {
    if (lightboxId != null && lightboxIndex === -1) setLightboxId(null)
  }, [lightboxId, lightboxIndex])

  // Hiding (or unhiding, in the Hidden bucket) takes the photo out of the current view. If it's open
  // in the lightbox, step to its neighbour instead of closing.
  const toggleHide = (id) => {
    const wasHidden = hidden.has(id)
    if (lightboxId === id) {
      const i = visible.findIndex((p) => p.id === id)
      setLightboxId(visible[i + 1]?.id ?? visible[i - 1]?.id ?? null)
    }
    toggleHidden(id)
    notify(wasHidden ? 'Photo is back in the gallery' : 'Photo hidden — find it under Hidden')
  }

  // Quick buy works on store photos, so register this gallery photo with the store first.
  const buy = (photo) => {
    setLightboxId(null)
    setBuying(registerPhoto(photo))
  }

  const navBottom = () => navRef.current?.getBoundingClientRect().bottom ?? 0

  // Scroll-spy: the active tab is the last section whose heading has passed under the nav.
  useEffect(() => {
    if (inBucket) return
    let frame = 0
    const update = () => {
      frame = 0
      if (lock.current) return
      const line = navBottom() + 32
      let active = tabs[0]
      for (const t of tabs) {
        const el = document.getElementById(sectionId(t))
        if (el && el.getBoundingClientRect().top <= line) active = t
      }
      // At the very bottom a short last section may never reach the line — count it as active.
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (atBottom) {
        const rendered = tabs.filter((t) => document.getElementById(sectionId(t)))
        if (rendered.length) active = rendered[rendered.length - 1]
      }
      setCollection((c) => (c === active ? c : active))
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [inBucket, tabs])

  // Tab tap: make sure the section is loaded, then scroll its heading to just under the nav.
  const goTo = (title) => {
    const s = sections.find((x) => x.title === title)
    if (!s) return
    setView('all')
    setCollection(title)
    setMinCount((m) => Math.max(m, Math.min(s.end, s.start + BATCH)))
    setJump({ title }) // new object each time, so tapping the same tab twice still scrolls
  }

  useLayoutEffect(() => {
    if (!jump) return
    const el = document.getElementById(sectionId(jump.title))
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - (navRef.current?.offsetHeight ?? 0)
    lock.current = jump.title
    const release = () => {
      lock.current = null
      window.removeEventListener('scrollend', release)
      window.removeEventListener('wheel', release)
      window.removeEventListener('touchstart', release)
      clearTimeout(timer)
      window.dispatchEvent(new Event('scroll')) // re-sync the spy where the scroll landed
    }
    const timer = setTimeout(release, 1500) // fallback where `scrollend` isn't supported
    window.addEventListener('scrollend', release)
    window.addEventListener('wheel', release, { passive: true }) // the user took over
    window.addEventListener('touchstart', release, { passive: true })
    window.scrollTo({ top, behavior: 'smooth' })
    return release
  }, [jump])

  // Keep the nav pinned at the top of the grid when switching between all photos and a bucket.
  const toGrid = () => {
    const top = gridRef.current?.offsetTop ?? 0
    if (window.scrollY > top) window.scrollTo({ top, behavior: 'instant' })
  }

  return (
    <div className="min-h-screen bg-background">
      <CoverSection gallery={gallery} photo={coverPhoto} photos={everything} collections={tabs} total={photos.length} onEnter={() => gridRef.current?.scrollIntoView({ behavior: 'smooth' })} />

      <div ref={gridRef}>
        <NavBar
          navRef={navRef}
          gallery={gallery}
          collections={tabs}
          collection={collection}
          onCollection={goTo}
          counts={counts}
          settings={settings}
          onSetting={setSetting}
          favCount={favPhotos.length}
          hiddenCount={hidden.size}
          view={view}
          onView={(v) => { setView((cur) => (cur === v ? 'all' : v)); toGrid() }}
          onClearFavs={() => { clearFavs(); setView('all') }}
          onUnhideAll={() => { clearHidden(); setView('all') }}
        />
        <GalleryGrid
          photos={visible}
          sections={inBucket ? undefined : sections}
          settings={settings}
          favorites={favorites}
          onFavorite={toggleFav}
          hidden={hidden}
          onHide={toggleHide}
          onOpen={openAt}
          onBuy={buy}
          resetKey={view}
          minCount={inBucket ? 0 : minCount}
          emptyMessage={
            view === 'favs' ? 'No favourites yet. Tap the heart on any photo to add it here.'
            : view === 'hidden' ? 'No hidden photos. Photos you hide will wait here.'
            : undefined
          }
        />
      </div>

      <FooterSection gallery={gallery} coverPhoto={coverPhoto} photos={everything} onGallery={() => gridRef.current?.scrollIntoView({ behavior: 'smooth' })} />

      <Lightbox
        photos={visible}
        index={lightboxIndex === -1 ? null : lightboxIndex}
        onIndex={openAt}
        onClose={() => setLightboxId(null)}
        favorites={favorites}
        onFavorite={toggleFav}
        hidden={hidden}
        onHide={toggleHide}
        onBuy={buy}
      />
      <QuickBuy photo={buying} onClose={() => setBuying(null)} />
      <Toaster />
    </div>
  )
}
