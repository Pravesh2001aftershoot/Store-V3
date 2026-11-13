import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DownloadSimple, Heart, ShareNetwork, StackPlus, X } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { MAX_SETS } from '../lib/actions'
import { useBreakpoint } from '../lib/hooks'
import { BottomSheet } from '../../components/ui'

const ease = [0.22, 1, 0.36, 1]

function Action({ icon: Icon, label, onClick, disabled, active, hint }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={hint ?? label}
      aria-label={label}
      className={cn(
        'flex h-10 shrink-0 items-center gap-2 rounded-full px-2.5 text-13-m text-white/85 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-35 md:px-3',
        active && 'text-white'
      )}
    >
      <Icon size={18} weight={active ? 'fill' : 'regular'} className={active ? 'text-destructive' : undefined} />
      <span className="hidden md:inline">{label}</span>
    </button>
  )
}

/** The new set's name field + buttons. Enter creates it; an empty name falls back to the default. */
function NameForm({ defaultName, count, onCreate, onCancel, sheet }) {
  const [name, setName] = useState(defaultName)
  const input = useRef(null)
  useEffect(() => { input.current?.select() }, [])
  const submit = (e) => {
    e.preventDefault()
    onCreate(name.trim() || defaultName)
  }
  return (
    <form onSubmit={submit}>
      {!sheet && <p className="text-14-sb text-type-0">New set</p>}
      <p className={cn('text-type-2', sheet ? 'text-14-r' : 'mt-0.5 text-12-r')}>
        {count} photo{count === 1 ? '' : 's'} · you can keep up to {MAX_SETS} sets
      </p>
      <input
        ref={input}
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
        aria-label="Set name"
        placeholder={defaultName}
        enterKeyHint="done"
        // 16px on phones so iOS doesn't zoom the page when the field takes focus.
        className={cn(
          'mt-3 w-full rounded-lg border border-input bg-surface-1 px-3 text-type-0 outline-none transition focus:border-type-0',
          sheet ? 'h-12 text-16-r' : 'h-10 text-14-r'
        )}
      />
      <div className={cn('flex gap-2', sheet ? 'mt-4 flex-col' : 'mt-3 justify-end')}>
        {/* The sheet closes from its X, the backdrop or a drag down, so it only needs the primary action. */}
        {!sheet && (
          <button type="button" onClick={onCancel} className="h-9 rounded-full px-4 text-13-m text-type-1 transition hover:bg-surface-2 hover:text-type-0">
            Cancel
          </button>
        )}
        <button
          type="submit"
          className={cn('rounded-full bg-primary text-primary-foreground transition hover:bg-[#2c2c2c]', sheet ? 'h-12 text-16-m' : 'h-9 px-4 text-13-m')}
        >
          Create set
        </button>
      </div>
    </form>
  )
}

/** Desktop / tablet: the name form floats just above the bar. */
function NamePanel(props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.2, ease }}
      className="pointer-events-auto mb-2 w-full max-w-[360px] rounded-2xl border border-border bg-surface-1 p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,.35)]"
    >
      <NameForm {...props} />
    </motion.div>
  )
}

/**
 * Floating bar shown while multi-selecting photos: the count, select all / none, and the bulk actions.
 * Esc closes the naming panel if it's open, otherwise leaves selection; ⌘/Ctrl+A selects everything in view.
 */
export default function SelectionBar({ open, count, total, allFavorite, setCount, onSelectAll, onSelectNone, onShare, onFavorite, onDownload, onCreateSet, onSetLimit, onExit }) {
  const [naming, setNaming] = useState(false)
  const none = count === 0
  const atLimit = setCount >= MAX_SETS
  const isPhone = useBreakpoint() === 'mobile'
  const closeNaming = useCallback(() => setNaming(false), [])
  const nameProps = {
    defaultName: `Set ${setCount + 1}`,
    count,
    onCancel: closeNaming,
    onCreate: (name) => { setNaming(false); onCreateSet(name) },
  }

  useEffect(() => { if (!open || none) setNaming(false) }, [open, none])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        naming ? setNaming(false) : onExit()
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a' && !naming && !/INPUT|TEXTAREA/.test(e.target.tagName)) {
        e.preventDefault()
        onSelectAll()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, naming, onExit, onSelectAll])

  const newSet = () => (atLimit ? onSetLimit() : setNaming(true))

  return (
    <>
    {isPhone && (
      <BottomSheet open={open && naming} onClose={closeNaming} title="New set">
        <NameForm {...nameProps} sheet />
      </BottomSheet>
    )}
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease }}
          className="pointer-events-none fixed inset-x-0 bottom-[calc(16px+env(safe-area-inset-bottom))] z-50 flex flex-col items-center px-4"
        >
          {/* Phones get the name form as a bottom sheet instead (below). */}
          <AnimatePresence>{naming && !isPhone && <NamePanel {...nameProps} />}</AnimatePresence>

          <div
            role="toolbar"
            aria-label="Selected photos"
            className="pointer-events-auto flex max-w-full items-center gap-0.5 rounded-full bg-type-0 p-1 text-white shadow-[0_20px_50px_-15px_rgba(0,0,0,.5)] md:gap-1"
          >
            <button onClick={onExit} aria-label="Cancel selection" title="Cancel (Esc)" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white">
              <X size={18} />
            </button>
            <div className="flex min-w-0 flex-col pl-1 pr-2 leading-tight md:flex-row md:items-baseline md:gap-3 md:pr-3">
              <span aria-live="polite" className="whitespace-nowrap text-14-m tabular-nums">
                {count} selected
              </span>
              <button
                onClick={count === total ? onSelectNone : onSelectAll}
                className="whitespace-nowrap text-left text-12-r text-white/60 underline-offset-2 transition hover:text-white hover:underline"
              >
                {count === total ? 'Select none' : `Select all ${total}`}
              </button>
            </div>
            <span className="mx-0.5 h-6 w-px shrink-0 bg-white/15" />
            <Action icon={ShareNetwork} label="Share" onClick={onShare} disabled={none} />
            <Action
              icon={Heart}
              label={allFavorite && !none ? 'Unfavourite' : 'Favourite'}
              hint={allFavorite && !none ? 'Remove from favourites' : 'Add to favourites'}
              onClick={onFavorite}
              disabled={none}
              active={allFavorite && !none}
            />
            <Action icon={DownloadSimple} label="Download" onClick={onDownload} disabled={none} />
            <Action
              icon={StackPlus}
              label={`New set ${setCount}/${MAX_SETS}`}
              hint={atLimit ? `You already have ${MAX_SETS} sets — delete one to make another` : 'Create a new set from the selection'}
              onClick={newSet}
              disabled={none}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}
