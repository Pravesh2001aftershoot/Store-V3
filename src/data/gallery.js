// Mock client gallery — the gallery the client arrived from.
// Original pixel dimensions are simulated (display dims × 4) to drive print-quality checks.

export const gallery = {
  studio: 'Aftershoot',
  logo: '/aftershoot-logo.png',
  photographer: 'Monika Frias',
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

export const photos = raw.map(([pid, [w, h], collection], i) => ({
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

export const photoById = Object.fromEntries(photos.map((p) => [p.id, p]))
export const getPhoto = (id) => photoById[id] || photos[0]
