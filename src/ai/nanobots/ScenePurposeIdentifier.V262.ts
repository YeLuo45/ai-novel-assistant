/**
 * ScenePurposeIdentifier - V262
 * 场景目的识别引擎
 * 
 * 功能：
 * - 识别场景在故事中的叙事目的
 * - 评估场景的必要性与影响力
 * - 分析场景与其他场景的关联
 * - 提供场景优化建议
 */

import type { Lesson } from '../evolution/SelfEvolutionEngine'

// ==================== 类型定义 ====================

/** 场景目的类型 */
export type ScenePurposeType =
  | 'character_development'   // 角色发展
  | 'plot_advancement'        // 情节推进
  | 'world_building'          // 世界观构建
  | 'theme_exploration'       // 主题探索
  | 'emotional_beat'          // 情感节奏点
  | 'conflict_establishment'  // 冲突建立
  | 'conflict_resolution'    // 冲突解决
  | 'transition'              // 转场过渡
  | 'foreshadowing'           // 伏笔铺设
  | 'backstory_reveal'        // 背景揭示
  | 'romantic_development'    // 情感发展
  | 'tension_build'           // 张力构建
  | 'relaxation'              // 张力释放
  | 'mystery_setup'           // 悬念设置
  | 'mystery_reveal'          // 悬念揭示

/** 场景必要性级别 */
export type NecessityLevel = 'essential' | 'important' | 'supportive' | 'optional' | 'redundant'

/** 影响力维度 */
export interface ImpactDimension {
  characterGrowth: number      // 0-100 角色成长影响
  plotProgression: number      // 0-100 情节推进影响
  emotionalResonance: number  // 0-100 情感共鸣影响
  themeConnection: number      // 0-100 主题关联影响
  pacingEffect: number         // 0-100 节奏影响
  tensionBuild: number         // 0-100 张力构建影响
}

/** 场景目的识别结果 */
export interface ScenePurpose {
  id: string
  sceneId: number
  chapterId: number
  primaryPurpose: ScenePurposeType
  secondaryPurposes: ScenePurposeType[]
  necessityLevel: NecessityLevel
  necessityScore: number       // 0-100 必要性得分
  impactDimensions: ImpactDimension
  overallImpact: number       // 0-100 综合影响力
  connections: SceneConnection[]
  recommendations: string[]
  timestamp: number
}

/** 场景关联 */
export interface SceneConnection {
  targetSceneId: number
  connectionType: 'causal' | 'thematic' | 'character' | 'emotional' | 'temporal' | 'contrast' | 'foreshadow'
  strength: number            // 0-100 关联强度
  description: string
}

/** 场景分析摘要 */
export interface SceneAnalysisSummary {
  sceneId: number
  chapterId: number
  purposeCount: number
  dominantPurpose: ScenePurposeType
  necessityLevel: NecessityLevel
  impactScore: number
  redundancyRisk: 'high' | 'medium' | 'low'
  optimizationHints: string[]
}

/** 章节场景分析 */
export interface ChapterSceneAnalysis {
  chapterId: number
  sceneCount: number
  purposes: ScenePurpose[]
  totalNecessityScore: number
  averageImpact: number
  redundantScenes: number[]
  pacingProfile: 'slow' | 'moderate' | 'fast' | 'uneven'
  recommendations: string[]
}

// ==================== 存储键 ====================

const STORAGE_KEYS = {
  SCENE_PURPOSES: 'ai-novel-scene-purposes',
  SCENE_ANALYSIS: 'ai-novel-scene-analysis',
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
  return `sp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

// ==================== ScenePurposeIdentifier ====================

export class ScenePurposeIdentifier {
  private purposes: Map<string, ScenePurpose> = new Map()
  private projectId: number

  constructor(projectId: number = 0) {
    this.projectId = projectId
    this.loadFromStorage()
  }

  // ─── 存储 ─────────────────────────────────────────────────────────────

  private loadFromStorage(): void {
    const stored = getFromStorage<Record<string, ScenePurpose>>(
      STORAGE_KEYS.SCENE_PURPOSES,
      {}
    )
    // 只加载属于本项目的
    this.purposes = new Map(
      Object.entries(stored).filter(([, p]) => p.sceneId > 0)
    )
  }

  saveToStorage(): void {
    const obj = Object.fromEntries(this.purposes)
    saveToStorage(STORAGE_KEYS.SCENE_PURPOSES, obj)
  }

  // ─── 核心识别方法 ──────────────────────────────────────────────────────

  /**
   * 识别场景目的
   * @param sceneId 场景ID
   * @param chapterId 章节ID
   * @param content 场景文本内容
   * @param context 上下文信息（前后场景、角色状态等）
   */
  identifyScenePurpose(
    sceneId: number,
    chapterId: number,
    content: string,
    context: {
      previousSceneId?: number
      nextSceneId?: number
      characters?: Array<{ id: string; name: string; state: string }>
      existingPurposes?: ScenePurpose[]
    } = {}
  ): ScenePurpose {
    const purposes = this.analyzeContentPurpose(content)
    const secondary = purposes.filter(p => p !== purposes[0])

    const impactDimensions = this.evaluateImpact(
      content,
      purposes[0],
      context.characters || []
    )

    const overallImpact = this.calculateOverallImpact(impactDimensions)

    const necessityScore = this.calculateNecessityScore(
      purposes[0],
      secondary,
      impactDimensions,
      overallImpact,
      context.existingPurposes || []
    )

    const necessityLevel = this.determineNecessityLevel(necessityScore)

    const connections = this.analyzeConnections(
      sceneId,
      chapterId,
      purposes[0],
      context.previousSceneId,
      context.nextSceneId
    )

    const recommendations = this.generateRecommendations(
      purposes[0],
      necessityLevel,
      impactDimensions,
      connections
    )

    const purpose: ScenePurpose = {
      id: generateId(),
      sceneId,
      chapterId,
      primaryPurpose: purposes[0],
      secondaryPurposes: secondary,
      necessityLevel,
      necessityScore,
      impactDimensions,
      overallImpact: this.calculateOverallImpact(impactDimensions),
      connections,
      recommendations,
      timestamp: Date.now(),
    }

    this.purposes.set(purpose.id, purpose)
    this.saveToStorage()
    return purpose
  }

  /**
   * 分析内容识别目的（基于文本特征）
   */
  private analyzeContentPurpose(content: string): ScenePurposeType[] {
    const purposes: ScenePurposeType[] = []
    const text = content.toLowerCase()

    // 检测特征词/模式
    const purposeIndicators: Record<ScenePurposeType, RegExp[]> = {
      character_development: [
        /\b(learned|realized|understood|changed|grew|developed)\b/i,
        /\b(decided|chose|reflected|doubted|struggled)\b/i,
        /\b(belief|goal|fear|dream|secret)\b/i,
      ],
      plot_advancement: [
        /\b(went|arrived|moved|traveled|left|entered)\b/i,
        /\b(found|discovered|received|found out)\b/i,
        /\b(told|explained|announced|revealed)\b/i,
      ],
      world_building: [
        /\b(city|kingdom|world|realm|universe|society)\b/i,
        /\b(custom|tradition|culture|history|lore)\b/i,
        /\b(building|palace|shop|tavern|temple)\b/i,
      ],
      theme_exploration: [
        /\b(love|hate|justice|truth|freedom|power)\b/i,
        /\b(meaning| purpose| sacrifice| redemption)\b/i,
        /\b(what if|because|therefore|ultimately)\b/i,
      ],
      emotional_beat: [
        /\b(smile|laugh|cry|tears|heart|breath)\b/i,
        /\b(felt|feeling|emotion|pain|joy|sorrow)\b/i,
        /\b(trembled|shivered|shook|gasped)\b/i,
      ],
      conflict_establishment: [
        /\b(argued|fight|confront|challenge|opposed)\b/i,
        /\b(against|opposite|conflict|dispute)\b/i,
        /\b(threat|enemy|danger|rival)\b/i,
      ],
      conflict_resolution: [
        /\b(reconciled|forgave|resolved|agreed|settled)\b/i,
        /\b(apologized|explained|compromised)\b/i,
        /\b(peace|truce|alliance|union)\b/i,
      ],
      transition: [
        /\b(meanwhile|later|after|before|next day)\b/i,
        /\b(time passed|days later|weeks passed)\b/i,
        /\b(returned|went back|headed to)\b/i,
      ],
      foreshadowing: [
        /\b(never thought|little did|didn't know)\b/i,
        /\b(would later|unbeknownst|secretly)\b/i,
        /\b(future|destined|marked|chosen)\b/i,
      ],
      backstory_reveal: [
        /\b(remembered| flashback|past|memory)\b/i,
        /\b(once|formerly|previously|before)\b/i,
        /\b(origin|background|history|beginning)\b/i,
      ],
      romantic_development: [
        /\b(heart|pulse|blush|attraction|desire)\b/i,
        /\b(gaze|stared|eyes|glance|smiled)\b/i,
        /\b(kissed|embraced|held|hugged|intimate)\b/i,
      ],
      tension_build: [
        /\b(tension|pressure|urgency|critical|danger)\b/i,
        /\b(faster|quickly|desperate|rushed|urgent)\b/i,
        /\b(heartbeat|racing|pulse|breathless)\b/i,
      ],
      relaxation: [
        /\b(peaceful|calm|relaxed|restful|quiet)\b/i,
        /\b(laughed|smiled|humor|joke|light)\b/i,
        /\b(break|rested|sat|strolled)\b/i,
      ],
      mystery_setup: [
        /\b(question|strange|unusual|curious)\b/i,
        /\b(hidden|secret|mysterious|unknown)\b/i,
        /\b(why how|what if|clue|hint)\b/i,
      ],
      mystery_reveal: [
        /\b(truth|revealed|discovered|exposed)\b/i,
        /\b(shocking|surprising|unexpected)\b/i,
        /\b(actually|in fact|as it turned)\b/i,
      ],
    }

    const scores: Record<ScenePurposeType, number> = {} as Record<ScenePurposeType, number>

    for (const [purpose, patterns] of Object.entries(purposeIndicators)) {
      scores[purpose as ScenePurposeType] = patterns.reduce((score, pattern) => {
        const matches = content.match(pattern)
        return score + (matches ? matches.length * 10 : 0)
      }, 0)
    }

    // 按得分排序，取前3个
    const sorted = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .filter(([, score]) => score > 0)

    const topPurposes = sorted.slice(0, 3).map(([p]) => p as ScenePurposeType)

    // 确保至少有一个目的
    if (topPurposes.length === 0) {
      topPurposes.push('plot_advancement')
    }

    return topPurposes
  }

  /**
   * 评估影响力维度
   */
  private evaluateImpact(
    content: string,
    primaryPurpose: ScenePurposeType,
    characters: Array<{ id: string; name: string; state: string }>
  ): ImpactDimension {
    const wordCount = content.split(/\s+/).length

    // 基础影响得分（根据字数和目的类型）
    const purposeImpactWeights: Record<ScenePurposeType, Partial<ImpactDimension>> = {
      character_development: { characterGrowth: 80, emotionalResonance: 60, pacingEffect: 40 },
      plot_advancement: { plotProgression: 90, pacingEffect: 70, themeConnection: 30 },
      world_building: { themeConnection: 60, pacingEffect: 30, emotionalResonance: 20 },
      theme_exploration: { themeConnection: 90, emotionalResonance: 70, characterGrowth: 40 },
      emotional_beat: { emotionalResonance: 90, pacingEffect: 50, characterGrowth: 30 },
      conflict_establishment: { tensionBuild: 80, plotProgression: 60, pacingEffect: 70 },
      conflict_resolution: { tensionBuild: 70, emotionalResonance: 60, plotProgression: 50 },
      transition: { pacingEffect: 40, plotProgression: 30, themeConnection: 10 },
      foreshadowing: { plotProgression: 60, themeConnection: 50, characterGrowth: 30 },
      backstory_reveal: { themeConnection: 70, characterGrowth: 50, emotionalResonance: 40 },
      romantic_development: { emotionalResonance: 80, characterGrowth: 50, pacingEffect: 30 },
      tension_build: { tensionBuild: 90, pacingEffect: 70, plotProgression: 40 },
      relaxation: { pacingEffect: 60, emotionalResonance: 50, tensionBuild: -20 },
      mystery_setup: { plotProgression: 70, themeConnection: 50, tensionBuild: 40 },
      mystery_reveal: { plotProgression: 80, tensionBuild: 60, emotionalResonance: 50 },
    }

    const baseImpact = purposeImpactWeights[primaryPurpose] || {
      characterGrowth: 30,
      plotProgression: 30,
      emotionalResonance: 30,
      themeConnection: 30,
      pacingEffect: 30,
    }

    // 根据字数调整（过短内容影响力降低）
    const wordCountFactor = Math.min(1, wordCount / 500)

    // 根据角色提及调整
    const characterMentions = characters.filter(c =>
      content.toLowerCase().includes(c.name.toLowerCase())
    ).length
    const characterFactor = Math.min(1.2, 1 + characterMentions * 0.1)

    const tensionBuild = primaryPurpose === 'tension_build' ? 80 :
                         primaryPurpose === 'relaxation' ? -20 : 30

    return {
      characterGrowth: clamp(baseImpact.characterGrowth! * wordCountFactor * characterFactor, 0, 100),
      plotProgression: clamp(baseImpact.plotProgression! * wordCountFactor, 0, 100),
      emotionalResonance: clamp(baseImpact.emotionalResonance! * wordCountFactor, 0, 100),
      themeConnection: clamp(baseImpact.themeConnection! * wordCountFactor, 0, 100),
      pacingEffect: clamp(baseImpact.pacingEffect! * wordCountFactor, 0, 100),
      tensionBuild: clamp(baseImpact.tensionBuild! * wordCountFactor, 0, 100),
    }
  }

  /**
   * 计算必要性得分
   */
  private calculateNecessityScore(
    primaryPurpose: ScenePurposeType,
    secondaryPurposes: ScenePurposeType[],
    impactDimensions: ImpactDimension,
    overallImpact: number,
    existingPurposes: ScenePurpose[]
  ): number {
    // 基础得分
    let score = overallImpact * 0.4

    // 目的类型加成
    const necessityWeights: Record<ScenePurposeType, number> = {
      character_development: 20,
      plot_advancement: 25,
      conflict_establishment: 20,
      conflict_resolution: 20,
      foreshadowing: 15,
      mystery_reveal: 20,
      theme_exploration: 15,
      emotional_beat: 10,
      tension_build: 15,
      world_building: 10,
      backstory_reveal: 10,
      romantic_development: 10,
      mystery_setup: 10,
      transition: 5,
      relaxation: 5,
    }

    score += necessityWeights[primaryPurpose] || 10

    // 检查是否与已有场景重复（相同目的类型）
    const duplicateCount = existingPurposes.filter(
      p => p.primaryPurpose === primaryPurpose
    ).length
    score -= duplicateCount * 5 // 每重复一次降低5分

    return clamp(score, 0, 100)
  }

  /**
   * 确定必要性级别
   */
  private determineNecessityLevel(score: number): NecessityLevel {
    if (score >= 80) return 'essential'
    if (score >= 60) return 'important'
    if (score >= 40) return 'supportive'
    if (score >= 20) return 'optional'
    return 'redundant'
  }

  /**
   * 分析场景关联
   */
  private analyzeConnections(
    sceneId: number,
    chapterId: number,
    purpose: ScenePurposeType,
    previousSceneId?: number,
    nextSceneId?: number
  ): SceneConnection[] {
    const connections: SceneConnection[] = []

    if (previousSceneId !== undefined) {
      connections.push({
        targetSceneId: previousSceneId,
        connectionType: this.getConnectionType(purpose, 'previous'),
        strength: 70,
        description: this.getConnectionDescription(purpose, 'previous'),
      })
    }

    if (nextSceneId !== undefined) {
      connections.push({
        targetSceneId: nextSceneId,
        connectionType: this.getConnectionType(purpose, 'next'),
        strength: 70,
        description: this.getConnectionDescription(purpose, 'next'),
      })
    }

    return connections
  }

  private getConnectionType(
    purpose: ScenePurposeType,
    direction: 'previous' | 'next'
  ): SceneConnection['connectionType'] {
    const typeMap: Record<ScenePurposeType, Record<'previous' | 'next', SceneConnection['connectionType']>> = {
      character_development: { previous: 'character', next: 'character' },
      plot_advancement: { previous: 'causal', next: 'causal' },
      world_building: { previous: 'thematic', next: 'thematic' },
      theme_exploration: { previous: 'thematic', next: 'thematic' },
      emotional_beat: { previous: 'emotional', next: 'emotional' },
      conflict_establishment: { previous: 'causal', next: 'causal' },
      conflict_resolution: { previous: 'causal', next: 'causal' },
      transition: { previous: 'temporal', next: 'temporal' },
      foreshadowing: { previous: 'foreshadow', next: 'foreshadow' },
      backstory_reveal: { previous: 'temporal', next: 'temporal' },
      romantic_development: { previous: 'emotional', next: 'emotional' },
      tension_build: { previous: 'contrast', next: 'contrast' },
      relaxation: { previous: 'contrast', next: 'contrast' },
      mystery_setup: { previous: 'foreshadow', next: 'foreshadow' },
      mystery_reveal: { previous: 'foreshadow', next: 'foreshadow' },
    }
    return typeMap[purpose]?.[direction] || 'thematic'
  }

  private getConnectionDescription(
    purpose: ScenePurposeType,
    direction: 'previous' | 'next'
  ): string {
    const descMap: Record<ScenePurposeType, string> = {
      character_development: '角色发展场景之间的连续性',
      plot_advancement: '情节推进的因果链',
      world_building: '世界观信息的递进',
      theme_exploration: '主题深化的脉络',
      emotional_beat: '情感节奏的衔接',
      conflict_establishment: '冲突的建立与升级',
      conflict_resolution: '冲突的化解与平息',
      transition: '时间与空间的过渡',
      foreshadowing: '伏笔的铺垫与呼应',
      backstory_reveal: '背景故事的穿插',
      romantic_development: '情感关系的渐进',
      tension_build: '张力的积累',
      relaxation: '张力的释放',
      mystery_setup: '悬念的设置',
      mystery_reveal: '悬念的揭晓',
    }
    return direction === 'previous'
      ? `承接前一个${descMap[purpose]}场景`
      : `引出下一个${descMap[purpose]}场景`
  }

  /**
   * 计算综合影响力
   */
  private calculateOverallImpact(dimensions: ImpactDimension): number {
    const weights = {
      characterGrowth: 0.25,
      plotProgression: 0.30,
      emotionalResonance: 0.20,
      themeConnection: 0.15,
      pacingEffect: 0.10,
      tensionBuild: 0.00, // tensionBuild is part of pacing conceptually
    }

    return clamp(
      dimensions.characterGrowth * weights.characterGrowth +
      dimensions.plotProgression * weights.plotProgression +
      dimensions.emotionalResonance * weights.emotionalResonance +
      dimensions.themeConnection * weights.themeConnection +
      dimensions.pacingEffect * weights.pacingEffect,
      0,
      100
    )
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(
    purpose: ScenePurposeType,
    necessity: NecessityLevel,
    impact: ImpactDimension,
    connections: SceneConnection[]
  ): string[] {
    const recommendations: string[] = []

    if (necessity === 'redundant') {
      recommendations.push('此场景与其他场景功能重复，考虑合并或删除')
    }

    if (necessity === 'optional') {
      recommendations.push('此场景为可选内容，可考虑精简或增强其独特价值')
    }

    if (connections.length === 0) {
      recommendations.push('此场景缺乏与其他场景的关联，考虑增加过渡或连接元素')
    }

    if (purpose === 'transition' && impact.pacingEffect < 30) {
      recommendations.push('过渡场景过于平淡，可适当增加信息量或情感色彩')
    }

    if (purpose === 'world_building' && impact.themeConnection < 30) {
      recommendations.push('世界观构建场景与主题关联较弱，考虑强化主题连接')
    }

    if (purpose === 'tension_build' && impact.tensionBuild < 50) {
      recommendations.push('张力构建不足，需要更强烈的紧迫感元素')
    }

    const overallImpactVal = this.calculateOverallImpact(impact)
    if (overallImpactVal > 70) {
      recommendations.push('这是一个高价值场景，确保其完全发挥影响力')
    }

    return recommendations
  }

  // ─── 批量分析 ──────────────────────────────────────────────────────────

  /**
   * 分析章节内所有场景
   */
  analyzeChapterScenes(
    chapterId: number,
    scenes: Array<{
      sceneId: number
      content: string
      previousSceneId?: number
      nextSceneId?: number
      characters?: Array<{ id: string; name: string; state: string }>
    }>
  ): ChapterSceneAnalysis {
    const purposes: ScenePurpose[] = []

    for (const scene of scenes) {
      const purpose = this.identifyScenePurpose(
        scene.sceneId,
        chapterId,
        scene.content,
        {
          previousSceneId: scene.previousSceneId,
          nextSceneId: scene.nextSceneId,
          characters: scene.characters,
          existingPurposes: purposes,
        }
      )
      purposes.push(purpose)
    }

    const totalNecessityScore = average(purposes.map(p => p.necessityScore))
    const averageImpact = average(purposes.map(p => p.overallImpact))
    const redundantScenes = purposes
      .filter(p => p.necessityLevel === 'redundant')
      .map(p => p.sceneId)

    const pacingProfile = this.determinePacingProfile(purposes)

    return {
      chapterId,
      sceneCount: scenes.length,
      purposes,
      totalNecessityScore,
      averageImpact,
      redundantScenes,
      pacingProfile,
      recommendations: this.generateChapterRecommendations(
        totalNecessityScore,
        averageImpact,
        redundantScenes,
        pacingProfile
      ),
    }
  }

  private determinePacingProfile(purposes: ScenePurpose[]): 'slow' | 'moderate' | 'fast' | 'uneven' {
    if (purposes.length < 2) return 'moderate'

    const tensions = purposes.map(p => {
      if (p.primaryPurpose === 'tension_build') return 80
      if (p.primaryPurpose === 'relaxation') return 20
      return 50
    })

    const variance = tensions.reduce((acc, t, i, arr) => {
      if (i === 0) return 0
      return acc + Math.abs(t - arr[i - 1])
    }, 0) / (tensions.length - 1)

    if (variance > 30) return 'uneven'
    if (average(tensions) > 65) return 'fast'
    if (average(tensions) < 40) return 'slow'
    return 'moderate'
  }

  private generateChapterRecommendations(
    necessityScore: number,
    impactScore: number,
    redundantScenes: number[],
    pacingProfile: 'slow' | 'moderate' | 'fast' | 'uneven'
  ): string[] {
    const recommendations: string[] = []

    if (redundantScenes.length > 0) {
      recommendations.push(`检测到${redundantScenes.length}个冗余场景，建议合并或删除`)
    }

    if (necessityScore < 50) {
      recommendations.push('章节整体必要性偏低，考虑增加核心场景')
    }

    if (pacingProfile === 'uneven') {
      recommendations.push('节奏波动过大，建议平滑过渡')
    }

    if (pacingProfile === 'slow') {
      recommendations.push('节奏偏慢，可考虑增加冲突或悬念')
    }

    if (impactScore > 70) {
      recommendations.push('章节影响力突出，是情感或情节的关键节点')
    }

    return recommendations
  }

  // ─── 查询接口 ───────────────────────────────────────────────────────────

  getScenePurpose(sceneId: number): ScenePurpose | undefined {
    for (const purpose of this.purposes.values()) {
      if (purpose.sceneId === sceneId) {
        return purpose
      }
    }
    return undefined
  }

  getChapterPurposes(chapterId: number): ScenePurpose[] {
    return Array.from(this.purposes.values()).filter(p => p.chapterId === chapterId)
  }

  getSummary(): SceneAnalysisSummary[] {
    return Array.from(this.purposes.values()).map(p => ({
      sceneId: p.sceneId,
      chapterId: p.chapterId,
      purposeCount: p.secondaryPurposes.length + 1,
      dominantPurpose: p.primaryPurpose,
      necessityLevel: p.necessityLevel,
      impactScore: p.overallImpact,
      redundancyRisk: p.necessityLevel === 'redundant' ? 'high' :
                      p.necessityLevel === 'optional' ? 'medium' : 'low',
      optimizationHints: p.recommendations,
    }))
  }

  // ─── 自我进化（从Lesson学习） ──────────────────────────────────────────

  learnFromLesson(lesson: Lesson): void {
    if (lesson.type !== 'scene_analysis') return

    const { sceneId, feedback, adjustment } = lesson
    const purpose = this.getScenePurpose(sceneId)
    if (!purpose) return

    // 根据反馈调整权重
    if (feedback.necessityScore) {
      const adjustmentFactor = adjustment?.necessityWeight || 0.1
      purpose.necessityScore = clamp(
        purpose.necessityScore + feedback.necessityScore * adjustmentFactor,
        0,
        100
      )
    }

    if (feedback.impactScores) {
      for (const [dim, score] of Object.entries(feedback.impactScores)) {
        const current = purpose.impactDimensions[dim as keyof ImpactDimension] || 0
        purpose.impactDimensions[dim as keyof ImpactDimension] = clamp(
          current + (score - current) * 0.1,
          0,
          100
        )
      }
    }

    purpose.timestamp = Date.now()
    this.saveToStorage()
  }
}

export default ScenePurposeIdentifier