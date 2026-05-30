/**
 * Telemetry Plugin
 * Hook 遥测日志
 */

import type { Plugin } from '../types'

export const telemetryPlugin: Plugin = {
  name: 'telemetry',
  version: '1.0.0',
  description: 'Hook 遥测日志',
  hooks() {
    return [
      { type: 'pre-task', handler: async (ctx) => { console.log('[telemetry] pre-task:', ctx.taskType) } },
      { type: 'post-task', handler: async (ctx) => { console.log('[telemetry] post-task:', ctx.taskType, ctx.outcome) } },
      { type: 'post-review', handler: async (ctx) => { console.log('[telemetry] post-review:', ctx.qualityScore) } },
    ]
  }
}