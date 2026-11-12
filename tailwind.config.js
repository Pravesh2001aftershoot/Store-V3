// Tailwind v4 reads this via `@config` in src/index.css.
// Design tokens live in src/tokens — this file only wires them into the theme.
import { fontSize } from './src/tokens/typography.js'

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      fontSize,
    },
  },
}
