import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ImageBroken } from '@phosphor-icons/react'

const ease = [0.22, 1, 0.36, 1]
const HOLD_MS = 2500 // how long the shield stays after a screenshot key

/**
 * Settings → Screenshot protection. A browser can't block screenshots, so the gallery blurs itself
 * whenever one is likely: the Print Screen key, the macOS shortcuts (⌘⇧3/4/5), and while the window
 * is in the background (a snipping tool or screen recorder has focus). It also turns off the
 * right-click / long-press menu on photos ("Save image"). Rendered only while the setting is on.
 */
export default function ScreenshotGuard() {
  const [shield, setShield] = useState(false)

  useEffect(() => {
    let timer = 0
    const show = (ms) => {
      clearTimeout(timer)
      setShield(true)
      if (ms) timer = setTimeout(() => setShield(false), ms)
    }
    const onKey = (e) => {
      const mac = e.metaKey && e.shiftKey && ['3', '4', '5', '#', '$', '%'].includes(e.key)
      if (e.key === 'PrintScreen' || mac) {
        show(HOLD_MS)
        navigator.clipboard?.writeText('').catch(() => {}) // Windows puts the shot on the clipboard
      }
    }
    const onBlur = () => show(0)
    const onFocus = () => { clearTimeout(timer); timer = setTimeout(() => setShield(false), 250) }
    const onVisibility = () => (document.hidden ? onBlur() : onFocus())
    const noMenu = (e) => e.target instanceof HTMLImageElement && e.preventDefault()

    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey) // Print Screen only fires keyup on some systems
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('contextmenu', noMenu)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('contextmenu', noMenu)
    }
  }, [])

  return createPortal(
    <AnimatePresence>
      {shield && (
        <motion.div
          role="alert"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease }}
          className="fixed inset-0 z-[200] grid place-items-center bg-surface-0/60 px-6 text-center backdrop-blur-2xl"
        >
          <div className="flex max-w-[320px] flex-col items-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-1 text-type-0 shadow-[0_1px_2px_rgba(0,0,0,.08)]">
              <ImageBroken size={22} />
            </span>
            <p className="mt-4 text-16-sb text-type-0">Photos are protected</p>
            <p className="mt-1 text-13-r text-type-2">Screenshots are turned off in this gallery.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
