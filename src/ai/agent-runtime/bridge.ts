/**
 * bridge/index.ts (V2345)
 *
 * 旧系统 → 新 Agent Runtime 的桥接层汇总导出。
 *
 * 包含：
 * - BaseAgentAdapter: 旧 BaseAgent（V39）→ runtime
 * - NanobotAdapter: 旧 nanobot class（270+）→ runtime
 * - PersonaBridge: 旧 WriterPersonaEngine（V87）→ soul.tone
 * - MemoryBridge: 旧 memory 系统（13K 行 L0-L4）→ AgentMemoryScopeConfig
 *
 * 关键设计：所有 adapter 都不修改旧模块（向后兼容）。
 */

export {
  BaseAgentAdapter,
  isLegacyBaseAgent,
  adaptLegacyBaseAgent,
  type LegacyBaseAgentLike,
  type BaseAgentAdapterOptions,
  type BaseAgentRunResult,
} from './BaseAgentAdapter'

export {
  NanobotAdapter,
  isNanobotClass,
  listNanobotMethods,
  adaptNanobot,
  type NanobotClassLike,
  type NanobotMethodName,
  type NanobotAdapterOptions,
  type NanobotCallResult,
} from './NanobotAdapter'

export {
  mapVoiceAndToneToSoulTone,
  mapVoiceToDecisionPolicy,
  mapStructureToMetadata,
  fromWriterPersona,
  applyWriterPersonaToSoul,
  deriveSoulFromPersona,
  isWriterPersona,
  type VoiceMetricsLike,
  type TonalSignatureLike,
  type StructuralPreferencesLike,
  type WriterPersonaLike,
} from './PersonaBridge'

export {
  mapLevelToTable,
  logLegacyAccess,
  projectLegacyItems,
  namespaceKey,
  planMigration,
  applyMigration,
  snapshotMemoryScope,
  belongsToAgent,
  getRetentionStats,
  type LegacyMemoryItemLike,
  type MemoryViewItem,
  type MigrationPlan,
  type MemoryScopeSnapshot,
} from './MemoryBridge'

/** Bridge 模块版本号 */
export const BRIDGE_MODULE_VERSION = '1.0.0'
