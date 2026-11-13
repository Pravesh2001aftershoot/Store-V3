import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { coverPhoto, gallery, photos as allPhotos } from './data/photos'
import { useGridSettings } from './lib/settings'
import { useMeasuredPhotos } from './lib/hooks'
import CoverSection from './cover/CoverSection'
import { defaultContent as coverDefaults, useCoverConfig } from './cover/config'
import { useSectionConfig } from './sections/config'
import SectionEditor from './sections/SectionEditor'
import NavBar from './components/NavBar'
import GalleryGrid, { sectionId } from './components/GalleryGrid'
import Lightbox from './components/Lightbox'
import Toaster from './components/Toaster'
import QuickBuy from './components/QuickBuy'
import SelectionBar from './components/SelectionBar'
import { registerPhoto } from '../data/gallery'
import { MAX_SETS, downloadPhotos, notify, sharePhotos, useFavorites, useHidden, useSets } from './lib/actions'
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
  const [favorites, toggleFav, clearFavs, setFavs] = useFavorites(gallery.client)
  const [hidden, toggleHidden, clearHidden] = useHidden(gallery.client)
  const [sets, createSet, deleteSet] = useSets(gallery.client)
  const [view, setView] = useState('all') // 'all' | 'favs' | 'hidden' | 'set:<id>'
  const inBucket = view !== 'all' // a flat list (favourites / hidden / a set), not the sectioned gallery
  const [selecting, setSelecting] = useState(false) // multi-select mode
  const [selected, setSelected] = useState(() => new Set()) // selected photo ids
  const anchor = useRef(null) // id of the last photo toggled — the start of a Shift-click range
  const [lightboxId, setLightboxId] = useState(null) // id of the photo open in the lightbox
  const [buying, setBuying] = useState(null) // photo open in the quick-buy panel
  const [minCount, setMinCount] = useState(0)
  const [jump, setJump] = useState(null)
  const gridRef = useRef(null)
  const navRef = useRef(null)
  const lock = useRef(null) // set while a tab jump is scrolling, so the spy doesn't flick through tabs

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [])

  const photos = useMeasuredPhotos(allPhotos)

  // Cover settings live here (not in CoverSection) so collection headings can match the cover's style.
  const coverText = useMemo(() => coverDefaults(gallery, photos.length), [photos.length])
  const cover = useCoverConfig(coverText)
  const headings = useSectionConfig(cover.config)
  const [editingHeading, setEditingHeading] = useState(null) // collection whose heading is being edited

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
  const openSet = view.startsWith('set:') ? sets.find((x) => `set:${x.id}` === view) : null
  const setPhotos = useMemo(() => {
    if (!openSet) return []
    const ids = new Set(openSet.ids)
    return ordered.filter((p) => ids.has(p.id))
  }, [ordered, openSet])
  const visible = view === 'favs' ? favPhotos : view === 'hidden' ? hiddenPhotos : openSet ? setPhotos : ordered

  // A set's count is what it shows: hidden photos are left out, as everywhere else in the gallery.
  const setsWithCounts = useMemo(
    () => sets.map((x) => ({ ...x, count: x.ids.filter((id) => !hidden.has(id)).length })),
    [sets, hidden]
  )
  // The open set was deleted: fall back to the gallery.
  useEffect(() => {
    if (view.startsWith('set:') && !openSet) setView('all')
  }, [view, openSet])

  // ── Multi-select ──────────────────────────────────────────────────────────
  const selectedPhotos = useMemo(() => visible.filter((p) => selected.has(p.id)), [visible, selected])
  const exitSelect = useCallback(() => {
    setSelecting(false)
    setSelected(new Set())
    anchor.current = null
  }, [])
  const selectAll = useCallback(() => setSelected(new Set(visible.map((p) => p.id))), [visible])
  // Switching views starts a fresh selection.
  useEffect(() => { exitSelect() }, [view, exitSelect])
  // Photos that leave the view (e.g. unfavourited in Favourites) leave the selection too.
  useEffect(() => {
    setSelected((s) => (selectedPhotos.length === s.size ? s : new Set(selectedPhotos.map((p) => p.id))))
  }, [selectedPhotos])

  /** Toggles the photo at `i` in `visible` (entering selection mode). Shift extends from the last one toggled. */
  const select = (i, e) => {
    const id = visible[i]?.id
    if (id == null) return
    setSelecting(true)
    const from = e?.shiftKey && anchor.current != null ? visible.findIndex((p) => p.id === anchor.current) : -1
    if (from !== -1) {
      const [lo, hi] = from < i ? [from, i] : [i, from]
      setSelected((s) => {
        const n = new Set(s)
        visible.slice(lo, hi + 1).forEach((p) => n.add(p.id))
        return n
      })
    } else {
      setSelected((s) => {
        const n = new Set(s)
        n.has(id) ? n.delete(id) : n.add(id)
        return n
      })
    }
    anchor.current = id
  }

  const allFavorite = selectedPhotos.length > 0 && selectedPhotos.every((p) => favorites.has(p.id))
  const plural = (n) => `${n} photo${n === 1 ? '' : 's'}`
  const bulk = {
    share: () => sharePhotos(selectedPhotos),
    favorite: () => {
      const n = selectedPhotos.length
      setFavs(selectedPhotos.map((p) => p.id), !allFavorite)
      notify(allFavorite ? `Removed ${plural(n)} from favourites` : `Added ${plural(n)} to favourites`)
      exitSelect()
    },
    download: () => {
      downloadPhotos(selectedPhotos)
      exitSelect()
    },
    createSet: (name) => {
      const made = createSet(name, selectedPhotos.map((p) => p.id))
      if (!made) return notify(`You can keep up to ${MAX_SETS} sets — delete one to make another`)
      notify(`Created “${made.name}” with ${plural(selectedPhotos.length)}`)
      exitSelect()
    },
  }

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
      <CoverSection gallery={gallery} cover={cover} photo={coverPhoto} photos={everything} collections={tabs} onEnter={() => gridRef.current?.scrollIntoView({ behavior: 'smooth' })} />

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
          sets={setsWithCounts}
          onDeleteSet={(id) => { deleteSet(id); setView('all') }}
          selecting={selecting}
          onSelecting={() => (selecting ? exitSelect() : setSelecting(true))}
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
          selecting={selecting}
          selected={selected}
          onSelect={openSet ? undefined : select} // no multi-select inside a client's own set
          headings={headings}
          onEditHeading={selecting ? undefined : setEditingHeading}
          resetKey={view}
          minCount={inBucket ? 0 : minCount}
          emptyMessage={
            view === 'favs' ? 'No favourites yet. Tap the heart on any photo to add it here.'
            : view === 'hidden' ? 'No hidden photos. Photos you hide will wait here.'
            : openSet ? 'Nothing in this set right now — its photos may be hidden.'
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
      <SectionEditor
        open={editingHeading != null}
        onClose={() => setEditingHeading(null)}
        collection={editingHeading ?? sections[0]?.title}
        onCollection={setEditingHeading}
        sections={sections}
        headings={headings}
        photos={ordered}
        cover={cover.config}
      />
      <QuickBuy photo={buying} onClose={() => setBuying(null)} />
      <SelectionBar
        open={selecting}
        count={selectedPhotos.length}
        total={visible.length}
        allFavorite={allFavorite}
        setCount={sets.length}
        onSelectAll={selectAll}
        onSelectNone={() => setSelected(new Set())}
        onShare={bulk.share}
        onFavorite={bulk.favorite}
        onDownload={bulk.download}
        onCreateSet={bulk.createSet}
        onSetLimit={() => notify(`You can keep up to ${MAX_SETS} sets — delete one to make another`)}
        onExit={exitSelect}
      />
      <Toaster raised={selecting} />
    </div>
  )
}
