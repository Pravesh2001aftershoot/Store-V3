import { products } from '../../data/catalog'

/**
 * Gallery analytics: who visited a gallery and what they did with its photos.
 *
 * The prototype has no tracking backend, so the activity is sample data, generated from the
 * gallery's id and its current photos. The same gallery always gets the same people and numbers,
 * and every event points at a photo that's really in the gallery. A gallery with no photos has no
 * activity (null).
 *
 * Shape:
 *   {
 *     anonymous,                         visitors who never gave an email
 *     people: [{
 *       id, email, name, isClient, visits, firstVisit, lastActive,   (dates are ms timestamps)
 *       downloads:     [{ photoId, at }]                        single-photo downloads
 *       fullDownloads: [{ at, size }]                           whole-gallery zips ('High resolution' | 'Web size')
 *       shares:        [{ photoId, at, via }]                   via: 'Link' | 'Email' | 'WhatsApp' | 'Facebook'
 *       favourites:    [{ photoId, at }]
 *       comments:      [{ photoId, at, text }]
 *       orders:        [{ id, at, items: [{ name, size, qty, price, photoId }], total }]
 *       spent                                                    sum of order totals
 *     }],
 *     totals: { visitors, identified, downloads, singleDownloads, fullDownloads, singleDownloaders,
 *               fullDownloaders, revenue, orders, favourites, shares, comments }
 *   }
 */

const DAY = 86_400_000

const FIRST = ['Maya', 'Jordan', 'Priya', 'Sam', 'Elena', 'Marcus', 'Aisha', 'Noah', 'Chloe', 'Daniel', 'Sofia', 'Ethan', 'Grace', 'Leo', 'Hannah', 'Omar', 'Ruby', 'Theo', 'Zara', 'Felix']
const LAST = ['Reyes', 'Patel', 'Chen', 'Brooks', 'Novak', 'Hughes', 'Khan', 'Morgan', 'Silva', 'Walsh', 'Kim', 'Bennett', 'Ortiz', 'Fischer', 'Ali', 'Turner']
const DOMAINS = ['gmail.com', 'outlook.com', 'icloud.com', 'yahoo.com', 'hey.com']
const CHANNELS = ['Link', 'Email', 'WhatsApp', 'Facebook']
const COMMENTS = [
  'This one is stunning 😍',
  'Can we get this one in black and white?',
  'Framing this for the living room!',
  'My favourite of the whole day.',
  'Could you brighten this a little?',
  'Grandma is going to love this.',
  'Is it possible to crop this tighter?',
  'The light here is unreal.',
  'Please include this in the album.',
  'Ha, I had no idea you caught this moment!',
]

/** Small seeded PRNG (mulberry32), so a gallery's sample data never changes between visits. */
function rng(seedText) {
  let a = 0
  for (let i = 0; i < seedText.length; i++) a = (Math.imul(31, a) + seedText.charCodeAt(i)) | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildAnalytics(galleryId, client, photos, now = Date.now()) {
  if (!photos.length) return null
  const r = rng(galleryId)
  const int = (min, max) => min + Math.floor(r() * (max - min + 1))
  const pick = (list) => list[Math.floor(r() * list.length)]
  const somePhotos = (n) => {
    const pool = [...photos]
    const out = []
    while (out.length < Math.min(n, pool.length)) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0])
    return out
  }
  const sellable = products.filter((p) => p.options?.some((o) => o.id === 'size'))

  const count = int(8, 14)
  const used = new Set()
  const people = []
  for (let i = 0; i < count; i++) {
    const isClient = i === 0
    let name
    if (isClient) name = client
    else {
      do name = `${pick(FIRST)} ${pick(LAST)}`
      while (used.has(name))
    }
    used.add(name)
    const handle = (isClient ? client.split(/[\s&,]+/)[0] : name).toLowerCase().replace(/[^a-z ]/g, '').trim().replace(/\s+/g, '.')
    const email = `${handle || 'client'}${isClient ? '' : int(1, 99)}@${pick(DOMAINS)}`

    // When they came and went: the client first, guests over the following weeks.
    const firstVisit = now - int(isClient ? 26 : 4, 30) * DAY - int(0, DAY)
    const lastActive = Math.min(now - int(0, 3) * 3_600_000, firstVisit + int(0, Math.max(0, Math.round((now - firstVisit) / DAY))) * DAY + int(0, DAY))
    const at = () => firstVisit + Math.floor(r() * (lastActive - firstVisit))
    const visits = isClient ? int(9, 18) : int(1, 7)

    // Busier for the client; plenty of guests only look.
    const keen = isClient ? 1 : r()
    const favourites = somePhotos(isClient ? int(14, 30) : keen > 0.15 ? int(1, 14) : 0).map((p) => ({ photoId: p.id, at: at() }))
    const downloads = somePhotos(isClient ? int(3, 8) : keen > 0.3 ? int(1, 10) : 0).map((p) => ({ photoId: p.id, at: at() }))
    const fullDownloads = isClient || keen > 0.7
      ? Array.from({ length: isClient ? 2 : 1 }, (_, k) => ({ at: at(), size: k === 0 ? 'High resolution' : 'Web size' }))
      : []
    const shares = somePhotos(keen > 0.25 ? int(1, isClient ? 6 : 4) : 0).map((p) => ({ photoId: p.id, at: at(), via: pick(CHANNELS) }))
    const comments = somePhotos(keen > 0.5 ? int(1, isClient ? 5 : 3) : 0).map((p) => ({ photoId: p.id, at: at(), text: pick(COMMENTS) }))
    const orders = Array.from({ length: isClient ? int(1, 2) : keen > 0.55 ? 1 : 0 }, () => {
      const items = Array.from({ length: int(1, 3) }, () => {
        const product = pick(sellable)
        const size = pick(product.options.find((o) => o.id === 'size').values)
        const qty = product.mode === 'book' ? 1 : int(1, 2)
        return { name: product.name, size: size.label, qty, price: size.price * qty, photoId: pick(photos).id }
      })
      return { id: `#${int(10000, 99999)}`, at: at(), items, total: items.reduce((s, x) => s + x.price, 0) }
    })

    const byTime = (a, b) => b.at - a.at
    people.push({
      id: `${galleryId}-${i}`,
      email, name, isClient, visits, firstVisit, lastActive,
      downloads: downloads.sort(byTime),
      fullDownloads: fullDownloads.sort(byTime),
      shares: shares.sort(byTime),
      favourites: favourites.sort(byTime),
      comments: comments.sort(byTime),
      orders: orders.sort(byTime),
      spent: orders.reduce((s, o) => s + o.total, 0),
    })
  }

  const anonymous = int(14, 60)
  const sum = (fn) => people.reduce((s, p) => s + fn(p), 0)
  const singleDownloads = sum((p) => p.downloads.length)
  const fullDownloads = sum((p) => p.fullDownloads.length)
  return {
    anonymous,
    people,
    totals: {
      visitors: people.length + anonymous,
      identified: people.length,
      downloads: singleDownloads + fullDownloads,
      singleDownloads,
      fullDownloads,
      singleDownloaders: people.filter((p) => p.downloads.length).length,
      fullDownloaders: people.filter((p) => p.fullDownloads.length).length,
      revenue: sum((p) => p.spent),
      orders: sum((p) => p.orders.length),
      favourites: sum((p) => p.favourites.length),
      shares: sum((p) => p.shares.length),
      comments: sum((p) => p.comments.length),
    },
  }
}

/** Total downloads for one person (single photos + whole gallery). */
export const downloadCount = (p) => p.downloads.length + p.fullDownloads.length

/** "3 hours ago", "Yesterday", "12 days ago", or a date past a month. */
export function ago(ts, now = Date.now()) {
  const h = Math.floor((now - ts) / 3_600_000)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Yesterday'
  if (d < 31) return `${d} days ago`
  return shortDate(ts)
}

export const shortDate = (ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

/** One CSV row per person, for Export. */
export function toCSV(people) {
  const head = ['Email', 'Name', 'Visits', 'Photo downloads', 'Full gallery downloads', 'Shares', 'Favourites', 'Comments', 'Orders', 'Spent (USD)', 'First visit', 'Last active']
  const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)
  const iso = (ts) => new Date(ts).toISOString().slice(0, 10)
  const rows = people.map((p) => [p.email, p.name, p.visits, p.downloads.length, p.fullDownloads.length, p.shares.length, p.favourites.length, p.comments.length, p.orders.length, p.spent, iso(p.firstVisit), iso(p.lastActive)])
  return [head, ...rows].map((r) => r.map(esc).join(',')).join('\n')
}
