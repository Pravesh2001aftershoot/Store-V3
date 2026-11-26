import { CaretDown, PencilSimpleLine, RocketLaunch } from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import { cn } from '../../lib/utils'
import { notify } from '../../gallery/lib/actions'
import { useGalleries } from '../../data/galleries'
import { Menu } from '../components/ui'

// Publishing a gallery. Every gallery starts as a draft; publishing it once is what unlocks the Share
// step (links, email, QR codes). Moving it back to draft later keeps sharing unlocked and the links the
// same (`publishedAt` in data/galleries.js never clears).

/** `{ status, published, everPublished, publish, unpublish }` for one gallery (`meta` from the registry). */
export function usePublishing(meta) {
  const { publish, unpublish } = useGalleries()
  const everPublished = !!meta.publishedAt
  return {
    status: meta.status,
    published: meta.status === 'published',
    everPublished,
    publish: () => {
      publish(meta.id)
      notify(everPublished ? 'Gallery published' : 'Gallery published. You can share it now')
    },
    unpublish: () => {
      unpublish(meta.id)
      notify('Moved to draft. Your links and QR codes stay the same')
    },
  }
}

/**
 * The gallery's publish control, for the Design preview toolbar. A draft that has never been published
 * shows a small primary "Publish" button. After that it's a status pill (green dot "Published", grey dot
 * "Draft") opening a menu with "Move to draft" or "Publish" (a bottom sheet on phones).
 */
export default function PublishControl({ meta }) {
  const p = usePublishing(meta)
  if (!p.everPublished) {
    return (
      <Button size="sm" onClick={p.publish}>
        <RocketLaunch size={14} /> Publish
      </Button>
    )
  }
  return (
    <Menu
      label="Gallery status"
      items={[p.published
        ? { label: 'Move to draft', icon: PencilSimpleLine, onClick: p.unpublish }
        : { label: 'Publish', icon: RocketLaunch, onClick: p.publish }]}
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label={`Gallery status: ${p.published ? 'Published' : 'Draft'}`}
          className={cn('flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-13-m text-type-0 transition hover:bg-surface-2', open && 'bg-surface-2')}
        >
          <StatusDot published={p.published} />
          {p.published ? 'Published' : 'Draft'}
          <CaretDown size={12} className="text-type-2" />
        </button>
      )}
    />
  )
}

export function StatusDot({ published }) {
  return <span aria-hidden className={cn('h-2 w-2 shrink-0 rounded-full', published ? 'bg-success' : 'bg-type-3')} />
}
