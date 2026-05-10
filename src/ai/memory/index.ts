/**
 * V22 记忆存储系统 - 入口
 * Phase 1: 记忆存储架构
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
