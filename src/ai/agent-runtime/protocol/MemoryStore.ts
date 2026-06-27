/**
 * protocol/MemoryStore.ts (V2386-V2390) - 5 engines
 *
 * - V2386 AgentMemoryStore: 每个 agent 独立 Dexie 表前缀
 * - V2387 MemoryLayer: L0/L1/L2 层级抽象
 * - V2388 MemoryEntry: 统一的 memory item
 * - V2389 MemoryIndexer: 按 tag/category 索引
 * - V2390 MemoryCompactor: 压缩重复/过期 entries
 */

import type { MemoryLevel, AgentMemoryScopeConfig } from '../types'

// =============================================================================
// V2388: MemoryEntry
// =============================================================================

export interface MemoryEntry {
  id: string
  agentId: string
  level: MemoryLevel
  content: string
  tags: string[]
  category?: string
  createdAt: number
  lastAccessed: number
  accessCount: number
  importance: number  // 0-100
  metadata: Record<string, unknown>
}

// =============================================================================
// V2387: MemoryLayer 抽象
// =============================================================================

export type MemoryLayer = 'sensory' | 'working' | 'episodic' | 'semantic' | 'team' | 'project'

/** Layer → 私有/共享 + Level 映射 */
export function layerToScope(layer: MemoryLayer): {
  isPrivate: boolean
  level: MemoryLevel
  tableKey: 'privateTables' | 'sharedTables'
} {
  switch (layer) {
    case 'sensory': return { isPrivate: true, level: 'L0', tableKey: 'privateTables' }
    case 'working': return { isPrivate: true, level: 'L1', tableKey: 'privateTables' }
    case 'episodic': return { isPrivate: true, level: 'L2', tableKey: 'privateTables' }
    case 'semantic': return { isPrivate: true, level: 'L2', tableKey: 'privateTables' } // 私有的长期
    case 'team': return { isPrivate: false, level: 'L4', tableKey: 'sharedTables' }
    case 'project': return { isPrivate: false, level: 'L3', tableKey: 'sharedTables' }
  }
}

// =============================================================================
// V2386: AgentMemoryStore
// =============================================================================

/** 内存版 memory store（无 Dexie 依赖，纯 in-memory；用于 agent-runtime 模块解耦） */
export class AgentMemoryStore {
  private _entries: Map<string, MemoryEntry> = new Map()
  private _byLayer: Map<MemoryLayer, Set<string>> = new Map()
  private _byTag: Map<string, Set<string>> = new Map()
  private _byAgent: Map<string, Set<string>> = new Map()

  /** 添加 entry（自动索引） */
  add(entry: MemoryEntry): void {
    this._entries.set(entry.id, entry)
    if (!this._byLayer.has(this._getLayer(entry))) this._byLayer.set(this._getLayer(entry), new Set())
    this._byLayer.get(this._getLayer(entry))!.add(entry.id)
    if (!this._byAgent.has(entry.agentId)) this._byAgent.set(entry.agentId, new Set())
    this._byAgent.get(entry.agentId)!.add(entry.id)
    for (const t of entry.tags) {
      if (!this._byTag.has(t)) this._byTag.set(t, new Set())
      this._byTag.get(t)!.add(entry.id)
    }
  }

  get(id: string): MemoryEntry | undefined {
    const e = this._entries.get(id)
    if (e) {
      e.lastAccessed = Date.now()
      e.accessCount += 1
    }
    return e
  }

  delete(id: string): boolean {
    const e = this._entries.get(id)
    if (!e) return false
    this._entries.delete(id)
    this._byLayer.get(this._getLayer(e))?.delete(id)
    this._byAgent.get(e.agentId)?.delete(id)
    for (const t of e.tags) {
      this._byTag.get(t)?.delete(id)
    }
    return true
  }

  count(): number {
    return this._entries.size
  }

  /** 全部 entries */
  all(): MemoryEntry[] {
    return Array.from(this._entries.values())
  }

  /** 按 agent 查 */
  byAgent(agentId: string): MemoryEntry[] {
    const ids = this._byAgent.get(agentId) ?? new Set()
    return Array.from(ids).map(id => this._entries.get(id)!).filter(Boolean)
  }

  /** 按 layer 查 */
  byLayer(layer: MemoryLayer): MemoryEntry[] {
    const ids = this._byLayer.get(layer) ?? new Set()
    return Array.from(ids).map(id => this._entries.get(id)!).filter(Boolean)
  }

  /** 按 tag 查 */
  byTag(tag: string): MemoryEntry[] {
    const ids = this._byTag.get(tag) ?? new Set()
    return Array.from(ids).map(id => this._entries.get(id)!).filter(Boolean)
  }

  /** 从 scope config 推断默认表名 */
  static tableForScope(scope: AgentMemoryScopeConfig, layer: MemoryLayer): string {
    const m = layerToScope(layer)
    return scope[m.tableKey][m.isPrivate ? 'sensory' : 'teamKB'] // 注意：实际由 layerToScope 决定
  }

  private _getLayer(entry: MemoryEntry): MemoryLayer {
    // 推断 layer：基于 level + 字段
    if (entry.level === 'L0') return 'sensory'
    if (entry.level === 'L1') return 'working'
    if (entry.level === 'L2') {
      return entry.category === 'semantic' ? 'semantic' : 'episodic'
    }
    if (entry.level === 'L3') return 'project'
    if (entry.level === 'L4') return 'team'
    return 'working'
  }
}

// =============================================================================
// V2389: MemoryIndexer（高级查询）
// =============================================================================

export interface MemoryQuery {
  agentId?: string
  layer?: MemoryLayer
  tags?: string[]
  category?: string
  minImportance?: number
  fromTime?: number
  toTime?: number
  limit?: number
}

export class MemoryIndexer {
  constructor(private _store: AgentMemoryStore) {}

  query(q: MemoryQuery): MemoryEntry[] {
    let results = this._store.all()
    if (q.agentId) results = results.filter(e => e.agentId === q.agentId)
    if (q.layer) {
      const ids = new Set(this._store.byLayer(q.layer).map(e => e.id))
      results = results.filter(e => ids.has(e.id))
    }
    if (q.tags && q.tags.length > 0) {
      results = results.filter(e => q.tags!.every(t => e.tags.includes(t)))
    }
    if (q.category) results = results.filter(e => e.category === q.category)
    if (q.minImportance !== undefined) results = results.filter(e => e.importance >= q.minImportance!)
    if (q.fromTime) results = results.filter(e => e.createdAt >= q.fromTime!)
    if (q.toTime) results = results.filter(e => e.createdAt <= q.toTime!)
    // 按 importance desc 排序
    results.sort((a, b) => b.importance - a.importance)
    if (q.limit) results = results.slice(0, q.limit)
    return results
  }

  /** 统计：按 layer 分组 */
  countByLayer(): Map<MemoryLayer, number> {
    const m = new Map<MemoryLayer, number>()
    for (const e of this._store.all()) {
      const layer: MemoryLayer = e.level === 'L0' ? 'sensory' : e.level === 'L1' ? 'working' : e.level === 'L2' ? 'episodic' : e.level === 'L3' ? 'project' : 'team'
      m.set(layer, (m.get(layer) ?? 0) + 1)
    }
    return m
  }
}

// =============================================================================
// V2390: MemoryCompactor（压缩重复/过期）
// =============================================================================

export interface CompactionResult {
  removed: number
  merged: number
  compactedAt: number
}

export function compactMemory(
  store: AgentMemoryStore,
  options: { mergeByTag?: string; minImportance?: number; olderThanMs?: number } = {},
): CompactionResult {
  const before = store.count()
  // 简化：删除 importance 太低 OR 过期的 entries
  const toRemove: string[] = []
  const now = Date.now()
  for (const e of store.all()) {
    if ((options.minImportance !== undefined && e.importance < options.minImportance) ||
        (options.olderThanMs !== undefined && (now - e.createdAt) > options.olderThanMs)) {
      toRemove.push(e.id)
    }
  }
  for (const id of toRemove) store.delete(id)
  return {
    removed: toRemove.length,
    merged: 0,
    compactedAt: now,
  }
}
