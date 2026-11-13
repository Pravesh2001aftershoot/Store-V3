import { useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowCounterClockwise, CaretDown, CaretUp, Check, CircleNotch, TextAlignCenter, TextAlignLeft, TextAlignRight, Trash, UploadSimple, X } from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import { cn } from '../../lib/utils'
import { CTA_LAYOUT, CTA_SIZE, LIMITS, LOGO, MARGIN_X, MARGIN_Y, TEMPLATES, TITLE_SIZE, WIDTH } from './config'
import { Label, PositionGrid, Section, Segmented, Slider, Switch, TextField } from './controls'
import { UPLOAD_ID, readImage } from './photo'

const ease = [0.22, 1, 0.36, 1]
const TABS = [
  { id: 'templates', label: 'Templates' },
  { id: 'layout', label: 'Layout' },
  { id: 'text', label: 'Text' },
  { id: 'photo', label: 'Photo' },
]
const ALIGN_ICONS = [
  { id: 'left', label: 'Align left', icon: TextAlignLeft },
  { id: 'center', label: 'Align center', icon: TextAlignCenter },
  { id: 'right', label: 'Align right', icon: TextAlignRight },
]

/** Pane width on tablet/desktop. CoverSection uses it to shift the cover preview clear of the pane. */
export const PANE_W = 400
/** Phone: open sheet height, and the collapsed bar height when previewing. */
export const SHEET_H = '58svh'
export const PEEK_H = 64

/**
 * Cover editor. Opens from the left like a mirrored quick buy pane on tablet/desktop,
 * and as a bottom sheet on phones that can collapse to a bar to preview the full cover.
 * There's no dimming backdrop: the cover beside/above it is the live preview.
 */
export default function CoverEditor({ open, onClose, phone, peek, onPeek, photo, cover, media, photos = [], collections = [] }) {
  const [tab, setTab] = useState('templates')

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Transparent: blocks clicks on the preview without hiding it. */}
            <Dialog.Overlay className="fixed inset-0 z-50" />
            <Dialog.Content
              asChild
              aria-describedby={undefined}
              // Taps on the preview shouldn't throw away the panel; Done / Esc / ✕ close it.
              onInteractOutside={(e) => e.preventDefault()}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <motion.div
                initial={phone ? { y: '100%' } : { x: '-100%' }}
                animate={phone ? { y: 0 } : { x: 0 }}
                exit={phone ? { y: '100%' } : { x: '-110%' }}
                transition={{ duration: 0.55, ease }}
                className={cn(
                  'fixed z-50 flex flex-col bg-surface-1 shadow-2xl outline-none',
                  phone
                    ? 'inset-x-0 bottom-0 rounded-t-2xl transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]'
                    : 'inset-y-2 left-2 rounded-2xl'
                )}
                style={phone ? { height: peek ? PEEK_H : SHEET_H } : { width: PANE_W }}
              >
                <Header phone={phone} peek={peek} onPeek={onPeek} tab={tab} onTab={setTab} template={cover.template} />
                <div className={cn('min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5', phone && peek && 'invisible')}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={tab}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2, ease }}
                      className="pb-6 pt-4"
                    >
                      {tab === 'templates' && <TemplatesTab cover={cover} photo={photo} />}
                      {tab === 'layout' && <LayoutTab cover={cover} photo={photo} />}
                      {tab === 'text' && <TextTab cover={cover} />}
                      {tab === 'photo' && <PhotoTab media={media} photos={photos} collections={collections} />}
                    </motion.div>
                  </AnimatePresence>
                </div>
                {!(phone && peek) && (
                  <div className="flex items-center gap-2 border-t border-border px-5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
                    <Button variant="ghost" size="sm" onClick={() => { cover.reset(); media?.reset() }} className="-ml-2">
                      <ArrowCounterClockwise size={14} /> Reset all
                    </Button>
                    <span className="flex-1" />
                    <Button size="md" onClick={onClose}>
                      <Check size={15} weight="bold" /> Done
                    </Button>
                  </div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

function Header({ phone, peek, onPeek, tab, onTab, template }) {
  const name = TEMPLATES.find((t) => t.id === template)?.name ?? 'Custom'
  return (
    <div className={cn('shrink-0 px-5', !(phone && peek) && 'border-b border-border pb-3')}>
      {phone && (
        <button onClick={() => onPeek(!peek)} className="flex w-full justify-center pb-1 pt-2.5" aria-label={peek ? 'Show settings' : 'Preview cover'}>
          <span className="h-1 w-10 rounded-full bg-border" />
        </button>
      )}
      <div className={cn('flex items-center gap-2', phone ? 'pt-0.5' : 'pt-4')}>
        <div className="min-w-0 flex-1">
          <Dialog.Title className="truncate text-16-sb">Customize cover</Dialog.Title>
          <p className="truncate text-12-r text-type-2">Template: {name}</p>
        </div>
        {phone && (
          <button
            onClick={() => onPeek(!peek)}
            className="flex h-9 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-12-m transition hover:bg-[#ececec]"
          >
            {peek ? <><CaretUp size={14} /> Edit</> : <><CaretDown size={14} /> Preview</>}
          </button>
        )}
        <Dialog.Close className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 transition hover:bg-[#ececec]" aria-label="Close">
          <X size={16} />
        </Dialog.Close>
      </div>
      {!(phone && peek) && (
        <div role="tablist" className="mt-3 grid grid-cols-4 gap-1 rounded-full bg-surface-2 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => onTab(t.id)}
              className={cn('relative h-8 rounded-full text-13-m text-type-2 transition hover:text-type-0', tab === t.id && 'text-type-0')}
            >
              {tab === t.id && <motion.span layoutId="cover-tab" className="absolute inset-0 rounded-full bg-surface-1 shadow-[0_1px_2px_rgba(0,0,0,.08)]" transition={{ duration: 0.35, ease }} />}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Templates ───────────────────────────────────────────────────────────────

function TemplatesTab({ cover, photo }) {
  return (
    <div>
      <p className="mb-3 text-12-r text-type-2">Start from a template, then fine-tune it under Layout and Text. Your words are kept.</p>
      <div className="grid grid-cols-2 gap-3">
        {TEMPLATES.map((t) => {
          const active = cover.template === t.id
          return (
            <button
              key={t.id}
              onClick={() => cover.applyTemplate(t.id)}
              aria-pressed={active}
              className="group text-left"
            >
              <div className={cn('relative rounded-xl p-0.5 ring-1 transition', active ? 'ring-2 ring-type-0' : 'ring-border group-hover:ring-type-3')}>
                <TemplateThumb template={t} photo={photo} />
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
        })}
      </div>
    </div>
  )
}

/** A wireframe of the template over the cover photo: logo, eyebrow, title, subtitle and buttons as bars. */
function TemplateThumb({ template, photo }) {
  const { layout: L, show } = template
  const [v, h] = L.position.split('-')
  const items = { left: 'items-start', center: 'items-center', right: 'items-end' }[L.align]
  const pad = { x: 6 + L.marginX / 8, y: 6 + L.marginY / 10 }
  const title = { s: 'h-2 w-12', m: 'h-2.5 w-16', l: 'h-3.5 w-20' }[L.titleSize]
  const logoBar = <span className="block h-1.5 w-6 rounded-full bg-white/90" />
  const store = show.storeLink && <span className="block h-2.5 w-8 rounded-full border border-white/60" />
  const right = L.logo === 'top-right'
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-type-0">
      {photo && <img src={photo.thumb ?? photo.src} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />}
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${0.15 + L.overlay / 200})` }} />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-2 py-2">
        <span>{L.logo === 'top-left' ? logoBar : right ? store : null}</span>
        <span>{L.logo === 'top-center' && logoBar}</span>
        <span>{right ? logoBar : store}</span>
      </div>
      <div
        className={cn('absolute inset-0 flex flex-col', { top: 'justify-start', middle: 'justify-center', bottom: 'justify-end' }[v], { left: 'items-start', center: 'items-center', right: 'items-end' }[h])}
        style={{ padding: `${v === 'top' ? pad.y + 12 : pad.y}px ${pad.x}px ${pad.y}px` }}
      >
        <div className={cn('flex flex-col gap-1', items)}>
          {L.logo === 'inline' && <span className="mb-0.5 h-1.5 w-6 rounded-full bg-white/90" />}
          {show.eyebrow && <span className="h-1 w-10 rounded-full bg-white/60" />}
          <span className={cn('rounded-sm bg-white', title)} />
          {show.subtitle && <span className="h-1 w-12 rounded-full bg-white/60" />}
          {(show.primaryCta || show.secondaryCta) && (
            <span className={cn('mt-1 flex gap-1', L.ctaLayout === 'stack' && 'flex-col')}>
              {show.primaryCta && <span className="h-2.5 w-9 rounded-full bg-white" />}
              {show.secondaryCta && <span className="h-2.5 w-9 rounded-full border border-white/70" />}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Layout ──────────────────────────────────────────────────────────────────

function LayoutTab({ cover, photo }) {
  const { layout: L, show } = cover.config
  const set = cover.setLayout
  const anyCta = show.primaryCta || show.secondaryCta
  return (
    <div>
      <Section title="Text" hint="Tap where the title block should sit.">
        <PositionGrid value={L.position} onChange={(position) => set({ position })} photo={photo} />
        <Segmented label="Alignment" options={ALIGN_ICONS} value={L.align} onChange={(align) => set({ align })} />
        <Segmented label="Title size" options={TITLE_SIZE} value={L.titleSize} onChange={(titleSize) => set({ titleSize })} />
        <Segmented label="Text width" options={WIDTH} value={L.width} onChange={(width) => set({ width })} />
      </Section>

      <Section title="Logo">
        <Segmented options={LOGO} value={L.logo} onChange={(logo) => set({ logo })} />
      </Section>

      <Section title="Buttons" hint={anyCta ? undefined : 'Both buttons are hidden. Turn them on under Text.'}>
        <div className={cn('space-y-3', !anyCta && 'pointer-events-none opacity-50')}>
          <Segmented label="Arrangement" options={CTA_LAYOUT} value={L.ctaLayout} onChange={(ctaLayout) => set({ ctaLayout })} />
          <Segmented label="Size" options={CTA_SIZE} value={L.ctaSize} onChange={(ctaSize) => set({ ctaSize })} />
        </div>
      </Section>

      <Section title="Margins" hint="Distance from the edges on a desktop screen. Scales down on smaller screens.">
        <Slider label="Left & right" {...MARGIN_X} value={L.marginX} onChange={(marginX) => set({ marginX })} format={(v) => `${v}px`} />
        <Slider label="Top & bottom" {...MARGIN_Y} value={L.marginY} onChange={(marginY) => set({ marginY })} format={(v) => `${v}px`} />
      </Section>

      <Section title="Overlay" hint="Darkens the photo behind the text so it stays readable.">
        <Slider label="Strength" min={0} max={100} step={5} value={L.overlay} onChange={(overlay) => set({ overlay })} format={(v) => `${v}%`} />
      </Section>
    </div>
  )
}

// ── Text ────────────────────────────────────────────────────────────────────

function TextTab({ cover }) {
  const { content: C, show } = cover.config
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

const PAGE = 36

function PhotoTab({ media, photos, collections }) {
  const [filter, setFilter] = useState('All')
  const [limit, setLimit] = useState(PAGE)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const input = useRef(null)
  const { photo, upload } = media

  const list = filter === 'All' ? photos : photos.filter((p) => p.collection === filter)
  const shown = list.slice(0, limit)

  const takeFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('That file isn’t an image. Try a JPG, PNG or WebP.')
    setError(null)
    setBusy(true)
    try {
      const img = await readImage(file)
      media.setUpload({ ...img, name: file.name })
    } catch {
      setError('We couldn’t read that image. Try another file.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <Section title="Upload" hint="Use a photo that isn’t in this gallery. Landscape works best.">
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
            'flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-5 text-center transition',
            dragging ? 'border-type-0 bg-surface-2' : 'border-border hover:border-type-3 hover:bg-surface-2'
          )}
        >
          {busy ? <CircleNotch size={20} className="animate-spin text-type-2" /> : <UploadSimple size={20} className="text-type-2" />}
          <span className="text-13-m text-type-0">{busy ? 'Preparing image…' : 'Upload from computer'}</span>
          <span className="text-12-r text-type-3">or drop an image here</span>
        </button>
        {error && <p className="text-12-r text-destructive">{error}</p>}

        {upload && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => media.choose(UPLOAD_ID)}
              aria-pressed={photo.id === UPLOAD_ID}
              className={cn('relative h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-offset-2 transition', photo.id === UPLOAD_ID ? 'ring-2 ring-type-0' : 'ring-1 ring-border hover:ring-type-3')}
              aria-label="Use uploaded photo"
            >
              <img src={upload.thumb} alt="" className="h-full w-full object-cover" draggable={false} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-13-m text-type-0">{upload.name}</p>
              <p className="text-12-r text-type-2">{photo.id === UPLOAD_ID ? 'On the cover' : 'Uploaded · tap to use'}</p>
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

      <Section title="From this gallery" hint={`${list.length} photos`}>
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
            return (
              <button
                key={p.id}
                onClick={() => media.choose(p.id)}
                aria-pressed={active}
                aria-label={`Use ${p.name} as cover`}
                className={cn('relative aspect-square overflow-hidden rounded-lg bg-surface-2 transition', active ? 'ring-2 ring-type-0 ring-offset-2' : 'hover:opacity-85')}
              >
                <img src={p.thumb ?? p.src} alt="" loading="lazy" className="h-full w-full object-cover" draggable={false} />
                {active && (
                  <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-white text-type-0 shadow">
                    <Check size={12} weight="bold" />
                  </span>
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
    </div>
  )
}
