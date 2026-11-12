import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, PaypalLogo, AppleLogo, Lock, Info } from '@phosphor-icons/react'
import { useStore, SHIPPING } from '../state/store'
import CheckoutShell from '../components/CheckoutShell'
import { Section } from './Checkout'
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
        <p className="font-mono text-[17px] tracking-[0.12em]">{number || '•••• •••• •••• ••••'}</p>
        <div className="flex justify-between text-[11px] uppercase tracking-wider">
          <span className="truncate text-white/80">{name || 'Name on card'}</span>
          <span className="text-white/80">{exp || 'MM / YY'}</span>
        </div>
      </div>
    </div>
  )
}

export default function Payment() {
  const { lines, checkout, shipping, totals } = useStore()
  const [method, setMethod] = useState('card')
  const [card, setCard] = useState({ number: '', name: checkout.firstName ? `${checkout.firstName} ${checkout.lastName}` : '', exp: '', cvc: '' })
  const [billingSame, setBillingSame] = useState(true)
  const [ended, setEnded] = useState(false)

  if (!lines.length) return <Navigate to="/cart" replace />
  if (!checkout.email) return <Navigate to="/checkout" replace />
  const ship = SHIPPING.find((s) => s.id === shipping)

  const methods = [
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'paypal', label: 'PayPal', icon: PaypalLogo },
    { id: 'apple', label: 'Apple Pay', icon: AppleLogo },
  ]

  return (
    <CheckoutShell step={2}>
      <div className="space-y-4">
        <h1 className="text-[32px] font-medium tracking-[-0.03em] md:text-[40px]">Payment</h1>

        <div className="divide-y divide-border rounded-2xl border border-border bg-surface-1 text-[14px]">
          {[
            ['Contact', checkout.email],
            ['Ship to', [checkout.address, checkout.apt, checkout.city, `${checkout.state} ${checkout.zip}`].filter(Boolean).join(', ')],
            ['Method', `${ship.label} · ${ship.eta} · ${ship.price ? money(ship.price) : 'Free'}`],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center gap-4 px-5 py-3.5">
              <span className="w-20 shrink-0 text-type-2">{k}</span>
              <span className="min-w-0 flex-1 truncate">{v}</span>
              <Link to="/checkout" className="text-[13px] font-medium underline-offset-4 hover:underline">
                Change
              </Link>
            </div>
          ))}
        </div>

        <Section n={4} title="Payment method">
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-surface-2 p-1">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={cn('relative flex items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] transition', method === m.id ? 'text-type-0' : 'text-type-2')}
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
                <div className="rounded-xl border border-dashed border-input p-6 text-center text-[14px] text-type-2">
                  You’ll be redirected to {method === 'paypal' ? 'PayPal' : 'Apple Pay'} to complete your purchase securely.
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <label className="mt-5 flex cursor-pointer items-center gap-3 text-[14px]">
            <input type="checkbox" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} className="h-4 w-4 accent-[#181818]" />
            Billing address same as shipping
          </label>
        </Section>

        <Button size="lg" className="h-14 w-full text-[15px]" onClick={() => setEnded(true)}>
          <Lock size={16} /> Make payment · {money(totals.total)}
        </Button>
        <AnimatePresence>
          {ended && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 rounded-xl bg-surface-2 p-3 text-[13px] text-type-1"
            >
              <Info size={16} /> Prototype ends here. No payment was processed.
            </motion.p>
          )}
        </AnimatePresence>
        <p className="text-center text-[12px] text-type-3">Payments are encrypted and processed securely. You won’t be charged until your photographer approves the order.</p>
      </div>
    </CheckoutShell>
  )
}
