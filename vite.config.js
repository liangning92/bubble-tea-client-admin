import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 远程服务器地址（通过 Tailscale IP 访问）
const API_SERVER = process.env.VITE_API_SERVER || 'http://localhost:6061';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 6060,
    strictPort: true,
    host: '0.0.0.0',
    cors: true,
    proxy: {
      '/api': {
        target: API_SERVER,
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 6062,
    strictPort: true,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: API_SERVER,
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist-admin',
    envPrefix: 'VITE_'
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist']
  }
})
