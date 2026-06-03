/**
 * NarrativePacingHeatmap - V266
 * 叙事节奏热力图引擎
 * 
 * 功能：
 * - 生成立体化的叙事节奏热力图
 * - 分析章节/场景级别的节奏密度
 * - 识别节奏过快/过慢区域
 * - 提供节奏调整建议
 * - 支持多维度节奏分析（动作、对话、描述、内心）
 */

import type { Lesson } from '../evolution/SelfEvolutionEngine'

// ==================== 类型定义 ====================

/** 叙事节奏类型 */
export type PacingType =
  | 'action'             // 动作节奏
  | 'dialogue'          // 对话节奏
  | 'description'       // 描述节奏
  | 'internal_monologue' // 内心独白节奏
  | 'transition'        // 转场节奏
  | 'climax'            // 高潮节奏
  | 'denouement'        // 收尾节奏

/** 节奏强度级别 */
export type PacingIntensity = 'slow' | 'moderate' | 'fast' | 'intense'

/** 节奏数据点 */
export interface PacingDataPoint {
  id: string
  chapterId: number
  sceneId: number
  position: number // 0-100 (章节内位置)
  pacingType: PacingType
  intensity: number // 0-100
  wordCount: number
  sentenceCount: number
  paragraphCount: number
  dialogueRatio: number // 0-100
  actionDensity: number // 0-100
  descriptionDensity: number // 0-100
  internalDensity: number // 0-100
  emotionalCharge: number // 0-100
  tensionContribution: number // 0-100
  timestamp: number
}

/** 场景节奏摘要 */
export interface ScenePacingSummary {
  sceneId: number
  chapterId: number
  pacingType: PacingType
  averageIntensity: number
  peakIntensity: number
  valleyIntensity: number
  totalWords: number
  pacingDensity: number // 0-100 (节奏点密度)
  rhythmScore: number // 0-100 (韵律得分)
  emotionalArc: 'rising' | 'falling' | 'stable' | 'wave'
  recommendations: string[]
}

/** 章节节奏摘要 */
export interface ChapterPacingSummary {
  chapterId: number
  overallPacingScore: number // 0-100
  pacingType: PacingType
  dominantRhythm: PacingIntensity
  pacingPoints: PacingDataPoint[]
  sceneCount: number
  averageWordPerScene: number
  tensionZones: { startPosition: number; endPosition: number; intensity: number }[]
  flatZones: { startPosition: number; endPosition: number; intensity: number }[]
  pacingCurve: number[] // 0-100 throughout chapter
  pacingBalance: number // 0-100
  recommendations: string[]
}

/** 热力图单元格 */
export interface HeatmapCell {
  chapterId: number
  sceneId: number
  position: number
  intensity: number // 0-100
  pacingType: PacingType
  colorValue: string // RGB representation for visualization
}

/** 热力图行 */
export interface HeatmapRow {
  chapterId: number
  cells: HeatmapCell[]
  averageIntensity: number
}

/** 热力图 */
export interface PacingHeatmap {
  projectId: number
  rows: HeatmapRow[]
  maxIntensity: number
  minIntensity: number
  averageIntensity: number
  hotspots: { chapterId: number; sceneId: number; intensity: number }[]
  createdAt: number
  updatedAt: number
}

/** 节奏分析结果 */
export interface PacingAnalysis {
  projectId: number
  chapterSummaries: ChapterPacingSummary[]
  overallPacingScore: number // 0-100
  pacingBalance: number // 0-100
  rhythmConsistency: number // 0-100
  pacingTypeDistribution: Map<PacingType, number>
  problemAreas: { chapterId: number; type: 'rush' | 'drag' | 'inconsistent'; description: string }[]
  recommendations: string[]
  heatmap: PacingHeatmap
  createdAt: number
  updatedAt: number
}

// ==================== 存储键 ====================

const STORAGE_KEYS = {
  PACING_DATA: 'ai-novel-pacing-data',
  SCENE_SUMMARIES: 'ai-novel-scene-summaries',
  CHAPTER_SUMMARIES: 'ai-novel-chapter-summaries',
  HEATMAPS: 'ai-novel-pacing-heatmaps',
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

// ==================== 节奏模式识别 ====================

/** 节奏模式定义 */
interface PacingPattern {
  type: PacingType
  actionIndicators: RegExp[]
  dialogueIndicators: RegExp[]
  descriptionIndicators: RegExp[]
  internalIndicators: RegExp[]
  intensityWeights: number[]
}

const PACING_PATTERNS: PacingPattern[] = [
  {
    type: 'action',
    actionIndicators: [
      /冲|跑|跳|打|攻击|战斗|追逐|逃跑|搏斗/i,
      /突然|立刻|马上|瞬间|眨眼/i,
      /砰砰|嗖嗖|呼呼/i,
    ],
    dialogueIndicators: [],
    descriptionIndicators: [],
    internalIndicators: [],
    intensityWeights: [90, 85, 95, 70, 80],
  },
  {
    type: 'dialogue',
    actionIndicators: [],
    dialogueIndicators: [
      /说|问|答|叫|喊|叹|笑道|怒道/i,
      /"[^"]+"|'[^']+'。『[^』]+』/i,
      /对话|交流|争论|讨论/i,
    ],
    descriptionIndicators: [],
    internalIndicators: [],
    intensityWeights: [50, 55, 60, 45, 40],
  },
  {
    type: 'description',
    actionIndicators: [],
    dialogueIndicators: [],
    descriptionIndicators: [
      /看|观察|注视|看到|注意到/i,
      /是.*的|有.*特征|看起来/i,
      /环境|建筑|风景|人物描写/i,
    ],
    internalIndicators: [],
    intensityWeights: [30, 35, 25, 30, 20],
  },
  {
    type: 'internal_monologue',
    actionIndicators: [],
    dialogueIndicators: [],
    descriptionIndicators: [],
    internalIndicators: [
      /想|思考|觉得|感到|认为/i,
      /回忆|记得|想起|想象/i,
      /内心|心理|精神|灵魂/i,
    ],
    intensityWeights: [40, 45, 35, 50, 55],
  },
  {
    type: 'transition',
    actionIndicators: [],
    dialogueIndicators: [],
    descriptionIndicators: [
      /时间流逝|转眼|片刻后|不久/i,
      /与此同时|就在这时|这时/i,
    ],
    internalIndicators: [],
    intensityWeights: [20, 25, 15, 20, 10],
  },
  {
    type: 'climax',
    actionIndicators: [
      /爆发|爆发|冲突|对抗|决战/i,
      /高潮|临界点|转折/i,
      /终于|最终|最后/i,
    ],
    dialogueIndicators: [],
    descriptionIndicators: [],
    internalIndicators: [],
    intensityWeights: [100, 95, 100, 90, 95],
  },
  {
    type: 'denouement',
    actionIndicators: [],
    dialogueIndicators: [],
    descriptionIndicators: [
      /平静|安宁|和谐|结局|尾声/i,
      /最终|最后|结束|完结/i,
    ],
    internalIndicators: [],
    intensityWeights: [30, 35, 40, 25, 20],
  },
]

// ==================== 颜色计算 ====================

function intensityToColor(intensity: number): string {
  // Cold (blue) -> Neutral (green) -> Hot (red)
  if (intensity < 33) {
    // Blue range
    const blueValue = Math.round(200 + (55 * intensity) / 33)
    return `rgb(50, 100, ${blueValue})`
  } else if (intensity < 66) {
    // Green range
    const greenValue = Math.round(100 + (155 * (intensity - 33)) / 33)
    return `rgb(${Math.round(255 - (255 * (intensity - 33)) / 33)}, ${greenValue}, 50)`
  } else {
    // Red range
    const redValue = Math.round(200 + (55 * (intensity - 66)) / 34)
    return `rgb(${redValue}, ${Math.round(100 - (100 * (intensity - 66)) / 34)}, 50)`
  }
}

function getIntensityLabel(intensity: number): PacingIntensity {
  if (intensity < 25) return 'slow'
  if (intensity < 50) return 'moderate'
  if (intensity < 75) return 'fast'
  return 'intense'
}

// ==================== NarrativePacingHeatmap ====================

export class NarrativePacingHeatmap {
  private pacingData: Map<string, PacingDataPoint> = new Map()
  private sceneSummaries: Map<string, ScenePacingSummary> = new Map()
  private chapterSummaries: Map<number, ChapterPacingSummary> = new Map()
  private heatmaps: Map<number, PacingHeatmap> = new Map()
  private projectId: number

  constructor(projectId: number = 0) {
    this.projectId = projectId
    this.loadFromStorage()
  }

  private loadFromStorage(): void {
    const pacingDataRaw = getFromStorage(STORAGE_KEYS.PACING_DATA, {} as Record<string, PacingDataPoint>)
    this.pacingData = new Map(Object.entries(pacingDataRaw))

    const sceneSummariesRaw = getFromStorage(STORAGE_KEYS.SCENE_SUMMARIES, {} as Record<string, ScenePacingSummary>)
    this.sceneSummaries = new Map(Object.entries(sceneSummariesRaw))

    const chapterSummariesRaw = getFromStorage(STORAGE_KEYS.CHAPTER_SUMMARIES, {} as Record<string, ChapterPacingSummary>)
    this.chapterSummaries = new Map(Object.entries(chapterSummariesRaw).map(([k, v]) => [Number(k), v]))

    const heatmapsRaw = getFromStorage(STORAGE_KEYS.HEATMAPS, {} as Record<string, PacingHeatmap>)
    this.heatmaps = new Map(Object.entries(heatmapsRaw).map(([k, v]) => [Number(k), v]))
  }

  private persist(): void {
    const pacingDataObj = Object.fromEntries(this.pacingData)
    saveToStorage(STORAGE_KEYS.PACING_DATA, pacingDataObj)

    const sceneSummariesObj = Object.fromEntries(this.sceneSummaries)
    saveToStorage(STORAGE_KEYS.SCENE_SUMMARIES, sceneSummariesObj)

    const chapterSummariesObj = Object.fromEntries(this.chapterSummaries)
    saveToStorage(STORAGE_KEYS.CHAPTER_SUMMARIES, chapterSummariesObj)

    const heatmapsObj = Object.fromEntries(this.heatmaps)
    saveToStorage(STORAGE_KEYS.HEATMAPS, heatmapsObj)
  }

  // ==================== 核心方法 ====================

  /**
   * 分析文本节奏
   */
  analyzeTextPacing(
    chapterId: number,
    sceneId: number,
    text: string,
    position: number = 0
  ): PacingDataPoint {
    const id = generateId()

    // Count words, sentences, paragraphs
    const words = text.trim().split(/\s+/).filter(w => w.length > 0)
    const sentences = text.split(/[。！？.!]/).filter(s => s.trim().length > 0)
    const paragraphs = text.split(/\n\n|\n/).filter(p => p.trim().length > 0)

    const wordCount = words.length
    const sentenceCount = sentences.length
    const paragraphCount = paragraphs.length

    // Detect pacing type
    const pacingType = this.detectPacingType(text)
    const intensityWeights = PACING_PATTERNS.find(p => p.type === pacingType)?.intensityWeights || [50, 50, 50, 50, 50]

    // Calculate densities
    const dialogueRatio = this.calculateDialogueRatio(text)
    const actionDensity = this.calculateActionDensity(text)
    const descriptionDensity = this.calculateDescriptionDensity(text)
    const internalDensity = this.calculateInternalDensity(text)

    // Calculate base intensity
    let baseIntensity = 50
    if (wordCount > 500) baseIntensity += 15
    else if (wordCount > 200) baseIntensity += 5

    if (sentenceCount > 10) baseIntensity += 10
    if (paragraphCount > 3) baseIntensity += 5

    // Adjust by pacing type
    baseIntensity = (baseIntensity + intensityWeights.reduce((a, b) => a + b, 0) / intensityWeights.length) / 2

    // Calculate emotional charge
    const emotionalCharge = this.calculateEmotionalCharge(text, pacingType)

    // Calculate tension contribution
    const tensionContribution = this.calculateTensionContribution(text, pacingType)

    const point: PacingDataPoint = {
      id,
      chapterId,
      sceneId,
      position,
      pacingType,
      intensity: clampIntensity(baseIntensity),
      wordCount,
      sentenceCount,
      paragraphCount,
      dialogueRatio,
      actionDensity,
      descriptionDensity,
      internalDensity,
      emotionalCharge,
      tensionContribution,
      timestamp: Date.now(),
    }

    this.pacingData.set(id, point)
    this.persist()
    return point
  }

  /**
   * 检测节奏类型
   */
  private detectPacingType(text: string): PacingType {
    let maxScore = 0
    let detectedType: PacingType = 'description'

    for (const pattern of PACING_PATTERNS) {
      let score = 0

      // Check action indicators
      for (const indicator of pattern.actionIndicators) {
        if (indicator.test(text)) score += 20
      }

      // Check dialogue indicators
      for (const indicator of pattern.dialogueIndicators) {
        if (indicator.test(text)) score += 15
      }

      // Check description indicators
      for (const indicator of pattern.descriptionIndicators) {
        if (indicator.test(text)) score += 10
      }

      // Check internal indicators
      for (const indicator of pattern.internalIndicators) {
        if (indicator.test(text)) score += 15
      }

      if (score > maxScore) {
        maxScore = score
        detectedType = pattern.type
      }
    }

    return detectedType
  }

  /**
   * 计算对话比例
   */
  private calculateDialogueRatio(text: string): number {
    const dialogueMatches = text.match(/"[^"]+"|'[^']+'|「[^」]+」/g)
    if (!dialogueMatches) return 0

    const dialogueChars = dialogueMatches.join('').length
    return clampIntensity((dialogueChars / text.length) * 100)
  }

  /**
   * 计算动作密度
   */
  private calculateActionDensity(text: string): number {
    const actionPatterns = [
      /冲|跑|跳|打|攻击|战斗|追逐|逃跑|搏斗/i,
      /突然|立刻|马上|瞬间|眨眼/i,
    ]

    let matchCount = 0
    for (const pattern of actionPatterns) {
      const matches = text.match(pattern)
      if (matches) matchCount += matches.length
    }

    return clampIntensity(Math.min(100, matchCount * 10))
  }

  /**
   * 计算描述密度
   */
  private calculateDescriptionDensity(text: string): number {
    const descPatterns = [
      /看|观察|注视|看到|注意到/i,
      /是.*的|有.*特征|看起来/i,
      /环境|建筑|风景/i,
    ]

    let matchCount = 0
    for (const pattern of descPatterns) {
      const matches = text.match(pattern)
      if (matches) matchCount += matches.length
    }

    return clampIntensity(Math.min(100, matchCount * 8))
  }

  /**
   * 计算内心独白密度
   */
  private calculateInternalDensity(text: string): number {
    const internalPatterns = [
      /想|思考|觉得|感到|认为/i,
      /回忆|记得|想起|想象/i,
    ]

    let matchCount = 0
    for (const pattern of internalPatterns) {
      const matches = text.match(pattern)
      if (matches) matchCount += matches.length
    }

    return clampIntensity(Math.min(100, matchCount * 10))
  }

  /**
   * 计算情感强度
   */
  private calculateEmotionalCharge(text: string, pacingType: PacingType): number {
    const emotionalWords = [
      '愤怒', '恐惧', '喜悦', '悲伤', '惊讶', '厌恶', '爱', '恨',
      '激动', '紧张', '平静', '焦虑', '绝望', '希望',
    ]

    let matchCount = 0
    for (const word of emotionalWords) {
      if (text.includes(word)) matchCount++
    }

    let base = matchCount * 15

    // Climax and action types have higher emotional charge
    if (pacingType === 'climax') base += 30
    else if (pacingType === 'action') base += 15
    else if (pacingType === 'internal_monologue') base += 20

    return clampIntensity(base)
  }

  /**
   * 计算张力贡献
   */
  private calculateTensionContribution(text: string, pacingType: PacingType): number {
    const tensionIndicators = [
      /危机|危险|威胁|困境/i,
      /挣扎|对抗|冲突|矛盾/i,
      /悬念|未知|不确定/i,
    ]

    let base = 0
    for (const indicator of tensionIndicators) {
      if (indicator.test(text)) base += 20
    }

    if (pacingType === 'climax') base += 35
    else if (pacingType === 'action') base += 20
    else if (pacingType === 'transition') base -= 10

    return clampIntensity(base)
  }

  // ==================== 场景摘要 ====================

  /**
   * 生成场景节奏摘要
   */
  generateSceneSummary(chapterId: number, sceneId: number): ScenePacingSummary {
    const scenePoints = Array.from(this.pacingData.values())
      .filter(p => p.chapterId === chapterId && p.sceneId === sceneId)
      .sort((a, b) => a.position - b.position)

    if (scenePoints.length === 0) {
      return {
        sceneId,
        chapterId,
        pacingType: 'description',
        averageIntensity: 0,
        peakIntensity: 0,
        valleyIntensity: 0,
        totalWords: 0,
        pacingDensity: 0,
        rhythmScore: 0,
        emotionalArc: 'stable',
        recommendations: [],
      }
    }

    const intensities = scenePoints.map(p => p.intensity)
    const averageIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length
    const peakIntensity = Math.max(...intensities)
    const valleyIntensity = Math.min(...intensities)
    const totalWords = scenePoints.reduce((sum, p) => sum + p.wordCount, 0)

    const pacingType = this.determineDominantPacingType(scenePoints)
    const pacingDensity = this.calculatePacingDensity(scenePoints)
    const rhythmScore = this.calculateRhythmScore(scenePoints, averageIntensity)
    const emotionalArc = this.determineEmotionalArc(scenePoints)

    const recommendations = this.generateSceneRecommendations(scenePoints, pacingDensity, rhythmScore)

    const summary: ScenePacingSummary = {
      sceneId,
      chapterId,
      pacingType,
      averageIntensity,
      peakIntensity,
      valleyIntensity,
      totalWords,
      pacingDensity,
      rhythmScore,
      emotionalArc,
      recommendations,
    }

    this.sceneSummaries.set(`${chapterId}:${sceneId}`, summary)
    this.persist()
    return summary
  }

  /**
   * 确定主导节奏类型
   */
  private determineDominantPacingType(points: PacingDataPoint[]): PacingType {
    const typeCount = points.reduce((acc, p) => {
      acc[p.pacingType] = (acc[p.pacingType] || 0) + 1
      return acc
    }, {} as Record<PacingType, number>)

    const dominant = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]
    return (dominant?.[0] as PacingType) || 'description'
  }

  /**
   * 计算节奏密度
   */
  private calculatePacingDensity(points: PacingDataPoint[]): number {
    if (points.length < 2) return 50

    // Calculate variance in intensity
    const avg = points.reduce((sum, p) => sum + p.intensity, 0) / points.length
    const variance = points.reduce((sum, p) => sum + Math.pow(p.intensity - avg, 2), 0) / points.length

    // Higher density = more variation = more dynamic pacing
    return clampIntensity(50 + Math.min(50, variance / 10))
  }

  /**
   * 计算韵律得分
   */
  private calculateRhythmScore(points: PacingDataPoint[], averageIntensity: number): number {
    if (points.length < 2) return 50

    // Check for good rhythm: alternating high/low intensity
    let transitions = 0
    for (let i = 1; i < points.length; i++) {
      if ((points[i].intensity > averageIntensity && points[i - 1].intensity < averageIntensity) ||
          (points[i].intensity < averageIntensity && points[i - 1].intensity > averageIntensity)) {
        transitions++
      }
    }

    const transitionRatio = transitions / (points.length - 1)
    return clampIntensity(transitionRatio * 100)
  }

  /**
   * 确定情感弧线
   */
  private determineEmotionalArc(points: PacingDataPoint[]): ScenePacingSummary['emotionalArc'] {
    if (points.length < 3) return 'stable'

    const emotionalCharges = points.map(p => p.emotionalCharge)
    const firstThird = emotionalCharges.slice(0, Math.floor(points.length / 3))
    const lastThird = emotionalCharges.slice(-Math.floor(points.length / 3))

    const firstAvg = firstThird.reduce((a, b) => a + b, 0) / firstThird.length
    const lastAvg = lastThird.reduce((a, b) => a + b, 0) / lastThird.length

    const diff = lastAvg - firstAvg

    if (diff > 15) return 'rising'
    if (diff < -15) return 'falling'

    // Check for wave pattern
    let peaks = 0
    for (let i = 1; i < emotionalCharges.length - 1; i++) {
      if (emotionalCharges[i] > emotionalCharges[i - 1] && emotionalCharges[i] > emotionalCharges[i + 1]) {
        peaks++
      }
    }

    if (peaks >= 2) return 'wave'
    return 'stable'
  }

  /**
   * 生成场景建议
   */
  private generateSceneRecommendations(points: PacingDataPoint[], pacingDensity: number, rhythmScore: number): string[] {
    const recommendations: string[] = []

    if (pacingDensity > 80) {
      recommendations.push('节奏变化过于剧烈，可能需要平滑过渡')
    }
    if (pacingDensity < 30) {
      recommendations.push('节奏过于单调，建议增加变化')
    }
    if (rhythmScore < 40) {
      recommendations.push('韵律感不足，可以考虑增加交替的高低音节')
    }

    const avgIntensity = points.reduce((sum, p) => sum + p.intensity, 0) / points.length
    if (avgIntensity > 80) {
      recommendations.push('整体节奏过快，建议在紧张场景后加入缓冲')
    }
    if (avgIntensity < 25) {
      recommendations.push('整体节奏过慢，可能需要增加紧张元素')
    }

    return recommendations
  }

  // ==================== 章节摘要 ====================

  /**
   * 生成章节节奏摘要
   */
  generateChapterSummary(chapterId: number): ChapterPacingSummary {
    const chapterPoints = Array.from(this.pacingData.values())
      .filter(p => p.chapterId === chapterId)
      .sort((a, b) => a.position - b.position)

    if (chapterPoints.length === 0) {
      return {
        chapterId,
        overallPacingScore: 0,
        pacingType: 'description',
        dominantRhythm: 'slow',
        pacingPoints: [],
        sceneCount: 0,
        averageWordPerScene: 0,
        tensionZones: [],
        flatZones: [],
        pacingCurve: [],
        pacingBalance: 0,
        recommendations: [],
      }
    }

    const sceneIds = Array.from(new Set<number>(chapterPoints.map(p => p.sceneId)))
    const sceneCount = sceneIds.length
    const totalWords = chapterPoints.reduce((sum, p) => sum + p.wordCount, 0)
    const averageWordPerScene = totalWords / sceneCount

    const overallPacingScore = chapterPoints.reduce((sum, p) => sum + p.intensity, 0) / chapterPoints.length
    const pacingType = this.determineDominantPacingType(chapterPoints)
    const dominantRhythm = getIntensityLabel(overallPacingScore)

    // Find tension and flat zones
    const tensionZones: ChapterPacingSummary['tensionZones'] = []
    const flatZones: ChapterPacingSummary['flatZones'] = []
    let currentZone: { startPosition: number; endPosition: number; intensities: number[] } | null = null

    for (const point of chapterPoints) {
      if (point.intensity > 70) {
        if (!currentZone || currentZone.intensities[0] <= 70) {
          if (currentZone) {
            // Close previous zone
            const avgIntensity = currentZone.intensities.reduce((a, b) => a + b, 0) / currentZone.intensities.length
            if (avgIntensity > 70) {
              tensionZones.push({
                startPosition: currentZone.startPosition,
                endPosition: point.position,
                intensity: avgIntensity,
              })
            } else {
              flatZones.push({
                startPosition: currentZone.startPosition,
                endPosition: point.position,
                intensity: avgIntensity,
              })
            }
          }
          currentZone = { startPosition: point.position, endPosition: point.position, intensities: [point.intensity] }
        } else {
          currentZone.endPosition = point.position
          currentZone.intensities.push(point.intensity)
        }
      } else {
        if (currentZone && currentZone.intensities[0] > 70) {
          const avgIntensity = currentZone.intensities.reduce((a, b) => a + b, 0) / currentZone.intensities.length
          tensionZones.push({
            startPosition: currentZone.startPosition,
            endPosition: currentZone.endPosition,
            intensity: avgIntensity,
          })
          currentZone = null
        }
      }
    }

    // Close any remaining zone
    if (currentZone) {
      const avgIntensity = currentZone.intensities.reduce((a, b) => a + b, 0) / currentZone.intensities.length
      if (avgIntensity > 70) {
        tensionZones.push({
          startPosition: currentZone.startPosition,
          endPosition: currentZone.endPosition,
          intensity: avgIntensity,
        })
      }
    }

    // Build pacing curve (sample every 10%)
    const pacingCurve: number[] = []
    const step = 10
    for (let pos = 0; pos <= 100; pos += step) {
      const pointsAtPos = chapterPoints.filter(p =>
        Math.abs(p.position - pos) < step / 2
      )
      if (pointsAtPos.length > 0) {
        pacingCurve.push(pointsAtPos.reduce((sum, p) => sum + p.intensity, 0) / pointsAtPos.length)
      } else {
        // Interpolate
        const before = chapterPoints.filter(p => p.position < pos).slice(-1)[0]
        const after = chapterPoints.filter(p => p.position > pos)[0]
        if (before && after) {
          pacingCurve.push((before.intensity + after.intensity) / 2)
        } else if (before) {
          pacingCurve.push(before.intensity)
        } else if (after) {
          pacingCurve.push(after.intensity)
        }
      }
    }

    const pacingBalance = this.calculatePacingBalance(chapterPoints)

    const recommendations = this.generateChapterRecommendations(chapterPoints, overallPacingScore, pacingBalance, tensionZones.length)

    const summary: ChapterPacingSummary = {
      chapterId,
      overallPacingScore,
      pacingType,
      dominantRhythm,
      pacingPoints: chapterPoints,
      sceneCount,
      averageWordPerScene,
      tensionZones,
      flatZones,
      pacingCurve,
      pacingBalance,
      recommendations,
    }

    this.chapterSummaries.set(chapterId, summary)
    this.persist()
    return summary
  }

  /**
   * 计算节奏平衡度
   */
  private calculatePacingBalance(points: PacingDataPoint[]): number {
    if (points.length < 2) return 100

    const avg = points.reduce((sum, p) => sum + p.intensity, 0) / points.length
    const variance = points.reduce((sum, p) => sum + Math.pow(p.intensity - avg, 2), 0) / points.length

    // Good balance = moderate variance
    const idealVariance = 400 // variance of about 20 points from mean
    const balanceScore = 100 - Math.abs(variance - idealVariance) / 10

    return clampIntensity(Math.max(0, Math.min(100, balanceScore)))
  }

  /**
   * 生成章节建议
   */
  private generateChapterRecommendations(
    points: PacingDataPoint[],
    overallScore: number,
    pacingBalance: number,
    tensionZoneCount: number
  ): string[] {
    const recommendations: string[] = []

    if (overallScore > 75) {
      recommendations.push('章节整体节奏偏快，阅读压力较大')
    }
    if (overallScore < 30) {
      recommendations.push('章节整体节奏偏慢，可能显得拖沓')
    }
    if (pacingBalance < 50) {
      recommendations.push('节奏变化不够自然，需要调整过渡')
    }
    if (tensionZoneCount > 5) {
      recommendations.push('紧张区域过多，高潮效果可能被削弱')
    }

    const avgWordsPerPoint = points.reduce((sum, p) => sum + p.wordCount, 0) / points.length
    if (avgWordsPerPoint > 300) {
      recommendations.push('每个节奏点的内容量偏大，考虑拆分')
    }

    return recommendations
  }

  // ==================== 热力图 ====================

  /**
   * 生成立体热力图
   */
  generateHeatmap(projectId: number): PacingHeatmap {
    const allPoints = Array.from(this.pacingData.values())
      .sort((a, b) => a.chapterId - b.chapterId || a.position - b.position)

    const chapterIds = Array.from(new Set<number>(allPoints.map(p => p.chapterId)))

    const rows: HeatmapRow[] = []
    let maxIntensity = 0
    let minIntensity = 100
    let totalIntensity = 0
    let totalCount = 0

    const hotspots: PacingHeatmap['hotspots'] = []

    for (const chapterId of chapterIds) {
      const chapterPoints = allPoints.filter(p => p.chapterId === chapterId)
      const sceneIds = Array.from(new Set<number>(chapterPoints.map(p => p.sceneId)))

      const cells: HeatmapCell[] = []

      for (const sceneId of sceneIds) {
        const scenePoints = chapterPoints.filter(p => p.sceneId === sceneId)

        for (const point of scenePoints) {
          cells.push({
            chapterId: point.chapterId,
            sceneId: point.sceneId,
            position: point.position,
            intensity: point.intensity,
            pacingType: point.pacingType,
            colorValue: intensityToColor(point.intensity),
          })

          if (point.intensity > maxIntensity) maxIntensity = point.intensity
          if (point.intensity < minIntensity) minIntensity = point.intensity
          totalIntensity += point.intensity
          totalCount++

          if (point.intensity > 80) {
            hotspots.push({
              chapterId: point.chapterId,
              sceneId: point.sceneId,
              intensity: point.intensity,
            })
          }
        }
      }

      const averageIntensity = cells.length > 0
        ? cells.reduce((sum, c) => sum + c.intensity, 0) / cells.length
        : 0

      rows.push({ chapterId, cells, averageIntensity })
    }

    const averageIntensity = totalCount > 0 ? totalIntensity / totalCount : 0

    const heatmap: PacingHeatmap = {
      projectId,
      rows,
      maxIntensity,
      minIntensity,
      averageIntensity,
      hotspots,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    this.heatmaps.set(projectId, heatmap)
    this.persist()
    return heatmap
  }

  // ==================== 完整分析 ====================

  /**
   * 获取完整节奏分析
   */
  getFullAnalysis(projectId: number): PacingAnalysis {
    const allPoints = Array.from(this.pacingData.values())
    const chapterIds = Array.from(new Set<number>(allPoints.map(p => p.chapterId)))

    const chapterSummaries = chapterIds.map(id => this.generateChapterSummary(id))
    const heatmap = this.generateHeatmap(projectId)

    const overallPacingScore = chapterSummaries.length > 0
      ? chapterSummaries.reduce((sum, s) => sum + s.overallPacingScore, 0) / chapterSummaries.length
      : 0

    const pacingBalance = chapterSummaries.length > 0
      ? chapterSummaries.reduce((sum, s) => sum + s.pacingBalance, 0) / chapterSummaries.length
      : 0

    // Calculate rhythm consistency
    let rhythmConsistency = 100
    if (chapterSummaries.length > 1) {
      const rhythmScores = chapterSummaries.map(s => {
        const points = s.pacingPoints
        if (points.length < 2) return 50
        return this.calculateRhythmScore(points, s.overallPacingScore)
      })
      const avgRhythm = rhythmScores.reduce((a, b) => a + b, 0) / rhythmScores.length
      const variance = rhythmScores.reduce((sum, r) => sum + Math.pow(r - avgRhythm, 2), 0) / rhythmScores.length
      rhythmConsistency = clampIntensity(100 - Math.min(100, variance / 5))
    }

    // Pacing type distribution
    const pacingTypeDistribution = new Map<PacingType, number>()
    for (const point of allPoints) {
      pacingTypeDistribution.set(
        point.pacingType,
        (pacingTypeDistribution.get(point.pacingType) || 0) + 1
      )
    }

    // Find problem areas
    const problemAreas: PacingAnalysis['problemAreas'] = []
    for (const summary of chapterSummaries) {
      if (summary.overallPacingScore > 80) {
        problemAreas.push({
          chapterId: summary.chapterId,
          type: 'rush',
          description: `章节${summary.chapterId}节奏过快`,
        })
      }
      if (summary.overallPacingScore < 25) {
        problemAreas.push({
          chapterId: summary.chapterId,
          type: 'drag',
          description: `章节${summary.chapterId}节奏过慢`,
        })
      }
      if (summary.pacingBalance < 40) {
        problemAreas.push({
          chapterId: summary.chapterId,
          type: 'inconsistent',
          description: `章节${summary.chapterId}节奏变化不自然`,
        })
      }
    }

    // Generate recommendations
    const recommendations: string[] = []
    if (overallPacingScore > 70) {
      recommendations.push('整体节奏偏快，建议在关键章节后增加缓冲段落')
    }
    if (overallPacingScore < 35) {
      recommendations.push('整体节奏偏慢，需要增加紧张元素或冲突')
    }
    if (rhythmConsistency < 60) {
      recommendations.push('各章节节奏一致性较差，建议建立统一的节奏标准')
    }

    const totalTensionZones = chapterSummaries.reduce((sum, s) => sum + s.tensionZones.length, 0)
    if (totalTensionZones > chapterIds.length * 3) {
      recommendations.push('紧张区域整体偏多，需要适当控制高潮数量')
    }

    return {
      projectId,
      chapterSummaries,
      overallPacingScore,
      pacingBalance,
      rhythmConsistency,
      pacingTypeDistribution,
      problemAreas,
      recommendations,
      heatmap,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }

  // ==================== 查询方法 ====================

  /**
   * 获取章节摘要
   */
  getChapterSummary(chapterId: number): ChapterPacingSummary | null {
    return this.chapterSummaries.get(chapterId) || null
  }

  /**
   * 获取场景摘要
   */
  getSceneSummary(chapterId: number, sceneId: number): ScenePacingSummary | null {
    return this.sceneSummaries.get(`${chapterId}:${sceneId}`) || null
  }

  /**
   * 获取节奏数据点
   */
  getPacingPoint(id: string): PacingDataPoint | null {
    return this.pacingData.get(id) || null
  }

  /**
   * 获取章节所有节奏点
   */
  getChapterPacingPoints(chapterId: number): PacingDataPoint[] {
    return Array.from(this.pacingData.values())
      .filter(p => p.chapterId === chapterId)
      .sort((a, b) => a.position - b.position)
  }

  /**
   * 获取热力图
   */
  getHeatmap(projectId: number): PacingHeatmap | null {
    return this.heatmaps.get(projectId) || null
  }

  /**
   * 清除项目数据
   */
  clearProjectData(): void {
    this.pacingData.clear()
    this.sceneSummaries.clear()
    this.chapterSummaries.clear()
    this.heatmaps.clear()
    this.persist()
  }
}