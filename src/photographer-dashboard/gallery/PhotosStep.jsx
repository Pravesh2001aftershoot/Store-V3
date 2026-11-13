import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowCounterClockwise, ArrowLeft, ArrowRight, Check, CircleNotch, DotsThree, FolderSimple, FolderSimplePlus,
  ImageSquare, PencilSimple, Star, Trash, UploadSimple, X, EyeSlash, ArrowUUpLeft,
} from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import { cn, plural } from '../../lib/utils'
import { notify } from '../../gallery/lib/actions'
import { NAME_LIMIT } from '../../gallery/lib/library'
import { Chip, Empty, IconButton, Menu, PageHeader, Tag, ease } from '../components/ui'
import { usePhone, useTopOffset } from '../lib/hooks'

const MIME = 'application/x-store-v3-photos' // photo ids being dragged inside the dashboard
const ALL = '__all'
const REMOVED = '__removed'

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

  const collections = library.collections
  // A deleted or renamed collection falls back to All.
  useEffect(() => {
    if (active !== ALL && active !== REMOVED && !collections.includes(active)) setActive(ALL)
  }, [active, collections])
  useEffect(() => {
    if (active === REMOVED && library.removed.length === 0) setActive(ALL)
  }, [active, library.removed.length])

  const counts = useMemo(() => Object.fromEntries(collections.map((c) => [c, photos.filter((p) => p.collection === c).length])), [collections, photos])
  const visible = useMemo(
    () => (active === ALL ? photos : active === REMOVED ? library.removed : photos.filter((p) => p.collection === active)),
    [active, photos, library.removed]
  )
  const inCollection = active !== ALL && active !== REMOVED
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

  // Esc clears; ⌘/Ctrl+A selects everything in view (not while typing).
  useEffect(() => {
    const on = (e) => {
      if (e.target.closest?.('input, textarea, [contenteditable]')) return
      if (e.key === 'Escape') clear()
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

  // ── Drag to reorder (inside a collection) or onto a collection chip (move) ─
  const [over, setOver] = useState(null)
  const dragStart = (e, p) => {
    const list = selected.has(p.id) ? ids : [p.id]
    e.dataTransfer.setData(MIME, JSON.stringify(list))
    e.dataTransfer.effectAllowed = 'move'
  }
  const isPhotos = (e) => [...(e.dataTransfer?.types ?? [])].includes(MIME)
  const dropOnPhoto = (e, p) => {
    if (!isPhotos(e)) return
    e.preventDefault()
    setOver(null)
    if (!inCollection) return
    const moving = JSON.parse(e.dataTransfer.getData(MIME))
    if (moving.includes(p.id)) return
    const rest = visible.map((x) => x.id).filter((id) => !moving.includes(id))
    const at = rest.indexOf(p.id)
    library.reorder(active, [...rest.slice(0, at), ...moving, ...rest.slice(at)])
  }
  const dropOnChip = (e, name) => {
    if (!isPhotos(e)) return
    e.preventDefault()
    const moving = JSON.parse(e.dataTransfer.getData(MIME))
    if (moving.length) moveTo(name, moving)
  }

  const coverId = media.photo.id

  return (
    <div {...dropZone} className="relative mx-auto max-w-[1800px] px-4 pb-40 pt-6 md:px-6 md:pt-8">
      <PageHeader
        title="Photos"
        description="Add photos, sort them into collections and choose what your client sees. Everything saves as you go."
        actions={
          <>
            {library.edited && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.confirm('Put every photo back in its original collection and order? Uploads are kept.') && (library.reset(), notify('Arrangement reset'))}
              >
                <ArrowCounterClockwise size={14} /> Reset
              </Button>
            )}
            <Button size="md" onClick={() => input.current?.click()} disabled={!!progress}>
              {progress ? <CircleNotch size={16} className="animate-spin" /> : <UploadSimple size={16} />}
              {progress ? `Adding ${progress.done}/${progress.total}` : 'Add photos'}
            </Button>
            <Button as={Link} to={`${ws.base}/design`} variant="outline" size="md" className="max-sm:hidden">
              Next: Design <ArrowRight size={14} />
            </Button>
          </>
        }
      />
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = '' }} />

      {/* Collections */}
      <div style={{ top }} className="sticky z-20 -mx-4 mt-6 border-b border-border bg-surface-0 px-4 py-3 md:-mx-6 md:px-6">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <Chip active={active === ALL} count={photos.length} onClick={() => setActive(ALL)}>All photos</Chip>
          <span className="h-5 w-px shrink-0 bg-border" />
          {collections.map((c) =>
            naming?.mode === 'rename' && naming.from === c ? (
              <NameInput key={c} naming={naming} setNaming={setNaming} onCommit={commitName} />
            ) : (
              <Chip
                key={c}
                active={active === c}
                count={counts[c]}
                onClick={() => setActive(c)}
                onDragOver={(e) => isPhotos(e) && e.preventDefault()}
                onDrop={(e) => dropOnChip(e, c)}
                title="Drop photos here to move them"
              >
                {c}
              </Chip>
            )
          )}
          {naming?.mode === 'new' ? (
            <NameInput naming={naming} setNaming={setNaming} onCommit={commitName} />
          ) : (
            <button
              onClick={() => setNaming({ mode: 'new', value: '' })}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-dashed border-input px-3.5 text-13-m text-type-1 transition hover:border-type-2 hover:text-type-0"
            >
              <FolderSimplePlus size={16} /> New collection
            </button>
          )}
          {library.removed.length > 0 && (
            <>
              <span className="h-5 w-px shrink-0 bg-border" />
              <Chip active={active === REMOVED} count={library.removed.length} onClick={() => setActive(REMOVED)}>
                <EyeSlash size={14} /> Removed
              </Chip>
            </>
          )}
        </div>
      </div>

      {/* The open collection: what it is and what you can do with it. */}
      <div className="flex min-h-14 items-center gap-3 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-16-sb text-type-0">
            {active === ALL ? 'All photos' : active === REMOVED ? 'Removed from the gallery' : active}
          </p>
          <p className="truncate text-12-r text-type-2">
            {active === REMOVED
              ? 'Clients don’t see these. Restore them any time.'
              : inCollection
                ? `${plural(visible.length, 'photo')} · ${phone ? 'tap to select' : 'drag to reorder, or onto a collection to move'}`
                : `${plural(visible.length, 'photo')} in ${plural(collections.length, 'collection')} · ${phone ? 'tap to select' : 'click to select, Shift-click for a range'}`}
          </p>
        </div>
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
      {visible.length === 0 ? (
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
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:gap-2 lg:grid-cols-6 2xl:grid-cols-8">
          {visible.map((p, i) => (
            <Tile
              key={p.id}
              photo={p}
              selected={selected.has(p.id)}
              selecting={selected.size > 0}
              cover={p.id === coverId}
              over={over === p.id}
              draggable={!phone && active !== REMOVED}
              onToggle={(e) => toggle(i, e)}
              onDragStart={(e) => dragStart(e, p)}
              onDragOver={(e) => { if (isPhotos(e) && inCollection) { e.preventDefault(); setOver(p.id) } }}
              onDragLeave={() => setOver((o) => (o === p.id ? null : o))}
              onDrop={(e) => dropOnPhoto(e, p)}
              showCollection={active === ALL || active === REMOVED}
            />
          ))}
        </div>
      )}

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

function Tile({ photo: p, selected, selecting, cover, over, draggable, onToggle, onDragStart, onDragOver, onDragLeave, onDrop, showCollection }) {
  return (
    <div
      role="checkbox"
      aria-checked={selected}
      aria-label={`${p.name ?? 'Photo'}${cover ? ', cover photo' : ''}`}
      tabIndex={0}
      draggable={draggable}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggle(e) } }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="group relative aspect-square cursor-pointer select-none overflow-hidden rounded-lg bg-surface-2 outline-none focus-visible:ring-2 focus-visible:ring-type-0 focus-visible:ring-offset-2"
    >
      <img
        src={p.thumb}
        alt=""
        loading="lazy"
        draggable={false}
        className={cn('h-full w-full object-cover transition duration-300', selected ? 'scale-[0.9] rounded-md' : 'group-hover:scale-[1.03]')}
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
      {over && <span className="pointer-events-none absolute inset-y-1 left-0 w-1 rounded-full bg-type-0" />}
    </div>
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
