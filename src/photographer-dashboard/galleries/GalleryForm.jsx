import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Images, Sparkle, Trash } from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import { cn } from '../../lib/utils'
import { galleryKey, LIMITS, useGalleries } from '../../data/galleries'
import { useCatalogs } from '../../data/storeConfig'
import { purgeUploads } from '../../gallery/lib/library'
import { notify } from '../../gallery/lib/actions'
import { TextField } from '../../gallery/templates/cover/controls'
import Modal from '../components/Modal'
import { Select } from '../components/ui'

const STARTS = [
  { id: 'empty', icon: Images, title: 'Empty', body: 'Upload your own photos' },
  { id: 'sample', icon: Sparkle, title: 'Sample photos', body: 'Try it out with 200+ photos' },
]

/**
 * New gallery (no `gallery`) or a gallery's settings: title, client, date and which store catalog
 * its clients buy from. Settings also hold Delete.
 */
export default function GalleryForm({ open, onOpenChange, gallery }) {
  const editing = !!gallery
  const { galleries, create, update, remove } = useGalleries()
  const { catalogs } = useCatalogs()
  const navigate = useNavigate()
  const [f, setF] = useState(null)

  useEffect(() => {
    if (!open) return
    setF({
      title: gallery?.title ?? '',
      client: gallery?.client ?? '',
      date: gallery?.date ?? '',
      catalogId: gallery?.catalogId ?? catalogs[0].id,
      start: 'empty',
    })
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!f) return null
  const set = (patch) => setF((x) => ({ ...x, ...patch }))
  const valid = f.title.trim().length > 0

  const submit = (e) => {
    e?.preventDefault()
    if (!valid) return
    if (editing) {
      update(gallery.id, { title: f.title.trim(), client: f.client.trim() || f.title.trim(), date: f.date.trim() || gallery.date, catalogId: f.catalogId })
      notify('Gallery updated')
      onOpenChange(false)
    } else {
      const g = create({ ...f, sample: f.start === 'sample' })
      onOpenChange(false)
      notify(`${g.title} created`)
      navigate(`/dashboard/galleries/${g.id}/photos`)
    }
  }

  const del = async () => {
    if (!window.confirm(`Delete “${gallery.title}”? Its photos, design and link are removed for good.`)) return
    await purgeUploads(galleryKey(gallery.id, 'library'))
    remove(gallery.id)
    onOpenChange(false)
    notify(`${gallery.title} deleted`)
    navigate('/dashboard/galleries')
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Gallery settings' : 'New gallery'}
      description={editing ? 'Details your client sees, and the store they buy prints from.' : 'You can change all of this later.'}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={!valid}>{editing ? 'Save' : 'Create gallery'}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <TextField label="Gallery title" value={f.title} onChange={(v) => set({ title: v })} limit={LIMITS.title} placeholder="Sam & Alex — Wedding" hint="Shown on the cover" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Client name" value={f.client} onChange={(v) => set({ client: v })} limit={LIMITS.client} placeholder={f.title.trim() || 'Sam & Alex'} hint="Empty uses the title" />
          <TextField label="Date" value={f.date} onChange={(v) => set({ date: v })} limit={LIMITS.date} placeholder={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} hint="As you’d like it written" />
        </div>
        <div>
          <p className="mb-1.5 text-13-m text-type-0">Print store catalog</p>
          <Select label="Print store catalog" value={f.catalogId} onChange={(v) => set({ catalogId: v })} options={catalogs.map((c) => ({ value: c.id, label: c.name }))} className="w-full" />
          <p className="mt-1.5 text-12-r text-type-3">The products, packages and prices this gallery’s clients can order.</p>
        </div>
        {!editing && (
          <div>
            <p className="mb-1.5 text-13-m text-type-0">Start with</p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Start with">
              {STARTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={f.start === s.id}
                  onClick={() => set({ start: s.id })}
                  className={cn('flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition', f.start === s.id ? 'border-type-0 ring-4 ring-black/5' : 'border-border hover:border-type-3')}
                >
                  <s.icon size={20} weight={f.start === s.id ? 'fill' : 'regular'} />
                  <span>
                    <span className="block text-13-m text-type-0">{s.title}</span>
                    <span className="block text-12-r text-type-2">{s.body}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        {editing && (
          <div className="border-t border-border pt-4">
            <p className="text-13-m text-type-0">Delete gallery</p>
            <p className="mt-0.5 text-12-r text-type-2">{galleries.length > 1 ? 'Removes its photos, design and client link.' : 'You need at least one gallery.'}</p>
            <Button type="button" variant="outline" size="sm" className="mt-2 text-destructive max-sm:h-10 max-sm:w-full" disabled={galleries.length < 2} onClick={del}>
              <Trash size={14} /> Delete gallery
            </Button>
          </div>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
