import { Link } from 'react-router-dom'
import { packages } from '../data/catalog'
import { Eyebrow, Reveal, SplitText } from '../components/ui'
import PackageCard from '../components/PackageCard'

export default function Packages() {
  return (
    <div className="mx-auto max-w-[1360px] px-4 pt-10 md:px-8 md:pt-14">
      <nav className="text-13-r text-type-3">
        <Link to="/" className="hover:text-type-0">Store</Link> <span className="mx-1.5">/</span>
        <span className="text-type-1">Packages</span>
      </nav>
      <div className="mt-6 grid gap-6 md:grid-cols-2 md:items-end">
        <div>
          <Eyebrow>{packages.length} curated bundles</Eyebrow>
          <SplitText text="Packages" className="mt-4 text-48-sb md:text-72-sb" />
        </div>
        <p className="max-w-[440px] text-16-r text-type-2 md:justify-self-end">
          Curated combinations of albums, wall art and prints at a lower price than buying separately. You choose the photos for every piece.
        </p>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {packages.map((p, i) => (
          <Reveal key={p.id} delay={(i % 2) * 0.1}>
            <PackageCard pkg={p} />
          </Reveal>
        ))}
      </div>
    </div>
  )
}
