/**
 * V22 记忆存储系统 - 类型定义
 * Phase 1: 记忆存储架构
 * 
 * 包含 V14 旧类型（保持向后兼容）和 V22 新类型
 */

// ==================== V22 新类型 ====================

// 记忆类型
export type MemoryType = 'character' | 'plot' | 'setting' | 'style' | 'timeline'

// 通用记忆条目
export interface MemoryEntry {
  id: string
  type: MemoryType
  key: string
  value: string
  chapter: number
  createdAt: number
  updatedAt: number
  accessCount: number
  lastAccessedAt: number
  importance: number  // 0-100
  tags: string[]
  metadata: Record<string, any>
}

// ============ V22 角色记忆 ============
export interface V22CharacterMemory {
  id: string
  characterId: string
  name: string
  personalityTraits: string[]
  relationships: Map<string, RelationshipSnapshot>
  emotionalArc: EmotionalArcSnapshot[]
  appearances: AppearanceSnapshot[]
  growthLog: GrowthEvent[]
  beliefChanges: BeliefChange[]
  consistencyScore: number
  lastAppearance: number
  totalAppearances: number
}

export interface RelationshipSnapshot {
  targetId: string
  targetName: string
  relationship: string
  dynamic: string
  chapter: number
  timestamp: number
}

export interface EmotionalArcSnapshot {
  emotion: string
  intensity: number
  chapter: number
  context: string
  timestamp: number
}

export interface AppearanceSnapshot {
  chapter: number
  scene: string
  description: string
  mood: string
}

export interface GrowthEvent {
  chapter: number
  event: string
  impact: 'major' | 'minor'
  affectedTraits: string[]
  timestamp: number
}

export interface BeliefChange {
  chapter: number
  before: string
  after: string
  reason: string
  timestamp: number
}

// ============ V22 情节记忆 ============
export interface V22PlotMemory {
  id: string
  plotPointId: string
  foreshadowings: Foreshadowing[]
  themes: string[]
  themeOccurrences: ThemeOccurrence[]
  conflicts: ConflictRecord[]
  clues: Clue[]
}

export interface Foreshadowing {
  id: string
  hint: string
  chapter: number
  payoffChapter?: number
  status: 'unresolved' | 'hinted' | 'resolved'
  relatedCharacters: string[]
}

export interface ThemeOccurrence {
  theme: string
  chapter: number
  manifestation: string
  intensity: number
}

export interface ConflictRecord {
  id: string
  type: 'internal' | 'external' | 'interpersonal'
  description: string
  chapter: number
  status: 'active' | 'escalating' | 'resolved'
  resolution?: string
}

export interface Clue {
  id: string
  description: string
  chapter: number
  importance: 'red herring' | 'minor' | 'key'
  revealedToReader: boolean
  discoveredByCharacters: string[]
}

// ============ V22 风格记忆 ============
export interface V22StyleMemory {
  id: string
  sentencePatterns: PatternRecord[]
  vocabularyPreferences: VocabularyPreference[]
  dialoguePatterns: DialoguePattern[]
  pacingProfile: PacingProfile
  lastUpdated: number
  confidence: number
}

export interface PatternRecord {
  pattern: string
  frequency: number
  examples: string[]
  chapterAppearances: number[]
}

export interface VocabularyPreference {
  word: string
  frequency: number
  context: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
}

export interface DialoguePattern {
  characterId: string
  speechTraits: string[]
  commonPhrases: string[]
  vocabularyLevel: number
  formalityLevel: number
}

export interface PacingProfile {
  averageChapterLength: number
  dialogueRatio: number
  descriptionDensity: number
  actionFrequency: number
  tensionCurve: number[]
}

// ============ V22 时间线事件 ============
export interface V22TimelineEvent {
  id: string
  chapter: number
  sequence: number
  type: 'plot' | 'character' | 'setting'
  description: string
  participants: string[]
  timestamp: number
  importance: number
}

// ============ 一致性检查结果 ============
export interface ConsistencyIssue {
  type: 'character_state' | 'plot_logic' | 'world_rule' | 'timeline' | 'style'
  severity: 'minor' | 'major' | 'critical'
  description: string
  location?: { chapterId: number, paragraph: number }
  existingInfo: string
  newInfo: string
  suggestion?: string
}

// ============ 记忆存储数据结构 ============
export interface MemoryStorageData {
  projectId: number
  memories: MemoryEntry[]
  characterMemories: V22CharacterMemory[]
  plotMemories: V22PlotMemory[]
  styleMemory: V22StyleMemory | null
  timeline: V22TimelineEvent[]
  updatedAt: number
}

// localStorage keys
export const STORAGE_KEYS = {
  MEMORY: 'ai-novel-memory',
  CHARACTER: 'ai-novel-character',
  PLOT: 'ai-novel-plot',
  STYLE: 'ai-novel-style',
  TIMELINE: 'ai-novel-timeline',
} as const

// ==================== V14 旧类型（保持向后兼容） ====================

// 角色记忆（旧）- 与现有代码兼容
export interface CharacterMemory {
  id: string
  name: string
  currentState: string  // 当前状态描述
  personalityTraits: string[]  // 性格特征
  relationships: Map<string, RelationshipType>  // 关系
  arcHistory: ArcChange[]  // 弧线变化历史
  keyEvents: string[]  // 关键事件
  createdAt: number
  updatedAt: number
}

export type RelationshipType = 
  | 'friend' 
  | 'enemy' 
  | 'lover' 
  | 'family' 
  | 'colleague' 
  | 'stranger'
  | 'rival'

export interface ArcChange {
  chapterId: number
  beforeState: string
  afterState: string
  changeType: 'growth' | 'decline' | 'shift' | 'unchanged'
  description: string
}

// 地点/场景记忆
export interface LocationMemory {
  id: string
  name: string
  description: string
  relatedEvents: string[]
  createdAt: number
  updatedAt: number
}

// 情节线/伏笔
export interface PlotThread {
  id: string
  tag: string
  description: string
  status: 'active' | 'resolved' | 'abandoned'
  plantedInChapter: number
  resolvedInChapter?: number
  resolutionNote?: string
  relatedCharacters: string[]
  createdAt: number
  updatedAt: number
}

// 章节摘要
export interface ChapterSummary {
  chapterId: number
  title: string
  summary: string
  keyEvents: string[]
  characterStates: Record<string, string>  // characterId -> state
  wordCount: number
  createdAt: number
}

// 世界观规则
export interface WorldRule {
  id: string
  content: string
  category: 'magic' | 'society' | 'technology' | 'history' | 'other'
  description?: string
  createdAt: number
}

// 项目记忆（根容器）
export interface ProjectMemory {
  projectId: number
  characters: Map<string, CharacterMemory>
  locations: Map<string, LocationMemory>
  plotThreads: PlotThread[]
  worldRules: WorldRule[]
  chapterSummaries: ChapterSummary[]
  createdAt: number
  updatedAt: number
}

// 内存缓存（避免频繁读数据库）
export interface MemoryCache {
  projectId: number
  memory: ProjectMemory | null
  lastLoaded: number
  isDirty: boolean
}
