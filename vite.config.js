import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project site: serve assets from /topalba/
export default defineConfig({
  base: '/topalba/',
  plugins: [react()],
})
