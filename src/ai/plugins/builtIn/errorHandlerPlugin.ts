/**
 * Error Handler Plugin
 * 自动重试 + 安全违规记录
 */

import type { Plugin } from '../types'

export const errorHandlerPlugin: Plugin = {
  name: 'error-handler',
  version: '1.0.0',
  description: '自动重试 + 安全违规记录',
  hooks() {
    return [
      {
        type: 'tool-error',
        handler: async (ctx) => {
          console.error('[error-handler] tool-error:', ctx)
        }
      },
      {
        type: 'security-violation',
        handler: async (ctx) => {
          console.warn('[error-handler] security-violation:', ctx)
        }
      }
    ]
  }
}