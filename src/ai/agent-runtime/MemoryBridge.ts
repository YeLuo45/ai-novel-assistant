/**
 * MemoryBridge.ts (V2344)
 *
 * 旧 memory 系统（src/ai/memory/* 13K+ 行 L0-L4）→ 新 AgentMemoryScopeConfig 的桥接层。
 *
 * 关键设计：
 * - 不直接迁移数据（避免破坏既有 Dexie schema）
 * - 提供映射表（旧 level → 新 private table）
 * - 提供 import/export 函数（用于持久化）
 * - 提供 namespace 函数（让旧 memory 知道自己的 agentId）
 *
 * 旧 → 新映射：
 *   L0 (瞬时) → privateTables.sensory
 *   L1 (工作) → privateTables.working
 *   L2 (会话) → privateTables.episodic
 *   L3 (项目) → sharedTables.projectKB（共享）
 *   L4 (长期) → sharedTables.teamKB（团队）
 */

import type { AgentMemoryScopeConfig, MemoryLevel } from './types'
import {
  createMemoryScope,
  recordAccess,
  type RetentionCheck,
} from './AgentMemoryScope'

// =============================================================================
// 1. 旧 level → 新 table 映射
// =============================================================================

/** 把旧 MemoryLevel 映射到新 private/shared table 名 */
export function mapLevelToTable(
  scope: AgentMemoryScopeConfig,
  level: MemoryLevel,
): { table: string; isPrivate: boolean } {
  switch (level) {
    case 'L0':
      return { table: scope.privateTables.sensory, isPrivate: true }
    case 'L1':
      return { table: scope.privateTables.working, isPrivate: true }
    case 'L2':
      return { table: scope.privateTables.episodic, isPrivate: true }
    case 'L3':
      return { table: scope.sharedTables.projectKB, isPrivate: false }
    case 'L4':
      return { table: scope.sharedTables.teamKB, isPrivate: false }
  }
}

// =============================================================================
// 2. 旧 MemoryItem 适配
// =============================================================================

/** 旧 MemoryItem 最小 duck type */
export interface LegacyMemoryItemLike {
  id: string
  level: MemoryLevel
  content: string
  tags?: string[]
  createdAt: number
  lastAccessed?: number
  accessCount?: number
  importance?: number
  metadata?: Record<string, unknown>
}

/** 旧 MemoryItem → 新 scope 的 log 记录（轻量桥接，不复制数据） */
export function logLegacyAccess(
  scope: AgentMemoryScopeConfig,
  item: LegacyMemoryItemLike,
  operation: 'read' | 'write' | 'delete' = 'read',
): AgentMemoryScopeConfig {
  return recordAccess(scope, {
    sourceAgentId: scope.agentId,
    targetAgentId: scope.agentId,
    level: item.level,
    operation,
    itemId: item.id,
  })
}

/** 旧 list 结果 → 排序 + 过滤后的新"视图" */
export interface MemoryViewItem {
  id: string
  level: MemoryLevel
  content: string
  tableName: string
  isPrivate: boolean
  createdAt: number
  importance: number
}

export function projectLegacyItems(
  scope: AgentMemoryScopeConfig,
  items: LegacyMemoryItemLike[],
  filter?: { level?: MemoryLevel; isPrivate?: boolean; minImportance?: number },
): MemoryViewItem[] {
  let filtered = [...items]
  if (filter?.level) {
    filtered = filtered.filter(i => i.level === filter.level)
  }
  if (filter?.isPrivate !== undefined) {
    filtered = filtered.filter(i => mapLevelToTable(scope, i.level).isPrivate === filter.isPrivate)
  }
  if (filter?.minImportance !== undefined) {
    filtered = filtered.filter(i => (i.importance ?? 0) >= filter.minImportance!)
  }
  return filtered.map(i => {
    const m = mapLevelToTable(scope, i.level)
    return {
      id: i.id,
      level: i.level,
      content: i.content,
      tableName: m.table,
      isPrivate: m.isPrivate,
      createdAt: i.createdAt,
      importance: i.importance ?? 0,
    }
  })
}

// =============================================================================
// 3. 命名空间（旧 module 知道自己的 agentId）
// =============================================================================

/** 用 scope 命名旧的全局 memory 调用 */
export function namespaceKey(
  scope: AgentMemoryScopeConfig,
  key: string,
): string {
  return `agent:${scope.agentId}:${key}`
}

// =============================================================================
// 4. 迁移（新旧之间）
// =============================================================================

export interface MigrationPlan {
  sourceAgentId: string
  targetScope: AgentMemoryScopeConfig
  itemCount: number
  tablesMapped: number
}

/** 创建迁移计划（旧 memory 跨 agent 迁移到新 scope） */
export function planMigration(
  sourceAgentId: string,
  items: LegacyMemoryItemLike[],
  options?: { episodicTTL?: number; workingMaxItems?: number },
): MigrationPlan {
  const newScope = createMemoryScope({
    agentId: sourceAgentId,
    episodicTTL: options?.episodicTTL,
    workingMaxItems: options?.workingMaxItems,
  })
  // 计算涉及的 table 数（去重）
  const tables = new Set(items.map(i => mapLevelToTable(newScope, i.level).table))
  return {
    sourceAgentId,
    targetScope: newScope,
    itemCount: items.length,
    tablesMapped: tables.size,
  }
}

/** 应用迁移（执行 plan，把 items 全部 import 为 log entries） */
export function applyMigration(
  plan: MigrationPlan,
  items: LegacyMemoryItemLike[],
): AgentMemoryScopeConfig {
  let scope = plan.targetScope
  for (const item of items) {
    scope = logLegacyAccess(scope, item, 'write')
  }
  return scope
}

// =============================================================================
// 5. 导出（snapshot）
// =============================================================================

export interface MemoryScopeSnapshot {
  agentId: string
  privateTables: AgentMemoryScopeConfig['privateTables']
  sharedTables: AgentMemoryScopeConfig['sharedTables']
  retention: AgentMemoryScopeConfig['retention']
  accessLogCount: number
  createdAt: number
}

export function snapshotMemoryScope(scope: AgentMemoryScopeConfig): MemoryScopeSnapshot {
  return {
    agentId: scope.agentId,
    privateTables: { ...scope.privateTables },
    sharedTables: { ...scope.sharedTables },
    retention: { ...scope.retention },
    accessLogCount: scope.accessLog.length,
    createdAt: Date.now(),
  }
}

// =============================================================================
// 6. 工具
// =============================================================================

/** 旧 memory 是否属于该 agent（用于 namespace 检查） */
export function belongsToAgent(
  scope: AgentMemoryScopeConfig,
  key: string,
): boolean {
  return key.startsWith(`agent:${scope.agentId}:`)
}

/** 把旧 item 列表的 retention stats */
export function getRetentionStats(
  scope: AgentMemoryScopeConfig,
  items: LegacyMemoryItemLike[],
  now: number = Date.now(),
): { total: number; expired: number; byLevel: Record<MemoryLevel, number> } {
  const byLevel: Record<MemoryLevel, number> = { L0: 0, L1: 0, L2: 0, L3: 0, L4: 0 }
  let expired = 0
  for (const item of items) {
    byLevel[item.level] += 1
    if (item.level === 'L2') {
      // episodic 检查 TTL
      const check: RetentionCheck = {
        agentId: scope.agentId,
        level: 'L2',
        expired: (now - item.createdAt) > scope.retention.episodicTTL,
      }
      if (check.expired) expired += 1
    }
  }
  return { total: items.length, expired, byLevel }
}
