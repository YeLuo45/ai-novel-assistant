/**
 * 任务分解器 - Phase 2
 * 将用户写作请求分解为 3 个有依赖关系的 subtask
 */

import type { WritingContext, Subtask } from './types'

/**
 * 分解写作任务为可执行的 subtask
 *
 * 依赖关系：
 * t1 (PlotExpert, 无依赖) → t2 (DialogueMaster, 依赖 t1) → t3 (StyleGuard, 依赖 t2)
 */
export function decomposeTask(context: WritingContext): Subtask[] {
  return [
    {
      id: 't1',
      type: 'plot_design',
      description: `设计「${context.chapterTitle}」的情节结构：${context.userRequest}`,
      responsible: 'PlotExpert',
      dependencies: [],
      priority: 1,
      status: 'pending'
    },
    {
      id: 't2',
      type: 'dialogue_generation',
      description: `基于情节设计生成「${context.chapterTitle}」的角色对话`,
      responsible: 'DialogueMaster',
      dependencies: ['t1'],
      priority: 2,
      status: 'pending'
    },
    {
      id: 't3',
      type: 'style_check',
      description: `检查「${context.chapterTitle}」的文风一致性和合规性`,
      responsible: 'StyleGuard',
      dependencies: ['t2'],
      priority: 3,
      status: 'pending'
    }
  ]
}

/**
 * 拓扑排序：获取可执行的 subtask（所有依赖都已完成）
 */
export function getReadyTasks(subtasks: Subtask[]): Subtask[] {
  return subtasks.filter(t => {
    if (t.status !== 'pending') return false
    return t.dependencies.every(depId => {
      const dep = subtasks.find(s => s.id === depId)
      return dep?.status === 'completed'
    })
  })
}

/**
 * 检查是否所有 subtask 都完成
 */
export function allTasksCompleted(subtasks: Subtask[]): boolean {
  return subtasks.every(t => t.status === 'completed' || t.status === 'failed')
}
