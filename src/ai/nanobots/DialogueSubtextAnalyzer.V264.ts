/**
 * DialogueSubtextAnalyzer - V264
 * 对话潜文本分析引擎
 * 
 * 功能：
 * - 分析对话的字面意义与潜文本含义
 * - 识别言外之意和暗示
 * - 追踪角色之间的关系动态
 * - 检测未说出口的冲突和紧张
 */

import type { Lesson } from '../evolution/SelfEvolutionEngine'

// ==================== 类型定义 ====================

/** 潜文本类型 */
export type SubtextType =
  | 'sarcasm'           // 讽刺
  | 'understatement'    // 含蓄陈述
  | 'omission'          // 刻意省略
  | 'euphemism'         // 委婉说法
  | 'deflection'        // 转移话题
  | 'passive_aggressive' // 消极攻击
  | 'manipulation'      // 操控暗示
  | 'hidden_threat'     // 隐藏威胁
  | 'romantic_tension'  // 情感暗流
  | 'fear_hidden'       // 隐藏恐惧
  | 'hope_concealed'    // 隐藏希望
  | 'confession_masked'  // 变相表白

/** 潜文本分析点 */
export interface SubtextPoint {
  id: string
  dialogueId: string
  characterId: string
  characterName: string
  literalText: string
  subtextContent: string
  subtextType: SubtextType
  intensity: number // 0-100
  triggers: string[]
  emotionalUndercurrent: string
  relationalContext: string
  chapterId: number
  timestamp: number
}

/** 对话分析记录 */
export interface DialogueAnalysis {
  id: string
  chapterId: number
  speakerId: string
  speakerName: string
  listenerId: string
  listenerName: string
  literalContent: string
  surfaceTone: 'friendly' | 'neutral' | 'hostile' | 'romantic' | 'formal'
  subtextPoints: SubtextPoint[]
  hasSubtext: boolean
  tensionLevel: number // 0-100
  relationshipImpact: 'positive' | 'negative' | 'neutral' | 'complex'
  timestamp: number
}

/** 角色对话关系动态 */
export interface DialogueDynamics {
  characterId: string
  partnerId: string
  dialogueCount: number
  subtextFrequency: number // 0-100
  dominantSubtextTypes: SubtextType[]
  tensionTrends: 'increasing' | 'decreasing' | 'stable' | 'fluctuating'
  unresolvedSubtexts: string[] // IDs of unresolved subtext points
  hiddenConflictScore: number // 0-100
  intimacyLevel: number // 0-100
  lastExchange: number
}

/** 章节潜文本摘要 */
export interface ChapterSubtextSummary {
  chapterId: number
  totalDialogues: number
  dialoguesWithSubtext: number
  subtextDensity: number // 0-100
  dominantTone: SubtextType | 'none'
  relationshipTensionPoints: { characterA: string; characterB: string; tension: number }[]
  hiddenConflicts: { characters: string[]; description: string; severity: number }[]
  recommendations: string[]
}

/** 整体分析结果 */
export interface SubtextAnalysisResult {
  projectId: number
  chapterSummaries: ChapterSubtextSummary[]
  characterDynamics: DialogueDynamics[]
  overallSubtextDensity: number // 0-100
  relationalTensionMap: Map<string, number>
  hiddenConflictHotspots: { chapterId: number; description: string; involvedCharacters: string[] }[]
  recommendations: string[]
  createdAt: number
  updatedAt: number
}

// ==================== 存储键 ====================

const STORAGE_KEYS = {
  DIALOGUE_ANALYSES: 'ai-novel-dialogue-analyses',
  SUBTEXT_POINTS: 'ai-novel-subtext-points',
  DIALOGUE_DYNAMICS: 'ai-novel-dialogue-dynamics',
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

// ==================== 工具函数 ====================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function clampIntensity(value: number): number {
  return Math.max(0, Math.min(100, value))
}

// ==================== 潜文本模式识别 ====================

/** 潜文本模式定义 */
interface SubtextPattern {
  type: SubtextType
  indicators: RegExp[]
  emotionalMarkers: string[]
}

const SUBTEXT_PATTERNS: SubtextPattern[] = [
  {
    type: 'sarcasm',
    indicators: [
      /哦?太棒了/i,
      /真是?好极了/i,
      /呵/i,
      /哇哦/i,
      /没错/i,
    ],
    emotionalMarkers: ['讽刺', '嘲讽', '不屑'],
  },
  {
    type: 'understatement',
    indicators: [
      /还好吧/i,
      /还行/i,
      /一般/i,
      /凑合/i,
      /没什么/i,
    ],
    emotionalMarkers: ['隐藏不满', '压抑', '克制'],
  },
  {
    type: 'omission',
    indicators: [
      /^算了$/i,
      /^别提了$/i,
      /^没什么$/i,
      /^无所谓$/i,
    ],
    emotionalMarkers: ['回避', '隐瞒', '保护'],
  },
  {
    type: 'euphemism',
    indicators: [
      /我们?需要谈谈/i,
      /说实话/i,
      /委婉/i,
    ],
    emotionalMarkers: ['暗示', '转接', '缓和'],
  },
  {
    type: 'deflection',
    indicators: [
      /^换个话题$/i,
      /^说起来$/i,
      /^对了$/i,
    ],
    emotionalMarkers: ['逃避', '转移', '回避'],
  },
  {
    type: 'passive_aggressive',
    indicators: [
      /随你便/i,
      /你开心就好/i,
      /随便/i,
      /爱怎样怎样/i,
    ],
    emotionalMarkers: ['不满', '压抑愤怒', '消极抵抗'],
  },
  {
    type: 'manipulation',
    indicators: [
      /你不会是想.*吧/i,
      /我想.*你应该/i,
      /你最好.*?/i,
    ],
    emotionalMarkers: ['操控', '施压', '诱导'],
  },
  {
    type: 'hidden_threat',
    indicators: [
      /小心.*后果/i,
      /你会后悔/i,
      /走着瞧/i,
      /后果自负/i,
    ],
    emotionalMarkers: ['威胁', '警告', '施压'],
  },
  {
    type: 'romantic_tension',
    indicators: [
      /你.*的时候.*很.*/i,
      /其实.*还好/i,
      /你.*我想.*/i,
    ],
    emotionalMarkers: ['暧昧', '隐藏情感', '试探'],
  },
  {
    type: 'fear_hidden',
    indicators: [
      /不用担心/i,
      /应该没问题/i,
      /我不怕/i,
    ],
    emotionalMarkers: ['恐惧', '掩饰', '自我安慰'],
  },
  {
    type: 'hope_concealed',
    indicators: [
      /也许.*会.*/i,
      /说不定/i,
      /没准/i,
    ],
    emotionalMarkers: ['希望', '期待', '压抑的渴望'],
  },
  {
    type: 'confession_masked',
    indicators: [
      /如果.*你会.*/i,
      /假如.*我想说/i,
      /其实我一直想说/i,
    ],
    emotionalMarkers: ['表白', '隐藏情感', '试探'],
  },
]

// ==================== DialogueSubtextAnalyzer ====================

export class DialogueSubtextAnalyzer {
  private analyses: Map<string, DialogueAnalysis> = new Map()
  private subtextPoints: Map<string, SubtextPoint> = new Map()
  private dynamics: Map<string, DialogueDynamics> = new Map()
  private projectId: number

  constructor(projectId: number = 0) {
    this.projectId = projectId
    this.loadFromStorage()
  }

  private loadFromStorage(): void {
    const analysesData = getFromStorage(STORAGE_KEYS.DIALOGUE_ANALYSES, {} as Record<string, DialogueAnalysis>)
    this.analyses = new Map(Object.entries(analysesData))

    const pointsData = getFromStorage(STORAGE_KEYS.SUBTEXT_POINTS, {} as Record<string, SubtextPoint>)
    this.subtextPoints = new Map(Object.entries(pointsData))

    const dynamicsData = getFromStorage(STORAGE_KEYS.DIALOGUE_DYNAMICS, {} as Record<string, DialogueDynamics>)
    this.dynamics = new Map(Object.entries(dynamicsData))
  }

  private persist(): void {
    const analysesObj = Object.fromEntries(this.analyses)
    saveToStorage(STORAGE_KEYS.DIALOGUE_ANALYSES, analysesObj)

    const pointsObj = Object.fromEntries(this.subtextPoints)
    saveToStorage(STORAGE_KEYS.SUBTEXT_POINTS, pointsObj)

    const dynamicsObj = Object.fromEntries(this.dynamics)
    saveToStorage(STORAGE_KEYS.DIALOGUE_DYNAMICS, dynamicsObj)
  }

  // ==================== 核心方法 ====================

  /**
   * 分析对话中的潜文本
   */
  analyzeDialogue(
    chapterId: number,
    speakerId: string,
    speakerName: string,
    listenerId: string,
    listenerName: string,
    literalContent: string,
    surfaceTone: DialogueAnalysis['surfaceTone'] = 'neutral'
  ): DialogueAnalysis {
    const id = generateId()
    const now = Date.now()

    const subtextPoints = this.detectSubtext(literalContent, id, speakerId, speakerName, chapterId, listenerId, listenerName)

    const hasSubtext = subtextPoints.length > 0
    const tensionLevel = this.calculateTensionLevel(subtextPoints, surfaceTone)
    const relationshipImpact = this.determineRelationshipImpact(subtextPoints, surfaceTone)

    const analysis: DialogueAnalysis = {
      id,
      chapterId,
      speakerId,
      speakerName,
      listenerId,
      listenerName,
      literalContent,
      surfaceTone,
      subtextPoints,
      hasSubtext,
      tensionLevel,
      relationshipImpact,
      timestamp: now,
    }

    this.analyses.set(id, analysis)

    // Update dynamics
    this.updateDynamics(speakerId, listenerId, subtextPoints, tensionLevel)

    this.persist()
    return analysis
  }

  /**
   * 检测潜文本点
   */
  private detectSubtext(
    text: string,
    dialogueId: string,
    characterId: string,
    characterName: string,
    chapterId: number,
    listenerId: string,
    listenerName: string
  ): SubtextPoint[] {
    const points: SubtextPoint[] = []

    for (const pattern of SUBTEXT_PATTERNS) {
      for (const indicator of pattern.indicators) {
        if (indicator.test(text)) {
          const point = this.createSubtextPoint(
            dialogueId,
            characterId,
            characterName,
            text,
            pattern.type,
            pattern.emotionalMarkers,
            chapterId
          )
          points.push(point)
          break
        }
      }
    }

    // General subtext detection based on context hints
    if (points.length === 0 && this.hasImplicitSubtext(text)) {
      const inferredType = this.inferSubtextType(text)
      if (inferredType) {
        const point = this.createSubtextPoint(
          dialogueId,
          characterId,
          characterName,
          text,
          inferredType,
          ['隐含意图', '模糊表达'],
          chapterId
        )
        points.push(point)
      }
    }

    return points
  }

  /**
   * 创建潜文本点
   */
  private createSubtextPoint(
    dialogueId: string,
    characterId: string,
    characterName: string,
    literalText: string,
    subtextType: SubtextType,
    emotionalMarkers: string[],
    chapterId: number
  ): SubtextPoint {
    const id = generateId()

    const subtextContent = this.generateSubtextContent(subtextType, literalText)
    const intensity = this.calculateSubtextIntensity(subtextType, literalText)
    const emotionalUndercurrent = emotionalMarkers.join('、')
    const relationalContext = this.generateRelationalContext(subtextType, characterName)

    const point: SubtextPoint = {
      id,
      dialogueId,
      characterId,
      characterName,
      literalText,
      subtextContent,
      subtextType,
      intensity,
      triggers: emotionalMarkers,
      emotionalUndercurrent,
      relationalContext,
      chapterId,
      timestamp: Date.now(),
    }

    this.subtextPoints.set(id, point)
    return point
  }

  /**
   * 生成潜文本内容
   */
  private generateSubtextContent(type: SubtextType, literal: string): string {
    const contents: Record<SubtextType, string> = {
      sarcasm: `讽刺：说"${literal}"实际上在嘲讽对方`,
      understatement: `含蓄：表面说"${literal}"实际上表达了不满`,
      omission: `省略："${literal}"刻意回避了真正想说的话`,
      euphemism: `委婉："${literal}"用缓和的方式表达敏感内容`,
      deflection: `转移：用"${literal}"来回避当前话题`,
      passive_aggressive: `消极攻击："${literal}"表面配合实则抵抗`,
      manipulation: `操控："${literal}"试图影响对方决策`,
      hidden_threat: `隐藏威胁："${literal}"暗含警告或施压`,
      romantic_tension: `情感暗流："${literal}"暗示了隐藏的情感`,
      fear_hidden: `隐藏恐惧："${literal}"掩饰内心的不安`,
      hope_concealed: `隐藏希望："${literal}"透露了内心期待`,
      confession_masked: `变相表白："${literal}"用间接方式表达情感`,
    }
    return contents[type] || `潜文本："${literal}"包含未明说的含义`
  }

  /**
   * 计算潜文本强度
   */
  private calculateSubtextIntensity(type: SubtextType, literal: string): number {
    let base = 50

    switch (type) {
      case 'hidden_threat':
      case 'manipulation':
        base = 75
        break
      case 'sarcasm':
      case 'passive_aggressive':
        base = 65
        break
      case 'romantic_tension':
      case 'confession_masked':
        base = 70
        break
      case 'fear_hidden':
      case 'hope_concealed':
        base = 55
        break
      default:
        base = 60
    }

    // Adjust by text length (shorter often more intense)
    const lengthFactor = Math.max(0.5, Math.min(1, literal.length / 50))

    return clampIntensity(base * lengthFactor)
  }

  /**
   * 生成关系上下文
   */
  private generateRelationalContext(type: SubtextType, characterName: string): string {
    const contexts: Record<SubtextType, string> = {
      sarcasm: `${characterName}对对方持批评或不满态度`,
      understatement: `${characterName}压抑着不满情绪`,
      omission: `${characterName}有意隐瞒或保护什么`,
      euphemism: `${characterName}试图缓和当前局面`,
      deflection: `${characterName}不想直面问题`,
      passive_aggressive: `${characterName}用消极方式表达反抗`,
      manipulation: `${characterName}试图获取控制权`,
      hidden_threat: `${characterName}在对对方施压`,
      romantic_tension: `${characterName}对对方有隐藏情感`,
      fear_hidden: `${characterName}内心存在不安`,
      hope_concealed: `${characterName}对未来抱有期待`,
      confession_masked: `${characterName}想表达却又犹豫`,
    }
    return contexts[type] || `${characterName}的言行有深层含义`
  }

  /**
   * 检查是否有隐含潜文本
   */
  private hasImplicitSubtext(text: string): boolean {
    // Check for ellipsis, trailing停顿, or unusual phrasing
    const implicitPatterns = [
      /\.\.\./,           // ellipsis
      /[，。]\s*$/,        // trailing pause
      /其实.*[，。]/,      // "actually..." patterns
      /不过.*[，。]/,      // "however..." patterns
      /只是.*[，。]/,      // "just..." patterns
    ]

    return implicitPatterns.some(p => p.test(text))
  }

  /**
   * 推断潜文本类型
   */
  private inferSubtextType(text: string): SubtextType | null {
    if (/\.\.\.|其实|不过|只是/.test(text)) return 'omission'
    if (/也许|说不定|没准/.test(text)) return 'hope_concealed'
    if (/不用担心|应该没问题/.test(text)) return 'fear_hidden'
    if (/我想你.*应该|你最好/.test(text)) return 'manipulation'
    return null
  }

  /**
   * 计算张力级别
   */
  private calculateTensionLevel(subtextPoints: SubtextPoint[], surfaceTone: string): number {
    if (subtextPoints.length === 0) return 0

    const avgIntensity = subtextPoints.reduce((sum, p) => sum + p.intensity, 0) / subtextPoints.length

    let toneModifier = 0
    switch (surfaceTone) {
      case 'hostile':
        toneModifier = 20
        break
      case 'romantic':
        toneModifier = 15
        break
      case 'neutral':
        toneModifier = 0
        break
      default:
        toneModifier = -10
    }

    return clampIntensity(avgIntensity + toneModifier)
  }

  /**
   * 确定关系影响
   */
  private determineRelationshipImpact(subtextPoints: SubtextPoint[], surfaceTone: string): DialogueAnalysis['relationshipImpact'] {
    const hasNegative = subtextPoints.some(p =>
      ['sarcasm', 'passive_aggressive', 'hidden_threat', 'manipulation'].includes(p.subtextType)
    )
    const hasPositive = subtextPoints.some(p =>
      ['romantic_tension', 'confession_masked'].includes(p.subtextType)
    )

    if (hasNegative && hasPositive) return 'complex'
    if (hasNegative) return 'negative'
    if (hasPositive) return 'positive'
    return 'neutral'
  }

  /**
   * 更新对话动态
   */
  private updateDynamics(characterId: string, partnerId: string, subtextPoints: SubtextPoint[], tensionLevel: number): void {
    const key = `${characterId}:${partnerId}`

    let dynamics = this.dynamics.get(key)
    if (!dynamics) {
      dynamics = {
        characterId,
        partnerId,
        dialogueCount: 0,
        subtextFrequency: 0,
        dominantSubtextTypes: [],
        tensionTrends: 'stable',
        unresolvedSubtexts: [],
        hiddenConflictScore: 0,
        intimacyLevel: 50,
        lastExchange: Date.now(),
      }
    }

    dynamics.dialogueCount++

    if (subtextPoints.length > 0) {
      dynamics.subtextFrequency = clampIntensity(
        (dynamics.subtextFrequency * (dynamics.dialogueCount - 1) + 80) / dynamics.dialogueCount
      )

      const types = subtextPoints.map(p => p.subtextType)
      const typeCount = types.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      dynamics.dominantSubtextTypes = Object.entries(typeCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type]) => type as SubtextType)

      dynamics.hiddenConflictScore = clampIntensity(
        (dynamics.hiddenConflictScore + subtextPoints.filter(p =>
          ['sarcasm', 'hidden_threat', 'manipulation', 'passive_aggressive'].includes(p.subtextType)
        ).length * 15) / 2
      )
    }

    dynamics.intimacyLevel = clampIntensity(
      dynamics.intimacyLevel + (tensionLevel > 30 ? 2 : -1)
    )

    dynamics.lastExchange = Date.now()

    this.dynamics.set(key, dynamics)
  }

  // ==================== 查询方法 ====================

  /**
   * 获取章节潜文本摘要
   */
  getChapterSubtextSummary(chapterId: number): ChapterSubtextSummary {
    const chapterAnalyses = Array.from(this.analyses.values()).filter(a => a.chapterId === chapterId)

    const totalDialogues = chapterAnalyses.length
    const dialoguesWithSubtext = chapterAnalyses.filter(a => a.hasSubtext).length
    const subtextDensity = totalDialogues > 0 ? (dialoguesWithSubtext / totalDialogues) * 100 : 0

    // Find dominant subtext type
    const allSubtextTypes = chapterAnalyses.flatMap(a => a.subtextPoints.map(p => p.subtextType))
    const typeCount = allSubtextTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const dominantTone = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] as SubtextType || 'none'

    // Build relationship tension points
    const relationshipTensionPoints: ChapterSubtextSummary['relationshipTensionPoints'] = []
    const tensionByPair = new Map<string, number>()
    for (const analysis of chapterAnalyses) {
      const key = `${analysis.speakerId}:${analysis.listenerId}`
      tensionByPair.set(key, (tensionByPair.get(key) || 0) + analysis.tensionLevel)
    }
    for (const [key, tension] of tensionByPair) {
      const [speakerId, listenerId] = key.split(':')
      relationshipTensionPoints.push({ characterA: speakerId, characterB: listenerId, tension })
    }

    // Build hidden conflicts
    const hiddenConflicts: ChapterSubtextSummary['hiddenConflicts'] = []
    const conflictByPair = new Map<string, { description: string; severity: number; characters: string[] }>()
    for (const analysis of chapterAnalyses) {
      if (['sarcasm', 'hidden_threat', 'manipulation', 'passive_aggressive'].some(t =>
        analysis.subtextPoints.some(p => p.subtextType === t)
      )) {
        const key = `${analysis.speakerId}:${analysis.listenerId}`
        const existing = conflictByPair.get(key)
        if (!existing) {
          conflictByPair.set(key, {
            description: `${analysis.speakerName}与${analysis.listenerName}存在未解决的冲突`,
            severity: analysis.tensionLevel,
            characters: [analysis.speakerId, analysis.listenerId],
          })
        } else {
          existing.severity = Math.max(existing.severity, analysis.tensionLevel)
        }
      }
    }
    for (const conflict of conflictByPair.values()) {
      hiddenConflicts.push(conflict)
    }

    // Generate recommendations
    const recommendations: string[] = []
    if (subtextDensity > 70) {
      recommendations.push('当前章节潜文本密度较高，建议适当增加表面友好的对话来平衡')
    }
    if (hiddenConflicts.length > 2) {
      recommendations.push('存在多个隐藏冲突点，考虑在后续章节中逐步揭示或解决')
    }
    if (dominantTone === 'sarcasm' || dominantTone === 'passive_aggressive') {
      recommendations.push('对话中讽刺和消极攻击较多，可能影响读者体验，建议适度调整')
    }

    return {
      chapterId,
      totalDialogues,
      dialoguesWithSubtext,
      subtextDensity,
      dominantTone,
      relationshipTensionPoints,
      hiddenConflicts,
      recommendations,
    }
  }

  /**
   * 获取角色对话动态
   */
  getCharacterDialogueDynamics(characterId: string, partnerId: string): DialogueDynamics | null {
    const key = `${characterId}:${partnerId}`
    return this.dynamics.get(key) || null
  }

  /**
   * 获取所有角色动态
   */
  getAllCharacterDynamics(): DialogueDynamics[] {
    return Array.from(this.dynamics.values())
  }

  /**
   * 获取对话分析记录
   */
  getDialogueAnalysis(id: string): DialogueAnalysis | null {
    return this.analyses.get(id) || null
  }

  /**
   * 获取章节所有对话
   */
  getChapterDialogues(chapterId: number): DialogueAnalysis[] {
    return Array.from(this.analyses.values()).filter(a => a.chapterId === chapterId)
  }

  /**
   * 获取潜文本点
   */
  getSubtextPoint(id: string): SubtextPoint | null {
    return this.subtextPoints.get(id) || null
  }

  /**
   * 获取完整的分析结果
   */
  getFullAnalysis(projectId: number): SubtextAnalysisResult {
    const chapterIds = [...new Set(Array.from(this.analyses.values()).map(a => a.chapterId))]
    const chapterSummaries = chapterIds.map(id => this.getChapterSubtextSummary(id))
    const characterDynamics = this.getAllCharacterDynamics()

    const overallSubtextDensity = chapterSummaries.length > 0
      ? chapterSummaries.reduce((sum, s) => sum + s.subtextDensity, 0) / chapterSummaries.length
      : 0

    // Build relational tension map
    const relationalTensionMap = new Map<string, number>()
    for (const dynamics of characterDynamics) {
      const key = `${dynamics.characterId}:${dynamics.partnerId}`
      relationalTensionMap.set(key, dynamics.hiddenConflictScore)
    }

    // Find hidden conflict hotspots
    const hiddenConflictHotspots: SubtextAnalysisResult['hiddenConflictHotspots'] = []
    for (const summary of chapterSummaries) {
      for (const conflict of summary.hiddenConflicts) {
        hiddenConflictHotspots.push({
          chapterId: summary.chapterId,
          description: conflict.description,
          involvedCharacters: conflict.characters,
        })
      }
    }

    // Generate recommendations
    const recommendations: string[] = []
    if (overallSubtextDensity < 30) {
      recommendations.push('整体潜文本密度偏低，可以考虑增加更多含蓄的对话来增加深度')
    }

    const avgConflict = characterDynamics.length > 0
      ? characterDynamics.reduce((sum, d) => sum + d.hiddenConflictScore, 0) / characterDynamics.length
      : 0
    if (avgConflict > 60) {
      recommendations.push('角色间隐藏冲突整体偏高，需要关注冲突是否得到适当解决')
    }

    return {
      projectId,
      chapterSummaries,
      characterDynamics,
      overallSubtextDensity,
      relationalTensionMap,
      hiddenConflictHotspots,
      recommendations,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }

  /**
   * 清除项目数据
   */
  clearProjectData(): void {
    this.analyses.clear()
    this.subtextPoints.clear()
    this.dynamics.clear()
    this.persist()
  }
}

// ==================== 导出 ====================