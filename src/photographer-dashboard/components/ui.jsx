import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { CaretDown } from '@phosphor-icons/react'

// Small building blocks used across the dashboard tabs. Everything is built from the app's tokens
// (surface-*, type-*, border, type tokens) and the gallery's editor controls, so the dashboard reads
// as the same product as the client gallery.

export const ease = [0.22, 1, 0.36, 1]

/** Page title block: optional eyebrow, title, description and actions on the right. */
export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-12-sb uppercase text-type-3">{eyebrow}</p>}
        <h1 className="mt-1 truncate text-30-m text-type-0 max-sm:text-24-m">{title}</h1>
        {description && <p className="mt-1.5 max-w-[620px] text-14-r-p text-type-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** A quiet number + label, for summary strips. */
export function Stat({ label, value, hint }) {
  return (
    <div className="min-w-0">
      <p className="text-11-sb uppercase text-type-3">{label}</p>
      <p className="mt-1 truncate text-20-m tabular-nums text-type-0">{value}</p>
      {hint && <p className="mt-0.5 truncate text-12-r text-type-2">{hint}</p>}
    </div>
  )
}

/** Pill chip used for filters. `count` shows after the label. */
export function Chip({ active, count, children, className, ...props }) {
  return (
    <button
      {...props}
      className={cn(
        'flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-13-m transition',
        active ? 'bg-primary text-primary-foreground' : 'bg-surface-2 text-type-1 hover:bg-[#ececec] hover:text-type-0',
        className
      )}
    >
      {children}
      {count != null && <span className={cn('tabular-nums', active ? 'text-primary-foreground/60' : 'text-type-3')}>{count}</span>}
    </button>
  )
}

/** Small tag inside rows: Hidden, Edited, Uploaded… */
export function Tag({ tone = 'muted', children, className }) {
  const tones = {
    muted: 'bg-surface-2 text-type-2',
    dark: 'bg-primary text-primary-foreground',
    success: 'bg-success-bg text-success',
    warn: 'bg-amber-50 text-amber-700',
  }
  return <span className={cn('inline-flex h-5 shrink-0 items-center rounded-full px-2 text-11-m', tones[tone], className)}>{children}</span>
}

/** Dashed empty state. */
export function Empty({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      {Icon && (
        <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-type-1">
          <Icon size={22} />
        </span>
      )}
      <p className="mt-4 text-16-m text-type-0">{title}</p>
      {children && <p className="mt-1 max-w-[380px] text-14-r-p text-type-2">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Round icon button (40px, or 32px with `small`). */
export function IconButton({ label, small, className, children, ...props }) {
  return (
    <button
      aria-label={label}
      title={label}
      {...props}
      className={cn(
        'grid shrink-0 place-items-center rounded-full text-type-1 transition hover:bg-surface-2 hover:text-type-0 disabled:pointer-events-none disabled:opacity-40',
        small ? 'h-8 w-8' : 'h-10 w-10',
        className
      )}
    >
      {children}
    </button>
  )
}

/**
 * A small popover menu anchored to its trigger. `items`: [{ label, icon, onClick, danger, disabled }]
 * or null for a divider. Closes on outside click and Esc.
 */
export function Menu({ trigger, items, align = 'right', side = 'bottom', label }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])
  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label={label}
            initial={{ opacity: 0, y: side === 'top' ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === 'top' ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease }}
            className={cn(
              'absolute z-50 max-h-[320px] min-w-[200px] overflow-y-auto rounded-xl border border-border bg-surface-1 p-1 text-type-0 shadow-[0_20px_50px_-20px_rgba(0,0,0,.3)]',
              side === 'top' ? 'bottom-full mb-2' : 'top-full mt-1.5',
              align === 'right' ? 'right-0' : 'left-0'
            )}
          >
            {items.map((it, i) =>
              it === null ? (
                <div key={`d${i}`} className="my-1 h-px bg-border" />
              ) : (
                <button
                  key={it.label}
                  role="menuitem"
                  disabled={it.disabled}
                  onClick={() => { setOpen(false); it.onClick() }}
                  className={cn(
                    'flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-13-r transition hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40',
                    it.danger ? 'text-destructive' : 'text-type-0'
                  )}
                >
                  {it.icon && <it.icon size={16} className="shrink-0" />}
                  <span className="truncate">{it.label}</span>
                </button>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Money input: a $ prefix, whole or cents. Empty clears the override (`onChange(null)`). */
export function PriceInput({ value, onChange, original, label, prefix = '$', className }) {
  const [text, setText] = useState(String(value))
  useEffect(() => { setText(String(value)) }, [value])
  const changed = original != null && value !== original
  return (
    <label className={cn('relative flex h-9 w-[104px] shrink-0 items-center rounded-lg border bg-surface-1 transition focus-within:border-type-0 focus-within:ring-4 focus-within:ring-black/5', changed ? 'border-type-2' : 'border-input', className)}>
      <span className="pl-2.5 text-13-r text-type-3">{prefix}</span>
      <input
        inputMode="decimal"
        aria-label={label}
        value={text}
        onChange={(e) => {
          const t = e.target.value.replace(/[^\d.]/g, '').slice(0, 7)
          setText(t)
          if (t === '') return
          const n = Math.round(parseFloat(t) * 100) / 100
          if (Number.isFinite(n)) onChange(n)
        }}
        onBlur={() => { if (text === '') onChange(null) }}
        className="h-full w-full min-w-0 bg-transparent pl-1 pr-2.5 text-14-r tabular-nums text-type-0 outline-none"
      />
    </label>
  )
}

/** A native select styled like the dashboard's fields (native, so phones get their own picker). */
export function Select({ value, onChange, options, label, className }) {
  return (
    <span className={cn('relative inline-flex', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-9 w-full min-w-0 appearance-none truncate rounded-lg border border-input bg-surface-0 pl-3 pr-8 text-13-r text-type-0 outline-none transition hover:border-type-3 focus-visible:border-type-0"
      >
        {options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
      </select>
      <CaretDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-type-2" />
    </span>
  )
}
