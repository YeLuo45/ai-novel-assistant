/**
 * V49 ForgettingEngine - 遗忘引擎
 * 
 * 负责管理记忆的衰减和遗忘策略
 * 特性：
 * - 时间衰减 + 访问频率巩固
 * - 可配置的遗忘策略
 * - 定期清理低权重记忆
 */

import Dexie from 'dexie'

// 遗忘策略类型
export type ForgettingPolicyType = 'time_based' | 'importance_based' | 'adaptive'

// 遗忘策略配置
export interface ForgettingPolicy {
  type: ForgettingPolicyType
  decayRate: number           // 基础衰减率
  consolidationBonus: number  // 巩固加成（每次访问）
  minThreshold: number        // 最低阈值，低于此值被遗忘
  maxMemoryAge: number        // 最大内存年龄(ms)
}

// 遗忘日志条目
export interface ForgettingLog {
  id?: number
  memoryId: string
  memoryType: 'sensory' | 'working' | 'episodic' | 'semantic' | 'procedural'
  weightBefore: number
  weightAfter: number
  reason: 'decay' | 'threshold' | 'manual' | 'consolidation'
  timestamp: number
}

// 默认遗忘策略
const DEFAULT_POLICY: ForgettingPolicy = {
  type: 'adaptive',
  decayRate: 0.01,           // 1% per hour
  consolidationBonus: 0.05, // 5% bonus per access
  minThreshold: 0.1,        // 10% minimum
  maxMemoryAge: 7 * 24 * 3600000, // 7 days
}

export class ForgettingEngine {
  private db: Dexie | null = null
  private policies: Map<string, ForgettingPolicy> = new Map()
  private defaultPolicy: ForgettingPolicy

  constructor(policy?: Partial<ForgettingPolicy>) {
    this.defaultPolicy = { ...DEFAULT_POLICY, ...policy }
    this.policies.set('default', this.defaultPolicy)
  }

  /**
   * 获取数据库连接
   */
  private async getDb(): Promise<Dexie> {
    if (!this.db) {
      this.db = new Dexie('ForgettingEngineDB')
      this.db.version(1).stores({
        logs: '++id, memoryId, memoryType, timestamp',
        config: 'key',
      })
    }
    return this.db
  }

  /**
   * 设置特定记忆类型的策略
   */
  setPolicy(memoryType: string, policy: Partial<ForgettingPolicy>): void {
    const existing = this.policies.get(memoryType) || this.defaultPolicy
    this.policies.set(memoryType, { ...existing, ...policy })
  }

  /**
   * 获取特定记忆类型的策略
   */
  getPolicy(memoryType: string): ForgettingPolicy {
    return this.policies.get(memoryType) || this.defaultPolicy
  }

  /**
   * 计算衰减后的权重
   */
  calculateDecay(
    currentWeight: number,
    timestamp: number,
    accessCount: number,
    memoryType = 'default'
  ): number {
    const policy = this.getPolicy(memoryType)
    const ageHours = (Date.now() - timestamp) / 3600000
    
    // 时间衰减：指数衰减
    const timeDecay = Math.exp(-policy.decayRate * ageHours)
    
    // 访问巩固：每次访问增加权重
    const accessBonus = accessCount * policy.consolidationBonus
    
    // 计算新权重
    let newWeight = currentWeight * timeDecay + accessBonus
    
    // 确保在有效范围内
    newWeight = Math.max(0, Math.min(1, newWeight))
    
    return newWeight
  }

  /**
   * 检查是否应该遗忘
   */
  shouldForget(weight: number, memoryType = 'default'): boolean {
    const policy = this.getPolicy(memoryType)
    return weight < policy.minThreshold
  }

  /**
   * 遗忘条目（记录日志）
   */
  async forget(
    memoryId: string,
    memoryType: string,
    weightBefore: number,
    reason: ForgettingLog['reason']
  ): Promise<void> {
    const db = await this.getDb()
    const weightAfter = 0
    
    await db.table('logs').add({
      memoryId,
      memoryType: memoryType as any,
      weightBefore,
      weightAfter,
      reason,
      timestamp: Date.now(),
    })
  }

  /**
   * 执行遗忘检查（针对感官记忆）
   */
  async tick(sensoryDb: Dexie): Promise<number> {
    const policy = this.getPolicy('sensory')
    const entries = await sensoryDb.table('entries').toArray()
    let forgottenCount = 0
    
    for (const entry of entries) {
      const newWeight = this.calculateDecay(
        entry.weight,
        entry.timestamp,
        entry.accessCount,
        'sensory'
      )
      
      if (this.shouldForget(newWeight, 'sensory')) {
        // 记录遗忘日志
        await this.forget(
          String(entry.id),
          'sensory',
          entry.weight,
          'threshold'
        )
        await sensoryDb.table('entries').delete(entry.id!)
        forgottenCount++
      } else if (newWeight !== entry.weight) {
        await sensoryDb.table('entries').update(entry.id!, { weight: newWeight })
      }
    }
    
    return forgottenCount
  }

  /**
   * 执行整合（将工作记忆整合到情景记忆）
   */
  async consolidate(
    sourceDb: Dexie,
    targetDb: Dexie,
    sessionId: string,
    threshold = 0.8
  ): Promise<number> {
    const entries = await sourceDb.table('entries')
      .where('sessionId')
      .equals(sessionId)
      .toArray()
    
    const highWeightEntries = entries.filter(e => e.weight >= threshold)
    
    if (highWeightEntries.length === 0) return 0
    
    // 计算整合后的情景记忆属性
    const startTime = Math.min(...highWeightEntries.map(e => e.createdAt))
    const endTime = Math.max(...highWeightEntries.map(e => e.lastAccess))
    const avgSignificance = highWeightEntries.reduce((sum, e) => sum + e.weight, 0) / highWeightEntries.length
    
    // 创建情景记忆
    const episode = {
      sessionId,
      title: `Consolidated from ${highWeightEntries.length} entries`,
      startTime,
      endTime,
      keyEvents: highWeightEntries.map(e => e.value).slice(0, 10),
      involvedCharacters: [] as string[],
      emotionalTone: 'neutral',
      significance: Math.round(avgSignificance * 100),
      accessCount: 0,
    }
    
    const id = await targetDb.table('episodes').add(episode)
    
    // 标记源条目已被整合
    for (const entry of highWeightEntries) {
      await sourceDb.table('entries').update(entry.id!, { weight: 0 })
    }
    
    return id as number
  }

  /**
   * 获取遗忘统计
   */
  async getStats(memoryType?: string): Promise<{
    totalForgotten: number
    byReason: Record<string, number>
    byMemoryType: Record<string, number>
  }> {
    const db = await this.getDb()
    const logs = memoryType
      ? await db.table('logs').where('memoryType').equals(memoryType).toArray()
      : await db.table('logs').toArray()
    
    const byReason: Record<string, number> = {}
    const byMemoryType: Record<string, number> = {}
    
    for (const log of logs) {
      byReason[log.reason] = (byReason[log.reason] || 0) + 1
      byMemoryType[log.memoryType] = (byMemoryType[log.memoryType] || 0) + 1
    }
    
    return {
      totalForgotten: logs.length,
      byReason,
      byMemoryType,
    }
  }

  /**
   * 清空遗忘日志
   */
  async clearLogs(): Promise<void> {
    const db = await this.getDb()
    await db.table('logs').clear()
  }
}

// Singleton instance
export const forgettingEngine = new ForgettingEngine()