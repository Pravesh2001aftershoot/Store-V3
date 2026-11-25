import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CaretDown, Check, CornersOut, DotsThree, DotsThreeVertical, EyeSlash, FolderSimple, Image as ImageIcon, PencilSimple, Plus, Star, Trash, X } from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import { LIMITS, useGalleries } from '../../data/galleries'
import { notify } from '../../gallery/lib/actions'
import { NAME_LIMIT } from '../../gallery/lib/library'
import { cn, plural } from '../../lib/utils'
import { IconButton, Menu, Tag, ease } from '../components/ui'
import { InlineName } from '../components/InlineName'
import { usePhone } from '../lib/hooks'

const TABS = [{ id: 'images', label: 'Images' }, { id: 'videos', label: 'Videos' }]
const WIDTH = 280 // docked width; photos sit two to a row
const MIME = 'application/x-store-v3-photos' // photo ids being dragged inside the dashboard

/**
 * Image management panel: a compact view of the gallery's photos, opened from the toggle at the left of
 * Design's preview toolbar and docked beside the step rail (an overlay on phones). Design only. Album name, Images / Videos,
 * each set as a collapsible justified grid, and + New Set. Full view (CornersOut) opens the Photos step.
 * Photos can be multi-selected (check, ⌘/Ctrl or Shift-click) for bulk Move to / Remove, and dragged
 * (desktop) onto another photo or a set header to rearrange them.
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
          animate={phone ? { x: 0, opacity: 1 } : { width: WIDTH, opacity: 1 }}
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

  // ── Selection: the check (or ⌘/Ctrl-click) toggles a photo, Shift-click selects a range in its set,
  // and once anything is selected a click anywhere on a photo toggles it. Esc clears.
  const phone = usePhone()
  const [selected, setSelected] = useState(() => new Set())
  const anchor = useRef(null)
  const selectedList = useMemo(() => photos.filter((p) => selected.has(p.id)), [photos, selected])
  const ids = selectedList.map((p) => p.id)
  useEffect(() => { // drop ids that left the gallery
    setSelected((s) => (selectedList.length === s.size ? s : new Set(selectedList.map((p) => p.id))))
  }, [selectedList])
  const clear = () => { setSelected(new Set()); anchor.current = null }
  useEffect(() => {
    if (!selected.size) return
    const esc = (e) => { if (e.key === 'Escape' && !e.target.closest?.('input, textarea, [role="dialog"]')) clear() }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [selected.size])
  const toggle = (p, e) => {
    const from = anchor.current && photos.find((x) => x.id === anchor.current)
    if (e?.shiftKey && from && from.collection === p.collection) {
      const list = photos.filter((x) => x.collection === p.collection).map((x) => x.id)
      const [a, b] = [list.indexOf(from.id), list.indexOf(p.id)].sort((x, y) => x - y)
      setSelected((s) => new Set([...s, ...list.slice(a, b + 1)]))
    } else {
      setSelected((s) => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n })
    }
    anchor.current = p.id
  }
  const moveSelected = (to) => {
    library.moveTo(ids, to)
    notify(`Moved ${plural(ids.length, 'photo')} to ${to}`)
    clear()
  }
  const removeSelected = () => {
    if (ids.includes(media.photo.id)) media.choose(undefined)
    library.remove(ids)
    notify(`${plural(ids.length, 'photo')} removed from the gallery — find ${ids.length === 1 ? 'it' : 'them'} under Removed in Photos`)
    clear()
  }

  // ── Rearranging: drag a photo (or the selection it's part of) onto another photo to land before or
  // after it, or onto a set's header to move it to the end of that set. ⌥/Alt + ←/→ nudges by one.
  const [dragging, setDragging] = useState(null) // ids being dragged
  const [over, setOver] = useState(null) // { id, after } or { set }
  const idsIn = (c, except = []) => photos.filter((x) => x.collection === c && !except.includes(x.id)).map((x) => x.id)
  const isPhotos = (e) => [...(e.dataTransfer?.types ?? [])].includes(MIME)
  const sideOf = (e) => { const r = e.currentTarget.getBoundingClientRect(); return e.clientX > r.left + r.width / 2 }
  const dragEnd = () => { setDragging(null); setOver(null) }
  const dragStart = (e, p) => {
    const list = selected.has(p.id) ? ids : [p.id]
    e.dataTransfer.setData(MIME, JSON.stringify(list))
    e.dataTransfer.effectAllowed = 'move'
    setDragging(list)
  }
  const land = (moving, c, before) => {
    const leaving = photos.filter((x) => moving.includes(x.id) && x.collection !== c).length
    library.place(moving, c, before)
    if (leaving) notify(`Moved ${plural(leaving, 'photo')} to ${c}`)
  }
  const photoDrop = (p) => ({
    onDragOver: (e) => {
      if (!isPhotos(e)) return
      e.preventDefault()
      const after = sideOf(e)
      setOver((o) => (o?.id === p.id && o.after === after ? o : { id: p.id, after }))
    },
    onDragLeave: () => setOver((o) => (o?.id === p.id ? null : o)),
    onDrop: (e) => {
      if (!isPhotos(e)) return
      e.preventDefault()
      const after = sideOf(e)
      dragEnd()
      const moving = JSON.parse(e.dataTransfer.getData(MIME))
      if (!moving.length || moving.includes(p.id)) return
      const rest = idsIn(p.collection, moving)
      land(moving, p.collection, after ? rest[rest.indexOf(p.id) + 1] ?? null : p.id)
    },
  })
  const setDrop = (c) => ({
    onDragOver: (e) => { if (!isPhotos(e)) return; e.preventDefault(); setOver((o) => (o?.set === c ? o : { set: c })) },
    onDragLeave: (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver((o) => (o?.set === c ? null : o)) },
    onDrop: (e) => {
      if (!isPhotos(e)) return
      e.preventDefault()
      dragEnd()
      const moving = JSON.parse(e.dataTransfer.getData(MIME))
      if (moving.length) land(moving, c, null)
    },
  })
  const nudge = (e, p) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key]
    if (!e.altKey || !step) return
    e.preventDefault()
    const list = idsIn(p.collection)
    const moving = selected.has(p.id) ? selectedList.filter((x) => x.collection === p.collection).map((x) => x.id) : [p.id]
    const start = Math.min(...moving.map((id) => list.indexOf(id)))
    const rest = list.filter((id) => !moving.includes(id))
    const at = start + step
    if (at < 0 || at > rest.length) return
    library.place(moving, p.collection, rest[at] ?? null)
    requestAnimationFrame(() => document.querySelector(`[data-panel-photo="${CSS.escape(p.id)}"]`)?.focus())
  }

  return (
    <div className="flex h-full w-full flex-col sm:w-[var(--panel-w)]" style={{ '--panel-w': `${WIDTH}px` }}>
      {/* Album name + status */}
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <div className="min-w-0 flex-1 text-18-m text-type-0">
          <InlineName value={ws.gallery.title} limit={LIMITS.title} label="Album name" onSave={(v) => update(ws.gallery.id, { title: v })} />
        </div>
        <Tag className="shrink-0">Draft</Tag>
      </div>

      {/* Images / Videos, Full view */}
      <div className="flex items-center gap-6 px-4">
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
                <div
                  {...setDrop(c)}
                  className={cn('mx-1 flex items-center gap-1 rounded-lg px-1 py-2 transition-colors', over?.set === c && 'bg-surface-2 ring-2 ring-inset ring-type-0')}
                >
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
                    <div className="flex flex-col gap-1 px-1">
                      {pairs(list).map((row) => (
                        <div key={row[0].id} className="flex gap-1">
                          {row.map((p) => (
                            <PanelTile
                              key={p.id}
                              photo={p}
                              cover={p.id === media.photo.id}
                              selected={selected.has(p.id)}
                              selecting={selected.size > 0}
                              draggable={!phone}
                              dragging={!!dragging?.includes(p.id)}
                              over={over?.id === p.id ? (over.after ? 'after' : 'before') : null}
                              onToggle={(e) => toggle(p, e)}
                              onKeyDown={(e) => nudge(e, p)}
                              onDragStart={(e) => dragStart(e, p)}
                              onDragEnd={dragEnd}
                              drop={photoDrop(p)}
                              moveTargets={library.collections.filter((x) => x !== c)}
                              onMove={(to) => { library.moveTo([p.id], to); notify(`Moved to ${to}`) }}
                              onCover={() => setCover(p)}
                              onRemove={() => remove(p)}
                            />
                          ))}
                          {/* A lone last photo keeps half the row. */}
                          {row.length === 1 && <span aria-hidden style={{ flexGrow: ratioOf(row[0]), flexBasis: 0 }} />}
                        </div>
                      ))}
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
        {selectedList.length ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-14-m tabular-nums text-type-0">{selectedList.length} selected</p>
              {selectedList.length < photos.length && (
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set(photos.map((p) => p.id)))}>
                  Select all
                </Button>
              )}
              <IconButton small label="Clear selection" onClick={clear}>
                <X size={16} />
              </IconButton>
            </div>
            {/* Phones: Move to and Remove stack full width. */}
            <div className="flex gap-2 max-sm:flex-col">
              <div className="flex-1 [&>div]:w-full">
                <Menu
                  label="Move to set"
                  align="left"
                  side="top"
                  trigger={({ toggle: open }) => (
                    <Button variant="secondary" size="md" className="w-full px-3" onClick={open} disabled={library.collections.length < 2}>
                      <FolderSimple size={16} /> Move to
                    </Button>
                  )}
                  items={library.collections.map((c) => ({
                    label: c,
                    icon: FolderSimple,
                    onClick: () => moveSelected(c),
                    disabled: selectedList.every((p) => p.collection === c),
                  }))}
                />
              </div>
              <Button variant="secondary" size="md" className="flex-1 px-3" onClick={removeSelected}>
                <EyeSlash size={16} /> Remove
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" size="lg" className="w-full" onClick={newSet}>
            <Plus size={16} /> New Set
          </Button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = '' }} />
    </div>
  )
}

/**
 * Photo in the panel. Hover (or focus) darkens it and shows its name, a ⋮ menu and Set as cover, plus a
 * check at the top left. While anything is selected the actions hide and a click toggles the photo.
 */
function PanelTile({
  photo: p, cover, selected, selecting, draggable, dragging, over, drop,
  onToggle, onKeyDown, onDragStart, onDragEnd, moveTargets, onMove, onCover, onRemove,
}) {
  const ratio = ratioOf(p)
  const click = (e) => { if (selecting || e.metaKey || e.ctrlKey || e.shiftKey) onToggle(e) }
  return (
    <div
      role="checkbox"
      aria-checked={selected}
      aria-label={`${p.name ?? 'Photo'}${cover ? ', cover photo' : ''}`}
      data-panel-photo={p.id}
      tabIndex={0}
      draggable={draggable}
      onClick={click}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggle(e) } else onKeyDown(e)
      }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      {...drop}
      style={{ flexGrow: ratio, flexBasis: 0, aspectRatio: ratio }}
      className={cn(
        'group relative min-w-0 select-none bg-surface-2 outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-type-0',
        selecting && 'cursor-pointer',
        draggable && 'active:cursor-grabbing',
        dragging && 'opacity-40'
      )}
    >
      <div className="h-full w-full overflow-hidden">
        <img
          src={p.thumb}
          alt=""
          loading="lazy"
          draggable={false}
          className={cn('h-full w-full object-cover transition duration-300', selected && 'scale-[0.88]')}
        />
      </div>
      {cover && (
        <Tag tone="dark" className={cn('pointer-events-none absolute right-2 top-2 gap-1', !selecting && 'group-hover:opacity-0 group-focus-within:opacity-0')}>
          <Star size={10} weight="fill" /> Cover
        </Tag>
      )}
      {!selecting && (
        <div className="absolute inset-0 flex flex-col justify-between bg-black/60 p-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          <div className="flex items-start gap-1 pl-8" onClick={(e) => e.stopPropagation()}>
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
            <button
              onClick={(e) => { e.stopPropagation(); onCover() }}
              className="flex min-w-0 max-w-full items-center gap-1.5 self-start rounded-md text-12-m text-white transition hover:text-white/80"
            >
              <ImageIcon size={16} className="shrink-0" /> <span className="truncate">Set as cover</span>
            </button>
          )}
        </div>
      )}
      {/* Check: always toggles; shown on hover / focus, and on every photo once something is selected. */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={(e) => { e.stopPropagation(); onToggle(e) }}
        className={cn(
          'absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full border transition',
          selected ? 'border-type-0 bg-type-0 text-white' : 'border-white/90 bg-black/20 text-transparent backdrop-blur-sm hover:bg-black/40',
          !selected && !selecting && 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100'
        )}
      >
        <Check size={12} weight="bold" />
      </button>
      {/* Drop indicator: the dragged photos land on this side. */}
      {over && <span className={cn('pointer-events-none absolute inset-y-1 z-10 w-1 rounded-full bg-type-0', over === 'after' ? '-right-0.5' : '-left-0.5')} />}
    </div>
  )
}

const ratioOf = (p) => (p.w && p.h ? p.w / p.h : 1)
/** Splits a set's photos into rows of two; each row is justified so both share one height. */
const pairs = (list) => Array.from({ length: Math.ceil(list.length / 2) }, (_, i) => list.slice(i * 2, i * 2 + 2))

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
