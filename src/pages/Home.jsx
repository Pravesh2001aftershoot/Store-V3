import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight, Cursor, Crop, ImagesSquare, Sliders, Leaf, Truck, ShieldCheck, Medal } from '@phosphor-icons/react'
import { categories, packages, products } from '../data/catalog'
import { gallery, photos, getPhoto } from '../data/gallery'
import { Accordion, Button, Eyebrow, Reveal, SplitText } from '../components/ui'
import ProductMockup from '../components/ProductMockup'
import ProductCard from '../components/ProductCard'
import PackageCard from '../components/PackageCard'
import { packagePrice, packageValue } from '../lib/pricing'

const ease = [0.22, 1, 0.36, 1]

function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -120])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -40])
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const pics = [getPhoto('p1027'), getPhoto('p1011'), getPhoto('p64')]

  return (
    <section ref={ref} className="mx-auto max-w-[1360px] px-4 pb-16 pt-10 md:px-8 md:pt-16">
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-1 py-1 pl-1 pr-3 text-[12px] text-type-1">
              <span className="flex -space-x-1.5">
                {pics.map((p) => (
                  <img key={p.id} src={p.thumb} alt="" className="h-6 w-6 rounded-full object-cover ring-2 ring-white" />
                ))}
              </span>
              {photos.length} photos from {gallery.title}
            </span>
          </motion.div>
          <SplitText
            text="Your favourite moments, made to hold."
            className="mt-6 max-w-[640px] text-[44px] font-medium leading-[1.02] tracking-[-0.035em] text-type-0 sm:text-[60px] lg:text-[76px]"
            delay={0.1}
          />
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.5 }}
            className="mt-6 max-w-[460px] text-[17px] leading-relaxed text-type-2"
          >
            Archival prints, hand-bound albums and wall art — curated by {gallery.photographer} and made from the photos in your
            gallery.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.62 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button as={Link} to="/shop" size="lg" arrow>
              Shop the collection
            </Button>
            <Button as={Link} to="/packages" size="lg" variant="outline">
              View packages
            </Button>
          </motion.div>
        </div>

        <div className="relative h-[460px] sm:h-[560px]">
          <motion.div
            style={{ y: y1 }}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease, delay: 0.2 }}
            className="absolute left-0 top-6 w-[54%] overflow-hidden rounded-2xl shadow-[0_30px_60px_-25px_rgba(0,0,0,.35)]"
          >
            <img src={pics[0].src} alt="" className="aspect-[2/3] w-full object-cover" />
          </motion.div>
          <motion.div
            style={{ y: y2 }}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease, delay: 0.35 }}
            className="absolute right-0 top-0 w-[52%] overflow-hidden rounded-2xl"
          >
            <ProductMockup product={products[0]} variant={{ size: '16x20', frame: 'natural-oak', mat: 'white', glazing: 'acrylic' }} />
          </motion.div>
          <motion.div
            style={{ y: y3 }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease, delay: 0.5 }}
            className="absolute bottom-0 right-[12%] w-[46%] overflow-hidden rounded-2xl border-4 border-surface-0"
          >
            <ProductMockup product={products[4]} className="aspect-square" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease, delay: 0.9 }}
            className="absolute bottom-16 left-2 rounded-2xl border border-border bg-surface-1/90 p-3 pr-5 shadow-xl backdrop-blur sm:left-6"
          >
            <p className="text-[11px] uppercase tracking-[0.14em] text-type-3">Packages from</p>
            <p className="text-[22px] font-medium tracking-tight">${Math.min(...packages.map(packagePrice))}</p>
            <p className="text-[12px] text-success">Save up to 22%</p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function Marquee() {
  const row = [...photos, ...photos]
  return (
    <section className="overflow-hidden py-6">
      <div className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
        {row.map((p, i) => (
          <img
            key={i}
            src={p.thumb}
            alt=""
            loading="lazy"
            className="h-40 rounded-xl object-cover grayscale-[30%] transition duration-500 hover:grayscale-0 md:h-52"
            style={{ aspectRatio: p.w / p.h }}
          />
        ))}
      </div>
    </section>
  )
}

function Categories() {
  return (
    <section className="mx-auto max-w-[1360px] px-4 py-20 md:px-8">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Eyebrow>Shop by category</Eyebrow>
          <SplitText as="h2" text="Something for every wall, shelf and story." className="mt-4 max-w-[620px] text-[34px] font-medium leading-[1.05] tracking-[-0.03em] md:text-[48px]" />
        </div>
        <Button as={Link} to="/shop" variant="outline" arrow>
          Shop all
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((c, i) => {
          const items = products.filter((p) => p.category === c.id)
          return (
            <Reveal key={c.id} delay={(i % 2) * 0.1}>
              <Link to={`/shop/${c.id}`} className="group relative block overflow-hidden rounded-2xl">
                <div className="transition-transform duration-[1100ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]">
                  <ProductMockup product={items[0]} className="aspect-[4/3] md:aspect-[5/4]" />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-7">
                  <div className="rounded-xl bg-surface-1/85 px-4 py-3 backdrop-blur-md">
                    <p className="text-[20px] font-medium tracking-tight md:text-[24px]">{c.name}</p>
                    <p className="mt-0.5 max-w-[320px] text-[13px] text-type-2">{c.blurb}</p>
                  </div>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-type-0 text-white transition-transform duration-500 group-hover:rotate-45">
                    <ArrowUpRight size={18} weight="bold" />
                  </span>
                </div>
                <span className="absolute left-5 top-5 rounded-full bg-surface-1/85 px-3 py-1 text-[12px] text-type-1 backdrop-blur md:left-7 md:top-7">
                  0{i + 1} · {items.length} products
                </span>
              </Link>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { icon: Cursor, t: 'Pick a product', d: 'Browse wall art, albums, prints and gifts curated by your photographer.' },
    { icon: Sliders, t: 'Make it yours', d: 'Choose size, frame, paper and finish — the preview updates as you go.' },
    { icon: ImagesSquare, t: 'Choose your photos', d: 'Select one or many straight from your gallery. More photos, more prints.' },
    { icon: Crop, t: 'Perfect every crop', d: 'Drag and zoom each photo so it fits exactly how you want it printed.' },
  ]
  return (
    <section className="bg-surface-1 py-24">
      <div className="mx-auto grid max-w-[1360px] gap-12 px-4 md:px-8 lg:grid-cols-[1fr_1.3fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Eyebrow>How it works</Eyebrow>
          <SplitText as="h2" text="From gallery to your hands in four steps." className="mt-4 max-w-[480px] text-[34px] font-medium leading-[1.05] tracking-[-0.03em] md:text-[48px]" />
          <p className="mt-5 max-w-[420px] text-[15px] leading-relaxed text-type-2">
            Every order is reviewed by {gallery.photographer} before it goes to print, so colour and crop are exactly right.
          </p>
        </div>
        <div className="space-y-4">
          {steps.map((s, i) => (
            <Reveal key={s.t} className="group flex gap-5 rounded-2xl border border-border bg-surface-0 p-6 transition duration-500 hover:bg-surface-2 md:p-8">
              <span className="text-[13px] font-medium tabular-nums text-type-3">0{i + 1}</span>
              <div className="flex-1">
                <p className="text-[20px] font-medium tracking-tight md:text-[24px]">{s.t}</p>
                <p className="mt-2 max-w-[440px] text-[14px] leading-relaxed text-type-2">{s.d}</p>
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface-1 shadow-sm ring-1 ring-border transition-transform duration-500 group-hover:-rotate-12">
                <s.icon size={20} />
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Bestsellers() {
  const ref = useRef(null)
  return (
    <section className="py-24">
      <div className="mx-auto mb-10 flex max-w-[1360px] items-end justify-between gap-4 px-4 md:px-8">
        <div>
          <Eyebrow>Client favourites</Eyebrow>
          <SplitText as="h2" text="Most ordered this season" className="mt-4 text-[34px] font-medium leading-[1.05] tracking-[-0.03em] md:text-[48px]" />
        </div>
        <p className="hidden text-[13px] text-type-3 md:block">Drag to explore →</p>
      </div>
      <div ref={ref} className="overflow-hidden px-4 md:px-8">
        <motion.div drag="x" dragConstraints={ref} dragElastic={0.08} className="mx-auto flex max-w-[1360px] cursor-grab gap-5 active:cursor-grabbing">
          {products.map((p) => (
            <div key={p.id} className="w-[72vw] shrink-0 sm:w-[340px]">
              <ProductCard product={p} />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function PackagesTeaser() {
  const maxSave = Math.max(...packages.map((p) => Math.round((1 - packagePrice(p) / packageValue(p)) * 100)))
  return (
    <section className="mx-2 rounded-[28px] bg-type-0 py-20 text-white md:mx-4">
      <div className="mx-auto max-w-[1360px] px-4 md:px-8">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-white/50">
              <span className="h-1.5 w-1.5 rounded-full bg-white" /> Packages
            </p>
            <SplitText as="h2" text={`Bundle your favourites and save up to ${maxSave}%.`} className="mt-4 max-w-[640px] text-[34px] font-medium leading-[1.05] tracking-[-0.03em] md:text-[48px]" />
          </div>
          <Button as={Link} to="/packages" variant="light" arrow>
            All packages
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {packages.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <PackageCard pkg={p} dark />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Quality() {
  const items = [
    { icon: Medal, t: 'Museum-grade', d: 'Archival papers and inks rated 100+ years.' },
    { icon: ShieldCheck, t: 'Reviewed by your photographer', d: 'Every crop is checked before printing.' },
    { icon: Leaf, t: 'Responsibly made', d: 'FSC wood and recyclable packaging.' },
    { icon: Truck, t: 'Insured shipping', d: 'Tracked, insured and carefully packed.' },
  ]
  return (
    <section className="mx-auto grid max-w-[1360px] gap-px overflow-hidden px-4 py-24 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
      {items.map((it, i) => (
        <Reveal key={it.t} delay={i * 0.08} className="border-t border-border py-6 pr-6">
          <it.icon size={24} weight="light" />
          <p className="mt-6 text-[17px] font-medium tracking-tight">{it.t}</p>
          <p className="mt-1.5 text-[14px] text-type-2">{it.d}</p>
        </Reveal>
      ))}
    </section>
  )
}

function Faq() {
  return (
    <section className="mx-auto grid max-w-[1360px] gap-10 px-4 md:px-8 lg:grid-cols-[1fr_1.4fr]">
      <div>
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="mt-4 text-[34px] font-medium leading-[1.05] tracking-[-0.03em] md:text-[48px]">Good to know</h2>
      </div>
      <Accordion
        defaultOpen={0}
        items={[
          { q: 'What happens if I select several photos for one product?', a: 'For single-photo products like framed prints, each photo you select becomes its own item in the same size and finish — so choosing 4 photos gives you 4 framed prints. Albums and books hold all selected photos in one item.' },
          { q: 'Can I adjust how my photos are cropped?', a: 'Yes. After choosing photos you can drag, zoom and rotate the orientation of each one. We also flag photos that may print at a lower resolution.' },
          { q: 'How do packages work?', a: 'Packages bundle several products at a lower price. You pick the photos for each item in the package, crop them, and the discount is applied automatically in your cart.' },
          { q: 'When will my order arrive?', a: 'Most prints ship in 5–7 business days. Albums are hand-bound and take 3–4 weeks. Express shipping is available at checkout.' },
          { q: 'Do you print the photos exactly as they appear in the gallery?', a: 'Your photographer colour-corrects every image for print and reviews your crops before sending them to the lab.' },
        ]}
      />
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <Categories />
      <HowItWorks />
      <Bestsellers />
      <PackagesTeaser />
      <Quality />
      <Faq />
    </>
  )
}
