import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useBreakpoint } from '../../lib/hooks'
import { profile } from '../../../portfolio/data/portfolio'
import { PANE_W, PEEK_H, SHEET_H } from '../editor/EditorPane'
import { defaultContent, defaultSocials, useFooterConfig } from './config'
import Footer from './Footer'
import FooterEditor from './FooterEditor'

const ease = [0.22, 1, 0.36, 1]

/**
 * The gallery footer plus its editor. Owns the footer settings and whether the editor is open.
 * While editing, a preview stage fills the space beside (tablet/desktop) or above (phone) the
 * editor and shows the footer at that width. It scrolls, since footers can be taller than the space.
 */
export default function FooterSection({ gallery, coverPhoto, photos, onGallery }) {
  const defaults = useMemo(() => defaultContent(gallery, profile), [gallery])
  const socialDefaults = useMemo(() => defaultSocials(profile), [])
  const footer = useFooterConfig(defaults, socialDefaults)
  const [editing, setEditing] = useState(false)
  const [peek, setPeek] = useState(false)
  const phone = useBreakpoint() === 'mobile'

  const { photoId } = footer.config.layout
  const photo = (photoId && photos.find((p) => p.id === photoId)) || coverPhoto

  // The page behind the stage shouldn't scroll while editing (the editor is non-modal).
  useEffect(() => {
    if (!editing) return
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = 'hidden'
    return () => { root.style.overflow = prev }
  }, [editing])

  const open = () => {
    setPeek(false)
    setEditing(true)
  }

  const inset = phone ? { left: 0, bottom: peek ? PEEK_H : SHEET_H } : { left: PANE_W + 16, bottom: 0 }

  return (
    <>
      <Footer gallery={gallery} config={footer.config} photo={photo} onGallery={onGallery} onEdit={editing ? undefined : open} />

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease }}
            className="fixed right-0 top-0 z-40 flex flex-col overflow-y-auto overscroll-contain bg-surface-2 transition-[left,bottom] duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={inset}
            // Display only: links and buttons in the preview don't navigate.
            onClickCapture={(e) => {
              if (e.target.closest('a, button')) { e.preventDefault(); e.stopPropagation() }
            }}
          >
            <p className="sticky top-0 z-10 self-start p-3 text-11-sb uppercase text-type-2">
              <span className="rounded-full bg-surface-1/90 px-2.5 py-1.5 shadow-sm backdrop-blur">Live preview</span>
            </p>
            {/* Footer sits at the bottom of the stage, the way it ends the page. */}
            <div className="mt-auto">
              <Footer gallery={gallery} config={footer.config} photo={photo} onGallery={onGallery} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FooterEditor
        open={editing}
        onClose={() => setEditing(false)}
        phone={phone}
        peek={peek}
        onPeek={setPeek}
        gallery={gallery}
        footer={footer}
        photo={photo}
        photos={photos}
      />
    </>
  )
}
