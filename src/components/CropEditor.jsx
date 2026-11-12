import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { clampCrop, imageStyle } from '../lib/crop'
import { cn } from '../lib/utils'

/**
 * Interactive crop stage: drag to pan, wheel / pinch to zoom.
 * The area outside the print is shown dimmed so the client sees what gets trimmed.
 */
export default function CropEditor({ photo, crop, aspect, onChange, className }) {
  const stageRef = useRef(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [dragging, setDragging] = useState(false)
  const pointers = useRef(new Map())
  const start = useRef(null)
  const cropRef = useRef(crop)
  cropRef.current = crop

  useLayoutEffect(() => {
    const el = stageRef.current
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const fw = Math.min(box.w * 0.84, box.h * 0.76 * aspect)
  const fh = fw / aspect

  const commit = (next) => onChange(clampCrop(next, photo, aspect))

  // wheel zoom (needs a non-passive listener to prevent page scroll)
  useEffect(() => {
    const el = stageRef.current
    const onWheel = (e) => {
      e.preventDefault()
      const c = cropRef.current
      commit({ ...c, zoom: c.zoom * (1 - e.deltaY * 0.0015) })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, aspect])

  const snapshot = () => {
    const pts = [...pointers.current.values()]
    const dist = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length
    start.current = { crop: cropRef.current, dist, cx, cy }
  }

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    snapshot()
    setDragging(true)
  }
  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId) || !start.current) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const pts = [...pointers.current.values()]
    const s = start.current
    const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length
    const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length
    let zoom = s.crop.zoom
    if (pts.length > 1 && s.dist) {
      zoom = s.crop.zoom * (Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) / s.dist)
    }
    commit({ zoom, ox: s.crop.ox + (cx - s.cx) / fw, oy: s.crop.oy + (cy - s.cy) / fh })
  }
  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size) snapshot()
    else {
      start.current = null
      setDragging(false)
    }
  }

  const st = imageStyle(photo, crop, aspect)

  return (
    <div
      ref={stageRef}
      className={cn('relative touch-none select-none overflow-hidden', dragging ? 'cursor-grabbing' : 'cursor-grab', className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {fw > 0 && (
        <motion.div
          key={photo.id + aspect}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-1/2 top-1/2"
          style={{ width: fw, height: fh, marginLeft: -fw / 2, marginTop: -fh / 2 }}
        >
          {/* ghost (outside the print area) */}
          <img src={photo.src} alt="" draggable={false} className="pointer-events-none opacity-25" style={st} />
          {/* printed area */}
          <div className="absolute inset-0 overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,.9),0_20px_50px_-20px_rgba(0,0,0,.5)]">
            <img src={photo.src} alt="" draggable={false} className="pointer-events-none" style={st} />
            <div className={cn('pointer-events-none absolute inset-0 transition-opacity duration-300', dragging ? 'opacity-100' : 'opacity-0')}>
              <div className="absolute inset-y-0 left-1/3 w-px bg-white/60" />
              <div className="absolute inset-y-0 left-2/3 w-px bg-white/60" />
              <div className="absolute inset-x-0 top-1/3 h-px bg-white/60" />
              <div className="absolute inset-x-0 top-2/3 h-px bg-white/60" />
            </div>
          </div>
          {/* corner ticks */}
          {['left-0 top-0 border-l-2 border-t-2', 'right-0 top-0 border-r-2 border-t-2', 'left-0 bottom-0 border-l-2 border-b-2', 'right-0 bottom-0 border-r-2 border-b-2'].map((c) => (
            <span key={c} className={cn('pointer-events-none absolute h-4 w-4 border-white', c)} />
          ))}
        </motion.div>
      )}
    </div>
  )
}
