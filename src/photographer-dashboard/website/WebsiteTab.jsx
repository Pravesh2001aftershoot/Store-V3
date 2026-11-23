import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CurrencyDollar, EnvelopeSimple, GearSix, Images, Panorama, Question, SidebarSimple, UserCircle } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { useWebsite } from '../../website/data/config'
import PreviewFrame from '../components/PreviewFrame'
import { IconButton, ease } from '../components/ui'
import { useDocked, usePhone, useTopOffset } from '../lib/hooks'
import { Tip } from '../gallery/GalleryTab'
import WebsiteEditor, { PART_META } from './WebsiteEditor'

const ICONS = { site: GearSix, hero: Panorama, about: UserCircle, portfolio: Images, pricing: CurrencyDollar, faq: Question, contact: EnvelopeSimple }
const PART_IDS = Object.keys(PART_META)
export const WEBSITE_PATH = '/site'

/**
 * Website — the photographer's static site (/site), built the way a gallery is designed: a live
 * preview, the picked part's editor docked on its right, and an icon rail of parts on the far right
 * (Site settings, a divider, then Hero, About, Portfolio, Pricing, FAQ, Contact). The part is in the
 * URL (`?part=`), so it can be linked to; the preview scrolls to it. Narrower than 960px: a
 * full-width preview with the parts as chips above it; picking one opens its editor as a bottom
 * sheet. Docked, the toolbar's last button hides or shows the editor column.
 */
export default function WebsiteTab() {
  const w = useWebsite()
  const docked = useDocked()
  const phone = usePhone()
  const top = useTopOffset()
  const [params, setParams] = useSearchParams()
  const picked = PART_IDS.includes(params.get('part')) ? params.get('part') : null
  const setEditing = (id) => setParams((prev) => {
    const next = new URLSearchParams(prev)
    if (id) next.set('part', id); else next.delete('part')
    return next
  }, { replace: true })
  // Docked, one editor is always open (Hero to start); as a sheet, none until a part is picked.
  const editing = docked ? picked ?? 'hero' : picked
  const [peek, setPeek] = useState(false)
  useEffect(() => { setPeek(false) }, [editing])
  const [panel, setPanel] = useState(true)
  useEffect(() => { setPanel(true) }, [picked])

  const target = PART_META[editing]?.target ?? 'top'
  const heading = (
    <>
      <p className="truncate text-12-r text-type-3">Website · {window.location.host}{WEBSITE_PATH}</p>
      <p className="truncate text-14-m text-type-0">
        {w.site.title} <span className="text-type-3">· {w.sections.length} sections</span>
      </p>
    </>
  )
  const editor = editing && (
    <WebsiteEditor
      part={editing}
      w={w}
      onPart={setEditing}
      open
      inline={docked}
      onClose={docked ? undefined : () => setEditing(null)}
      phone={!docked}
      peek={peek}
      onPeek={setPeek}
    />
  )

  if (docked) {
    return (
      <div className="flex" style={{ height: `calc(100svh - ${top}px)` }}>
        <PreviewFrame
          src={WEBSITE_PATH}
          target={target}
          label="Website"
          heading={heading}
          actions={
            <IconButton small label={panel ? 'Hide editor panel' : 'Show editor panel'} aria-pressed={panel} onClick={() => setPanel((v) => !v)}>
              <SidebarSimple size={16} weight={panel ? 'fill' : 'regular'} className="-scale-x-100" />
            </IconButton>
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
          <aside className="flex h-full w-[380px] flex-col border-l border-border bg-surface-1 xl:w-[400px]">{editor}</aside>
        </motion.div>
        <PartsRail part={editing} w={w} onPick={setEditing} />
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: `calc(100svh - ${top}px)` }}>
      <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto border-b border-border bg-surface-1 px-4 py-3">
        {PART_IDS.map((id) => {
          const Icon = ICONS[id]
          return (
            <button
              key={id}
              onClick={() => setEditing(id)}
              className={cn(
                'flex h-9 shrink-0 items-center gap-2 rounded-full pl-1.5 pr-3.5 text-13-m transition',
                editing === id ? 'bg-primary text-primary-foreground' : 'bg-surface-2 text-type-1 hover:text-type-0',
                w.isHidden(id) && editing !== id && 'opacity-60'
              )}
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-surface-1 text-type-0"><Icon size={14} /></span>
              {PART_META[id].title}
            </button>
          )
        })}
      </div>
      <PreviewFrame src={WEBSITE_PATH} target={target} fit={phone} label="Website" heading={heading} className="min-h-0 flex-1" />
      {editor}
    </div>
  )
}

/**
 * Docked only: the icon rail on the right edge, like the gallery's Design parts. Site settings,
 * a divider, then the six sections in page order. A hidden section's icon is dimmed and its
 * tooltip says so.
 */
function PartsRail({ part, w, onPick }) {
  const ids = ['site', 'hero', ...w.state.order, 'contact']
  return (
    <nav aria-label="Website parts" className="w-16 shrink-0 border-l border-border bg-surface-1">
      <ul className="flex flex-col items-center gap-2 py-3">
        {ids.map((id) => {
          const on = id === part
          const Icon = ICONS[id]
          const hidden = w.isHidden(id)
          return (
            <li key={id} className="flex flex-col items-center gap-2">
              <button
                onClick={() => onPick(id)}
                aria-label={PART_META[id].title}
                aria-current={on ? 'true' : undefined}
                className={cn(
                  'group relative grid h-11 w-11 place-items-center rounded-xl transition-colors',
                  on ? 'text-type-0' : 'text-type-2 hover:bg-surface-2 hover:text-type-0'
                )}
              >
                {on && <motion.span layoutId="website-part" className="absolute inset-0 rounded-xl bg-surface-2" transition={{ duration: 0.3, ease }} />}
                <Icon size={20} weight={on ? 'fill' : 'regular'} className={cn('relative', hidden && !on && 'opacity-40')} />
                {hidden && <span aria-hidden className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-600" />}
                <Tip side="left" title={PART_META[id].title} detail={hidden ? 'Hidden from your website' : PART_META[id].detail} />
              </button>
              {id === 'site' && <span aria-hidden className="block h-px w-8 bg-border" />}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
