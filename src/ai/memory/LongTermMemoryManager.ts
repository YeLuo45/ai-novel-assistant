/**
 * V22 长期记忆管理器
 * Phase 1: 记忆存储架构
 * 
 * 功能：
 * - 存储、检索、更新、删除记忆
 * - 角色记忆管理
 * - 情节记忆管理
 * - 风格记忆管理
 * - 时间线管理
 * - 一致性检查接口
 * - 伏笔追踪
 * - localStorage持久化
 */

import { db } from '../../db'
import type {
  MemoryType,
  MemoryEntry,
  V22CharacterMemory as CharacterMemory,
  V22PlotMemory as PlotMemory,
  V22StyleMemory as StyleMemory,
  V22TimelineEvent as TimelineEvent,
  Foreshadowing,
  RelationshipSnapshot,
  EmotionalArcSnapshot,
  AppearanceSnapshot,
  GrowthEvent,
  BeliefChange,
  ThemeOccurrence,
  ConflictRecord,
  Clue,
  PatternRecord,
  VocabularyPreference,
  DialoguePattern,
  PacingProfile,
  ConsistencyIssue,
  MemoryStorageData,
} from './types'
import { STORAGE_KEYS } from './types'

// localStorage helper functions
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error(`Failed to save to localStorage: ${key}`, e)
  }
}

class LongTermMemoryManager {
  private projectId: number = 0
  private memoryCache: Map<string, MemoryEntry> = new Map()
  private characterCache: Map<string, CharacterMemory> = new Map()
  private plotCache: Map<string, PlotMemory> = new Map()
  private styleCache: StyleMemory | null = null
  private timelineCache: TimelineEvent[] = []
  private initialized: boolean = false

  /**
   * 初始化记忆管理器
   */
  async initialize(projectId: number): Promise<void> {
    this.projectId = projectId
    await this.loadFromStorage()
    await this.loadFromDB()
    this.initialized = true
  }

  /**
   * 从localStorage加载数据
   */
  private async loadFromStorage(): Promise<void> {
    const memoryData = getFromStorage<MemoryEntry[]>(STORAGE_KEYS.MEMORY, [])
    const characterData = getFromStorage<CharacterMemory[]>(STORAGE_KEYS.CHARACTER, [])
    const plotData = getFromStorage<PlotMemory[]>(STORAGE_KEYS.PLOT, [])
    const styleData = getFromStorage<StyleMemory | null>(STORAGE_KEYS.STYLE, null)
    const timelineData = getFromStorage<TimelineEvent[]>(STORAGE_KEYS.TIMELINE, [])

    memoryData.forEach(m => this.memoryCache.set(m.id, m))
    characterData.forEach(c => this.characterCache.set(c.id, c))
    plotData.forEach(p => this.plotCache.set(p.id, p))
    this.styleCache = styleData
    this.timelineCache = timelineData
  }

  /**
   * 从数据库加载数据
   */
  private async loadFromDB(): Promise<void> {
    try {
      // 从数据库同步到内存
      const dbMemories = await db.projectMemory.get(this.projectId)
      if (dbMemories) {
        const data = JSON.parse(dbMemories.memoryJson) as MemoryStorageData
        if (data) {
          data.memories?.forEach(m => this.memoryCache.set(m.id, m))
          data.characterMemories?.forEach(c => this.characterCache.set(c.id, c))
          data.plotMemories?.forEach(p => this.plotCache.set(p.id, p))
          this.styleCache = data.styleMemory
          this.timelineCache = data.timeline || []
        }
      }
    } catch (e) {
      console.error('Failed to load from DB:', e)
    }
  }

  /**
   * 保存到localStorage
   */
  private persistToStorage(): void {
    saveToStorage(STORAGE_KEYS.MEMORY, Array.from(this.memoryCache.values()))
    saveToStorage(STORAGE_KEYS.CHARACTER, Array.from(this.characterCache.values()))
    saveToStorage(STORAGE_KEYS.PLOT, Array.from(this.plotCache.values()))
    saveToStorage(STORAGE_KEYS.STYLE, this.styleCache)
    saveToStorage(STORAGE_KEYS.TIMELINE, this.timelineCache)
  }

  /**
   * 保存到数据库
   */
  private async persistToDB(): Promise<void> {
    const data: MemoryStorageData = {
      projectId: this.projectId,
      memories: Array.from(this.memoryCache.values()),
      characterMemories: Array.from(this.characterCache.values()),
      plotMemories: Array.from(this.plotCache.values()),
      styleMemory: this.styleCache,
      timeline: this.timelineCache,
      updatedAt: Date.now(),
    }
    
    await db.projectMemory.put({
      projectId: this.projectId,
      memoryJson: JSON.stringify(data),
      updatedAt: Date.now(),
    })
  }

  /**
   * 生成唯一ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // ==================== 通用记忆 CRUD ====================

  /**
   * 创建记忆
   */
  async createMemory(
    type: MemoryType,
    key: string,
    value: string,
    chapter: number,
    importance: number = 50,
    tags: string[] = [],
    metadata: Record<string, any> = {}
  ): Promise<MemoryEntry> {
    const now = Date.now()
    const memory: MemoryEntry = {
      id: this.generateId('mem'),
      type,
      key,
      value,
      chapter,
      createdAt: now,
      updatedAt: now,
      accessCount: 0,
      lastAccessedAt: now,
      importance,
      tags,
      metadata,
    }

    this.memoryCache.set(memory.id, memory)
    this.persistToStorage()
    await this.persistToDB()
    return memory
  }

  /**
   * 获取记忆
   */
  async getMemory(id: string): Promise<MemoryEntry | null> {
    const memory = this.memoryCache.get(id)
    if (memory) {
      // 更新访问统计
      memory.accessCount++
      memory.lastAccessedAt = Date.now()
      this.persistToStorage()
    }
    return memory || null
  }

  /**
   * 更新记忆
   */
  async updateMemory(
    id: string,
    updates: Partial<Pick<MemoryEntry, 'key' | 'value' | 'importance' | 'tags' | 'metadata'>>
  ): Promise<MemoryEntry | null> {
    const memory = this.memoryCache.get(id)
    if (!memory) return null

    if (updates.key !== undefined) memory.key = updates.key
    if (updates.value !== undefined) memory.value = updates.value
    if (updates.importance !== undefined) memory.importance = updates.importance
    if (updates.tags !== undefined) memory.tags = updates.tags
    if (updates.metadata !== undefined) memory.metadata = updates.metadata
    memory.updatedAt = Date.now()

    this.persistToStorage()
    await this.persistToDB()
    return memory
  }

  /**
   * 删除记忆
   */
  async deleteMemory(id: string): Promise<boolean> {
    const deleted = this.memoryCache.delete(id)
    if (deleted) {
      this.persistToStorage()
      await this.persistToDB()
    }
    return deleted
  }

  /**
   * 按类型查询记忆
   */
  async getMemoriesByType(type: MemoryType): Promise<MemoryEntry[]> {
    return Array.from(this.memoryCache.values()).filter(m => m.type === type)
  }

  /**
   * 按章节查询记忆
   */
  async getMemoriesByChapter(chapter: number): Promise<MemoryEntry[]> {
    return Array.from(this.memoryCache.values()).filter(m => m.chapter === chapter)
  }

  /**
   * 搜索记忆
   */
  async searchMemories(query: string): Promise<MemoryEntry[]> {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.memoryCache.values()).filter(
      m => m.key.toLowerCase().includes(lowerQuery) ||
           m.value.toLowerCase().includes(lowerQuery) ||
           m.tags.some(t => t.toLowerCase().includes(lowerQuery))
    )
  }

  /**
   * 获取重要记忆
   */
  async getHighImportanceMemories(threshold: number = 70): Promise<MemoryEntry[]> {
    return Array.from(this.memoryCache.values())
      .filter(m => m.importance >= threshold)
      .sort((a, b) => b.importance - a.importance)
  }

  // ==================== 角色记忆管理 ====================

  /**
   * 创建角色记忆
   */
  async createCharacterMemory(
    characterId: string,
    name: string,
    personalityTraits: string[] = []
  ): Promise<CharacterMemory> {
    const character: CharacterMemory = {
      id: this.generateId('char'),
      characterId,
      name,
      personalityTraits,
      relationships: new Map(),
      emotionalArc: [],
      appearances: [],
      growthLog: [],
      beliefChanges: [],
      consistencyScore: 100,
      lastAppearance: 0,
      totalAppearances: 0,
    }

    this.characterCache.set(character.id, character)
    this.persistToStorage()
    await this.persistToDB()
    return character
  }

  /**
   * 获取角色记忆
   */
  async getCharacterMemory(id: string): Promise<CharacterMemory | null> {
    return this.characterCache.get(id) || null
  }

  /**
   * 按characterId获取角色记忆
   */
  async getCharacterMemoryByCharacterId(characterId: string): Promise<CharacterMemory | null> {
    return Array.from(this.characterCache.values()).find(c => c.characterId === characterId) || null
  }

  /**
   * 更新角色记忆
   */
  async updateCharacterMemory(
    id: string,
    updates: Partial<Pick<CharacterMemory, 'name' | 'personalityTraits' | 'consistencyScore'>>
  ): Promise<CharacterMemory | null> {
    const character = this.characterCache.get(id)
    if (!character) return null

    if (updates.name !== undefined) character.name = updates.name
    if (updates.personalityTraits !== undefined) character.personalityTraits = updates.personalityTraits
    if (updates.consistencyScore !== undefined) character.consistencyScore = updates.consistencyScore

    this.persistToStorage()
    await this.persistToDB()
    return character
  }

  /**
   * 删除角色记忆
   */
  async deleteCharacterMemory(id: string): Promise<boolean> {
    return this.characterCache.delete(id)
  }

  /**
   * 添加角色关系快照
   */
  async addCharacterRelationship(
    characterId: string,
    relationship: RelationshipSnapshot
  ): Promise<void> {
    const character = await this.getCharacterMemoryByCharacterId(characterId)
    if (character) {
      character.relationships.set(relationship.targetId, relationship)
      this.persistToStorage()
      await this.persistToDB()
    }
  }

  /**
   * 添加角色情感弧
   */
  async addEmotionalArc(
    characterId: string,
    emotion: string,
    intensity: number,
    chapter: number,
    context: string
  ): Promise<void> {
    const character = await this.getCharacterMemoryByCharacterId(characterId)
    if (character) {
      const snapshot: EmotionalArcSnapshot = {
        emotion,
        intensity,
        chapter,
        context,
        timestamp: Date.now(),
      }
      character.emotionalArc.push(snapshot)
      this.persistToStorage()
      await this.persistToDB()
    }
  }

  /**
   * 记录角色登场
   */
  async recordCharacterAppearance(
    characterId: string,
    chapter: number,
    scene: string,
    description: string,
    mood: string
  ): Promise<void> {
    const character = await this.getCharacterMemoryByCharacterId(characterId)
    if (character) {
      const appearance: AppearanceSnapshot = {
        chapter,
        scene,
        description,
        mood,
      }
      character.appearances.push(appearance)
      character.lastAppearance = chapter
      character.totalAppearances++
      this.persistToStorage()
      await this.persistToDB()
    }
  }

  /**
   * 添加角色成长事件
   */
  async addGrowthEvent(
    characterId: string,
    chapter: number,
    event: string,
    impact: 'major' | 'minor',
    affectedTraits: string[]
  ): Promise<void> {
    const character = await this.getCharacterMemoryByCharacterId(characterId)
    if (character) {
      const growthEvent: GrowthEvent = {
        chapter,
        event,
        impact,
        affectedTraits,
        timestamp: Date.now(),
      }
      character.growthLog.push(growthEvent)
      this.persistToStorage()
      await this.persistToDB()
    }
  }

  /**
   * 记录角色信念变化
   */
  async recordBeliefChange(
    characterId: string,
    chapter: number,
    before: string,
    after: string,
    reason: string
  ): Promise<void> {
    const character = await this.getCharacterMemoryByCharacterId(characterId)
    if (character) {
      const beliefChange: BeliefChange = {
        chapter,
        before,
        after,
        reason,
        timestamp: Date.now(),
      }
      character.beliefChanges.push(beliefChange)
      this.persistToStorage()
      await this.persistToDB()
    }
  }

  /**
   * 获取所有角色记忆
   */
  async getAllCharacterMemories(): Promise<CharacterMemory[]> {
    return Array.from(this.characterCache.values())
  }

  // ==================== 情节记忆管理 ====================

  /**
   * 创建情节记忆
   */
  async createPlotMemory(plotPointId: string): Promise<PlotMemory> {
    const plot: PlotMemory = {
      id: this.generateId('plot'),
      plotPointId,
      foreshadowings: [],
      themes: [],
      themeOccurrences: [],
      conflicts: [],
      clues: [],
    }

    this.plotCache.set(plot.id, plot)
    this.persistToStorage()
    await this.persistToDB()
    return plot
  }

  /**
   * 获取情节记忆
   */
  async getPlotMemory(id: string): Promise<PlotMemory | null> {
    return this.plotCache.get(id) || null
  }

  /**
   * 更新情节记忆
   */
  async updatePlotMemory(
    id: string,
    updates: Partial<Pick<PlotMemory, 'themes' | 'plotPointId'>>
  ): Promise<PlotMemory | null> {
    const plot = this.plotCache.get(id)
    if (!plot) return null

    if (updates.themes !== undefined) plot.themes = updates.themes
    if (updates.plotPointId !== undefined) plot.plotPointId = updates.plotPointId

    this.persistToStorage()
    await this.persistToDB()
    return plot
  }

  /**
   * 删除情节记忆
   */
  async deletePlotMemory(id: string): Promise<boolean> {
    return this.plotCache.delete(id)
  }

  /**
   * 添加伏笔
   */
  async addForeshadowing(
    plotId: string,
    hint: string,
    chapter: number,
    relatedCharacters: string[] = []
  ): Promise<Foreshadowing> {
    const plot = this.plotCache.get(plotId)
    if (!plot) throw new Error(`Plot memory ${plotId} not found`)

    const foreshadowing: Foreshadowing = {
      id: this.generateId('foreshadow'),
      hint,
      chapter,
      status: 'unresolved',
      relatedCharacters,
    }

    plot.foreshadowings.push(foreshadowing)
    this.persistToStorage()
    await this.persistToDB()
    return foreshadowing
  }

  /**
   * 更新伏笔状态
   */
  async updateForeshadowingStatus(
    plotId: string,
    foreshadowingId: string,
    status: 'unresolved' | 'hinted' | 'resolved',
    payoffChapter?: number
  ): Promise<void> {
    const plot = this.plotCache.get(plotId)
    if (!plot) return

    const foreshadowing = plot.foreshadowings.find(f => f.id === foreshadowingId)
    if (foreshadowing) {
      foreshadowing.status = status
      if (payoffChapter !== undefined) {
        foreshadowing.payoffChapter = payoffChapter
      }
      this.persistToStorage()
      await this.persistToDB()
    }
  }

  /**
   * 获取未解决的伏笔
   */
  async getUnresolvedForeshadowings(plotId: string): Promise<Foreshadowing[]> {
    const plot = this.plotCache.get(plotId)
    return plot?.foreshadowings.filter(f => f.status !== 'resolved') || []
  }

  /**
   * 添加主题出现
   */
  async addThemeOccurrence(
    plotId: string,
    theme: string,
    chapter: number,
    manifestation: string,
    intensity: number = 50
  ): Promise<void> {
    const plot = this.plotCache.get(plotId)
    if (!plot) return

    const occurrence: ThemeOccurrence = {
      theme,
      chapter,
      manifestation,
      intensity,
    }

    plot.themeOccurrences.push(occurrence)
    if (!plot.themes.includes(theme)) {
      plot.themes.push(theme)
    }
    this.persistToStorage()
    await this.persistToDB()
  }

  /**
   * 添加冲突记录
   */
  async addConflict(
    plotId: string,
    type: 'internal' | 'external' | 'interpersonal',
    description: string,
    chapter: number
  ): Promise<ConflictRecord> {
    const plot = this.plotCache.get(plotId)
    if (!plot) throw new Error(`Plot memory ${plotId} not found`)

    const conflict: ConflictRecord = {
      id: this.generateId('conflict'),
      type,
      description,
      chapter,
      status: 'active',
    }

    plot.conflicts.push(conflict)
    this.persistToStorage()
    await this.persistToDB()
    return conflict
  }

  /**
   * 更新冲突状态
   */
  async updateConflictStatus(
    plotId: string,
    conflictId: string,
    status: 'active' | 'escalating' | 'resolved',
    resolution?: string
  ): Promise<void> {
    const plot = this.plotCache.get(plotId)
    if (!plot) return

    const conflict = plot.conflicts.find(c => c.id === conflictId)
    if (conflict) {
      conflict.status = status
      if (resolution !== undefined) {
        conflict.resolution = resolution
      }
      this.persistToStorage()
      await this.persistToDB()
    }
  }

  /**
   * 添加线索
   */
  async addClue(
    plotId: string,
    description: string,
    chapter: number,
    importance: 'red herring' | 'minor' | 'key',
    discoveredByCharacters: string[] = []
  ): Promise<Clue> {
    const plot = this.plotCache.get(plotId)
    if (!plot) throw new Error(`Plot memory ${plotId} not found`)

    const clue: Clue = {
      id: this.generateId('clue'),
      description,
      chapter,
      importance,
      revealedToReader: false,
      discoveredByCharacters,
    }

    plot.clues.push(clue)
    this.persistToStorage()
    await this.persistToDB()
    return clue
  }

  /**
   * 获取所有情节记忆
   */
  async getAllPlotMemories(): Promise<PlotMemory[]> {
    return Array.from(this.plotCache.values())
  }

  // ==================== 风格记忆管理 ====================

  /**
   * 创建或获取风格记忆
   */
  async getOrCreateStyleMemory(): Promise<StyleMemory> {
    if (this.styleCache) return this.styleCache

    const style: StyleMemory = {
      id: this.generateId('style'),
      sentencePatterns: [],
      vocabularyPreferences: [],
      dialoguePatterns: [],
      pacingProfile: {
        averageChapterLength: 0,
        dialogueRatio: 0,
        descriptionDensity: 0,
        actionFrequency: 0,
        tensionCurve: [],
      },
      lastUpdated: Date.now(),
      confidence: 0,
    }

    this.styleCache = style
    this.persistToStorage()
    await this.persistToDB()
    return style
  }

  /**
   * 获取风格记忆
   */
  async getStyleMemory(): Promise<StyleMemory | null> {
    return this.styleCache
  }

  /**
   * 添加句子模式
   */
  async addSentencePattern(
    pattern: string,
    example: string,
    chapter: number
  ): Promise<void> {
    const style = await this.getOrCreateStyleMemory()
    const existing = style.sentencePatterns.find(p => p.pattern === pattern)

    if (existing) {
      existing.frequency++
      if (!existing.examples.includes(example)) {
        existing.examples.push(example)
      }
      if (!existing.chapterAppearances.includes(chapter)) {
        existing.chapterAppearances.push(chapter)
      }
    } else {
      style.sentencePatterns.push({
        pattern,
        frequency: 1,
        examples: [example],
        chapterAppearances: [chapter],
      })
    }

    style.lastUpdated = Date.now()
    this.persistToStorage()
    await this.persistToDB()
  }

  /**
   * 添加词汇偏好
   */
  async addVocabularyPreference(
    word: string,
    context: string,
    sentiment: 'positive' | 'neutral' | 'negative'
  ): Promise<void> {
    const style = await this.getOrCreateStyleMemory()
    const existing = style.vocabularyPreferences.find(v => v.word === word)

    if (existing) {
      existing.frequency++
      if (!existing.context.includes(context)) {
        existing.context.push(context)
      }
    } else {
      style.vocabularyPreferences.push({
        word,
        frequency: 1,
        context: [context],
        sentiment,
      })
    }

    style.lastUpdated = Date.now()
    this.persistToStorage()
    await this.persistToDB()
  }

  /**
   * 添加对话模式
   */
  async addDialoguePattern(
    characterId: string,
    speechTraits: string[],
    commonPhrases: string[],
    vocabularyLevel: number = 50,
    formalityLevel: number = 50
  ): Promise<void> {
    const style = await this.getOrCreateStyleMemory()
    const existing = style.dialoguePatterns.find(d => d.characterId === characterId)

    if (existing) {
      speechTraits.forEach(t => {
        if (!existing.speechTraits.includes(t)) {
          existing.speechTraits.push(t)
        }
      })
      commonPhrases.forEach(p => {
        if (!existing.commonPhrases.includes(p)) {
          existing.commonPhrases.push(p)
        }
      })
      existing.vocabularyLevel = vocabularyLevel
      existing.formalityLevel = formalityLevel
    } else {
      style.dialoguePatterns.push({
        characterId,
        speechTraits,
        commonPhrases,
        vocabularyLevel,
        formalityLevel,
      })
    }

    style.lastUpdated = Date.now()
    this.persistToStorage()
    await this.persistToDB()
  }

  /**
   * 更新节奏配置
   */
  async updatePacingProfile(
    pacing: Partial<PacingProfile>
  ): Promise<void> {
    const style = await this.getOrCreateStyleMemory()
    style.pacingProfile = {
      ...style.pacingProfile,
      ...pacing,
    }
    style.lastUpdated = Date.now()
    this.persistToStorage()
    await this.persistToDB()
  }

  /**
   * 更新风格置信度
   */
  async updateStyleConfidence(confidence: number): Promise<void> {
    const style = await this.getOrCreateStyleMemory()
    style.confidence = Math.min(100, Math.max(0, confidence))
    style.lastUpdated = Date.now()
    this.persistToStorage()
    await this.persistToDB()
  }

  // ==================== 时间线管理 ====================

  /**
   * 添加时间线事件
   */
  async addTimelineEvent(
    chapter: number,
    type: 'plot' | 'character' | 'setting',
    description: string,
    participants: string[] = [],
    importance: number = 50
  ): Promise<TimelineEvent> {
    const sequence = this.timelineCache.filter(e => e.chapter === chapter).length

    const event: TimelineEvent = {
      id: this.generateId('timeline'),
      chapter,
      sequence,
      type,
      description,
      participants,
      timestamp: Date.now(),
      importance,
    }

    this.timelineCache.push(event)
    this.timelineCache.sort((a, b) => a.chapter - b.chapter || a.sequence - b.sequence)
    this.persistToStorage()
    await this.persistToDB()
    return event
  }

  /**
   * 获取时间线
   */
  async getTimeline(): Promise<TimelineEvent[]> {
    return [...this.timelineCache]
  }

  /**
   * 按章节获取时间线事件
   */
  async getTimelineByChapter(chapter: number): Promise<TimelineEvent[]> {
    return this.timelineCache.filter(e => e.chapter === chapter)
  }

  /**
   * 删除时间线事件
   */
  async deleteTimelineEvent(id: string): Promise<boolean> {
    const index = this.timelineCache.findIndex(e => e.id === id)
    if (index >= 0) {
      this.timelineCache.splice(index, 1)
      this.persistToStorage()
      await this.persistToDB()
      return true
    }
    return false
  }

  // ==================== 一致性检查接口 ====================

  /**
   * 检查角色一致性
   */
  async checkCharacterConsistency(characterId: string): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = []
    const character = await this.getCharacterMemoryByCharacterId(characterId)
    
    if (!character) return issues

    // 检查角色信念变化的一致性
    for (let i = 1; i < character.beliefChanges.length; i++) {
      const prev = character.beliefChanges[i - 1]
      const curr = character.beliefChanges[i]
      
      // 如果章节号回退，可能存在不一致
      if (curr.chapter < prev.chapter) {
        issues.push({
          type: 'character_state',
          severity: 'minor',
          description: `角色 ${character.name} 的信念变化时间线不一致`,
          existingInfo: `第${prev.chapter}章: ${prev.after}`,
          newInfo: `第${curr.chapter}章: ${curr.before} -> ${curr.after}`,
          suggestion: '检查信念变化的顺序是否正确',
        })
      }
    }

    // 检查成长事件与情感弧的一致性
    const emotionalIntensities = character.emotionalArc.map(e => ({ chapter: e.chapter, intensity: e.intensity }))
    const growthMajorEvents = character.growthLog.filter(g => g.impact === 'major')
    
    for (const growth of growthMajorEvents) {
      const nearEmotion = emotionalIntensities.find(
        e => Math.abs(e.chapter - growth.chapter) <= 1
      )
      if (!nearEmotion) {
        issues.push({
          type: 'character_state',
          severity: 'minor',
          description: `角色 ${character.name} 在第${growth.chapter}章有重大成长但情感弧无对应记录`,
          existingInfo: `成长事件: ${growth.event}`,
          newInfo: '缺少情感变化记录',
          suggestion: '建议添加对应的情感弧记录',
        })
      }
    }

    return issues
  }

  /**
   * 检查情节一致性
   */
  async checkPlotConsistency(plotId: string): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = []
    const plot = this.plotCache.get(plotId)
    
    if (!plot) return issues

    // 检查伏笔的章节顺序
    for (const fs of plot.foreshadowings) {
      if (fs.payoffChapter !== undefined && fs.payoffChapter < fs.chapter) {
        issues.push({
          type: 'plot_logic',
          severity: 'major',
          description: `伏笔 "${fs.hint}" 的回收章节早于埋下章节`,
          existingInfo: `第${fs.chapter}章埋下`,
          newInfo: `第${fs.payoffChapter}章回收`,
          suggestion: '修正伏笔的章节号',
        })
      }
    }

    // 检查线索和冲突的章节一致性
    const clueChapters = new Set(plot.clues.map(c => c.chapter))
    const conflictChapters = new Set(plot.conflicts.map(c => c.chapter))

    // 未解决的冲突但线索已全部揭示
    const unresolvedConflicts = plot.conflicts.filter(c => c.status !== 'resolved')
    for (const conflict of unresolvedConflicts) {
      const cluesBeforeConflict = plot.clues.filter(c => c.chapter <= conflict.chapter)
      const keyClues = cluesBeforeConflict.filter(c => c.importance === 'key')
      
      if (keyClues.length > 0 && !clueChapters.has(conflict.chapter)) {
        // 这是一个潜在问题，但取决于具体情节设计
      }
    }

    return issues
  }

  /**
   * 综合一致性检查
   */
  async checkAllConsistency(): Promise<ConsistencyIssue[]> {
    const allIssues: ConsistencyIssue[] = []

    // 检查所有角色
    for (const character of this.characterCache.values()) {
      const issues = await this.checkCharacterConsistency(character.characterId)
      allIssues.push(...issues)
    }

    // 检查所有情节
    for (const plot of this.plotCache.values()) {
      const issues = await this.checkPlotConsistency(plot.id)
      allIssues.push(...issues)
    }

    return allIssues
  }

  // ==================== 伏笔追踪 ====================

  /**
   * 获取伏笔追踪报告
   */
  async getForeshadowingReport(): Promise<{
    total: number
    unresolved: number
    hinted: number
    resolved: number
    details: Array<{
      hint: string
      plantedChapter: number
      status: string
      payoffChapter?: number
      relatedCharacters: string[]
    }>
  }> {
    let total = 0
    let unresolved = 0
    let hinted = 0
    let resolved = 0
    const details: Array<{
      hint: string
      plantedChapter: number
      status: string
      payoffChapter?: number
      relatedCharacters: string[]
    }> = []

    for (const plot of this.plotCache.values()) {
      for (const fs of plot.foreshadowings) {
        total++
        if (fs.status === 'unresolved') unresolved++
        else if (fs.status === 'hinted') hinted++
        else if (fs.status === 'resolved') resolved++

        details.push({
          hint: fs.hint,
          plantedChapter: fs.chapter,
          status: fs.status,
          payoffChapter: fs.payoffChapter,
          relatedCharacters: fs.relatedCharacters,
        })
      }
    }

    return { total, unresolved, hinted, resolved, details }
  }

  /**
   * 标记伏笔为已暗示
   */
  async markForeshadowingHinted(plotId: string, foreshadowingId: string): Promise<void> {
    await this.updateForeshadowingStatus(plotId, foreshadowingId, 'hinted')
  }

  /**
   * 标记伏笔为已回收
   */
  async markForeshadowingResolved(plotId: string, foreshadowingId: string, payoffChapter: number): Promise<void> {
    await this.updateForeshadowingStatus(plotId, foreshadowingId, 'resolved', payoffChapter)
  }

  // ==================== 清理和导出 ====================

  /**
   * 清理过期记忆
   */
  async cleanupOldMemories(daysOld: number = 90): Promise<number> {
    const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000
    let deleted = 0

    for (const [id, memory] of this.memoryCache.entries()) {
      if (memory.updatedAt < cutoff && memory.accessCount < 3) {
        if (this.memoryCache.delete(id)) {
          deleted++
        }
      }
    }

    if (deleted > 0) {
      this.persistToStorage()
      await this.persistToDB()
    }

    return deleted
  }

  /**
   * 获取记忆统计
   */
  async getMemoryStats(): Promise<{
    totalMemories: number
    characterCount: number
    plotCount: number
    unresolvedForeshadowings: number
    styleConfidence: number
    timelineEvents: number
  }> {
    let unresolvedForeshadowings = 0
    for (const plot of this.plotCache.values()) {
      unresolvedForeshadowings += plot.foreshadowings.filter(f => f.status !== 'resolved').length
    }

    return {
      totalMemories: this.memoryCache.size,
      characterCount: this.characterCache.size,
      plotCount: this.plotCache.size,
      unresolvedForeshadowings,
      styleConfidence: this.styleCache?.confidence || 0,
      timelineEvents: this.timelineCache.length,
    }
  }

  /**
   * 导出所有数据
   */
  async exportAllData(): Promise<MemoryStorageData> {
    return {
      projectId: this.projectId,
      memories: Array.from(this.memoryCache.values()),
      characterMemories: Array.from(this.characterCache.values()),
      plotMemories: Array.from(this.plotCache.values()),
      styleMemory: this.styleCache,
      timeline: this.timelineCache,
      updatedAt: Date.now(),
    }
  }

  /**
   * 导入数据
   */
  async importData(data: MemoryStorageData): Promise<void> {
    this.memoryCache.clear()
    this.characterCache.clear()
    this.plotCache.clear()

    data.memories.forEach(m => this.memoryCache.set(m.id, m))
    data.characterMemories.forEach(c => this.characterCache.set(c.id, c))
    data.plotMemories.forEach(p => this.plotCache.set(p.id, p))
    this.styleCache = data.styleMemory
    this.timelineCache = data.timeline || []

    this.persistToStorage()
    await this.persistToDB()
  }
}

// 单例导出
export const longTermMemoryManager = new LongTermMemoryManager()
export { LongTermMemoryManager }
