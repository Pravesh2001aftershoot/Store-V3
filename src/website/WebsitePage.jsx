import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Check, CheckCircle, EnvelopeSimple, InstagramLogo, MapPin } from '@phosphor-icons/react'
import { Accordion, Button, Field, Reveal, SplitText } from '../components/ui'
import { cn } from '../lib/utils'
import { scrollToEl, usePreviewTarget } from '../lib/embed'
import { ProjectCard } from '../portfolio/components/ProjectCard'
import { formatPrice, useWebsite } from './data/config'

const ease = [0.22, 1, 0.36, 1]
const NAV = { about: 'About', portfolio: 'Work', pricing: 'Pricing', faq: 'FAQ', contact: 'Contact' }
const wrap = 'mx-auto max-w-[1400px] px-4 md:px-8'

/**
 * The photographer's website — a single static page built in the dashboard's Website tab:
 * Hero → About → Portfolio (a few galleries, then on to /portfolio) → Pricing → FAQ → Contact.
 * The middle four can be reordered or hidden; Hero and Contact can be hidden. Each section has an
 * id (#about, #portfolio…) for the header links and the dashboard preview.
 */
export default function WebsitePage() {
  const w = useWebsite()
  const { hash } = useLocation()
  useEffect(() => {
    const el = hash && document.getElementById(hash.slice(1))
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: 'instant' }))
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Dashboard preview: show the section being edited ("top" for the hero and site settings).
  usePreviewTarget((target) => {
    if (target === 'top') window.scrollTo({ top: 0, behavior: 'smooth' })
    else scrollToEl(document.getElementById(target), 64)
  })

  const blocks = { hero: Hero, about: About, portfolio: Portfolio, pricing: Pricing, faq: Faq, contact: Contact }
  return (
    <div className="min-h-screen bg-surface-0">
      <Header w={w} />
      <main>
        {w.sections.map((id) => {
          const Block = blocks[id]
          return <Block key={id} w={w} />
        })}
        {w.sections.length === 0 && (
          <p className={cn(wrap, 'py-32 text-center text-16-r text-type-2')}>This site has no sections switched on yet.</p>
        )}
      </main>
      <Footer w={w} />
    </div>
  )
}

/** Sticky bar: site title, links to the visible sections, Enquire. Links collapse below md. */
function Header({ w }) {
  const links = w.sections.filter((id) => NAV[id] && id !== 'contact')
  const contact = w.sections.includes('contact')
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface-0/90 backdrop-blur-md">
      <div className={cn(wrap, 'flex h-16 items-center gap-3')}>
        <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="min-w-0 truncate text-16-sb text-type-0">
          {w.site.title}
        </a>
        <nav aria-label="Sections" className="ml-auto hidden items-center gap-1 md:flex">
          {links.map((id) => (
            <a key={id} href={`#${id}`} className="rounded-full px-3 py-2 text-14-r text-type-1 transition hover:bg-surface-2 hover:text-type-0">
              {NAV[id]}
            </a>
          ))}
        </nav>
        {w.site.enquire && (
          <Button as="a" href={contact ? '#contact' : `mailto:${w.profile.email}`} size="sm" className="ml-auto shrink-0 md:ml-2">
            Enquire
          </Button>
        )}
      </div>
    </header>
  )
}

// ── Hero ────────────────────────────────────────────────────────────────────

function Hero({ w }) {
  const { hero } = w
  const contact = w.sections.includes('contact')
  const cta = hero.cta && (
    <Button as="a" href={contact ? '#contact' : `mailto:${w.profile.email}`} size="lg" variant={hero.layout === 'full' ? 'light' : 'default'} arrow className="max-sm:w-full">
      {hero.ctaLabel}
    </Button>
  )
  const img = (
    <img
      src={hero.photo.src}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
      style={hero.photo.focus ? { objectPosition: `${hero.photo.focus.x}% ${hero.photo.focus.y}%` } : undefined}
    />
  )

  if (hero.layout === 'split') {
    return (
      <section id="hero" className={cn(wrap, 'grid items-center gap-8 pt-8 md:pt-12 lg:grid-cols-12 lg:gap-12 lg:pt-16')}>
        <div className="lg:col-span-6">
          <SplitText key={hero.headline} text={hero.headline} className="text-48-sb text-type-0 md:text-60-sb xl:text-72-sb" />
          <Reveal delay={0.25} y={16}><p className="mt-5 max-w-[520px] text-16-r-p text-type-1 md:text-20-m md:text-type-2">{hero.subline}</p></Reveal>
          {cta && <Reveal delay={0.35} y={16} className="mt-8">{cta}</Reveal>}
        </div>
        <motion.figure initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, ease }} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-2 lg:col-span-6 lg:aspect-[4/5]">
          {img}
        </motion.figure>
      </section>
    )
  }

  return (
    <section id="hero" className="relative h-[min(86svh,860px)] min-h-[480px] overflow-hidden bg-type-0">
      <motion.div className="absolute inset-0" initial={{ scale: 1.06 }} animate={{ scale: 1 }} transition={{ duration: 1.6, ease }}>
        {img}
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className={cn(wrap, 'relative flex h-full flex-col justify-end pb-10 md:pb-16')}>
        <SplitText key={hero.headline} text={hero.headline} className="max-w-[900px] text-48-sb text-white md:text-72-sb" />
        <Reveal delay={0.25} y={16}><p className="mt-4 max-w-[560px] text-16-r-p text-white/80 md:text-20-m">{hero.subline}</p></Reveal>
        {cta && <Reveal delay={0.35} y={16} className="mt-8">{cta}</Reveal>}
      </div>
    </section>
  )
}

// ── About ───────────────────────────────────────────────────────────────────

function About({ w }) {
  const { about, profile } = w
  const facts = [
    { k: 'Location', v: profile.location },
    { k: 'Photographing since', v: profile.since },
    { k: 'Availability', v: profile.availability, live: true },
  ]
  return (
    <section id="about" className={cn(wrap, 'scroll-mt-16 py-20 md:py-28')}>
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
        <Reveal className="overflow-hidden rounded-lg bg-surface-2 lg:col-span-5">
          <img src={about.photo} alt={`Portrait of ${profile.name}`} loading="lazy" className="aspect-[4/5] w-full object-cover" />
        </Reveal>
        <div className="lg:col-span-7">
          <Reveal><p className="text-12-sb uppercase text-type-3">About</p></Reveal>
          <Reveal delay={0.05}><h2 className="mt-4 text-36-sb text-type-0 md:text-48-sb">{about.heading}</h2></Reveal>
          <Reveal delay={0.1}><p className="mt-6 max-w-[620px] whitespace-pre-line text-16-r-p text-type-1">{about.body}</p></Reveal>
          {about.facts && (
            <Reveal delay={0.15} className="mt-10 grid grid-cols-1 gap-5 border-t border-border pt-6 sm:grid-cols-3">
              {facts.map((f) => (
                <div key={f.k} className="min-w-0">
                  <p className="text-11-sb uppercase text-type-3">{f.k}</p>
                  <p className="mt-1.5 flex items-center gap-2 text-14-m text-type-0">
                    {f.live && <span className="h-2 w-2 shrink-0 rounded-full bg-success" />}
                    {f.v}
                  </p>
                </div>
              ))}
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}

// ── Portfolio ───────────────────────────────────────────────────────────────

function Portfolio({ w }) {
  const { portfolio } = w
  return (
    <section id="portfolio" className="scroll-mt-16 border-t border-border bg-surface-1 py-20 md:py-28">
      <div className={wrap}>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal><p className="text-12-sb uppercase text-type-3">Portfolio</p></Reveal>
            <Reveal delay={0.05}><h2 className="mt-4 text-36-sb text-type-0 md:text-48-sb">{portfolio.heading}</h2></Reveal>
            <Reveal delay={0.1}><p className="mt-4 max-w-[560px] text-16-r-p text-type-2">{portfolio.intro}</p></Reveal>
          </div>
          <Reveal delay={0.1} className="max-md:hidden">
            <Button as={Link} to="/portfolio" size="lg" variant="outline" arrow>{portfolio.button}</Button>
          </Reveal>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 md:mt-14 md:gap-x-4 lg:grid-cols-3">
          {portfolio.galleries.map((g, i) => (
            <Reveal key={g.slug} delay={(i % 3) * 0.06}>
              <ProjectCard g={g} />
            </Reveal>
          ))}
        </div>
        <Button as={Link} to="/portfolio" size="lg" variant="outline" arrow className="mt-10 w-full md:hidden">{portfolio.button}</Button>
      </div>
    </section>
  )
}

// ── Pricing ─────────────────────────────────────────────────────────────────

function Pricing({ w }) {
  const { pricing } = w
  if (!pricing.packages.length) return null
  const contact = w.sections.includes('contact')
  return (
    <section id="pricing" className={cn(wrap, 'scroll-mt-16 py-20 md:py-28')}>
      <div className="mx-auto max-w-[640px] text-center">
        <Reveal><p className="text-12-sb uppercase text-type-3">Pricing</p></Reveal>
        <Reveal delay={0.05}><h2 className="mt-4 text-36-sb text-type-0 md:text-48-sb">{pricing.heading}</h2></Reveal>
        <Reveal delay={0.1}><p className="mt-4 text-16-r-p text-type-2">{pricing.intro}</p></Reveal>
      </div>
      <div className={cn('mx-auto mt-12 grid gap-4 md:mt-16', { 1: 'max-w-[420px]', 2: 'max-w-[860px] md:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'md:grid-cols-2 xl:grid-cols-4' }[pricing.packages.length])}>
        {pricing.packages.map((p, i) => (
          <Reveal
            key={p.id}
            delay={i * 0.06}
            className={cn('relative flex flex-col rounded-2xl p-6 md:p-8', p.featured ? 'bg-primary text-primary-foreground' : 'border border-border bg-surface-1 text-type-0')}
          >
            {p.featured && <span className="absolute right-5 top-5 rounded-full bg-white/15 px-2.5 py-1 text-11-m text-white">Most popular</span>}
            <p className="text-16-sb">{p.name}</p>
            <p className="mt-6 flex items-baseline gap-2">
              <span className="text-48-sb">{formatPrice(p.price, pricing.currency)}</span>
              {p.unit && <span className={cn('text-14-r', p.featured ? 'text-white/60' : 'text-type-2')}>{p.unit}</span>}
            </p>
            {p.description && <p className={cn('mt-3 text-14-r-p', p.featured ? 'text-white/70' : 'text-type-2')}>{p.description}</p>}
            <ul className={cn('mt-6 flex-1 space-y-3 border-t pt-6', p.featured ? 'border-white/15' : 'border-border')}>
              {p.features.filter((f) => f.trim()).map((f, k) => (
                <li key={k} className="flex items-start gap-2.5 text-14-r">
                  <Check size={16} weight="bold" className={cn('mt-0.5 shrink-0', p.featured ? 'text-white' : 'text-type-0')} />
                  {f}
                </li>
              ))}
            </ul>
            <Button as="a" href={contact ? '#contact' : `mailto:${w.profile.email}`} size="lg" variant={p.featured ? 'light' : 'outline'} className="mt-8 w-full">
              Enquire about {p.name}
            </Button>
          </Reveal>
        ))}
      </div>
      {pricing.note && <p className="mx-auto mt-8 max-w-[640px] text-center text-13-r-p text-type-3">{pricing.note}</p>}
    </section>
  )
}

// ── FAQ ─────────────────────────────────────────────────────────────────────

function Faq({ w }) {
  const { faq } = w
  if (!faq.items.length) return null
  return (
    <section id="faq" className="scroll-mt-16 border-t border-border bg-surface-1 py-20 md:py-28">
      <div className={cn(wrap, 'grid gap-10 lg:grid-cols-12')}>
        <div className="lg:col-span-4">
          <Reveal><p className="text-12-sb uppercase text-type-3">FAQ</p></Reveal>
          <Reveal delay={0.05}><h2 className="mt-4 text-36-sb text-type-0 md:text-48-sb">{faq.heading}</h2></Reveal>
        </div>
        <Reveal delay={0.1} className="lg:col-span-8">
          <Accordion items={faq.items.map((x) => ({ q: x.q, a: <span className="whitespace-pre-line">{x.a}</span> }))} defaultOpen={0} />
        </Reveal>
      </div>
    </section>
  )
}

// ── Contact ─────────────────────────────────────────────────────────────────

function Contact({ w }) {
  const { contact, profile } = w
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', date: '', message: '' })
  const [tried, setTried] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  const errors = { name: !form.name.trim() && 'Please add your name', email: !emailOk && 'Please add a valid email', message: !form.message.trim() && 'Tell me a little about your plans' }
  const submit = (e) => {
    e.preventDefault()
    setTried(true)
    if (Object.values(errors).some(Boolean)) return
    setSent(true)
  }
  const rows = [
    contact.email && { k: 'Email', v: profile.email, href: `mailto:${profile.email}`, icon: EnvelopeSimple },
    contact.location && { k: 'Location', v: profile.location, icon: MapPin },
    contact.social && { k: 'Instagram', v: profile.instagram, icon: InstagramLogo },
  ].filter(Boolean)

  return (
    <section id="contact" className={cn(wrap, 'scroll-mt-16 py-20 md:py-28')}>
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal><p className="text-12-sb uppercase text-type-3">Contact</p></Reveal>
          <Reveal delay={0.05}><h2 className="mt-4 text-36-sb text-type-0 md:text-48-sb">{contact.heading}</h2></Reveal>
          <Reveal delay={0.1}><p className="mt-4 max-w-[480px] text-16-r-p text-type-2">{contact.body}</p></Reveal>
          {rows.length > 0 && (
            <Reveal delay={0.15} className="mt-10 space-y-4">
              {rows.map((r) => {
                const C = r.href ? 'a' : 'div'
                return (
                  <C key={r.k} href={r.href} className="flex items-center gap-3 border-b border-border pb-4 text-14-m text-type-0">
                    <r.icon size={18} className="shrink-0 text-type-2" />
                    <span className="text-14-r text-type-2">{r.k}</span>
                    <span className="ml-auto truncate text-right">{r.v}</span>
                  </C>
                )
              })}
            </Reveal>
          )}
          {!contact.form && (
            <Reveal delay={0.2} className="mt-8">
              <Button as="a" href={`mailto:${profile.email}`} size="lg" arrow className="max-sm:w-full">{contact.button}</Button>
            </Reveal>
          )}
        </div>

        {contact.form && (
          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="rounded-2xl border border-border bg-surface-1 p-5 md:p-8">
              {sent ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <CheckCircle size={40} weight="fill" className="text-success" />
                  <p className="mt-4 text-20-m text-type-0">Thanks, {form.name.split(' ')[0]}!</p>
                  <p className="mt-1 max-w-[360px] text-14-r-p text-type-2">Your message is on its way. I’ll reply to {form.email} within two working days.</p>
                  <Button variant="ghost" className="mt-6" onClick={() => { setSent(false); setTried(false); setForm({ name: '', email: '', date: '', message: '' }) }}>Send another</Button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Name" value={form.name} onChange={set('name')} autoComplete="name" error={tried && errors.name} />
                    <Field label="Email" type="email" value={form.email} onChange={set('email')} autoComplete="email" error={tried && errors.email} />
                  </div>
                  {contact.date && <Field label="Event date (optional)" type="date" value={form.date} onChange={set('date')} />}
                  <label className="block">
                    <span className="mb-1.5 block text-13-m text-type-1">Message</span>
                    <textarea
                      value={form.message}
                      onChange={set('message')}
                      rows={5}
                      className={cn('w-full resize-none rounded-lg border border-input bg-surface-1 px-3.5 py-3 text-14-r text-type-0 outline-none transition placeholder:text-type-3 focus:border-type-0 focus:ring-4 focus:ring-black/5', tried && errors.message && 'border-destructive')}
                      placeholder="Where, when, and what you have in mind"
                    />
                    {tried && errors.message && <span className="mt-1 block text-12-r text-destructive">{errors.message}</span>}
                  </label>
                  <Button type="submit" size="lg" arrow className="w-full sm:w-auto">{contact.button}</Button>
                </form>
              )}
            </div>
          </Reveal>
        )}
      </div>
    </section>
  )
}

function Footer({ w }) {
  return (
    <footer className="border-t border-border bg-surface-1">
      <div className={cn(wrap, 'flex flex-col gap-3 py-8 text-12-r text-type-3 sm:flex-row sm:items-center sm:justify-between')}>
        <p>{w.site.footer}</p>
        <div className="flex items-center gap-5">
          <Link to="/portfolio" className="transition hover:text-type-0">Portfolio</Link>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-1 transition hover:text-type-0">
            Back to top <ArrowUpRight size={12} className="-rotate-45" />
          </button>
        </div>
      </div>
    </footer>
  )
}
