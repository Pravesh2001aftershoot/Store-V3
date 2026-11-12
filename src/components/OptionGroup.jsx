import { money, cn } from '../lib/utils'

/** One product option (size / swatch / segmented / card). `compact` fits narrow side panels. */
export default function OptionGroup({ option, value, onChange, compact = false }) {
  const current = option.values.find((v) => v.id === value)
  return (
    <div>
      <div className={cn('flex items-baseline justify-between', compact ? 'mb-2' : 'mb-2.5')}>
        <p className="text-13-m text-type-0">
          {option.label}
          {option.type === 'swatch' && <span className="ml-2 font-normal text-type-2">{current?.label}</span>}
        </p>
        {current?.delta > 0 && <span className="text-12-r text-type-2">+{money(current.delta)}</span>}
      </div>

      {option.type === 'swatch' && (
        <div className={cn('flex flex-wrap', compact ? 'gap-2' : 'gap-2.5')}>
          {option.values.map((v) => (
            <button
              key={v.id}
              onClick={() => onChange(v.id)}
              title={v.label}
              className={cn(
                'relative grid place-items-center rounded-full transition',
                compact ? 'h-8 w-8' : 'h-10 w-10',
                value === v.id ? 'ring-2 ring-type-0 ring-offset-2' : 'ring-1 ring-border hover:ring-type-3'
              )}
            >
              <span className={cn('rounded-full ring-1 ring-inset ring-black/10', compact ? 'h-6 w-6' : 'h-8 w-8')} style={{ background: v.hex }} />
            </button>
          ))}
        </div>
      )}

      {(option.type === 'size' || option.type === 'segmented') && (
        <div className={cn('grid gap-2', option.type === 'size' ? (compact ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-4') : 'grid-cols-2')}>
          {option.values.map((v) => (
            <button
              key={v.id}
              onClick={() => onChange(v.id)}
              className={cn(
                'relative rounded-xl border text-left transition',
                compact ? 'px-2.5 py-2' : 'px-3 py-2.5',
                value === v.id ? 'border-type-0 bg-surface-1 shadow-[0_0_0_1px_var(--type-0)]' : 'border-border bg-surface-1 hover:border-type-3'
              )}
            >
              <span className={cn('block text-type-0', compact ? 'text-13-m' : 'text-14-m')}>{v.label}</span>
              {option.type === 'size' && <span className="block text-12-r text-type-2">{money(v.price)}</span>}
            </button>
          ))}
        </div>
      )}

      {option.type === 'card' && (
        <div className={cn('grid gap-2', !compact && 'sm:grid-cols-2')}>
          {option.values.map((v) => (
            <button
              key={v.id}
              onClick={() => onChange(v.id)}
              className={cn(
                'flex items-start justify-between gap-2 rounded-xl border bg-surface-1 text-left transition',
                compact ? 'px-3 py-2.5' : 'px-3.5 py-3',
                value === v.id ? 'border-type-0 shadow-[0_0_0_1px_var(--type-0)]' : 'border-border hover:border-type-3'
              )}
            >
              <span>
                <span className={cn('block', compact ? 'text-13-m' : 'text-14-m')}>{v.label}</span>
                <span className="block text-12-r text-type-2">{v.note}</span>
              </span>
              <span className="text-12-r text-type-2">{v.delta ? `+${money(v.delta)}` : 'Incl.'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
