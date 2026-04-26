import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // All API calls go to the single unified backend on 8082
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      // AI prediction server (Python FastAPI — separate process on 8000)
      '/predict': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/predictions': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    }
  }
})
