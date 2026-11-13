import { useEffect, useId, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowCounterClockwise, CaretDown, Check, LinkSimple } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { useBreakpoint } from '../lib/hooks'
import EditorPane, { PANE_W, PEEK_H, SHEET_H } from '../editor/EditorPane'
import FitThumb from '../editor/FitThumb'
import { Label, Section, Segmented, Switch, TextField } from '../cover/controls'
import { ALIGN, CASES, FONTS, LIMITS, SIZES, SPACING, TEMPLATES, WEIGHTS, font, supports } from './config'
import SectionHeader from './SectionHeader'

const ease = [0.22, 1, 0.36, 1]

const TABS = [
  { id: 'templates', label: 'Templates' },
  { id: 'text', label: 'Text' },
  { id: 'style', label: 'Style' },
]

/** Stand-in note for the thumbnails, so templates built around a note still show their shape. */
const SAMPLE_NOTE = 'Quiet moments before the ceremony, as the light turned gold.'

/**
 * Collection heading editor: the shared editor shell (left pane / phone sheet) plus a live preview
 * stage beside or above it. `collection` is the heading whose words are being edited; the template,
 * type and position apply to every collection heading.
 */
export default function SectionEditor({ open, onClose, collection, onCollection, sections, headings, photos, cover }) {
  const [tab, setTab] = useState('templates')
  const [peek, setPeek] = useState(false)
  const phone = useBreakpoint() === 'mobile'

  useEffect(() => { if (open) setPeek(false) }, [open])

  // The page behind the stage shouldn't scroll while editing (the editor is non-modal).
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = 'hidden'
    return () => { root.style.overflow = prev }
  }, [open])

  const index = Math.max(0, sections.findIndex((s) => s.title === collection))
  const section = sections[index]
  const count = section ? section.end - section.start : 0
  const words = headings.words(collection, count)
  const name = TEMPLATES.find((t) => t.id === headings.state.layout.template)?.name ?? 'Custom'
  const inset = phone ? { left: 0, bottom: peek ? PEEK_H : SHEET_H } : { left: PANE_W + 16, bottom: 0 }
  const context = section ? photos.slice(section.start, Math.min(section.end, section.start + 6)) : []

  return (
    <>
      <AnimatePresence>
        {open && (
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
              <SectionHeader style={headings.style} words={words} index={index} />
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
        subtitle={`Template: ${name}${headings.edited ? ' · edited' : ''}`}
        previewLabel="Preview heading"
        tabs={TABS}
        tab={tab}
        onTab={setTab}
        onReset={headings.reset}
        modal={false}
      >
        {tab === 'templates' && <TemplatesTab headings={headings} words={words} index={index} />}
        {tab === 'text' && (
          <TextTab headings={headings} collection={collection} onCollection={onCollection} sections={sections} count={count} />
        )}
        {tab === 'style' && <StyleTab headings={headings} cover={cover} />}
      </EditorPane>
    </>
  )
}

// ── Templates ───────────────────────────────────────────────────────────────

function TemplatesTab({ headings, words, index }) {
  const { style, state } = headings
  const sample = { ...words, description: words.description || SAMPLE_NOTE }
  return (
    <div>
      <p className="mb-4 text-12-r text-type-2">
        Pick a layout for every collection heading, then fine-tune it under Text and Style. Your words and typeface are kept.
      </p>
      <div className="space-y-4">
        {TEMPLATES.map((t) => {
          const active = state.layout.template === t.id
          // Preview each template with the current type (and cover match), so what you see is what you get.
          const preview = { ...style, layout: { ...t.layout, ...(state.type.matchCover ? { size: style.layout.size } : {}) }, show: t.show }
          if (state.type.matchCover && supports(t.layout, 'align')) preview.layout.align = style.layout.align
          return (
            <button
              key={t.id}
              onClick={() => headings.applyTemplate(t.id)}
              aria-pressed={active}
              aria-label={`${t.name} template`}
              className="group block w-full text-left outline-none"
            >
              <div className={cn('relative rounded-xl p-0.5 ring-1 transition group-focus-visible:ring-2 group-focus-visible:ring-type-0', active ? 'ring-2 ring-type-0' : 'ring-border group-hover:ring-type-3')}>
                <FitThumb>
                  <div className="bg-background px-12 py-2">
                    <SectionHeader style={preview} words={sample} index={index} />
                  </div>
                </FitThumb>
                {active && (
                  <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-type-0 text-white shadow">
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

// ── Text ────────────────────────────────────────────────────────────────────

function TextTab({ headings, collection, onCollection, sections, count }) {
  const id = useId()
  const { raw } = headings.words(collection, count)
  const C = {
    eyebrow: raw.eyebrow ?? `${count} photos`,
    title: raw.title ?? collection,
    description: raw.description ?? '',
  }
  const set = (key) => (v) => headings.setContent(collection, { [key]: v })
  const edited = Object.keys(raw).length > 0
  const { show, layout } = headings.state
  return (
    <div>
      <Section title="Collection" hint="Each collection has its own words. Layout and style are shared by all of them.">
        <label htmlFor={id} className="sr-only">Collection</label>
        <div className="relative">
          <select
            id={id}
            value={collection}
            onChange={(e) => onCollection(e.target.value)}
            className="h-10 w-full appearance-none rounded-lg border border-input bg-surface-1 pl-3 pr-9 text-14-m text-type-0 outline-none transition focus:border-type-0"
          >
            {sections.map((s) => (
              <option key={s.title} value={s.title}>
                {s.title} · {s.end - s.start} photos
              </option>
            ))}
          </select>
          <CaretDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-type-2" />
        </div>
      </Section>

      <Section title="Words">
        <TextField
          label="Label"
          hint={show.eyebrow ? 'Small text with the title · shown on every collection' : 'Hidden on every collection'}
          value={C.eyebrow}
          onChange={set('eyebrow')}
          limit={LIMITS.eyebrow}
          placeholder={`${count} photos`}
          enabled={show.eyebrow}
          onToggle={(on) => headings.setShow({ eyebrow: on })}
        />
        <TextField
          label="Title"
          hint={C.title.trim() ? 'The collection’s heading' : `Empty — “${collection}” is shown`}
          value={C.title}
          onChange={set('title')}
          limit={LIMITS.title}
          placeholder={collection}
        />
        <TextField
          label="Note"
          hint={layout.template === 'split' ? 'Sits beside the title' : 'Optional — a line or two under the title'}
          value={C.description}
          onChange={set('description')}
          limit={LIMITS.description}
          placeholder="Add a few words about this collection"
          multiline
        />
        {edited && (
          <button
            onClick={() => headings.clearContent(collection)}
            className="flex h-8 items-center gap-1.5 rounded-full px-2 text-12-m text-type-2 transition hover:bg-surface-2 hover:text-type-0"
          >
            <ArrowCounterClockwise size={13} /> Restore {collection}’s original words
          </button>
        )}
      </Section>
    </div>
  )
}

// ── Style ───────────────────────────────────────────────────────────────────

/** Greys out controls the cover is currently deciding. */
function Locked({ on, children }) {
  return (
    <div aria-disabled={on} className={cn('space-y-4 transition-opacity', on && 'pointer-events-none select-none opacity-45')}>
      {children}
    </div>
  )
}

function StyleTab({ headings, cover }) {
  const { state, style, fromCover } = headings
  const T = state.type
  const L = state.layout
  const match = T.matchCover
  const coverName = cover?.layout?.composition === 'overlay' ? 'full-bleed' : 'composed'
  return (
    <div>
      <Section title="Match cover">
        <div className="flex items-start justify-between gap-3 rounded-xl bg-surface-2 p-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-13-m text-type-0">
              <LinkSimple size={14} /> Match the cover’s style
            </p>
            <p className="mt-0.5 text-12-r text-type-2">
              {match
                ? `Following your ${coverName} cover: ${font(fromCover.type.font).label.toLowerCase()}, ${WEIGHTS.find((w) => w.id === fromCover.type.weight)?.label.toLowerCase()}${fromCover.type.case === 'uppercase' ? ', uppercase' : ''}${supports(L, 'align') ? `, ${fromCover.align} aligned` : ''}, ${SIZES.find((s) => s.id === fromCover.size)?.label.toLowerCase()} size. Changes to the cover carry over.`
                : 'Use the cover’s font, weight, letter case, alignment and title size.'}
            </p>
          </div>
          <Switch checked={match} onChange={(on) => headings.setType({ matchCover: on })} label="Match the cover’s style" />
        </div>
      </Section>

      <Section title="Typeface" hint={match ? 'Set by the cover. Turn off Match cover to choose your own.' : undefined}>
        <Locked on={match}>
          <FontPicker value={style.type.font} weight={style.type.weight} upper={style.type.case === 'uppercase'} onChange={(f) => headings.setType({ font: f })} />
          <Segmented label="Weight" options={WEIGHTS} value={style.type.weight} onChange={(weight) => headings.setType({ weight })} />
          <Segmented label="Letter case" options={CASES} value={style.type.case} onChange={(c) => headings.setType({ case: c })} />
        </Locked>
      </Section>

      <Section title="Position">
        {supports(L, 'align') && (
          <Locked on={match}>
            <Segmented label="Text alignment" options={ALIGN} value={style.layout.align} onChange={(align) => headings.setLayout({ align })} />
          </Locked>
        )}
        {supports(L, 'flip') && (
          <Segmented
            label="Title side"
            options={[{ id: 'left', label: 'Title left' }, { id: 'right', label: 'Title right' }]}
            value={L.flip ? 'right' : 'left'}
            onChange={(v) => headings.setLayout({ flip: v === 'right' })}
          />
        )}
        <Locked on={match}>
          <Segmented label="Title size" options={SIZES} value={style.layout.size} onChange={(size) => headings.setLayout({ size })} />
        </Locked>
        <Segmented label="Space around" options={SPACING} value={L.spacing} onChange={(spacing) => headings.setLayout({ spacing })} />
      </Section>

      {supports(L, 'divider') && (
        <Section title="Details">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label>Fine rules</Label>
              <p className="-mt-1.5 text-12-r text-type-2">Hairlines that frame the heading</p>
            </div>
            <Switch checked={state.show.divider} onChange={(divider) => headings.setShow({ divider })} label="Fine rules" />
          </div>
        </Section>
      )}
    </div>
  )
}

/** Font cards, each set in its own typeface. */
function FontPicker({ value, weight, upper, onChange }) {
  return (
    <div>
      <Label>Font</Label>
      <div role="radiogroup" aria-label="Font" className="grid grid-cols-2 gap-2">
        {FONTS.map((f) => {
          const active = value === f.id
          return (
            <button
              key={f.id}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(f.id)}
              title={f.hint}
              className={cn(
                'flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition',
                active ? 'border-type-0 ring-1 ring-type-0' : 'border-input hover:border-type-3'
              )}
            >
              <span className="text-[26px] leading-none text-type-0" style={{ fontFamily: f.family, fontWeight: weight, textTransform: upper ? 'uppercase' : 'none' }}>
                Aa
              </span>
              <span className="text-12-m text-type-0">{f.label}</span>
              <span className="line-clamp-1 text-11-r text-type-2">{f.hint.split(' — ')[0]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
