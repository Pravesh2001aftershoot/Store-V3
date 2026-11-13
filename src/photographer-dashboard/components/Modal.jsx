import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from '@phosphor-icons/react'
import { ease } from './ui'
import { usePhone } from '../lib/hooks'

/**
 * A focused dialog for short forms (new gallery, gallery settings, new catalog): a centred card,
 * or a sheet from the bottom on phones. `footer` holds the actions.
 */
export default function Modal({ open, onOpenChange, title, description, children, footer }) {
  const phone = usePhone()
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-[70] bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount {...(description ? {} : { 'aria-describedby': undefined })}>
              <motion.div
                initial={phone ? { y: '100%' } : { opacity: 0, y: 12, scale: 0.98 }}
                animate={phone ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
                exit={phone ? { y: '100%' } : { opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: phone ? 0.45 : 0.22, ease }}
                className={
                  phone
                    ? 'fixed inset-x-0 bottom-0 z-[71] flex max-h-[92svh] flex-col rounded-t-3xl bg-surface-1 pb-[env(safe-area-inset-bottom)] outline-none'
                    : 'fixed inset-0 z-[71] m-auto flex h-fit max-h-[86svh] w-[min(520px,calc(100vw-32px))] flex-col rounded-2xl bg-surface-1 shadow-[0_30px_80px_-20px_rgba(0,0,0,.4)] outline-none'
                }
              >
                <div className="flex items-start gap-3 px-5 pb-2 pt-5">
                  <div className="min-w-0 flex-1">
                    <Dialog.Title className="text-20-m text-type-0">{title}</Dialog.Title>
                    {description && <Dialog.Description className="mt-1 text-13-r-p text-type-2">{description}</Dialog.Description>}
                  </div>
                  <Dialog.Close className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-type-1 transition hover:bg-surface-2" aria-label="Close">
                    <X size={16} />
                  </Dialog.Close>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">{children}</div>
                {footer && <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">{footer}</div>}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
