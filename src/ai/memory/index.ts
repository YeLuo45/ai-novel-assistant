/**
 * V49 Memory System - 入口
 * 五层记忆系统（L0-L4）完整实现
 */

// 导出类型
export * from './types'

// 导出长期记忆管理器 (V22)
import { longTermMemoryManager } from './LongTermMemoryManager'
import { LongTermMemoryManager } from './LongTermMemoryManager'
export { longTermMemoryManager, LongTermMemoryManager }

// 保留V14兼容
export { memoryManager } from './memoryManager'

// Phase 4: 章节摘要生成 & 一致性检查
export { generateChapterSummary } from './chapterSummaryGenerator'
export { checkConsistency, checkCharacterConsistency, checkPlotConsistency } from './consistencyChecker'

// Phase 2: 一致性检查器 & 风格学习器
export { consistencyChecker, ConsistencyChecker } from './consistencyChecker.V22'
export { styleLearner, StyleLearner } from './StyleLearner'

// V49: 五层记忆系统
export { sensoryMemory, SensoryMemory } from './SensoryMemory'
export type { SensoryEntry, DecayConfig } from './SensoryMemory'

export { workingMemory, WorkingMemory } from './WorkingMemory'
export type { WorkingEntry, WorkingMemoryConfig } from './WorkingMemory'

export { episodicMemory, EpisodicMemory } from './EpisodicMemory'
export type { Episode, EpisodeQuery } from './EpisodicMemory'

export { forgettingEngine, ForgettingEngine } from './ForgettingEngine'
export type { ForgettingPolicy, ForgettingPolicyType, ForgettingLog } from './ForgettingEngine'

export { semanticMemory, SemanticMemory } from './SemanticMemory'
export type { KnowledgeNode, KnowledgeNodeType, KnowledgeEdge, GraphQuery, TraverseOptions } from './SemanticMemory'

export { proceduralMemory, ProceduralMemory } from './ProceduralMemory'
export type { SkillProcedure, ExecutionResult, SkillQuery } from './ProceduralMemory'

export { memoryOrchestrator, MemoryOrchestrator } from './MemoryOrchestrator'
export type { MemoryOrchestratorStats, CrossLayerQuery, MemoryResult, MemoryTier } from './MemoryOrchestrator'
