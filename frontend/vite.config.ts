import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    /** Listen on LAN so you can open the dev app from a phone (same Wi‑Fi). */
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
})
