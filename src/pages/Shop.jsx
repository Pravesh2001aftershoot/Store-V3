import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Package as PackageIcon, ArrowRight } from '@phosphor-icons/react'
import { categories, products } from '../data/catalog'
import { fromPrice } from '../lib/pricing'
import { Eyebrow, SplitText, Select } from '../components/ui'
import ProductCard from '../components/ProductCard'
import { cn } from '../lib/utils'

const ease = [0.22, 1, 0.36, 1]

export default function Shop() {
  const { categoryId } = useParams()
  const [sort, setSort] = useState('featured')
  const cat = categories.find((c) => c.id === categoryId)

  const list = useMemo(() => {
    const l = products.filter((p) => !cat || p.category === cat.id)
    if (sort === 'low') return [...l].sort((a, b) => fromPrice(a) - fromPrice(b))
    if (sort === 'high') return [...l].sort((a, b) => fromPrice(b) - fromPrice(a))
    return l
  }, [cat, sort])

  const tabs = [{ id: undefined, name: 'All' }, ...categories]

  return (
    <div className="mx-auto max-w-[1360px] px-4 pt-10 md:px-8 md:pt-14">
      <nav className="text-13-r text-type-3">
        <Link to="/store" className="hover:text-type-0">Store</Link> <span className="mx-1.5">/</span>
        <span className="text-type-1">{cat ? cat.name : 'Shop all'}</span>
      </nav>
      <div className="mt-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <Eyebrow>{list.length} products</Eyebrow>
          <SplitText key={cat?.id || 'all'} text={cat ? cat.name : 'Shop all'} className="mt-4 text-48-sb md:text-72-sb" />
          <p className="mt-4 max-w-[480px] text-16-r text-type-2">
            {cat ? cat.blurb : 'Everything your photographer offers, made from the photos in your gallery.'}
          </p>
        </div>
        <Select
          title="Sort by"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'featured', label: 'Featured' },
            { value: 'low', label: 'Price: low to high' },
            { value: 'high', label: 'Price: high to low' },
          ]}
        />
      </div>

      <div className="no-scrollbar -mx-4 mt-10 flex gap-6 overflow-x-auto border-b border-border px-4 md:mx-0 md:px-0">
        {tabs.map((t) => {
          const active = t.id === cat?.id
          return (
            <Link
              key={t.name}
              to={t.id ? `/shop/${t.id}` : '/shop'}
              className={cn('relative shrink-0 pt-2 pb-3 text-14-r transition', active ? 'text-type-0' : 'text-type-2 hover:text-type-0')}
            >
              {active && <motion.span layoutId="shop-tab" className="absolute inset-x-0 bottom-0 h-0.5 bg-type-0" transition={{ duration: 0.4, ease }} />}
              <span className="relative">{t.name}</span>
            </Link>
          )
        })}
      </div>

      <motion.div layout className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.7, ease, delay: i * 0.05 }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <Link
        to="/packages"
        className="group mt-20 flex flex-col items-start justify-between gap-4 rounded-2xl bg-surface-2 p-6 transition hover:bg-[#efefef] md:flex-row md:items-center md:p-8"
      >
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-1 ring-1 ring-border">
            <PackageIcon size={20} />
          </span>
          <div>
            <p className="text-20-m">Buying more than one piece?</p>
            <p className="text-14-r text-type-2">Packages bundle albums, wall art and prints for up to 22% less.</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 text-14-m">
          Explore packages <ArrowRight size={14} className="transition group-hover:translate-x-1" />
        </span>
      </Link>
    </div>
  )
}
