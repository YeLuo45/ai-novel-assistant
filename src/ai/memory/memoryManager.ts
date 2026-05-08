/**
 * 跨章节记忆系统 - 核心管理器
 * V14 Phase 1
 */

import { db } from '../../db'
import type {
  ProjectMemory,
  CharacterMemory,
  LocationMemory,
  PlotThread,
  ChapterSummary,
  WorldRule,
  ArcChange
} from './types'

const CACHE_TTL = 5 * 60 * 1000  // 5分钟缓存

class MemoryManager {
  private cache: Map<number, { memory: ProjectMemory, lastLoaded: number }> = new Map()

  /**
   * 初始化项目记忆（如果不存在）
   */
  async initProjectMemory(projectId: number): Promise<ProjectMemory> {
    const existing = await db.projectMemory.get(projectId)
    
    if (existing) {
      const memory = this.deserializeMemory(existing.memoryJson)
      this.cache.set(projectId, { memory, lastLoaded: Date.now() })
      return memory
    }

    const newMemory: ProjectMemory = {
      projectId,
      characters: new Map(),
      locations: new Map(),
      plotThreads: [],
      worldRules: [],
      chapterSummaries: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    await db.projectMemory.put({
      projectId,
      memoryJson: JSON.stringify(newMemory),
      updatedAt: Date.now()
    })

    this.cache.set(projectId, { memory: newMemory, lastLoaded: Date.now() })
    return newMemory
  }

  /**
   * 获取项目记忆（带缓存）
   */
  async getProjectMemory(projectId: number): Promise<ProjectMemory> {
    const cached = this.cache.get(projectId)
    
    if (cached && Date.now() - cached.lastLoaded < CACHE_TTL) {
      return cached.memory
    }

    const record = await db.projectMemory.get(projectId)
    if (!record) {
      return this.initProjectMemory(projectId)
    }

    const memory = this.deserializeMemory(record.memoryJson)
    this.cache.set(projectId, { memory, lastLoaded: Date.now() })
    return memory
  }

  /**
   * 保存项目记忆到数据库
   */
  async saveProjectMemory(projectId: number): Promise<void> {
    const cached = this.cache.get(projectId)
    if (!cached) return

    cached.memory.updatedAt = Date.now()
    
    await db.projectMemory.put({
      projectId,
      memoryJson: JSON.stringify(cached.memory),
      updatedAt: Date.now()
    })
  }

  /**
   * 使缓存失效（强制从数据库重新加载）
   */
  invalidateCache(projectId: number): void {
    this.cache.delete(projectId)
  }

  /**
   * 更新角色状态
   */
  async updateCharacterState(
    projectId: number,
    characterId: string,
    newState: string,
    reason: string,
    chapterId?: number
  ): Promise<void> {
    const memory = await this.getProjectMemory(projectId)
    const character = memory.characters.get(characterId)

    if (character) {
      // 记录弧线变化
      if (character.currentState !== newState && chapterId) {
        const arcChange: ArcChange = {
          chapterId,
          beforeState: character.currentState,
          afterState: newState,
          changeType: this.determineChangeType(character.currentState, newState),
          description: reason
        }
        character.arcHistory.push(arcChange)
      }
      character.currentState = newState
      character.updatedAt = Date.now()
    } else {
      // 创建新角色
      const newCharacter: CharacterMemory = {
        id: characterId,
        name: characterId,
        currentState: newState,
        personalityTraits: [],
        relationships: new Map(),
        arcHistory: [],
        keyEvents: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      memory.characters.set(characterId, newCharacter)
    }

    await this.saveProjectMemory(projectId)
  }

  /**
   * 获取角色当前状态
   */
  async getCharacterState(projectId: number, characterId: string): Promise<string | null> {
    const memory = await this.getProjectMemory(projectId)
    const character = memory.characters.get(characterId)
    return character?.currentState ?? null
  }

  /**
   * 获取所有角色当前状态
   */
  async getAllCharacterStates(projectId: number): Promise<Record<string, string>> {
    const memory = await this.getProjectMemory(projectId)
    const result: Record<string, string> = {}
    
    memory.characters.forEach((char, id) => {
      result[id] = char.currentState
    })
    
    return result
  }

  /**
   * 埋设伏笔
   */
  async plantPlotThread(
    projectId: number,
    tag: string,
    description: string,
    chapterId: number,
    relatedCharacters: string[]
  ): Promise<string> {
    const memory = await this.getProjectMemory(projectId)
    
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const thread: PlotThread = {
      id: threadId,
      tag,
      description,
      status: 'active',
      plantedInChapter: chapterId,
      relatedCharacters,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    memory.plotThreads.push(thread)
    await this.saveProjectMemory(projectId)

    // 同时存到 plotThreads 表
    await db.plotThreads.put({
      projectId,
      tag,
      description,
      status: 'active',
      plantedInChapter: chapterId,
      relatedCharacters: JSON.stringify(relatedCharacters),
      createdAt: Date.now()
    })

    return threadId
  }

  /**
   * 回收伏笔
   */
  async resolvePlotThread(
    projectId: number,
    threadId: string,
    chapterId: number,
    resolutionNote: string
  ): Promise<void> {
    const memory = await this.getProjectMemory(projectId)
    const thread = memory.plotThreads.find(t => t.id === threadId)

    if (thread) {
      thread.status = 'resolved'
      thread.resolvedInChapter = chapterId
      thread.resolutionNote = resolutionNote
      thread.updatedAt = Date.now()
      
      await this.saveProjectMemory(projectId)
    }

    // 更新数据库中的记录
    await db.plotThreads.where({ projectId, tag: thread?.tag || '' }).modify({
      status: 'resolved',
      resolvedInChapter: chapterId,
      resolutionNote
    })
  }

  /**
   * 获取活跃伏笔
   */
  async getActivePlotThreads(projectId: number): Promise<PlotThread[]> {
    const memory = await this.getProjectMemory(projectId)
    return memory.plotThreads.filter(t => t.status === 'active')
  }

  /**
   * 获取所有伏笔
   */
  async getAllPlotThreads(projectId: number): Promise<PlotThread[]> {
    const memory = await this.getProjectMemory(projectId)
    return memory.plotThreads
  }

  /**
   * 添加章节摘要
   */
  async addChapterSummary(
    projectId: number,
    chapterId: number,
    title: string,
    summary: string,
    keyEvents: string[],
    characterStates: Record<string, string>,
    wordCount: number
  ): Promise<void> {
    const memory = await this.getProjectMemory(projectId)

    // 检查是否已存在
    const existingIdx = memory.chapterSummaries.findIndex(s => s.chapterId === chapterId)
    
    const chapterSummary: ChapterSummary = {
      chapterId,
      title,
      summary,
      keyEvents,
      characterStates,
      wordCount,
      createdAt: Date.now()
    }

    if (existingIdx >= 0) {
      memory.chapterSummaries[existingIdx] = chapterSummary
    } else {
      memory.chapterSummaries.push(chapterSummary)
    }

    await this.saveProjectMemory(projectId)

    // 同时存到 chapterSummaries 表
    await db.chapterSummaries.put({
      projectId,
      chapterId,
      title,
      summary,
      keyEvents: JSON.stringify(keyEvents),
      characterStates: JSON.stringify(characterStates),
      wordCount,
      createdAt: Date.now()
    })
  }

  /**
   * 获取最近章节摘要
   */
  async getRecentChapterSummaries(
    projectId: number,
    count: number
  ): Promise<ChapterSummary[]> {
    const memory = await this.getProjectMemory(projectId)
    
    return memory.chapterSummaries
      .sort((a, b) => b.chapterId - a.chapterId)
      .slice(0, count)
  }

  /**
   * 获取章节摘要
   */
  async getChapterSummary(
    projectId: number,
    chapterId: number
  ): Promise<ChapterSummary | null> {
    const memory = await this.getProjectMemory(projectId)
    return memory.chapterSummaries.find(s => s.chapterId === chapterId) ?? null
  }

  /**
   * 获取世界规则
   */
  async getWorldRules(projectId: number): Promise<WorldRule[]> {
    const memory = await this.getProjectMemory(projectId)
    return memory.worldRules
  }

  /**
   * 添加世界规则
   */
  async addWorldRule(
    projectId: number,
    content: string,
    category: WorldRule['category'],
    description?: string
  ): Promise<string> {
    const memory = await this.getProjectMemory(projectId)
    
    const rule: WorldRule = {
      id: `rule_${Date.now()}`,
      content,
      category,
      description,
      createdAt: Date.now()
    }

    memory.worldRules.push(rule)
    await this.saveProjectMemory(projectId)

    return rule.id
  }

  // ============ 辅助方法 ============

  private deserializeMemory(json: string): ProjectMemory {
    const obj = JSON.parse(json)
    
    // 反序列化 Map
    const characters = new Map<string, CharacterMemory>(
      Object.entries(obj.characters || {})
    )
    const locations = new Map<string, LocationMemory>(
      Object.entries(obj.locations || {})
    )

    return {
      ...obj,
      characters,
      locations,
      plotThreads: obj.plotThreads || [],
      worldRules: obj.worldRules || [],
      chapterSummaries: obj.chapterSummaries || []
    }
  }

  private determineChangeType(
    before: string,
    after: string
  ): ArcChange['changeType'] {
    // 简化判断逻辑
    if (before.includes('强') && after.includes('弱')) return 'decline'
    if (before.includes('弱') && after.includes('强')) return 'growth'
    if (before.includes('敌') && after.includes('友')) return 'shift'
    if (before.includes('友') && after.includes('敌')) return 'shift'
    return 'unchanged'
  }
}

export const memoryManager = new MemoryManager()
