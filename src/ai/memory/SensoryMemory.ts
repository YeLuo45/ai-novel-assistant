/**
 * V49 L0 SensoryMemory - 原始输入缓冲、衰减机制、促进晋升
 * 
 * 感觉记忆是五层记忆系统的最底层，负责接收和缓冲原始输入
 * 特性：
 * - 短期缓冲，内容快速衰减
 * - 高权重内容晋升到工作记忆(L1)
 * - 基于权重的选择性过滤
 */

import Dexie from 'dexie'

// 感觉记忆条目
export interface SensoryEntry {
  id?: number
  sessionId: string
  projectId?: number
  content: string           // 原始输入内容
  weight: number            // 权重 (0-1)，决定保留时间
  timestamp: number        // 创建时间
  lastAccess: number       // 最后访问时间
  accessCount: number     // 访问次数（强化权重）
  type: 'user_input' | 'ai_output' | 'system' | 'sensory'
  metadata?: Record<string, unknown>
}

// 衰减配置
export interface DecayConfig {
  baseDecayRate: number           // 基础衰减率 (0.01 = 1%/小时)
  minWeightThreshold: number      // 最低权重阈值，低于此值被清除
  promotionThreshold: number      // 晋升阈值
  decayIntervalMs: number         // 衰减检查间隔
}

// 默认衰减配置
const DEFAULT_DECAY_CONFIG: DecayConfig = {
  baseDecayRate: 0.02,            // 每小时2%衰减
  minWeightThreshold: 0.05,       // 低于5%权重清除
  promotionThreshold: 0.7,        // 70%权重晋升到工作记忆
  decayIntervalMs: 60000,        // 每分钟检查一次
}

export class SensoryMemory {
  private db: Dexie | null = null
  private decayConfig: DecayConfig
  private decayTimer: ReturnType<typeof setInterval> | null = null

  constructor(config: Partial<DecayConfig> = {}) {
    this.decayConfig = { ...DEFAULT_DECAY_CONFIG, ...config }
  }

  /**
   * 初始化数据库连接
   */
  private async getDb(): Promise<Dexie> {
    if (!this.db) {
      this.db = new Dexie('SensoryMemoryDB')
      this.db.version(1).stores({
        entries: '++id, sessionId, projectId, type, weight, timestamp, lastAccess',
      })
    }
    return this.db
  }

  /**
   * 添加感觉记忆条目
   */
  async add(entry: Omit<SensoryEntry, 'id' | 'lastAccess' | 'accessCount'>): Promise<number> {
    const db = await this.getDb()
    const now = Date.now()
    
    const newEntry: SensoryEntry = {
      ...entry,
      lastAccess: now,
      accessCount: 0,
    }
    
    const id = await db.table('entries').add(newEntry)
    
    // 异步启动衰减检查
    this.startDecayTimer()
    
    return id as number
  }

  /**
   * 访问条目（强化权重）
   */
  async access(id: number): Promise<SensoryEntry | undefined> {
    const db = await this.getDb()
    const entry = await db.table('entries').get(id)
    
    if (entry) {
      entry.accessCount++
      entry.lastAccess = Date.now()
      // 每次访问增加2%权重
      entry.weight = Math.min(1, entry.weight + 0.02)
      await db.table('entries').update(id, {
        accessCount: entry.accessCount,
        lastAccess: entry.lastAccess,
        weight: entry.weight,
      })
    }
    
    return entry
  }

  /**
   * 获取当前会话的感觉记忆
   */
  async getBySession(sessionId: string, limit = 50): Promise<SensoryEntry[]> {
    const db = await this.getDb()
    return db.table('entries')
      .where('sessionId')
      .equals(sessionId)
      .reverse()
      .sortBy('timestamp')
      .then(entries => entries.slice(0, limit))
  }

  /**
   * 获取达到晋升阈值的条目
   */
  async getPromotionCandidates(): Promise<SensoryEntry[]> {
    const db = await this.getDb()
    return db.table('entries')
      .where('weight')
      .above(this.decayConfig.promotionThreshold)
      .toArray()
  }

  /**
   * 检查衰减并清理低权重条目
   */
  async decay(): Promise<number> {
    const db = await this.getDb()
    const now = Date.now()
    const entries = await db.table('entries').toArray()
    
    let removedCount = 0
    const hourInMs = 3600000
    
    for (const entry of entries) {
      const ageHours = (now - entry.timestamp) / hourInMs
      const timeDecay = Math.exp(-this.decayConfig.baseDecayRate * ageHours)
      const accessBonus = entry.accessCount * 0.01
      const newWeight = Math.max(0, (entry.weight * timeDecay) + accessBonus - 0.001)
      
      if (newWeight < this.decayConfig.minWeightThreshold) {
        await db.table('entries').delete(entry.id!)
        removedCount++
      } else if (newWeight !== entry.weight) {
        await db.table('entries').update(entry.id!, { weight: newWeight })
      }
    }
    
    return removedCount
  }

  /**
   * 启动衰减定时器
   */
  private startDecayTimer(): void {
    if (this.decayTimer) return
    
    this.decayTimer = setInterval(() => {
      this.decay().catch(console.error)
    }, this.decayConfig.decayIntervalMs)
  }

  /**
   * 停止衰减定时器
   */
  stopDecayTimer(): void {
    if (this.decayTimer) {
      clearInterval(this.decayTimer)
      this.decayTimer = null
    }
  }

  /**
   * 清空会话感觉记忆
   */
  async clearSession(sessionId: string): Promise<void> {
    const db = await this.getDb()
    await db.table('entries').where('sessionId').equals(sessionId).delete()
  }

  /**
   * 获取统计信息
   */
  async getStats(sessionId?: string): Promise<{
    totalEntries: number
    avgWeight: number
    promotionCandidates: number
  }> {
    const db = await this.getDb()
    let entries: SensoryEntry[]
    
    if (sessionId) {
      entries = await db.table('entries').where('sessionId').equals(sessionId).toArray()
    } else {
      entries = await db.table('entries').toArray()
    }
    
    const avgWeight = entries.reduce((sum, e) => sum + e.weight, 0) / (entries.length || 1)
    const promotionCandidates = entries.filter(e => e.weight >= this.decayConfig.promotionThreshold).length
    
    return {
      totalEntries: entries.length,
      avgWeight,
      promotionCandidates,
    }
  }
}

// Singleton instance
export const sensoryMemory = new SensoryMemory()