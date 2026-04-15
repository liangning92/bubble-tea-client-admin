import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 6060,
    strictPort: true,
    host: '0.0.0.0',
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist'
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist']
  }
})
