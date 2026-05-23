/**
 * V38 Agent Memory Hierarchy - 类型定义
 * 五层记忆系统（L0-L4）+ 自我进化机制
 * 
 * L0 (瞬时记忆): 当前上下文，GPT-style，轮次间清空
 * L1 (工作记忆): 当前会话的写作上下文，Dexie 表 session_memory
 * L2 (会话记忆): 历史会话摘要，Dexie 表 conversation_summaries
 * L3 (项目记忆): 当前项目素材/大纲/章节版本，Dexie 表 project_memory
 * L4 (长期记忆): 所有历史项目 + 自我进化的 Skill Tree，Dexie 表 long_term_memory
 */

// ==================== 核心类型 ====================

// 记忆层级
export type MemoryLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4'

// 记忆上下文（写入记忆时使用）
export interface MemoryContext {
  level: MemoryLevel
  sessionId: string
  projectId?: number
  content: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

// 单条记忆条目
export interface Memory {
  id: string
  level: MemoryLevel
  sessionId: string
  projectId?: number
  content: string
  tags: string[]
  createdAt: number
  lastAccessed: number
  accessCount: number
  importance: number  // 0-100
  metadata: Record<string, unknown>
}

// ==================== Lesson & Skill（自我进化核心） ====================

// 经验教训（任务完成后提取）
export interface Lesson {
  task: string           // 任务描述
  approach: string       // 解决方法
  outcome: 'success' | 'partial' | 'failed'
  context: Record<string, unknown>
  createdAt: number
}

// 技能（从Lesson结晶而来）
export interface Skill {
  id: string
  name: string
  task: string           // 触发条件描述
  steps: string[]        // 执行步骤
  triggers: string[]     // 触发关键词（用于检索）
  useCount: number      // 使用次数
  successCount: number  // 成功次数
  successRate: number   // 成功率 (0-1)
  createdAt: number
  lastUsed: number
  avgExecutionTime?: number  // 平均执行时间(ms)
  relatedSkills?: string[]   // 相关技能ID
  version: number           // 技能版本（迭代用）
}

// ==================== Dream Memory（两阶段压缩） ====================

// 记忆事件（在线时收集）
export interface MemoryEvent {
  id: string
  sessionId: string
  event: string          // 事件类型: 'writing:start' | 'writing:complete' | 'skill:used' | etc.
  data: Record<string, unknown>
  timestamp: number
  compressed: boolean
}

// 梦境会话（定期压缩）
export interface DreamSession {
  id: string
  sessionId: string
  projectId?: number
  events: MemoryEvent[]
  summary?: string       // 压缩后的摘要
  extractedSkills?: string[]  // 提取的技能ID
  compressed: boolean
  dreamPhase: 'awake' | 'collecting' | 'sleeping' | 'consolidated'
  createdAt: number
  consolidatedAt?: number
}

// ==================== L1 工作记忆 ====================

export interface SessionMemory {
  id?: number
  sessionId: string
  projectId?: number
  content: string
  memoryType: 'context' | 'working' | 'temporary'
  tags: string[]
  createdAt: number
  expiresAt?: number  // L0 瞬时记忆的过期时间
}

// ==================== L2 会话记忆 ====================

export interface ConversationSummary {
  id?: number
  sessionId: string
  projectId?: number
  summary: string
  keywords: string[]
  memoryCount: number
  skillIds: string[]    // 涉及到的技能
  createdAt: number
}

// ==================== L4 长期记忆（Skill Tree） ====================

export interface LongTermMemory {
  id?: number
  type: 'experience' | 'skill' | 'insight' | 'pattern'
  content: string
  tags: string[]
  skillId?: string      // 如果是技能相关
  projectId?: number    // 如果是项目相关
  importance: number    // 0-100
  accessCount: number
  lastAccessed: number
  createdAt: number
}

// ==================== Skill Tree 结构 ====================

export interface SkillTree {
  rootSkills: string[]           // 根技能ID
  skills: Map<string, Skill>     // 所有技能
  skillRelations: SkillRelation[]  // 技能关系
}

export interface SkillRelation {
  sourceId: string
  targetId: string
  relationType: 'requires' | 'enhances' | 'alternative'
}

// ==================== 记忆检索 ====================

export interface MemoryQuery {
  query: string
  scope?: 'local' | 'project' | 'global'  // local=L0/L1, project=L3, global=L4
  limit?: number
  tags?: string[]
  level?: MemoryLevel
}

export interface SkillQuery {
  task: string
  limit?: number
  minSuccessRate?: number
}

// ==================== 一致性检查 ====================

export interface ConsistencyResult {
  hasIssue: boolean
  issues: ConsistencyIssue[]
}

export interface ConsistencyIssue {
  type: 'timeline' | 'character' | 'plot' | 'style'
  severity: 'minor' | 'major' | 'critical'
  description: string
  location?: { chapterId: number; paragraph: number }
  existingInfo: string
  newInfo: string
  suggestion?: string
}

// ==================== 统计类型 ====================

export interface MemoryStats {
  totalMemories: number
  byLevel: Record<MemoryLevel, number>
  totalSkills: number
  skillSuccessRates: Record<string, number>
  dreamSessionCount: number
  lastConsolidated?: number
}

// ==================== 导出类型 ====================

export type {
  SessionMemory,
  ConversationSummary,
  LongTermMemory,
  DreamSession,
  MemoryEvent,
  MemoryQuery,
  SkillQuery
}