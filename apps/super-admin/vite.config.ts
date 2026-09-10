import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// @saccosphere/config reads process.env.* (it cannot use import.meta.env —
// that file is also consumed by Expo/Metro). Vite has no `process` global,
// so every process.env token that file references must be `define`d here or
// it throws ReferenceError in the browser.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    css: {
      postcss: './postcss.config.js',
    },
    build: {
      outDir: 'dist',
    },
    define: {
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL ?? ''),
      'process.env.EXPO_PUBLIC_API_URL': '""',
      'process.env.API_URL': '""',
    },
  }
})
