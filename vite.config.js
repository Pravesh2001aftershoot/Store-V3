import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    // Locator: annotates JSX with source locations (dev server only)
    command === 'serve' &&
      babel({
        include: /\/src\/.*\.jsx$/,
        plugins: [['@locator/babel-jsx/dist', { env: 'development' }]],
      }),
    tailwindcss(),
  ].filter(Boolean),
}))
