import { Fragment, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BracketsCurly, Plus } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { ease, Menu } from '../components/ui'
import { usePhone } from '../lib/hooks'
import { VARIABLES, VARIABLE_RE, isVariable } from './share'

// The text after the caret's last "{" (or "${"), while it can still become a variable.
const TRIGGER = /\$?\{([a-z_ ]{0,24})$/i

const field = 'px-3.5 py-2.5 text-14-r-p whitespace-pre-wrap break-words'

/**
 * A text field that takes variables. Typing `{` (or `${`) opens suggestions under the caret, filtered
 * as you type (↑ ↓ to move, Enter or Tab to insert, Esc to close); "+ Variable" inserts one at the
 * caret. Variables show as tinted pills, unknown ones get a wavy red underline. Grows with its text.
 * `values` previews what each variable becomes. `singleLine` keeps it to one line (the subject).
 * Phones show the suggestions as a chip row under the field and "+ Variable" opens a bottom sheet.
 */
export default function VariableText({ label, value, onChange, placeholder, limit, rows = 1, singleLine, values = {}, hint }) {
  const phone = usePhone()
  const ref = useRef(null)
  const caret = useRef(value.length)
  const [suggest, setSuggest] = useState(null) // { start, query, x, y }
  const [active, setActive] = useState(0)

  const matches = suggest ? VARIABLES.filter((v) => [v.key, v.label].some((s) => s.toLowerCase().replace(/[_ ]/g, '').includes(suggest.query.toLowerCase().replace(/[_ ]/g, '')))) : []
  const open = !!suggest && matches.length > 0
  const used = [...value.matchAll(VARIABLE_RE)].map((m) => m[1])
  const unknown = [...new Set(used.filter((n) => !isVariable(n)))]
  const blank = VARIABLES.filter((v) => used.some((n) => n.trim().toLowerCase().replace(/\s+/g, '_') === v.key) && !values[v.key])

  // Grow to fit the text.
  useLayoutEffect(() => {
    const el = ref.current
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  const look = (el) => {
    caret.current = el.selectionStart
    const before = el.value.slice(0, el.selectionStart)
    const m = el.selectionStart === el.selectionEnd && before.match(TRIGGER)
    if (!m) return setSuggest(null)
    const start = before.length - m[0].length
    setSuggest((s) => (s?.start === start ? { ...s, query: m[1] } : { start, query: m[1], ...caretXY(el, start) }))
    setActive((a) => (suggest?.start === start ? a : 0))
  }

  const insert = (key, from = caret.current, to = caret.current) => {
    const token = `{${key}}`
    const next = (value.slice(0, from) + token + value.slice(to)).slice(0, limit)
    onChange(next)
    setSuggest(null)
    const at = Math.min(from + token.length, next.length)
    caret.current = at
    requestAnimationFrame(() => {
      ref.current?.focus()
      ref.current?.setSelectionRange(at, at)
    })
  }
  const pick = (v) => insert(v.key, suggest.start, caret.current)

  const onKeyDown = (e) => {
    if (open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const d = e.key === 'ArrowDown' ? 1 : -1
        return setActive((a) => (a + d + matches.length) % matches.length)
      }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); return pick(matches[Math.min(active, matches.length - 1)]) }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); return setSuggest(null) }
    }
    if (singleLine && e.key === 'Enter') e.preventDefault()
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={`vt-${label}`} className="text-13-m text-type-1">{label}</label>
        <div className="flex items-center gap-2">
          <span className="text-11-r tabular-nums text-type-3">{value.length}/{limit}</span>
          <Menu
            label="Insert a variable"
            items={VARIABLES.map((v) => ({ label: v.label, icon: BracketsCurly, onClick: () => insert(v.key) }))}
            trigger={({ toggle }) => (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={toggle}
                className="flex h-7 items-center gap-1 rounded-full px-2 text-12-m text-type-2 transition hover:bg-surface-2 hover:text-type-0"
              >
                <Plus size={12} weight="bold" /> Variable
              </button>
            )}
          />
        </div>
      </div>

      <div className="relative rounded-lg border border-input bg-surface-1 transition focus-within:border-type-0 focus-within:ring-4 focus-within:ring-black/5">
        {/* Tints behind the text: same box and type as the textarea, text itself transparent. */}
        <div aria-hidden className={cn(field, 'pointer-events-none absolute inset-0 overflow-hidden text-transparent')}>
          {highlight(value)}
          {'​'}
        </div>
        <textarea
          id={`vt-${label}`}
          ref={ref}
          value={value}
          rows={rows}
          spellCheck
          onChange={(e) => {
            const v = (singleLine ? e.target.value.replace(/\n/g, ' ') : e.target.value).slice(0, limit)
            onChange(v)
            look(e.target)
          }}
          onSelect={(e) => look(e.target)}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(() => setSuggest(null), 120)}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-expanded={open}
          className={cn(field, 'relative block w-full resize-none overflow-hidden bg-transparent text-type-0 outline-none placeholder:text-type-3')}
        />

        <AnimatePresence>
          {open && !phone && (
            <motion.ul
              role="listbox"
              aria-label="Variables"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.14, ease }}
              style={{ top: suggest.y + 4, left: Math.max(4, Math.min(suggest.x, (ref.current?.offsetWidth ?? 0) - 260)) }}
              className="absolute z-50 w-[256px] rounded-xl border border-border bg-surface-1 p-1 shadow-[0_20px_50px_-20px_rgba(0,0,0,.3)]"
            >
              {matches.map((v, i) => (
                <li key={v.key}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(v)}
                    className={cn('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition', i === active && 'bg-surface-2')}
                  >
                    <BracketsCurly size={16} className="shrink-0 text-type-2" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-13-m text-type-0">{v.label}</span>
                      <span className="block truncate text-12-r text-type-3">{values[v.key] || 'Nothing to fill yet'}</span>
                    </span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {open && phone && (
        <div role="listbox" aria-label="Variables" className="-mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4 pb-1">
          {matches.map((v) => (
            <button
              key={v.key}
              type="button"
              role="option"
              aria-selected={false}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(v)}
              className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-border bg-surface-1 px-3 text-13-m text-type-0"
            >
              <BracketsCurly size={14} className="text-type-2" /> {v.label}
            </button>
          ))}
        </div>
      )}

      {unknown.length > 0 && (
        <span className="mt-1 block text-12-r text-destructive">
          {`{${unknown[0]}}`} isn’t a variable. Try {VARIABLES.map((v) => `{${v.key}}`).join(', ')}.
        </span>
      )}
      {!unknown.length && blank.length > 0 && (
        <span className="mt-1 block text-12-r text-amber-700">
          {blank.map((v) => v.label).join(' and ')} {blank.length > 1 ? 'are' : 'is'} empty for this email, so {blank.length > 1 ? 'they’ll' : 'it’ll'} be left blank.
        </span>
      )}
      {!unknown.length && !blank.length && !value && hint && <span className="mt-1 block text-12-r text-type-3">{hint}</span>}
    </div>
  )
}

/** The value split into plain text and tinted variable pills. */
function highlight(text) {
  const out = []
  let last = 0
  for (const m of text.matchAll(VARIABLE_RE)) {
    out.push(text.slice(last, m.index))
    out.push(
      <mark
        key={m.index}
        className={cn('rounded-[4px] text-transparent', isVariable(m[1]) ? 'bg-success-bg shadow-[0_0_0_2px_var(--success-bg)]' : 'bg-transparent underline decoration-destructive decoration-wavy underline-offset-4')}
      >
        {m[0]}
      </mark>
    )
    last = m.index + m[0].length
  }
  out.push(text.slice(last))
  return out.map((x, i) => (typeof x === 'string' ? <Fragment key={`t${i}`}>{x}</Fragment> : x))
}

/** Where character `index` sits inside the textarea, in px from its top-left (bottom of that line). */
function caretXY(el, index) {
  const div = document.createElement('div')
  const cs = getComputedStyle(el)
  for (const p of ['boxSizing', 'width', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderLeftWidth', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'wordSpacing', 'tabSize']) div.style[p] = cs[p]
  Object.assign(div.style, { position: 'absolute', visibility: 'hidden', top: '0', left: '-9999px', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' })
  div.textContent = el.value.slice(0, index)
  const mark = document.createElement('span')
  mark.textContent = '​'
  div.appendChild(mark)
  document.body.appendChild(div)
  const r = { x: mark.offsetLeft, y: mark.offsetTop + mark.offsetHeight }
  div.remove()
  return r
}
