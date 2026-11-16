import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowSquareOut, CaretRight, ChartBar, GearSix, Images, PaintBrush, ShareNetwork } from '@phosphor-icons/react'
import { GalleryProvider, galleryPath } from '../../data/galleries'
import { useGalleryData } from '../../gallery/lib/useGalleryData'
import GalleryForm from '../galleries/GalleryForm'
import { cn } from '../../lib/utils'
import { ease } from '../components/ui'
import { useTopOffset } from '../lib/hooks'
import { IconButton } from '../components/ui'
import { useGalleryWorkspace } from './useGalleryWorkspace'
import PhotosStep from './PhotosStep'
import DesignStep from './DesignStep'
import ShareStep from './ShareStep'
import AnalyticsStep from './AnalyticsStep'

export const STEPS = [
  { id: 'photos', label: 'Photos', icon: Images, hint: 'Add and arrange' },
  { id: 'design', label: 'Design', icon: PaintBrush, hint: 'Cover, grid, headings, footer' },
  { id: 'share', label: 'Share', icon: ShareNetwork, hint: 'Send to your client' },
  { id: 'analytics', label: 'Analytics', icon: ChartBar, hint: 'Visitors, downloads, revenue' },
]

/**
 * Gallery editor: one client gallery in four tabs — Photos, Design, Share and Analytics.
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
  const [settings, setSettings] = useState(false)
  const design = step === 'design'
  const openSettings = () => setSettings(true)

  return (
    // Content on the left, the step rail docked on the right. Design is a workspace: it fills
    // the screen instead of scrolling.
    <div className="flex" style={design ? { height: `calc(100svh - ${top}px)` } : undefined}>
      <div className={cn('min-w-0 flex-1', design && 'flex flex-col')}>
        {/* Design merges the header into its preview toolbar, where Open already does View's job. */}
        {!design && <Header ws={ws} onSettings={openSettings} />}
        <GalleryForm open={settings} onOpenChange={setSettings} gallery={data.meta} />
        {step === 'photos' && <PhotosStep ws={ws} />}
        {design && <DesignStep ws={ws} title={<Heading ws={ws} />} actions={<SettingsButton onClick={openSettings} small />} />}
        {step === 'share' && <ShareStep ws={ws} />}
        {step === 'analytics' && <AnalyticsStep ws={ws} />}
      </div>
      <StepRail step={step} ws={ws} top={top} />
    </div>
  )
}

/** Photos and Share: breadcrumb + gallery name, then Settings and View. */
function Header({ ws, onSettings }) {
  return (
    <div className="shrink-0 border-b border-border bg-surface-1">
      <div className="mx-auto flex max-w-[1800px] items-center gap-2 px-4 py-3 md:px-6">
        <div className="min-w-0 flex-1"><Heading ws={ws} /></div>
        <span className="flex shrink-0 gap-1"><Actions ws={ws} onSettings={onSettings} /></span>
      </div>
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

const SettingsButton = ({ onClick, small }) => (
  <IconButton small={small} label="Gallery settings" onClick={onClick}><GearSix size={small ? 16 : 18} /></IconButton>
)

/**
 * Icon-only tab switcher docked on the right edge: Photos, Design, Share, Analytics stacked vertically.
 * Sticks under the top bar while the page scrolls. Hovering or focusing a tab shows its name
 * and hint in a tooltip to the left (not on phones).
 */
function StepRail({ step, ws, top }) {
  return (
    <nav
      aria-label="Gallery steps"
      className="sticky z-30 w-14 shrink-0 self-start border-l border-border bg-surface-1 md:w-16"
      style={{ top, height: `calc(100svh - ${top}px)` }}
    >
      <ul className="flex flex-col items-center gap-2 py-3">
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
                <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg bg-type-0 px-2.5 py-1.5 text-left opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 max-sm:hidden">
                  <span className="block text-12-sb text-white">{s.label}</span>
                  <span className="block text-12-r text-white/60">{s.hint}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function Actions({ ws, onSettings }) {
  return (
    <>
      <SettingsButton onClick={onSettings} />
      <a
        href={galleryPath(ws.gallery.id)}
        target="_blank"
        rel="noreferrer"
        className="flex h-10 items-center gap-1.5 rounded-full border border-input bg-surface-1 px-3.5 text-13-m text-type-0 transition hover:bg-surface-2"
      >
        View <ArrowSquareOut size={14} />
      </a>
    </>
  )
}
