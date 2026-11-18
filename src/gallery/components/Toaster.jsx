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
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`flex max-w-full items-center gap-3 rounded-full bg-type-0 py-2 pl-4 text-13-m text-white shadow-lg ${t.action ? 'pointer-events-auto pr-2' : 'pr-4'}`}
          >
            <span className="min-w-0 truncate">{t.message}</span>
            {t.action && (
              <button
                onClick={t.action.onClick}
                className="shrink-0 rounded-full px-2.5 py-1 text-13-sb text-white underline-offset-2 transition hover:bg-white/10 hover:underline"
              >
                {t.action.label}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
