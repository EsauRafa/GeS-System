import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/GeS-System/',
  build: {
    outDir: 'dist'
  }
})
