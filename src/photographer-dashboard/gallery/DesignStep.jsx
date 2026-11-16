import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Rows, SquaresFour, TextAa } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { ORIENTATION, SIZE, SPACING } from '../../gallery/lib/settings'
import { ALL_TEMPLATES as COVER_TEMPLATES } from '../../gallery/templates/cover/config'
import { TEMPLATES as HEADING_TEMPLATES } from '../../gallery/templates/set-header/config'
import { TEMPLATES as FOOTER_TEMPLATES } from '../../gallery/templates/footer/config'
import CoverEditor from '../../gallery/templates/cover/CoverEditor'
import SectionEditor from '../../gallery/templates/set-header/SectionEditor'
import FooterEditor from '../../gallery/templates/footer/FooterEditor'
import PreviewFrame from '../components/PreviewFrame'
import { useDocked, usePhone } from '../lib/hooks'
import { ease } from '../components/ui'
import { galleryPath } from '../../data/galleries'
import GridEditor from './GridEditor'

const name = (list, id) => list.find((t) => t.id === id)?.name ?? 'Custom'
const label = (list, id) => list.find((o) => o.id === id)?.label

/**
 * Step 2 — Design. The gallery's own editors (cover, collection headings, footer) plus the grid,
 * beside a live preview of the client gallery.
 *
 * Wide screens: a column on the right of the preview with the four parts as underline tabs and the
 * picked part's editor docked under them (EditorPane `inline`, always open, Cover first). Narrower screens: a full-width preview with the parts as chips above it;
 * picking one opens its editor as the gallery's bottom sheet. Either way the preview scrolls to the
 * part being edited and updates as you change it. The gallery header (`title`, `actions`) lives in
 * the preview's toolbar here, so there's one bar instead of two.
 */
export default function DesignStep({ ws, title, actions }) {
  const docked = useDocked()
  const phone = usePhone()
  const [picked, setEditing] = useState(null) // 'cover' | 'grid' | 'headings' | 'footer'
  // Docked, one editor is always open (Cover to start); as a sheet, none until a part is picked.
  const editing = docked ? picked ?? 'cover' : picked
  const [peek, setPeek] = useState(false)
  const [heading, setHeading] = useState(ws.sections[0]?.title)
  useEffect(() => { setPeek(false) }, [editing])
  // The collection being edited was renamed or emptied: follow the first one.
  useEffect(() => {
    if (!ws.sections.some((s) => s.title === heading)) setHeading(ws.sections[0]?.title)
  }, [ws.sections, heading])

  const { cover, media, headings, footer, grid } = ws
  const parts = [
    {
      id: 'cover', title: 'Cover', detail: `Template: ${name(COVER_TEMPLATES, cover.template)}`,
      thumb: <img src={media.photo.thumb ?? media.photo.src} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${media.photo.focus.x}% ${media.photo.focus.y}%` }} />,
    },
    { id: 'grid', title: 'Grid', detail: `${label(ORIENTATION, grid.orientation)} · ${label(SIZE, grid.size)} · ${label(SPACING, grid.spacing)}`, icon: SquaresFour },
    { id: 'headings', title: 'Collection headings', tab: 'Headings', detail: `Template: ${name(HEADING_TEMPLATES, headings.state.layout.template)}${headings.edited ? ' · edited' : ''}`, icon: TextAa },
    { id: 'footer', title: 'Footer', detail: `Template: ${name(FOOTER_TEMPLATES, footer.config.layout.template)}${footer.edited ? ' · edited' : ''}`, icon: Rows },
  ]

  const target = { cover: 'cover', grid: 'grid', headings: heading && `section:${heading}`, footer: 'footer' }[editing] ?? 'cover'
  const close = () => setEditing(null)
  // Docked editors can't be closed: the tabs switch between them.
  const shared = { onClose: docked ? undefined : close, phone: !docked, peek, onPeek: setPeek, inline: docked }

  const editors = (
    <>
      <CoverEditor
        {...shared}
        open={editing === 'cover'}
        gallery={ws.gallery}
        photo={media.photo}
        cover={cover}
        media={media}
        photos={ws.photos}
        collections={ws.sections.map((s) => s.title)}
      />
      <GridEditor {...shared} open={editing === 'grid'} grid={grid} setGrid={ws.setGrid} resetGrid={ws.resetGrid} />
      <SectionEditor
        open={editing === 'headings'}
        onClose={shared.onClose}
        inline={docked}
        collection={heading}
        onCollection={setHeading}
        sections={ws.sections}
        headings={headings}
        photos={ws.photos}
        cover={cover.config}
      />
      <FooterEditor {...shared} open={editing === 'footer'} gallery={ws.gallery} footer={footer} photo={ws.footerPhoto} photos={ws.photos} />
    </>
  )

  if (docked) {
    return (
      <div className="flex min-h-0 flex-1">
        <PreviewFrame src={galleryPath(ws.gallery.id)} target={target} label="Client gallery" heading={title} actions={actions} className="min-w-0 flex-1" />
        <aside className="flex w-[380px] shrink-0 flex-col border-l border-border bg-surface-1 xl:w-[400px]">
          <PartTabs parts={parts} active={editing} onPick={setEditing} />
          <div className="flex min-h-0 flex-1 flex-col">{editors}</div>
        </aside>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto border-b border-border bg-surface-1 px-4 py-3">
        {parts.map((p) => (
          <button
            key={p.id}
            onClick={() => setEditing(p.id)}
            className={cn('flex h-9 shrink-0 items-center gap-2 rounded-full pl-1.5 pr-3.5 text-13-m transition', editing === p.id ? 'bg-primary text-primary-foreground' : 'bg-surface-2 text-type-1 hover:text-type-0')}
          >
            <span className="grid h-6 w-6 place-items-center overflow-hidden rounded-full bg-surface-1 text-type-0">
              {p.thumb ?? <p.icon size={14} />}
            </span>
            {p.title}
          </button>
        ))}
      </div>
      <PreviewFrame src={galleryPath(ws.gallery.id)} target={target} fit={phone} label="Client gallery" heading={title} actions={actions} className="min-h-0 flex-1" />
      {editors}
    </div>
  )
}

/** The four parts as underline tabs: 40px, `12-SB` uppercase, a 2px `type-0` stroke that slides to the active one. */
function PartTabs({ parts, active, onPick }) {
  return (
    <div role="tablist" aria-label="Gallery parts" className="no-scrollbar flex shrink-0 gap-6 overflow-x-auto px-5">
      {parts.map((p) => (
        <button
          key={p.id}
          role="tab"
          aria-selected={active === p.id}
          title={p.detail}
          onClick={() => onPick(p.id)}
          className={cn('relative flex h-10 shrink-0 items-center text-12-sb uppercase transition-colors', active === p.id ? 'text-type-0' : 'text-type-2 hover:text-type-0')}
        >
          {p.tab ?? p.title}
          {active === p.id && <motion.span layoutId="design-part-tab" transition={{ duration: 0.3, ease }} className="absolute inset-x-0 bottom-0 h-0.5 bg-type-0" />}
        </button>
      ))}
    </div>
  )
}
