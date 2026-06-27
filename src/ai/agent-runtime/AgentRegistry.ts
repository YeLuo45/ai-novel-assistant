/**
 * AgentRegistry.ts (V2331)
 *
 * Agent 注册表：spawned agent 的索引 + 标签搜索。
 *
 * 关键能力：
 * - 单一 source of truth（所有已 spawn 的 agent 在这里）
 * - 多种查询方式：by id / by capability / by archetype / by status
 * - snapshot 序列化（用于持久化 / UI 列表）
 * - 严格模式：重名 register 抛错
 *
 * 不存储：soul/user binding/memory scope 数据（这些是 agent 自己的状态，
 *          registry 只存"指针 + 摘要"，避免重复）。
 */

import type {
  AgentArchetype,
  AgentSoul,
  CapabilityTag,
} from './types'

// =============================================================================
// 1. 摘要类型
// =============================================================================

export interface AgentSummary {
  agentId: string
  archetype: AgentArchetype
  displayName: string
  capabilities: CapabilityTag[]
  status: AgentLifecycleStatus
  spawnedAt: number
  lastActiveAt: number
  parentOf?: string
  tags: string[]
}

/** Agent 生命周期状态（V2334 详细定义；这里先 inline） */
export type AgentLifecycleStatus =
  | 'spawning'
  | 'active'
  | 'idle'
  | 'hibernating'
  | 'destroyed'

export interface RegisterAgentInput {
  soul: AgentSoul
  initialStatus?: AgentLifecycleStatus
  tags?: string[]
}

// =============================================================================
// 2. Registry 实现
// =============================================================================

export class AgentRegistry {
  private readonly _agents: Map<string, AgentSummary> = new Map()
  private _strict: boolean = true

  /** 严格模式开关：false 时重名 register 静默覆盖 */
  setStrict(strict: boolean): void {
    this._strict = strict
  }

  isStrict(): boolean {
    return this._strict
  }

  /** 注册一个 agent */
  register(input: RegisterAgentInput): AgentSummary {
    const { soul } = input
    if (this._agents.has(soul.agentId)) {
      if (this._strict) {
        throw new Error(`AgentRegistry: agentId '${soul.agentId}' already registered`)
      }
    }
    const now = Date.now()
    const summary: AgentSummary = {
      agentId: soul.agentId,
      archetype: soul.archetype,
      displayName: soul.persona.displayName,
      capabilities: [...soul.capabilities],
      status: input.initialStatus ?? 'spawning',
      spawnedAt: now,
      lastActiveAt: now,
      parentOf: typeof soul.metadata?.parentOf === 'string' ? soul.metadata.parentOf : undefined,
      tags: [...(input.tags ?? [])],
    }
    this._agents.set(soul.agentId, summary)
    return summary
  }

  /** 注销一个 agent */
  unregister(agentId: string): boolean {
    return this._agents.delete(agentId)
  }

  /** 是否存在 */
  has(agentId: string): boolean {
    return this._agents.has(agentId)
  }

  /** 取一个 agent 摘要 */
  get(agentId: string): AgentSummary | undefined {
    return this._agents.get(agentId)
  }

  /** 取一个 agent 摘要（断言存在） */
  mustGet(agentId: string): AgentSummary {
    const s = this._agents.get(agentId)
    if (!s) throw new Error(`AgentRegistry: agentId '${agentId}' not found`)
    return s
  }

  /** 全部 agent 列表（按 spawnedAt 升序） */
  list(): AgentSummary[] {
    return Array.from(this._agents.values()).sort((a, b) => a.spawnedAt - b.spawnedAt)
  }

  /** 当前 agent 数 */
  count(): number {
    return this._agents.size
  }

  /** 按 archetype 筛选 */
  findByArchetype(archetype: AgentArchetype): AgentSummary[] {
    return this.list().filter(s => s.archetype === archetype)
  }

  /** 按 capability 筛选（任一匹配） */
  findByCapability(cap: CapabilityTag): AgentSummary[] {
    return this.list().filter(s => s.capabilities.includes(cap))
  }

  /** 按多个 capability 筛选（必须全部具备） */
  findByAllCapabilities(caps: CapabilityTag[]): AgentSummary[] {
    return this.list().filter(s => caps.every(c => s.capabilities.includes(c)))
  }

  /** 按 tag 筛选 */
  findByTag(tag: string): AgentSummary[] {
    return this.list().filter(s => s.tags.includes(tag))
  }

  /** 按状态筛选 */
  findByStatus(status: AgentLifecycleStatus): AgentSummary[] {
    return this.list().filter(s => s.status === status)
  }

  /** 更新 agent 状态（lifecycle 转移） */
  updateStatus(agentId: string, status: AgentLifecycleStatus): AgentSummary {
    const s = this.mustGet(agentId)
    const updated: AgentSummary = { ...s, status, lastActiveAt: Date.now() }
    this._agents.set(agentId, updated)
    return updated
  }

  /** 触摸 lastActiveAt（不改变 status） */
  touch(agentId: string): void {
    const s = this._agents.get(agentId)
    if (s) {
      this._agents.set(agentId, { ...s, lastActiveAt: Date.now() })
    }
  }

  /** 批量销毁（保留 history） */
  clear(): number {
    const n = this._agents.size
    this._agents.clear()
    return n
  }

  /** 快照（深拷贝） */
  snapshot(): AgentSummary[] {
    return this.list().map(s => ({ ...s, capabilities: [...s.capabilities], tags: [...s.tags] }))
  }

  /** 重建（从 snapshot） */
  restore(snapshot: AgentSummary[]): void {
    this._agents.clear()
    for (const s of snapshot) {
      this._agents.set(s.agentId, { ...s, capabilities: [...s.capabilities], tags: [...s.tags] })
    }
  }
}

// =============================================================================
// 3. 单例工厂
// =============================================================================

let _singleton: AgentRegistry | null = null

/** 取全局唯一 registry（懒初始化） */
export function getAgentRegistry(): AgentRegistry {
  if (!_singleton) _singleton = new AgentRegistry()
  return _singleton
}

/** 重置全局 registry（测试用） */
export function resetAgentRegistry(): void {
  _singleton = null
}
