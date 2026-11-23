import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CaretDown, CornersOut, DotsThree, DotsThreeVertical, EyeSlash, FolderSimple, Image as ImageIcon, PencilSimple, Plus, Star, Trash } from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import { LIMITS, useGalleries } from '../../data/galleries'
import { notify } from '../../gallery/lib/actions'
import { NAME_LIMIT } from '../../gallery/lib/library'
import { cn, plural } from '../../lib/utils'
import { IconButton, Menu, Tag, ease } from '../components/ui'
import { InlineName } from '../components/InlineName'
import { usePhone } from '../lib/hooks'

const TABS = [{ id: 'images', label: 'Images' }, { id: 'videos', label: 'Videos' }]

/**
 * Image management panel: a compact view of the gallery's photos, opened from the toggle at the left of
 * Design's preview toolbar and docked beside the step rail (an overlay on phones). Design only. Album name, Images / Videos,
 * each set as a collapsible justified grid, and + New Set. Full view (CornersOut) opens the Photos step.
 */
export default function ImagePanel({ open, onClose, ws, top }) {
  const phone = usePhone()
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          key="image-panel"
          aria-label="Images"
          className={cn(
            'z-30 shrink-0 self-start overflow-hidden border-r border-border bg-surface-1',
            phone ? 'fixed bottom-0 left-14 right-0' : 'sticky'
          )}
          style={{ top, height: `calc(100svh - ${top}px)` }}
          initial={phone ? { x: -24, opacity: 0 } : { width: 0, opacity: 0 }}
          animate={phone ? { x: 0, opacity: 1 } : { width: 360, opacity: 1 }}
          exit={phone ? { x: -24, opacity: 0 } : { width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease }}
        >
          <Panel ws={ws} onClose={onClose} />
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function Panel({ ws, onClose }) {
  const navigate = useNavigate()
  const { update } = useGalleries()
  const { library, photos, media } = ws
  const [tab, setTab] = useState('images')
  const [collapsed, setCollapsed] = useState(() => new Set())
  const [naming, setNaming] = useState(null) // set being renamed
  const [uploadTo, setUploadTo] = useState(null)
  const input = useRef(null)

  const fullView = () => { onClose(); navigate(`${ws.base}/photos`) }
  const toggleSet = (c) => setCollapsed((s) => { const n = new Set(s); n.has(c) ? n.delete(c) : n.add(c); return n })

  const addTo = (c) => { setUploadTo(c); input.current?.click() }
  const upload = async (files) => {
    if (!files?.length || !uploadTo) return
    const { added } = await library.addFiles(files, uploadTo)
    notify(added ? `Added ${plural(added, 'photo')} to ${uploadTo}` : 'Those files aren’t images we can read')
  }
  const newSet = () => {
    const made = library.addCollection('New set')
    if (made) { setNaming(made); notify(`Created “${made}”`) }
  }
  const rename = (from, to) => {
    if (library.collections.includes(to)) return notify(`There’s already a set called “${to}”`)
    library.renameCollection(from, to)
  }
  const deleteSet = (c) => {
    const to = library.collections.find((x) => x !== c)
    const n = photos.filter((p) => p.collection === c).length
    if (n && !window.confirm(`Delete “${c}”? Its ${plural(n, 'photo')} move to “${to}”.`)) return
    library.deleteCollection(c, to)
    notify(`Deleted “${c}”`)
  }
  const setCover = (p) => { media.choose(p.id); notify('Cover photo updated') }
  const remove = (p) => {
    if (p.id === media.photo.id) media.choose(undefined)
    library.remove([p.id])
    notify('Photo removed from the gallery — find it under Removed in Photos')
  }

  return (
    <div className="flex h-full w-full flex-col sm:w-[360px]">
      {/* Album name + status */}
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <div className="min-w-0 flex-1 text-18-m text-type-0">
          <InlineName value={ws.gallery.title} limit={LIMITS.title} label="Album name" onSave={(v) => update(ws.gallery.id, { title: v })} />
        </div>
        <Tag className="shrink-0">Draft</Tag>
      </div>

      {/* Images / Videos, Full view */}
      <div className="flex items-center gap-6 border-b border-border px-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn('relative h-11 text-13-sb uppercase transition-colors', tab === t.id ? 'text-type-0' : 'text-type-3 hover:text-type-0')}
          >
            {t.label}
            {tab === t.id && <motion.span layoutId="image-panel-tab" transition={{ duration: 0.3, ease }} className="absolute inset-x-0 bottom-0 h-0.5 bg-type-0" />}
          </button>
        ))}
        <span className="flex-1" />
        <IconButton small label="Full view" onClick={fullView}>
          <CornersOut size={18} />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {tab === 'videos' ? (
          <p className="px-4 py-10 text-center text-13-r text-type-3">No videos in this gallery yet.</p>
        ) : (
          library.collections.map((c) => {
            const list = photos.filter((p) => p.collection === c)
            const shut = collapsed.has(c)
            return (
              <section key={c}>
                <div className="flex items-center gap-1 px-2 py-2">
                  <IconButton small label={shut ? `Expand ${c}` : `Collapse ${c}`} aria-expanded={!shut} onClick={() => toggleSet(c)}>
                    <CaretDown size={16} className={cn('transition-transform', shut && '-rotate-90')} />
                  </IconButton>
                  <div className="flex min-w-0 flex-1 items-center gap-1.5 text-14-m text-type-0">
                    {naming === c ? (
                      <SetName value={c} onDone={(v) => { setNaming(null); if (v && v !== c) rename(c, v) }} />
                    ) : (
                      <span className="truncate">{c}</span>
                    )}
                    <span className="shrink-0 tabular-nums text-type-3">({list.length})</span>
                  </div>
                  <IconButton small label={`Add images to ${c}`} onClick={() => addTo(c)}>
                    <Plus size={16} />
                  </IconButton>
                  <Menu
                    label={`${c} options`}
                    trigger={({ toggle }) => (
                      <IconButton small label="Set options" onClick={toggle}>
                        <DotsThree size={18} weight="bold" />
                      </IconButton>
                    )}
                    items={[
                      { label: 'Rename', icon: PencilSimple, onClick: () => setNaming(c) },
                      { label: 'Delete set', icon: Trash, danger: true, onClick: () => deleteSet(c), disabled: library.collections.length < 2 },
                    ]}
                  />
                </div>
                {!shut && (
                  list.length ? (
                    <div className="flex flex-wrap gap-1 px-1 [--row:150px]">
                      {list.map((p) => (
                        <PanelTile
                          key={p.id}
                          photo={p}
                          cover={p.id === media.photo.id}
                          moveTargets={library.collections.filter((x) => x !== c)}
                          onMove={(to) => { library.moveTo([p.id], to); notify(`Moved to ${to}`) }}
                          onCover={() => setCover(p)}
                          onRemove={() => remove(p)}
                        />
                      ))}
                      <span aria-hidden className="grow-[999]" />
                    </div>
                  ) : (
                    <p className="px-4 pb-3 text-13-r text-type-3">No images yet. Use + to add some.</p>
                  )
                )}
              </section>
            )
          })
        )}
      </div>

      <div className="border-t border-border p-4">
        <Button variant="secondary" size="lg" className="w-full" onClick={newSet}>
          <Plus size={16} /> New Set
        </Button>
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = '' }} />
    </div>
  )
}

/** Photo in the panel: hover (or focus) darkens it and shows its name, a ⋮ menu and Set as cover. */
function PanelTile({ photo: p, cover, moveTargets, onMove, onCover, onRemove }) {
  const ratio = p.w && p.h ? p.w / p.h : 1
  return (
    <div
      tabIndex={0}
      style={{ flexGrow: ratio, flexBasis: `calc(var(--row) * ${ratio})`, aspectRatio: ratio }}
      className="group relative min-w-0 bg-surface-2 outline-none focus-visible:ring-2 focus-visible:ring-type-0"
    >
      <img src={p.thumb} alt={p.name ?? ''} loading="lazy" draggable={false} className="h-full w-full object-cover" />
      {cover && (
        <Tag tone="dark" className="absolute right-2 top-2 gap-1 group-hover:opacity-0 group-focus-within:opacity-0">
          <Star size={10} weight="fill" /> Cover
        </Tag>
      )}
      <div className="absolute inset-0 flex flex-col justify-between bg-black/60 p-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        <div className="flex items-start gap-1">
          <p className="min-w-0 flex-1 truncate pt-1 text-12-m text-white">{p.name ?? 'Photo'}</p>
          <Menu
            label={p.name ?? 'Photo options'}
            trigger={({ toggle }) => (
              <IconButton small label="Photo options" onClick={toggle} className="h-7 w-7 text-white hover:bg-white/15 hover:text-white">
                <DotsThreeVertical size={18} weight="bold" />
              </IconButton>
            )}
            items={[
              ...moveTargets.map((c) => ({ label: `Move to ${c}`, icon: FolderSimple, onClick: () => onMove(c) })),
              ...(moveTargets.length ? [null] : []),
              { label: 'Remove from gallery', icon: EyeSlash, danger: true, onClick: onRemove },
            ]}
          />
        </div>
        {cover ? (
          <span className="flex items-center gap-1.5 text-12-m text-white"><Star size={14} weight="fill" /> Cover</span>
        ) : (
          <button onClick={onCover} className="flex min-w-0 max-w-full items-center gap-1.5 self-start rounded-md text-12-m text-white transition hover:text-white/80">
            <ImageIcon size={16} className="shrink-0" /> <span className="truncate">Set as cover</span>
          </button>
        )}
      </div>
    </div>
  )
}

/** Inline set name field. Enter or leaving saves, Esc cancels. */
function SetName({ value, onDone }) {
  const [v, setV] = useState(value)
  const done = useRef(false)
  const finish = (save) => { if (done.current) return; done.current = true; onDone(save ? v.trim() : null) }
  return (
    <input
      autoFocus
      value={v}
      maxLength={NAME_LIMIT}
      aria-label="Set name"
      onChange={(e) => setV(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={() => finish(true)}
      onKeyDown={(e) => { if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false) }}
      className="min-w-0 flex-1 rounded-md bg-surface-2 px-2 py-1 text-14-m text-type-0 outline-none ring-2 ring-type-0/10"
    />
  )
}
