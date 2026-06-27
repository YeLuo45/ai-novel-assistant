/**
 * AgentHookBuiltins.ts (V2348-V2350)
 *
 * Hook 工具 + 2 个内置 hook：MetricsHook + AuditLogHook。
 *
 * - V2348 HookFilter helpers（按 prefix/agentId/predicate）
 * - V2349 MetricsHook：累计事件计数（spawn 几次、execute 几次、deny 几次）
 * - V2350 AuditLogHook：append-only 事件日志（最近 N 条）
 */

import type { AgentHookEvent, AgentHookPayload } from './AgentHookEvents'
import type { AgentHookEmitter, HookHandler } from './AgentHookEmitter'

// =============================================================================
// V2348: HookFilter Helpers
// =============================================================================

export const AGENT_LIFECYCLE_EVENTS: AgentHookEvent[] = [
  'agent.spawn.before', 'agent.spawn.after',
  'agent.destroy.before', 'agent.destroy.after',
  'agent.status.changed',
]

export const AGENT_EXECUTE_EVENTS: AgentHookEvent[] = [
  'agent.execute.before', 'agent.execute.after', 'agent.execute.error',
]

export const AGENT_MEMORY_EVENTS: AgentHookEvent[] = [
  'agent.memory.read', 'agent.memory.write', 'agent.memory.delete',
]

export const SANDBOX_EVENTS: AgentHookEvent[] = [
  'sandbox.allowed', 'sandbox.denied',
]

export const RUNTIME_EVENTS: AgentHookEvent[] = [
  'runtime.tick.before', 'runtime.tick.after',
]

/** 订阅一组事件（带 filter） */
export function subscribeMany(
  emitter: AgentHookEmitter,
  events: AgentHookEvent[],
  handler: HookHandler,
): string[] {
  return events.map(e => emitter.subscribe(e, handler))
}

// =============================================================================
// V2349: MetricsHook
// =============================================================================

export interface MetricsHookSnapshot {
  totalEvents: number
  byEvent: Record<string, number>
  byAgent: Record<string, number>
  deniedCount: number
  errorCount: number
}

export class MetricsHook {
  private _byEvent: Map<string, number> = new Map()
  private _byAgent: Map<string, number> = new Map()
  private _deniedCount: number = 0
  private _errorCount: number = 0
  private _total: number = 0
  private _subIds: string[] = []

  /** attach 到 emitter */
  attach(emitter: AgentHookEmitter): void {
    this._subscribeAll(emitter)
  }

  /** detach 从 emitter */
  detach(emitter: AgentHookEmitter): void {
    for (const id of this._subIds) emitter.unsubscribe(id)
    this._subIds = []
  }

  private _subscribeAll(emitter: AgentHookEmitter): void {
    for (const ev of [
      ...AGENT_LIFECYCLE_EVENTS,
      ...AGENT_EXECUTE_EVENTS,
      ...AGENT_MEMORY_EVENTS,
      ...SANDBOX_EVENTS,
      ...RUNTIME_EVENTS,
    ]) {
      const id = emitter.subscribe(ev, (p) => this._record(ev, p))
      this._subIds.push(id)
    }
  }

  private _record(event: AgentHookEvent, payload: AgentHookPayload): void {
    this._total += 1
    this._byEvent.set(event, (this._byEvent.get(event) ?? 0) + 1)
    const agentId = (payload as { agentId?: string }).agentId
    if (agentId) {
      this._byAgent.set(agentId, (this._byAgent.get(agentId) ?? 0) + 1)
    }
    if (event === 'sandbox.denied') this._deniedCount += 1
    if (event === 'agent.execute.error') this._errorCount += 1
  }

  /** 取快照 */
  snapshot(): MetricsHookSnapshot {
    const byEvent: Record<string, number> = {}
    for (const [k, v] of this._byEvent) byEvent[k] = v
    const byAgent: Record<string, number> = {}
    for (const [k, v] of this._byAgent) byAgent[k] = v
    return {
      totalEvents: this._total,
      byEvent,
      byAgent,
      deniedCount: this._deniedCount,
      errorCount: this._errorCount,
    }
  }

  /** 重置 */
  reset(): void {
    this._byEvent.clear()
    this._byAgent.clear()
    this._deniedCount = 0
    this._errorCount = 0
    this._total = 0
  }
}

// =============================================================================
// V2350: AuditLogHook
// =============================================================================

export interface AuditLogEntry {
  timestamp: number
  event: AgentHookEvent
  agentId: string
  payload: AgentHookPayload
}

export class AuditLogHook {
  private _entries: AuditLogEntry[] = []
  private _maxEntries: number
  private _subIds: string[] = []

  constructor(maxEntries: number = 1000) {
    this._maxEntries = maxEntries
  }

  /** attach 到 emitter（订阅全部事件） */
  attach(emitter: AgentHookEmitter): void {
    // 订阅所有事件
    const allEvents: AgentHookEvent[] = [
      ...AGENT_LIFECYCLE_EVENTS,
      ...AGENT_EXECUTE_EVENTS,
      ...AGENT_MEMORY_EVENTS,
      ...SANDBOX_EVENTS,
      ...RUNTIME_EVENTS,
    ]
    for (const ev of allEvents) {
      const id = emitter.subscribe(ev, (p) => this._record(ev, p))
      this._subIds.push(id)
    }
  }

  /** detach */
  detach(emitter: AgentHookEmitter): void {
    for (const id of this._subIds) emitter.unsubscribe(id)
    this._subIds = []
  }

  private _record(event: AgentHookEvent, payload: AgentHookPayload): void {
    const entry: AuditLogEntry = {
      timestamp: Date.now(),
      event,
      agentId: (payload as { agentId?: string }).agentId ?? 'unknown',
      payload,
    }
    this._entries.push(entry)
    if (this._entries.length > this._maxEntries) {
      this._entries = this._entries.slice(-this._maxEntries)
    }
  }

  /** 取全部 entries（按时间倒序） */
  entries(): AuditLogEntry[] {
    return [...this._entries].reverse()
  }

  /** 按 agentId 过滤 */
  entriesFor(agentId: string): AuditLogEntry[] {
    return this.entries().filter(e => e.agentId === agentId)
  }

  /** 按 event 过滤 */
  entriesByEvent(event: AgentHookEvent): AuditLogEntry[] {
    return this.entries().filter(e => e.event === event)
  }

  /** entry 数 */
  count(): number {
    return this._entries.length
  }

  /** 清空 */
  clear(): void {
    this._entries = []
  }
}
