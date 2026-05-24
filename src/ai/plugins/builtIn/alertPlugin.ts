/**
 * Alert Plugin
 * 质量告警 + 配置变更记录
 */

import type { Plugin } from '../types'

export const alertPlugin: Plugin = {
  name: 'alert',
  version: '1.0.0',
  description: '质量告警 + 配置变更记录',
  hooks() {
    return [
      {
        type: 'quality-threshold',
        handler: async (ctx) => {
          console.warn('[alert] quality threshold exceeded:', ctx.qualityScore)
        }
      },
      {
        type: 'config-change',
        handler: async (ctx) => {
          console.log('[alert] config changed:', ctx)
        }
      }
    ]
  }
}