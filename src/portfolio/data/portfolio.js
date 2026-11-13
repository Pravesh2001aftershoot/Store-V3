// Photographer portfolio — profile + every published gallery (project).
//
// Photos come from `src/portfolio/assets/work/<genre>/`, one folder per genre. Regenerate them
// from the photographer's export folder with `npm run portfolio:photos` (see the script).
// Each genre's photos are split, in file order, into galleries — so dropping in a new genre
// folder adds a new filter tab and its galleries with no code changes.
//
// Profile copy, client names, places and dates below are mock content for the prototype.

import { gallery } from '../../data/gallery'
import profilePhoto from '../assets/profile.jpg'

const files = import.meta.glob('../assets/work/*/*.jpg', { eager: true, import: 'default' })
const dims = Object.values(import.meta.glob('../assets/work/dims.json', { eager: true, import: 'default' }))[0] || {}

// ── Profile ─────────────────────────────────────────────────────────────────
export const profile = {
  name: gallery.photographer,
  firstName: gallery.photographer.split(' ')[0],
  studio: gallery.studio,
  photo: profilePhoto,
  role: 'Wedding & portrait photographer',
  bio: 'I photograph weddings, couples and families the way they actually feel: unhurried, honest and a little cinematic. Twelve years behind the camera, and still chasing the in-between moments.',
  disciplines: ['Weddings', 'Couples', 'Families', 'Portraits'],
  location: 'Based in Miami, travelling worldwide',
  availability: 'Booking 2027',
  since: 2014,
  email: 'hello@example.com',
  instagram: '@estebangill',
}

// ── Genres ──────────────────────────────────────────────────────────────────
// Folder name → tab label. Unknown folders fall back to their capitalised name.
const GENRE_LABELS = { wedding: 'Weddings', couple: 'Couples', family: 'Families', portraits: 'Portraits' }
const label = (id) => GENRE_LABELS[id] || id.replace(/(^|-)(\w)/g, (_, s, c) => (s ? ' ' : '') + c.toUpperCase())

// Gallery sizes cycle through these, so galleries feel like real, uneven shoots.
const CHUNKS = {
  wedding: [16, 24, 11, 19, 13, 28, 15, 9, 21, 12],
  default: [8, 11, 6, 9, 7, 12],
}
const MIN_GALLERY = 5

// Mock clients + places, per genre. Cycled if a genre has more galleries than names.
const CLIENTS = {
  wedding: ['Lexie & Taylor', 'Camila & Andrés', 'Priya & Sam', 'Noor & Elias', 'Grace & Mateo', 'Ava & Daniel', 'Lucía & Tomás', 'Hannah & Omar', 'Zoe & Marcus', 'Isabela & Rafael', 'Mia & Theo', 'Sofía & Liam', 'Chloe & Arjun', 'Valentina & Leo', 'Emma & Nico', 'Julia & Ben', 'Aria & Sebastián', 'Nina & Joaquín', 'Layla & Owen', 'Elena & Jack', 'Rosa & Dev', 'Clara & Hugo', 'Maya & Felipe', 'Ines & Kai', 'Olivia & Max'],
  couple: ['Maya & Jon', 'Ana & Luca', 'Bea & Theo', 'Rhea & Cole', 'Iris & Diego', 'Lena & Ari'],
  family: ['The Alvarez Family', 'The Okafor Family', 'The Moreno Family', 'The Laurent Family', 'The Rossi Family', 'The Haddad Family'],
  portraits: ['Studio Sessions', 'Dani, Personal Brand', 'Marco, Headshots', 'The Editorial Series', 'Sara, Portraits', 'Ilan, Musician', 'Golden Hour Portraits', 'Studio Black'],
}
const PLACES = ['Miami, FL', 'Tulum, Mexico', 'Buenos Aires', 'Key Biscayne, FL', 'Lake Como, Italy', 'Cartagena, Colombia', 'Napa Valley, CA', 'Lisbon, Portugal', 'Mallorca, Spain', 'New York, NY', 'Palm Beach, FL', 'Mendoza, Argentina']

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

// ── Photos, grouped by genre ────────────────────────────────────────────────
const byGenre = {}
Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .forEach(([path, src]) => {
    const [genre, name] = path.split('/').slice(-2)
    const [w, h] = dims[`${genre}/${name}`] || [3, 2]
    ;(byGenre[genre] ||= []).push({ id: `${genre}/${name}`, src, w, h })
  })

/** Splits a genre's photos into galleries, folding a too-small remainder into the last one. */
function chunk(list, sizes) {
  const out = []
  for (let i = 0, k = 0; i < list.length; k++) {
    const n = sizes[k % sizes.length]
    out.push(list.slice(i, i + n))
    i += n
  }
  if (out.length > 1 && out.at(-1).length < MIN_GALLERY) out.at(-2).push(...out.pop())
  return out
}

// Cards are portrait (4:5), so the cover is the first portrait photo in the gallery.
const pickCover = (photos) => photos.find((p) => p.h > p.w) || photos[0]

// ── Galleries ───────────────────────────────────────────────────────────────
// Dates step back from Oct 2026, interleaving genres so the newest-first list mixes them.
const START = new Date(2026, 9, 18)
let n = 0
const built = Object.entries(byGenre).flatMap(([genre, list]) => {
  const names = CLIENTS[genre] || [label(genre)]
  return chunk(list, CHUNKS[genre] || CHUNKS.default).map((photos, i) => {
    const title = names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : '')
    return { genre, title, photos, i, n: n++ }
  })
})

// Spread dates by global position so genres interleave (deterministic, no randomness).
const order = [...built].sort((a, b) => a.i - b.i || a.n - b.n)
export const galleries = order.map((g, k) => {
  const date = new Date(START)
  date.setDate(date.getDate() - k * 23 - ((k * 7) % 11))
  const cover = pickCover(g.photos)
  return {
    slug: slugify(`${g.title}-${g.genre}`),
    title: g.title,
    genre: g.genre,
    genreLabel: label(g.genre),
    location: PLACES[(k * 5 + g.i) % PLACES.length],
    date,
    year: date.getFullYear(),
    cover,
    // Previews for the hover scrub on cards: the cover first, then the next few.
    previews: [cover, ...g.photos.filter((p) => p !== cover).slice(0, 4)],
    photos: g.photos,
    count: g.photos.length,
  }
})

export const genres = Object.keys(byGenre).map((id) => ({
  id,
  label: label(id),
  count: galleries.filter((g) => g.genre === id).length,
}))

export const totalPhotos = galleries.reduce((s, g) => s + g.count, 0)

export const galleryBySlug = Object.fromEntries(galleries.map((g) => [g.slug, g]))

export const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
