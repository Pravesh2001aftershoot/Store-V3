import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowClockwise, ArrowSquareOut, DesktopTower, DeviceMobile, DeviceTablet } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { PREVIEW_MESSAGE } from '../../lib/embed'
import { Segmented } from '../../gallery/templates/cover/controls'
import { IconButton } from './ui'

/** Device widths the preview renders at. The page is then scaled to fit, so breakpoints are true. */
const DEVICES = [
  { id: 'desktop', label: 'Desktop', icon: DesktopTower, width: 1280 },
  { id: 'tablet', label: 'Tablet', icon: DeviceTablet, width: 820 },
  { id: 'phone', label: 'Phone', icon: DeviceMobile, width: 390 },
]

const withEmbed = (src) => `${src}${src.includes('?') ? '&' : '?'}embed=1`

/**
 * Live preview of a client page in an iframe. Edits reach it through localStorage `storage` events
 * (see lib/persisted.js), so it updates as you type without reloading.
 *
 * `src` — the client page (e.g. "/", "/portfolio"); `target` — the part to show, sent to the page
 * (see lib/embed.js) on load and whenever it changes. `fit` (phones) drops the device switch and
 * renders at the frame's own width.
 */
export default function PreviewFrame({ src, target, fit = false, label = 'Live preview', className }) {
  const [device, setDevice] = useState('desktop')
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [key, setKey] = useState(0) // bump to reload
  const stage = useRef(null)
  const frame = useRef(null)

  useLayoutEffect(() => {
    const el = stage.current
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const send = useCallback(() => {
    if (!target) return
    frame.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, target }, window.location.origin)
  }, [target])
  useEffect(() => { send() }, [send])

  const pad = fit ? 0 : 24
  const width = fit ? box.w : DEVICES.find((d) => d.id === device).width
  const scale = width ? Math.min(1, (box.w - pad * 2) / width) : 1
  const height = Math.max(0, (box.h - pad * 2) / scale)
  const url = withEmbed(src)

  return (
    <div className={cn('flex min-h-0 min-w-0 flex-col bg-surface-2', className)}>
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface-1 px-3">
        <span className="flex min-w-0 items-center gap-2 pl-1">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="truncate text-13-m text-type-0">{label}</span>
        </span>
        <span className="flex-1" />
        {!fit && (
          <div className="w-[132px]">
            <Segmented options={DEVICES.map((d) => ({ id: d.id, label: d.label, icon: d.icon }))} value={device} onChange={setDevice} />
          </div>
        )}
        <IconButton small label="Reload preview" onClick={() => setKey((k) => k + 1)}>
          <ArrowClockwise size={16} />
        </IconButton>
        <IconButton small label="Open in a new tab" onClick={() => window.open(src, '_blank', 'noopener')}>
          <ArrowSquareOut size={16} />
        </IconButton>
      </div>

      <div ref={stage} className="relative min-h-0 flex-1 overflow-hidden">
        {box.w > 0 && (
          <div
            className={cn('absolute left-1/2 top-0 origin-top overflow-hidden bg-surface-0', !fit && 'rounded-xl shadow-[0_1px_2px_rgba(0,0,0,.06),0_24px_60px_-30px_rgba(0,0,0,.35)] ring-1 ring-black/5')}
            style={{ width, height, transform: `translateX(-50%) translateY(${pad}px) scale(${scale})` }}
          >
            <iframe
              key={key}
              ref={frame}
              src={url}
              title={label}
              onLoad={() => setTimeout(send, 400)} // let the page mount before asking it to scroll
              className="h-full w-full border-0"
            />
          </div>
        )}
      </div>
    </div>
  )
}
