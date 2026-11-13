import { motion, AnimatePresence } from 'framer-motion'
import { useToasts } from '../lib/actions'

/** `raised` lifts the toasts above the selection bar while it's showing. */
export default function Toaster({ raised = false }) {
  const toasts = useToasts()
  return (
    <div aria-live="polite" className={`pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 transition-[bottom] duration-300 ${raised ? 'bottom-24' : 'bottom-6'}`}>
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="rounded-full bg-type-0 px-4 py-2 text-13-m text-white shadow-lg"
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
