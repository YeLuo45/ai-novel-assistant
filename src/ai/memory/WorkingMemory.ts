/**
 * V49 L1 WorkingMemory - 增强版工作记忆
 * 
 * 工作记忆是五层记忆系统的第二层，负责当前会话的上下文管理
 * 增强特性：
 * - attentionSlots: 注意力槽位管理（默认3个）
 * - consolidateToEpisodic: 整合记忆到情景记忆(L2)
 * - retrieveFromEpisodic: 从情景记忆检索
 */

import Dexie from 'dexie'

// 工作记忆条目
export interface WorkingEntry {
  id?: number
  sessionId: string
  projectId?: number
  key: string           // 记忆键名
  value: string         // 记忆值
  ttl: number          // 生存时间(ms)
  createdAt: number
  lastAccess: number
  accessCount: number
  weight: number        // 重要性权重 (0-1)
  level: 'L0' | 'L1'   // 记忆层级
}

// 工作记忆配置
export interface WorkingMemoryConfig {
  maxSlots: number             // 最大注意力槽位
  defaultTtlMs: number         // 默认TTL
  consolidationThreshold: number // 整合阈值
}

const DEFAULT_CONFIG: WorkingMemoryConfig = {
  maxSlots: 3,
  defaultTtlMs: 3600000,      // 1小时
  consolidationThreshold: 0.8,
}

export class WorkingMemory {
  private db: Dexie | null = null
  private config: WorkingMemoryConfig
  private attentionSlots: Map<string, WorkingEntry> = new Map()

  constructor(config: Partial<WorkingMemoryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 获取数据库连接
   */
  private async getDb(): Promise<Dexie> {
    if (!this.db) {
      this.db = new Dexie('WorkingMemoryDB')
      this.db.version(1).stores({
        entries: '++id, sessionId, projectId, key, createdAt, lastAccess, weight',
      })
    }
    return this.db
  }

  /**
   * 存储工作记忆
   */
  async set(
    sessionId: string,
    key: string,
    value: string,
    options?: { ttl?: number; weight?: number; projectId?: number }
  ): Promise<number> {
    const db = await this.getDb()
    const now = Date.now()
    
    // 检查是否已存在
    const existing = await db.table('entries')
      .where(['sessionId', 'key'] as any)
      .equals([sessionId, key])
      .first()
    
    const entry: WorkingEntry = {
      sessionId,
      projectId: options?.projectId,
      key,
      value,
      ttl: options?.ttl || this.config.defaultTtlMs,
      createdAt: now,
      lastAccess: now,
      accessCount: 1,
      weight: options?.weight || 0.5,
      level: 'L1',
    }
    
    if (existing?.id) {
      await db.table('entries').update(existing.id, entry)
      return existing.id
    } else {
      const id = await db.table('entries').add(entry)
      this.updateAttentionSlot(key, entry)
      return id as number
    }
  }

  /**
   * 获取工作记忆
   */
  async get(sessionId: string, key: string): Promise<string | null> {
    const db = await this.getDb()
    const entry = await db.table('entries')
      .where(['sessionId', 'key'] as any)
      .equals([sessionId, key])
      .first()
    
    if (!entry) return null
    
    // 检查TTL
    if (Date.now() - entry.createdAt > entry.ttl) {
      await db.table('entries').delete(entry.id!)
      this.attentionSlots.delete(key)
      return null
    }
    
    // 更新访问信息
    entry.lastAccess = Date.now()
    entry.accessCount++
    await db.table('entries').update(entry.id!, {
      lastAccess: entry.lastAccess,
      accessCount: entry.accessCount,
    })
    
    this.updateAttentionSlot(key, entry)
    return entry.value
  }

  /**
   * 获取所有工作记忆条目
   */
  async getAll(sessionId: string): Promise<WorkingEntry[]> {
    const db = await this.getDb()
    return db.table('entries')
      .where('sessionId')
      .equals(sessionId)
      .toArray()
  }

  /**
   * 更新注意力槽位
   */
  private updateAttentionSlot(key: string, entry: WorkingEntry): void {
    if (this.attentionSlots.size >= this.config.maxSlots) {
// 找到最低权重的条目移除
    let minKey: string | null = null
    let minWeight = Infinity
    
    const entries = Array.from(this.attentionSlots.entries())
    for (const [k, v] of entries) {
      if (v.weight < minWeight) {
        minWeight = v.weight
        minKey = k
      }
    }
      
      if (minKey && entry.weight > minWeight) {
        this.attentionSlots.delete(minKey)
      } else {
        return
      }
    }
    
    this.attentionSlots.set(key, entry)
  }

  /**
   * 获取当前注意力槽位内容
   */
  getAttentionSlots(): Array<{ key: string; entry: WorkingEntry }> {
    return Array.from(this.attentionSlots.entries()).map(([key, entry]) => ({
      key,
      entry,
    }))
  }

  /**
   * 整合到情景记忆(L2)
   */
  async consolidateToEpisodic(
    sessionId: string,
    title: string,
    keyEvents: string[],
    involvedCharacters: string[],
    emotionalTone: string,
    significance: number
  ): Promise<number> {
    const db = await this.getDb()
    const entries = await this.getAll(sessionId)
    
    // 检查权重是否达到整合阈值
    const highWeightEntries = entries.filter(e => e.weight >= this.config.consolidationThreshold)
    if (highWeightEntries.length === 0) {
      throw new Error('No entries meet consolidation threshold')
    }
    
    // 创建情景记忆
    const episodicDb = new Dexie('EpisodicMemoryDB')
    episodicDb.version(1).stores({
      episodes: '++id, sessionId, title, startTime, endTime, significance',
    })
    
    const episode = {
      sessionId,
      title,
      startTime: Math.min(...highWeightEntries.map(e => e.createdAt)),
      endTime: Math.max(...highWeightEntries.map(e => e.lastAccess)),
      keyEvents,
      involvedCharacters,
      emotionalTone,
      significance,
      accessCount: 0,
    }
    
    const id = await episodicDb.table('episodes').add(episode)
    
    // 标记为已整合
    for (const entry of highWeightEntries) {
      await db.table('entries').update(entry.id!, { weight: 0 }) // 标记权重为0表示已整合
    }
    
    return id as number
  }

  /**
   * 从情景记忆检索
   */
  async retrieveFromEpisodic(
    query: string,
    options?: { timeRange?: { start: number; end: number }; characters?: string[] }
  ): Promise<any[]> {
    const episodicDb = new Dexie('EpisodicMemoryDB')
    episodicDb.version(1).stores({
      episodes: '++id, sessionId, title, startTime, endTime, significance',
    })
    
    let episodes = await episodicDb.table('episodes').toArray()
    
    // 时间范围过滤
    if (options?.timeRange) {
      episodes = episodes.filter(e =>
        e.startTime >= options.timeRange!.start &&
        e.endTime <= options.timeRange!.end
      )
    }
    
    // 角色过滤
    if (options?.characters && options.characters.length > 0) {
      episodes = episodes.filter(e =>
        options.characters!.some(c => e.involvedCharacters?.includes(c))
      )
    }
    
    // 关键词匹配
    if (query) {
      const queryLower = query.toLowerCase()
      episodes = episodes.filter(e =>
        e.title.toLowerCase().includes(queryLower) ||
        e.keyEvents.some(ev => ev.toLowerCase().includes(queryLower))
      )
    }
    
    // 按显著性排序
    episodes.sort((a, b) => b.significance - a.significance)
    
    return episodes
  }

  /**
   * 删除工作记忆
   */
  async delete(sessionId: string, key: string): Promise<void> {
    const db = await this.getDb()
    await db.table('entries').where(['sessionId', 'key'] as any).equals([sessionId, key]).delete()
    this.attentionSlots.delete(key)
  }

  /**
   * 清空会话工作记忆
   */
  async clear(sessionId: string): Promise<void> {
    const db = await this.getDb()
    await db.table('entries').where('sessionId').equals(sessionId).delete()
    this.attentionSlots.clear()
  }

  /**
   * 获取统计信息
   */
  async getStats(sessionId?: string): Promise<{
    totalEntries: number
    avgWeight: number
    attentionSlotCount: number
  }> {
    const db = await this.getDb()
    let entries: WorkingEntry[]
    
    if (sessionId) {
      entries = await db.table('entries').where('sessionId').equals(sessionId).toArray()
    } else {
      entries = await db.table('entries').toArray()
    }
    
    const avgWeight = entries.reduce((sum, e) => sum + e.weight, 0) / (entries.length || 1)
    
    return {
      totalEntries: entries.length,
      avgWeight,
      attentionSlotCount: this.attentionSlots.size,
    }
  }
}

// Singleton instance
export const workingMemory = new WorkingMemory()