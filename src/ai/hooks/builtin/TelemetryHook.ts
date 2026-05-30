/**
 * 内置 Hook: 遥测日志
 * 所有 Hook 类型触发时打印结构化日志（低优先级，作为底牌）
 */

import { hookManager } from '../HookManager'
import type { HookContext, HookType } from '../types'

export function registerTelemetryHook(): void {
  const hookTypes: HookType[] = [
    'post-task',
    'post-review',
    'skill-crystallize',
    'quality-threshold',
    'prompt-evolved',
  ]

  for (const type of hookTypes) {
    hookManager.register(type, async (ctx: HookContext) => {
      console.log(
        `[Telemetry] Hook "${type}" triggered —`,
        JSON.stringify({
          taskType: ctx.taskType,
          outcome: ctx.outcome,
          qualityScore: ctx.qualityScore,
          ts: Date.now(),
        })
      )
    }, 10) // 低优先级：10
  }
}