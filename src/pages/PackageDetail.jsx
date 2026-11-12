import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ImagesSquare, Tag, Info } from '@phosphor-icons/react'
import { packageById, packages, productById } from '../data/catalog'
import { defaultVariant, packagePrice, packageValue, requirementText, slotValue, variantLabel } from '../lib/pricing'
import { Badge, Button, Reveal } from '../components/ui'
import ProductMockup from '../components/ProductMockup'
import PackageCard from '../components/PackageCard'
import { money } from '../lib/utils'

const ease = [0.22, 1, 0.36, 1]

export default function PackageDetail() {
  const { packageId } = useParams()
  const pkg = packageById[packageId]
  const nav = useNavigate()
  if (!pkg) return <p className="p-20 text-center">Package not found.</p>
  const value = packageValue(pkg)
  const price = packagePrice(pkg)
  const pct = Math.round((1 - price / value) * 100)
  const others = packages.filter((p) => p.id !== pkg.id).slice(0, 2)

  return (
    <div className="mx-auto max-w-[1360px] px-4 pt-6 md:px-8 md:pt-10">
      <nav className="text-13-r text-type-3">
        <Link to="/" className="hover:text-type-0">Store</Link> <span className="mx-1.5">/</span>
        <Link to="/packages" className="hover:text-type-0">Packages</Link> <span className="mx-1.5">/</span>
        <span className="text-type-1">{pkg.name}</span>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-14">
        <div className="grid grid-cols-2 gap-3 lg:sticky lg:top-28 lg:self-start">
          {pkg.slots.map((s, i) => {
            const product = productById[s.productId]
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease, delay: i * 0.1 }}
                className={`relative overflow-hidden rounded-2xl ${i === 0 && pkg.slots.length % 2 ? 'col-span-2' : ''}`}
              >
                <ProductMockup product={product} variant={defaultVariant(product, s.variant)} className={i === 0 && pkg.slots.length % 2 ? 'aspect-[16/10]' : 'aspect-square'} />
                <Badge className="absolute left-3 top-3">
                  {s.qty} × {product.name}
                </Badge>
              </motion.div>
            )
          })}
        </div>

        <div>
          {pkg.popular && <Badge tone="dark" className="mb-4">Most loved</Badge>}
          <h1 className="text-36-sb md:text-48-sb">{pkg.name}</h1>
          <p className="mt-2 text-16-r text-type-2">{pkg.tagline}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-30-m">{money(price)}</span>
            <span className="text-16-r text-type-3 line-through">{money(value)}</span>
            <Badge tone="success" className="text-12-m">
              <Tag size={12} /> Save {money(value - price)} ({pct}%)
            </Badge>
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <p className="mb-4 text-13-sb">What’s included</p>
            <div className="space-y-2">
              {pkg.slots.map((s, i) => {
                const product = productById[s.productId]
                const v = defaultVariant(product, s.variant)
                return (
                  <Reveal key={s.id} delay={i * 0.06} className="flex items-center gap-4 rounded-xl border border-border bg-surface-1 p-3">
                    <div className="w-16 shrink-0 overflow-hidden rounded-lg">
                      <ProductMockup product={product} variant={v} className="aspect-square" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-14-sb">
                        {s.qty} × {product.name}
                      </p>
                      <p className="truncate text-12-r text-type-2">{variantLabel(product, v)}</p>
                      <p className="text-12-r text-type-3">{requirementText(product, product.mode === 'book' ? undefined : s.qty)}</p>
                    </div>
                    <span className="text-13-r text-type-3 line-through">{money(slotValue(s))}</span>
                  </Reveal>
                )
              })}
            </div>
          </div>

          <div className="mt-6 flex gap-3 rounded-xl bg-surface-2 p-3.5 text-13-r-p text-type-1">
            <Info size={18} className="mt-0.5 shrink-0 text-type-2" />
            <p>Next you’ll choose photos for each piece, then fine-tune every crop. Albums can hold extra photos for a small fee.</p>
          </div>
          <Button size="lg" className="mt-4 h-14 w-full" onClick={() => nav(`/build/package/${pkg.id}`)} arrow>
            <ImagesSquare size={18} /> Choose photos for this package
          </Button>
        </div>
      </div>

      <section className="mt-28">
        <h2 className="mb-8 text-30-m">Other packages</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {others.map((p) => (
            <PackageCard key={p.id} pkg={p} />
          ))}
        </div>
      </section>
    </div>
  )
}
