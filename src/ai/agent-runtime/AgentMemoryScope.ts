/**
 * AgentMemoryScope.ts (V2329)
 *
 * Memory scope + ACL：每个 agent 的 memory 隔离边界。
 *
 * 三层 scope：
 * - self：只能读写自己的私有表
 * - team：可读 team KB，但只能写自己的
 * - public：可读公开项目 KB
 * - all：self + team + public（只读）
 *
 * 关键设计：
 * - 私有表名 = `agent_${agentId}_${level}` 前缀，避免冲突
 * - 共享表名 = 固定字符串（teamKB / projectKB）
 * - 每次访问都写 accessLog（审计）
 * - 留存策略：episodicTTL 自动过期；workingMaxItems 上限
 */

import type {
  AgentMemoryScopeConfig,
  AgentMemoryAccess,
  MemoryLevel,
  MemoryScope,
  AgentUserBinding,
} from './types'

// =============================================================================
// 1. 工厂
// =============================================================================

export interface CreateMemoryScopeInput {
  agentId: string
  episodicTTL?: number  // 毫秒；默认 24h
  workingMaxItems?: number // 默认 50
}

/** 创建 memory scope config */
export function createMemoryScope(input: CreateMemoryScopeInput): AgentMemoryScopeConfig {
  const agentId = input.agentId
  return {
    agentId,
    privateTables: {
      sensory: `agent_${agentId}_L0_sensory`,
      working: `agent_${agentId}_L1_working`,
      episodic: `agent_${agentId}_L2_episodic`,
    },
    sharedTables: {
      teamKB: 'team_knowledge_base',
      projectKB: 'project_knowledge_base',
    },
    retention: {
      episodicTTL: input.episodicTTL ?? 24 * 60 * 60 * 1000,
      workingMaxItems: input.workingMaxItems ?? 50,
    },
    accessLog: [],
  }
}

// =============================================================================
// 2. ACL 检查（agent 能不能读/写另一个 agent 的 memory）
// =============================================================================

export interface AclCheckResult {
  allowed: boolean
  reason: string
}

/** 检查 agent A 是否能读 agent B 的 memory level */
export function canRead(
  readerScope: MemoryScope,
  _readerAgentId: string,
  _targetAgentId: string,
  level: MemoryLevel,
  sameAgent: boolean,
): AclCheckResult {
  if (sameAgent) {
    return { allowed: true, reason: 'same agent: always allowed' }
  }
  if (readerScope === 'self') {
    return { allowed: false, reason: 'reader scope is self; cross-agent denied' }
  }
  // team/public/all 都可以读 teamKB / projectKB (L3/L4)
  if (level === 'L3' || level === 'L4') {
    return { allowed: true, reason: `reader scope ${readerScope} allows L${level.slice(1)}` }
  }
  if (readerScope === 'all' && (level === 'L0' || level === 'L1' || level === 'L2')) {
    return { allowed: true, reason: 'reader scope all allows private levels' }
  }
  return {
    allowed: false,
    reason: `reader scope ${readerScope} cannot read private ${level} of other agent`,
  }
}

/** 检查 agent 能否写入某个 level */
export function canWrite(
  writerScope: MemoryScope,
  _writerAgentId: string,
  _targetAgentId: string,
  level: MemoryLevel,
  sameAgent: boolean,
): AclCheckResult {
  if (sameAgent) {
    return { allowed: true, reason: 'same agent: always allowed' }
  }
  if (writerScope === 'self') {
    return { allowed: false, reason: 'writer scope is self; cross-agent write denied' }
  }
  // 'team' 写：可写 teamKB (L3)
  if (writerScope === 'team' && level === 'L3') {
    return { allowed: true, reason: 'team scope can write teamKB (L3)' }
  }
  // 'public' 写：可写 projectKB (L4)
  if (writerScope === 'public' && level === 'L4') {
    return { allowed: true, reason: 'public scope can write projectKB (L4)' }
  }
  return {
    allowed: false,
    reason: `writer scope ${writerScope} cannot write ${level} of other agent`,
  }
}

// =============================================================================
// 3. 访问日志（append-only）
// =============================================================================

/** 记录一次 memory 访问，返回新 config（不可变） */
export function recordAccess(
  config: AgentMemoryScopeConfig,
  access: Omit<AgentMemoryAccess, 'timestamp'>,
): AgentMemoryScopeConfig {
  const entry: AgentMemoryAccess = { ...access, timestamp: Date.now() }
  return {
    ...config,
    accessLog: [...config.accessLog, entry],
  }
}

/** 查询 agent 的访问日志（按时间倒序） */
export function getAccessLog(
  config: AgentMemoryScopeConfig,
  filter?: { sourceAgentId?: string; level?: MemoryLevel; operation?: AgentMemoryAccess['operation'] },
): AgentMemoryAccess[] {
  let log = [...config.accessLog]
  if (filter?.sourceAgentId) {
    log = log.filter(a => a.sourceAgentId === filter.sourceAgentId)
  }
  if (filter?.level) {
    log = log.filter(a => a.level === filter.level)
  }
  if (filter?.operation) {
    log = log.filter(a => a.operation === filter.operation)
  }
  return log.sort((a, b) => b.timestamp - a.timestamp)
}

/** 截断过长的 accessLog（保留最近 N 条） */
export function trimAccessLog(
  config: AgentMemoryScopeConfig,
  maxEntries: number = 1000,
): AgentMemoryScopeConfig {
  if (config.accessLog.length <= maxEntries) return config
  return {
    ...config,
    accessLog: config.accessLog.slice(-maxEntries),
  }
}

// =============================================================================
// 4. 留存策略
// =============================================================================

export interface RetentionCheck {
  agentId: string
  level: MemoryLevel
  expired: boolean
  remainingMs?: number
}

/** 检查一个 episodic memory item 是否过期（基于 createdAt） */
export function checkEpisodicExpiry(
  config: AgentMemoryScopeConfig,
  itemCreatedAt: number,
  now: number = Date.now(),
): RetentionCheck {
  const ttl = config.retention.episodicTTL
  const age = now - itemCreatedAt
  const expired = age > ttl
  return {
    agentId: config.agentId,
    level: 'L2',
    expired,
    remainingMs: expired ? 0 : ttl - age,
  }
}

/** 检查 working memory 是否超容（itemCount 为当前 working 内存数） */
export function checkWorkingCapacity(
  config: AgentMemoryScopeConfig,
  itemCount: number,
): { withinCapacity: boolean; overBy: number } {
  const max = config.retention.workingMaxItems
  return {
    withinCapacity: itemCount <= max,
    overBy: Math.max(0, itemCount - max),
  }
}

// =============================================================================
// 5. 派生与合并
// =============================================================================

/** 派生新 memory scope（保留 agentId，更新其他字段） */
export function deriveMemoryScope(
  parent: AgentMemoryScopeConfig,
  overrides: Partial<Omit<AgentMemoryScopeConfig, 'agentId' | 'accessLog' | 'privateTables'>>,
): AgentMemoryScopeConfig {
  return {
    ...parent,
    ...overrides,
    agentId: parent.agentId,
    privateTables: parent.privateTables, // 私有表名与 agentId 绑定，不可改
    accessLog: parent.accessLog, // access log 不可合并
  }
}

/** 把不同 agent 的 memory scope 投影成 user-binding 友好的格式（审计 UI 用） */
export function summarizeForUser(
  config: AgentMemoryScopeConfig,
  binding: AgentUserBinding,
): { visibleTables: string[]; hidden: true } {
  // 简化：只暴露该 binding 的 agent 自己相关的表
  const visibleTables = [
    config.privateTables.sensory,
    config.privateTables.working,
    config.privateTables.episodic,
  ]
  return { visibleTables, hidden: true }
}
