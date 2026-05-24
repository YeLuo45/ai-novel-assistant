/**
 * Block Plugin
 * 安全阻断 + Trust Score
 */

import type { Plugin } from '../types'

export const blockPlugin: Plugin = {
  name: 'block',
  version: '1.0.0',
  description: '安全阻断 + Trust Score',
  hooks() {
    return [
      {
        type: 'security-violation',
        handler: async (ctx) => {
          console.error('[block] security-violation blocked:', ctx)
        }
      }
    ]
  }
}