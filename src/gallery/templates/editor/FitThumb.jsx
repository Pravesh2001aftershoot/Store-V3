import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '../../../lib/utils'

/**
 * Renders its children at a desktop width (`width`) and scales them down to the card.
 * Without `aspect` the card takes the content's true height. With `aspect` (e.g. '3/1') every card
 * is the same size and the content is centred in it, shrunk further if it would be too tall to fit.
 */
export default function FitThumb({ children, width = 1280, aspect, className }) {
  const box = useRef(null)
  const inner = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 600, boxH: 0 })
  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => {
      setSize({ w: box.current.offsetWidth, h: inner.current.offsetHeight, boxH: box.current.offsetHeight })
    })
    ro.observe(box.current)
    ro.observe(inner.current)
    return () => ro.disconnect()
  }, [width])
  const fitW = size.w / width || 0.27
  const scale = aspect && size.boxH ? Math.min(fitW, size.boxH / size.h) : fitW
  const top = aspect ? Math.max(0, (size.boxH - size.h * scale) / 2) : 0
  const left = aspect ? Math.max(0, (size.w - width * scale) / 2) : 0
  return (
    <div
      ref={box}
      inert
      className={cn('relative overflow-hidden rounded-[10px] bg-surface-2', className)}
      style={aspect ? { aspectRatio: aspect } : { height: size.h * scale }}
    >
      <div ref={inner} className="absolute origin-top-left" style={{ top, left, width, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}
