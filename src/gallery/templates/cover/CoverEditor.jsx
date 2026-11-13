import { useLayoutEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowCounterClockwise, CaretLeft, CaretRight, Check, CircleNotch, Crosshair, Trash, UploadSimple } from '@phosphor-icons/react'
import { Button } from '../../../components/ui'
import { cn } from '../../../lib/utils'
import {
  ALL_TEMPLATES, COMPOSED_TEMPLATES, COMPOSITIONS, CTA_LAYOUT, CTA_SIZE, LIMITS, LOGO_ALIGN, LOGO_PLACEMENT, MARGIN_X, MARGIN_Y, PHOTO_SIZE,
  SHAPES, SURFACES, TEMPLATES, TITLE_SIZE, WIDTH, isComposed, photoCount,
} from './config'
import { FocalPoint, Label, PositionGrid, Section, Segmented, Slider, Swatches, Switch, TextField } from './controls'
import { CENTER, UPLOAD_ID, readImage } from './photo'
import Composed from './Composed'
import EditorPane, { PANE_W, PEEK_H, SHEET_H } from '../editor/EditorPane'

const ease = [0.22, 1, 0.36, 1]
const TABS = [
  { id: 'templates', label: 'Templates' },
  { id: 'layout', label: 'Layout' },
  { id: 'text', label: 'Text' },
  { id: 'photo', label: 'Photo' },
]

export { PANE_W, SHEET_H, PEEK_H }

/**
 * Cover editor. Opens from the left like a mirrored quick buy pane on tablet/desktop,
 * and as a bottom sheet on phones that can collapse to a bar to preview the full cover.
 * There's no dimming backdrop: the cover beside/above it is the live preview.
 */
export default function CoverEditor({ open, onClose, phone, peek, onPeek, gallery, photo, cover, media, photos = [], collections = [] }) {
  const [tab, setTab] = useState('templates')
  const name = ALL_TEMPLATES.find((t) => t.id === cover.template)?.name ?? 'Custom'

  return (
    <EditorPane
      open={open}
      onClose={onClose}
      phone={phone}
      peek={peek}
      onPeek={onPeek}
      title="Customize cover"
      subtitle={`Template: ${name}`}
      previewLabel="Preview cover"
      tabs={TABS}
      tab={tab}
      onTab={setTab}
      onReset={() => { cover.reset(); media?.reset() }}
    >
      {tab === 'templates' && <TemplatesTab cover={cover} photo={photo} slots={media.slots} gallery={gallery} />}
      {tab === 'layout' && <LayoutTab cover={cover} photo={photo} />}
      {tab === 'text' && <TextTab cover={cover} />}
      {tab === 'photo' && <PhotoTab cover={cover} media={media} photos={photos} collections={collections} />}
    </EditorPane>
  )
}

// ── Templates ───────────────────────────────────────────────────────────────

function TemplatesTab({ cover, photo, slots, gallery }) {
  const card = (t, thumb) => {
    const active = cover.template === t.id
    return (
      <button key={t.id} onClick={() => cover.applyTemplate(t.id)} aria-pressed={active} className="group text-left">
        <div className={cn('relative rounded-xl p-0.5 ring-1 transition', active ? 'ring-2 ring-type-0' : 'ring-border group-hover:ring-type-3')}>
          {thumb}
          {active && (
            <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-white text-type-0 shadow">
              <Check size={12} weight="bold" />
            </span>
          )}
        </div>
        <p className="mt-2 text-13-m text-type-0">{t.name}</p>
        <p className="text-12-r text-type-2">{t.description}</p>
      </button>
    )
  }
  return (
    <div>
      <p className="mb-4 text-12-r text-type-2">Start from a template, then fine-tune it under Layout and Text. Your words are kept.</p>
      <div className="grid grid-cols-2 gap-3">
        {TEMPLATES.map((t) => card(t, <FullBleedThumb template={t} photo={photo} gallery={gallery} content={cover.config.content} />))}
        {COMPOSED_TEMPLATES.map((t) => card(t, <ComposedThumb template={t} slots={slots} gallery={gallery} content={cover.config.content} />))}
      </div>
    </div>
  )
}

/** A cover rendered at a desktop size and scaled down to fit the card, so thumbnails look like the real thing. */
const VW = 1200
function ScaledThumb({ className, children }) {
  const ref = useRef(null)
  const [scale, setScale] = useState(0.14)
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / VW))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={ref} inert className={cn('relative aspect-[4/3] overflow-hidden rounded-[10px]', className)}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: VW, height: VW * 0.75, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}

function ComposedThumb({ template, slots, gallery, content }) {
  return (
    <ScaledThumb className="bg-surface-2">
      <Composed gallery={gallery} slots={slots} config={{ layout: template.layout, show: template.show, content }} still />
    </ScaledThumb>
  )
}

/** A still of the full-bleed cover: photo, gradient, logo, then eyebrow, title, subtitle and buttons at the bottom. */
function FullBleedThumb({ template, photo, gallery, content: C }) {
  const { show } = template
  return (
    <ScaledThumb className="bg-type-0">
      {photo && (
        <img
          src={photo.thumb ?? photo.src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: photo.focus ? `${photo.focus.x}% ${photo.focus.y}%` : undefined }}
          draggable={false}
        />
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,.35), rgba(0,0,0,.1) 45%, rgba(0,0,0,.65))' }} />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-8 py-6">
        <img src={gallery.logo} alt="" className="h-9 w-auto brightness-0 invert" draggable={false} />
        {show.storeLink && <span className="rounded-full border border-white/40 px-5 py-2.5 text-[16px] font-medium text-white">Print store</span>}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-8 pb-16 text-center text-white">
        {show.eyebrow && C.eyebrow && <p className="mb-5 text-16-sb uppercase text-white/75">{C.eyebrow}</p>}
        <p className="text-[84px] font-semibold leading-none">{C.title || gallery.client}</p>
        {show.subtitle && C.subtitle && <p className="mt-5 text-[22px] text-white/80">{C.subtitle}</p>}
        <div className="mt-10 flex gap-4">
          {show.primaryCta && C.primaryCta && <span className="rounded-full bg-white px-9 py-4 text-[20px] font-medium text-type-0">{C.primaryCta}</span>}
          {show.secondaryCta && C.secondaryCta && <span className="rounded-full border border-white/40 px-9 py-4 text-[20px] font-medium">{C.secondaryCta}</span>}
        </div>
      </div>
    </ScaledThumb>
  )
}

// ── Layout ──────────────────────────────────────────────────────────────────

function LayoutTab({ cover, photo }) {
  const { layout: L } = cover.config
  const set = cover.setLayout
  if (isComposed(L)) return <ComposedLayout cover={cover} photo={photo} />
  return (
    <div>
      <Section title="Text" hint="Tap where the title block should sit.">
        <PositionGrid value={L.position} onChange={(position) => set({ position })} photo={photo} />
        <Segmented label="Title size" options={TITLE_SIZE} value={L.titleSize} onChange={(titleSize) => set({ titleSize })} />
        <Segmented label="Text width" options={WIDTH} value={L.width} onChange={(width) => set({ width })} />
      </Section>

      <LogoSection value={L.logo} onChange={(logo) => set({ logo })} />

      <MarginsSection L={L} set={set} />

      <Section title="Overlay" hint="Darkens the photo behind the text so it stays readable.">
        <Slider label="Strength" min={0} max={100} step={5} value={L.overlay} onChange={(overlay) => set({ overlay })} format={(v) => `${v}%`} />
      </Section>
    </div>
  )
}

/** Logo as three settings: show/hide, placement (top bar or in the text), and top-bar alignment. */
function LogoSection({ value, onChange }) {
  const shown = value !== 'hidden'
  const inBar = value.startsWith('top-')
  // Remember the last top-bar alignment so switching placement or hiding doesn't lose it.
  const [lastBar, setLastBar] = useState(inBar ? value : 'top-left')
  const [lastShown, setLastShown] = useState(shown ? value : 'top-left')
  const change = (next) => {
    if (next.startsWith('top-')) setLastBar(next)
    if (next !== 'hidden') setLastShown(next)
    onChange(next)
  }
  return (
    <Section title="Logo">
      <div className="flex items-center justify-between gap-3">
        <Label>Show logo</Label>
        <Switch checked={shown} onChange={(on) => change(on ? lastShown : 'hidden')} label="Show logo" />
      </div>
      {shown && (
        <>
          <Segmented label="Placement" options={LOGO_PLACEMENT} value={inBar ? 'top' : 'inline'} onChange={(p) => change(p === 'top' ? lastBar : 'inline')} />
          {inBar && <Segmented label="Alignment" options={LOGO_ALIGN} value={value} onChange={change} />}
        </>
      )}
    </Section>
  )
}

function MarginsSection({ L, set }) {
  return (
    <Section title="Margins" hint="Distance from the edges on a desktop screen. Scales down on smaller screens.">
      <Slider label="Left & right" {...MARGIN_X} value={L.marginX} onChange={(marginX) => set({ marginX })} format={(v) => `${v}px`} />
      <Slider label="Top & bottom" {...MARGIN_Y} value={L.marginY} onChange={(marginY) => set({ marginY })} format={(v) => `${v}px`} />
    </Section>
  )
}

/** What "Flip sides" does, per composition. */
const FLIP_HINT = {
  banner: 'Title on the right, logo on the left',
  split: 'Photo on the left, title on the right',
  strip: 'Title panel on the right',
  corner: 'Photo top left, title bottom right',
}
const LOGO_TOGGLE = [{ id: 'top-left', label: 'Show' }, { id: 'hidden', label: 'Hide' }]
const orientation = (p) => (!p?.w || !p?.h ? null : p.w > p.h * 1.05 ? 'landscape' : p.h > p.w * 1.05 ? 'portrait' : 'square')

/** Layout controls for composed covers: the photo's shape and size, sides, backdrop. */
function ComposedLayout({ cover, photo }) {
  const { layout: L } = cover.config
  const set = cover.setLayout
  const meta = COMPOSITIONS[L.composition]
  const found = orientation(photo)
  const shapes = SHAPES.map((s) => (s.id === 'auto' && found ? { ...s, hint: `Follows the photo — this one is ${found}` } : s))
  return (
    <div>
      <Section title="Photo" hint={`${meta.name} layout. Switch layouts under Templates.`}>
        {meta.shape && <Segmented label="Shape" options={shapes} value={L.shape} onChange={(shape) => set({ shape })} />}
        <Segmented label={L.composition === 'split' ? 'Photo width' : 'Size'} options={PHOTO_SIZE} value={L.photoSize} onChange={(photoSize) => set({ photoSize })} />
        {meta.flip && (
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label>Flip sides</Label>
              <p className="-mt-1.5 text-12-r text-type-2">{FLIP_HINT[L.composition]}</p>
            </div>
            <Switch checked={L.flip} onChange={(flip) => set({ flip })} label="Flip sides" />
          </div>
        )}
      </Section>

      <Section title="Background">
        <Swatches label="Background" options={SURFACES} value={L.surface} onChange={(surface) => set({ surface })} />
      </Section>

      <Section title="Text">
        <Segmented label="Title size" options={TITLE_SIZE} value={L.titleSize} onChange={(titleSize) => set({ titleSize })} />
      </Section>

      <Section title="Logo">
        <Segmented options={LOGO_TOGGLE} value={L.logo === 'hidden' ? 'hidden' : 'top-left'} onChange={(logo) => set({ logo })} />
      </Section>

      <MarginsSection L={L} set={set} />
    </div>
  )
}

// ── Text ────────────────────────────────────────────────────────────────────

function TextTab({ cover }) {
  const { content: C, show, layout: L } = cover.config
  const anyCta = show.primaryCta || show.secondaryCta
  const text = (key) => ({ value: C[key] ?? '', onChange: (v) => cover.setContent({ [key]: v }), limit: LIMITS[key] })
  const toggle = (key) => ({ enabled: show[key], onToggle: (on) => cover.setShow({ [key]: on }) })
  return (
    <div>
      <Section title="Heading">
        <TextField label="Eyebrow" hint="Small line above the title" {...text('eyebrow')} {...toggle('eyebrow')} />
        <TextField label="Title" hint="Usually the client’s names" required {...text('title')} />
        <TextField label="Subtitle" hint="Your name links to your portfolio" multiline {...text('subtitle')} {...toggle('subtitle')} />
      </Section>

      <Section title="Buttons">
        <TextField label="Primary button" hint="Scrolls to the photos" {...text('primaryCta')} {...toggle('primaryCta')} />
        <TextField label="Secondary button" hint="Opens the print store" {...text('secondaryCta')} {...toggle('secondaryCta')} />
        <div className={cn('space-y-3', !anyCta && 'pointer-events-none opacity-50')} aria-disabled={!anyCta}>
          <Segmented label="Arrangement" options={CTA_LAYOUT} value={L.ctaLayout} onChange={(ctaLayout) => cover.setLayout({ ctaLayout })} />
          <Segmented label="Size" options={CTA_SIZE} value={L.ctaSize} onChange={(ctaSize) => cover.setLayout({ ctaSize })} />
        </div>
      </Section>

      <Section title="Top bar">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label>Print store link</Label>
            <p className="-mt-1.5 text-12-r text-type-2">Shown opposite the logo</p>
          </div>
          <Switch checked={show.storeLink} onChange={(storeLink) => cover.setShow({ storeLink })} label="Show print store link" />
        </div>
      </Section>
    </div>
  )
}

// ── Photo ───────────────────────────────────────────────────────────────────
//
// Three steps, the same for every template:
//   1. On the cover — the photo(s) the current layout uses (1 for full-bleed, up to 3 for composed).
//   2. Choose photo — pick from this gallery or upload one, for the spot tapped in step 1.
//   3. Focal point — what stays in view when that photo is cropped.

const PAGE = 36
const STEPS = ['On the cover', 'Choose photo', 'Focal point']
const spotName = (i, count) => (count === 1 ? 'Cover photo' : i === 0 ? 'Main photo' : `Photo ${i + 1}`)
const sourceOf = (p) => (p.id === UPLOAD_ID ? `Uploaded · ${p.name ?? 'image'}` : p.name ? `Gallery · ${p.name}` : 'From this gallery')

function PhotoTab({ cover, media, photos, collections }) {
  const count = photoCount(cover.config.layout)
  const [view, setView] = useState({ step: 0, slot: 0 })
  // A template switch can drop the spot being edited; fall back to the overview.
  const valid = view.slot < count
  const step = valid ? view.step : 0
  const slot = valid ? view.slot : 0
  const go = (next, s = slot) => setView({ step: next, slot: s })
  const photo = media.slots[slot]
  const name = spotName(slot, count)

  // Each step starts at the top of the pane.
  const root = useRef(null)
  useLayoutEffect(() => {
    root.current?.closest('.overflow-y-auto')?.scrollTo({ top: 0 })
  }, [step, slot])

  return (
    <div ref={root}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${step}-${slot}`}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.18, ease }}
        >
          {step > 0 && <StepHeader step={step} title={name} onBack={() => go(step - 1)} />}
          {step === 0 && <PhotoOverview count={count} slots={media.slots} composed={isComposed(cover.config.layout)} onChange={(i) => go(1, i)} onFocus={(i) => go(2, i)} />}
          {step === 1 && <PhotoSource media={media} slot={slot} count={count} photos={photos} collections={collections} composed={isComposed(cover.config.layout)} onChosen={() => go(2)} />}
          {step === 2 && (
            <PhotoFocus
              media={media}
              photo={photo}
              onChange={() => go(1)}
              onDone={() => go(0)}
              next={slot < count - 1 ? { label: spotName(slot + 1, count), go: () => go(2, slot + 1) } : null}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function StepHeader({ step, title, onBack }) {
  return (
    <div className="mb-1 flex items-start gap-2 border-b border-border pb-4">
      <button
        onClick={onBack}
        className="-ml-2 grid h-8 w-8 shrink-0 place-items-center rounded-full text-type-1 transition hover:bg-surface-2 hover:text-type-0"
        aria-label={`Back to ${STEPS[step - 1].toLowerCase()}`}
      >
        <CaretLeft size={16} />
      </button>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-11-sb uppercase text-type-2">Step {step + 1} of {STEPS.length} · {title}</p>
        <p className="text-16-sb text-type-0">{STEPS[step]}</p>
        <div className="mt-2.5 grid grid-cols-3 gap-1" aria-hidden>
          {STEPS.map((s, i) => <span key={s} className={cn('h-1 rounded-full transition-colors', i <= step ? 'bg-type-0' : 'bg-border')} />)}
        </div>
      </div>
    </div>
  )
}

/** Step 1: the photos the current template shows. Tap one to replace it, or jump straight to its focal point. */
function PhotoOverview({ count, slots, composed, onChange, onFocus }) {
  return (
    <Section
      title={count > 1 ? `Photos in this layout · ${count}` : 'Cover photo'}
      hint={count > 1 ? 'Tap a photo to replace it. Each spot keeps its own focal point.' : composed ? 'Tap to replace it.' : 'Tap to replace it. Landscape works best.'}
    >
      <div className="space-y-2">
        {slots.slice(0, count).map((p, i) => (
          <div key={i} className="group flex items-center gap-1 rounded-xl ring-1 ring-border transition hover:ring-type-3">
            <button onClick={() => onChange(i)} className="flex min-w-0 flex-1 items-center gap-3 p-2 text-left" aria-label={`Change ${spotName(i, count).toLowerCase()}`}>
              <span className="relative block h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                <img src={p.thumb ?? p.src} alt="" draggable={false} className="h-full w-full object-cover" style={{ objectPosition: `${p.focus.x}% ${p.focus.y}%` }} />
                {count > 1 && <span className="absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-white text-11-sb text-type-0 shadow">{i + 1}</span>}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-13-m text-type-0">{spotName(i, count)}</span>
                <span className="block truncate text-12-r text-type-2">{sourceOf(p)}</span>
                <span className="mt-0.5 block text-12-m text-type-3 transition group-hover:text-type-1">Change photo</span>
              </span>
            </button>
            <button
              onClick={() => onFocus(i)}
              className="mr-2 grid h-9 w-9 shrink-0 place-items-center rounded-full text-type-2 transition hover:bg-surface-2 hover:text-type-0"
              aria-label={`Set focal point for ${spotName(i, count).toLowerCase()}`}
              title="Focal point"
            >
              <Crosshair size={17} />
            </button>
          </div>
        ))}
      </div>
    </Section>
  )
}

const SOURCES = [{ id: 'gallery', label: 'From gallery' }, { id: 'upload', label: 'Upload' }]

/** Step 2: pick from this gallery, or upload an image. Choosing moves on to the focal point. */
function PhotoSource({ media, slot, count, photos, collections, composed, onChosen }) {
  const photo = media.slots[slot]
  const { upload } = media
  const [source, setSource] = useState(photo.id === UPLOAD_ID ? 'upload' : 'gallery')
  const [filter, setFilter] = useState('All')
  const [limit, setLimit] = useState(PAGE)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const input = useRef(null)
  const usedIn = (id) => media.slots.slice(0, count).findIndex((p) => p.id === id)

  const list = filter === 'All' ? photos : photos.filter((p) => p.collection === filter)
  const shown = list.slice(0, limit)

  const pick = (id) => { media.choose(id, slot); onChosen() }

  const takeFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('That file isn’t an image. Try a JPG, PNG or WebP.')
    setError(null)
    setBusy(true)
    try {
      const img = await readImage(file)
      media.setUpload({ ...img, name: file.name }, slot)
      onChosen()
    } catch {
      setError('We couldn’t read that image. Try another file.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="pt-4">
        <Segmented options={SOURCES} value={source} onChange={setSource} />
      </div>

      {source === 'gallery' && (
        <Section title="From this gallery" hint={`${list.length} photos · tap one to use it`} className="border-b-0">
          <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            {['All', ...collections].map((c) => (
              <button
                key={c}
                onClick={() => { setFilter(c); setLimit(PAGE) }}
                aria-pressed={filter === c}
                className={cn(
                  'h-8 shrink-0 rounded-full px-3 text-12-m transition',
                  filter === c ? 'bg-type-0 text-white' : 'bg-surface-2 text-type-1 hover:bg-[#ececec]'
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {shown.map((p) => {
              const active = photo.id === p.id
              const elsewhere = count > 1 && !active ? usedIn(p.id) : -1
              return (
                <button
                  key={p.id}
                  onClick={() => pick(p.id)}
                  aria-pressed={active}
                  aria-label={`Use ${p.name}`}
                  className={cn('relative aspect-square overflow-hidden rounded-lg bg-surface-2 transition', active ? 'ring-2 ring-type-0 ring-offset-2' : 'hover:opacity-85')}
                >
                  <img src={p.thumb ?? p.src} alt="" loading="lazy" className="h-full w-full object-cover" draggable={false} />
                  {active && (
                    <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-white text-type-0 shadow">
                      <Check size={12} weight="bold" />
                    </span>
                  )}
                  {elsewhere >= 0 && (
                    <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/55 text-11-sb text-white">{elsewhere + 1}</span>
                  )}
                </button>
              )
            })}
          </div>
          {list.length > shown.length && (
            <Button variant="secondary" size="sm" className="w-full" onClick={() => setLimit((l) => l + PAGE)}>
              Show more ({list.length - shown.length})
            </Button>
          )}
        </Section>
      )}

      {source === 'upload' && (
        <Section title="Upload" hint={composed ? 'Use a photo that isn’t in this gallery.' : 'Use a photo that isn’t in this gallery. Landscape works best.'} className="border-b-0">
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { takeFile(e.target.files?.[0]); e.target.value = '' }}
          />
          <button
            onClick={() => input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); takeFile(e.dataTransfer.files?.[0]) }}
            disabled={busy}
            className={cn(
              'flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-8 text-center transition',
              dragging ? 'border-type-0 bg-surface-2' : 'border-border hover:border-type-3 hover:bg-surface-2'
            )}
          >
            {busy ? <CircleNotch size={22} className="animate-spin text-type-2" /> : <UploadSimple size={22} className="text-type-2" />}
            <span className="text-13-m text-type-0">{busy ? 'Preparing image…' : upload ? 'Upload a different image' : 'Upload from computer'}</span>
            <span className="text-12-r text-type-3">or drop an image here</span>
          </button>
          {error && <p className="text-12-r text-destructive">{error}</p>}

          {upload && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => pick(UPLOAD_ID)}
                aria-pressed={photo.id === UPLOAD_ID}
                className={cn('relative h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-offset-2 transition', photo.id === UPLOAD_ID ? 'ring-2 ring-type-0' : 'ring-1 ring-border hover:ring-type-3')}
                aria-label="Use uploaded photo"
              >
                <img src={upload.thumb} alt="" className="h-full w-full object-cover" draggable={false} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-13-m text-type-0">{upload.name}</p>
                <p className="text-12-r text-type-2">
                  {photo.id === UPLOAD_ID ? 'In this spot' : usedIn(UPLOAD_ID) >= 0 ? `In spot ${usedIn(UPLOAD_ID) + 1} · tap to use here` : 'Uploaded · tap to use'}
                </p>
              </div>
              <button
                onClick={media.removeUpload}
                className="grid h-8 w-8 place-items-center rounded-full text-type-2 transition hover:bg-surface-2 hover:text-type-0"
                aria-label="Remove uploaded photo"
              >
                <Trash size={15} />
              </button>
            </div>
          )}
        </Section>
      )}
    </div>
  )
}

/** Step 3: the focal point for the chosen photo. Changes apply to the cover live. */
function PhotoFocus({ media, photo, onChange, onDone, next }) {
  const focus = photo.focus ?? CENTER
  const centered = focus.x === CENTER.x && focus.y === CENTER.y
  return (
    <div>
      <Section title="Selected photo" className="pt-4">
        <div className="flex items-center gap-3">
          <img src={photo.thumb ?? photo.src} alt="" draggable={false} className="h-10 w-14 shrink-0 rounded-md object-cover" />
          <p className="min-w-0 flex-1 truncate text-13-r text-type-1">{sourceOf(photo)}</p>
          <Button variant="ghost" size="sm" className="-mr-2" onClick={onChange}>Change</Button>
        </div>
      </Section>

      <Section title="Focal point" hint="Tap or drag to the part that should stay in view when the photo is cropped.">
        <FocalPoint photo={photo} value={focus} onChange={(point) => media.setFocus(photo.id, point)} />
        <div className="flex items-center justify-between gap-3">
          <p className="text-12-r tabular-nums text-type-2">{focus.x}% across · {focus.y}% down</p>
          <Button variant="ghost" size="sm" className="-mr-2" disabled={centered} onClick={() => media.setFocus(photo.id, CENTER)}>
            <ArrowCounterClockwise size={14} /> Center
          </Button>
        </div>
      </Section>

      <div className="flex gap-2 pt-1">
        {next && (
          <Button variant="secondary" size="md" className="flex-1" onClick={next.go}>
            Next: {next.label} <CaretRight size={14} />
          </Button>
        )}
        <Button variant={next ? 'ghost' : 'secondary'} size="md" className="flex-1" onClick={onDone}>
          <Check size={15} weight="bold" /> {next ? 'Back to photos' : 'Done'}
        </Button>
      </div>
    </div>
  )
}
