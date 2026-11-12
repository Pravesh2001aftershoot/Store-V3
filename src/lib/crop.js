// Crop math. A crop is { zoom, ox, oy } where ox/oy are the image-centre offsets
// expressed as fractions of the frame's width/height. Everything renders with
// percentages, so a crop looks identical at any rendered size.

export const DEFAULT_CROP = { zoom: 1, ox: 0, oy: 0 }

export const coverBase = (photoAspect, frameAspect) =>
  photoAspect > frameAspect ? { w: photoAspect / frameAspect, h: 1 } : { w: 1, h: frameAspect / photoAspect }

export const clampCrop = (crop, photo, frameAspect) => {
  const base = coverBase(photo.w / photo.h, frameAspect)
  const zoom = Math.min(3, Math.max(1, crop.zoom))
  const mx = (base.w * zoom - 1) / 2
  const my = (base.h * zoom - 1) / 2
  return {
    zoom,
    ox: Math.min(mx, Math.max(-mx, crop.ox)),
    oy: Math.min(my, Math.max(-my, crop.oy)),
  }
}

export const imageStyle = (photo, crop, frameAspect) => {
  const c = clampCrop(crop || DEFAULT_CROP, photo, frameAspect)
  const base = coverBase(photo.w / photo.h, frameAspect)
  return {
    position: 'absolute',
    width: `${base.w * c.zoom * 100}%`,
    height: `${base.h * c.zoom * 100}%`,
    left: `${50 + c.ox * 100}%`,
    top: `${50 + c.oy * 100}%`,
    transform: 'translate(-50%, -50%)',
    maxWidth: 'none',
  }
}

/** Effective print resolution for a crop. */
export const printDpi = (photo, crop, frameAspect, inchesW) => {
  const c = clampCrop(crop || DEFAULT_CROP, photo, frameAspect)
  const base = coverBase(photo.w / photo.h, frameAspect)
  const visiblePx = photo.ow / (base.w * c.zoom)
  return Math.round(visiblePx / inchesW)
}

export const quality = (dpi) =>
  dpi >= 200 ? { label: 'Great quality', tone: 'good' } : dpi >= 130 ? { label: 'Good quality', tone: 'ok' } : { label: 'Low resolution', tone: 'low' }
