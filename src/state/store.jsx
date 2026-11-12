import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { lineSubtotal, lineCompareAt, lineItemCount } from '../lib/pricing'
import { uid } from '../lib/utils'

const StoreCtx = createContext(null)
const KEY = 'lumen-store-v3'

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || undefined
  } catch {
    return undefined
  }
}

const initial = { lines: [], checkout: {}, shipping: 'standard', promo: null }

function reducer(state, action) {
  switch (action.type) {
    case 'add':
      return { ...state, lines: [...state.lines, { ...action.line, id: uid() }] }
    case 'update':
      return { ...state, lines: state.lines.map((l) => (l.id === action.id ? { ...action.line, id: l.id } : l)) }
    case 'replace': {
      // one line → several (e.g. a photo switched to another variant became its own item).
      // The first keeps the original id/position, the rest are inserted right after it.
      const i = state.lines.findIndex((l) => l.id === action.id)
      if (i < 0 || !action.lines.length) return state
      const [first, ...rest] = action.lines
      const lines = [...state.lines]
      lines.splice(i, 1, { ...first, id: action.id }, ...rest.map((l) => ({ ...l, id: uid() })))
      return { ...state, lines }
    }
    case 'remove':
      return { ...state, lines: state.lines.filter((l) => l.id !== action.id) }
    case 'duplicate': {
      const i = state.lines.findIndex((l) => l.id === action.id)
      const lines = [...state.lines]
      lines.splice(i + 1, 0, { ...structuredClone(state.lines[i]), id: uid() })
      return { ...state, lines }
    }
    case 'checkout':
      return { ...state, checkout: { ...state.checkout, ...action.data } }
    case 'shipping':
      return { ...state, shipping: action.value }
    case 'promo':
      return { ...state, promo: action.value }
    default:
      return state
  }
}

export const SHIPPING = [
  { id: 'standard', label: 'Standard', eta: '7–10 business days', price: 12 },
  { id: 'express', label: 'Express', eta: '3–5 business days', price: 28 },
  { id: 'pickup', label: 'Studio pickup', eta: 'Ready in 7 days', price: 0 },
]

export const PROMOS = { LEXIE10: 0.1 }

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial, (i) => ({ ...i, ...load() }))
  const [drawer, setDrawer] = useState(false)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo(() => {
    const subtotal = state.lines.reduce((s, l) => s + lineSubtotal(l), 0)
    const savings = state.lines.reduce((s, l) => s + (lineCompareAt(l) ? lineCompareAt(l) - lineSubtotal(l) : 0), 0)
    const itemCount = state.lines.reduce((s, l) => s + lineItemCount(l), 0)
    const promoOff = state.promo ? Math.round(subtotal * PROMOS[state.promo]) : 0
    const ship = state.lines.length ? SHIPPING.find((s) => s.id === state.shipping).price : 0
    const tax = Math.round((subtotal - promoOff) * 0.0825 * 100) / 100
    return {
      ...state,
      dispatch,
      drawer,
      setDrawer,
      totals: { subtotal, savings, itemCount, promoOff, ship, tax, total: subtotal - promoOff + ship + tax },
    }
  }, [state, drawer])

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export const useStore = () => useContext(StoreCtx)
