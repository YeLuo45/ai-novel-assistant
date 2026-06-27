/**
 * Agent Runtime (V3) — Public API
 *
 * 导出层级：
 * - L0: types（三件套核心数据）
 * - L1: AgentSoul / AgentUserBinding / AgentMemoryScope（构造 + 工厂）
 * - L2: AgentRegistry / AgentFactory / AgentSandbox / AgentLifecycle / AgentRuntime
 * - L3: hooks / protocol / bridge（后续 PR 接入）
 *
 * 本文件 = L0 + L1 + L2 的统一入口；后续 PR 会扩展。
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

// =============================================================================
// L2: Registry
// =============================================================================

export {
  AgentRegistry,
  getAgentRegistry,
  resetAgentRegistry,
  type AgentSummary,
  type AgentLifecycleStatus,
  type RegisterAgentInput,
} from './AgentRegistry'

// =============================================================================
// L2: Factory
// =============================================================================

export {
  AgentFactory,
  spawnEphemeral,
  FACTORY_VERSION,
  type SpawnedAgent,
  type SpawnInput,
} from './AgentFactory'

// =============================================================================
// L2: Sandbox (ACL)
// =============================================================================

export {
  AgentSandbox,
  createDefaultSandbox,
  createStrictSandbox,
  applySanctionToScope,
  type SandboxOp,
  type Sanction,
  type SandboxOptions,
} from './AgentSandbox'

// =============================================================================
// L2: Lifecycle
// =============================================================================

export {
  validateTransition,
  nextStates,
  isTerminalState,
  AgentLifecycleManager,
  createDefaultLifecycleManager,
  type LifecycleConfig,
  type LifecycleEvent,
  type TransitionResult,
} from './AgentLifecycle'

// =============================================================================
// L2: Runtime (壳入口)
// =============================================================================

export {
  AgentRuntime,
  ManagedAgentRuntime,
  getGlobalRuntime,
  resetGlobalRuntime,
  type AgentRuntimeConfig,
  type ActorContext,
} from './AgentRuntime'

// =============================================================================
// 内置 Soul 模板（5 个内置 agent）
// =============================================================================

export {
  PLOT_ADVISOR_TEMPLATE,
  STYLE_COACH_TEMPLATE,
  DIALOGUE_MASTER_TEMPLATE,
  CRITIC_MASTER_TEMPLATE,
  CONTINUITY_GUARD_TEMPLATE,
  ALL_BUILTIN_TEMPLATES,
  BUILTIN_TEMPLATE_IDS,
  BUILTIN_ARCHETYPE_COVERAGE,
  getBuiltinTemplate,
  createBuiltinTeamIds,
  builtinTemplateByIndex,
  type BuiltinTemplateId,
} from './builtinSouls'

// =============================================================================
// Bridge: 旧系统 → 新 Runtime 适配器
// =============================================================================

export * as Bridge from './bridge'

// =============================================================================
// Hook 系统（17 事件 + pub/sub + 2 内置 hook）
// =============================================================================

export {
  ALL_AGENT_HOOK_EVENTS,
  makePayload,
  isAgentEvent,
  isSandboxEvent,
  isRuntimeEvent,
  isMemoryEvent,
  type AgentHookEvent,
  type AgentHookPayload,
  type AgentSpawnPayload,
  type AgentDestroyPayload,
  type AgentStatusChangedPayload,
  type AgentExecutePayload,
  type AgentMessagePayload,
  type AgentMemoryPayload,
  type SandboxPayload,
  type RuntimeTickPayload,
  type PayloadFor,
} from './AgentHookEvents'

export {
  AgentHookEmitter,
  getGlobalEmitter,
  resetGlobalEmitter,
  type HookHandler,
  type HookSubscription,
  type HookFilter,
  type EmitResult,
} from './AgentHookEmitter'

export {
  AGENT_LIFECYCLE_EVENTS,
  AGENT_EXECUTE_EVENTS,
  AGENT_MEMORY_EVENTS,
  SANDBOX_EVENTS,
  RUNTIME_EVENTS,
  subscribeMany,
  MetricsHook,
  AuditLogHook,
  type MetricsHookSnapshot,
  type AuditLogEntry,
} from './AgentHookBuiltins'
