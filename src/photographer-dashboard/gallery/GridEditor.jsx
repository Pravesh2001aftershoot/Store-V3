import { ORIENTATION, SIZE, SPACING } from '../../gallery/lib/settings'
import { Section, Segmented } from '../../gallery/templates/cover/controls'
import EditorPane from '../../gallery/templates/editor/EditorPane'
import { cn } from '../../lib/utils'

/**
 * The gallery grid's default layout — what clients see when they open the gallery. Clients can
 * still switch their own view from the gallery's Layout menu; that only changes it for them.
 * Same shell as the gallery's other editors.
 */
export default function GridEditor({ open, onClose, phone, peek, onPeek, inline, grid, setGrid, resetGrid }) {
  const label = (list, id) => list.find((o) => o.id === id)?.label
  return (
    <EditorPane
      open={open}
      onClose={onClose}
      phone={phone}
      peek={peek}
      onPeek={onPeek}
      inline={inline}
      modal={false}
      title="Customize grid"
      subtitle={`${label(ORIENTATION, grid.orientation)} · ${label(SIZE, grid.size)} · ${label(SPACING, grid.spacing)} spacing`}
      previewLabel="Preview grid"
      tabs={[{ id: 'layout', label: 'Layout' }]}
      tab="layout"
      onTab={() => {}}
      onReset={resetGrid}
    >
      <Section title="Arrangement" hint="How photos flow down the page.">
        <div className="grid grid-cols-2 gap-2">
          {ORIENTATION.map((o) => (
            <button
              key={o.id}
              onClick={() => setGrid('orientation', o.id)}
              aria-pressed={grid.orientation === o.id}
              className={cn('rounded-xl p-2 text-left ring-1 transition', grid.orientation === o.id ? 'ring-2 ring-type-0' : 'ring-border hover:ring-type-3')}
            >
              <Diagram kind={o.id} />
              <p className="mt-2 text-13-m text-type-0">{o.label}</p>
              <p className="text-12-r text-type-2">{o.hint}</p>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Photo size" hint="Per row on desktop; tablets and phones step down.">
        <Segmented options={SIZE} value={grid.size} onChange={(v) => setGrid('size', v)} />
      </Section>
      <Section title="Spacing" hint="The gap between photos and the page edge.">
        <Segmented options={SPACING} value={grid.spacing} onChange={(v) => setGrid('spacing', v)} />
      </Section>
      <p className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-12-r-p text-type-2">
        This is the layout clients start with. They can still change their own view from the gallery’s Layout menu — that only changes it for them.
      </p>
    </EditorPane>
  )
}

/** A tiny sketch of masonry columns or justified rows. */
function Diagram({ kind }) {
  const cols = [[60, 36, 48], [40, 56, 44], [52, 40, 52]]
  const rows = [[34, 50, 26], [46, 54], [30, 30, 40]]
  return (
    <div className="flex h-24 gap-1 overflow-hidden rounded-lg bg-surface-2 p-1.5">
      {kind === 'vertical'
        ? cols.map((c, i) => (
            <div key={i} className="flex flex-1 flex-col gap-1">
              {c.map((h, k) => <span key={k} className="rounded-[3px] bg-type-3/40" style={{ height: h }} />)}
            </div>
          ))
        : (
          <div className="flex w-full flex-col gap-1">
            {rows.map((r, i) => (
              <div key={i} className="flex h-[26px] gap-1">
                {r.map((w, k) => <span key={k} className="rounded-[3px] bg-type-3/40" style={{ flex: w }} />)}
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
