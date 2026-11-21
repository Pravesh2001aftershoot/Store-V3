import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, CaretRight, ChartBar, Images, PaintBrush, ShareNetwork, SlidersHorizontal } from '@phosphor-icons/react'
import { GalleryProvider } from '../../data/galleries'
import { useGalleryData } from '../../gallery/lib/useGalleryData'
import { cn } from '../../lib/utils'
import { ease } from '../components/ui'
import { useDocked, useTopOffset } from '../lib/hooks'
import { useGalleryWorkspace } from './useGalleryWorkspace'
import PhotosStep from './PhotosStep'
import DesignStep, { designParts } from './DesignStep'
import SettingsStep from './SettingsStep'
import ShareStep from './ShareStep'
import AnalyticsStep from './AnalyticsStep'

export const STEPS = [
  { id: 'photos', label: 'Photos', icon: Images, hint: 'Add and arrange' },
  { id: 'design', label: 'Design', icon: PaintBrush, hint: 'Cover, grid, headings, footer' },
  { id: 'settings', label: 'Settings', icon: SlidersHorizontal, hint: 'Access, engagement, privacy' },
  { id: 'share', label: 'Share', icon: ShareNetwork, hint: 'Send to your client' },
  { id: 'analytics', label: 'Analytics', icon: ChartBar, hint: 'Visitors, downloads, revenue' },
]

/**
 * Gallery editor: one client gallery in five tabs — Photos, Design, Settings, Share and Analytics.
 * The gallery and step are in the URL (/dashboard/galleries/<id>/<step>), so each one can be
 * linked to and Back works. Everything inside reads that gallery's settings (GalleryProvider).
 */
export default function GalleryTab() {
  const { galleryId, step = 'photos' } = useParams()
  const data = useGalleryData(galleryId)
  if (!data) return <Navigate to="/dashboard/galleries" replace />
  if (!STEPS.some((s) => s.id === step)) return <Navigate to={`/dashboard/galleries/${galleryId}`} replace />
  return (
    <GalleryProvider id={galleryId}>
      <Workspace key={galleryId} data={data} step={step} />
    </GalleryProvider>
  )
}

function Workspace({ data, step }) {
  const top = useTopOffset()
  const ws = { ...useGalleryWorkspace(data), base: `/dashboard/galleries/${data.meta.id}` }
  const design = step === 'design'

  return (
    // Step rail on the left, then the content; on Design (docked) the parts rail on the right.
    // Design is a workspace: it fills the screen instead of scrolling.
    <div className="flex" style={design ? { height: `calc(100svh - ${top}px)` } : undefined}>
      <StepRail step={step} ws={ws} top={top} />
      <div className={cn('min-w-0 flex-1', design && 'flex flex-col')}>
        {/* Only Design has a gallery header: breadcrumb and title in its preview toolbar. */}
        {step === 'photos' && <PhotosStep ws={ws} />}
        {design && <DesignStep ws={ws} title={<Heading ws={ws} />} />}
        {step === 'settings' && <SettingsStep ws={ws} />}
        {step === 'share' && <ShareStep ws={ws} />}
        {step === 'analytics' && <AnalyticsStep ws={ws} />}
      </div>
      <PartsRail step={step} ws={ws} top={top} />
    </div>
  )
}

/** Breadcrumb (Galleries › client) over the gallery title and photo count. */
function Heading({ ws }) {
  return (
    <>
      <p className="flex items-center gap-1 text-12-r text-type-3">
        <Link to="/dashboard/galleries" className="transition hover:text-type-0">Galleries</Link>
        <CaretRight size={10} />
        <span className="truncate">{ws.gallery.client}</span>
      </p>
      <p className="truncate text-14-m text-type-0">
        {ws.gallery.title} <span className="text-type-3">· {ws.photos.length} photos</span>
      </p>
    </>
  )
}

/**
 * Icon-only rail docked on the left edge: Back (to the Galleries grid), then the five steps —
 * Photos, Design, Settings, Share, Analytics — stacked vertically. Sticks under the top bar while
 * the page scrolls. Hovering or focusing an icon shows its name and hint in a tooltip to the right
 * (not on phones).
 */
function StepRail({ step, ws, top }) {
  return (
    <nav
      aria-label="Gallery steps"
      className="sticky z-30 w-14 shrink-0 self-start border-r border-border bg-surface-1 md:w-16"
      style={{ top, height: `calc(100svh - ${top}px)` }}
    >
      <div className="flex justify-center pt-3">
        <Link
          to="/dashboard/galleries"
          aria-label="Back to galleries"
          className="group relative grid h-11 w-11 place-items-center rounded-xl text-type-2 transition-colors hover:bg-surface-2 hover:text-type-0"
        >
          <ArrowLeft size={20} />
          <Tip side="right" title="Back" detail="All galleries" />
        </Link>
      </div>
      <span aria-hidden className="mx-auto my-2 block h-px w-8 bg-border" />
      <ul className="flex flex-col items-center gap-2 pb-3">
        {STEPS.map((s) => {
          const active = s.id === step
          const Icon = s.icon
          return (
            <li key={s.id}>
              <Link
                to={`${ws.base}/${s.id}`}
                aria-label={s.label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative grid h-11 w-11 place-items-center rounded-xl transition-colors',
                  active ? 'text-primary-foreground' : 'text-type-2 hover:bg-surface-2 hover:text-type-0'
                )}
              >
                {active && <motion.span layoutId="gallery-step" className="absolute inset-0 rounded-xl bg-primary" transition={{ duration: 0.35, ease }} />}
                <Icon size={20} weight={active ? 'fill' : 'regular'} className="relative" />
                <Tip side="right" title={s.label} detail={s.hint} />
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/**
 * Design only, when its editor is docked (≥ 960px): an icon rail on the right edge, beside the
 * editor column. Gallery info first, a divider, then the four looks (Cover, Grid, Headings,
 * Footer); picking one switches the open editor (`?part=`). Slides in and out with the step;
 * tooltips open to the left.
 */
function PartsRail({ step, ws, top }) {
  const docked = useDocked()
  const [params] = useSearchParams()
  const parts = step === 'design' && docked ? designParts(ws) : null
  const part = parts?.some((p) => p.id === params.get('part')) ? params.get('part') : 'cover'
  return (
    <AnimatePresence initial={false}>
      {parts && (
        // Clipped only while it opens or closes, so the tooltips can spill out to the left.
        <motion.nav
          key="parts"
          aria-label="Design parts"
          className="sticky z-30 shrink-0 self-start border-l border-border bg-surface-1"
          style={{ top, height: `calc(100svh - ${top}px)` }}
          initial={{ width: 0, opacity: 0, overflow: 'hidden' }}
          animate={{ width: 64, opacity: 1, transitionEnd: { overflow: 'visible' } }}
          exit={{ width: 0, opacity: 0, overflow: 'hidden' }}
          transition={{ duration: 0.3, ease }}
        >
          <ul className="flex w-16 flex-col items-center gap-2 py-3">
            {parts.map((p) => {
              const on = p.id === part
              const PartIcon = p.icon
              return (
                <li key={p.id} className="flex flex-col items-center gap-2">
                  <Link
                    to={`${ws.base}/design?part=${p.id}`}
                    replace
                    aria-label={p.title}
                    aria-current={on ? 'true' : undefined}
                    className={cn(
                      'group relative grid h-11 w-11 place-items-center rounded-xl transition-colors',
                      on ? 'text-type-0' : 'text-type-2 hover:bg-surface-2 hover:text-type-0'
                    )}
                  >
                    {on && <motion.span layoutId="design-part" className="absolute inset-0 rounded-xl bg-surface-2" transition={{ duration: 0.3, ease }} />}
                    <PartIcon size={20} weight={on ? 'fill' : 'regular'} className="relative" />
                    <Tip side="left" title={p.title} detail={p.detail} />
                  </Link>
                  {/* Gallery info, then the gallery's look. */}
                  {p.id === 'info' && <span aria-hidden className="block h-px w-8 bg-border" />}
                </li>
              )
            })}
          </ul>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}

/** Rail tooltip: name over a hint, beside the icon (`side` it opens towards) on hover or focus. Hidden on phones. */
function Tip({ title, detail, side }) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 whitespace-nowrap rounded-lg bg-type-0 px-2.5 py-1.5 text-left opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 max-sm:hidden',
        side === 'right' ? 'left-full ml-3 -translate-x-1' : 'right-full mr-3 translate-x-1'
      )}
    >
      <span className="block text-12-sb text-white">{title}</span>
      <span className="block text-12-r text-white/60">{detail}</span>
    </span>
  )
}
