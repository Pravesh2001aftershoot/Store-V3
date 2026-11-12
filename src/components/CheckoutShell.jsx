import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, CaretRight } from '@phosphor-icons/react'
import { Wordmark } from './Layout'
import OrderSummary, { Totals } from './OrderSummary'
import { cn } from '../lib/utils'

export default function CheckoutShell({ step, children }) {
  const steps = [
    ['Cart', '/cart'],
    ['Details', '/checkout'],
    ['Payment', '/payment'],
  ]
  return (
    <div className="min-h-screen bg-surface-0">
      <header className="border-b border-border bg-surface-1">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-8">
          <Wordmark />
          <nav className="hidden items-center gap-2 text-13-r sm:flex">
            {steps.map(([l, to], i) => (
              <span key={l} className="flex items-center gap-2">
                {i > 0 && <CaretRight size={12} className="text-type-3" />}
                {i < step ? (
                  <Link to={to} className="text-type-1 hover:text-type-0">{l}</Link>
                ) : (
                  <span className={cn(i === step ? 'font-medium text-type-0' : 'text-type-3')}>{l}</span>
                )}
              </span>
            ))}
          </nav>
          <span className="flex items-center gap-1.5 text-12-r text-type-2">
            <Lock size={14} /> Secure checkout
          </span>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-4 py-10 md:px-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          {children}
        </motion.div>
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <OrderSummary>
            <Totals showShipping={step >= 1} />
          </OrderSummary>
        </aside>
      </div>
    </div>
  )
}
