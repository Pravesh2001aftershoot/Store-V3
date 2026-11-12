import { Link } from 'react-router-dom'
import { ArrowUpRight } from '@phosphor-icons/react'
import ProductMockup from './ProductMockup'
import { Badge } from './ui'
import { fromPrice, getOption } from '../lib/pricing'
import { money } from '../lib/utils'

export default function ProductCard({ product }) {
  const swatch = product.options.find((o) => o.type === 'swatch')
  return (
    <Link to={`/product/${product.id}`} className="group block" draggable={false}>
      <div className="relative overflow-hidden rounded-2xl">
        <div className="transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.05]">
          <ProductMockup product={product} />
        </div>
        {product.badge && <Badge className="absolute left-3 top-3">{product.badge}</Badge>}
        <span className="absolute bottom-3 right-3 grid h-10 w-10 translate-y-3 place-items-center rounded-full bg-type-0 text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight size={16} weight="bold" />
        </span>
      </div>
      <div className="mt-3.5 flex items-start justify-between gap-3 px-0.5">
        <div>
          <p className="text-[15px] font-medium text-type-0">{product.name}</p>
          <p className="mt-0.5 text-[13px] text-type-2">{product.tagline}</p>
        </div>
        <p className="shrink-0 text-[14px] text-type-1">
          <span className="text-type-3">from </span>
          {money(fromPrice(product))}
        </p>
      </div>
      {swatch && (
        <div className="mt-2.5 flex items-center gap-1.5 px-0.5">
          {swatch.values.map((v) => (
            <span key={v.id} className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10" style={{ background: v.hex }} title={v.label} />
          ))}
          <span className="ml-1 text-[12px] text-type-3">{getOption(product, 'size').values.length} sizes</span>
        </div>
      )}
    </Link>
  )
}
