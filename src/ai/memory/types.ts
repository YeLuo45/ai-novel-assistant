/**
 * 跨章节记忆系统 - 类型定义
 * V14 Phase 1
 */

// 角色记忆
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

// 一致性检查
export interface ConsistencyIssue {
  type: 'character_state' | 'plot_logic' | 'world_rule' | 'timeline'
  severity: 'minor' | 'major' | 'critical'
  description: string
  location?: { chapterId: number, paragraph: number }
  existingInfo: string
  newInfo: string
  suggestion?: string
}

// 内存缓存（避免频繁读数据库）
export interface MemoryCache {
  projectId: number
  memory: ProjectMemory | null
  lastLoaded: number
  isDirty: boolean
}
