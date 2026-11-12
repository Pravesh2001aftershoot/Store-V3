// Gallery photos.
//
// To use real images, drop them into `src/gallery/assets/photos/` (jpg / jpeg / png / webp / avif).
// They're picked up automatically, in filename order, and replace the placeholders.
// Their dimensions are measured in the browser on load (see `useMeasuredPhotos`).
//
// Without local images, the gallery uses the store's photos plus generated placeholders,
// so infinite scroll has enough to load.

import { gallery, photos as storePhotos } from '../../data/gallery'

export { gallery }

const COLLECTIONS = gallery.collections.filter((c) => c !== 'All')

// ── Local images (if any) ───────────────────────────────────────────────────
const local = import.meta.glob('../assets/photos/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  import: 'default',
})
const localThumbs = import.meta.glob('../assets/photos/thumbs/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  import: 'default',
})
const thumbByName = Object.fromEntries(
  Object.entries(localThumbs).map(([path, src]) => [path.split('/').pop(), src]),
)

const localPhotos = Object.entries(local)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([path, src], i) => ({
    id: `local-${path.split('/').pop()}`, // filename-based so saved favourites survive reordering
    name: path.split('/').pop(),
    src,
    thumb: thumbByName[path.split('/').pop()] || src,
    w: 0, // measured at runtime
    h: 0,
    collection: COLLECTIONS[i % COLLECTIONS.length],
  }))

// ── Placeholders ────────────────────────────────────────────────────────────
const SHAPES = [
  [1200, 800],
  [800, 1200],
  [960, 1200],
  [1200, 800],
  [800, 1200],
  [1000, 1000],
  [1200, 800],
  [960, 1200],
]
const PLACEHOLDER_TOTAL = 200

const fromStore = storePhotos.map((p) => ({
  id: p.id,
  name: p.name,
  src: p.src,
  thumb: `https://picsum.photos/id/${p.id.slice(1)}/${Math.round(p.w * 0.7)}/${Math.round(p.h * 0.7)}`,
  w: p.w,
  h: p.h,
  collection: p.collection,
}))

const generated = Array.from({ length: PLACEHOLDER_TOTAL - fromStore.length }, (_, i) => {
  const [w, h] = SHAPES[(i * 5) % SHAPES.length]
  const seed = `lt-${i + 1}`
  return {
    id: `g${i + 1}`,
    name: `LT_${String(3000 + i * 3).padStart(4, '0')}.jpg`,
    src: `https://picsum.photos/seed/${seed}/${w}/${h}`,
    thumb: `https://picsum.photos/seed/${seed}/${Math.round(w * 0.7)}/${Math.round(h * 0.7)}`,
    w,
    h,
    collection: COLLECTIONS[i % COLLECTIONS.length],
  }
})

export const hasLocalPhotos = localPhotos.length > 0
export const photos = hasLocalPhotos ? localPhotos : [...fromStore, ...generated]

/** Cover image: the first local image, or a wide store photo. */
export const coverPhoto = hasLocalPhotos
  ? localPhotos[0]
  : { ...fromStore.find((p) => p.id === 'p1011'), src: 'https://picsum.photos/id/1011/2400/1600' }
