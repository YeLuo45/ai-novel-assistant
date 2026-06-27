/**
 * AgentFactory.ts (V2332)
 *
 * Agent 工厂：把 soul 模板 + overrides 组合成完整 agent bundle。
 *
 * 输出：SpawnedAgent（soul + user binding + memory scope 三件套 bundle）
 *
 * 用法：
 *   const factory = new AgentFactory()
 *   const agent = factory.spawn({
 *     template: PLOT_ADVISOR_TEMPLATE,
 *     agentId: 'plot-1',
 *     userBinding: { visibleUserFields: ['penName', 'plotOutline'] },
 *   })
 */

import {
  createSoul,
  fromTemplate,
  createUserBinding,
  createMemoryScope,
  type AgentSoul,
  type AgentUserBinding,
  type AgentMemoryScopeConfig,
  type SoulTemplate,
  type CreateSoulInput,
} from './index'
import type { AgentRegistry, AgentSummary } from './AgentRegistry'
import type { AgentLifecycleStatus } from './AgentRegistry'

// =============================================================================
// 1. Spawned Agent Bundle
// =============================================================================

/** 已 spawn agent 的完整三件套 bundle */
export interface SpawnedAgent {
  soul: AgentSoul
  userBinding: AgentUserBinding
  memoryScope: AgentMemoryScopeConfig
  summary: AgentSummary
  spawnedAt: number
  factoryVersion: string
}

export interface SpawnInput {
  template?: SoulTemplate
  soul?: AgentSoul
  agentId: string
  archetype?: CreateSoulInput['archetype']
  capabilities?: CreateSoulInput['capabilities']
  tone?: CreateSoulInput['tone']
  decisionPolicy?: CreateSoulInput['decisionPolicy']
  principles?: CreateSoulInput['principles']
  toolWhitelist?: CreateSoulInput['toolWhitelist']
  memoryReadScope?: CreateSoulInput['memoryReadScope']
  memoryWriteScope?: CreateSoulInput['memoryWriteScope']
  displayName?: string
  userBinding?: {
    visibleUserFields?: string[]
    userAlias?: string
    customInstructions?: string
    baseContext?: Record<string, unknown>
  }
  episodicTTL?: number
  workingMaxItems?: number
  initialStatus?: AgentLifecycleStatus
  tags?: string[]
}

/** 工厂版本号（每次重磅升级递增） */
export const FACTORY_VERSION = '3.0.0'

// =============================================================================
// 2. AgentFactory
// =============================================================================

export class AgentFactory {
  private readonly _registry: AgentRegistry
  private _count: number = 0

  constructor(registry: AgentRegistry) {
    this._registry = registry
  }

  /** 总 spawn 计数（含 destroyed） */
  totalSpawned(): number {
    return this._count
  }

  /** spawn 一个 agent（必须 template 或 soul 二选一） */
  spawn(input: SpawnInput): SpawnedAgent {
    if (!input.template && !input.soul) {
      throw new Error('AgentFactory.spawn: requires either template or soul')
    }
    if (input.template && input.soul) {
      throw new Error('AgentFactory.spawn: template and soul are mutually exclusive')
    }

    // 1. soul
    const soul: AgentSoul = input.template
      ? fromTemplate(input.template, {
          agentId: input.agentId,
          archetype: input.archetype,
          capabilities: input.capabilities,
          tone: input.tone,
          decisionPolicy: input.decisionPolicy,
          principles: input.principles,
          toolWhitelist: input.toolWhitelist,
          memoryReadScope: input.memoryReadScope,
          memoryWriteScope: input.memoryWriteScope,
          displayName: input.displayName,
        })
      : (() => {
          const s = input.soul as AgentSoul
          // 如果外部传 soul 但要覆盖某些字段
          if (
            input.archetype ||
            input.capabilities ||
            input.tone ||
            input.decisionPolicy
          ) {
            return createSoul({
              agentId: input.agentId,
              archetype: input.archetype ?? s.archetype,
              displayName: input.displayName ?? s.persona.displayName,
              capabilities: input.capabilities ?? s.capabilities,
              tone: input.tone ?? s.persona.tone,
              decisionPolicy: input.decisionPolicy ?? s.persona.decisionPolicy,
              principles: input.principles ?? s.persona.principles,
              toolWhitelist: input.toolWhitelist ?? s.toolWhitelist,
              memoryReadScope: input.memoryReadScope ?? s.memoryReadScope,
              memoryWriteScope: input.memoryWriteScope ?? s.memoryWriteScope,
              parentOf: s.agentId,
            })
          }
          // 完全沿用外部 soul
          return createSoul({
            agentId: s.agentId,
            archetype: s.archetype,
            displayName: s.persona.displayName,
            capabilities: s.capabilities,
            tone: s.persona.tone,
            decisionPolicy: s.persona.decisionPolicy,
            principles: s.persona.principles,
            toolWhitelist: s.toolWhitelist,
            memoryReadScope: s.memoryReadScope,
            memoryWriteScope: s.memoryWriteScope,
            parentOf: s.agentId,
          })
        })()

    // 2. user binding
    const userBinding = createUserBinding({
      agentId: soul.agentId,
      visibleUserFields: input.userBinding?.visibleUserFields,
      userAlias: input.userBinding?.userAlias,
      customInstructions: input.userBinding?.customInstructions,
      baseContext: input.userBinding?.baseContext,
    })

    // 3. memory scope
    const memoryScope = createMemoryScope({
      agentId: soul.agentId,
      episodicTTL: input.episodicTTL,
      workingMaxItems: input.workingMaxItems,
    })

    // 4. registry 注册
    const summary = this._registry.register({
      soul,
      initialStatus: input.initialStatus ?? 'spawning',
      tags: input.tags,
    })

    this._count += 1
    return {
      soul,
      userBinding,
      memoryScope,
      summary,
      spawnedAt: Date.now(),
      factoryVersion: FACTORY_VERSION,
    }
  }

  /** 批量 spawn（从模板数组） */
  spawnMany(
    template: SoulTemplate,
    agentIds: string[],
    overrides?: Omit<SpawnInput, 'template' | 'agentId'>,
  ): SpawnedAgent[] {
    return agentIds.map(id =>
      this.spawn({ ...overrides, template, agentId: id }),
    )
  }

  /** destroy 一个 agent（unregister + 标记 destroyed） */
  destroy(agentId: string): boolean {
    if (!this._registry.has(agentId)) return false
    this._registry.updateStatus(agentId, 'destroyed')
    return this._registry.unregister(agentId)
  }

  /** 销毁全部 */
  destroyAll(): number {
    const all = this._registry.list()
    for (const s of all) this._registry.unregister(s.agentId)
    return all.length
  }
}

// =============================================================================
// 3. 便捷函数（无 registry 的单次 spawn）
// =============================================================================

/** 一次性 spawn（用于测试 / demo；不持久化到 registry） */
export function spawnEphemeral(input: SpawnInput): SpawnedAgent {
  if (!input.template && !input.soul) {
    throw new Error('spawnEphemeral: requires either template or soul')
  }
  const soul: AgentSoul = input.template
    ? fromTemplate(input.template, {
        agentId: input.agentId,
        archetype: input.archetype,
        capabilities: input.capabilities,
        tone: input.tone,
        decisionPolicy: input.decisionPolicy,
        displayName: input.displayName,
      })
    : createSoul({
        agentId: (input.soul as AgentSoul).agentId,
        archetype: (input.soul as AgentSoul).archetype,
        displayName: (input.soul as AgentSoul).persona.displayName,
        capabilities: (input.soul as AgentSoul).capabilities,
        tone: (input.soul as AgentSoul).persona.tone,
        decisionPolicy: (input.soul as AgentSoul).persona.decisionPolicy,
        parentOf: (input.soul as AgentSoul).agentId,
      })
  const userBinding = createUserBinding({
    agentId: soul.agentId,
    visibleUserFields: input.userBinding?.visibleUserFields,
    userAlias: input.userBinding?.userAlias,
    customInstructions: input.userBinding?.customInstructions,
    baseContext: input.userBinding?.baseContext,
  })
  const memoryScope = createMemoryScope({
    agentId: soul.agentId,
    episodicTTL: input.episodicTTL,
    workingMaxItems: input.workingMaxItems,
  })
  return {
    soul,
    userBinding,
    memoryScope,
    summary: {
      agentId: soul.agentId,
      archetype: soul.archetype,
      displayName: soul.persona.displayName,
      capabilities: [...soul.capabilities],
      status: input.initialStatus ?? 'spawning',
      spawnedAt: Date.now(),
      lastActiveAt: Date.now(),
      tags: [...(input.tags ?? [])],
    },
    spawnedAt: Date.now(),
    factoryVersion: FACTORY_VERSION,
  }
}
