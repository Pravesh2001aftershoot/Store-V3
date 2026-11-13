import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { CaretDown, Check } from '@phosphor-icons/react'
import { BottomSheet } from '../../components/ui/Select'
import { usePhone } from '../lib/hooks'

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
      {/* Phones: actions fill the row and share it equally. */}
      {actions && <div className="flex shrink-0 items-center gap-2 max-sm:w-full max-sm:[&>*]:h-10 max-sm:[&>*]:flex-1 sm:flex-wrap">{actions}</div>}
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
      {action && <div className="mt-5 max-sm:w-full max-sm:[&>*]:h-10 max-sm:[&>*]:w-full">{action}</div>}
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
  const phone = usePhone()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open || phone) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open, phone])

  // Phones: the options open as a bottom sheet titled with the menu's label.
  if (phone) {
    return (
      <div className="relative">
        {trigger({ open, toggle: () => setOpen((o) => !o) })}
        <BottomSheet open={open} onClose={() => setOpen(false)} title={label}>
          <div role="menu" aria-label={label}>
            {items.map((it, i) =>
              it === null ? (
                <div key={`d${i}`} className="my-1 h-px bg-border" />
              ) : (
                <SheetItem key={it.label} role="menuitem" icon={it.icon} danger={it.danger} disabled={it.disabled} onClick={() => { setOpen(false); it.onClick() }}>
                  {it.label}
                </SheetItem>
              )
            )}
          </div>
        </BottomSheet>
      </div>
    )
  }

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

/**
 * A select styled like the dashboard's fields: native on tablet and desktop, a bottom sheet of
 * options on phones (never the OS picker). options: [{ value, label, disabled }].
 */
export function Select({ value, onChange, options, label, className }) {
  const phone = usePhone()
  const [open, setOpen] = useState(false)
  const field = 'h-9 w-full min-w-0 truncate rounded-lg border border-input bg-surface-0 pl-3 pr-8 text-13-r text-type-0 outline-none transition hover:border-type-3 focus-visible:border-type-0'
  const current = options.find((o) => o.value === value)
  return (
    <span className={cn('relative inline-flex', className)}>
      {phone ? (
        <>
          <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-label={label} className={cn(field, 'text-left')}>
            {current?.label}
          </button>
          <BottomSheet open={open} onClose={() => setOpen(false)} title={label}>
            <ul role="listbox" aria-label={label}>
              {options.map((o) => (
                <li key={o.value}>
                  <SheetItem
                    role="option"
                    selected={o.value === value}
                    disabled={o.disabled}
                    onClick={() => { onChange(o.value); setOpen(false) }}
                  >
                    {o.label}
                  </SheetItem>
                </li>
              ))}
            </ul>
          </BottomSheet>
        </>
      ) : (
        <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className={cn(field, 'appearance-none')}>
          {options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
        </select>
      )}
      <CaretDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-type-2" />
    </span>
  )
}

/** One 48px row in a phone bottom sheet (Select options, Menu items). */
function SheetItem({ icon: Icon, selected, danger, disabled, onClick, role, children }) {
  return (
    <button
      type="button"
      role={role}
      aria-selected={role === 'option' ? selected : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-16-r transition hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40',
        danger ? 'text-destructive' : selected ? 'text-type-0' : 'text-type-1'
      )}
    >
      {Icon && <Icon size={20} className="shrink-0" />}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {selected && <Check size={18} className="shrink-0" />}
    </button>
  )
}
