/**
 * NanobotAdapter.ts (V2342)
 *
 * 旧 Nanobot（src/ai/agents/nanobot/*.ts）→ 新 Agent Runtime 的桥接层。
 *
 * Nanobot 模式：每个是 class with 静态方法（process/analyze/generate/score/detect）
 * Adapter 模式：
 * - 接受 soul + nanobot class 引用
 * - 不实例化 nanobot（它们本身就是工具类）
 * - 把静态方法包装成 agent-callable
 *
 * 关键设计：
 * - 不修改 nanobot（向后兼容）
 * - adapter 用反射（Function.name）识别可用方法
 * - sandbox 拦截"执行"边界
 */

import type { AgentSoul, AgentUserBinding, AgentMemoryScopeConfig } from './types'
import type { AgentSandbox, SandboxOp, Sanction } from './AgentSandbox'

/** Nanobot 静态方法候选名（duck typing） */
export type NanobotMethodName =
  | 'process' | 'analyze' | 'generate' | 'score' | 'detect'
  | 'compute' | 'transform' | 'extract' | 'classify' | 'predict'

/** Nanobot 静态类 duck type（任意带 name + 静态方法的 class） */
export type NanobotClassLike = Record<string, unknown> & { name: string }

export interface NanobotAdapterOptions {
  soul: AgentSoul
  userBinding: AgentUserBinding
  memoryScope: AgentMemoryScopeConfig
  sandbox: AgentSandbox
}

export interface NanobotCallResult<T = unknown> {
  method: NanobotMethodName
  success: boolean
  output?: T
  error?: string
  sanctions: Sanction[]
  startedAt: number
  finishedAt: number
  durationMs: number
}

/** 检测是否是 nanobot class（任意含静态方法的 class） */
export function isNanobotClass(obj: unknown): obj is NanobotClassLike {
  if (!obj || typeof obj !== 'function') return false
  // 任何 class 都算 nanobot（不要求特定方法名）
  // 具体方法在 call 时检测
  return true
}

/** 列出 nanobot 上所有可调用的方法名 */
export function listNanobotMethods(nanobot: NanobotClassLike): NanobotMethodName[] {
  const candidates: NanobotMethodName[] = [
    'process', 'analyze', 'generate', 'score', 'detect',
    'compute', 'transform', 'extract', 'classify', 'predict',
  ]
  const rec = nanobot as unknown as Record<string, unknown>
  return candidates.filter(m => typeof rec[m] === 'function')
}

export class NanobotAdapter {
  private _nanobot: NanobotClassLike
  private _soul: AgentSoul
  private _userBinding: AgentUserBinding
  private _memoryScope: AgentMemoryScopeConfig
  private _sandbox: AgentSandbox
  private _methods: NanobotMethodName[]

  constructor(nanobot: NanobotClassLike, options: NanobotAdapterOptions) {
    if (!isNanobotClass(nanobot)) {
      throw new Error('NanobotAdapter: object is not a nanobot class')
    }
    this._nanobot = nanobot
    this._soul = options.soul
    this._userBinding = options.userBinding
    this._memoryScope = options.memoryScope
    this._sandbox = options.sandbox
    this._methods = listNanobotMethods(nanobot)
  }

  get soul(): AgentSoul {
    return this._soul
  }

  get nanobotName(): string {
    return this._nanobot.name
  }

  get availableMethods(): readonly NanobotMethodName[] {
    return this._methods
  }

  get sandbox(): AgentSandbox {
    return this._sandbox
  }

  /** 调用 nanobot 的指定方法（带 sandbox 拦截） */
  call<T = unknown>(
    method: NanobotMethodName,
    args: unknown[],
    op: SandboxOp = { kind: 'tool.call', tool: `${this._nanobot.name}.${method}` },
  ): NanobotCallResult<T> {
    const startedAt = Date.now()
    const sanction = this._sandbox.intercept(op, {
      soul: this._soul,
      memoryScope: this._memoryScope,
      agentId: this._soul.agentId,
    })

    if (!sanction.allowed) {
      return {
        method,
        success: false,
        error: `denied by sandbox: ${sanction.reason}`,
        sanctions: [sanction],
        startedAt,
        finishedAt: Date.now(),
        durationMs: Date.now() - startedAt,
      }
    }

    const fn = (this._nanobot as Record<string, unknown>)[method]
    if (typeof fn !== 'function') {
      return {
        method,
        success: false,
        error: `method '${method}' not found on nanobot '${this._nanobot.name}'`,
        sanctions: [sanction],
        startedAt,
        finishedAt: Date.now(),
        durationMs: Date.now() - startedAt,
      }
    }

    try {
      const result = (fn as (...a: unknown[]) => T).apply(this._nanobot, args)
      const finishedAt = Date.now()
      return {
        method,
        success: true,
        output: result,
        sanctions: [sanction],
        startedAt,
        finishedAt,
        durationMs: finishedAt - startedAt,
      }
    } catch (e) {
      const finishedAt = Date.now()
      return {
        method,
        success: false,
        error: e instanceof Error ? e.message : String(e),
        sanctions: [sanction],
        startedAt,
        finishedAt,
        durationMs: finishedAt - startedAt,
      }
    }
  }

  /** 自动选择第一个可用的方法调用 */
  callAny<T = unknown>(args: unknown[]): NanobotCallResult<T> {
    if (this._methods.length === 0) {
      const now = Date.now()
      return {
        method: 'process' as NanobotMethodName,
        success: false,
        error: 'no methods available on nanobot',
        sanctions: [],
        startedAt: now,
        finishedAt: now,
        durationMs: 0,
      }
    }
    return this.call<T>(this._methods[0], args)
  }
}

// =============================================================================
// Factory
// =============================================================================

/** 便捷构造 */
export function adaptNanobot(
  nanobot: NanobotClassLike,
  options: NanobotAdapterOptions,
): NanobotAdapter {
  return new NanobotAdapter(nanobot, options)
}
