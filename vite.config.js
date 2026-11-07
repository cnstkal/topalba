import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel은 루트(/)에서, GitHub Pages 프로젝트 사이트는 /topalba/에서 제공
export default defineConfig({
  base: process.env.VERCEL ? '/' : '/topalba/',
  plugins: [react()],
})
