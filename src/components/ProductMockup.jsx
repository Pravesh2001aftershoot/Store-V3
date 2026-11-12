import { motion } from 'framer-motion'
import CroppedImage from './CroppedImage'
import { getPhoto, gallery } from '../data/gallery'
import { cellAspect, defaultOrientation, defaultVariant, getOption, getValue } from '../lib/pricing'
import { cn } from '../lib/utils'

const DEFAULT_PHOTOS = {
  'framed-print': ['p1043'],
  canvas: ['p1011'],
  metal: ['p1036'],
  triptych: ['p1027', 'p1005', 'p64'],
  'heirloom-album': ['p1027'],
  'layflat-book': ['p1044'],
  'fine-art-print': ['p1043', 'p91'],
  'acrylic-block': ['p64'],
  'desk-frame': ['p338'],
}

const TABLE_STYLES = ['album', 'photobook', 'acrylic', 'print']
const ease = [0.22, 1, 0.36, 1]

/**
 * CSS-rendered product preview that reacts to the variant (size, frame colour, mat, cover…)
 * and to the client's own photos and crops.
 */
export default function ProductMockup({ product, variant: v, items, className, scene = true, zoom = 1 }) {
  const variant = v || defaultVariant(product)
  const list =
    items && items.length
      ? items
      : (DEFAULT_PHOTOS[product.id] || ['p1043']).map((id) => ({ photoId: id }))
  const first = list[0]
  const photo = getPhoto(first.photoId)
  const orientation = first.orientation || defaultOrientation(product, photo)
  const A = cellAspect(product, variant, orientation)

  // scale the piece slightly with physical size
  const sizes = getOption(product, 'size').values
  const idx = sizes.findIndex((s) => s.id === variant.size)
  const scale = 0.82 + (0.18 * Math.max(0, idx)) / Math.max(1, sizes.length - 1)
  const baseW = A > 1.05 ? 70 : A < 0.95 ? 50 : 58
  const width = `${baseW * scale}%`

  const table = TABLE_STYLES.includes(product.style) || product.category === 'desk-gifts'

  const img = (item, aspect, extra) => (
    <CroppedImage photo={getPhoto(item.photoId)} crop={item.crop} aspect={aspect} hi className={extra} />
  )

  let piece
  switch (product.style) {
    case 'frame': {
      const frame = getValue(product, 'frame', variant.frame)
      const mat = variant.mat === 'white'
      piece = (
        <div
          style={{ width, background: frame.hex, padding: product.category === 'desk-gifts' ? '6%' : '4.2%' }}
          className="shadow-[0_30px_50px_-18px_rgba(0,0,0,.45),0_2px_4px_rgba(0,0,0,.12),inset_0_0_0_1px_rgba(255,255,255,.12)]"
        >
          <div
            style={{ padding: mat ? '11%' : 0, background: mat ? '#fbfaf7' : 'transparent' }}
            className="shadow-[inset_1px_2px_4px_rgba(0,0,0,.25)]"
          >
            {img(first, A, mat ? 'shadow-[inset_0_0_0_1px_rgba(0,0,0,.06)]' : '')}
          </div>
        </div>
      )
      break
    }
    case 'canvas': {
      const edge = { mirror: '#8a847c', white: '#ededeb', black: '#232323' }[variant.edge] || '#8a847c'
      const d = variant.depth === 'thick' ? 9 : 5
      piece = (
        <div style={{ width, boxShadow: `${d}px ${d}px 0 ${edge}, 0 34px 50px -16px rgba(0,0,0,.4)` }}>
          {img(first, A)}
        </div>
      )
      break
    }
    case 'metal': {
      const gloss = variant.finish === 'satin' ? 0.12 : 0.38
      piece = (
        <div style={{ width }} className="relative rounded-[2px] shadow-[0_40px_60px_-20px_rgba(0,0,0,.45),0_0_0_1px_rgba(255,255,255,.4)]">
          {img(first, A, 'rounded-[2px]')}
          <div
            className="pointer-events-none absolute inset-0 rounded-[2px]"
            style={{ background: `linear-gradient(118deg, rgba(255,255,255,${gloss}) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 70%, rgba(255,255,255,${gloss / 3}) 100%)` }}
          />
        </div>
      )
      break
    }
    case 'triptych': {
      const frame = getValue(product, 'frame', variant.frame)
      const three = [0, 1, 2].map((i) => list[i] || { photoId: DEFAULT_PHOTOS.triptych[i] })
      const a = cellAspect(product, variant, 'portrait')
      piece = (
        <div className="flex w-[84%] items-center justify-center gap-[3%]">
          {three.map((it, i) => (
            <div
              key={i}
              style={{ background: frame.hex, padding: '5%' }}
              className="w-[28%] shadow-[0_24px_40px_-16px_rgba(0,0,0,.45)]"
            >
              <div className="shadow-[inset_1px_2px_4px_rgba(0,0,0,.25)]">{img(it, a)}</div>
            </div>
          ))}
        </div>
      )
      break
    }
    case 'album':
    case 'photobook': {
      const coverOpt = getOption(product, 'cover')
      const cover = coverOpt && getValue(product, 'cover', variant.cover)
      const photoWrap = product.style === 'photobook' && variant.cover !== 'linen'
      const hex = photoWrap ? '#ddd' : cover?.hex || '#d6ccbb'
      const dark = ['#3b3b3b', '#151515'].includes(hex)
      piece = (
        <div
          style={{
            width: `${60 * scale}%`,
            aspectRatio: 1,
            background: hex,
            boxShadow:
              '2px 2px 0 #fbfbfa, 3px 3px 0 #dcdad6, 5px 5px 0 #fbfbfa, 6px 6px 0 #d6d4cf, 8px 8px 0 #f7f6f3, 9px 9px 0 #cfcdc8, 0 40px 50px -18px rgba(0,0,0,.45)',
          }}
          className="@container relative overflow-hidden rounded-r-[3px]"
        >
          {photoWrap ? (
            img(first, 1, 'absolute inset-0 h-full w-full')
          ) : (
            <>
              <div
                className="absolute inset-0 opacity-40"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,.05) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 1px, transparent 1px 3px)' }}
              />
              <div className="absolute left-1/2 top-[18%] w-[46%] -translate-x-1/2 bg-white/90 p-[2%] shadow-[inset_0_1px_3px_rgba(0,0,0,.3)]">
                {img(first, 1)}
              </div>
              <p
                className={cn('absolute inset-x-0 bottom-[11%] text-center text-[4.2cqw] font-medium uppercase tracking-[0.3em]', dark ? 'text-white/50' : 'text-black/35')}
              >
                {gallery.client}
              </p>
            </>
          )}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[7%] bg-gradient-to-r from-black/30 via-black/5 to-transparent" />
        </div>
      )
      break
    }
    case 'print': {
      const border = variant.border === 'white'
      const second = list[1] || { photoId: DEFAULT_PHOTOS['fine-art-print'][1] }
      piece = (
        <div className="relative" style={{ width }}>
          <div
            className="absolute inset-0 translate-x-[14%] translate-y-[-6%] rotate-[7deg] bg-white shadow-[0_14px_30px_-12px_rgba(0,0,0,.35)]"
            style={{ padding: border ? '5%' : 0 }}
          >
            {img(second, A)}
          </div>
          <div className="relative -rotate-2 bg-white shadow-[0_20px_36px_-12px_rgba(0,0,0,.4)]" style={{ padding: border ? '5%' : 0 }}>
            {img(first, A)}
          </div>
        </div>
      )
      break
    }
    case 'acrylic': {
      const thick = variant.thickness === '1'
      piece = (
        <div
          style={{ width, padding: thick ? '7%' : '5%' }}
          className="relative rounded-[6px] border border-white bg-gradient-to-br from-white/80 via-white/30 to-white/60 shadow-[0_30px_40px_-18px_rgba(0,0,0,.4),inset_0_0_0_1px_rgba(255,255,255,.9),inset_0_-6px_12px_rgba(0,0,0,.06)] backdrop-blur"
        >
          {img(first, A, 'rounded-[2px]')}
          <div className="pointer-events-none absolute inset-0 rounded-[6px] bg-[linear-gradient(120deg,rgba(255,255,255,.55)_0%,rgba(255,255,255,0)_35%)]" />
        </div>
      )
      break
    }
    default:
      piece = <div style={{ width }}>{img(first, A)}</div>
  }

  return (
    <div className={cn('relative aspect-[4/5] w-full overflow-hidden', scene && 'wall', className)}>
      {scene && table && (
        <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-b from-[#e8e6e2] to-[#e1dfda] shadow-[inset_0_1px_0_rgba(255,255,255,.8)]" />
      )}
      <motion.div
        className={cn('absolute inset-0 flex items-center justify-center', table && 'pb-[8%]')}
        animate={{ scale: zoom }}
        transition={{ duration: 0.8, ease }}
        style={{ transformOrigin: '30% 30%' }}
      >
        <motion.div layout transition={{ duration: 0.6, ease }} className="flex w-full items-center justify-center">
          {piece}
        </motion.div>
      </motion.div>
    </div>
  )
}
