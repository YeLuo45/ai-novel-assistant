/**
 * 多智能体协作引擎 - 类型定义
 * Phase 1: 核心类型定义
 */

// Agent ID（4个）V13 新增 CriticAgent
export type AgentId = 'PlotExpert' | 'DialogueMaster' | 'StyleGuard' | 'CriticAgent'

// 任务类型
export type TaskType = 'plot_design' | 'dialogue_generation' | 'style_check'

// Subtask
export interface Subtask {
  id: string
  type: TaskType
  description: string
  responsible: AgentId
  dependencies: string[]
  priority: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  output?: string
  error?: string
}

// Agent 输出
export interface AgentOutput {
  agentId: AgentId
  content: string
  confidence: number
  warnings?: string[]
  metadata?: Record<string, unknown>
}

// 视角类型（独立定义，不依赖 db.ts）
export type ViewpointType = 'first_person' | 'third_person_limited' | 'third_person_omniscient'

// 共享上下文（简化版，不依赖 db.ts 的 ViewpointType）
export interface WritingContext {
  sessionId: string
  projectId: number
  userRequest: string
  viewpoint: ViewpointType
  povCharacter: string
  genre: string
  contextBefore: string
  contextAfter: string
  chapterTitle: string
  chapterOutline: string
  targetWordCount: number
  outputs: Map<AgentId, AgentOutput>
  sharedData: {
    keyEntities: Entity[]
    plotPoints: PlotPoint[]
    styleProfile: StyleProfile
  }
}

// 实体
export interface Entity {
  name: string
  type: 'character' | 'item' | 'location'
  currentState: string
  lastMentioned?: string
}

// 情节点
export interface PlotPoint {
  id: string
  type: 'setup' | 'development' | 'climax' | 'resolution'
  description: string
  chapter?: string
  confirmed: boolean
}

// 文风档案
export interface StyleProfile {
  avgSentenceLength: number
  dialogueRatio: number
  commonPhrases: string[]
}

// 协作会话
export interface CollaborationSession {
  id: string
  userRequest: string
  subtasks: Subtask[]
  context: WritingContext
  status: 'decomposing' | 'executing' | 'aggregating' | 'done' | 'failed'
  createdAt: number
  updatedAt: number
}

// ============ PlotExpert 增强类型 ============

export interface PlotNode {
  id: string
  type: 'setup' | 'development' | 'climax' | 'resolution' | 'foreshadow' | 'callback'
  description: string
  emotionalTone: 'calm' | 'tense' | 'excited' | 'sad' | 'joyful'
  foreshadowingTags?: string[]
  characterArcChanges?: Record<string, 'growth' | 'decline' | 'shift' | 'unchanged'>
}

export interface WorldBuildingNote {
  category: 'location' | 'faction' | 'rule' | 'history'
  content: string
}

export interface CharacterArc {
  characterId: string
  beforeState: string
  afterState: string
  changeType: 'growth' | 'decline' | 'shift' | 'unchanged'
}

export interface ForeshadowingRecord {
  planted: Array<{ tag: string, description: string, plotNodeId: string }>
  resolved: Array<{ tag: string, resolvedIn: string }>
}

export interface PlotExpertOutput {
  structure: PlotNode[]
  worldBuilding?: WorldBuildingNote[]
  characterArcs: CharacterArc[]
  foreshadowing: ForeshadowingRecord
  emotionCurve: number[]
}

// ============ DialogueMaster 增强类型 ============

export type EmotionTag = 'neutral' | 'angry' | 'sad' | 'happy' | 'fearful' | 'sarcastic' | 'surprised' | 'disgusted'

export interface DialogueTurn {
  characterId: string
  content: string
  subtext?: string
  emotionTag: EmotionTag
  action?: string
}

export interface DialogueScene {
  setting: string
  turns: DialogueTurn[]
  atmosphere: string
}

export interface DialogueMasterOutput {
  scenes: DialogueScene[]
  characterEmotionCurves: Record<string, number[]>
}

// ============ StyleGuard 增强类型 ============

export type StyleIssueType = 'sentence_length' | 'vocabulary' | 'consistency' | 'readability' | 'sensitive' | 'genre_mismatch'

export interface StyleIssue {
  paragraphIndex: number
  lineNumber?: number
  type: StyleIssueType
  severity: 'minor' | 'moderate' | 'major'
  description: string
  suggestion?: string
}

export interface StyleReport {
  overallScore: number
  readabilityIndex: number
  dialogueRatio: number
  issues: StyleIssue[]
  genreAlignment: 'match' | 'partial' | 'mismatch'
}

// ============ CriticAgent 类型（新增）============

export type QualityDimension = 'plot' | 'character' | 'writing' | 'logic'

export interface CriticScore {
  dimension: QualityDimension
  score: number
  findings: string[]
}

export interface CriticReport {
  overallScore: number
  scores: CriticScore[]
  improvements: string[]
  risks: string[]
  consistencyIssues: string[]
}
