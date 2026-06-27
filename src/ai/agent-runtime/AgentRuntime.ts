/**
 * AgentRuntime.ts (V2335)
 *
 * Agent Runtime 壳入口：把 Registry/Factory/Sandbox/Lifecycle 组合成一个可启动的 runtime。
 *
 * 用法：
 *   const rt = new AgentRuntime({ sandbox: 'strict' })
 *   const agent = rt.spawn({ template: PLOT_ADVISOR, agentId: 'plot-1' })
 *   rt.tick(agent.summary.agentId)  // 周期性调用
 *   const s = rt.intercept({ kind: 'memory.read', ... }, 'plot-1')
 *
 * 高级用法：
 *   await rt.withActor('plot-1', async (ctx) => {
 *     // 上下文含 soul + binding + memoryScope + sandbox
 *   })
 */

import { AgentRegistry, getAgentRegistry, type AgentLifecycleStatus, type AgentSummary } from './AgentRegistry'
import { AgentFactory, type SpawnedAgent, type SpawnInput } from './AgentFactory'
import {
  AgentSandbox,
  createDefaultSandbox,
  createStrictSandbox,
  type SandboxOp,
  type Sanction,
} from './AgentSandbox'
import { AgentLifecycleManager, createDefaultLifecycleManager } from './AgentLifecycle'
import type { AgentSoul, AgentUserBinding, AgentMemoryScopeConfig } from './types'

// =============================================================================
// 1. 配置
// =============================================================================

export interface AgentRuntimeConfig {
  /** registry 实例（不传 = 用全局） */
  registry?: AgentRegistry
  /** sandbox 模式：default / strict */
  sandbox?: 'default' | 'strict'
  /** lifecycle 配置 */
  lifecycle?: ConstructorParameters<typeof AgentLifecycleManager>[0]
  /** 是否注册到全局单例 */
  global?: boolean
}

export interface ActorContext {
  agentId: string
  soul: AgentSoul
  userBinding: AgentUserBinding
  memoryScope: AgentMemoryScopeConfig
  sandbox: AgentSandbox
}

// =============================================================================
// 2. AgentRuntime
// =============================================================================

export class AgentRuntime {
  private _registry: AgentRegistry
  private _factory: AgentFactory
  private _sandbox: AgentSandbox
  private _lifecycle: AgentLifecycleManager
  private _isGlobal: boolean
  private _tickListeners: Array<() => void> = []

  constructor(config: AgentRuntimeConfig = {}) {
    this._registry = config.registry ?? new AgentRegistry()
    this._factory = new AgentFactory(this._registry)
    this._sandbox = config.sandbox === 'strict' ? createStrictSandbox() : createDefaultSandbox()
    this._lifecycle = config.lifecycle
      ? new AgentLifecycleManager(config.lifecycle)
      : createDefaultLifecycleManager()
    this._isGlobal = config.global ?? false
  }

  /** 子系统访问 */
  get registry(): AgentRegistry {
    return this._registry
  }

  get factory(): AgentFactory {
    return this._factory
  }

  get sandbox(): AgentSandbox {
    return this._sandbox
  }

  get lifecycle(): AgentLifecycleManager {
    return this._lifecycle
  }

  isGlobal(): boolean {
    return this._isGlobal
  }

  // -------------------------------------------------------------------------
  // 3. 生命周期入口
  // -------------------------------------------------------------------------

  /** spawn 一个 agent */
  spawn(input: SpawnInput): SpawnedAgent {
    const a = this._factory.spawn(input)
    this._lifecycle.track(a.soul.agentId, a.summary.status)
    return a
  }

  /** destroy 一个 agent */
  destroy(agentId: string): boolean {
    const ok = this._factory.destroy(agentId)
    if (ok) this._lifecycle.untrack(agentId)
    return ok
  }

  /** 批量 tick（检查全部 agent 的超时） */
  tickAll(now: number = Date.now()): { transitioned: AgentSummary[] } {
    const transitioned: AgentSummary[] = []
    for (const s of this._registry.list()) {
      const r = this._lifecycle.tick(s.agentId, s.status, now)
      if (r.transitioned) {
        this._registry.updateStatus(s.agentId, r.newStatus)
        transitioned.push({ ...s, status: r.newStatus })
        if (r.newStatus === 'destroyed') {
          this._lifecycle.untrack(s.agentId)
          this._registry.unregister(s.agentId)
        }
      }
    }
    this._notifyTickListeners()
    return { transitioned }
  }

  /** 单 agent tick（外部用） */
  tick(agentId: string, now: number = Date.now()): { transitioned: boolean; newStatus: AgentLifecycleStatus } {
    const s = this._registry.get(agentId)
    if (!s) return { transitioned: false, newStatus: 'destroyed' }
    const r = this._lifecycle.tick(agentId, s.status, now)
    if (r.transitioned) {
      this._registry.updateStatus(agentId, r.newStatus)
      if (r.newStatus === 'destroyed') {
        this._lifecycle.untrack(agentId)
        this._registry.unregister(agentId)
      }
    }
    return { transitioned: r.transitioned, newStatus: r.newStatus }
  }

  /** 触摸（agent 刚做完事） */
  touch(agentId: string): void {
    this._lifecycle.touch(agentId, this._registry.get(agentId)?.status ?? 'idle')
    this._registry.touch(agentId)
  }

  // -------------------------------------------------------------------------
  // 4. ACL 入口
  // -------------------------------------------------------------------------

  /** 拦截一次 op（自动取 actor） */
  intercept(op: SandboxOp, actorAgentId: string): Sanction {
    const ctx = this._buildActorContext(actorAgentId)
    if (!ctx) {
      return {
        allowed: false,
        reason: `actor '${actorAgentId}' not found`,
        audit: {
          timestamp: Date.now(),
          sourceAgentId: actorAgentId,
          targetAgentId: '',
          level: 'L1',
          operation: 'read',
        },
        violation: true,
      }
    }
    return this._sandbox.intercept(op, ctx)
  }

  /** 异步上下文：自动构建 actor + 提供 sandbox 访问 */
  async withActor<T>(agentId: string, fn: (ctx: ActorContext) => Promise<T> | T): Promise<T | undefined> {
    const ctx = this._buildActorContext(agentId)
    if (!ctx) return undefined
    return fn(ctx)
  }

  // -------------------------------------------------------------------------
  // 5. 查询
  // -------------------------------------------------------------------------

  has(agentId: string): boolean {
    return this._registry.has(agentId)
  }

  count(): number {
    return this._registry.count()
  }

  list(): AgentSummary[] {
    return this._registry.list()
  }

  getSoul(agentId: string): AgentSoul | undefined {
    return undefined // soul 不在 registry 里；用 withActor 取
  }

  // -------------------------------------------------------------------------
  // 6. tick listener（用于 dashboard / 监控）
  // -------------------------------------------------------------------------

  /** 注册 tick 监听器（每次 tickAll 后调用） */
  onTick(listener: () => void): () => void {
    this._tickListeners.push(listener)
    return () => {
      this._tickListeners = this._tickListeners.filter(l => l !== listener)
    }
  }

  private _notifyTickListeners(): void {
    for (const l of this._tickListeners) {
      try {
        l()
      } catch {
        // 吞掉 listener 异常
      }
    }
  }

  // -------------------------------------------------------------------------
  // 7. 内部
  // -------------------------------------------------------------------------

  private _buildActorContext(agentId: string): ActorContext | null {
    const summary = this._registry.get(agentId)
    if (!summary) return null
    // soul / userBinding / memoryScope 不在 registry 中；通过外部 spawn 维护。
    // 简化：从 AgentFactory 的最近 spawn 中查找（如未找到则降级）
    // 更优解：runtime 维护 agentId → {soul, binding, scope} map。
    const stored = this._actorStore.get(agentId)
    if (!stored) return null
    return { agentId, ...stored, sandbox: this._sandbox }
  }

  private _actorStore: Map<string, { soul: AgentSoul; userBinding: AgentUserBinding; memoryScope: AgentMemoryScopeConfig }> = new Map()

  /** 内部：runtime 收到 spawn 后调此注册 actor 完整状态 */
  _registerActor(agent: SpawnedAgent): void {
    this._actorStore.set(agent.soul.agentId, {
      soul: agent.soul,
      userBinding: agent.userBinding,
      memoryScope: agent.memoryScope,
    })
  }

  _unregisterActor(agentId: string): void {
    this._actorStore.delete(agentId)
  }
}

// =============================================================================
// 3. 全局单例
// =============================================================================

let _globalRuntime: AgentRuntime | null = null

/** 获取全局 runtime（懒初始化） */
export function getGlobalRuntime(): AgentRuntime {
  if (!_globalRuntime) {
    _globalRuntime = new AgentRuntime({ global: true, registry: getAgentRegistry() })
  }
  return _globalRuntime
}

/** 重置全局 runtime（测试用） */
export function resetGlobalRuntime(): void {
  _globalRuntime = null
}

// =============================================================================
// 4. 高级：spawn 后自动 registerActor
// =============================================================================

/** Runtime 扩展方法：spawn + 内部 register actor 一步 */
export class ManagedAgentRuntime extends AgentRuntime {
  override spawn(input: SpawnInput): SpawnedAgent {
    const a = super.spawn(input)
    this._registerActor(a)
    return a
  }

  override destroy(agentId: string): boolean {
    const ok = super.destroy(agentId)
    if (ok) this._unregisterActor(agentId)
    return ok
  }
}
