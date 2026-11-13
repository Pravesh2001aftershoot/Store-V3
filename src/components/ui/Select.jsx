import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CaretDown, Check, X } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'

const ease = [0.22, 1, 0.36, 1]
const PHONE = '(max-width: 767px)'

function useIsPhone() {
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia(PHONE).matches)
  useEffect(() => {
    const mq = window.matchMedia(PHONE)
    const on = () => setPhone(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return phone
}

/** Slides up from the bottom. Drag down, tap the backdrop or press Esc to close. */
export function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const esc = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', esc)
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => (info.offset.y > 80 || info.velocity.y > 500) && onClose()}
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-surface-1 px-4 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-[0_-20px_50px_-20px_rgba(0,0,0,.25)]"
          >
            <div className="flex justify-center pb-2 pt-3">
              <span className="h-1 w-10 rounded-full bg-border" />
            </div>
            {title && (
              <div className="mb-3 flex items-center justify-between">
                <p className="text-16-sb text-type-0">{title}</p>
                <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-type-2 hover:bg-surface-2">
                  <X size={16} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

/**
 * Dropdown: native <select> on tablet/desktop, a bottom sheet of options on phones.
 * options: [{ value, label }] · triggerClassName restyles the trigger (both the button and the native select).
 */
export function Select({ value, onChange, options, title, className, triggerClassName }) {
  const isPhone = useIsPhone()
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value)
  const trigger = 'h-10 w-full rounded-full border border-border bg-surface-1 pl-4 pr-10 text-14-r outline-none md:w-auto'

  return (
    <div className={cn('relative flex w-full items-center md:inline-flex md:w-auto', className)}>
      {isPhone ? (
        <>
          <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} className={cn(trigger, 'text-left text-type-0', triggerClassName)}>
            {current?.label}
          </button>
          <BottomSheet open={open} onClose={() => setOpen(false)} title={title}>
            <ul role="listbox" aria-label={title}>
              {options.map((o) => {
                const selected = o.value === value
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => { onChange(o.value); setOpen(false) }}
                      className={cn(
                        'flex h-12 w-full items-center justify-between rounded-lg px-3 text-left text-16-r transition hover:bg-surface-2',
                        selected ? 'text-type-0' : 'text-type-1'
                      )}
                    >
                      {o.label}
                      {selected && <Check size={18} />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </BottomSheet>
        </>
      ) : (
        <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={title} className={cn(trigger, 'appearance-none', triggerClassName)}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
      <CaretDown size={14} className="pointer-events-none absolute right-4" />
    </div>
  )
}
