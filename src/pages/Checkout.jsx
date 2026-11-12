import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check } from '@phosphor-icons/react'
import { useStore, SHIPPING } from '../state/store'
import CheckoutShell from '../components/CheckoutShell'
import { Button, Field } from '../components/ui'
import { cn, money } from '../lib/utils'

const REQUIRED = ['email', 'firstName', 'lastName', 'address', 'city', 'state', 'zip']

/** Field → message for everything wrong with the details. Empty object means they're complete. */
export function checkoutErrors(form) {
  const errs = Object.fromEntries(REQUIRED.filter((k) => !form[k]?.trim()).map((k) => [k, 'Required']))
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email'
  return errs
}

export const Section = ({ n, title, children }) => (
  <section className="rounded-2xl border border-border bg-surface-1 p-5 md:p-6">
    <p className="mb-5 flex items-center gap-3 text-16-sb">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-type-0 text-12-r text-white">{n}</span>
      {title}
    </p>
    {children}
  </section>
)

export default function Checkout() {
  const { lines, checkout, shipping, dispatch } = useStore()
  const [form, setForm] = useState({ country: 'United States', ...checkout })
  const [errors, setErrors] = useState({})
  const nav = useNavigate()
  if (!lines.length) return <Navigate to="/cart" replace />

  const f = (k) => ({
    value: form[k] || '',
    onChange: (e) => setForm({ ...form, [k]: e.target.value }),
    error: errors[k],
  })

  const submit = (e) => {
    e.preventDefault()
    const errs = checkoutErrors(form)
    setErrors(errs)
    dispatch({ type: 'checkout', data: form }) // keep the draft even if incomplete; Payment re-checks it
    if (!Object.keys(errs).length) nav('/payment')
  }

  const fillDemo = () =>
    setForm({ ...form, email: 'lexie@example.com', phone: '(555) 201-4410', firstName: 'Lexie', lastName: 'Taylor', address: '24 Orchard Lane', apt: 'Apt 3', city: 'Austin', state: 'TX', zip: '78701' })

  return (
    <CheckoutShell step={1}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-36-sb">Checkout</h1>
          <button type="button" onClick={fillDemo} className="text-13-r text-type-2 underline-offset-4 hover:text-type-0 hover:underline">
            Fill demo details
          </button>
        </div>

        <Section n={1} title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" type="email" autoComplete="email" placeholder="you@email.com" {...f('email')} />
            <Field label="Phone (optional)" type="tel" autoComplete="tel" placeholder="For delivery updates" {...f('phone')} />
          </div>
        </Section>

        <Section n={2} title="Shipping address">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" autoComplete="given-name" {...f('firstName')} />
            <Field label="Last name" autoComplete="family-name" {...f('lastName')} />
            <Field className="sm:col-span-2" label="Address" autoComplete="address-line1" {...f('address')} />
            <Field className="sm:col-span-2" label="Apartment, suite (optional)" autoComplete="address-line2" {...f('apt')} />
            <Field label="City" autoComplete="address-level2" {...f('city')} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="State" autoComplete="address-level1" {...f('state')} />
              <Field label="ZIP" autoComplete="postal-code" inputMode="numeric" {...f('zip')} />
            </div>
            <Field className="sm:col-span-2" label="Country" {...f('country')} />
          </div>
        </Section>

        <Section n={3} title="Delivery method">
          <div className="space-y-2">
            {SHIPPING.map((s) => {
              const active = shipping === s.id
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => dispatch({ type: 'shipping', value: s.id })}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition',
                    active ? 'border-type-0 shadow-[0_0_0_1px_var(--type-0)]' : 'border-border hover:border-type-3'
                  )}
                >
                  <span className={cn('grid h-5 w-5 place-items-center rounded-full border transition', active ? 'border-type-0 bg-type-0 text-white' : 'border-input')}>
                    {active && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Check size={11} weight="bold" />
                      </motion.span>
                    )}
                  </span>
                  <span className="flex-1">
                    <span className="block text-14-m">{s.label}</span>
                    <span className="block text-12-r text-type-2">{s.eta}</span>
                  </span>
                  <span className="text-14-m">{s.price ? money(s.price) : 'Free'}</span>
                </button>
              )
            })}
          </div>
        </Section>

        <Button type="submit" size="lg" className="h-14 w-full" arrow>
          Continue to payment
        </Button>
      </form>
    </CheckoutShell>
  )
}
