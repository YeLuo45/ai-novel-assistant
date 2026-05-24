/**
 * V49 MemoryOrchestrator - 五层记忆协同
 * 
 * 统一协调五层记忆系统的运作
 * 特性：
 * - crossLayerRetrieve: 跨层检索
 * - 自动在层间传输记忆
 * - 统一的记忆访问接口
 */

import { sensoryMemory, SensoryEntry } from './SensoryMemory'
import { workingMemory, WorkingEntry } from './WorkingMemory'
import { episodicMemory, Episode } from './EpisodicMemory'
import { semanticMemory, KnowledgeNode, KnowledgeEdge } from './SemanticMemory'
import { proceduralMemory, SkillProcedure, ExecutionResult } from './ProceduralMemory'
import { forgettingEngine } from './ForgettingEngine'

// 记忆层级
export type MemoryTier = 'L0' | 'L1' | 'L2' | 'L3' | 'L4'

// 跨层检索选项
export interface CrossLayerQuery {
  query: string
  layers?: MemoryTier[]
  sessionId?: string
  projectId?: number
  limit?: number
}

// 检索结果
export interface MemoryResult {
  tier: MemoryTier
  score: number
  data: SensoryEntry | WorkingEntry | Episode | KnowledgeNode | SkillProcedure
  type: string
}

// 统计信息
export interface MemoryOrchestratorStats {
  sensory: { totalEntries: number; avgWeight: number; promotionCandidates: number }
  working: { totalEntries: number; avgWeight: number; attentionSlotCount: number }
  episodic: { totalEpisodes: number; avgSignificance: number }
  semantic: { totalNodes: number; totalEdges: number; avgConnections: number }
  procedural: { totalProcedures: number; avgSuccessRate: number }
}

export class MemoryOrchestrator {
  private isInitialized = false

  constructor() {}

  /**
   * 初始化（启动衰减定时器等）
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    this.isInitialized = true
  }

  /**
   * 跨层检索
   */
  async crossLayerRetrieve(options: CrossLayerQuery): Promise<MemoryResult[]> {
    const layers = options.layers || ['L0', 'L1', 'L2', 'L3', 'L4']
    const results: MemoryResult[] = []
    const query = options.query.toLowerCase()

    // L0 感官记忆
    if (layers.includes('L0')) {
      const sensoryEntries = await sensoryMemory.getBySession(options.sessionId || 'default')
      for (const entry of sensoryEntries) {
        const score = this.calculateRelevanceScore(query, entry.content)
        if (score > 0) {
          results.push({
            tier: 'L0',
            score,
            data: entry,
            type: 'sensory',
          })
        }
      }
    }

    // L1 工作记忆
    if (layers.includes('L1')) {
      const workingEntries = options.sessionId
        ? await workingMemory.getAll(options.sessionId)
        : []
      for (const entry of workingEntries) {
        const score = this.calculateRelevanceScore(query, entry.value)
        if (score > 0) {
          results.push({
            tier: 'L1',
            score,
            data: entry,
            type: 'working',
          })
        }
      }
    }

    // L2 情景记忆
    if (layers.includes('L2')) {
      const episodes = await episodicMemory.findSimilar(query, options.limit)
      for (const episode of episodes) {
        const score = this.calculateRelevanceScore(query, 
          episode.title + ' ' + episode.keyEvents.join(' '))
        if (score > 0) {
          results.push({
            tier: 'L2',
            score,
            data: episode,
            type: 'episodic',
          })
        }
      }
    }

    // L3 语义记忆
    if (layers.includes('L3')) {
      const nodes = await semanticMemory.searchByName(query, options.limit)
      for (const node of nodes) {
        const score = this.calculateRelevanceScore(query, 
          node.name + ' ' + node.content + ' ' + JSON.stringify(node.properties))
        if (score > 0) {
          results.push({
            tier: 'L3',
            score,
            data: node,
            type: 'semantic',
          })
        }
      }
    }

    // L4 程序记忆
    if (layers.includes('L4')) {
      const procedures = await proceduralMemory.matchProcedures({
        query,
        limit: options.limit,
      })
      for (const procedure of procedures) {
        const score = this.calculateRelevanceScore(query,
          procedure.name + ' ' + procedure.triggerContext + ' ' + procedure.actions.join(' '))
        if (score > 0) {
          results.push({
            tier: 'L4',
            score,
            data: procedure,
            type: 'procedural',
          })
        }
      }
    }

    // 排序并限制结果
    results.sort((a, b) => b.score - a.score)
    return results.slice(0, options.limit || 20)
  }

  /**
   * 计算相关性得分
   */
  private calculateRelevanceScore(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    const contentLower = content.toLowerCase()
    
    let score = 0
    for (const word of queryWords) {
      if (contentLower.includes(word)) {
        score += 1
        // 完全匹配额外加分
        if (contentLower.startsWith(word) || contentLower.endsWith(word)) {
          score += 0.5
        }
      }
    }
    
    // 归一化
    return score / Math.max(queryWords.length, 1)
  }

  /**
   * 从感官记忆晋升到工作记忆
   */
  async promoteToWorking(sessionId: string, entryId: number): Promise<void> {
    const entry = await sensoryMemory.access(entryId)
    if (!entry) return
    
    if (entry.weight >= 0.7) {
      await workingMemory.set(sessionId, `promoted_${entryId}`, entry.content, {
        weight: entry.weight,
        projectId: entry.projectId,
      })
    }
  }

  /**
   * 从工作记忆整合到情景记忆
   */
  async consolidateToEpisodic(
    sessionId: string,
    title: string,
    keyEvents: string[],
    involvedCharacters: string[],
    emotionalTone: string,
    significance: number
  ): Promise<number> {
    return workingMemory.consolidateToEpisodic(
      sessionId,
      title,
      keyEvents,
      involvedCharacters,
      emotionalTone,
      significance
    )
  }

  /**
   * 执行技能程序
   */
  async executeSkill(
    procedureId: number,
    context: Record<string, unknown> = {}
  ): Promise<ExecutionResult> {
    const result = await proceduralMemory.executeProcedure(procedureId, context)
    
    // 学习结果
    await proceduralMemory.learnFromOutcome(
      procedureId,
      result.success ? 'success' : 'failed'
    )
    
    return result
  }

  /**
   * 运行遗忘引擎
   */
  async runForgettingCycle(): Promise<void> {
    // 感官记忆衰减
    const sensoryDb = new (await import('dexie')).default('SensoryMemoryDB')
    sensoryDb.version(1).stores({
      entries: '++id, sessionId, projectId, type, weight, timestamp, lastAccess',
    })
    await forgettingEngine.tick(sensoryDb)
    
    // 清理过期工作记忆
    // (工作记忆的TTL检查在get时自动进行)
  }

  /**
   * 获取五层统计信息
   */
  async getStats(sessionId?: string): Promise<MemoryOrchestratorStats> {
    const [sensory, working, episodic, semantic, procedural] = await Promise.all([
      sensoryMemory.getStats(sessionId),
      workingMemory.getStats(sessionId),
      episodicMemory.getStats(),
      semanticMemory.getStats(),
      proceduralMemory.getStats(),
    ])
    
    return { sensory, working, episodic, semantic, procedural }
  }

  /**
   * 清理指定层级的记忆
   */
  async clearTier(tier: MemoryTier, sessionId?: string): Promise<void> {
    switch (tier) {
      case 'L0':
        if (sessionId) await sensoryMemory.clearSession(sessionId)
        break
      case 'L1':
        if (sessionId) await workingMemory.clear(sessionId)
        break
      case 'L2':
        // 情景记忆需要特定ID，暂不支持全量清理
        break
      case 'L3':
        // 语义记忆需要特定ID，暂不支持全量清理
        break
      case 'L4':
        // 程序记忆不轻易删除
        break
    }
  }
}

// Singleton instance
export const memoryOrchestrator = new MemoryOrchestrator()