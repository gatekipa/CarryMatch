import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks — split heavy dependencies from app code
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-motion': ['framer-motion'],
          'vendor-dates': ['date-fns'],
          'vendor-ui': ['sonner', 'lucide-react'],
        },
      },
    },
    // Increase warning threshold since we can't lazy-load pages (Base44 auto-generates pages.config)
    chunkSizeWarningLimit: 1500,
  },
})
