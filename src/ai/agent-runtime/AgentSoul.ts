/**
 * AgentSoul.ts (V2327)
 *
 * Soul 对象的不可变工厂：create / clone / merge / derive / diff
 *
 * 设计目标：
 * - 一旦创建，soul 不可变；所有操作返回新对象（结构共享）
 * - 派生（derive）= clone + 字段覆盖，保留原 soul 痕迹（parentOf）
 * - merge = 多个 soul 的 capability union + persona 取最新
 */

import {
  AGENT_RUNTIME_VERSION,
  DEFAULT_TONE,
  DEFAULT_DECISION_POLICY,
  SOUL_BUMP_SYM,
  normalizeTone,
  normalizeDecisionPolicy,
  validateSoul,
  type AgentSoul,
  type AgentPersona,
  type SoulTemplate,
  type AgentArchetype,
  type CapabilityTag,
  type MemoryScope,
  type ValidationResult,
} from './types'

// =============================================================================
// 1. Soul 工厂
// =============================================================================

export interface CreateSoulInput {
  agentId: string
  archetype: AgentArchetype
  displayName: string
  tagline?: string
  capabilities: CapabilityTag[]
  principles?: string[]
  tone?: Partial<AgentPersona['tone']>
  decisionPolicy?: Partial<AgentPersona['decisionPolicy']>
  toolWhitelist?: string[]
  memoryReadScope?: MemoryScope
  memoryWriteScope?: MemoryScope
  metadata?: Record<string, unknown>
  parentOf?: string  // 派生时记录父 soul
}

/** 创建 soul（不可变 + 自动 normalize + 自动校验） */
export function createSoul(input: CreateSoulInput): AgentSoul {
  const now = Date.now()
  const soulData: Omit<AgentSoul, typeof SOUL_BUMP_SYM> = {
    agentId: input.agentId,
    archetype: input.archetype,
    persona: {
      displayName: input.displayName,
      tagline: input.tagline ?? `${input.displayName} (${input.archetype})`,
      principles: input.principles ?? [],
      tone: normalizeTone(input.tone ?? {}),
      decisionPolicy: normalizeDecisionPolicy(input.decisionPolicy ?? {}),
    },
    capabilities: dedupeCapabilities(input.capabilities),
    toolWhitelist: input.toolWhitelist,
    memoryReadScope: input.memoryReadScope ?? 'self',
    memoryWriteScope: input.memoryWriteScope ?? 'self',
    createdAt: now,
    updatedAt: now,
    version: 1,
    metadata: {
      ...(input.metadata ?? {}),
      ...(input.parentOf ? { parentOf: input.parentOf } : {}),
      ...(input.parentOf ? { runtimeVersion: AGENT_RUNTIME_VERSION } : {}),
    },
  }
  const soul = soulData as AgentSoul
  // 注入内部 bump 方法（用 Object.defineProperty 避开 freeze 检查）
  const makeBump = (currentSoul: AgentSoul) => function bump(nextVersion: number): AgentSoul {
    const bumpedData: Omit<AgentSoul, typeof SOUL_BUMP_SYM> = {
      ...(currentSoul as unknown as Omit<AgentSoul, typeof SOUL_BUMP_SYM>),
      version: nextVersion,
      updatedAt: Date.now(),
    }
    const out = bumpedData as AgentSoul
    const newBump = makeBump(out)
    Object.defineProperty(out, SOUL_BUMP_SYM, {
      value: newBump,
      enumerable: false,
      configurable: false,
      writable: false,
    })
    return Object.freeze(out)
  }
  Object.defineProperty(soul, SOUL_BUMP_SYM, {
    value: makeBump(soul),
    enumerable: false,
    configurable: false,
    writable: false,
  })
  return Object.freeze(soul)
}

// =============================================================================
// 2. Clone & Merge
// =============================================================================

/** 克隆 soul（深拷贝但保留 metadata 引用类型安全） */
export function cloneSoul(soul: AgentSoul, overrides: Partial<CreateSoulInput> = {}): AgentSoul {
  return createSoul({
    agentId: overrides.agentId ?? soul.agentId,
    archetype: overrides.archetype ?? soul.archetype,
    displayName: overrides.displayName ?? soul.persona.displayName,
    tagline: overrides.tagline ?? soul.persona.tagline,
    capabilities: overrides.capabilities ?? [...soul.capabilities],
    principles: overrides.principles ?? [...soul.persona.principles],
    tone: overrides.tone ?? soul.persona.tone,
    decisionPolicy: overrides.decisionPolicy ?? soul.persona.decisionPolicy,
    toolWhitelist: overrides.toolWhitelist ?? soul.toolWhitelist,
    memoryReadScope: overrides.memoryReadScope ?? soul.memoryReadScope,
    memoryWriteScope: overrides.memoryWriteScope ?? soul.memoryWriteScope,
    metadata: overrides.metadata ?? { ...soul.metadata },
    parentOf: overrides.parentOf ?? soul.agentId,
  })
}

/** 派生（derive）= 在父 soul 基础上覆盖 */
export function deriveSoul(parent: AgentSoul, overrides: Partial<CreateSoulInput>): AgentSoul {
  return cloneSoul(parent, { ...overrides, parentOf: parent.agentId })
}

/** 合并多个 soul（capability union + 最新 persona + 最新 metadata） */
export function mergeSouls(...souls: AgentSoul[]): AgentSoul {
  if (souls.length === 0) {
    throw new Error('mergeSouls: requires at least one soul')
  }
  if (souls.length === 1) return souls[0]
  const latest = souls[souls.length - 1]
  const capabilities = dedupeCapabilities(souls.flatMap(s => s.capabilities))
  const principles = dedupeStrings(souls.flatMap(s => s.persona.principles))
  const allToolWhitelists = souls.flatMap(s => s.toolWhitelist ?? [])
  return cloneSoul(latest, {
    capabilities,
    principles,
    toolWhitelist: allToolWhitelists.length > 0 ? dedupeStrings(allToolWhitelists) : undefined,
    metadata: Object.assign({}, ...souls.map(s => s.metadata)),
  })
}

// =============================================================================
// 3. Template → Soul
// =============================================================================

/** 从模板 + 覆盖创建 soul */
export function fromTemplate(
  template: SoulTemplate,
  overrides: Partial<CreateSoulInput> & { agentId: string },
): AgentSoul {
  return createSoul({
    agentId: overrides.agentId,
    archetype: overrides.archetype ?? template.archetype,
    displayName: overrides.displayName ?? template.displayName,
    tagline: overrides.tagline ?? template.description,
    capabilities: overrides.capabilities ?? [...template.baseCapabilities],
    principles: overrides.principles ?? [...template.basePersona.principles],
    tone: overrides.tone ?? template.basePersona.tone,
    decisionPolicy: overrides.decisionPolicy ?? template.basePersona.decisionPolicy,
    toolWhitelist: overrides.toolWhitelist ?? template.suggestedToolWhitelist,
    memoryReadScope: overrides.memoryReadScope ?? template.defaultMemoryScopes.read,
    memoryWriteScope: overrides.memoryWriteScope ?? template.defaultMemoryScopes.write,
    metadata: overrides.metadata,
  })
}

// =============================================================================
// 4. Diff（找出两个 soul 之间的差异）
// =============================================================================

export interface SoulDiff {
  hasChanges: boolean
  changedFields: Array<keyof AgentSoul | 'persona' | 'capabilities'>
  addedCapabilities: CapabilityTag[]
  removedCapabilities: CapabilityTag[]
}

/** 计算 soul 之间的差异（用于版本升级 / 审计） */
export function diffSouls(a: AgentSoul, b: AgentSoul): SoulDiff {
  const changedFields: SoulDiff['changedFields'] = []
  if (a.archetype !== b.archetype) changedFields.push('archetype')
  if (JSON.stringify(a.persona) !== JSON.stringify(b.persona)) changedFields.push('persona')
  if (a.memoryReadScope !== b.memoryReadScope) changedFields.push('memoryReadScope')
  if (a.memoryWriteScope !== b.memoryWriteScope) changedFields.push('memoryWriteScope')

  const aSet = new Set(a.capabilities)
  const bSet = new Set(b.capabilities)
  const addedCapabilities: CapabilityTag[] = []
  const removedCapabilities: CapabilityTag[] = []
  for (const c of b.capabilities) {
    if (!aSet.has(c)) addedCapabilities.push(c)
  }
  for (const c of a.capabilities) {
    if (!bSet.has(c)) removedCapabilities.push(c)
  }
  if (addedCapabilities.length > 0 || removedCapabilities.length > 0) {
    changedFields.push('capabilities')
  }
  return {
    hasChanges: changedFields.length > 0,
    changedFields,
    addedCapabilities,
    removedCapabilities,
  }
}

// =============================================================================
// 5. 校验 / 升级
// =============================================================================

/** 校验 soul 合法性 */
export function checkSoul(soul: Partial<AgentSoul>): ValidationResult {
  return validateSoul(soul)
}

/** 给 soul 加 version +1（返回新 soul） */
export function bumpVersion(soul: AgentSoul, patch: Partial<CreateSoulInput> = {}): AgentSoul {
  // 走 createSoul 重置 createdAt + version=1，然后由本函数包一层覆盖 version。
  // 关键：Object.freeze 后不能再改字段，所以通过 SOUL_BUMP_SYM 注入的内部方法跳冻结。
  return createSoul({
    agentId: patch.agentId ?? soul.agentId,
    archetype: patch.archetype ?? soul.archetype,
    displayName: patch.displayName ?? soul.persona.displayName,
    tagline: patch.tagline ?? soul.persona.tagline,
    capabilities: patch.capabilities ?? [...soul.capabilities],
    principles: patch.principles ?? [...soul.persona.principles],
    tone: patch.tone ?? soul.persona.tone,
    decisionPolicy: patch.decisionPolicy ?? soul.persona.decisionPolicy,
    toolWhitelist: patch.toolWhitelist ?? soul.toolWhitelist,
    memoryReadScope: patch.memoryReadScope ?? soul.memoryReadScope,
    memoryWriteScope: patch.memoryWriteScope ?? soul.memoryWriteScope,
    metadata: {
      ...(patch.metadata ?? soul.metadata),
      _bumpedFrom: { agentId: soul.agentId, version: soul.version },
    },
  })[SOUL_BUMP_SYM](soul.version + 1)
}

// =============================================================================
// 6. 内部工具
// =============================================================================

function dedupeCapabilities(caps: CapabilityTag[]): CapabilityTag[] {
  return Array.from(new Set(caps))
}

function dedupeStrings(arr: string[]): string[] {
  return Array.from(new Set(arr))
}

// =============================================================================
// 7. 便捷默认（外部少打几个字）
// =============================================================================

/** "中性助手" 默认 soul input（适合大多数 assistant 场景） */
export const NEUTRAL_ASSISTANT_INPUT: Omit<CreateSoulInput, 'agentId' | 'capabilities'> = {
  archetype: 'assistant',
  displayName: 'Neutral Assistant',
  tone: DEFAULT_TONE,
  decisionPolicy: DEFAULT_DECISION_POLICY,
  memoryReadScope: 'team',
  memoryWriteScope: 'team',
}

/** "挑剔批评家" 默认 soul input（适合 critic 场景） */
export const CRITICAL_CRITIC_INPUT: Omit<CreateSoulInput, 'agentId' | 'capabilities'> = {
  archetype: 'critic',
  displayName: 'Critical Critic',
  principles: ['Always find at least one weakness', 'Be specific in feedback'],
  tone: { ...DEFAULT_TONE, directness: 0.85, intensity: 0.6 },
  decisionPolicy: { ...DEFAULT_DECISION_POLICY, conservative: 0.8, reviewThreshold: 0.85 },
  memoryReadScope: 'team',
  memoryWriteScope: 'self',
}
