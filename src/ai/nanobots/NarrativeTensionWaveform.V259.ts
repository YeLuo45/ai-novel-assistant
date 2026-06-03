/**
 * NarrativeTensionWaveform - V259
 * 叙事张力波形追踪引擎
 * 
 * 功能：
 * - 追踪故事整体张力曲线
 * - 识别高潮/低谷区域
 * - 分析章节级别的张力分布
 * - 提供张力平衡建议
 */

import type { Lesson } from '../evolution/SelfEvolutionEngine'

// ==================== 类型定义 ====================

/** 张力类型 */
export type TensionType = 
  | 'external_conflict'  // 外部冲突
  | 'internal_conflict' // 内心冲突
  | 'romantic_tension'   // 情感张力
  | 'mystery_tension'    // 悬疑张力
  | 'suspense_tension'   // 悬念张力
  | 'dramatic_irony'     // 戏剧反讽

/** 张力波形点 */
export interface TensionPoint {
  chapterId: number
  position: number // 0-100 (章节内位置)
  tensionType: TensionType
  intensity: number // 0-100
  description: string
  triggers: string[]
  timestamp: number
}

/** 章节张力摘要 */
export interface ChapterTensionSummary {
  chapterId: number
  averageTension: number
  peakTension: number
  valleyTension: number
  tensionPoints: number
  dominantType: TensionType
  risingEdge: boolean
  fallingEdge: boolean
  emotionalValence: 'positive' | 'negative' | 'neutral'
}

/** 张力波形 */
export interface TensionWaveform {
  projectId: number
  points: TensionPoint[]
  chapterSummaries: ChapterTensionSummary[]
  overallArcType: 'rising' | 'falling' | 'plateau' | 'pyramid' | 'wave' | 'complex'
  globalPeak: { chapterId: number; intensity: number } | null
  globalValley: { chapterId: number; intensity: number } | null
  createdAt: number
  updatedAt: number
}

/** 张力事件 */
export interface TensionEvent {
  id: string
  chapterId: number
  startPosition: number
  endPosition: number
  eventType: TensionType
  peakIntensity: number
  description: string
  resolvedInChapter?: number
}

/** 张力分析结果 */
export interface TensionAnalysis {
  projectId: number
  arcStability: number // 0-100
  pacingBalance: number // 0-100
  peakDistribution: number // 0-100
  tensionConsistency: number // 0-100
  flatAreas: { startChapter: number; endChapter: number; avgTension: number }[]
  rushAreas: { chapterId: number; reason: string }[]
  recommendations: string[]
}

// ==================== 存储键 ====================

const STORAGE_KEYS = {
  TENSION_WAVEFORMS: 'ai-novel-tension-waveforms',
  TENSION_EVENTS: 'ai-novel-tension-events',
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

// ==================== NarrativeTensionWaveform ====================

export class NarrativeTensionWaveform {
  private waveforms: Map<number, TensionWaveform> = new Map()
  private events: TensionEvent[] = []
  private projectId: number

  constructor(projectId: number = 0) {
    this.projectId = projectId
    this.loadFromStorage()
  }

  private loadFromStorage(): void {
    const waveformsData = getFromStorage(STORAGE_KEYS.TENSION_WAVEFORMS, {} as Record<number, TensionWaveform>)
    this.waveforms = new Map(Object.entries(waveformsData).map(([k, v]) => [parseInt(k), v]))
    
    const eventsData = getFromStorage(STORAGE_KEYS.TENSION_EVENTS, [])
    this.events = eventsData
  }

  private persist(): void {
    const waveformsObj = Object.fromEntries(this.waveforms)
    saveToStorage(STORAGE_KEYS.TENSION_WAVEFORMS, waveformsObj)
    saveToStorage(STORAGE_KEYS.TENSION_EVENTS, this.events)
  }

  // ==================== 核心方法 ====================

  /**
   * 初始化波形追踪
   */
  initWaveform(projectId: number): TensionWaveform {
    const now = Date.now()
    
    const waveform: TensionWaveform = {
      projectId,
      points: [],
      chapterSummaries: [],
      overallArcType: 'rising',
      globalPeak: null,
      globalValley: null,
      createdAt: now,
      updatedAt: now,
    }

    this.waveforms.set(projectId, waveform)
    this.persist()
    return waveform
  }

  /**
   * 添加张力点
   */
  addTensionPoint(
    projectId: number,
    chapterId: number,
    position: number,
    tensionType: TensionType,
    intensity: number,
    description: string,
    triggers: string[] = []
  ): TensionPoint | null {
    let waveform = this.waveforms.get(projectId)
    if (!waveform) {
      waveform = this.initWaveform(projectId)
    }

    const point: TensionPoint = {
      chapterId,
      position,
      tensionType,
      intensity: Math.max(0, Math.min(100, intensity)),
      description,
      triggers,
      timestamp: Date.now(),
    }

    waveform.points.push(point)
    waveform.updatedAt = Date.now()
    
    // 更新全局峰值和谷值
    this.updateGlobalExtremes(waveform)
    
    this.waveforms.set(projectId, waveform)
    this.persist()
    return point
  }

  /**
   * 批量添加张力点
   */
  addTensionPoints(projectId: number, points: Omit<TensionPoint, 'timestamp'>[]): TensionPoint[] {
    const added: TensionPoint[] = []
    for (const p of points) {
      const result = this.addTensionPoint(
        projectId, p.chapterId, p.position, p.tensionType, p.intensity, p.description, p.triggers
      )
      if (result) added.push(result)
    }
    return added
  }

  /**
   * 记录张力事件
   */
  recordTensionEvent(
    chapterId: number,
    startPosition: number,
    endPosition: number,
    eventType: TensionType,
    peakIntensity: number,
    description: string,
    resolvedInChapter?: number
  ): TensionEvent {
    const event: TensionEvent = {
      id: `tension_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chapterId,
      startPosition,
      endPosition,
      eventType,
      peakIntensity,
      description,
      resolvedInChapter,
    }

    this.events.push(event)
    this.persist()
    return event
  }

  /**
   * 解决张力事件
   */
  resolveTensionEvent(eventId: string, resolvedInChapter: number): boolean {
    const event = this.events.find(e => e.id === eventId)
    if (!event) return false

    event.resolvedInChapter = resolvedInChapter
    this.persist()
    return true
  }

  // ==================== 计算方法 ====================

  /**
   * 计算章节张力摘要
   */
  calculateChapterSummary(projectId: number, chapterId: number): ChapterTensionSummary | null {
    const waveform = this.waveforms.get(projectId)
    if (!waveform) return null

    const points = waveform.points.filter(p => p.chapterId === chapterId)
    if (points.length === 0) return null

    const tensions = points.map(p => p.intensity)
    const averageTension = tensions.reduce((a, b) => a + b, 0) / tensions.length
    const peakTension = Math.max(...tensions)
    const valleyTension = Math.min(...tensions)

    // 统计各类型数量
    const typeCounts = new Map<TensionType, number>()
    for (const p of points) {
      typeCounts.set(p.type, (typeCounts.get(p.type) || 0) + 1)
    }
    
    const dominantType = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'external_conflict'

    // 判断上升/下降边缘
    const sortedByPosition = [...points].sort((a, b) => {
      const chCompare = a.chapterId - b.chapterId
      return chCompare !== 0 ? chCompare : a.position - b.position
    })
    
    const risingEdge = sortedByPosition.length >= 2 && 
      sortedByPosition[sortedByPosition.length - 1].intensity > sortedByPosition[0].intensity
    const fallingEdge = sortedByPosition.length >= 2 && 
      sortedByPosition[sortedByPosition.length - 1].intensity < sortedByPosition[0].intensity

    // 情感效价
    const emotionalValence = averageTension > 60 ? 'negative' : averageTension < 40 ? 'positive' : 'neutral'

    return {
      chapterId,
      averageTension: Math.round(averageTension * 10) / 10,
      peakTension,
      valleyTension,
      tensionPoints: points.length,
      dominantType,
      risingEdge,
      fallingEdge,
      emotionalValence,
    }
  }

  /**
   * 确定整体弧线类型
   */
  determineArcType(projectId: number): 'rising' | 'falling' | 'plateau' | 'pyramid' | 'wave' | 'complex' {
    const waveform = this.waveforms.get(projectId)
    if (!waveform || waveform.points.length < 3) return 'plateau'

    const chapters = this.getChapterIds(projectId)
    if (chapters.length < 3) return 'plateau'

    const summaries = chapters
      .map(ch => this.calculateChapterSummary(projectId, ch))
      .filter((s): s is ChapterTensionSummary => s !== null)
      .map(s => s.averageTension)

    const first = summaries[0]
    const last = summaries[summaries.length - 1]
    const max = Math.max(...summaries)
    const min = Math.min(...summaries)

    // Check plateau first (low variance)
    if (max - min < 15) return 'plateau'

    // Check for rising/falling first (peak in middle indicates these)
    const maxIdx = summaries.indexOf(max)
    if (first < last && maxIdx === summaries.length - 1) return 'rising'
    if (first > last && maxIdx === 0) return 'falling'

    // Check for wave (multiple peaks) before pyramid
    if (this.hasMultiplePeaks(summaries)) return 'wave'

    // Check for pyramid (peak at one end)
    if (maxIdx === 0 || maxIdx === summaries.length - 1) return 'pyramid'
    
    return 'complex'
  }

  private hasMultiplePeaks(tensions: number[]): boolean {
    let peaks = 0
    for (let i = 1; i < tensions.length - 1; i++) {
      if (tensions[i] > tensions[i - 1] && tensions[i] > tensions[i + 1]) {
        peaks++
      }
    }
    return peaks >= 2
  }

  /**
   * 更新全局极值
   */
  private updateGlobalExtremes(waveform: TensionWaveform): void {
    if (waveform.points.length === 0) {
      waveform.globalPeak = null
      waveform.globalValley = null
      return
    }

    let peakPoint = waveform.points[0]
    let valleyPoint = waveform.points[0]

    for (const p of waveform.points) {
      if (p.intensity > peakPoint.intensity) peakPoint = p
      if (p.intensity < valleyPoint.intensity) valleyPoint = p
    }

    waveform.globalPeak = { chapterId: peakPoint.chapterId, intensity: peakPoint.intensity }
    waveform.globalValley = { chapterId: valleyPoint.chapterId, intensity: valleyPoint.intensity }
  }

  // ==================== 分析方法 ====================

  /**
   * 全面分析张力波形
   */
  analyzeTension(projectId: number): TensionAnalysis {
    const waveform = this.waveforms.get(projectId)
    if (!waveform) {
      return {
        projectId,
        arcStability: 0,
        pacingBalance: 0,
        peakDistribution: 0,
        tensionConsistency: 0,
        flatAreas: [],
        rushAreas: [],
        recommendations: ['No tension data available'],
      }
    }

    const chapters = this.getChapterIds(projectId)
    const summaries = chapters
      .map(ch => this.calculateChapterSummary(projectId, ch))
      .filter((s): s is ChapterTensionSummary => s !== null)

    // 计算各指标
    const arcStability = this.calculateArcStability(summaries)
    const pacingBalance = this.calculatePacingBalance(summaries)
    const peakDistribution = this.calculatePeakDistribution(summaries)
    const tensionConsistency = this.calculateTensionConsistency(summaries)

    // 检测平坦区域
    const flatAreas = this.detectFlatAreas(summaries)
    
    // 检测 rush 区域
    const rushAreas = this.detectRushAreas(summaries)

    // 生成建议
    const recommendations = this.generateRecommendations(
      arcStability, pacingBalance, peakDistribution, flatAreas, rushAreas
    )

    return {
      projectId,
      arcStability,
      pacingBalance,
      peakDistribution,
      tensionConsistency,
      flatAreas,
      rushAreas,
      recommendations,
    }
  }

  private calculateArcStability(summaries: ChapterTensionSummary[]): number {
    if (summaries.length < 2) return 100
    const tensions = summaries.map(s => s.averageTension)
    const mean = tensions.reduce((a, b) => a + b, 0) / tensions.length
    const variance = tensions.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / tensions.length
    const stdDev = Math.sqrt(variance)
    return Math.max(0, Math.min(100, 100 - stdDev * 2))
  }

  private calculatePacingBalance(summaries: ChapterTensionSummary[]): number {
    if (summaries.length === 0) return 0
    const peaks = summaries.filter(s => s.peakTension > 70).length
    const valleys = summaries.filter(s => s.valleyTension < 40).length
    const balance = 1 - Math.abs(peaks - valleys) / summaries.length
    return Math.round(balance * 100)
  }

  private calculatePeakDistribution(summaries: ChapterTensionSummary[]): number {
    if (summaries.length < 2) return 100
    const peaks = summaries.filter(s => s.peakTension > 70)
    if (peaks.length === 0) return 50
    if (peaks.length === 1) return 70
    
    // 检查峰值分布是否均匀
    const peakIndices = summaries
      .map((s, i) => ({ ch: s.chapterId, idx: i }))
      .filter(({ ch }) => summaries.find(s => s.chapterId === ch)?.peakTension > 70)
      .map(({ idx }) => idx)
    
    let totalGap = 0
    for (let i = 1; i < peakIndices.length; i++) {
      totalGap += peakIndices[i] - peakIndices[i - 1]
    }
    const avgGap = totalGap / (peakIndices.length - 1)
    const idealGap = summaries.length / peakIndices.length
    const distribution = 1 - Math.abs(avgGap - idealGap) / idealGap
    
    return Math.round(Math.max(0, distribution * 100))
  }

  private calculateTensionConsistency(summaries: ChapterTensionSummary[]): number {
    if (summaries.length < 2) return 100
    const tensions = summaries.map(s => s.averageTension)
    const diffs = []
    for (let i = 1; i < tensions.length; i++) {
      diffs.push(Math.abs(tensions[i] - tensions[i - 1]))
    }
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length
    return Math.max(0, Math.min(100, 100 - avgDiff * 5))
  }

  private detectFlatAreas(summaries: ChapterTensionSummary[]): { startChapter: number; endChapter: number; avgTension: number }[] {
    const flatAreas: { startChapter: number; endChapter: number; avgTension: number }[] = []
    
    for (let i = 1; i < summaries.length; i++) {
      const prev = summaries[i - 1].averageTension
      const curr = summaries[i].averageTension
      if (Math.abs(curr - prev) < 5) {
        // 可能是一个平坦区域
        let startCh = summaries[i - 1].chapterId
        let endCh = summaries[i].chapterId
        let sum = prev + curr
        let count = 2
        
        // 向前向后扩展
        let j = i - 2
        while (j >= 0 && Math.abs(summaries[j].averageTension - prev) < 5) {
          startCh = summaries[j].chapterId
          sum += summaries[j].averageTension
          count++
          j--
        }
        
        j = i + 1
        while (j < summaries.length && Math.abs(summaries[j].averageTension - curr) < 5) {
          endCh = summaries[j].chapterId
          sum += summaries[j].averageTension
          count++
          j++
        }
        
        if (count >= 3) {
          flatAreas.push({
            startChapter: startCh,
            endChapter: endCh,
            avgTension: Math.round(sum / count * 10) / 10,
          })
        }
      }
    }
    
    return flatAreas
  }

  private detectRushAreas(summaries: ChapterTensionSummary[]): { chapterId: number; reason: string }[] {
    const rushAreas: { chapterId: number; reason: string }[] = []
    
    for (let i = 1; i < summaries.length; i++) {
      const diff = summaries[i].averageTension - summaries[i - 1].averageTension
      if (diff > 30) {
        rushAreas.push({
          chapterId: summaries[i].chapterId,
          reason: `张力急剧上升 (+${Math.round(diff)})，可能需要中间章节`,
        })
      } else if (diff < -30) {
        rushAreas.push({
          chapterId: summaries[i].chapterId,
          reason: `张力急剧下降 (${Math.round(diff)})，可能需要缓和过渡`,
        })
      }
    }
    
    return rushAreas
  }

  private generateRecommendations(
    arcStability: number,
    pacingBalance: number,
    peakDistribution: number,
    flatAreas: { startChapter: number; endChapter: number; avgTension: number }[],
    rushAreas: { chapterId: number; reason: string }[]
  ): string[] {
    const recs: string[] = []
    
    if (arcStability < 60) {
      recs.push('整体张力波动较大，建议增加渐进式铺垫')
    }
    if (pacingBalance < 50) {
      recs.push('高潮与低谷分布不平衡，建议增加低谷章节作为缓冲')
    }
    if (peakDistribution < 60) {
      recs.push('峰值过于集中，建议将部分高潮分散到不同章节')
    }
    if (flatAreas.length > 0) {
      recs.push(`检测到平坦区域: 第${flatAreas[0].startChapter}-${flatAreas[0].endChapter}章，建议增加小冲突或转折`)
    }
    if (rushAreas.length > 0) {
      recs.push(`检测到张力突变: 第${rushAreas[0].chapterId}章，建议增加过渡章节`)
    }
    
    if (recs.length === 0) {
      recs.push('张力波形状态良好，保持当前节奏')
    }
    
    return recs
  }

  // ==================== 获取方法 ====================

  getWaveform(projectId: number): TensionWaveform | undefined {
    return this.waveforms.get(projectId)
  }

  getChapterIds(projectId: number): number[] {
    const waveform = this.waveforms.get(projectId)
    if (!waveform) return []
    return [...new Set(waveform.points.map(p => p.chapterId))].sort((a, b) => a - b)
  }

  getPointsInChapter(projectId: number, chapterId: number): TensionPoint[] {
    const waveform = this.waveforms.get(projectId)
    if (!waveform) return []
    return waveform.points
      .filter(p => p.chapterId === chapterId)
      .sort((a, b) => a.position - b.position)
  }

  getUnresolvedEvents(): TensionEvent[] {
    return this.events.filter(e => e.resolvedInChapter === undefined)
  }

  getAllEvents(): TensionEvent[] {
    return this.events
  }

  // ==================== 结晶集成 ====================

  /**
   * 从张力分析结晶为 Lesson
   */
  async crystallizeToLesson(projectId: number): Promise<Lesson | null> {
    const analysis = this.analyzeTension(projectId)
    
    if (analysis.arcStability < 50 && analysis.pacingBalance < 50) {
      return {
        id: '',
        task: `tension_analysis_${projectId}`,
        approach: `弧线稳定性${analysis.arcStability}%，节奏平衡${analysis.pacingBalance}%。建议: ${analysis.recommendations.join('; ')}`,
        outcome: 'failure',
        context: {
          score: (analysis.arcStability + analysis.pacingBalance) / 200,
          chapterId: 0,
        },
        createdAt: Date.now(),
      }
    }
    
    return null
  }
}

// 导出单例
export const narrativeTensionWaveform = new NarrativeTensionWaveform()