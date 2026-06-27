/**
 * protocol/index.ts (V2380) — Direction B 公共 API 汇总
 */

export * from './types'
export * from './AgentMessageBus'
export * from './RouterAndSerializer'
export * from './RequestReply'
export * from './NegotiationAndDelegation'
export * from './MemoryStore'
export * from './MemoryGuard'
export * from './MemoryReplayAndAuction'
export * from './UserContext'
export * from './UserPreferencesAndAdapter'
export * from './SoulMarketplace'
export * from './SoulVersioning'
export * from './SoulExportImport'
export * from './SoulStudio'
export * from './StudioState'
export * from './StudioAdvanced'
export * from './Observability'
export * from './ABTesting'
export * from './AdaptationAndHealth'

/** Direction B 版本号 */
export const DIRECTION_B_VERSION = '1.0.0'
