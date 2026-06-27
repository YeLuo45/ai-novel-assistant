/**
 * Agent Runtime - Core Types (V2326)
 *
 * 一阶数据模型：soul × user × memory 三件套的类型定义。
 *
 * 设计原则：
 * - soul 私有（每个 agent 自己的决策偏好 + 性格）
 * - user 部分私有（每个 agent 看到 user 的不同切片）
 * - memory 分层隔离（self/team/public 三个 scope）
 *
 * 与 WriterPersonaEngine 正交：
 * - WriterPersonaEngine = "作者想让 AI 学什么声音"
 * - AgentSoul = "AI 自己的性格、决策偏好、记忆策略"
 *
 * 灵感来源：
 * - hermes-agent-collab Direction A (AsyncMessageBus) — 事件驱动
 * - hermes-agent-collab Direction D (Plugin/Hook) — hook 维度预留
 * - hermes-agent-collab Direction E (MultiAgentProtocol) — agent 协议字段
 * - ruflo personality mapping — persona 池
 * - chatdev role specialization — 6 个 archetype 模板
 */

// =============================================================================
// 1. Archetype & Capability
// =============================================================================

/** 6 种 agent 原型（chatdev 风格的 role 模板） */
export type AgentArchetype =
  | 'instructor'   // 指导型：教用户/其他 agent 怎么做
  | 'assistant'    // 助手型：直接做事
  | 'critic'       // 批评型：挑刺
  | 'reviewer'     // 评审型：综合打分
  | 'executor'     // 执行型：纯跑任务
  | 'specialist'   // 专家型：单领域深耕

/** 能力标签（capability matching 用） */
export type CapabilityTag =
  | 'plot' | 'dialogue' | 'style' | 'pacing' | 'character' | 'world'
  | 'continuity' | 'critique' | 'grammar' | 'pov' | 'hook' | 'voice'
  | 'thematic' | 'symbol' | 'tension' | 'rhythm' | 'genre' | 'reader'

/** 全部能力标签的常量数组（用于校验/全量枚举） */
export const ALL_CAPABILITY_TAGS: readonly CapabilityTag[] = [
  'plot', 'dialogue', 'style', 'pacing', 'character', 'world',
  'continuity', 'critique', 'grammar', 'pov', 'hook', 'voice',
  'thematic', 'symbol', 'tension', 'rhythm', 'genre', 'reader',
] as const

/** 全部原型的常量数组 */
export const ALL_ARCHETYPES: readonly AgentArchetype[] = [
  'instructor', 'assistant', 'critic', 'reviewer', 'executor', 'specialist',
] as const

// =============================================================================
// 2. Tonal & Decision Policy
// =============================================================================

/** 语气签名（agent 自己的语气；与作者 voice 正交） */
export interface TonalSignature {
  formality: number      // 0-1 (casual ↔ formal)
  warmth: number         // 0-1 (cold ↔ warm)
  intensity: number      // 0-1 (restrained ↔ intense)
  humor: number          // 0-1 (serious ↔ playful)
  directness: number     // 0-1 (indirect ↔ blunt)
}

/** 决策偏好（agent 怎么思考） */
export interface DecisionPolicy {
  conservative: number      // 0-1 (高 = 偏保守，少改)
  creative: number          // 0-1 (高 = 偏创意，多尝试)
  reviewThreshold: number   // 0-1 (高 = 更挑剔，需要更多 review)
  riskTolerance: number     // 0-1 (高 = 更敢冒险)
}

// =============================================================================
// 3. Persona
// =============================================================================

/** AgentPersona = 性格 + 语气 + 决策偏好 */
export interface AgentPersona {
  displayName: string         // 给人看的名字
  tagline: string             // 一句话简介
  principles: string[]        // 行为原则（system prompt 雏形）
  tone: TonalSignature        // 语气
  decisionPolicy: DecisionPolicy // 决策偏好
}

// =============================================================================
// 4. Memory Scope
// =============================================================================

/** memory 可见性级别（agent 隔离的 4 层） */
export type MemoryScope = 'self' | 'team' | 'public' | 'all'

/** memory 层（与既有 L0-L4 对齐；agent runtime 在此之上加 agent 维度） */
export type MemoryLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4'

/** 单次 memory 访问的审计记录 */
export interface AgentMemoryAccess {
  timestamp: number
  sourceAgentId: string
  targetAgentId: string
  level: MemoryLevel
  operation: 'read' | 'write' | 'delete' | 'lease'
  itemId?: string
}

/** Agent 的 memory scope（私有 + 共享 + 留存策略 + 审计） */
export interface AgentMemoryScopeConfig {
  agentId: string
  privateTables: {
    sensory: string   // 私有 L0 表名（含 agentId 前缀）
    working: string   // 私有 L1 表名
    episodic: string  // 私有 L2 表名
  }
  sharedTables: {
    teamKB: string    // 共享团队知识库
    projectKB: string // 共享项目知识库
  }
  retention: {
    episodicTTL: number    // 毫秒；episodic 自动过期时间
    workingMaxItems: number // working memory 最多保留条目
  }
  accessLog: AgentMemoryAccess[] // 累计访问日志
}

// =============================================================================
// 5. Soul (一阶公民)
// =============================================================================

/**
 * AgentSoul = 不可变身份描述
 * agent 一旦 spawn，soul 就锁死；需要变更必须派生新 agent。
 */
export interface AgentSoul {
  agentId: string
  archetype: AgentArchetype
  persona: AgentPersona
  capabilities: CapabilityTag[]
  toolWhitelist?: string[]  // 可选：白名单；不填 = 全部
  memoryReadScope: MemoryScope
  memoryWriteScope: MemoryScope
  createdAt: number
  updatedAt: number
  version: number
  metadata: Record<string, unknown>
  /**
   * 内部跳冻结升级（bumpVersion 用）。
   * 用 Symbol 避免污染 public API，但允许内部反射调用。
   */
  readonly [SOUL_BUMP_SYM]: (nextVersion: number) => AgentSoul
}

/** Symbol 用于 soul 内部跳冻结升级 */
export const SOUL_BUMP_SYM = Symbol.for('agent-runtime.soul.bump')

// =============================================================================
// 6. User Binding（差异化 user 视图）
// =============================================================================

/**
 * 每个 agent 看到 user 的不同"切片"。
 * 例：plot agent 看到 plotOutline，style agent 看到 voiceProfile。
 */
export interface AgentUserBinding {
  agentId: string
  visibleUserFields: string[]   // 该 agent 可见的 user 字段名
  userAlias: string              // 内部代号（隐私脱敏）
  customInstructions: string     // agent 专属的 user 偏好
  baseContext: Record<string, unknown> // 该 agent 的 base context（投影后的）
}

// =============================================================================
// 7. Soul Template（soul 模板，用于 factory 派生）
// =============================================================================

/** 不可变的 soul 模板（DSL） */
export interface SoulTemplate {
  templateId: string
  displayName: string
  archetype: AgentArchetype
  basePersona: AgentPersona
  baseCapabilities: CapabilityTag[]
  defaultMemoryScopes: {
    read: MemoryScope
    write: MemoryScope
  }
  description: string
  suggestedToolWhitelist?: string[]
}

// =============================================================================
// 8. Validation & Defaults
// =============================================================================

/** 校验结果 */
export interface ValidationResult {
  valid: boolean
  errors: Array<{ field: string; reason: string; severity: 'error' | 'warning' }>
}

/** 全 0.5 中性默认 */
export const DEFAULT_TONE: TonalSignature = {
  formality: 0.5,
  warmth: 0.5,
  intensity: 0.5,
  humor: 0.5,
  directness: 0.5,
}

/** 偏保守默认（适合 critic/reviewer） */
export const DEFAULT_DECISION_POLICY: DecisionPolicy = {
  conservative: 0.5,
  creative: 0.5,
  reviewThreshold: 0.5,
  riskTolerance: 0.3,
}

/** 数值钳制工具（避免 0-1 越界） */
export function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

/** 单一字段归一化：undefined 或 NaN → 默认 */
function n(v: number | undefined, def: number): number {
  if (v === undefined || Number.isNaN(v)) return def
  return clamp01(v)
}

/** 校验并归一化 TonalSignature */
export function normalizeTone(t: Partial<TonalSignature>): TonalSignature {
  return {
    formality: n(t.formality, 0.5),
    warmth: n(t.warmth, 0.5),
    intensity: n(t.intensity, 0.5),
    humor: n(t.humor, 0.5),
    directness: n(t.directness, 0.5),
  }
}

/** 校验并归一化 DecisionPolicy */
export function normalizeDecisionPolicy(p: Partial<DecisionPolicy>): DecisionPolicy {
  return {
    conservative: n(p.conservative, 0.5),
    creative: n(p.creative, 0.5),
    reviewThreshold: n(p.reviewThreshold, 0.5),
    riskTolerance: n(p.riskTolerance, 0.3),
  }
}

/** 校验 soul 的合法性（轻量） */
export function validateSoul(soul: Partial<AgentSoul>): ValidationResult {
  const errors: ValidationResult['errors'] = []
  if (!soul.agentId || typeof soul.agentId !== 'string') {
    errors.push({ field: 'agentId', reason: 'must be non-empty string', severity: 'error' })
  }
  if (!soul.archetype || !ALL_ARCHETYPES.includes(soul.archetype)) {
    errors.push({
      field: 'archetype',
      reason: `must be one of ${ALL_ARCHETYPES.join('/')}`,
      severity: 'error',
    })
  }
  if (!Array.isArray(soul.capabilities) || soul.capabilities.length === 0) {
    errors.push({ field: 'capabilities', reason: 'must be non-empty array', severity: 'error' })
  } else {
    const invalid = soul.capabilities.filter(c => !ALL_CAPABILITY_TAGS.includes(c))
    if (invalid.length > 0) {
      errors.push({
        field: 'capabilities',
        reason: `unknown capabilities: ${invalid.join(',')}`,
        severity: 'error',
      })
    }
  }
  if (soul.memoryReadScope && !['self', 'team', 'public', 'all'].includes(soul.memoryReadScope)) {
    errors.push({ field: 'memoryReadScope', reason: 'invalid scope', severity: 'error' })
  }
  if (soul.memoryWriteScope && !['self', 'team', 'public'].includes(soul.memoryWriteScope)) {
    errors.push({ field: 'memoryWriteScope', reason: 'invalid scope', severity: 'error' })
  }
  if (soul.version !== undefined && (soul.version < 1 || !Number.isInteger(soul.version))) {
    errors.push({ field: 'version', reason: 'must be positive integer', severity: 'error' })
  }
  return { valid: errors.length === 0, errors }
}

/** 版本号常量（V3 Agent Runtime 主版本） */
export const AGENT_RUNTIME_VERSION = '3.0.0'
