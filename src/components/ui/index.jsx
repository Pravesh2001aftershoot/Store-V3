import { forwardRef, useState } from 'react'
import { cva } from 'class-variance-authority'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Plus, Minus } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'group relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full transition-all duration-300 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-[#2c2c2c] shadow-[0_1px_2px_rgba(0,0,0,.2),inset_0_1px_0_rgba(255,255,255,.08)]',
        outline: 'border border-input bg-surface-1 text-type-0 hover:bg-surface-2',
        secondary: 'bg-surface-2 text-type-0 hover:bg-[#ededed]',
        ghost: 'text-type-1 hover:bg-surface-2 hover:text-type-0',
        light: 'bg-white text-type-0 hover:bg-white/90',
        link: 'text-type-0 underline-offset-4 hover:underline px-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3.5 text-13-m',
        md: 'h-10 px-5 text-14-m',
        lg: 'h-12 px-6 text-16-m',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
)

export const Button = forwardRef(function Button({ className, variant, size, arrow, children, as: Comp = 'button', ...props }, ref) {
  return (
    <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
      {arrow && (
        <span className="relative -mr-1 inline-flex h-4 w-4 overflow-hidden">
          <ArrowRight weight="bold" className="absolute inset-0 transition-transform duration-300 group-hover:translate-x-full" />
          <ArrowRight weight="bold" className="absolute inset-0 -translate-x-full transition-transform duration-300 group-hover:translate-x-0" />
        </span>
      )}
    </Comp>
  )
})

export function Badge({ className, tone = 'default', children }) {
  const tones = {
    default: 'bg-surface-1/90 text-type-0 border border-border backdrop-blur',
    dark: 'bg-primary text-primary-foreground',
    success: 'bg-success-bg text-success',
    muted: 'bg-surface-2 text-type-1',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-11-m', tones[tone], className)}>
      {children}
    </span>
  )
}

export const Eyebrow = ({ children, className }) => (
  <p className={cn('flex items-center gap-2 text-12-sb uppercase text-type-2', className)}>
    {children}
  </p>
)

const ease = [0.22, 1, 0.36, 1]

export function Reveal({ children, delay = 0, y = 28, className, as = 'div', ...rest }) {
  const C = motion[as]
  return (
    <C
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.9, ease, delay }}
      className={className}
      {...rest}
    >
      {children}
    </C>
  )
}

/** Word-by-word masked reveal used for large headings. */
export function SplitText({ text, className, delay = 0, as = 'h1' }) {
  const C = motion[as]
  const words = text.split(' ')
  return (
    <C className={className} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ staggerChildren: 0.06, delayChildren: delay }}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            variants={{ hidden: { y: '110%' }, show: { y: 0, transition: { duration: 0.9, ease } } }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </C>
  )
}

export function AnimatedNumber({ value, format = (n) => n }) {
  return (
    <span className="relative inline-flex overflow-hidden tabular-nums">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.35, ease }}
          className="inline-block"
        >
          {format(value)}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function Accordion({ items, className, defaultOpen = -1 }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={cn('divide-y divide-border border-y border-border', className)}>
      {items.map((it, i) => (
        <div key={it.q}>
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            className="flex w-full items-center justify-between gap-4 py-5 text-left text-16-m text-type-0"
            aria-expanded={open === i}
          >
            {it.q}
            <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2">
              <motion.span animate={{ rotate: open === i ? 90 : 0, opacity: open === i ? 0 : 1 }} className="absolute">
                <Plus size={14} weight="bold" />
              </motion.span>
              <Minus size={14} weight="bold" className={cn('transition-opacity', open === i ? 'opacity-100' : 'opacity-0')} />
            </span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease }}
                className="overflow-hidden"
              >
                <div className="pb-5 pr-10 text-14-r-p text-type-2">{it.a}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

export function Field({ label, error, className, ...props }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-13-m text-type-1">{label}</span>
      <input
        {...props}
        className={cn(
          'h-11 w-full rounded-lg border border-input bg-surface-1 px-3.5 text-14-r text-type-0 outline-none transition placeholder:text-type-3 focus:border-type-0 focus:ring-4 focus:ring-black/5',
          error && 'border-destructive'
        )}
      />
      {error && <span className="mt-1 block text-12-r text-destructive">{error}</span>}
    </label>
  )
}
