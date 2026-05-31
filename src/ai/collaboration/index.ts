/**
 * 多智能体协作引擎 - Phase 1-3 导出
 */

export * from './types'
export * from './agentRegistry'
export * from './writingContext'
export { decomposeTask, getReadyTasks, allTasksCompleted } from './taskDecomposer'
export { detectConflicts, resolveConflicts } from './conflictResolver'
export { CollaborationOrchestrator, type CollaborationOptions } from './orchestrator'
export { aggregate } from './resultAggregator'
export { callCriticAgent } from './criticAgent'
export { CollaborationServer, collaborationServer } from './CollaborationServer'
