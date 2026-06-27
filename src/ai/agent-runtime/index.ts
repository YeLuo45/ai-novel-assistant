/**
 * Agent Runtime (V3) — Public API
 *
 * 导出层级：
 * - L0: types（三件套核心数据）
 * - L1: AgentSoul / AgentUserBinding / AgentMemoryScope（构造 + 工厂）
 * - L2: hooks / protocol / bridge（后续 PR 接入）
 * - L3: AgentRuntime / AgentRegistry / AgentFactory / AgentSandbox / AgentLifecycle（后续 PR 接入）
 *
 * 本文件 = L0 + L1 的统一入口；后续 PR 会扩展。
 */

// =============================================================================
// L0: 核心类型
// =============================================================================

export {
  // 常量
  AGENT_RUNTIME_VERSION,
  ALL_ARCHETYPES,
  ALL_CAPABILITY_TAGS,
  DEFAULT_TONE,
  DEFAULT_DECISION_POLICY,
  SOUL_BUMP_SYM,
  // 工具
  clamp01,
  normalizeTone,
  normalizeDecisionPolicy,
  validateSoul,
  // 类型
  type AgentArchetype,
  type CapabilityTag,
  type TonalSignature,
  type DecisionPolicy,
  type AgentPersona,
  type MemoryScope,
  type MemoryLevel,
  type AgentMemoryAccess,
  type AgentMemoryScopeConfig,
  type AgentSoul,
  type AgentUserBinding,
  type SoulTemplate,
  type ValidationResult,
} from './types'

// =============================================================================
// L1: Soul 工厂
// =============================================================================

export {
  createSoul,
  cloneSoul,
  deriveSoul,
  mergeSouls,
  fromTemplate,
  diffSouls,
  checkSoul,
  bumpVersion,
  NEUTRAL_ASSISTANT_INPUT,
  CRITICAL_CRITIC_INPUT,
  type CreateSoulInput,
  type SoulDiff,
} from './AgentSoul'

// =============================================================================
// L1: User Binding
// =============================================================================

export {
  createUserBinding,
  projectUserContext,
  aliasUser,
  buildSystemPromptFragment,
  validateBinding,
  deriveBinding,
  type CreateUserBindingInput,
  type UserContextSlice,
  type BindingValidationResult,
} from './AgentUserBinding'

// =============================================================================
// L1: Memory Scope
// =============================================================================

export {
  createMemoryScope,
  canRead,
  canWrite,
  recordAccess,
  getAccessLog,
  trimAccessLog,
  checkEpisodicExpiry,
  checkWorkingCapacity,
  deriveMemoryScope,
  summarizeForUser,
  type CreateMemoryScopeInput,
  type AclCheckResult,
  type RetentionCheck,
} from './AgentMemoryScope'
