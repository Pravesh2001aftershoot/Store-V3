import { Link } from 'react-router-dom'
import { Check, ArrowUpRight } from '@phosphor-icons/react'
import { productById } from '../data/catalog'
import { defaultVariant, packagePrice, packageValue, sizeOf } from '../lib/pricing'
import { cn, money } from '../lib/utils'
import ProductMockup from './ProductMockup'
import { Badge } from './ui'

export function PackageCollage({ pkg, className }) {
  const slots = pkg.slots.slice(0, 3)
  return (
    <div className={cn('grid aspect-[4/3] grid-cols-2 grid-rows-2 gap-1.5 overflow-hidden', className)}>
      {slots.map((s, i) => {
        const product = productById[s.productId]
        return (
          <div key={s.id} className={cn('relative overflow-hidden', i === 0 && 'row-span-2')}>
            <ProductMockup product={product} variant={defaultVariant(product, s.variant)} className="!aspect-auto h-full" />
            {s.qty > 1 && <Badge className="absolute bottom-2 left-2">× {s.qty}</Badge>}
          </div>
        )
      })}
    </div>
  )
}

export default function PackageCard({ pkg, dark = false }) {
  const value = packageValue(pkg)
  const price = packagePrice(pkg)
  return (
    <Link
      to={`/packages/${pkg.id}`}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl p-2 transition-all duration-500',
        dark ? 'bg-white/[0.06] hover:bg-white/[0.1]' : 'border border-border bg-surface-1 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,.18)]'
      )}
    >
      <div className="relative overflow-hidden rounded-xl">
        <div className="transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]">
          <PackageCollage pkg={pkg} />
        </div>
        <Badge tone="success" className="absolute right-3 top-3 border-0">
          Save {Math.round((1 - price / value) * 100)}%
        </Badge>
        {pkg.popular && (
          <Badge tone="dark" className="absolute left-3 top-3">
            Most loved
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={cn('text-20-m', dark ? 'text-white' : 'text-type-0')}>{pkg.name}</p>
            <p className={cn('mt-0.5 text-13-r', dark ? 'text-white/55' : 'text-type-2')}>{pkg.tagline}</p>
          </div>
          <span
            className={cn(
              'grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all duration-500 group-hover:rotate-45',
              dark ? 'bg-white text-type-0' : 'bg-type-0 text-white'
            )}
          >
            <ArrowUpRight size={15} weight="bold" />
          </span>
        </div>
        <ul className={cn('mt-4 space-y-1.5 text-13-r', dark ? 'text-white/70' : 'text-type-1')}>
          {pkg.slots.map((s) => {
            const p = productById[s.productId]
            return (
              <li key={s.id} className="flex items-center gap-2">
                <Check size={13} weight="bold" className={dark ? 'text-white/40' : 'text-type-3'} />
                {s.qty} × {p.name} · {sizeOf(p, defaultVariant(p, s.variant)).label}
              </li>
            )
          })}
        </ul>
        <div className="mt-auto flex items-baseline gap-2 pt-5">
          <span className={cn('text-24-m', dark ? 'text-white' : 'text-type-0')}>{money(price)}</span>
          <span className={cn('text-14-r line-through', dark ? 'text-white/35' : 'text-type-3')}>{money(value)}</span>
        </div>
      </div>
    </Link>
  )
}
