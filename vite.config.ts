import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

/** Set BUILD_PAGES=1 for GitHub Pages deploy (skips PWA/workbox ESM issue). */
const isPagesBuild = process.env.BUILD_PAGES === '1'

export default defineConfig({
  base: '/ai-novel-assistant/',
  plugins: [
    react(),
    ...(!isPagesBuild
      ? [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.svg'],
      manifest: {
        name: 'AI小说开发助手',
        short_name: 'AI小说',
        description: 'AI辅助小说创作工具',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/ai-novel-assistant/',
        scope: '/ai-novel-assistant/',
        icons: [
          {
            src: '/ai-novel-assistant/pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/ai-novel-assistant/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    }),
      ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    include: ['workbox-build'],
  },
  ssr: {
    noExternal: ['workbox-build'],
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
