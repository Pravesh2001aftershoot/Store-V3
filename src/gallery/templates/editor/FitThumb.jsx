import { useLayoutEffect, useRef, useState } from 'react'

/** Renders its children at a desktop width (`width`) and scales them down to the card, at their true height. */
export default function FitThumb({ children, width = 1280 }) {
  const box = useRef(null)
  const inner = useRef(null)
  const [size, setSize] = useState({ scale: 0.27, h: 600 })
  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => {
      setSize({ scale: box.current.offsetWidth / width, h: inner.current.offsetHeight })
    })
    ro.observe(box.current)
    ro.observe(inner.current)
    return () => ro.disconnect()
  }, [width])
  return (
    <div ref={box} inert className="relative overflow-hidden rounded-[10px] bg-surface-2" style={{ height: size.h * size.scale }}>
      <div ref={inner} className="absolute left-0 top-0 origin-top-left" style={{ width, transform: `scale(${size.scale})` }}>
        {children}
      </div>
    </div>
  )
}
