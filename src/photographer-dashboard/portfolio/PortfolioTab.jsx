import { useState } from 'react'
import { PencilSimple } from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import { cn } from '../../lib/utils'
import { notify } from '../../gallery/lib/actions'
import PreviewFrame from '../components/PreviewFrame'
import { useDocked, usePhone, useTopOffset } from '../lib/hooks'
import PortfolioEditor, { TARGETS } from './PortfolioEditor'

/**
 * Portfolio: the editor beside a live preview of /portfolio. The preview scrolls to the section of
 * the open tab. Narrow screens: full-width preview, the editor opens as a bottom sheet.
 */
export default function PortfolioTab() {
  const docked = useDocked()
  const phone = usePhone()
  const top = useTopOffset()
  const [tab, setTab] = useState('profile')
  const [open, setOpen] = useState(false)
  const [peek, setPeek] = useState(false)

  const editor = (
    <PortfolioEditor
      tab={tab}
      onTab={setTab}
      inline={docked}
      open={docked || open}
      // Docked, the editor is always open: Done just confirms everything is saved.
      onClose={() => (docked ? notify('All changes are saved') : setOpen(false))}
      phone={!docked}
      peek={peek}
      onPeek={setPeek}
    />
  )

  return (
    <div className="flex" style={{ height: `calc(100svh - ${top}px)` }}>
      {docked && <aside className="flex w-[380px] shrink-0 flex-col border-r border-border bg-surface-1 xl:w-[400px]">{editor}</aside>}
      <PreviewFrame src="/portfolio" target={TARGETS[tab]} fit={phone} label="Portfolio" className="min-w-0 flex-1" />
      {!docked && (
        <>
          {!open && (
            <Button
              size="lg"
              onClick={() => { setPeek(false); setOpen(true) }}
              className={cn('fixed z-30 shadow-[0_12px_30px_-10px_rgba(0,0,0,.5)]', phone ? 'inset-x-4' : 'left-1/2 -translate-x-1/2')}
              style={{ bottom: 20 }}
            >
              <PencilSimple size={16} /> Edit portfolio
            </Button>
          )}
          {editor}
        </>
      )}
    </div>
  )
}
