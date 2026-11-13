import { useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { POSITIONS } from './config'

const ease = [0.22, 1, 0.36, 1]

/** A titled group of controls in the editor. */
export function Section({ title, hint, children, className }) {
  return (
    <section className={cn('space-y-3 border-b border-border py-5 first:pt-1 last:border-b-0', className)}>
      <div>
        <p className="text-11-sb uppercase text-type-2">{title}</p>
        {hint && <p className="mt-0.5 text-12-r text-type-3">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

export function Label({ children, aside }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <p className="text-13-m text-type-0">{children}</p>
      {aside && <span className="text-12-r tabular-nums text-type-2">{aside}</span>}
    </div>
  )
}

/** Pill segmented control. `options`: [{ id, label, icon?, hint? }]. */
export function Segmented({ label, options, value, onChange }) {
  const id = useId()
  const current = options.find((o) => o.id === value)
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div role="radiogroup" aria-label={label} className="grid gap-1 rounded-full bg-surface-2 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={value === o.id}
            aria-label={o.icon ? o.label : undefined}
            title={o.hint ?? o.label}
            onClick={() => onChange(o.id)}
            className={cn('relative flex h-8 min-w-0 items-center justify-center rounded-full px-1 text-12-m text-type-2 transition hover:text-type-0', value === o.id && 'text-type-0')}
          >
            {value === o.id && (
              <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-full bg-surface-1 shadow-[0_1px_2px_rgba(0,0,0,.08)]" transition={{ duration: 0.35, ease }} />
            )}
            <span className="relative truncate">{o.icon ? <o.icon size={16} /> : o.label}</span>
          </button>
        ))}
      </div>
      {current?.hint && <p className="mt-1.5 text-12-r text-type-3">{current.hint}</p>}
    </div>
  )
}

/** 3 × 3 grid on a mini cover: tap a cell to move the text block there. */
export function PositionGrid({ value, onChange, photo }) {
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-type-0">
      {photo && <img src={photo.thumb ?? photo.src} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" draggable={false} />}
      <div role="radiogroup" aria-label="Text position" className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1 p-1.5">
        {POSITIONS.map((p) => {
          const active = p === value
          const [v, h] = p.split('-')
          return (
            <button
              key={p}
              role="radio"
              aria-checked={active}
              aria-label={`${v} ${h}`}
              onClick={() => onChange(p)}
              className={cn(
                'group relative flex rounded-md p-1.5 transition',
                { top: 'items-start', middle: 'items-center', bottom: 'items-end' }[v],
                { left: 'justify-start', center: 'justify-center', right: 'justify-end' }[h],
                active ? 'bg-white/20 ring-1 ring-white' : 'hover:bg-white/10'
              )}
            >
              <span className={cn('flex flex-col gap-1', { left: 'items-start', center: 'items-center', right: 'items-end' }[h])}>
                <span className={cn('h-1.5 rounded-full transition', active ? 'w-8 bg-white' : 'w-6 bg-white/40 group-hover:bg-white/70')} />
                <span className={cn('h-1 rounded-full transition', active ? 'w-5 bg-white/80' : 'w-4 bg-white/30 group-hover:bg-white/50')} />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function Slider({ label, value, onChange, min, max, step = 1, format = (v) => v }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-center justify-between gap-3">
        <span className="text-13-m text-type-0">{label}</span>
        <span className="text-12-r tabular-nums text-type-2">{format(value)}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="range w-full"
        style={{ '--p': `${((value - min) / (max - min)) * 100}%` }}
      />
    </div>
  )
}

export function Switch({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-10 shrink-0 rounded-full transition-colors', checked ? 'bg-type-0' : 'bg-[#dcdcdf]')}
    >
      <motion.span
        className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.2)]"
        animate={{ x: checked ? 16 : 0 }}
        transition={{ duration: 0.25, ease }}
      />
    </button>
  )
}

/**
 * Text input with a live character count. The limit is enforced (typing and pasting stop at it);
 * the counter turns amber in the last 10% and the field shows a note when a required value is empty.
 */
export function TextField({ label, hint, value, onChange, limit, multiline, required, enabled = true, onToggle, placeholder }) {
  const id = useId()
  const n = value.length
  const near = n >= limit * 0.9
  const empty = required && !value.trim()
  const Input = multiline ? 'textarea' : 'input'
  return (
    <div className={cn('transition-opacity', !enabled && 'opacity-60')}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-13-m text-type-0">{label}</label>
        {onToggle && <Switch checked={enabled} onChange={onToggle} label={`Show ${label.toLowerCase()}`} />}
      </div>
      <div
        className={cn(
          'rounded-lg border bg-surface-1 transition focus-within:border-type-0 focus-within:ring-4 focus-within:ring-black/5',
          empty ? 'border-destructive' : 'border-input'
        )}
      >
        <Input
          id={id}
          value={value}
          maxLength={limit}
          disabled={!enabled}
          placeholder={placeholder}
          rows={multiline ? 2 : undefined}
          onChange={(e) => onChange(e.target.value.slice(0, limit))}
          className={cn(
            'block w-full resize-none bg-transparent px-3 text-14-r text-type-0 outline-none placeholder:text-type-3 disabled:cursor-not-allowed',
            multiline ? 'pt-2.5' : 'h-10'
          )}
        />
        <div className={cn('flex items-center justify-between gap-2 px-3 pb-1.5 text-11-r', multiline ? 'pt-1' : '-mt-1')}>
          <span className={cn('truncate', empty ? 'text-destructive' : 'text-type-3')}>{empty ? 'Required — the client’s name is shown instead' : hint}</span>
          <span className={cn('shrink-0 tabular-nums', n >= limit ? 'text-destructive' : near ? 'text-amber-600' : 'text-type-3')} aria-live="polite">
            {n}/{limit}
          </span>
        </div>
      </div>
    </div>
  )
}
