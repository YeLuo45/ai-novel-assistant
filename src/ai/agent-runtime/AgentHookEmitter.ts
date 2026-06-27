/**
 * AgentHookEmitter.ts (V2347)
 *
 * Hook 发布订阅系统：agent lifecycle 事件的 emit / subscribe。
 *
 * 关键设计：
 * - 多 emitter 共享（每个 ManagedAgentRuntime 一个）
 * - 订阅支持 filter（按 agentId / event prefix）
 * - 异步 handler 串行执行（一个 handler 失败不影响其他）
 * - 错误聚合返回
 */

import type { AgentHookEvent, AgentHookPayload } from './AgentHookEvents'

// =============================================================================
// 1. 订阅描述
// =============================================================================

export type HookHandler<E extends AgentHookEvent = AgentHookEvent> = (
  payload: AgentHookPayload,
) => void | Promise<void>

export interface HookSubscription {
  id: string
  event: AgentHookEvent
  handler: HookHandler
  filter?: HookFilter
}

export interface HookFilter {
  /** 只接收来自该 agentId 的事件 */
  agentId?: string
  /** 只接收该 prefix 开头的事件（与 event 字段 AND 关系） */
  eventPrefix?: string
  /** 自定义谓词 */
  predicate?: (payload: AgentHookPayload) => boolean
}

export interface EmitResult {
  event: AgentHookEvent
  totalHandlers: number
  executed: number
  errors: Array<{ subscriptionId: string; error: string }>
  durationMs: number
}

// =============================================================================
// 2. Emitter
// =============================================================================

export class AgentHookEmitter {
  private _subs: Map<string, HookSubscription> = new Map()
  private _nextId: number = 0

  /** 订阅一个事件 */
  subscribe<E extends AgentHookEvent>(
    event: E,
    handler: HookHandler<E>,
    filter?: HookFilter,
  ): string {
    const id = `sub_${++this._nextId}`
    this._subs.set(id, {
      id,
      event,
      handler: handler as HookHandler,
      filter,
    })
    return id
  }

  /** 取消订阅 */
  unsubscribe(subscriptionId: string): boolean {
    return this._subs.delete(subscriptionId)
  }

  /** 全部订阅数 */
  size(): number {
    return this._subs.size
  }

  /** 取消所有订阅 */
  clear(): number {
    const n = this._subs.size
    this._subs.clear()
    return n
  }

  /** 列出所有订阅 */
  list(): HookSubscription[] {
    return Array.from(this._subs.values())
  }

  /** 发射一次事件 */
  async emit(event: AgentHookEvent, payload: AgentHookPayload): Promise<EmitResult> {
    const startedAt = Date.now()
    const result: EmitResult = {
      event,
      totalHandlers: 0,
      executed: 0,
      errors: [],
      durationMs: 0,
    }
    const matched: HookSubscription[] = []
    for (const sub of this._subs.values()) {
      if (sub.event !== event) continue
      if (sub.filter && !this._matchesFilter(sub.filter, payload)) continue
      matched.push(sub)
    }
    result.totalHandlers = matched.length

    for (const sub of matched) {
      try {
        await sub.handler(payload)
        result.executed += 1
      } catch (e) {
        result.errors.push({
          subscriptionId: sub.id,
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }
    result.durationMs = Date.now() - startedAt
    return result
  }

  /** 同步发射（不等异步 handler） */
  emitSync(event: AgentHookEvent, payload: AgentHookPayload): EmitResult {
    const startedAt = Date.now()
    const result: EmitResult = {
      event,
      totalHandlers: 0,
      executed: 0,
      errors: [],
      durationMs: 0,
    }
    for (const sub of this._subs.values()) {
      if (sub.event !== event) continue
      if (sub.filter && !this._matchesFilter(sub.filter, payload)) continue
      result.totalHandlers += 1
      try {
        const r = sub.handler(payload)
        if (r instanceof Promise) {
          // sync mode 下不等
          result.executed += 1
        } else {
          result.executed += 1
        }
      } catch (e) {
        result.errors.push({
          subscriptionId: sub.id,
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }
    result.durationMs = Date.now() - startedAt
    return result
  }

  private _matchesFilter(filter: HookFilter, payload: AgentHookPayload): boolean {
    if (filter.agentId) {
      const pid = (payload as { agentId?: string }).agentId
      if (pid !== filter.agentId) return false
    }
    if (filter.eventPrefix) {
      const kind = (payload as { kind?: string }).kind ?? ''
      if (!kind.startsWith(filter.eventPrefix)) return false
    }
    if (filter.predicate) {
      return filter.predicate(payload)
    }
    return true
  }
}

// =============================================================================
// 3. 全局 emitter
// =============================================================================

let _globalEmitter: AgentHookEmitter | null = null

export function getGlobalEmitter(): AgentHookEmitter {
  if (!_globalEmitter) _globalEmitter = new AgentHookEmitter()
  return _globalEmitter
}

export function resetGlobalEmitter(): void {
  _globalEmitter = null
}
