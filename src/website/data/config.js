import { useCallback, useMemo } from 'react'
import { persisted, readJSON } from '../../lib/persisted'
import { allWorkPhotos, usePortfolio } from '../../portfolio/data/config'

// Website settings: the photographer's static site at /site, built in the dashboard's Website tab.
//
//   site      — site title (empty = the photographer's name), header Enquire button, footer note
//   order     — the order of the movable sections (About, Portfolio, Pricing, FAQ). Hero is always
//               first and Contact always last.
//   hidden    — section ids that are switched off
//   hero, about, portfolio, pricing, faq, contact — each section's content
//
// Text left empty falls back to the default (shown as the field's placeholder). Photos are stored as
// { id } of a portfolio photo; null uses the default. Saved to this browser and shared with the
// dashboard's preview, like the portfolio and gallery settings.

const KEY = 'store-v3:website'

/** Every section, in the order the dashboard lists them. `movable` ones can be reordered. */
export const SECTIONS = [
  { id: 'hero', label: 'Hero', movable: false },
  { id: 'about', label: 'About', movable: true },
  { id: 'portfolio', label: 'Portfolio', movable: true },
  { id: 'pricing', label: 'Pricing', movable: true },
  { id: 'faq', label: 'FAQ', movable: true },
  { id: 'contact', label: 'Contact', movable: false },
]
const MOVABLE = SECTIONS.filter((s) => s.movable).map((s) => s.id)

export const LIMITS = {
  siteTitle: 40, footer: 80,
  headline: 60, subline: 160, cta: 24,
  heading: 60, body: 600, intro: 200, button: 30,
  packageName: 30, packageDesc: 120, feature: 60, features: 8, packages: 4, unit: 20, note: 160,
  question: 100, answer: 400, faqs: 12,
}

/** How many galleries the Portfolio section shows. */
export const PORTFOLIO_COUNTS = [3, 6]

let uid = 0
export const newId = (p) => `${p}-${Date.now().toString(36)}${(uid++).toString(36)}`

export const DEFAULT = {
  site: { title: '', enquire: true, footer: '' },
  order: MOVABLE,
  hidden: [],
  hero: { layout: 'full', headline: '', subline: '', cta: true, ctaLabel: '', photo: null },
  about: { heading: '', body: '', photo: null, facts: true },
  portfolio: { heading: '', intro: '', count: 6, featured: [], button: '' },
  pricing: {
    heading: '',
    intro: '',
    currency: '$',
    note: '',
    packages: [
      { id: 'pkg-essential', name: 'Essential', price: 2400, unit: 'per wedding', description: 'For intimate weddings and elopements.', features: ['Up to 4 hours of coverage', 'One photographer', '300+ edited photos', 'Online gallery for 1 year'], featured: false },
      { id: 'pkg-signature', name: 'Signature', price: 3800, unit: 'per wedding', description: 'The full day, from getting ready to the last dance.', features: ['Up to 8 hours of coverage', 'Two photographers', '600+ edited photos', 'Engagement session', 'Online gallery for 2 years'], featured: true },
      { id: 'pkg-heirloom', name: 'Heirloom', price: 5600, unit: 'per wedding', description: 'Everything in Signature, plus a handmade album.', features: ['Full-day coverage', 'Two photographers', '800+ edited photos', '12×12 linen album', 'Online gallery forever'], featured: false },
    ],
  },
  faq: {
    heading: '',
    items: [
      { id: 'faq-1', q: 'How far in advance should we book?', a: 'Most couples book 9–14 months ahead. Weekday and off-season dates often open up closer in, so it’s always worth asking.' },
      { id: 'faq-2', q: 'Do you travel for weddings?', a: 'Yes — I photograph across the US and abroad. Travel within 50 miles of Miami is included; further afield is quoted at cost.' },
      { id: 'faq-3', q: 'When will we get our photos?', a: 'A sneak peek within a week, and the full edited gallery within six weeks of your day.' },
      { id: 'faq-4', q: 'Can we order prints and albums?', a: 'Everything is available straight from your online gallery — prints, wall art and albums, shipped to your door.' },
    ],
  },
  contact: { heading: '', body: '', form: true, date: true, email: true, location: true, social: true, button: '' },
}

/** What empty fields show (and the editor's placeholders). Some read the portfolio profile. */
export const fallbacks = (profile) => ({
  siteTitle: profile.name,
  footer: `© ${new Date().getFullYear()} ${profile.name}`,
  headline: 'Honest photographs of the days that matter.',
  subline: `${profile.role}. ${profile.location}.`,
  ctaLabel: 'Check availability',
  aboutHeading: `Hi, I’m ${profile.firstName}.`,
  aboutBody: profile.bio,
  portfolioHeading: 'Recent work',
  portfolioIntro: 'A few favourite stories from the last seasons. Every gallery is shown in full on the portfolio.',
  portfolioButton: 'View full portfolio',
  pricingHeading: 'Collections',
  pricingIntro: 'Every collection can be tailored. Tell me about your day and I’ll put together a quote.',
  pricingNote: 'A 30% retainer secures your date. Prices exclude travel beyond 50 miles.',
  faqHeading: 'Questions, answered',
  contactHeading: 'Let’s make something worth keeping.',
  contactBody: 'Tell me a little about your plans and I’ll be in touch within two working days.',
  contactButton: 'Send enquiry',
})

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})
const arr = (v) => (Array.isArray(v) ? v : [])
const str = (v) => (typeof v === 'string' ? v : '')

function load() {
  const s = readJSON(KEY, null)
  if (!s) return DEFAULT
  // Keep only known movable ids, then add any that are missing (new sections) at the end.
  const order = arr(s.order).filter((id, i, a) => MOVABLE.includes(id) && a.indexOf(id) === i)
  MOVABLE.forEach((id) => !order.includes(id) && order.push(id))
  const pricing = { ...DEFAULT.pricing, ...obj(s.pricing) }
  const faq = { ...DEFAULT.faq, ...obj(s.faq) }
  return {
    site: { ...DEFAULT.site, ...obj(s.site) },
    order,
    hidden: arr(s.hidden).filter((id) => SECTIONS.some((x) => x.id === id)),
    hero: { ...DEFAULT.hero, ...obj(s.hero) },
    about: { ...DEFAULT.about, ...obj(s.about) },
    portfolio: { ...DEFAULT.portfolio, ...obj(s.portfolio), featured: arr(s.portfolio?.featured) },
    pricing: {
      ...pricing,
      packages: arr(pricing.packages).filter((p) => p && p.id).map((p) => ({
        id: p.id, name: str(p.name), price: Number.isFinite(p.price) ? p.price : 0, unit: str(p.unit),
        description: str(p.description), features: arr(p.features).map(str), featured: !!p.featured,
      })),
    },
    faq: { ...faq, items: arr(faq.items).filter((f) => f && f.id).map((f) => ({ id: f.id, q: str(f.q), a: str(f.a) })) },
    contact: { ...DEFAULT.contact, ...obj(s.contact) },
  }
}

const store = persisted(KEY, load)

const or = (v, fallback) => (typeof v === 'string' && v.trim() ? v : fallback)
const photoById = (ref, fallback) => (ref?.id && allWorkPhotos.find((x) => x.id === ref.id)) || fallback

/** Landscape portfolio photos, for the hero picker. Portrait ones, for About. */
export const landscapePhotos = allWorkPhotos.filter((x) => x.w > x.h)
export const portraitPhotos = allWorkPhotos.filter((x) => x.h > x.w)

/**
 * The website as the photographer has set it up: every section's content resolved against its
 * defaults, the visible sections in page order, plus setters. Reads the portfolio for the profile
 * (name, bio, email…) and the galleries the Portfolio section features; `pf` is that portfolio.
 */
export function useWebsite() {
  const [state, setState] = store.use()
  const portfolio = usePortfolio()
  const { profile, galleries } = portfolio

  const resolved = useMemo(() => {
    const f = fallbacks(profile)
    const featured = state.portfolio.featured.map((slug) => galleries.find((g) => g.slug === slug)).filter(Boolean)
    const picks = (featured.length ? featured : galleries).slice(0, state.portfolio.count)
    return {
      site: { ...state.site, title: or(state.site.title, f.siteTitle), footer: or(state.site.footer, f.footer) },
      hero: {
        ...state.hero,
        headline: or(state.hero.headline, f.headline),
        subline: or(state.hero.subline, f.subline),
        ctaLabel: or(state.hero.ctaLabel, f.ctaLabel),
        // Default: the newest gallery's first landscape photo.
        photo: photoById(state.hero.photo, galleries[0]?.photos.find((x) => x.w > x.h) ?? landscapePhotos[0]),
      },
      about: {
        ...state.about,
        heading: or(state.about.heading, f.aboutHeading),
        body: or(state.about.body, f.aboutBody),
        photo: photoById(state.about.photo, null)?.src ?? profile.photo,
      },
      portfolio: {
        ...state.portfolio,
        heading: or(state.portfolio.heading, f.portfolioHeading),
        intro: or(state.portfolio.intro, f.portfolioIntro),
        button: or(state.portfolio.button, f.portfolioButton),
        galleries: picks,
      },
      pricing: {
        ...state.pricing,
        heading: or(state.pricing.heading, f.pricingHeading),
        intro: or(state.pricing.intro, f.pricingIntro),
        note: or(state.pricing.note, f.pricingNote),
        packages: state.pricing.packages.filter((p) => p.name.trim()),
      },
      faq: {
        ...state.faq,
        heading: or(state.faq.heading, f.faqHeading),
        items: state.faq.items.filter((x) => x.q.trim() && x.a.trim()),
      },
      contact: {
        ...state.contact,
        heading: or(state.contact.heading, f.contactHeading),
        body: or(state.contact.body, f.contactBody),
        button: or(state.contact.button, f.contactButton),
      },
    }
  }, [state, profile, galleries])

  /** Visible sections in page order: Hero, the movable ones as ordered, Contact. */
  const sections = useMemo(
    () => ['hero', ...state.order, 'contact'].filter((id) => !state.hidden.includes(id)),
    [state.order, state.hidden]
  )

  const part = useCallback((name) => (patch) => setState((s) => ({ ...s, [name]: { ...s[name], ...(typeof patch === 'function' ? patch(s[name]) : patch) } })), [setState])
  const setters = useMemo(() => Object.fromEntries(
    ['site', 'hero', 'about', 'portfolio', 'pricing', 'faq', 'contact'].map((k) => [`set${k[0].toUpperCase()}${k.slice(1)}`, part(k)])
  ), [part])

  const toggleSection = useCallback((id) => setState((s) => ({ ...s, hidden: s.hidden.includes(id) ? s.hidden.filter((x) => x !== id) : [...s.hidden, id] })), [setState])
  const moveSection = useCallback((id, by) => setState((s) => {
    const order = [...s.order]
    const i = order.indexOf(id)
    const j = i + by
    if (i < 0 || j < 0 || j >= order.length) return s
    ;[order[i], order[j]] = [order[j], order[i]]
    return { ...s, order }
  }), [setState])
  const resetSection = useCallback((id) => setState((s) => ({ ...s, [id]: DEFAULT[id] })), [setState])
  const reset = useCallback(() => setState(DEFAULT), [setState])

  return {
    state, ...resolved, sections, profile, fallbacks: fallbacks(profile), pf: portfolio,
    ...setters, toggleSection, moveSection, resetSection, reset,
    isHidden: (id) => state.hidden.includes(id),
  }
}

/** Formats a package price: "$2,400". */
export const formatPrice = (n, currency = '$') => `${currency}${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
