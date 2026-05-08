/**
 * 跨章节记忆系统 - 入口
 * V14 Phase 1-4
 */

export * from './types'
export { memoryManager } from './memoryManager'

// Phase 4: 章节摘要生成 & 一致性检查
export { generateChapterSummary } from './chapterSummaryGenerator'
export { checkConsistency, checkCharacterConsistency, checkPlotConsistency } from './consistencyChecker'
