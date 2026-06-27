/**
 * AgentLifecycle.ts (V2334)
 *
 * Agent 生命周期管理：状态转移 + 时间窗约束。
 *
 * 状态机（参考 chatdev direction A + nanobot）：
 *
 *   spawning → active ⇄ idle
 *              ↘
 *               hibernating → spawning (wake)
 *              ↘
 *               destroyed (终态)
 *
 * 转移规则：
 * - spawning → active：完成初始化
 * - spawning → destroyed：spawn 失败
 * - active → idle：长时间无活动
 * - idle → active：touch()
 * - active/idle → hibernating：长时间无活动 + 配置允许
 * - hibernating → active：wake()
 * - any → destroyed：destroy()
 *
 * 设计：
 * - 无副作用（不写 disk / 不发消息）
 * - 纯函数：validateTransition(from, to) → ok / err
 * - LRU / idle timeout 由调用方实现（runtime.ts 集成）
 */

import type { AgentLifecycleStatus } from './AgentRegistry'

// =============================================================================
// 1. 转移定义
// =============================================================================

const ALLOWED_TRANSITIONS: Record<AgentLifecycleStatus, AgentLifecycleStatus[]> = {
  spawning: ['active', 'idle', 'destroyed'],
  active: ['idle', 'hibernating', 'destroyed'],
  idle: ['active', 'hibernating', 'destroyed'],
  hibernating: ['active', 'spawning', 'destroyed'],
  destroyed: [], // 终态
}

export interface TransitionResult {
  ok: boolean
  reason?: string
}

/** 校验单步转移是否合法 */
export function validateTransition(
  from: AgentLifecycleStatus,
  to: AgentLifecycleStatus,
): TransitionResult {
  if (from === to) {
    return { ok: false, reason: 'no-op transition' }
  }
  const allowed = ALLOWED_TRANSITIONS[from] ?? []
  if (!allowed.includes(to)) {
    return {
      ok: false,
      reason: `invalid transition: ${from} -> ${to} (allowed: ${allowed.join(',') || 'none'})`,
    }
  }
  return { ok: true }
}

/** 取 from 的所有合法下一步 */
export function nextStates(from: AgentLifecycleStatus): AgentLifecycleStatus[] {
  return [...(ALLOWED_TRANSITIONS[from] ?? [])]
}

/** 转移是否终态 */
export function isTerminalState(s: AgentLifecycleStatus): boolean {
  return s === 'destroyed'
}

// =============================================================================
// 2. Lifecycle Manager
// =============================================================================

export interface LifecycleConfig {
  /** 多久无活动后从 active 转为 idle（ms） */
  idleTimeoutMs?: number
  /** 多久无活动后从 idle 转为 hibernating（ms） */
  hibernateAfterMs?: number
  /** 多久无活动后从 hibernating 强制 destroyed（ms；0 = 不超时销毁） */
  destroyAfterMs?: number
}

export interface LifecycleEvent {
  agentId: string
  from: AgentLifecycleStatus
  to: AgentLifecycleStatus
  timestamp: number
  reason: string
}

export class AgentLifecycleManager {
  private _config: Required<LifecycleConfig>
  private _events: LifecycleEvent[] = []
  /** 内部状态：每个 agent 的最后活动时间戳（外置可换 LRU） */
  private _lastActive: Map<string, number> = new Map()

  constructor(config: LifecycleConfig = {}) {
    this._config = {
      idleTimeoutMs: config.idleTimeoutMs ?? 5 * 60 * 1000,        // 5min
      hibernateAfterMs: config.hibernateAfterMs ?? 30 * 60 * 1000,   // 30min
      destroyAfterMs: config.destroyAfterMs ?? 0,                    // 不超时销毁
    }
  }

  getConfig(): Readonly<Required<LifecycleConfig>> {
    return this._config
  }

  /** 注册 agent（必须先 register 才能 tick） */
  track(agentId: string, initialStatus: AgentLifecycleStatus): void {
    this._lastActive.set(agentId, Date.now())
    this._recordEvent(agentId, initialStatus, initialStatus, 'track')
  }

  /** 触摸（agent 刚做完事） */
  touch(agentId: string, currentStatus: AgentLifecycleStatus): void {
    this._lastActive.set(agentId, Date.now())
    // touch 不引发转移
    if (currentStatus === 'idle' || currentStatus === 'hibernating') {
      // 只能记，不能直接转；调用方需调用 transition()
    }
  }

  /** 单步转移（不自动判断） */
  transition(
    agentId: string,
    from: AgentLifecycleStatus,
    to: AgentLifecycleStatus,
    reason: string = 'manual',
  ): TransitionResult {
    const r = validateTransition(from, to)
    if (!r.ok) return r
    this._lastActive.set(agentId, Date.now())
    this._recordEvent(agentId, from, to, reason)
    return { ok: true }
  }

  /** 周期性 tick：检查超时 + 强制转移 */
  tick(
    agentId: string,
    currentStatus: AgentLifecycleStatus,
    now: number = Date.now(),
  ): { transitioned: boolean; newStatus: AgentLifecycleStatus; reason: string } {
    if (isTerminalState(currentStatus)) {
      return { transitioned: false, newStatus: currentStatus, reason: 'terminal' }
    }
    const last = this._lastActive.get(agentId) ?? now
    const idleAge = now - last
    const cfg = this._config

    if (currentStatus === 'active' && idleAge >= cfg.idleTimeoutMs) {
      this.transition(agentId, 'active', 'idle', 'idle timeout')
      return { transitioned: true, newStatus: 'idle', reason: 'idle timeout' }
    }
    if (currentStatus === 'idle' && idleAge >= cfg.hibernateAfterMs) {
      this.transition(agentId, 'idle', 'hibernating', 'hibernate timeout')
      return { transitioned: true, newStatus: 'hibernating', reason: 'hibernate timeout' }
    }
    if (
      currentStatus === 'hibernating' &&
      cfg.destroyAfterMs > 0 &&
      idleAge >= cfg.destroyAfterMs
    ) {
      this.transition(agentId, 'hibernating', 'destroyed', 'destroy timeout')
      return { transitioned: true, newStatus: 'destroyed', reason: 'destroy timeout' }
    }
    return { transitioned: false, newStatus: currentStatus, reason: 'no transition needed' }
  }

  /** 取消追踪（destroy 后） */
  untrack(agentId: string): void {
    this._lastActive.delete(agentId)
  }

  /** 取所有事件历史 */
  getEvents(agentId?: string): LifecycleEvent[] {
    const all = [...this._events]
    return agentId ? all.filter(e => e.agentId === agentId) : all
  }

  /** 取最近一次活动时间 */
  getLastActive(agentId: string): number | undefined {
    return this._lastActive.get(agentId)
  }

  private _recordEvent(
    agentId: string,
    from: AgentLifecycleStatus,
    to: AgentLifecycleStatus,
    reason: string,
  ): void {
    this._events.push({ agentId, from, to, timestamp: Date.now(), reason })
  }
}

// =============================================================================
// 3. 便捷函数
// =============================================================================

/** 构造默认 lifecycle manager */
export function createDefaultLifecycleManager(): AgentLifecycleManager {
  return new AgentLifecycleManager({
    idleTimeoutMs: 5 * 60 * 1000,
    hibernateAfterMs: 30 * 60 * 1000,
  })
}
