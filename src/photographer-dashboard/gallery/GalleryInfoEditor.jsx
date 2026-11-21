import { useState } from 'react'
import { Trash } from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import { LIMITS, useGalleries } from '../../data/galleries'
import { useCatalogs } from '../../data/storeConfig'
import { Section, TextField } from '../../gallery/templates/cover/controls'
import EditorPane from '../../gallery/templates/editor/EditorPane'
import { Select } from '../components/ui'
import { useDeleteGallery } from '../galleries/GalleryForm'

/**
 * Design part "Gallery info": the same fields as the Gallery settings modal (title, client, date,
 * print store catalog, Delete), in the gallery's editor shell. Saves as you type, like the other
 * editors. An empty title isn't saved (the field shows an error); an empty client falls back to the
 * title and an empty date keeps the last one.
 */
export default function GalleryInfoEditor({ open, onClose, phone, peek, onPeek, inline, id }) {
  const { galleries, update } = useGalleries()
  const { catalogs } = useCatalogs()
  const gallery = galleries.find((g) => g.id === id)
  const [f, setF] = useState(() => ({
    title: gallery?.title ?? '',
    client: gallery?.client ?? '',
    date: gallery?.date ?? '',
    catalogId: gallery?.catalogId ?? catalogs[0].id,
  }))
  const del = useDeleteGallery(gallery)
  if (!gallery) return null

  const set = (patch) => {
    const next = { ...f, ...patch }
    setF(next)
    const title = next.title.trim()
    update(gallery.id, {
      ...(title && { title }),
      client: next.client.trim() || title || gallery.title,
      date: next.date.trim() || gallery.date,
      catalogId: next.catalogId,
    })
  }

  return (
    <EditorPane
      open={open}
      onClose={onClose}
      phone={phone}
      peek={peek}
      onPeek={onPeek}
      inline={inline}
      modal={false}
      title="Gallery info"
      previewLabel="Preview gallery"
      tabs={[{ id: 'info', label: 'Info' }]}
      tab="info"
      onTab={() => {}}
    >
      <Section title="Details" hint="What your client sees on the cover and in emails.">
        <TextField
          label="Gallery title"
          value={f.title}
          onChange={(v) => set({ title: v })}
          limit={LIMITS.title}
          placeholder="Sam & Alex — Wedding"
          hint="Shown on the cover"
          error={!f.title.trim() ? 'Required — the last title is kept' : null}
        />
        <TextField label="Client name" value={f.client} onChange={(v) => set({ client: v })} limit={LIMITS.client} placeholder={f.title.trim() || 'Sam & Alex'} hint="Empty uses the title" />
        <TextField label="Date" value={f.date} onChange={(v) => set({ date: v })} limit={LIMITS.date} placeholder={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} hint="As you’d like it written" />
      </Section>
      <Section title="Print store" hint="The products, packages and prices this gallery’s clients can order.">
        <Select label="Print store catalog" value={f.catalogId} onChange={(v) => set({ catalogId: v })} options={catalogs.map((c) => ({ value: c.id, label: c.name }))} className="w-full" />
      </Section>
      <Section title="Delete gallery" hint={galleries.length > 1 ? 'Removes its photos, design and client link.' : 'You need at least one gallery.'}>
        <Button type="button" variant="outline" size="sm" className="text-destructive max-sm:h-10 max-sm:w-full" disabled={galleries.length < 2} onClick={del}>
          <Trash size={14} /> Delete gallery
        </Button>
      </Section>
    </EditorPane>
  )
}
