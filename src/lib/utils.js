import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'
import { fontSizeKeys } from '../tokens/typography.js'

// Register type tokens as font sizes. Without this, tailwind-merge reads
// `text-14-r` as a text *color* and drops it when merged with e.g. `text-type-2`.
const twMerge = extendTailwindMerge({ extend: { theme: { text: fontSizeKeys } } })

export const cn = (...inputs) => twMerge(clsx(inputs))

export const money = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n % 1 ? 2 : 0 }).format(n)

export const uid = () => Math.random().toString(36).slice(2, 10)

export const plural = (n, word, many = word + 's') => `${n} ${n === 1 ? word : many}`
