import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowSquareOut, CaretRight, Check, GearSix } from '@phosphor-icons/react'
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

export const STEPS = [
  { id: 'photos', label: 'Photos', hint: 'Add and arrange' },
  { id: 'design', label: 'Design', hint: 'Cover, grid, headings, footer' },
  { id: 'share', label: 'Share', hint: 'Send to your client' },
]

/**
 * Gallery editor: a three-step flow over one client gallery — Photos → Design → Share.
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

  return (
    // Design is a workspace: it fills the screen instead of scrolling.
    <div className={cn(step === 'design' && 'flex flex-col')} style={step === 'design' ? { height: `calc(100svh - ${top}px)` } : undefined}>
      <StepBar step={step} ws={ws} onSettings={() => setSettings(true)} />
      <GalleryForm open={settings} onOpenChange={setSettings} gallery={data.meta} />
      {step === 'photos' && <PhotosStep ws={ws} />}
      {step === 'design' && <DesignStep ws={ws} />}
      {step === 'share' && <ShareStep ws={ws} />}
    </div>
  )
}

/** Breadcrumb + gallery name, the three steps, then Settings and View. Earlier steps show a tick. */
function StepBar({ step, ws, onSettings }) {
  const at = STEPS.findIndex((s) => s.id === step)
  return (
    <div className="border-b border-border bg-surface-1">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:gap-6 md:px-6">
        <div className="flex min-w-0 items-center gap-2 md:w-[260px] md:shrink-0">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-12-r text-type-3">
              <Link to="/dashboard/galleries" className="transition hover:text-type-0">Galleries</Link>
              <CaretRight size={10} />
              <span className="truncate">{ws.gallery.client}</span>
            </p>
            <p className="truncate text-14-m text-type-0">
              {ws.gallery.title} <span className="text-type-3">· {ws.photos.length} photos</span>
            </p>
          </div>
          <span className="flex shrink-0 gap-1 md:hidden"><Actions ws={ws} onSettings={onSettings} /></span>
        </div>
        <ol className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-auto md:px-0">
          {STEPS.map((s, i) => {
            const active = s.id === step
            const done = i < at
            return (
              <li key={s.id} className="flex shrink-0 items-center gap-1">
                {i > 0 && <span className={cn('h-px w-4 md:w-8', i <= at ? 'bg-type-0' : 'bg-border')} />}
                <Link
                  to={`${ws.base}/${s.id}`}
                  aria-current={active ? 'step' : undefined}
                  className={cn('relative flex h-10 items-center gap-2 rounded-full pl-1.5 pr-4 text-13-m transition', active ? 'text-type-0' : 'text-type-2 hover:text-type-0')}
                >
                  {active && <motion.span layoutId="gallery-step" className="absolute inset-0 rounded-full bg-surface-2" transition={{ duration: 0.35, ease }} />}
                  <span
                    className={cn(
                      'relative grid h-7 w-7 place-items-center rounded-full text-12-sb tabular-nums',
                      active ? 'bg-primary text-primary-foreground' : done ? 'bg-type-0/10 text-type-0' : 'bg-surface-2 text-type-2'
                    )}
                  >
                    {done ? <Check size={13} weight="bold" /> : i + 1}
                  </span>
                  <span className="relative">{s.label}</span>
                  <span className="relative hidden text-12-r text-type-3 min-[1680px]:inline">{s.hint}</span>
                </Link>
              </li>
            )
          })}
        </ol>
        <span className="hidden justify-end gap-1 md:flex md:w-[260px] md:shrink-0"><Actions ws={ws} onSettings={onSettings} /></span>
      </div>
    </div>
  )
}

function Actions({ ws, onSettings }) {
  return (
    <>
      <IconButton label="Gallery settings" onClick={onSettings}><GearSix size={18} /></IconButton>
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
