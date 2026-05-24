/**
 * V49 L4 ProceduralMemory - 技能自动化
 * 
 * 程序记忆负责存储可自动执行的技能程序
 * 特性：
 * - SkillProcedure: 技能程序（触发器、动作、成功率、自动调优）
 * - ProceduralRetriever: 匹配程序、执行程序、从结果学习
 */

import Dexie from 'dexie'

// 技能程序
export interface SkillProcedure {
  id?: number
  name: string
  triggerContext: string       // 触发上下文描述
  triggerKeywords: string[]    // 触发关键词
  actions: string[]            // 执行的动作序列
  preconditions: string[]       // 前置条件
  successRate: number           // 历史成功率 0-1
  usageCount: number            // 使用次数
  successCount: number         // 成功次数
  lastUsed: number
  createdAt: number
  autoTune: boolean            // 是否启用自动调优
  adaptationHistory: Array<{    // 适应历史
    action: string
    result: 'success' | 'failed'
    timestamp: number
  }>
  thresholds: {                // 触发阈值
    minSuccessRate: number
    minUsageCount: number
  }
  metadata?: Record<string, unknown>
}

// 技能执行结果
export interface ExecutionResult {
  procedureId: number
  success: boolean
  output: string
  executionTime: number
  timestamp: number
  context: Record<string, unknown>
}

// 技能检索选项
export interface SkillQuery {
  query?: string
  context?: string
  minSuccessRate?: number
  limit?: number
}

export class ProceduralMemory {
  private db: Dexie | null = null

  constructor() {}

  /**
   * 获取数据库连接
   */
  private async getDb(): Promise<Dexie> {
    if (!this.db) {
      this.db = new Dexie('ProceduralMemoryDB')
      this.db.version(1).stores({
        procedures: '++id, name, triggerContext, successRate, usageCount, lastUsed, createdAt',
        executions: '++id, procedureId, success, timestamp',
        procedure_tags: '++id, procedureId, tag',
      })
    }
    return this.db
  }

  /**
   * 注册新技能程序
   */
  async register(procedure: Omit<SkillProcedure, 'id' | 'usageCount' | 'successCount' | 'createdAt' | 'lastUsed' | 'adaptationHistory'>): Promise<number> {
    const db = await this.getDb()
    
    const newProcedure: SkillProcedure = {
      ...procedure,
      usageCount: 0,
      successCount: 0,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      adaptationHistory: [],
    }
    
    return await db.table('procedures').add(newProcedure) as number
  }

  /**
   * 匹配技能程序
   */
  async matchProcedures(query: SkillQuery): Promise<SkillProcedure[]> {
    const db = await this.getDb()
    let procedures = await db.table('procedures').toArray()
    
    // 过滤最低成功率
    if (query.minSuccessRate !== undefined) {
      procedures = procedures.filter(p => p.successRate >= query.minSuccessRate!)
    }
    
    // 关键词匹配
    if (query.query) {
      const queryLower = query.query.toLowerCase()
      procedures = procedures.filter(p =>
        p.name.toLowerCase().includes(queryLower) ||
        p.triggerContext.toLowerCase().includes(queryLower) ||
        p.triggerKeywords.some(k => k.toLowerCase().includes(queryLower))
      )
    }
    
    // 上下文匹配
    if (query.context) {
      const contextLower = query.context.toLowerCase()
      procedures = procedures.filter(p =>
        contextLower.includes(p.triggerContext.toLowerCase()) ||
        p.triggerKeywords.some(k => contextLower.includes(k.toLowerCase()))
      )
    }
    
    // 按成功率和使用次数排序
    procedures.sort((a, b) => {
      const scoreA = a.successRate * 0.7 + Math.min(a.usageCount / 100, 1) * 0.3
      const scoreB = b.successRate * 0.7 + Math.min(b.usageCount / 100, 1) * 0.3
      return scoreB - scoreA
    })
    
    return procedures.slice(0, query.limit || procedures.length)
  }

  /**
   * 执行技能程序
   */
  async executeProcedure(
    procedureId: number,
    context: Record<string, unknown> = {}
  ): Promise<ExecutionResult> {
    const db = await this.getDb()
    const startTime = Date.now()
    
    const procedure = await db.table('procedures').get(procedureId)
    if (!procedure) {
      throw new Error(`Procedure ${procedureId} not found`)
    }
    
    // 检查阈值
    if (procedure.successRate < procedure.thresholds.minSuccessRate ||
        procedure.usageCount < procedure.thresholds.minUsageCount) {
      return {
        procedureId,
        success: false,
        output: 'Thresholds not met',
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
        context,
      }
    }
    
    // 执行动作序列
    let output = ''
    let allSuccess = true
    
    for (const action of procedure.actions) {
      // 简单模拟执行（实际应用中这里会调用具体的AI或工具）
      output += `[EXEC:${action}] `
    }
    
    const result: ExecutionResult = {
      procedureId,
      success: allSuccess,
      output: output.trim(),
      executionTime: Date.now() - startTime,
      timestamp: Date.now(),
      context,
    }
    
    // 记录执行
    await db.table('executions').add(result)
    
    // 更新技能统计
    await db.table('procedures').update(procedureId, {
      usageCount: procedure.usageCount + 1,
      successCount: allSuccess ? procedure.successCount + 1 : procedure.successCount,
      successRate: ((procedure.successCount + (allSuccess ? 1 : 0)) / (procedure.usageCount + 1)),
      lastUsed: Date.now(),
    })
    
    return result
  }

  /**
   * 从执行结果学习
   */
  async learnFromOutcome(
    procedureId: number,
    outcome: 'success' | 'failed',
    details?: string
  ): Promise<void> {
    const db = await this.getDb()
    const procedure = await db.table('procedures').get(procedureId)
    
    if (!procedure) return
    
    // 记录适应历史
    const adaptation = {
      action: details || 'general',
      result: outcome,
      timestamp: Date.now(),
    }
    
    const adaptationHistory = [...procedure.adaptationHistory, adaptation].slice(-20) // 保留最近20条
    
    // 如果启用自动调优，调整阈值
    if (procedure.autoTune && outcome === 'success') {
      const newThreshold = Math.max(0.1, procedure.thresholds.minSuccessRate - 0.05)
      await db.table('procedures').update(procedureId, { adaptationHistory })
    } else if (procedure.autoTune && outcome === 'failed') {
      const newThreshold = Math.min(0.9, procedure.thresholds.minSuccessRate + 0.05)
      await db.table('procedures').update(procedureId, { adaptationHistory })
    } else {
      await db.table('procedures').update(procedureId, { adaptationHistory })
    }
  }

  /**
   * 更新技能阈值（供 SelfEvolutionEngine 调用）
   */
  async updateThresholds(
    procedureId: number,
    thresholds: { minSuccessRate?: number; minUsageCount?: number }
  ): Promise<void> {
    const db = await this.getDb()
    const procedure = await db.table('procedures').get(procedureId)
    
    if (!procedure) return
    
    await db.table('procedures').update(procedureId, {
      thresholds: { ...procedure.thresholds, ...thresholds },
    })
  }

  /**
   * 获取技能详情
   */
  async getProcedure(id: number): Promise<SkillProcedure | undefined> {
    const db = await this.getDb()
    return db.table('procedures').get(id)
  }

  /**
   * 获取所有技能
   */
  async getAllProcedures(): Promise<SkillProcedure[]> {
    const db = await this.getDb()
    return db.table('procedures').toArray()
  }

  /**
   * 获取技能执行历史
   */
  async getExecutionHistory(procedureId: number, limit = 20): Promise<ExecutionResult[]> {
    const db = await this.getDb()
    const executions = await db.table('executions')
      .where('procedureId')
      .equals(procedureId)
      .reverse()
      .sortBy('timestamp')
    
    return executions.slice(0, limit)
  }

  /**
   * 删除技能
   */
  async deleteProcedure(id: number): Promise<void> {
    const db = await this.getDb()
    await db.table('procedures').delete(id)
    await db.table('executions').where('procedureId').equals(id).delete()
    await db.table('procedure_tags').where('procedureId').equals(id).delete()
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{
    totalProcedures: number
    avgSuccessRate: number
    topProcedures: Array<{ id: number; name: string; successRate: number }>
  }> {
    const db = await this.getDb()
    const procedures = await db.table('procedures').toArray()
    
    const avgSuccessRate = procedures.reduce((sum, p) => sum + p.successRate, 0) / (procedures.length || 1)
    
    const topProcedures = [...procedures]
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5)
      .map(p => ({ id: p.id!, name: p.name, successRate: p.successRate }))
    
    return {
      totalProcedures: procedures.length,
      avgSuccessRate,
      topProcedures,
    }
  }
}

// Singleton instance
export const proceduralMemory = new ProceduralMemory()