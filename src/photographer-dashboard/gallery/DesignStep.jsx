import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Info, Panorama, Rows, SidebarSimple, SquaresFour, TextAa } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { ORIENTATION, SIZE, SPACING } from '../../gallery/lib/settings'
import { ALL_TEMPLATES as COVER_TEMPLATES } from '../../gallery/templates/cover/config'
import { TEMPLATES as HEADING_TEMPLATES } from '../../gallery/templates/set-header/config'
import { TEMPLATES as FOOTER_TEMPLATES } from '../../gallery/templates/footer/config'
import CoverEditor from '../../gallery/templates/cover/CoverEditor'
import SectionEditor from '../../gallery/templates/set-header/SectionEditor'
import FooterEditor from '../../gallery/templates/footer/FooterEditor'
import PreviewFrame from '../components/PreviewFrame'
import { ease, IconButton } from '../components/ui'
import { useDocked, usePhone } from '../lib/hooks'
import { galleryPath } from '../../data/galleries'
import GridEditor from './GridEditor'
import GalleryInfoEditor from './GalleryInfoEditor'

const name = (list, id) => list.find((t) => t.id === id)?.name ?? 'Custom'
const label = (list, id) => list.find((o) => o.id === id)?.label

/**
 * Step 2 — Design. The gallery's own editors (cover, collection headings, footer) plus the grid,
 * beside a live preview of the client gallery.
 *
 * Gallery info (title, client, date, catalog, Delete) comes first, then the gallery's look.
 * The part being edited is in the URL (`?part=info|cover|grid|headings|footer`), so the step rail can
 * switch it. Wide screens: the four parts sit under the Design icon in the step rail, and the
 * picked part's editor docks in a column on the right of the preview (EditorPane `inline`, always
 * open, Cover first). Narrower screens: a full-width preview with the parts as chips above it;
 * picking one opens its editor as the gallery's bottom sheet. Either way the preview scrolls to the
 * part being edited and updates as you change it. The gallery header (`title`, `actions`) lives in
 * the preview's toolbar here, so there's one bar instead of two. Docked, the toolbar's last button
 * hides or shows the editor column (the preview takes the width); picking a part shows it again.
 */
export default function DesignStep({ ws, title, actions }) {
  const docked = useDocked()
  const phone = usePhone()
  const [params, setParams] = useSearchParams()
  const picked = PART_IDS.includes(params.get('part')) ? params.get('part') : null
  // Only `part` changes; anything else in the URL stays.
  const setEditing = (id) => setParams((prev) => {
    const next = new URLSearchParams(prev)
    if (id) next.set('part', id); else next.delete('part')
    return next
  }, { replace: true })
  // Docked, one editor is always open (Cover to start); as a sheet, none until a part is picked.
  const editing = docked ? picked ?? 'cover' : picked
  const [peek, setPeek] = useState(false)
  const [heading, setHeading] = useState(ws.sections[0]?.title)
  useEffect(() => { setPeek(false) }, [editing])
  // Docked only: the editor column can be hidden. Picking a part in the rail brings it back.
  const [panel, setPanel] = useState(true)
  useEffect(() => { setPanel(true) }, [picked])
  // The collection being edited was renamed or emptied: follow the first one.
  useEffect(() => {
    if (!ws.sections.some((s) => s.title === heading)) setHeading(ws.sections[0]?.title)
  }, [ws.sections, heading])

  const { cover, media, headings, footer, grid } = ws
  const parts = designParts(ws)

  const target = { info: 'cover', cover: 'cover', grid: 'grid', headings: heading && `section:${heading}`, footer: 'footer' }[editing] ?? 'cover'
  const close = () => setEditing(null)
  // Docked editors can't be closed: the step rail switches between them.
  const shared = { onClose: docked ? undefined : close, phone: !docked, peek, onPeek: setPeek, inline: docked }

  const editors = (
    <>
      <GalleryInfoEditor {...shared} open={editing === 'info'} id={ws.gallery.id} />
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
        <PreviewFrame
          src={galleryPath(ws.gallery.id)}
          target={target}
          label="Client gallery"
          heading={title}
          actions={
            <>
              {actions}
              <IconButton small label={panel ? 'Hide editor panel' : 'Show editor panel'} aria-pressed={panel} onClick={() => setPanel((v) => !v)}>
                <SidebarSimple size={16} weight={panel ? 'fill' : 'regular'} className="-scale-x-100" />
              </IconButton>
            </>
          }
          className="min-w-0 flex-1"
        />
        <motion.div
          className="shrink-0 overflow-hidden"
          initial={false}
          animate={{ width: panel ? 'auto' : 0 }}
          transition={{ duration: 0.3, ease }}
          aria-hidden={!panel || undefined}
          inert={!panel || undefined}
        >
          <aside className="flex h-full w-[380px] flex-col border-l border-border bg-surface-1 xl:w-[400px]">{editors}</aside>
        </motion.div>
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

const PART_IDS = ['info', 'cover', 'grid', 'headings', 'footer']

/** The parts of the Design step — Gallery info, then the four looks — with each one's current setting (`detail`) for tooltips. */
export function designParts(ws) {
  const { cover, media, headings, footer, grid } = ws
  return [
    { id: 'info', title: 'Gallery info', detail: 'Title, client, date, catalog', icon: Info },
    {
      id: 'cover', title: 'Cover', detail: `Template: ${name(COVER_TEMPLATES, cover.template)}`, icon: Panorama,
      thumb: <img src={media.photo.thumb ?? media.photo.src} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${media.photo.focus.x}% ${media.photo.focus.y}%` }} />,
    },
    { id: 'grid', title: 'Grid', detail: `${label(ORIENTATION, grid.orientation)} · ${label(SIZE, grid.size)} · ${label(SPACING, grid.spacing)}`, icon: SquaresFour },
    { id: 'headings', title: 'Collection headings', detail: headings.state.perSet ? 'Different layout for each set' : `Template: ${name(HEADING_TEMPLATES, headings.state.layout.template)}${headings.edited ? ' · edited' : ''}`, icon: TextAa },
    { id: 'footer', title: 'Footer', detail: `Template: ${name(FOOTER_TEMPLATES, footer.config.layout.template)}${footer.edited ? ' · edited' : ''}`, icon: Rows },
  ]
}
