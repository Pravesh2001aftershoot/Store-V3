import { useMemo, useState } from 'react'
import { useBreakpoint } from '../lib/hooks'
import { defaultContent, useCoverConfig } from './config'
import Cover from './Cover'
import CoverEditor, { PANE_W, PEEK_H, SHEET_H } from './CoverEditor'

/**
 * The gallery cover plus its editor. Owns the cover settings and whether the editor is open.
 * While editing, the cover's frame shrinks to the space beside (tablet/desktop) or above (phone)
 * the editor, so what you see is the cover at that size, live.
 */
export default function CoverSection({ gallery, photo, total, onEnter }) {
  const defaults = useMemo(() => defaultContent(gallery, total), [gallery, total])
  const cover = useCoverConfig(defaults)
  const [editing, setEditing] = useState(false)
  const [peek, setPeek] = useState(false)
  const phone = useBreakpoint() === 'mobile'

  const inset = !editing
    ? { left: 0, bottom: 0 }
    : phone
      ? { left: 0, bottom: peek ? PEEK_H : SHEET_H }
      : { left: PANE_W + 16, bottom: 0 }

  const open = () => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setPeek(false)
    setEditing(true)
  }

  return (
    <>
      <Cover gallery={gallery} photo={photo} config={cover.config} inset={inset} editing={editing} onEnter={onEnter} onEdit={open} />
      <CoverEditor
        open={editing}
        onClose={() => setEditing(false)}
        phone={phone}
        peek={peek}
        onPeek={setPeek}
        photo={photo}
        cover={cover}
      />
    </>
  )
}
