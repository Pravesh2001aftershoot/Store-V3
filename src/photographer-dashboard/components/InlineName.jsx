import { useRef, useState } from 'react'
import { PencilSimple } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'

/**
 * A name shown as text that turns into a field when clicked (a page title, a catalog name).
 * Enter or clicking away saves, Esc cancels, and an empty name keeps the old one.
 */
export function InlineName({ value, onSave, limit = 60, label, className }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const done = useRef(false)

  const start = () => { setDraft(value); done.current = false; setEditing(true) }
  const finish = (save) => {
    if (done.current) return
    done.current = true
    setEditing(false)
    const v = draft.trim()
    if (save && v && v !== value) onSave(v)
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        maxLength={limit}
        aria-label={label}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={() => finish(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') finish(true)
          if (e.key === 'Escape') finish(false)
        }}
        className={cn('-mx-2 w-full min-w-0 rounded-lg bg-surface-2 px-2 text-inherit outline-none ring-2 ring-type-0/10', className)}
      />
    )
  }
  return (
    <button onClick={start} title={`Rename — ${label}`} className={cn('group -mx-2 inline-flex max-w-full items-center gap-2 rounded-lg px-2 text-left transition hover:bg-surface-2', className)}>
      <span className="truncate">{value}</span>
      <PencilSimple size={16} className="shrink-0 text-type-3 opacity-0 transition group-hover:opacity-100 max-sm:opacity-100" />
    </button>
  )
}
