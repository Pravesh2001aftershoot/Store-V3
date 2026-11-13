import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CaretRight, Rows, SquaresFour, TextAa } from '@phosphor-icons/react'
import { Button } from '../../components/ui'
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
import { galleryPath } from '../../data/galleries'
import GridEditor from './GridEditor'

const name = (list, id) => list.find((t) => t.id === id)?.name ?? 'Custom'
const label = (list, id) => list.find((o) => o.id === id)?.label

/**
 * Step 2 — Design. The gallery's own editors (cover, collection headings, footer) plus the grid,
 * beside a live preview of the client gallery.
 *
 * Wide screens: a list of the four parts on the left; picking one docks its editor there
 * (EditorPane `inline`). Narrower screens: a full-width preview with the parts as chips above it;
 * picking one opens its editor as the gallery's bottom sheet. Either way the preview scrolls to the
 * part being edited and updates as you change it.
 */
export default function DesignStep({ ws }) {
  const docked = useDocked()
  const phone = usePhone()
  const [editing, setEditing] = useState(null) // 'cover' | 'grid' | 'headings' | 'footer'
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
    { id: 'headings', title: 'Collection headings', detail: `Template: ${name(HEADING_TEMPLATES, headings.state.layout.template)}${headings.edited ? ' · edited' : ''}`, icon: TextAa },
    { id: 'footer', title: 'Footer', detail: `Template: ${name(FOOTER_TEMPLATES, footer.config.layout.template)}${footer.edited ? ' · edited' : ''}`, icon: Rows },
  ]

  const target = { cover: 'cover', grid: 'grid', headings: heading && `section:${heading}`, footer: 'footer' }[editing] ?? 'cover'
  const close = () => setEditing(null)
  const shared = { onClose: close, phone: !docked, peek, onPeek: setPeek, inline: docked }

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
        onClose={close}
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
        <aside className="flex w-[380px] shrink-0 flex-col border-r border-border bg-surface-1 xl:w-[400px]">
          {editing ? editors : <Overview parts={parts} onPick={setEditing} base={ws.base} />}
        </aside>
        <PreviewFrame src={galleryPath(ws.gallery.id)} target={target} label="Client gallery" className="min-w-0 flex-1" />
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
      <PreviewFrame src={galleryPath(ws.gallery.id)} target={target} fit={phone} label="Client gallery" className="min-h-0 flex-1" />
      {editors}
    </div>
  )
}

/** The four parts of the gallery page, each with what it's set to now. */
function Overview({ parts, onPick, base }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border px-5 pb-4 pt-5">
        <p className="text-16-sb text-type-0">Design</p>
        <p className="mt-0.5 text-12-r-p text-type-2">Pick a part of the gallery to customise. Changes save as you make them and show in the preview.</p>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {parts.map((p, i) => (
          <button
            key={p.id}
            onClick={() => onPick(p.id)}
            className="group flex w-full items-center gap-3 rounded-xl p-2.5 text-left ring-1 ring-border transition hover:bg-surface-2 hover:ring-type-3"
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2 text-type-1">
              {p.thumb ?? <p.icon size={22} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-11-sb uppercase text-type-3">{String(i + 1).padStart(2, '0')}</span>
              <span className="block truncate text-14-m text-type-0">{p.title}</span>
              <span className="block truncate text-12-r text-type-2">{p.detail}</span>
            </span>
            <CaretRight size={16} className="shrink-0 text-type-3 transition group-hover:translate-x-0.5 group-hover:text-type-0" />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-border px-5 py-3">
        <Button as={Link} to={`${base}/photos`} variant="ghost" size="sm" className="-ml-2">
          <ArrowLeft size={14} /> Photos
        </Button>
        <span className="flex-1" />
        <Button as={Link} to={`${base}/share`} size="md">
          Next: Share <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  )
}
