import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Info, ImagesSquare, Package as PackageIcon, ArrowRight, Truck, ArrowsOut, Image as ImageIcon, FrameCorners } from '@phosphor-icons/react'
import { categories, packages, productById, products } from '../data/catalog'
import { getPhoto } from '../data/gallery'
import { defaultVariant, sizeOf, unitPrice, packagePrice, packageValue } from '../lib/pricing'
import { Accordion, AnimatedNumber, Badge, Button } from '../components/ui'
import ProductMockup from '../components/ProductMockup'
import ProductCard from '../components/ProductCard'
import OptionGroup from '../components/OptionGroup'
import { cn, money } from '../lib/utils'

const ease = [0.22, 1, 0.36, 1]

function HowManyNote({ product, variant }) {
  const size = sizeOf(product, variant)
  let text
  if (product.mode === 'unit')
    text = (
      <>
        You can select <b className="font-medium text-type-0">multiple photos</b> next. Each photo becomes its own {product.name.toLowerCase()} in{' '}
        {size.label} — e.g. 3 photos = <b className="font-medium text-type-0">3 × {product.name}</b>.
      </>
    )
  else if (product.mode === 'set')
    text = (
      <>
        Every <b className="font-medium text-type-0">{product.setSize} photos</b> make one triptych. Choose 6 photos and you’ll receive 2 sets.
      </>
    )
  else
    text = (
      <>
        Includes <b className="font-medium text-type-0">{product.book.min} photos</b>. Add up to {product.book.max} for {money(product.book.perExtra)} per extra photo.
      </>
    )
  return (
    <div className="flex gap-3 rounded-xl bg-surface-2 p-3.5 text-13-r-p text-type-1">
      <Info size={18} className="mt-0.5 shrink-0 text-type-2" />
      <p>{text}</p>
    </div>
  )
}

export default function Product() {
  const { productId } = useParams()
  const product = productById[productId]
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState('wall')
  const nav = useNavigate()

  if (!product) return <p className="p-20 text-center">Product not found.</p>

  const variant = defaultVariant(product, Object.fromEntries(params))
  const setOpt = (id, val) => setParams({ ...variant, [id]: val }, { replace: true, preventScrollReset: true })
  const price = unitPrice(product, variant, product.mode === 'book' ? product.book.min : 0)
  const cat = categories.find((c) => c.id === product.category)
  const inPackages = packages.filter((p) => p.slots.some((s) => s.productId === product.id))
  const related = products.filter((p) => p.id !== product.id && p.category === product.category).concat(products.filter((p) => p.category !== product.category)).slice(0, 3)

  const views = [
    { id: 'wall', label: 'In room', icon: FrameCorners },
    { id: 'detail', label: 'Detail', icon: ArrowsOut },
    { id: 'photo', label: 'Photo', icon: ImageIcon },
  ]

  const start = () => nav(`/build/product/${product.id}?${new URLSearchParams(variant)}`)

  return (
    <div className="mx-auto max-w-[1360px] px-4 pt-6 md:px-8 md:pt-10">
      <nav className="text-13-r text-type-3">
        <Link to="/" className="hover:text-type-0">Store</Link> <span className="mx-1.5">/</span>
        <Link to={`/shop/${cat.id}`} className="hover:text-type-0">{cat.name}</Link> <span className="mx-1.5">/</span>
        <span className="text-type-1">{product.name}</span>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-14">
        {/* Preview */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative overflow-hidden rounded-2xl">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                {view === 'photo' ? (
                  <div className="grid aspect-[4/5] place-items-center bg-surface-2 p-10 md:aspect-[5/5]">
                    <img src={getPhoto('p1043').src} alt="" className="max-h-full rounded-lg object-contain shadow-lg" />
                  </div>
                ) : (
                  <ProductMockup product={product} variant={variant} zoom={view === 'detail' ? 2.1 : 1} className="md:aspect-[5/5]" />
                )}
              </motion.div>
            </AnimatePresence>
            {product.badge && <Badge className="absolute left-4 top-4">{product.badge}</Badge>}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-surface-1/85 p-1 shadow-sm ring-1 ring-border backdrop-blur">
              {views.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={cn('relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-12-r transition', view === v.id ? 'text-white' : 'text-type-1 hover:text-type-0')}
                >
                  {view === v.id && <motion.span layoutId="view-pill" className="absolute inset-0 rounded-full bg-type-0" transition={{ duration: 0.4, ease }} />}
                  <v.icon size={14} className="relative" />
                  <span className="relative">{v.label}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="mt-3 text-center text-12-r text-type-3">Preview updates as you change options. You’ll pick your own photos next.</p>
        </div>

        {/* Configurator */}
        <div>
          <h1 className="text-36-sb md:text-48-sb">{product.name}</h1>
          <p className="mt-2 text-16-r text-type-2">{product.tagline}</p>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-30-m">
              <AnimatedNumber value={price} format={money} />
            </span>
            <span className="text-14-r text-type-2">{product.mode === 'unit' ? 'per piece' : product.mode === 'set' ? 'per set of 3' : `incl. ${product.book.min} photos`}</span>
          </div>

          <div className="mt-8 space-y-7 border-t border-border pt-7">
            {product.options.map((o) => (
              <OptionGroup key={o.id} option={o} value={variant[o.id]} onChange={(v) => setOpt(o.id, v)} />
            ))}
          </div>

          <div className="mt-8 space-y-3">
            <HowManyNote product={product} variant={variant} />
            <Button size="lg" className="h-14 w-full" onClick={start} arrow>
              <ImagesSquare size={18} /> Choose photos from gallery
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-12-r text-type-3">
              <Truck size={14} /> Ships in 5–7 business days · Free returns on damaged items
            </p>
          </div>

          {inPackages.length > 0 && (
            <div className="mt-8 rounded-2xl border border-border bg-surface-1 p-4">
              <p className="flex items-center gap-2 text-13-sb">
                <PackageIcon size={16} /> Save more in a package
              </p>
              <div className="mt-3 space-y-1">
                {inPackages.map((p) => (
                  <Link key={p.id} to={`/packages/${p.id}`} className="group flex items-center justify-between rounded-lg px-2 py-2 text-14-r transition hover:bg-surface-2">
                    <span>{p.name}</span>
                    <span className="flex items-center gap-2 text-type-2">
                      <Badge tone="success">Save {Math.round((1 - packagePrice(p) / packageValue(p)) * 100)}%</Badge>
                      <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Accordion
            className="mt-8"
            defaultOpen={0}
            items={[
              {
                q: 'Details',
                a: (
                  <>
                    <p>{product.description}</p>
                    <ul className="mt-3 space-y-1.5">
                      {product.details.map((d) => (
                        <li key={d} className="flex items-center gap-2">
                          <Check size={13} weight="bold" /> {d}
                        </li>
                      ))}
                    </ul>
                  </>
                ),
              },
              { q: 'Shipping & production', a: 'Produced by a professional lab within 5–7 business days (albums 3–4 weeks), then shipped tracked and insured.' },
              { q: 'Care', a: 'Display out of direct sunlight. Dust with a soft dry cloth. Avoid household cleaners on glazing and prints.' },
            ]}
          />
        </div>
      </div>

      <section className="mt-28">
        <h2 className="mb-8 text-30-m">You may also like</h2>
        <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  )
}
