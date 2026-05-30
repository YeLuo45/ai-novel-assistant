/**
 * 内置 Hook: 进化触发器
 * 在 post-task 成功且质量分数 >= 0.8 时，自动分析成功模式并应用进化
 */

import { hookManager } from '../HookManager'
import { selfEvolutionEngine } from '../../evolution/SelfEvolutionEngine'
import type { HookContext } from '../types'

export function registerEvolutionTriggerHook(): void {
  hookManager.register('post-task', async (ctx: HookContext) => {
    if (ctx.outcome === 'success' && ctx.qualityScore >= 0.8) {
      try {
        const insights = await selfEvolutionEngine.analyzeSuccessPatterns()
        for (const insight of insights) {
          await selfEvolutionEngine.applyEvolution(insight)
        }
      } catch (e) {
        console.error('[EvolutionTriggerHook] Failed to apply evolution:', e)
      }
    }
  }, 80) // 高优先级：80
}