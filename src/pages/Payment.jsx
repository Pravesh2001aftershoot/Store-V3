import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, PaypalLogo, AppleLogo, Lock, Info, Check, DownloadSimple, ArrowRight } from '@phosphor-icons/react'
import { useStore, SHIPPING } from '../state/store'
import { productById } from '../data/catalog'
import { getPhoto } from '../data/gallery'
import { getActiveGalleryId, galleryPath } from '../data/galleries'
import { recordPurchase } from '../data/purchases'
import { lineIsDigital, lineSubtotal } from '../lib/pricing'
import { downloadPhotos } from '../gallery/lib/actions'
import CheckoutShell from '../components/CheckoutShell'
import { Section, checkoutErrors } from './Checkout'
import { Button, Field } from '../components/ui'
import { cn, money } from '../lib/utils'

const ease = [0.22, 1, 0.36, 1]

const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
const fmtExp = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d
}

function CardPreview({ number, name, exp }) {
  return (
    <div className="relative aspect-[1.586] w-full max-w-[320px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a2a2a] to-[#0f0f0f] p-5 text-white shadow-[0_20px_40px_-15px_rgba(0,0,0,.5)]">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-16 -left-6 h-48 w-48 rounded-full bg-white/[0.04]" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="h-7 w-10 rounded-md bg-gradient-to-br from-[#e8d9a8] to-[#b89b52]" />
          <CreditCard size={22} className="text-white/60" />
        </div>
        <p className="font-mono text-16-r tracking-[0.12em]">{number || '•••• •••• •••• ••••'}</p>
        <div className="flex justify-between text-11-sb uppercase">
          <span className="truncate text-white/80">{name || 'Name on card'}</span>
          <span className="text-white/80">{exp || 'MM / YY'}</span>
        </div>
      </div>
    </div>
  )
}

export default function Payment() {
  const { lines, checkout, shipping, totals, shipped, dispatch } = useStore()
  const [method, setMethod] = useState('card')
  const [paid, setPaid] = useState(null) // { all, photos, total, prints } once the digital part is paid
  const [card, setCard] = useState({ number: '', name: checkout.firstName ? `${checkout.firstName} ${checkout.lastName}` : '', exp: '', cvc: '' })
  const [billingSame, setBillingSame] = useState(true)
  const [ended, setEnded] = useState(false)

  if (paid) return <PaidStep paid={paid} />
  if (!lines.length) return <Navigate to="/cart" replace />
  if (Object.keys(checkoutErrors(checkout, shipped)).length) return <Navigate to="/checkout" replace />
  const ship = SHIPPING.find((s) => s.id === shipping)
  const files = lines.filter(lineIsDigital)

  // Prints still end the prototype. Digital downloads are "paid": they're recorded for the gallery the
  // client came from (src/data/purchases.js), leave the cart and unlock in the gallery straight away.
  const pay = () => {
    if (!files.length) return setEnded(true)
    const all = files.some((l) => productById[l.productId]?.mode === 'gallery')
    const photos = [...new Map(files.flatMap((l) => l.photos).map((e) => [e.photoId, getPhoto(e.photoId)])).values()]
    recordPurchase(getActiveGalleryId(), { all, ids: photos.map((p) => p.id) })
    files.forEach((l) => dispatch({ type: 'remove', id: l.id }))
    setPaid({ all, photos, total: files.reduce((sum, l) => sum + lineSubtotal(l), 0), prints: lines.length - files.length })
  }

  const methods = [
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'paypal', label: 'PayPal', icon: PaypalLogo },
    { id: 'apple', label: 'Apple Pay', icon: AppleLogo },
  ]

  return (
    <CheckoutShell step={2}>
      <div className="space-y-4">
        <h1 className="text-36-sb">Payment</h1>

        <div className="divide-y divide-border rounded-2xl border border-border bg-surface-1 text-14-r">
          {(shipped
            ? [
                ['Contact', checkout.email],
                ['Ship to', [checkout.address, checkout.apt, checkout.city, `${checkout.state} ${checkout.zip}`].filter(Boolean).join(', ')],
                ['Method', `${ship.label} · ${ship.eta} · ${ship.price ? money(ship.price) : 'Free'}`],
              ]
            : [
                ['Contact', checkout.email],
                ['Delivery', 'Instant download in your gallery'],
              ]
          ).map(([k, v]) => (
            <div key={k} className="flex items-center gap-4 px-5 py-3.5">
              <span className="w-20 shrink-0 text-type-2">{k}</span>
              <span className="min-w-0 flex-1 truncate">{v}</span>
              <Link to="/checkout" className="text-13-m underline-offset-4 hover:underline">
                Change
              </Link>
            </div>
          ))}
        </div>

        <Section n={shipped ? 4 : 2} title="Payment method">
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-surface-2 p-1">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={cn('relative flex items-center justify-center gap-2 rounded-lg py-2.5 text-13-r transition', method === m.id ? 'text-type-0' : 'text-type-2')}
              >
                {method === m.id && <motion.span layoutId="pay-tab" className="absolute inset-0 rounded-lg bg-surface-1 shadow-sm" transition={{ duration: 0.35, ease }} />}
                <m.icon size={16} className="relative" weight={method === m.id ? 'fill' : 'regular'} />
                <span className="relative">{m.label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={method} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="mt-5">
              {method === 'card' ? (
                <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field className="sm:col-span-2" label="Card number" inputMode="numeric" autoComplete="cc-number" placeholder="1234 1234 1234 1234" value={card.number} onChange={(e) => setCard({ ...card, number: fmtCard(e.target.value) })} />
                    <Field className="sm:col-span-2" label="Name on card" autoComplete="cc-name" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                    <Field label="Expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="MM / YY" value={card.exp} onChange={(e) => setCard({ ...card, exp: fmtExp(e.target.value) })} />
                    <Field label="CVC" inputMode="numeric" autoComplete="cc-csc" placeholder="123" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
                  </div>
                  <div className="hidden md:block md:w-[280px]">
                    <CardPreview {...card} />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-input p-6 text-center text-14-r text-type-2">
                  You’ll be redirected to {method === 'paypal' ? 'PayPal' : 'Apple Pay'} to complete your purchase securely.
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {shipped && <label className="mt-5 flex cursor-pointer items-center gap-3 text-14-r">
            <input type="checkbox" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} className="h-4 w-4 accent-[#181818]" />
            Billing address same as shipping
          </label>}
        </Section>

        <Button size="lg" className="h-14 w-full" onClick={pay}>
          <Lock size={16} /> Make payment · {money(totals.total)}
        </Button>
        <AnimatePresence>
          {ended && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 rounded-xl bg-surface-2 p-3 text-13-r text-type-1"
            >
              <Info size={16} /> Prototype ends here. No payment was processed.
            </motion.p>
          )}
        </AnimatePresence>
        <p className="text-center text-12-r text-type-3">
          {shipped
            ? 'Payments are encrypted and processed securely. You won’t be charged for prints until your photographer approves the order.'
            : 'Payments are encrypted and processed securely. Your downloads unlock as soon as you pay.'}
        </p>
      </div>
    </CheckoutShell>
  )
}

/**
 * Payment complete for digital downloads: they're unlocked in the gallery. Up to 10 photos bought one
 * by one can be saved from here too; the whole gallery is downloaded from the gallery itself.
 */
function PaidStep({ paid }) {
  const id = getActiveGalleryId()
  const shown = paid.photos.slice(0, 12)
  const canSave = !paid.all && paid.photos.length > 0 && paid.photos.length <= 10
  return (
    <CheckoutShell step={3} summary={false}>
      <div className="mx-auto max-w-[560px] rounded-2xl border border-border bg-surface-1 p-6 text-center md:p-8">
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease }}
          className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success text-white"
        >
          <Check size={24} weight="bold" />
        </motion.span>
        <h1 className="mt-5 text-30-m">Your downloads are ready</h1>
        <p className="mt-2 text-14-r text-type-2">
          {paid.all
            ? 'You own every photo in the gallery in high res. Download them from the gallery, one at a time or all at once.'
            : `${paid.photos.length === 1 ? 'This photo is' : `These ${paid.photos.length} photos are`} yours in high res. Download them here or from the gallery, any time.`}
        </p>
        <p className="mt-1 text-13-r tabular-nums text-type-3">Paid {money(paid.total)} · receipt sent to your email</p>
        {shown.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-1.5">
            {shown.map((p) => (
              <img key={p.id} src={p.thumb} alt="" className="h-14 w-auto rounded-md object-cover ring-1 ring-black/5" />
            ))}
            {paid.photos.length > shown.length && <span className="self-center text-12-r text-type-2">+{paid.photos.length - shown.length}</span>}
          </div>
        )}
        <div className="mt-7 grid gap-2">
          {canSave && (
            <Button size="lg" onClick={() => downloadPhotos(paid.photos)}>
              <DownloadSimple size={18} /> Download {paid.photos.length === 1 ? 'photo' : `${paid.photos.length} photos`}
            </Button>
          )}
          <Button as={Link} to={galleryPath(id)} size="lg" variant={canSave ? 'outline' : 'default'}>
            {paid.all || !canSave ? 'Download in your gallery' : 'Back to your gallery'} <ArrowRight size={16} />
          </Button>
          {paid.prints > 0 && (
            <Button as={Link} to="/cart" variant="ghost">
              {paid.prints === 1 ? '1 print is' : `${paid.prints} prints are`} still in your cart
            </Button>
          )}
        </div>
      </div>
    </CheckoutShell>
  )
}
