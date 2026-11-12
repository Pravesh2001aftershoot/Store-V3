// Mock client gallery — the gallery the client arrived from.
// Original pixel dimensions are simulated (display dims × 4) to drive print-quality checks.

export const gallery = {
  studio: 'Aftershoot',
  logo: '/aftershoot-logo.png',
  photographer: 'Esteban Gill',
  client: 'Lexie & Taylor',
  title: 'Lexie & Taylor — Engagement',
  date: 'September 2026',
  collections: ['All', 'Golden Hour', 'Portraits', 'Details', 'Adventures'],
}

const L = [1200, 800] // landscape 3:2
const P = [800, 1200] // portrait 2:3
const F = [960, 1200] // portrait 4:5
const S = [1000, 1000] // square

const raw = [
  [1011, L, 'Golden Hour'],
  [1027, P, 'Portraits'],
  [64, F, 'Portraits'],
  [1015, L, 'Adventures'],
  [1005, P, 'Portraits'],
  [1018, L, 'Adventures'],
  [1025, F, 'Details'],
  [1043, P, 'Golden Hour'],
  [1036, L, 'Adventures'],
  [91, F, 'Portraits'],
  [1035, P, 'Adventures'],
  [1040, L, 'Details'],
  [177, S, 'Golden Hour'],
  [1044, P, 'Golden Hour'],
  [1039, L, 'Adventures'],
  [338, F, 'Portraits'],
  [1047, P, 'Details'],
  [1050, L, 'Golden Hour'],
  [237, S, 'Details'],
  [1019, L, 'Adventures'],
  [342, P, 'Portraits'],
  [1069, L, 'Golden Hour'],
  [433, F, 'Details'],
  [1056, P, 'Adventures'],
  [1062, L, 'Details'],
  [1059, F, 'Details'],
  [1074, L, 'Golden Hour'],
  [453, P, 'Portraits'],
]

const placeholderPhotos = raw.map(([pid, [w, h], collection], i) => ({
  id: `p${pid}`,
  name: `LT_${String(2040 + i * 7).padStart(4, '0')}.jpg`,
  w,
  h,
  ow: w * 4,
  oh: h * 4,
  collection,
  src: `https://picsum.photos/id/${pid}/${w}/${h}`,
  thumb: `https://picsum.photos/id/${pid}/${Math.round(w / 2)}/${Math.round(h / 2)}`,
}))

// ── Gallery photos (src/gallery/assets/photos) ──────────────────────────────
// When the gallery has local images, the whole store uses them. Their pixel sizes come from
// dims.json (regenerate with `npm run photos:dims` after adding images).
const COLLECTIONS = gallery.collections.filter((c) => c !== 'All')
const localFiles = import.meta.glob('../gallery/assets/photos/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}', { eager: true, import: 'default' })
const localThumbFiles = import.meta.glob('../gallery/assets/photos/thumbs/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}', { eager: true, import: 'default' })
const localDims = Object.values(import.meta.glob('../gallery/assets/photos/dims.json', { eager: true, import: 'default' }))[0] || {}
const fileName = (path) => path.split('/').pop()
const thumbByName = Object.fromEntries(Object.entries(localThumbFiles).map(([path, src]) => [fileName(path), src]))

// Exports are ~2000px on the long edge; originals are simulated at 3× for print-quality checks.
const ORIGINAL_SCALE = 3

export const localPhotos = Object.entries(localFiles)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([path, src], i) => {
    const name = fileName(path)
    const [w, h] = localDims[name] || [0, 0] // 0 → measured at runtime by the gallery
    return {
      id: `local-${name}`, // filename-based so saved favourites survive reordering
      name,
      src,
      thumb: thumbByName[name] || src,
      w,
      h,
      ow: w * ORIGINAL_SCALE,
      oh: h * ORIGINAL_SCALE,
      collection: COLLECTIONS[i % COLLECTIONS.length],
    }
  })

export const hasLocalPhotos = localPhotos.length > 0

// The store only offers photos whose size is known (crops and print checks need it).
const sizedLocal = localPhotos.filter((p) => p.w && p.h)
const useLocal = sizedLocal.length > 0
export const photos = useLocal ? sizedLocal : placeholderPhotos

export const photoById = Object.fromEntries(photos.map((p) => [p.id, p]))

// Catalog heroes, product mockups and saved carts refer to the placeholder ids (p1011, …).
// With local photos, each one maps to a distinct gallery photo of the same orientation.
if (useLocal) {
  const shape = (w, h) => (w > h ? 'L' : w < h ? 'P' : 'S')
  const pools = { L: photos.filter((p) => p.w > p.h), P: photos.filter((p) => p.w < p.h) }
  const used = { L: 0, P: 0 }
  placeholderPhotos.forEach((p) => {
    let s = shape(p.w, p.h)
    if (s === 'S') s = pools.L.length >= pools.P.length ? 'L' : 'P'
    const pool = pools[s].length ? pools[s] : photos
    const match = pool[used[s]++ % pool.length]
    if (match) photoById[p.id] = match
  })
}

// Photos bought straight from the client gallery (local uploads, placeholders) aren't in the list
// above. They're registered when a quick buy starts so cart lines can resolve them, and persisted
// so the cart still shows the right photo after a reload.
const EXTRA_KEY = 'lumen-store-v3:photos'
const extraPhotos = (() => {
  try {
    return JSON.parse(localStorage.getItem(EXTRA_KEY)) || {}
  } catch {
    return {}
  }
})()

export const registerPhoto = (p) => {
  if (photoById[p.id]) return photoById[p.id]
  // Same convention as the store photos: originals are simulated as display dims × 4.
  const entry = { id: p.id, name: p.name, src: p.src, thumb: p.thumb, w: p.w, h: p.h, ow: p.ow || p.w * 4, oh: p.oh || p.h * 4, collection: p.collection }
  extraPhotos[p.id] = entry
  try {
    localStorage.setItem(EXTRA_KEY, JSON.stringify(extraPhotos))
  } catch {
    /* storage full or blocked: the photo still resolves for this session */
  }
  return entry
}

export const getPhoto = (id) => photoById[id] || extraPhotos[id] || photos[0]
