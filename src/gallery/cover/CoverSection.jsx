import { useState } from 'react'
import { useBreakpoint } from '../lib/hooks'
import { useCoverPhoto } from './photo'
import Cover from './Cover'
import CoverEditor, { PANE_W, PEEK_H, SHEET_H } from './CoverEditor'

/**
 * The gallery cover plus its editor. Owns whether the editor is open; the settings (`cover`, from
 * `useCoverConfig`) live with the page, since collection headings can match the cover's style.
 * While editing, the cover's frame shrinks to the space beside (tablet/desktop) or above (phone)
 * the editor, so what you see is the cover at that size, live.
 */
export default function CoverSection({ gallery, cover, photo: defaultPhoto, photos, collections, onEnter }) {
  const media = useCoverPhoto(defaultPhoto, photos)
  const photo = media.photo
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
      <Cover gallery={gallery} photo={photo} slots={media.slots} config={cover.config} inset={inset} editing={editing} onEnter={onEnter} onEdit={open} />
      <CoverEditor
        open={editing}
        onClose={() => setEditing(false)}
        phone={phone}
        peek={peek}
        onPeek={setPeek}
        gallery={gallery}
        photo={photo}
        cover={cover}
        media={media}
        photos={photos}
        collections={collections}
      />
    </>
  )
}
