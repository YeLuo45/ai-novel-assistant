import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        lines: 25,
        functions: 25,
        branches: 50,
        statements: 25
      },
      include: [
        'src/db.ts',
        'src/store.ts',
        'src/utils/**',
        'src/ai/serverless/**',
        'src/ai/agent_marketplace/**',
        'src/ai/quantum/**'
      ],
      exclude: [
        'node_modules/**',
        'src/test/**',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/index.css'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
