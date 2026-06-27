/**
 * BaseAgentAdapter.ts (V2341)
 *
 * 旧 BaseAgent（V39）→ 新 Agent Runtime 的桥接层。
 *
 * 关键设计：
 * - 不修改 BaseAgent（向后兼容）
 * - adapter 提供 run() 方法把 BaseAgent.execute 包装成 runtime-aware
 * - sandbox 在 adapter 内部拦截 tool/memory 操作
 * - adapter 持有 soul + binding + scope（通过外部注入）
 */

import type { AgentSoul, AgentUserBinding, AgentMemoryScopeConfig } from './types'
import type { AgentSandbox, SandboxOp, Sanction } from './AgentSandbox'

/** 旧 BaseAgent 暴露的最小接口（duck typing） */
export interface LegacyBaseAgentLike {
  name: string
  maxRetries?: number
  timeout?: number
  /** 旧 execute 方法（不同子类签名略不同，我们用 duck typing） */
  execute?: (...args: unknown[]) => Promise<unknown> | unknown
  /** 旧 run 方法 */
  run?: (...args: unknown[]) => Promise<unknown> | unknown
  /** 旧 invoke 方法 */
  invoke?: (...args: unknown[]) => Promise<unknown> | unknown
  /** 旧 handle 方法 */
  handle?: (...args: unknown[]) => Promise<unknown> | unknown
}

export interface BaseAgentAdapterOptions {
  soul: AgentSoul
  userBinding: AgentUserBinding
  memoryScope: AgentMemoryScopeConfig
  sandbox: AgentSandbox
  /** ACL 拒绝时是否抛错（默认 false = 静默返回） */
  throwOnDeny?: boolean
}

export interface BaseAgentRunResult {
  success: boolean
  output?: unknown
  error?: string
  sanctions: Sanction[]
  startedAt: number
  finishedAt: number
}

/** 检测对象是否是 LegacyBaseAgent（duck typing） */
export function isLegacyBaseAgent(obj: unknown): obj is LegacyBaseAgentLike {
  if (!obj || typeof obj !== 'object') return false
  const o = obj as Record<string, unknown>
  if (typeof o.name !== 'string') return false
  // 至少有一个执行方法
  return typeof o.execute === 'function' || typeof o.run === 'function' ||
    typeof o.invoke === 'function' || typeof o.handle === 'function'
}

/** 旧 BaseAgent 适配器 */
export class BaseAgentAdapter {
  private _legacy: LegacyBaseAgentLike
  private _soul: AgentSoul
  private _userBinding: AgentUserBinding
  private _memoryScope: AgentMemoryScopeConfig
  private _sandbox: AgentSandbox
  private _throwOnDeny: boolean

  constructor(legacy: LegacyBaseAgentLike, options: BaseAgentAdapterOptions) {
    if (!isLegacyBaseAgent(legacy)) {
      throw new Error('BaseAgentAdapter: object is not a legacy BaseAgent')
    }
    this._legacy = legacy
    this._soul = options.soul
    this._userBinding = options.userBinding
    this._memoryScope = options.memoryScope
    this._sandbox = options.sandbox
    this._throwOnDeny = options.throwOnDeny ?? false
  }

  get soul(): AgentSoul {
    return this._soul
  }

  get userBinding(): AgentUserBinding {
    return this._userBinding
  }

  get memoryScope(): AgentMemoryScopeConfig {
    return this._memoryScope
  }

  get sandbox(): AgentSandbox {
    return this._sandbox
  }

  get legacyName(): string {
    return this._legacy.name
  }

  /** 通过 sandbox 拦截一次 op */
  intercept(op: SandboxOp): Sanction {
    const sanction = this._sandbox.intercept(op, {
      soul: this._soul,
      memoryScope: this._memoryScope,
      agentId: this._soul.agentId,
    })
    if (!sanction.allowed && this._throwOnDeny) {
      throw new Error(`sandbox denied: ${sanction.reason}`)
    }
    return sanction
  }

  /** 包装旧 execute（先 ACL，后调用；denied 时跳过） */
  async runWithAcl<T = unknown>(task: T, op: SandboxOp): Promise<BaseAgentRunResult> {
    const startedAt = Date.now()
    const preSanction = this.intercept(op)

    // denied 时跳过执行
    if (!preSanction.allowed) {
      return {
        success: false,
        error: `denied by sandbox: ${preSanction.reason}`,
        sanctions: [preSanction],
        startedAt,
        finishedAt: Date.now(),
      }
    }

    // 找到旧 agent 的执行方法
    const method = this._legacy.execute ?? this._legacy.run ?? this._legacy.invoke ?? this._legacy.handle
    if (!method) {
      return {
        success: false,
        error: 'no executable method found on legacy agent',
        sanctions: [preSanction],
        startedAt,
        finishedAt: Date.now(),
      }
    }

    try {
      const fn = method as (...args: unknown[]) => unknown
      const result = await fn.call(this._legacy, task)
      return {
        success: true,
        output: result,
        sanctions: [preSanction],
        startedAt,
        finishedAt: Date.now(),
      }
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
        sanctions: [preSanction],
        startedAt,
        finishedAt: Date.now(),
      }
    }
  }

  /** 同步版 run（仅当 legacy 是同步时） */
  runSync<T = unknown>(task: T, op: SandboxOp): BaseAgentRunResult {
    const startedAt = Date.now()
    const preSanction = this.intercept(op)
    if (!preSanction.allowed) {
      return {
        success: false,
        error: `denied by sandbox: ${preSanction.reason}`,
        sanctions: [preSanction],
        startedAt,
        finishedAt: Date.now(),
      }
    }
    const method = this._legacy.execute ?? this._legacy.run ?? this._legacy.invoke ?? this._legacy.handle
    if (!method) {
      return {
        success: false,
        error: 'no executable method',
        sanctions: [preSanction],
        startedAt,
        finishedAt: Date.now(),
      }
    }
    try {
      const fn = method as (...args: unknown[]) => unknown
      const result = fn.call(this._legacy, task)
      return {
        success: true,
        output: result,
        sanctions: [preSanction],
        startedAt,
        finishedAt: Date.now(),
      }
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
        sanctions: [preSanction],
        startedAt,
        finishedAt: Date.now(),
      }
    }
  }
}

// =============================================================================
// Factory helper
// =============================================================================

/** 创建 BaseAgentAdapter 的便捷函数 */
export function adaptLegacyBaseAgent(
  legacy: LegacyBaseAgentLike,
  options: BaseAgentAdapterOptions,
): BaseAgentAdapter {
  return new BaseAgentAdapter(legacy, options)
}
