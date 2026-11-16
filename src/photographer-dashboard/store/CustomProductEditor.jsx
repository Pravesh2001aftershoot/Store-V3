import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Info, Plus, Star, Trash, UploadSimple, Warning, X } from '@phosphor-icons/react'
import { cn, money, plural } from '../../lib/utils'
import { LIMITS, LOOKS, MODES, STORE_BUDGET, sizeLabel, storeSize } from '../../data/storeConfig'
import { notify } from '../../gallery/lib/actions'
import EditorPane from '../../gallery/templates/editor/EditorPane'
import { Section, Switch, TextField } from '../../gallery/templates/cover/controls'
import { Button } from '../../components/ui'
import ProductMockup from '../../components/ProductMockup'
import { PriceInput, Select } from '../components/ui'

const TABS = [
  { id: 'details', label: 'Details' },
  { id: 'images', label: 'Images' },
  { id: 'sizes', label: 'Sizes' },
  { id: 'options', label: 'Options' },
]

const OPTION_TYPES = [
  { value: 'segmented', label: 'Buttons' },
  { value: 'card', label: 'Cards with a note' },
  { value: 'swatch', label: 'Colour swatches' },
]

const MODE_HINT = {
  unit: 'Each photo the client picks makes one item, so more photos means a higher quantity.',
  set: 'Every few photos make one item, like a triptych.',
  book: 'One item holding a range of photos. Photos above the included number cost extra.',
}

/** Next free id like `z3` in a list of `{ id }`. */
const nextId = (prefix, list) => `${prefix}${Math.max(0, ...list.map((x) => Number(String(x.id).slice(prefix.length)) || 0)) + 1}`

/**
 * Builds and edits one of the photographer's own products: Details (visibility, name, tagline, badge,
 * category, description, highlights, delete), Images (product shots and the preview look), Sizes (how
 * photos work, and each size with its price) and Options (choices like finish or colour, each with an
 * add-on price). Everything saves as it's typed; there's nothing to reset to.
 */
export default function CustomProductEditor({ id, s, ...pane }) {
  const [tab, setTab] = useState('details')
  useEffect(() => { setTab('details') }, [id])
  const def = id ? s.cfg.customProducts.find((p) => p.id === id) : null
  const live = def && s.allProducts.find((p) => p.id === id)
  if (!def || !live) return <EditorPane {...pane} open={false} tabs={[]} />

  const edit = (patch) => s.editOwnProduct(id, patch)
  const sizes = def.options.find((o) => o.id === 'size').values
  const extras = def.options.filter((o) => o.id !== 'size')

  return (
    <EditorPane
      {...pane}
      modal={false}
      title={live.name}
      subtitle={`${live.hidden ? 'Hidden' : 'In the store'} · ${plural(sizes.length, 'size')} · from ${money(Math.min(...sizes.map((v) => v.price)))}`}
      previewLabel="See the list"
      tabs={TABS}
      tab={tab}
      onTab={setTab}
    >
      {tab === 'details' && <Details def={def} live={live} s={s} edit={edit} onClose={pane.onClose} />}
      {tab === 'images' && <Images def={def} live={live} edit={edit} />}
      {tab === 'sizes' && <Sizes def={def} sizes={sizes} edit={edit} />}
      {tab === 'options' && <Options def={def} extras={extras} edit={edit} />}
    </EditorPane>
  )
}

// ── Details ────────────────────────────────────────────────────────────────

function Details({ def, live, s, edit, onClose }) {
  const usedIn = s.allPackages.filter((p) => p.slots.some((x) => x.productId === def.id))
  return (
    <div>
      <Section title="In the store">
        <Row label="Show in the store" hint={live.hidden ? 'Clients can’t see or order it yet' : 'Clients can order it'}>
          <Switch checked={!live.hidden} onChange={(on) => { edit({ hidden: !on }); notify(on ? `${live.name} is in the store` : `${live.name} hidden from the store`) }} label="Show in the store" />
        </Row>
      </Section>
      <Section title="How it’s listed">
        <TextField label="Name" value={def.name} onChange={(v) => edit({ name: v })} limit={LIMITS.name} placeholder="e.g. Wooden Photo Block" error={!def.name.trim() ? 'Give it a name — it shows as “Untitled product”' : null} />
        <TextField label="Tagline" value={def.tagline} onChange={(v) => edit({ tagline: v })} limit={LIMITS.tagline} placeholder="One line under the name" multiline />
        <TextField label="Badge" value={def.badge} onChange={(v) => edit({ badge: v })} limit={LIMITS.badge} placeholder="e.g. New" hint="A small label on the product card. Empty for none." />
        <div>
          <p className="mb-1.5 text-13-m text-type-0">Category</p>
          <Select label="Category" value={def.category} options={s.categories.map((c) => ({ value: c.id, label: c.name }))} onChange={(v) => edit({ category: v })} className="w-full" />
          <p className="mt-1.5 text-12-r text-type-3">Where it’s listed in the store.</p>
        </div>
      </Section>
      <Section title="Description" hint="Shown under Details on the product page.">
        <TextField label="Description" value={def.description} onChange={(v) => edit({ description: v })} limit={LIMITS.description} placeholder="What it’s made of, how it’s finished, what makes it special" multiline />
        <Highlights def={def} edit={edit} />
      </Section>
      <Section title="Delete">
        {usedIn.length > 0 && (
          <p className="flex gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-12-r-p text-amber-800">
            <Warning size={16} className="mt-px shrink-0" />
            In {usedIn.map((p) => p.name).join(', ')}. Deleting it takes it out of {usedIn.length === 1 ? 'that package' : 'those packages'} too.
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          className="self-start text-destructive max-sm:h-10 max-sm:w-full"
          onClick={() => {
            if (!window.confirm(`Delete “${live.name}”? Clients can no longer order it${usedIn.length ? ', and it’s removed from your packages' : ''}.`)) return
            onClose()
            s.deleteProduct(def.id)
            notify(`${live.name} deleted`)
          }}
        >
          <Trash size={14} /> Delete product
        </Button>
      </Section>
    </div>
  )
}

/** The checklist under the description: one line each, up to LIMITS.details. */
function Highlights({ def, edit }) {
  const set = (i, v) => edit((p) => ({ details: p.details.map((d, k) => (k === i ? v : d)) }))
  return (
    <div>
      <p className="mb-1.5 text-13-m text-type-0">Highlights</p>
      <div className="space-y-2">
        {def.details.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <Field value={d} onChange={(v) => set(i, v)} limit={LIMITS.detail} placeholder="e.g. Solid oak, hand finished" label={`Highlight ${i + 1}`} className="flex-1" />
            <RemoveButton label={`Remove highlight ${i + 1}`} onClick={() => edit((p) => ({ details: p.details.filter((_, k) => k !== i) }))} />
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" className="mt-2 max-sm:h-10 max-sm:w-full" disabled={def.details.length >= LIMITS.details} onClick={() => edit((p) => ({ details: [...p.details, ''] }))}>
        <Plus size={14} /> Add a highlight
      </Button>
      <p className="mt-1.5 text-12-r text-type-3">A short checklist, up to {LIMITS.details} lines.</p>
    </div>
  )
}

// ── Images ─────────────────────────────────────────────────────────────────

/** Downscales an upload to a JPEG small enough to keep a few per product in localStorage (~100KB). */
function readImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, 1000 / Math.max(img.naturalWidth, img.naturalHeight))
      const c = document.createElement('canvas')
      c.width = Math.round(img.naturalWidth * scale)
      c.height = Math.round(img.naturalHeight * scale)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve({ src: c.toDataURL('image/jpeg', 0.8), w: c.width, h: c.height })
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')) }
    img.src = url
  })
}

function Images({ def, live, edit }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const room = LIMITS.images - def.images.length

  const upload = async (files) => {
    const list = [...files].filter((f) => f.type.startsWith('image/'))
    if (!list.length) return
    if (list.length > room) notify(`Only ${room} more ${room === 1 ? 'image fits' : 'images fit'} — up to ${LIMITS.images} per product`)
    setBusy(true)
    const added = []
    let size = storeSize()
    for (const f of list.slice(0, room)) {
      try {
        const img = await readImage(f)
        if (size + img.src.length > STORE_BUDGET) { notify('No room for more images — remove some from your products first'); break }
        size += img.src.length
        added.push(img)
      } catch { notify(`Couldn’t read ${f.name}`) }
    }
    setBusy(false)
    if (added.length) {
      edit((p) => ({ images: [...p.images, ...added].slice(0, LIMITS.images) }))
      notify(added.length === 1 ? 'Image added' : `${added.length} images added`)
    }
  }
  const move = (i, to) => edit((p) => {
    const images = [...p.images]
    const [img] = images.splice(i, 1)
    images.splice(to, 0, img)
    return { images }
  })

  return (
    <div>
      <Section title="Product images" hint={`Shown on the product card and page. The first is the cover. Up to ${LIMITS.images}.`}>
        <div className="grid grid-cols-3 gap-2">
          {def.images.map((img, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl bg-surface-2">
              <img src={img.src} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-11-m text-primary-foreground">Cover</span>}
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1">
                {i > 0 && <ImageAction label="Make cover" onClick={() => { move(i, 0); notify('Cover changed') }}><Star size={13} /></ImageAction>}
                {i > 0 && <ImageAction label="Move earlier" onClick={() => move(i, i - 1)}><ArrowLeft size={13} /></ImageAction>}
                {i < def.images.length - 1 && <ImageAction label="Move later" onClick={() => move(i, i + 1)}><ArrowRight size={13} /></ImageAction>}
                <ImageAction label="Remove image" onClick={() => edit((p) => ({ images: p.images.filter((_, k) => k !== i) }))}><X size={13} /></ImageAction>
              </div>
            </div>
          ))}
          {room > 0 && (
            <button
              onClick={() => input.current?.click()}
              disabled={busy}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-12-m text-type-2 transition hover:border-type-3 hover:text-type-0 disabled:opacity-50"
            >
              <UploadSimple size={18} />
              {busy ? 'Adding…' : 'Add images'}
            </button>
          )}
        </div>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = '' }} />
        {!def.images.length && <p className="text-12-r-p text-type-3">No images yet: the card shows the preview below with the client’s photo instead.</p>}
      </Section>
      <Section title="Preview with the client’s photo" hint="The store also shows the product with the client’s own photo in it. Pick the look closest to yours.">
        <div className="flex gap-3">
          <div className="w-[112px] shrink-0 overflow-hidden rounded-xl">
            <ProductMockup product={live} className="h-full w-full" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="mb-1.5 text-13-m text-type-0">Look</p>
              <Select label="Preview look" value={def.style} options={LOOKS.map((l) => ({ value: l.id, label: l.label }))} onChange={(v) => edit({ style: v })} className="w-full" />
            </div>
            <Row label="Landscape photos" hint="Clients can turn the crop sideways">
              <Switch checked={def.allowOrientation} onChange={(on) => edit({ allowOrientation: on })} label="Allow landscape photos" />
            </Row>
          </div>
        </div>
      </Section>
    </div>
  )
}

function ImageAction({ label, onClick, children }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="grid h-7 w-7 place-items-center rounded-full bg-surface-1/90 text-type-0 shadow-sm backdrop-blur transition hover:bg-surface-1">
      {children}
    </button>
  )
}

// ── Sizes ──────────────────────────────────────────────────────────────────

function Sizes({ def, sizes, edit }) {
  const setSizes = (fn) => edit((p) => ({ options: p.options.map((o) => (o.id === 'size' ? { ...o, values: fn(o.values) } : o)) }))
  const setSize = (sid, patch) => setSizes((vals) => vals.map((v) => {
    if (v.id !== sid) return v
    const next = { ...v, ...patch }
    return { ...next, label: sizeLabel(next.w, next.h) }
  }))
  const addSize = () => setSizes((vals) => {
    const last = vals[vals.length - 1]
    const w = Math.min(LIMITS.inches, last.w + 4)
    const h = Math.min(LIMITS.inches, last.h + 4)
    return [...vals, { id: nextId('z', vals), label: sizeLabel(w, h), w, h, price: Math.round(last.price * 1.4) }]
  })
  const setBook = (patch) => edit((p) => ({ book: { ...p.book, ...patch } }))

  return (
    <div>
      <Section title="How photos work">
        <Select label="How photos work" value={def.mode} options={MODES.map((m) => ({ value: m.id, label: m.label }))} onChange={(v) => edit({ mode: v })} className="w-full" />
        {def.mode === 'set' && (
          <Row label="Photos per item" hint="The client picks photos in multiples of this">
            <NumberInput value={def.setSize} onChange={(n) => edit({ setSize: n })} min={2} max={LIMITS.setSize} label="Photos per item" />
          </Row>
        )}
        {def.mode === 'book' && (
          <>
            <Row label="Photos included" hint="In the size price">
              <NumberInput value={def.book.min} onChange={(n) => setBook({ min: n })} min={1} max={LIMITS.bookPhotos} label="Photos included" />
            </Row>
            <Row label="Most photos" hint={def.book.max < def.book.min ? 'Can’t be below the included photos' : 'The most a client can add'}>
              <NumberInput value={def.book.max} onChange={(n) => setBook({ max: n })} min={1} max={LIMITS.bookPhotos} label="Most photos" />
            </Row>
            <Row label="Each extra photo" hint="Above the included photos">
              <PriceInput value={def.book.perExtra} onChange={(n) => setBook({ perExtra: n ?? 0 })} label="Price per extra photo" />
            </Row>
          </>
        )}
        <p className="flex gap-2 rounded-xl bg-surface-2 px-3 py-2.5 text-12-r-p text-type-2">
          <Info size={16} className="mt-px shrink-0" />
          {MODE_HINT[def.mode]}
        </p>
      </Section>
      <Section title="Sizes" hint={`Width × height in inches sets the shape of the client’s crop. The price is per item. Up to ${LIMITS.sizes}.`}>
        <div className="flex items-center gap-2 px-1 text-11-sb uppercase text-type-3">
          <span className="w-[132px] shrink-0">Size (in)</span>
          <span className="flex-1">Price</span>
        </div>
        <ul className="space-y-1.5">
          {sizes.map((v) => (
            <li key={v.id} className="flex items-center gap-2">
              <span className="flex w-[132px] shrink-0 items-center gap-1">
                <NumberInput value={v.w} onChange={(n) => setSize(v.id, { w: n })} min={1} max={LIMITS.inches} label={`${v.label} width`} />
                <span className="text-12-r text-type-3">×</span>
                <NumberInput value={v.h} onChange={(n) => setSize(v.id, { h: n })} min={1} max={LIMITS.inches} label={`${v.label} height`} />
              </span>
              <PriceInput value={v.price} onChange={(n) => setSize(v.id, { price: n ?? 0 })} label={`${v.label} price`} className="min-w-0 flex-1" />
              <RemoveButton label={`Remove ${v.label}`} disabled={sizes.length === 1} onClick={() => setSizes((vals) => vals.filter((x) => x.id !== v.id))} />
            </li>
          ))}
        </ul>
        <Button variant="outline" size="sm" className="self-start max-sm:h-10 max-sm:w-full" disabled={sizes.length >= LIMITS.sizes} onClick={addSize}>
          <Plus size={14} /> Add a size
        </Button>
        {sizes.length === 1 && <p className="text-12-r text-type-3">A product needs at least one size.</p>}
      </Section>
    </div>
  )
}

// ── Options ────────────────────────────────────────────────────────────────

function Options({ def, extras, edit }) {
  const setOption = (oid, fn) => edit((p) => ({ options: p.options.map((o) => (o.id === oid ? { ...o, ...fn(o) } : o)) }))
  const addOption = () => edit((p) => {
    const id = nextId('o', p.options.filter((o) => o.id !== 'size'))
    return { options: [...p.options, { id, label: '', type: 'segmented', values: [{ id: 'v1', label: '', delta: 0 }, { id: 'v2', label: '', delta: 0 }] }] }
  })
  const setType = (o, type) => setOption(o.id, (opt) => ({
    type,
    values: opt.values.map(({ hex, note, ...v }) => ({ ...v, ...(type === 'swatch' ? { hex: hex ?? '#1d1d1d' } : {}), ...(type === 'card' ? { note: note ?? '' } : {}) })),
  }))
  const setChoice = (o, vid, patch) => setOption(o.id, (opt) => ({ values: opt.values.map((v) => (v.id === vid ? { ...v, ...patch } : v)) }))
  const addChoice = (o) => setOption(o.id, (opt) => ({
    values: [...opt.values, { id: nextId('v', opt.values), label: '', delta: 0, ...(opt.type === 'swatch' ? { hex: '#c8a679' } : {}), ...(opt.type === 'card' ? { note: '' } : {}) }],
  }))

  return (
    <div>
      <Section title="Options" hint="Choices the client makes on top of the size, like finish, wood or colour. Each choice can add to the price; the first is picked by default.">
        {extras.length === 0 && (
          <p className="rounded-xl bg-surface-2 p-3 text-13-r-p text-type-2">No options yet: clients just pick a size. Add one for things like a finish or a colour.</p>
        )}
        <div className="space-y-3">
          {extras.map((o) => {
            const named = o.values.filter((v) => v.label.trim()).length
            return (
              <div key={o.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center gap-2">
                  <Field value={o.label} onChange={(v) => setOption(o.id, () => ({ label: v }))} limit={LIMITS.optionLabel} placeholder="Option name, e.g. Finish" label="Option name" className="flex-1" />
                  <RemoveButton label={`Remove ${o.label || 'option'}`} onClick={() => edit((p) => ({ options: p.options.filter((x) => x.id !== o.id) }))} />
                </div>
                <div className="mr-11 mt-2">
                  <Select label="Shown as" value={o.type} options={OPTION_TYPES} onChange={(t) => setType(o, t)} className="w-full" />
                </div>
                <ul className="mt-3 space-y-2">
                  {o.values.map((v, i) => (
                    <li key={v.id}>
                      <div className="flex items-center gap-2">
                        {o.type === 'swatch' && (
                          <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-black/10" style={{ background: v.hex }} title="Pick a colour">
                            <input type="color" value={v.hex?.startsWith('#') && v.hex.length === 7 ? v.hex : '#1d1d1d'} onChange={(e) => setChoice(o, v.id, { hex: e.target.value })} aria-label={`${v.label || `Choice ${i + 1}`} colour`} className="absolute inset-0 cursor-pointer opacity-0" />
                          </label>
                        )}
                        <Field value={v.label} onChange={(t) => setChoice(o, v.id, { label: t })} limit={LIMITS.choiceLabel} placeholder={`Choice ${i + 1}`} label={`Choice ${i + 1} name`} className="min-w-0 flex-1" />
                        <PriceInput value={v.delta} onChange={(n) => setChoice(o, v.id, { delta: n ?? 0 })} label={`${v.label || `Choice ${i + 1}`} add-on price`} prefix="+$" className="w-[88px]" />
                        <RemoveButton label={`Remove ${v.label || `choice ${i + 1}`}`} disabled={o.values.length === 1} onClick={() => setOption(o.id, (opt) => ({ values: opt.values.filter((x) => x.id !== v.id) }))} />
                      </div>
                      {o.type === 'card' && (
                        <Field value={v.note ?? ''} onChange={(t) => setChoice(o, v.id, { note: t })} limit={LIMITS.note} placeholder="A short note, e.g. No glare" label={`${v.label || `Choice ${i + 1}`} note`} className="mt-1.5 w-[calc(100%-2.75rem)]" />
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="ghost" size="sm" className="-ml-2 self-start max-sm:ml-0 max-sm:h-10 max-sm:w-full" disabled={o.values.length >= LIMITS.choices} onClick={() => addChoice(o)}>
                    <Plus size={14} /> Add a choice
                  </Button>
                  {named === 0 && <span className="text-12-r text-amber-700">Name a choice to show it</span>}
                </div>
              </div>
            )
          })}
        </div>
        <Button variant="outline" size="sm" className="self-start max-sm:h-10 max-sm:w-full" disabled={extras.length >= LIMITS.options} onClick={addOption}>
          <Plus size={14} /> Add an option
        </Button>
        {extras.length >= LIMITS.options && <p className="text-12-r text-type-3">Up to {LIMITS.options} options per product.</p>}
      </Section>
    </div>
  )
}

// ── Small fields ───────────────────────────────────────────────────────────

function Row({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-13-m text-type-0">{label}</p>
        {hint && <p className="text-12-r text-type-2">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

/** A compact one-line text input (36px), for list rows where a full TextField is too heavy. */
function Field({ value, onChange, limit, placeholder, label, className }) {
  return (
    <input
      value={value}
      maxLength={limit}
      placeholder={placeholder}
      aria-label={label}
      onChange={(e) => onChange(e.target.value.slice(0, limit))}
      className={cn('h-9 min-w-0 rounded-lg border border-input bg-surface-1 px-3 text-13-r text-type-0 outline-none transition placeholder:text-type-3 focus:border-type-0 focus:ring-4 focus:ring-black/5', className)}
    />
  )
}

/** Whole numbers only, clamped to min–max when the field loses focus. */
function NumberInput({ value, onChange, min, max, label }) {
  const [text, setText] = useState(String(value))
  useEffect(() => { setText(String(value)) }, [value])
  const commit = () => {
    const n = Math.min(max, Math.max(min, parseInt(text, 10) || min))
    setText(String(n))
    if (n !== value) onChange(n)
  }
  return (
    <input
      inputMode="numeric"
      aria-label={label}
      value={text}
      onChange={(e) => {
        const t = e.target.value.replace(/\D/g, '').slice(0, 3)
        setText(t)
        const n = parseInt(t, 10)
        if (n >= min && n <= max) onChange(n)
      }}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className="h-9 w-[58px] shrink-0 rounded-lg border border-input bg-surface-1 px-2 text-center text-14-r tabular-nums text-type-0 outline-none transition focus:border-type-0 focus:ring-4 focus:ring-black/5"
    />
  )
}

function RemoveButton({ label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-type-2 transition hover:bg-surface-2 hover:text-type-0 disabled:pointer-events-none disabled:opacity-30"
    >
      <X size={14} />
    </button>
  )
}
