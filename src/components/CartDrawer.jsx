import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { X, Handbag, Trash, Tag, PencilSimple, Copy } from '@phosphor-icons/react'
import { useStore } from '../state/store'
import { lineSubtotal, lineCompareAt } from '../lib/pricing'
import { money } from '../lib/utils'
import { Button } from './ui'
import { LineThumb, lineParts, lineTitle, PartSummary } from './CartBits'

const ease = [0.22, 1, 0.36, 1]

export default function CartDrawer() {
  const { drawer, setDrawer, lines, totals, dispatch } = useStore()
  const nav = useNavigate()
  const go = (to) => {
    setDrawer(false)
    nav(to)
  }

  return (
    <Dialog.Root open={drawer} onOpenChange={setDrawer}>
      <AnimatePresence>
        {drawer && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild aria-describedby={undefined}>
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.55, ease }}
                className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col bg-surface-1 shadow-2xl sm:inset-y-2 sm:right-2 sm:rounded-2xl"
              >
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <Dialog.Title className="text-16-sb">
                    Your cart <span className="text-type-3">({totals.itemCount})</span>
                  </Dialog.Title>
                  <Dialog.Close className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 transition hover:bg-[#ececec]">
                    <X size={16} />
                  </Dialog.Close>
                </div>

                {lines.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-surface-2">
                      <Handbag size={22} />
                    </div>
                    <p className="text-14-m">Your cart is empty</p>
                    <p className="text-14-r text-type-2">Turn your favourite photos into something you can hold.</p>
                    <Button className="mt-2" onClick={() => go('/shop')} arrow>
                      Start shopping
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 space-y-1 overflow-y-auto p-3">
                      <AnimatePresence initial={false}>
                        {lines.map((line) => (
                          <motion.div
                            key={line.id}
                            layout
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 40 }}
                            transition={{ duration: 0.4, ease }}
                            className="flex gap-3 rounded-xl p-2 transition hover:bg-surface-2"
                          >
                            <LineThumb line={line} className="w-20 shrink-0 overflow-hidden rounded-lg" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-14-sb">{lineTitle(line)}</p>
                                <div className="text-right">
                                  <p className="text-14-m">{money(lineSubtotal(line))}</p>
                                  {lineCompareAt(line) && <p className="text-12-r text-type-3 line-through">{money(lineCompareAt(line))}</p>}
                                </div>
                              </div>
                              <div className="mt-1 space-y-0.5 text-12-r text-type-2">
                                {lineParts(line).map((p, i) => (
                                  <p key={i}>
                                    <PartSummary part={p} />
                                  </p>
                                ))}
                              </div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <button
                                  onClick={() => go(`/build/edit/${line.id}`)}
                                  className="inline-flex items-center gap-1 text-12-r text-type-3 transition hover:text-type-1"
                                >
                                  <PencilSimple size={12} /> Edit
                                </button>
                                <button
                                  onClick={() => dispatch({ type: 'duplicate', id: line.id })}
                                  className="inline-flex items-center gap-1 text-12-r text-type-3 transition hover:text-type-1"
                                >
                                  <Copy size={12} /> Duplicate
                                </button>
                                <button
                                  onClick={() => dispatch({ type: 'remove', id: line.id })}
                                  className="inline-flex items-center gap-1 text-12-r text-type-3 transition hover:text-destructive"
                                >
                                  <Trash size={12} /> Remove
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    <div className="space-y-3 border-t border-border p-5">
                      {totals.savings > 0 && (
                        <div className="flex items-center justify-between rounded-lg bg-success-bg px-3 py-2 text-13-r text-success">
                          <span className="flex items-center gap-1.5">
                            <Tag size={14} /> Package savings
                          </span>
                          <span className="font-medium">−{money(totals.savings)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-16-r">
                        <span className="text-type-1">Subtotal</span>
                        <span className="text-20-m">{money(totals.subtotal)}</span>
                      </div>
                      <p className="text-12-r text-type-3">Shipping and taxes calculated at checkout.</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button variant="outline" size="lg" onClick={() => go('/shop')}>
                          Continue shopping
                        </Button>
                        <Button size="lg" onClick={() => go('/checkout')} arrow className="max-sm:order-first">
                          Checkout
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
