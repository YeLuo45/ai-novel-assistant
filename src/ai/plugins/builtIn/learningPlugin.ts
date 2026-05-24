/**
 * Learning Plugin
 * 任务模式学习
 */

import type { Plugin } from '../types'

export const learningPlugin: Plugin = {
  name: 'learning',
  version: '1.0.0',
  description: '任务模式学习',
  hooks() {
    return [
      {
        type: 'post-task',
        handler: async (ctx) => {
          if (ctx.outcome === 'success') {
            console.log('[learning] task success pattern:', ctx.taskType)
          }
        }
      }
    ]
  }
}