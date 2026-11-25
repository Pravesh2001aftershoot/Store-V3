import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Check, CircleNotch, DotsThree, FolderSimple, Plus,
  ImageSquare, MagnifyingGlass, PencilSimple, Star, Trash, UploadSimple, X, EyeSlash, ArrowUUpLeft,
} from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import { cn, plural } from '../../lib/utils'
import { notify } from '../../gallery/lib/actions'
import { NAME_LIMIT } from '../../gallery/lib/library'
import { BottomCTA, Empty, IconButton, Menu, PageHeader, Tag, ease } from '../components/ui'
import { usePhone, useTopOffset } from '../lib/hooks'

const MIME = 'application/x-store-v3-photos' // photo ids being dragged inside the dashboard
const ALL = '__all'
const REMOVED = '__removed'
const ALT = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌥' : 'Alt'

/**
 * Step 1 — Photos. Add photos (button or drop files anywhere), sort them into collections, set
 * their order, choose the cover and take photos out of the gallery. Selection-first, like a photo
 * manager: a tap selects, and actions apply to the selection.
 */
export default function PhotosStep({ ws }) {
  const { library, photos, media } = ws
  const phone = usePhone()
  const top = useTopOffset()
  const [active, setActive] = useState(ALL)
  const [selected, setSelected] = useState(() => new Set())
  const anchor = useRef(null)
  const [progress, setProgress] = useState(null) // { done, total } while uploading
  const [fileDrag, setFileDrag] = useState(false)
  const dragDepth = useRef(0)
  const input = useRef(null)
  const [naming, setNaming] = useState(null) // { mode: 'new' | 'rename', from?, value }
  const [query, setQuery] = useState('')
  const search = useRef(null)
  const grid = useRef(null)
  const [live, setLive] = useState('') // screen-reader announcement after a keyboard move

  const collections = library.collections
  // A deleted or renamed collection falls back to All.
  useEffect(() => {
    if (active !== ALL && active !== REMOVED && !collections.includes(active)) setActive(ALL)
  }, [active, collections])
  useEffect(() => {
    if (active === REMOVED && library.removed.length === 0) setActive(ALL)
  }, [active, library.removed.length])

  const counts = useMemo(() => Object.fromEntries(collections.map((c) => [c, photos.filter((p) => p.collection === c).length])), [collections, photos])
  const inView = useMemo(
    () => (active === ALL ? photos : active === REMOVED ? library.removed : photos.filter((p) => p.collection === active)),
    [active, photos, library.removed]
  )
  // Search narrows the view by file name (case-insensitive, anywhere in the name).
  const q = query.trim().toLowerCase()
  const visible = useMemo(() => (q ? inView.filter((p) => (p.name ?? '').toLowerCase().includes(q)) : inView), [inView, q])
  const inCollection = active !== ALL && active !== REMOVED
  // Reordering needs the whole collection in view, so it pauses while searching.
  const canReorder = active !== REMOVED && !q
  const target = inCollection ? active : collections[0] // where new uploads go

  // Selection follows the view: switching clears it, and photos leaving the view leave it.
  useEffect(() => { setSelected(new Set()); anchor.current = null }, [active])
  const selectedList = useMemo(() => visible.filter((p) => selected.has(p.id)), [visible, selected])
  useEffect(() => {
    setSelected((s) => (selectedList.length === s.size ? s : new Set(selectedList.map((p) => p.id))))
  }, [selectedList])

  const toggle = (i, e) => {
    const id = visible[i].id
    const from = e?.shiftKey && anchor.current ? visible.findIndex((p) => p.id === anchor.current) : -1
    setSelected((s) => {
      const n = new Set(s)
      if (from !== -1) {
        const [lo, hi] = from < i ? [from, i] : [i, from]
        visible.slice(lo, hi + 1).forEach((p) => n.add(p.id))
      } else n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
    anchor.current = id
  }
  const clear = useCallback(() => { setSelected(new Set()); anchor.current = null }, [])
  const selectAll = useCallback(() => setSelected(new Set(visible.map((p) => p.id))), [visible])

  // Esc clears; ⌘/Ctrl+A selects everything in view; / jumps to search (not while typing).
  useEffect(() => {
    const on = (e) => {
      if (e.target.closest?.('input, textarea, [contenteditable]')) return
      if (e.key === 'Escape') clear()
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); search.current?.focus() }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); selectAll() }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [clear, selectAll])

  // ── Upload ────────────────────────────────────────────────────────────────
  const upload = async (files) => {
    if (!files?.length || progress) return
    const to = target
    setProgress({ done: 0, total: files.length })
    const { added, failed } = await library.addFiles(files, to, (done, total) => setProgress({ done, total }))
    setProgress(null)
    if (!added) return notify('Those files aren’t images we can read')
    notify(`Added ${plural(added, 'photo')} to ${to}${failed ? ` · ${failed} skipped` : ''}`)
  }

  const isFiles = (e) => [...(e.dataTransfer?.types ?? [])].includes('Files')
  const dropZone = {
    onDragEnter: (e) => { if (!isFiles(e)) return; e.preventDefault(); dragDepth.current++; setFileDrag(true) },
    onDragOver: (e) => { if (isFiles(e)) e.preventDefault() },
    onDragLeave: (e) => { if (!isFiles(e)) return; if (--dragDepth.current <= 0) { dragDepth.current = 0; setFileDrag(false) } },
    onDrop: (e) => {
      if (!isFiles(e)) return
      e.preventDefault()
      dragDepth.current = 0
      setFileDrag(false)
      upload(e.dataTransfer.files)
    },
  }

  // ── Collections ───────────────────────────────────────────────────────────
  const commitName = (raw) => {
    if (!naming) return
    const value = raw.trim()
    if (naming.mode === 'new') {
      if (value) {
        const made = library.addCollection(value)
        if (made) { setActive(made); notify(`Created “${made}”`) }
      }
    } else if (value && value !== naming.from) {
      if (collections.includes(value)) notify(`There’s already a collection called “${value}”`)
      else {
        library.renameCollection(naming.from, value)
        setActive(value)
      }
    }
    setNaming(null)
  }
  const deleteCollection = (name) => {
    const to = collections.find((c) => c !== name)
    const n = counts[name] ?? 0
    if (n && !window.confirm(`Delete “${name}”? Its ${plural(n, 'photo')} move to “${to}”.`)) return
    library.deleteCollection(name, to)
    setActive(ALL)
    notify(`Deleted “${name}”${n ? ` — photos moved to ${to}` : ''}`)
  }
  const shift = (name, by) => {
    const list = [...collections]
    const i = list.indexOf(name)
    const j = i + by
    if (j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    library.reorderCollections(list)
  }

  // ── Photo actions ─────────────────────────────────────────────────────────
  const ids = selectedList.map((p) => p.id)
  const moveTo = (to, list = ids) => {
    library.moveTo(list, to)
    notify(`Moved ${plural(list.length, 'photo')} to ${to}`)
    clear()
  }
  const remove = () => {
    if (ids.includes(media.photo.id)) media.choose(undefined)
    library.remove(ids)
    notify(`${plural(ids.length, 'photo')} removed from the gallery — find ${ids.length === 1 ? 'it' : 'them'} under Removed`)
    clear()
  }
  const restore = () => {
    library.restore(ids)
    notify(`${plural(ids.length, 'photo')} back in the gallery`)
    clear()
  }
  const uploadedOnly = selectedList.length > 0 && selectedList.every((p) => p.uploaded)
  const deleteForGood = async () => {
    if (!window.confirm(`Delete ${plural(ids.length, 'uploaded photo')} for good? This can’t be undone.`)) return
    await library.deleteUploads(ids)
    notify(`Deleted ${plural(ids.length, 'photo')}`)
    clear()
  }
  const makeCover = () => {
    media.choose(selectedList[0].id)
    notify('Cover photo updated')
    clear()
  }

  // ── Rearranging: drag onto a photo (or a collection tab), or ⌥/Alt + arrow keys ─
  // Photos land in the target photo's collection, so in All photos dragging across a collection
  // boundary also moves them there.
  const [over, setOver] = useState(null) // { id, after } — which side of which photo they'd land on
  const [dragging, setDragging] = useState(null) // ids being dragged
  const idsIn = (collection, except = []) => photos.filter((x) => x.collection === collection && !except.includes(x.id)).map((x) => x.id)
  const dragStart = (e, p) => {
    const list = selected.has(p.id) ? ids : [p.id]
    e.dataTransfer.setData(MIME, JSON.stringify(list))
    e.dataTransfer.effectAllowed = 'move'
    setDragging(list)
  }
  const dragEnd = () => { setDragging(null); setOver(null) }
  const isPhotos = (e) => [...(e.dataTransfer?.types ?? [])].includes(MIME)
  const sideOf = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    return e.clientX > r.left + r.width / 2
  }
  const dragOverPhoto = (e, p) => {
    if (!isPhotos(e) || !canReorder) return
    e.preventDefault()
    const after = sideOf(e)
    setOver((o) => (o?.id === p.id && o.after === after ? o : { id: p.id, after }))
  }
  const dropOnPhoto = (e, p) => {
    if (!isPhotos(e)) return
    e.preventDefault()
    const after = sideOf(e)
    dragEnd()
    if (!canReorder) return
    const moving = JSON.parse(e.dataTransfer.getData(MIME))
    if (!moving.length || moving.includes(p.id)) return
    const rest = idsIn(p.collection, moving)
    const before = after ? rest[rest.indexOf(p.id) + 1] ?? null : p.id
    const leaving = photos.filter((x) => moving.includes(x.id) && x.collection !== p.collection).length
    library.place(moving, p.collection, before)
    if (leaving) notify(`Moved ${plural(leaving, 'photo')} to ${p.collection}`)
  }
  // Keyboard: arrows move focus; ⌥/Alt + arrows move the photo (or the selection it's part of)
  // within its collection — ↑/↓ by a row, Home/End to the start or end.
  const focusPhoto = (id) => requestAnimationFrame(() => grid.current?.querySelector(`[data-photo="${CSS.escape(id)}"]`)?.focus())
  // Rows are justified, so ↑/↓ go to the photo in the row above/below whose centre is nearest.
  const rowStep = (i, dir) => {
    const tiles = [...(grid.current?.querySelectorAll('[data-photo]') ?? [])]
    const box = (el) => el.getBoundingClientRect()
    const here = tiles[i] && box(tiles[i])
    if (!here) return dir
    const x = here.left + here.width / 2
    let best = null
    tiles.forEach((el, j) => {
      const r = box(el)
      if (dir > 0 ? r.top <= here.top + 1 : r.top >= here.top - 1) return
      const score = Math.abs(r.top - here.top) * 1e4 + Math.abs(r.left + r.width / 2 - x)
      if (!best || score < best.score) best = { j, score }
    })
    return best ? best.j - i : 0
  }
  const onTileKey = (e, i) => {
    const p = visible[i]
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: rowStep(i, -1), ArrowDown: rowStep(i, 1), Home: -Infinity, End: Infinity }[e.key]
    if (step === undefined) return
    e.preventDefault()
    if (!e.altKey) {
      const j = Math.max(0, Math.min(visible.length - 1, i + (Number.isFinite(step) ? step : step < 0 ? -i : visible.length)))
      return focusPhoto(visible[j].id)
    }
    if (!canReorder) return notify(active === REMOVED ? 'Removed photos can’t be reordered' : 'Clear the search to reorder')
    const list = idsIn(p.collection)
    const moving = selected.has(p.id) ? selectedList.filter((x) => x.collection === p.collection).map((x) => x.id) : [p.id]
    const start = Math.min(...moving.map((id) => list.indexOf(id)))
    const rest = list.filter((id) => !moving.includes(id))
    const at = Math.max(0, Math.min(rest.length, start + step))
    if (at !== start) library.place(moving, p.collection, rest[at] ?? null)
    const what = moving.length > 1 ? `${moving.length} photos` : 'Photo'
    setLive(at === start ? `${what} already ${step < 0 ? 'first' : 'last'} in ${p.collection}` : `${what} moved to position ${at + 1} of ${list.length} in ${p.collection}`)
    focusPhoto(p.id)
  }
  const dropOnChip = (e, name) => {
    if (!isPhotos(e)) return
    e.preventDefault()
    const moving = JSON.parse(e.dataTransfer.getData(MIME))
    if (moving.length) moveTo(name, moving)
  }

  const coverId = media.photo.id

  // Header on tablet/desktop; on phones the same two actions are the BottomCTA (hidden while selecting).
  const headerActions = (
    <>
      <Button variant="outline" size="md" onClick={() => input.current?.click()} disabled={!!progress}>
        {progress ? <CircleNotch size={16} className="animate-spin" /> : <UploadSimple size={16} />}
        {progress ? `Adding ${progress.done}/${progress.total}` : 'Add Images'}
      </Button>
      <Button size="md" onClick={() => setNaming({ mode: 'new', value: '' })}>
        <Plus size={16} /> Create Set
      </Button>
    </>
  )

  return (
    <div {...dropZone} className="relative mx-auto max-w-[1800px] px-4 pb-40 pt-6 md:px-6 md:pt-8">
      <PageHeader
        title="Photos"
        description="Add photos, sort them into collections and choose what your client sees. Everything saves as you go."
        actions={!phone && headerActions}
      />
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = '' }} />

      {/* Collections */}
      <div style={{ top }} className="sticky z-20 -mx-4 mt-6 bg-surface-0 px-4 md:-mx-6 md:px-6">
        <div className="no-scrollbar flex items-center gap-6 overflow-x-auto">
          <Tab active={active === ALL} count={photos.length} onClick={() => setActive(ALL)}>All photos</Tab>
          <span className="h-5 w-px shrink-0 bg-border" />
          {collections.map((c) =>
            naming?.mode === 'rename' && naming.from === c ? (
              <NameInput key={c} naming={naming} setNaming={setNaming} onCommit={commitName} />
            ) : (
              <Tab
                key={c}
                active={active === c}
                count={counts[c]}
                onClick={() => setActive(c)}
                onDragOver={(e) => isPhotos(e) && e.preventDefault()}
                onDrop={(e) => dropOnChip(e, c)}
                title="Drop photos here to move them"
              >
                {c}
              </Tab>
            )
          )}
          {naming?.mode === 'new' ? (
            <NameInput naming={naming} setNaming={setNaming} onCommit={commitName} />
          ) : (
            <button
              onClick={() => setNaming({ mode: 'new', value: '' })}
              className="flex h-12 shrink-0 items-center gap-1.5 text-13-m text-type-2 transition hover:text-type-0"
            >
              <Plus size={16} /> New Set
            </button>
          )}
          {library.removed.length > 0 && (
            <>
              <span className="h-5 w-px shrink-0 bg-border" />
              <Tab active={active === REMOVED} count={library.removed.length} onClick={() => setActive(REMOVED)}>
                <EyeSlash size={14} /> Removed
              </Tab>
            </>
          )}
        </div>
      </div>

      {/* The open collection: what it is and what you can do with it. */}
      <div className="flex min-h-14 flex-wrap items-center gap-3 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-16-sb text-type-0">
            {active === ALL ? 'All photos' : active === REMOVED ? 'Removed from the gallery' : active}
          </p>
          <p className="truncate text-12-r text-type-2">
            {q
              ? `${plural(visible.length, 'photo')} matching “${query.trim()}”`
              : active === REMOVED
                ? 'Clients don’t see these. Restore them any time.'
                : inCollection
                  ? `${plural(visible.length, 'photo')} · ${phone ? 'tap to select' : `drag or ${ALT} + arrow keys to reorder`}`
                  : `${plural(visible.length, 'photo')} in ${plural(collections.length, 'collection')} · ${phone ? 'tap to select' : 'click to select, drag to rearrange'}`}
          </p>
        </div>
        <SearchField inputRef={search} value={query} onChange={setQuery} />
        {inCollection && (
          <Menu
            label={`${active} options`}
            trigger={({ toggle }) => (
              <IconButton label="Collection options" onClick={toggle} className="bg-surface-2">
                <DotsThree size={20} weight="bold" />
              </IconButton>
            )}
            items={[
              { label: 'Rename', icon: PencilSimple, onClick: () => setNaming({ mode: 'rename', from: active, value: active }) },
              { label: 'Add photos here', icon: UploadSimple, onClick: () => input.current?.click() },
              null,
              { label: 'Move earlier', icon: ArrowLeft, onClick: () => shift(active, -1), disabled: collections[0] === active },
              { label: 'Move later', icon: ArrowRight, onClick: () => shift(active, 1), disabled: collections.at(-1) === active },
              null,
              { label: 'Delete collection', icon: Trash, danger: true, onClick: () => deleteCollection(active), disabled: collections.length < 2 },
            ]}
          />
        )}
      </div>

      {/* Grid */}
      {visible.length === 0 && q ? (
        <Empty
          icon={MagnifyingGlass}
          title={`No photos match “${query.trim()}”`}
          action={<Button variant="outline" size="md" onClick={() => setQuery('')}>Clear search</Button>}
        >
          Search looks at file names in {active === ALL ? 'every collection' : active === REMOVED ? 'removed photos' : active}.
        </Empty>
      ) : visible.length === 0 ? (
        <Empty
          icon={ImageSquare}
          title={inCollection ? `No photos in ${active} yet` : 'No photos yet'}
          action={
            <Button size="md" onClick={() => input.current?.click()}>
              <UploadSimple size={16} /> Add photos
            </Button>
          }
        >
          Drop photos anywhere on this page, or move photos here from another collection.
        </Empty>
      ) : (
        // Justified rows: each photo keeps its own aspect ratio; widths flex so every full row
        // spans the grid at roughly --row tall. The last row keeps its natural widths.
        <div ref={grid} className="flex flex-wrap gap-1.5 [--row:112px] sm:[--row:150px] md:gap-2 lg:[--row:180px] 2xl:[--row:200px]">
          {visible.map((p, i) => {
            const ratio = p.w && p.h ? p.w / p.h : 1
            return (
            <motion.div
              key={p.id}
              layout="position"
              transition={{ duration: 0.3, ease }}
              style={{ flexGrow: ratio, flexBasis: `calc(var(--row) * ${ratio})`, aspectRatio: ratio }}
              className="min-w-0"
            >
              <Tile
                photo={p}
                selected={selected.has(p.id)}
                selecting={selected.size > 0}
                cover={p.id === coverId}
                over={over?.id === p.id ? (over.after ? 'after' : 'before') : null}
                dragging={!!dragging?.includes(p.id)}
                draggable={!phone && active !== REMOVED}
                onToggle={(e) => toggle(i, e)}
                onKeyDown={(e) => onTileKey(e, i)}
                onDragStart={(e) => dragStart(e, p)}
                onDragEnd={dragEnd}
                onDragOver={(e) => dragOverPhoto(e, p)}
                onDragLeave={() => setOver((o) => (o?.id === p.id ? null : o))}
                onDrop={(e) => dropOnPhoto(e, p)}
                showCollection={active === ALL || active === REMOVED}
              />
            </motion.div>
            )
          })}
          <span aria-hidden className="grow-[999]" />
        </div>
      )}
      <p id="photo-keys" className="sr-only">
        Space or Enter selects. Arrow keys move between photos. {ALT} plus arrow keys moves the photo; Home and End move it to the start or end.
      </p>
      <p aria-live="polite" className="sr-only">{live}</p>

      {/* Drop files overlay */}
      <AnimatePresence>
        {fileDrag && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-surface-0/80 p-6 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-type-0 bg-surface-1 px-12 py-10 text-center shadow-xl">
              <UploadSimple size={32} />
              <p className="mt-3 text-20-m text-type-0">Drop to add to {target}</p>
              <p className="mt-1 text-13-r text-type-2">JPEG, PNG, WebP or AVIF · resized to 2400px</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedList.length === 0 && <BottomCTA>{headerActions}</BottomCTA>}

      <SelectionBar
        phone={phone}
        count={selectedList.length}
        total={visible.length}
        removedView={active === REMOVED}
        collections={collections}
        current={inCollection ? active : null}
        uploadedOnly={uploadedOnly}
        onAll={selectAll}
        onClear={clear}
        onMove={moveTo}
        onCover={selectedList.length === 1 ? makeCover : undefined}
        onRemove={remove}
        onRestore={restore}
        onDelete={deleteForGood}
      />
    </div>
  )
}

/** Inline name field in the collection row. Enter or leaving the field saves; Esc cancels. Commits once. */
/** Collection tab: text with a 2px `type-0` bottom stroke that slides to the active tab. */
function Tab({ active, count, children, ...props }) {
  return (
    <button
      {...props}
      className={cn(
        'relative flex h-12 shrink-0 items-center gap-1.5 text-13-m transition-colors',
        active ? 'text-type-0' : 'text-type-2 hover:text-type-0'
      )}
    >
      {children}
      {count != null && <span className="tabular-nums text-type-3">{count}</span>}
      {active && <motion.span layoutId="collection-tab" transition={{ duration: 0.3, ease }} className="absolute inset-x-0 bottom-0 h-0.5 bg-type-0" />}
    </button>
  )
}

function NameInput({ naming, setNaming, onCommit }) {
  const [value, setValue] = useState(naming.value)
  const done = useRef(false)
  const finish = (save) => {
    if (done.current) return
    done.current = true
    save ? onCommit(value) : setNaming(null)
  }
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); finish(true) }}
      className="flex h-9 shrink-0 items-center gap-1 rounded-full border border-type-0 bg-surface-1 pl-3.5 pr-1 ring-4 ring-black/5"
    >
      <FolderSimple size={16} className="text-type-2" />
      <input
        autoFocus
        value={value}
        maxLength={NAME_LIMIT}
        placeholder="Collection name"
        aria-label="Collection name"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && finish(false)}
        onBlur={() => finish(true)}
        className="w-36 bg-transparent text-13-m text-type-0 outline-none placeholder:text-type-3"
      />
      <button type="submit" aria-label="Save name" className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground">
        <Check size={12} weight="bold" />
      </button>
    </form>
  )
}

function Tile({ photo: p, selected, selecting, cover, over, dragging, draggable, onToggle, onKeyDown, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, showCollection }) {
  return (
    <div
      role="checkbox"
      aria-checked={selected}
      aria-label={`${p.name ?? 'Photo'}${cover ? ', cover photo' : ''}`}
      aria-describedby="photo-keys"
      data-photo={p.id}
      tabIndex={0}
      draggable={draggable}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggle(e) } else onKeyDown(e) }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'group relative h-full w-full cursor-pointer select-none overflow-hidden rounded-none bg-surface-2 outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-type-0 focus-visible:ring-offset-2',
        draggable && 'active:cursor-grabbing',
        dragging && 'opacity-40'
      )}
    >
      <img
        src={p.thumb}
        alt=""
        loading="lazy"
        draggable={false}
        className={cn('h-full w-full object-cover transition duration-300', selected ? 'scale-[0.9]' : 'group-hover:scale-[1.03]')}
      />
      {/* Hover / selection wash */}
      <span className={cn('pointer-events-none absolute inset-0 transition', selected ? 'bg-type-0/5' : 'bg-black/0 group-hover:bg-black/10')} />
      {/* Check */}
      <span
        className={cn(
          'pointer-events-none absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full border transition',
          selected ? 'border-type-0 bg-type-0 text-white' : 'border-white/90 bg-black/20 text-transparent backdrop-blur-sm',
          !selected && !selecting && 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-0'
        )}
      >
        <Check size={12} weight="bold" />
      </span>
      <span className="pointer-events-none absolute right-2 top-2 flex flex-col items-end gap-1">
        {cover && (
          <Tag tone="dark" className="gap-1">
            <Star size={10} weight="fill" /> Cover
          </Tag>
        )}
        {p.uploaded && <Tag className="bg-surface-1/90 backdrop-blur">New</Tag>}
      </span>
      {showCollection && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/50 to-transparent px-2 pb-1.5 pt-5 text-11-m text-white opacity-0 transition group-hover:opacity-100">
          {p.collection}
        </span>
      )}
      {/* Drop indicator: the dragged photos go before this one. */}
      {over && <span className={cn('pointer-events-none absolute inset-y-1 w-1 rounded-full bg-type-0', over === 'after' ? 'right-0' : 'left-0')} />}
    </div>
  )
}

/** Photo search: a 40px pill, 260px wide (full width under the title on phones). Esc clears, then leaves. */
function SearchField({ inputRef, value, onChange }) {
  return (
    <label className="flex h-10 items-center gap-2 rounded-full border border-input bg-surface-1 px-3.5 transition focus-within:border-type-0 max-sm:order-last max-sm:w-full sm:w-[260px]">
      <MagnifyingGlass size={16} className="shrink-0 text-type-3" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); value ? onChange('') : e.currentTarget.blur() } }}
        placeholder="Search by file name"
        aria-label="Search photos by file name"
        className="h-full min-w-0 flex-1 bg-transparent text-14-r text-type-0 outline-none placeholder:text-type-3 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="text-type-3 hover:text-type-0"><X size={14} /></button>}
    </label>
  )
}

/** Floating bar while photos are selected: count, select all, and the bulk actions. */
function SelectionBar({ phone, count, total, removedView, collections, current, uploadedOnly, onAll, onClear, onMove, onCover, onRemove, onRestore, onDelete }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.3, ease }}
          className="fixed inset-x-3 z-50 mx-auto flex max-w-[720px] items-center gap-1 rounded-full bg-type-0 p-1.5 pl-2 text-white shadow-[0_20px_50px_-15px_rgba(0,0,0,.5)]"
          style={{ bottom: 20 }}
        >
          <button onClick={onClear} aria-label="Clear selection" className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition hover:bg-white/10">
            <X size={16} />
          </button>
          <p className="min-w-0 truncate pl-1 text-13-m tabular-nums">{count} selected</p>
          {count < total && (
            <button onClick={onAll} className="hidden h-9 shrink-0 rounded-full px-3 text-13-r text-white/70 transition hover:bg-white/10 hover:text-white sm:block">
              Select all {total}
            </button>
          )}
          <span className="flex-1" />
          {removedView ? (
            <>
              <BarButton icon={ArrowUUpLeft} label="Restore" onClick={onRestore} />
              {uploadedOnly && <BarButton icon={Trash} label="Delete" onClick={onDelete} danger />}
            </>
          ) : (
            <>
              <Menu
                label="Move to collection"
                align="right"
                side="top"
                trigger={({ toggle }) => <BarButton icon={FolderSimple} label="Move to" onClick={toggle} />}
                items={collections.map((c) => ({ label: c, icon: FolderSimple, onClick: () => onMove(c), disabled: c === current }))}
              />
              {onCover && <BarButton icon={Star} label="Make cover" onClick={onCover} />}
              <BarButton icon={EyeSlash} label="Remove" onClick={onRemove} />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function BarButton({ icon: Icon, label, danger, ...props }) {
  return (
    <button
      {...props}
      title={label}
      className={cn('flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-13-m transition hover:bg-white/10 max-sm:px-2.5', danger && 'text-red-300')}
    >
      <Icon size={16} />
      <span className="max-sm:sr-only">{label}</span>
    </button>
  )
}
