/**
 * AgentHookEvents.ts (V2346)
 *
 * Hook 事件枚举：agent 生命周期的所有可订阅点。
 *
 * 设计原则：
 * - 命名：agent.{phase}.{action}
 * - payload 类型用 discriminated union 严格约束
 * - 17 个事件，覆盖 spawn/execute/communicate/memory/lifecycle
 */

import type { AgentLifecycleStatus } from './AgentRegistry'
import type { MemoryLevel } from './types'

// =============================================================================
// 1. 事件枚举
// =============================================================================

export type AgentHookEvent =
  // agent 生命周期
  | 'agent.spawn.before'
  | 'agent.spawn.after'
  | 'agent.destroy.before'
  | 'agent.destroy.after'
  | 'agent.status.changed'
  // 执行
  | 'agent.execute.before'
  | 'agent.execute.after'
  | 'agent.execute.error'
  // 通信
  | 'agent.message.sent'
  | 'agent.message.received'
  // memory
  | 'agent.memory.read'
  | 'agent.memory.write'
  | 'agent.memory.delete'
  // sandbox
  | 'sandbox.allowed'
  | 'sandbox.denied'
  // tick
  | 'runtime.tick.before'
  | 'runtime.tick.after'

export const ALL_AGENT_HOOK_EVENTS: readonly AgentHookEvent[] = [
  'agent.spawn.before',
  'agent.spawn.after',
  'agent.destroy.before',
  'agent.destroy.after',
  'agent.status.changed',
  'agent.execute.before',
  'agent.execute.after',
  'agent.execute.error',
  'agent.message.sent',
  'agent.message.received',
  'agent.memory.read',
  'agent.memory.write',
  'agent.memory.delete',
  'sandbox.allowed',
  'sandbox.denied',
  'runtime.tick.before',
  'runtime.tick.after',
] as const

// =============================================================================
// 2. Payload 类型（discriminated union）
// =============================================================================

interface BasePayload {
  agentId: string
  timestamp: number
}

export interface AgentSpawnPayload extends BasePayload {
  archetype: string
  displayName: string
}

export interface AgentDestroyPayload extends BasePayload {
  reason?: string
}

export interface AgentStatusChangedPayload extends BasePayload {
  from: AgentLifecycleStatus
  to: AgentLifecycleStatus
}

export interface AgentExecutePayload extends BasePayload {
  task?: unknown
  output?: unknown
  error?: string
  durationMs?: number
}

export interface AgentMessagePayload extends BasePayload {
  from: string
  to: string
  kind: string
  payload?: unknown
}

export interface AgentMemoryPayload extends BasePayload {
  level: MemoryLevel
  operation: 'read' | 'write' | 'delete' | 'lease'
  itemId?: string
  targetAgentId?: string
}

export interface SandboxPayload extends BasePayload {
  opKind: string
  reason: string
}

export interface RuntimeTickPayload {
  timestamp: number
  totalAgents: number
  transitioned: number
}

/** 全 payload 联合（用 kind 字段区分） */
export type AgentHookPayload =
  | ({ kind: 'agent.spawn.before' | 'agent.spawn.after' } & AgentSpawnPayload)
  | ({ kind: 'agent.destroy.before' | 'agent.destroy.after' } & AgentDestroyPayload)
  | ({ kind: 'agent.status.changed' } & AgentStatusChangedPayload)
  | ({ kind: 'agent.execute.before' | 'agent.execute.after' | 'agent.execute.error' } & AgentExecutePayload)
  | ({ kind: 'agent.message.sent' | 'agent.message.received' } & AgentMessagePayload)
  | ({ kind: 'agent.memory.read' | 'agent.memory.write' | 'agent.memory.delete' } & AgentMemoryPayload)
  | ({ kind: 'sandbox.allowed' | 'sandbox.denied' } & SandboxPayload)
  | ({ kind: 'runtime.tick.before' | 'runtime.tick.after' } & RuntimeTickPayload)

/** 取事件对应的 payload 类型 */
export type PayloadFor<E extends AgentHookEvent> =
  E extends 'agent.spawn.before' | 'agent.spawn.after' ? AgentSpawnPayload :
  E extends 'agent.destroy.before' | 'agent.destroy.after' ? AgentDestroyPayload :
  E extends 'agent.status.changed' ? AgentStatusChangedPayload :
  E extends 'agent.execute.before' | 'agent.execute.after' | 'agent.execute.error' ? AgentExecutePayload :
  E extends 'agent.message.sent' | 'agent.message.received' ? AgentMessagePayload :
  E extends 'agent.memory.read' | 'agent.memory.write' | 'agent.memory.delete' ? AgentMemoryPayload :
  E extends 'sandbox.allowed' | 'sandbox.denied' ? SandboxPayload :
  RuntimeTickPayload

// =============================================================================
// 3. 工具
// =============================================================================

/** 按事件名取默认 payload shape（用于 emit 时构造） */
export function makePayload<E extends AgentHookEvent>(
  event: E,
  agentId: string,
  extra: Omit<PayloadFor<E>, 'agentId' | 'timestamp' | 'kind'> = {} as Omit<PayloadFor<E>, 'agentId' | 'timestamp' | 'kind'>,
): PayloadFor<E> & { kind: E } {
  return {
    ...extra,
    kind: event,
    agentId,
    timestamp: Date.now(),
  } as PayloadFor<E> & { kind: E }
}

/** 事件分类 */
export function isAgentEvent(e: AgentHookEvent): boolean {
  return e.startsWith('agent.')
}

export function isSandboxEvent(e: AgentHookEvent): boolean {
  return e.startsWith('sandbox.')
}

export function isRuntimeEvent(e: AgentHookEvent): boolean {
  return e.startsWith('runtime.')
}

export function isMemoryEvent(e: AgentHookEvent): boolean {
  return e.startsWith('agent.memory.')
}
