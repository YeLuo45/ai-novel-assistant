/**
 * 内置 Hook: Skill 结晶化
 * 在 post-review 完成后，如果质量分数 >= 0.7，将评审结果结晶化为 Skill
 */

import { hookManager } from '../HookManager'
import { memoryManager } from '../../memory/MemoryManager'
import type { HookContext } from '../types'

export function registerSkillCrystallizeHook(): void {
  hookManager.register('post-review', async (ctx: HookContext) => {
    if (ctx.reviewResult && ctx.qualityScore >= 0.7) {
      try {
        // reviewResult 不是 Lesson 类型，需要构造一个兼容对象
        const lesson = {
          id: `review_${Date.now()}`,
          task: ctx.taskType,
          approach: ctx.reviewResult.prioritizedSuggestions?.join('; ') || '',
          outcome: ctx.qualityScore >= 0.8 ? 'success' : 'partial' as const,
          context: {
            score: ctx.reviewResult.overallScore,
            reviewers: ctx.reviewResult.reviewerResults.map(r => r.reviewer).join(', '),
          },
          createdAt: Date.now(),
        }
        await memoryManager.crystallize(lesson)
      } catch (e) {
        console.error('[SkillCrystallizeHook] Failed to crystallize skill:', e)
      }
    }
  }, 70) // 中高优先级：70
}