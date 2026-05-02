import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: '/ai-novel-assistant/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'AI小说开发助手',
        short_name: 'AI小说',
        description: 'AI辅助小说创作工具',
        theme_color: '#6366f1',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/')) {
            // Split each major package into its own chunk
            if (id.includes('node_modules/react/')) return 'vendor-react'
            if (id.includes('node_modules/zustand/')) return 'vendor-zustand'
            if (id.includes('node_modules/dexie/')) return 'vendor-dexie'
            if (id.includes('node_modules/react-router/')) return 'vendor-router'
            if (id.includes('node_modules/@uiw/')) return 'vendor-editor'
            if (id.includes('node_modules/prosemirror/')) return 'vendor-prosemirror'
            if (id.includes('node_modules/codemirror/')) return 'vendor-codemirror'
            if (id.includes('node_modules/react-beautiful-dnd/')) return 'vendor-dnd'
            if (id.includes('node_modules/markdown-it/') || id.includes('node_modules/remark-')) return 'vendor-markdown'
            return 'vendor-misc'
          }
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})
