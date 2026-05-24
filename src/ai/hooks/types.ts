/**
 * Hook 系统类型定义
 */

import type { Skill } from '../memory/MemoryManager'
import type { AggregatedReview } from '../review/types'
import type { PromptVersion } from '../evolution/types'

export type HookType =
  | 'post-task'
  | 'post-review'
  | 'skill-crystallize'
  | 'quality-threshold'
  | 'prompt-evolved'
  | 'pre-task'
  | 'tool-error'
  | 'agent-spawn'
  | 'agent-despawn'
  | 'memory-store'
  | 'memory-retrieve'
  | 'security-violation'
  | 'config-change'
  | 'swarm-start'
  | 'swarm-stop'

export interface HookContext {
  taskType: string
  outcome: 'success' | 'failure'
  qualityScore: number
  skill?: Skill
  promptVersion?: PromptVersion
  reviewResult?: AggregatedReview
  error?: string
  agentId?: string
  toolId?: string
  configKey?: string
  configValue?: unknown
}

export type HookHandler = (ctx: HookContext) => Promise<void> | void

export interface HookRegistration {
  type: HookType
  handler: HookHandler
  priority: number
}