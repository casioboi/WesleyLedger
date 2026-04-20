import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const packaged = mode === 'electron' || mode === 'capacitor'
  return {
    plugins: [react()],
    /** Relative base so assets load from file:// (Electron) and Android WebView. */
    base: packaged ? './' : '/',
    server: {
      /** Listen on LAN so you can open the dev app from a phone (same Wi‑Fi). */
      host: true,
      port: 5173,
    },
    preview: {
      host: true,
      port: 4173,
    },
  }
})
