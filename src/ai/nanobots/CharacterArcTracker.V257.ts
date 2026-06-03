/**
 * CharacterArcTracker - V257
 * 角色成长弧线追踪引擎
 * 
 * 功能：
 * - 追踪角色在整个故事中的发展弧线
 * - 识别关键转型时刻
 * - 分析角色与其他角色的关系变化
 * - 生成角色发展报告
 */

import type { Lesson } from '../evolution/SelfEvolutionEngine'

// ==================== 类型定义 ====================

/** 角色弧线阶段 */
export type ArcPhase = 'status_quo' | 'inciting_incident' | 'rising_action' | 'climax' | 'falling_action' | 'resolution'

/** 角色弧线转折点 */
export interface ArcMilestone {
  id: string
  chapterId: number
  phase: ArcPhase
  description: string
  emotionalState: string
  internalConflict: string
  externalGoal: string
  timestamp: number
}

/** 角色弧线 */
export interface CharacterArc {
  characterId: string
  characterName: string
  startState: CharacterState
  currentState: CharacterState
  milestones: ArcMilestone[]
  arcType: 'positive' | 'negative' | 'flat' | 'circular'
  transformationScore: number // 0-100
  relationshipArcs: RelationshipArc[]
  createdAt: number
  updatedAt: number
}

/** 角色状态快照 */
export interface CharacterState {
  beliefs: string[]
  goals: string[]
  relationships: Map<string, 'ally' | 'enemy' | 'neutral' | 'romantic'>
  emotionalBaseline: string
  worldview: string
  skillLevel: number
}

/** 关系弧线 */
export interface RelationshipArc {
  targetCharacterId: string
  targetCharacterName: string
  startState: 'ally' | 'enemy' | 'neutral' | 'romantic'
  currentState: 'ally' | 'enemy' | 'neutral' | 'romantic'
  keyEvents: { chapterId: number; description: string; timestamp: number }[]
  trustScore: number // -100 to 100
  conflictScore: number // 0-100
}

/** 章节角色快照 */
export interface ChapterCharacterSnapshot {
  chapterId: number
  characterId: string
  mentions: number
  dialogueRatio: number
  viewpointPercentage: number
  emotionalIndicators: string[]
  goalsPursued: string[]
  relationshipsMentioned: string[]
}

/** 弧线分析结果 */
export interface ArcAnalysis {
  characterId: string
  arcCompleteness: number // 0-100
  pacingConsistency: number // 0-100
  transformationDepth: number // 0-100
  milestoneCount: number
  missingPhases: ArcPhase[]
  flatAreas: { startChapter: number; endChapter: number }[]
  rushAreas: { startChapter: number; endChapter: number }[]
  recommendation: string
}

// ==================== 存储键 ====================

const STORAGE_KEYS = {
  CHARACTER_ARCS: 'ai-novel-character-arcs',
  CHAPTER_SNAPSHOTS: 'ai-novel-chapter-snapshots',
} as const

// ==================== 存储辅助 ====================

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

// ==================== CharacterArcTracker ====================

export class CharacterArcTracker {
  private arcs: Map<string, CharacterArc> = new Map()
  private chapterSnapshots: Map<string, ChapterCharacterSnapshot[]> = new Map()
  private projectId: number

  constructor(projectId: number = 0) {
    this.projectId = projectId
    this.loadFromStorage()
  }

  private loadFromStorage(): void {
    const arcsData = getFromStorage(STORAGE_KEYS.CHARACTER_ARCS, {} as Record<string, CharacterArc>)
    this.arcs = new Map(Object.entries(arcsData))
    
    const snapshotsData = getFromStorage(STORAGE_KEYS.CHAPTER_SNAPSHOTS, {} as Record<string, ChapterCharacterSnapshot[]>)
    this.chapterSnapshots = new Map(Object.entries(snapshotsData))
  }

  private persist(): void {
    const arcsObj = Object.fromEntries(this.arcs)
    saveToStorage(STORAGE_KEYS.CHARACTER_ARCS, arcsObj)
    
    const snapshotsObj = Object.fromEntries(this.chapterSnapshots)
    saveToStorage(STORAGE_KEYS.CHAPTER_SNAPSHOTS, snapshotsObj)
  }

  // ==================== 核心方法 ====================

  /**
   * 初始化角色弧线
   */
  initCharacterArc(
    characterId: string,
    characterName: string,
    initialState: Partial<CharacterState>
  ): CharacterArc {
    const now = Date.now()
    
    const defaultState: CharacterState = {
      beliefs: initialState.beliefs || ['相信真善美'],
      goals: initialState.goals || ['实现自我价值'],
      relationships: initialState.relationships || new Map(),
      emotionalBaseline: initialState.emotionalBaseline || '平静',
      worldview: initialState.worldview || '世界是美好的',
      skillLevel: initialState.skillLevel || 50,
    }

    const arc: CharacterArc = {
      characterId,
      characterName,
      startState: defaultState,
      currentState: { ...defaultState },
      milestones: [],
      arcType: 'positive',
      transformationScore: 0,
      relationshipArcs: [],
      createdAt: now,
      updatedAt: now,
    }

    this.arcs.set(characterId, arc)
    this.persist()
    return arc
  }

  /**
   * 添加里程碑/转型时刻
   */
  addMilestone(
    characterId: string,
    chapterId: number,
    phase: ArcPhase,
    description: string,
    emotionalState: string,
    internalConflict: string,
    externalGoal: string
  ): ArcMilestone | null {
    const arc = this.arcs.get(characterId)
    if (!arc) return null

    const milestone: ArcMilestone = {
      id: `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chapterId,
      phase,
      description,
      emotionalState,
      internalConflict,
      externalGoal,
      timestamp: Date.now(),
    }

    arc.milestones.push(milestone)
    arc.updatedAt = Date.now()
    this.persist()
    return milestone
  }

  /**
   * 更新角色当前状态
   */
  updateCharacterState(
    characterId: string,
    newState: Partial<CharacterState>
  ): CharacterState | null {
    const arc = this.arcs.get(characterId)
    if (!arc) return null

    if (newState.beliefs) arc.currentState.beliefs = newState.beliefs
    if (newState.goals) arc.currentState.goals = newState.goals
    if (newState.emotionalBaseline) arc.currentState.emotionalBaseline = newState.emotionalBaseline
    if (newState.worldview) arc.currentState.worldview = newState.worldview
    if (newState.skillLevel !== undefined) arc.currentState.skillLevel = newState.skillLevel
    
    if (newState.relationships) {
      arc.currentState.relationships = new Map([
        ...arc.currentState.relationships,
        ...newState.relationships,
      ])
    }

    arc.updatedAt = Date.now()
    this.persist()
    return arc.currentState
  }

  /**
   * 记录关系变化
   */
  recordRelationshipChange(
    characterId: string,
    targetCharacterId: string,
    targetCharacterName: string,
    chapterId: number,
    eventDescription: string,
    newRelationshipState: 'ally' | 'enemy' | 'neutral' | 'romantic'
  ): RelationshipArc | null {
    const arc = this.arcs.get(characterId)
    if (!arc) return null

    let relArc = arc.relationshipArcs.find(r => r.targetCharacterId === targetCharacterId)
    
    if (!relArc) {
      relArc = {
        targetCharacterId,
        targetCharacterName,
        startState: 'neutral',
        currentState: 'neutral',
        keyEvents: [],
        trustScore: 0,
        conflictScore: 0,
      }
      arc.relationshipArcs.push(relArc)
    }

    const prevState = relArc.currentState
    relArc.keyEvents.push({
      chapterId,
      description: eventDescription,
      timestamp: Date.now(),
    })
    relArc.currentState = newRelationshipState

    // 更新信任分数
    if (newRelationshipState === 'ally') {
      relArc.trustScore = Math.min(100, relArc.trustScore + 20)
    } else if (newRelationshipState === 'enemy') {
      relArc.trustScore = Math.max(-100, relArc.trustScore - 30)
      relArc.conflictScore = Math.min(100, relArc.conflictScore + 20)
    } else if (newRelationshipState === 'romantic') {
      relArc.trustScore = Math.min(100, relArc.trustScore + 25)
    }

    arc.updatedAt = Date.now()
    this.persist()
    return relArc
  }

  /**
   * 设置弧线类型
   */
  setArcType(characterId: string, arcType: 'positive' | 'negative' | 'flat' | 'circular'): boolean {
    const arc = this.arcs.get(characterId)
    if (!arc) return false

    arc.arcType = arcType
    arc.updatedAt = Date.now()
    this.persist()
    return true
  }

  /**
   * 记录章节快照
   */
  recordChapterSnapshot(snapshot: ChapterCharacterSnapshot): void {
    const key = `ch${snapshot.chapterId}`
    const existing = this.chapterSnapshots.get(key) || []
    
    const existingIdx = existing.findIndex(s => s.characterId === snapshot.characterId)
    if (existingIdx >= 0) {
      existing[existingIdx] = snapshot
    } else {
      existing.push(snapshot)
    }
    
    this.chapterSnapshots.set(key, existing)
    this.persist()
  }

  /**
   * 计算角色转型分数
   */
  calculateTransformationScore(characterId: string): number {
    const arc = this.arcs.get(characterId)
    if (!arc) return 0

    let score = 0

    // 基于里程碑数量
    score += Math.min(30, arc.milestones.length * 5)

    // 基于信念变化
    const beliefChanges = arc.milestones.filter(m => 
      m.internalConflict.includes('信念') || m.internalConflict.includes('世界观')
    ).length
    score += beliefChanges * 15

    // 基于关系变化
    const relationshipChanges = arc.relationshipArcs.reduce((sum, r) => sum + r.keyEvents.length, 0)
    score += Math.min(25, relationshipChanges * 5)

    // 基于技能提升
    const skillDiff = arc.currentState.skillLevel - arc.startState.skillLevel
    score += Math.min(20, Math.max(0, skillDiff / 5))

    return Math.min(100, score)
  }

  // ==================== 分析方法 ====================

  /**
   * 全面分析角色弧线
   */
  analyzeArc(characterId: string): ArcAnalysis | null {
    const arc = this.arcs.get(characterId)
    if (!arc) return null

    const allPhases: ArcPhase[] = ['status_quo', 'inciting_incident', 'rising_action', 'climax', 'falling_action', 'resolution']
    const coveredPhases = new Set(arc.milestones.map(m => m.phase))
    const missingPhases = allPhases.filter(p => !coveredPhases.has(p))

    // 计算完整性
    const arcCompleteness = Math.round((1 - missingPhases.length / allPhases.length) * 100)

    // 检测平坦区域和 rush 区域
    const sortedMilestones = [...arc.milestones].sort((a, b) => a.chapterId - b.chapterId)
    const flatAreas: { startChapter: number; endChapter: number }[] = []
    const rushAreas: { startChapter: number; endChapter: number }[] = []

    for (let i = 1; i < sortedMilestones.length; i++) {
      const gap = sortedMilestones[i].chapterId - sortedMilestones[i - 1].chapterId
      if (gap > 10) {
        flatAreas.push({
          startChapter: sortedMilestones[i - 1].chapterId,
          endChapter: sortedMilestones[i].chapterId,
        })
      } else if (gap <= 2 && sortedMilestones[i].phase !== sortedMilestones[i - 1].phase) {
        // 相邻里程碑但相位变化太快
      }
    }

    // 简化计算
    const pacingConsistency = arcCompleteness > 80 ? 85 : arcCompleteness > 60 ? 70 : 55
    const transformationDepth = this.calculateTransformationScore(characterId)

    let recommendation = ''
    if (missingPhases.length > 0) {
      recommendation += `缺失阶段: ${missingPhases.join(', ')}。`
    }
    if (flatAreas.length > 0) {
      recommendation += `平坦区域: 第${flatAreas[0].startChapter}-${flatAreas[0].endChapter}章。`
    }
    if (transformationDepth < 50) {
      recommendation += '角色转型深度不足，建议增加内心冲突。'
    }

    return {
      characterId,
      arcCompleteness,
      pacingConsistency,
      transformationDepth,
      milestoneCount: arc.milestones.length,
      missingPhases,
      flatAreas,
      rushAreas,
      recommendation: recommendation || '弧线完整度良好',
    }
  }

  /**
   * 获取角色在特定章节的状态
   */
  getCharacterStateAtChapter(characterId: string, chapterId: number): CharacterState | null {
    const arc = this.arcs.get(characterId)
    if (!arc) return null

    const snapshots = this.chapterSnapshots.get(`ch${chapterId}`)
    if (!snapshots) {
      return arc.currentState
    }

    const snapshot = snapshots.find(s => s.characterId === characterId)
    if (!snapshot) {
      return arc.currentState
    }

    // 基于快照推断状态（简化实现）
    return {
      beliefs: arc.currentState.beliefs,
      goals: snapshot.goalsPursued.length > 0 ? snapshot.goalsPursued : arc.currentState.goals,
      relationships: arc.currentState.relationships,
      emotionalBaseline: snapshot.emotionalIndicators[0] || arc.currentState.emotionalBaseline,
      worldview: arc.currentState.worldview,
      skillLevel: arc.currentState.skillLevel,
    }
  }

  /**
   * 获取关系弧线
   */
  getRelationshipArc(characterId: string, targetCharacterId: string): RelationshipArc | null {
    const arc = this.arcs.get(characterId)
    if (!arc) return null
    return arc.relationshipArcs.find(r => r.targetCharacterId === targetCharacterId) || null
  }

  /**
   * 获取所有角色弧线摘要
   */
  getArcSummaries(): Array<{
    characterId: string
    characterName: string
    arcType: string
    milestoneCount: number
    transformationScore: number
    relationshipCount: number
  }> {
    return Array.from(this.arcs.values()).map(arc => ({
      characterId: arc.characterId,
      characterName: arc.characterName,
      arcType: arc.arcType,
      milestoneCount: arc.milestones.length,
      transformationScore: this.calculateTransformationScore(arc.characterId),
      relationshipCount: arc.relationshipArcs.length,
    }))
  }

  // ==================== 获取方法 ====================

  getArc(characterId: string): CharacterArc | undefined {
    return this.arcs.get(characterId)
  }

  getAllArcs(): CharacterArc[] {
    return Array.from(this.arcs.values())
  }

  getChapterSnapshots(chapterId: number): ChapterCharacterSnapshot[] {
    return this.chapterSnapshots.get(`ch${chapterId}`) || []
  }

  // ==================== 结晶集成 ====================

  /**
   * 从角色弧线结晶为 Lesson
   */
  async crystallizeToLesson(projectId: number, characterId: string): Promise<Lesson | null> {
    const arc = this.arcs.get(characterId)
    if (!arc || arc.milestones.length < 3) return null

    const analysis = this.analyzeArc(characterId)
    if (!analysis || analysis.arcCompleteness < 60) return null

    const lesson: Omit<Lesson, 'id' | 'createdAt'> = {
      task: `character_arc_${characterId}`,
      approach: `角色弧线完整度${analysis.arcCompleteness}%，转型深度${analysis.transformationDepth}%。关键里程碑: ${arc.milestones.length}个。`,
      outcome: analysis.arcCompleteness > 80 ? 'success' : 'failure',
      context: {
        score: analysis.arcCompleteness / 100,
        chapterId: arc.milestones[arc.milestones.length - 1].chapterId,
        transformationScore: analysis.transformationDepth,
      },
    }

    return lesson
  }
}

// 导出单例
export const characterArcTracker = new CharacterArcTracker()