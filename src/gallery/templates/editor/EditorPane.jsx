import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowCounterClockwise, CaretDown, CaretUp, Check, X } from '@phosphor-icons/react'
import { Button } from '../../../components/ui'
import { cn } from '../../../lib/utils'

const ease = [0.22, 1, 0.36, 1]

/** Pane width on tablet/desktop. Sections use it to shift their live preview clear of the pane. */
export const PANE_W = 400
/** Phone: open sheet height, and the collapsed bar height when previewing. */
export const SHEET_H = '58svh'
export const PEEK_H = 64

/**
 * The shell shared by the gallery's editors (cover, footer, headings) and the photographer dashboard.
 * Opens from the left on tablet/desktop and as a bottom sheet on phones that can collapse to a bar
 * to see the whole preview. There's no dimming backdrop: whatever sits beside/above it is the live preview.
 *
 * `modal={false}` drops the click-blocking overlay and scroll lock, for previews that need scrolling.
 * `inline` renders the same pane in place (filling its parent) instead of as a floating panel — the
 * dashboard uses it to dock editors beside its preview. ✕ / Esc / Done still call `onClose`.
 * `resetLabel` renames the footer's reset action (e.g. "Reset product").
 */
export default function EditorPane({
  open, onClose, phone, peek, onPeek, title, subtitle, previewLabel = 'Preview',
  tabs, tab, onTab, onReset, resetLabel = 'Reset all', modal = true, inline = false, children,
}) {
  const body = (
    <>
      <Header phone={phone && !inline} peek={peek} onPeek={onPeek} title={title} subtitle={subtitle} previewLabel={previewLabel} tabs={tabs} tab={tab} onTab={onTab} />
      <div className={cn('min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5', phone && !inline && peek && 'invisible')}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease }}
            className="pb-6 pt-4"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
      {!(phone && !inline && peek) && (
        <div className="flex items-center gap-2 border-t border-border px-5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
          {onReset && (
            <Button variant="ghost" size="sm" onClick={onReset} className="-ml-2 max-sm:ml-0 max-sm:h-10 max-sm:flex-1">
              <ArrowCounterClockwise size={14} /> {resetLabel}
            </Button>
          )}
          <span className="flex-1 max-sm:hidden" />
          {/* Phones: Reset and Done share the row equally. */}
          <Button size="md" onClick={onClose} className="max-sm:flex-1">
            <Check size={15} weight="bold" /> Done
          </Button>
        </div>
      )}
    </>
  )

  if (inline) {
    if (!open) return null
    return (
      <Dialog.Root open modal={false} onOpenChange={(o) => !o && onClose()}>
        <Dialog.Content
          aria-describedby={undefined}
          onInteractOutside={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="flex h-full min-h-0 flex-col bg-surface-1 outline-none"
        >
          {body}
        </Dialog.Content>
      </Dialog.Root>
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()} modal={modal}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Transparent: blocks clicks on the preview without hiding it. */}
            {modal && <Dialog.Overlay className="fixed inset-0 z-50" />}
            <Dialog.Content
              asChild
              aria-describedby={undefined}
              // Taps on the preview shouldn't throw away the panel; Done / Esc / ✕ close it.
              onInteractOutside={(e) => e.preventDefault()}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <motion.div
                initial={phone ? { y: '100%' } : { x: '-100%' }}
                animate={phone ? { y: 0 } : { x: 0 }}
                exit={phone ? { y: '100%' } : { x: '-110%' }}
                transition={{ duration: 0.55, ease }}
                className={cn(
                  'fixed z-50 flex flex-col bg-surface-1 shadow-2xl outline-none',
                  phone
                    ? 'inset-x-0 bottom-0 rounded-t-2xl transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]'
                    : 'inset-y-2 left-2 rounded-2xl'
                )}
                style={phone ? { height: peek ? PEEK_H : SHEET_H } : { width: PANE_W }}
              >
                {body}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

function Header({ phone, peek, onPeek, title, subtitle, previewLabel, tabs, tab, onTab }) {
  return (
    <div className={cn('shrink-0 px-5', !(phone && peek) && 'border-b border-border pb-3')}>
      {phone && (
        <button onClick={() => onPeek(!peek)} className="flex w-full justify-center pb-1 pt-2.5" aria-label={peek ? 'Show settings' : previewLabel}>
          <span className="h-1 w-10 rounded-full bg-border" />
        </button>
      )}
      <div className={cn('flex items-center gap-2', phone ? 'pt-0.5' : 'pt-4')}>
        <div className="min-w-0 flex-1">
          <Dialog.Title className="truncate text-16-sb">{title}</Dialog.Title>
          {subtitle && <p className="truncate text-12-r text-type-2">{subtitle}</p>}
        </div>
        {phone && (
          <button
            onClick={() => onPeek(!peek)}
            className="flex h-9 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-12-m transition hover:bg-[#ececec]"
          >
            {peek ? <><CaretUp size={14} /> Edit</> : <><CaretDown size={14} /> Preview</>}
          </button>
        )}
        <Dialog.Close className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 transition hover:bg-[#ececec]" aria-label="Close">
          <X size={16} />
        </Dialog.Close>
      </div>
      {!(phone && peek) && tabs.length > 1 && (
        <div role="tablist" className="mt-3 grid gap-1 rounded-full bg-surface-2 p-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => onTab(t.id)}
              className={cn('relative h-8 rounded-full text-13-m text-type-2 transition hover:text-type-0', tab === t.id && 'text-type-0')}
            >
              {tab === t.id && <motion.span layoutId={`editor-tab-${title}`} className="absolute inset-0 rounded-full bg-surface-1 shadow-[0_1px_2px_rgba(0,0,0,.08)]" transition={{ duration: 0.35, ease }} />}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
