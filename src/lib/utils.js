import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs) => twMerge(clsx(inputs))

export const money = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n % 1 ? 2 : 0 }).format(n)

export const uid = () => Math.random().toString(36).slice(2, 10)

export const plural = (n, word, many = word + 's') => `${n} ${n === 1 ? word : many}`
