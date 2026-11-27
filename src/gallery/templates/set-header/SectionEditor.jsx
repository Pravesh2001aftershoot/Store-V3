import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowCounterClockwise, Check } from '@phosphor-icons/react'
import { cn } from '../../../lib/utils'
import { Select } from '../../../components/ui/Select'
import { useBreakpoint } from '../../lib/hooks'
import EditorPane, { PANE_W, PEEK_H, SHEET_H } from '../editor/EditorPane'
import FitThumb from '../editor/FitThumb'
import { Label, Section, Segmented, Switch, TextField } from '../cover/controls'
import { ALIGN, FONTS, LIMITS, SIZES, SPACING, TEMPLATES, WEIGHTS, supports } from './config'
import SectionHeader from './SectionHeader'

const ease = [0.22, 1, 0.36, 1]

const TABS = [
  { id: 'templates', label: 'Templates' },
  { id: 'text', label: 'Text' },
]

/** Stand-in note for the thumbnails, so templates built around a note still show their shape. */
const SAMPLE_NOTE = 'Quiet moments before the ceremony, as the light turned gold.'

/**
 * Collection heading editor: the shared editor shell (left pane / phone sheet) plus a live preview
 * stage beside or above it. `collection` is the heading being edited: its words always, and its layout
 * (template, position, details) when "Different for each set" is on. Otherwise the layout, like the
 * typeface, applies to every collection heading.
 *
 * `inline` (the dashboard) docks the pane in place and drops the stage: the dashboard has its own preview.
 */
export default function SectionEditor({ open, onClose, collection, onCollection, sections, headings, photos, cover, inline = false }) {
  const [tab, setTab] = useState('templates')
  const [peek, setPeek] = useState(false)
  const phone = useBreakpoint() === 'mobile'

  useEffect(() => { if (open) setPeek(false) }, [open])

  // The page behind the stage shouldn't scroll while editing (the editor is non-modal).
  useEffect(() => {
    if (!open || inline) return
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = 'hidden'
    return () => { root.style.overflow = prev }
  }, [open, inline])

  const index = Math.max(0, sections.findIndex((s) => s.title === collection))
  const section = sections[index]
  const count = section ? section.end - section.start : 0
  const words = headings.words(collection, count)
  const inset = phone ? { left: 0, bottom: peek ? PEEK_H : SHEET_H } : { left: PANE_W + 16, bottom: 0 }
  const context = section ? photos.slice(section.start, Math.min(section.end, section.start + 6)) : []
  // Layout reads / writes for this collection (its own with "Different for each set", else the shared one).
  const scoped = headings.scoped(collection)
  const picker = { collection, onCollection, sections }

  return (
    <>
      <AnimatePresence>
        {open && !inline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease }}
            className="fixed right-0 top-0 z-40 overflow-y-auto overscroll-contain bg-background transition-[left,bottom] duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={inset}
          >
            <p className="sticky top-0 z-10 p-3 text-11-sb uppercase text-type-2">
              <span className="rounded-full bg-surface-1/90 px-2.5 py-1.5 shadow-sm backdrop-blur">Live preview · {collection}</span>
            </p>
            <div className="mx-auto w-full max-w-[1800px] px-4 pb-8 md:px-8">
              <SectionHeader style={scoped.style} words={words} index={index} />
              {/* A few of the collection's photos, so the heading is seen in place. */}
              <div className="grid grid-cols-3 gap-2 opacity-90">
                {context.map((p) => (
                  <div key={p.id} className="aspect-[4/5] overflow-hidden bg-surface-2">
                    <img src={p.thumb} alt="" draggable={false} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <EditorPane
        open={open}
        onClose={onClose}
        phone={phone}
        peek={peek}
        onPeek={setPeek}
        title="Customize headings"
        previewLabel="Preview heading"
        tabs={TABS}
        tab={tab}
        onTab={setTab}
        onReset={headings.reset}
        modal={false}
        inline={inline}
      >
        {tab === 'templates' && <TemplatesTab headings={headings} scoped={scoped} picker={picker} words={words} index={index} />}
        {tab === 'text' && <TextTab headings={headings} scoped={scoped} picker={picker} count={count} />}
      </EditorPane>
    </>
  )
}

// ── Templates ───────────────────────────────────────────────────────────────

/** Which collection is being edited. Native select on tablet/desktop, a bottom sheet on phones. */
const FIELD = 'h-10 w-full rounded-full border-transparent bg-surface-2 pl-4 pr-10 text-14-m text-type-0 focus:border-type-0 md:w-full'

function CollectionPicker({ collection, onCollection, sections }) {
  return (
    <Select
      title="Collection"
      value={collection}
      onChange={onCollection}
      options={sections.map((s) => ({ value: s.title, label: `${s.title} · ${s.end - s.start} photos` }))}
      className="w-full md:flex md:w-full"
      triggerClassName={FIELD}
    />
  )
}

function TemplatesTab({ headings, scoped, picker, words, index }) {
  const { state } = headings
  const { style } = scoped
  const perSet = state.perSet
  const sample = { ...words, description: words.description || SAMPLE_NOTE }
  return (
    <div>
      <Section>
        {/* Off: one layout for every set's heading. On: each set has its own. */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-14-m text-type-0">Different layout for each set</p>
          <Switch checked={perSet} onChange={headings.setPerSet} label="Different layout for each set" />
        </div>
        {perSet && <CollectionPicker {...picker} />}
        {/* On: the title's font, weight and size (and alignment) follow the cover. */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-14-m text-type-0">Match the cover’s title</p>
            <p className="mt-0.5 text-12-r text-type-2">Use the cover title’s font, weight, size and alignment</p>
          </div>
          <Switch checked={state.type.matchCover} onChange={(on) => headings.setType({ matchCover: on })} label="Match the cover’s title" />
        </div>
      </Section>
      {/* One column, stacked: every card the same short 3:1 frame. */}
      <div className="mt-5 space-y-4">
        {TEMPLATES.map((t) => {
          const active = scoped.layout.template === t.id
          // Preview each template with the current type (and cover match), so what you see is what you get.
          const preview = { ...style, layout: { ...t.layout, ...(state.type.matchCover ? { size: style.layout.size } : {}) }, show: t.show }
          if (state.type.matchCover && supports(t.layout, 'align')) preview.layout.align = style.layout.align
          return (
            <button
              key={t.id}
              onClick={() => scoped.applyTemplate(t.id)}
              aria-pressed={active}
              aria-label={`${t.name} template`}
              className="group block w-full text-left outline-none"
            >
              <div className={cn('relative rounded-xl p-0.5 ring-1 transition group-focus-visible:ring-2 group-focus-visible:ring-type-0', active ? 'ring-2 ring-type-0' : 'ring-border group-hover:ring-type-3')}>
                {/* Rendered at a desktop 1280px, as before; a taller heading (large title, long note) shrinks to fit. */}
                <FitThumb aspect="3/1" className="bg-background">
                  <SectionHeader style={preview} words={sample} index={index} />
                </FitThumb>
                {active && (
                  <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-type-0 text-white shadow">
                    <Check size={12} weight="bold" />
                  </span>
                )}
              </div>
              <p className="mt-2 text-13-m text-type-0">{t.name}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Text ────────────────────────────────────────────────────────────────────

/** Greys out controls the cover is currently deciding. */
function Locked({ on, children }) {
  return (
    <div aria-disabled={on} className={cn('space-y-4 transition-opacity', on && 'pointer-events-none select-none opacity-45')}>
      {children}
    </div>
  )
}

/** Font family + weight side by side. Dropdowns: native select on tablet/desktop, a bottom sheet on phones. */
function FontRow({ font, weight, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="min-w-0">
        <Label>Font family</Label>
        <Select
          title="Font family"
          value={font}
          onChange={(f) => onChange({ font: f })}
          options={FONTS.map((f) => ({ value: f.id, label: f.label }))}
          className="w-full md:flex md:w-full"
          triggerClassName={FIELD}
        />
      </div>
      <div className="min-w-0">
        <Label>Weight</Label>
        <Select
          title="Weight"
          value={weight}
          onChange={(w) => onChange({ weight: Number(w) })}
          options={WEIGHTS.map((w) => ({ value: w.id, label: w.label }))}
          className="w-full md:flex md:w-full"
          triggerClassName={FIELD}
        />
      </div>
    </div>
  )
}

/**
 * Words, position and type in one place. Each piece (label, title, note) is its field followed by
 * its own font, weight and size. The title's type is locked while "Match the cover's title" is on.
 */
function TextTab({ headings, scoped, picker, count }) {
  const { collection } = picker
  const { state } = headings
  const perSet = state.perSet
  const match = state.type.matchCover
  const { raw } = headings.words(collection, count)
  const C = {
    eyebrow: raw.eyebrow ?? `${count} photos`,
    title: raw.title ?? collection,
    description: raw.description ?? '',
  }
  const set = (key) => (v) => headings.setContent(collection, { [key]: v })
  const edited = Object.keys(raw).length > 0
  const { show, layout: L, style } = scoped
  const where = perSet ? `on ${collection}` : 'on every collection'
  const E = state.type.eyebrow
  const N = state.type.note
  return (
    <div>
      <Section
        hint={perSet ? 'Each section header has its own words and layout. Type is shared by all of them.' : 'Each section header has its own words. Layout and style are shared by all of them.'}
      >
        {/* Only while "Different layout for each set" is on; otherwise this edits the heading whose pencil opened it. */}
        {perSet && <CollectionPicker {...picker} />}
        {edited && (
          <button
            onClick={() => headings.clearContent(collection)}
            className="flex h-8 items-center gap-1.5 rounded-full px-2 text-12-m text-type-2 transition hover:bg-surface-2 hover:text-type-0"
          >
            <ArrowCounterClockwise size={13} /> Restore {collection}’s original words
          </button>
        )}
      </Section>

      <Section title="Position">
        {supports(L, 'align') && (
          <Locked on={match}>
            <Segmented label="Text alignment" info={match ? 'Set by the cover while Match the cover’s title is on' : 'Where the heading sits across the page'} options={ALIGN} value={style.layout.align} onChange={(align) => scoped.setLayout({ align })} />
          </Locked>
        )}
        {supports(L, 'flip') && (
          <Segmented
            label="Title side"
            options={[{ id: 'left', label: 'Title left' }, { id: 'right', label: 'Title right' }]}
            value={L.flip ? 'right' : 'left'}
            onChange={(v) => scoped.setLayout({ flip: v === 'right' })}
          />
        )}
        <Segmented label="Space around" info="Room above and below the heading" options={SPACING} value={L.spacing} onChange={(spacing) => scoped.setLayout({ spacing })} />
      </Section>

      <Section>
        <TextField
          label="Label"
          hint={show.eyebrow ? `Small text with the title · shown ${where}` : `Hidden ${where}`}
          value={C.eyebrow}
          onChange={set('eyebrow')}
          limit={LIMITS.eyebrow}
          placeholder={`${count} photos`}
          enabled={show.eyebrow}
          onToggle={(on) => scoped.setShow({ eyebrow: on })}
        />
        <FontRow font={E.font} weight={E.weight} onChange={(p) => headings.setPieceType('eyebrow', p)} />
        <Segmented label="Text size" info="Size of the label" options={SIZES} value={E.size} onChange={(size) => headings.setPieceType('eyebrow', { size })} />
      </Section>

      <Section>
        <TextField
          label="Title"
          hint={C.title.trim() ? 'The collection’s heading' : `Empty — “${collection}” is shown`}
          value={C.title}
          onChange={set('title')}
          limit={LIMITS.title}
          placeholder={collection}
        />
        <Locked on={match}>
          <FontRow font={style.type.font} weight={style.type.weight} onChange={(p) => headings.setType(p)} />
          <Segmented label="Text size" info={match ? 'Set by the cover while Match the cover’s title is on' : 'Size of the title'} options={SIZES} value={style.layout.size} onChange={(size) => scoped.setLayout({ size })} />
        </Locked>
      </Section>

      <Section>
        <TextField
          label="Note"
          hint={L.template === 'split' ? 'Sits beside the title' : 'Optional — a line or two under the title'}
          value={C.description}
          onChange={set('description')}
          limit={LIMITS.description}
          placeholder="Add a few words about this collection"
          multiline
        />
        <FontRow font={N.font} weight={N.weight} onChange={(p) => headings.setPieceType('note', p)} />
        <Segmented label="Text size" info="Size of the note" options={SIZES} value={N.size} onChange={(size) => headings.setPieceType('note', { size })} />
      </Section>
    </div>
  )
}
