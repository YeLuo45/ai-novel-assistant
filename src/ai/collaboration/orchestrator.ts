/**
 * 核心编排器 - Phase 3
 * 负责多 Agent 协作的调度、执行和结果聚合
 */

import { callLLM } from '../llm'
import type { WritingContext, Subtask, AgentOutput } from './types'
import { getAgentConfig, callAgentViaRegistry } from './agentRegistry'
import { createWritingContext, setAgentOutput } from './writingContext'
import { decomposeTask, getReadyTasks, allTasksCompleted } from './taskDecomposer'
import { resolveConflicts } from './conflictResolver'
import { aggregate } from './resultAggregator'

export interface CollaborationOptions {
  projectId: number
  userRequest: string
  viewpoint: WritingContext['viewpoint']
  povCharacter: string
  genre: string
  contextBefore: string
  contextAfter: string
  chapterTitle: string
  chapterOutline: string
  targetWordCount: number
}

export class CollaborationOrchestrator {
  private context: WritingContext
  private subtasks: Subtask[] = []

  constructor(options: CollaborationOptions) {
    this.context = createWritingContext(options)
  }

  /**
   * 开始协作写作
   */
  async start(): Promise<string> {
    // 1. 分解任务
    this.subtasks = decomposeTask(this.context)

    // 2. 拓扑排序执行
    await this.executeTasks()

    // 3. 冲突处理
    resolveConflicts(this.subtasks, this.context)

    // 4. 聚合结果
    const result = await aggregate(this.context, this.subtasks)

    return result
  }

  /**
   * 执行所有 subtask（拓扑排序 + 并行）
   */
  private async executeTasks(): Promise<void> {
    while (!allTasksCompleted(this.subtasks)) {
      const readyTasks = getReadyTasks(this.subtasks)

      if (readyTasks.length === 0) {
        // 没有可执行的任务但仍有未完成的
        console.warn('[Orchestrator] No ready tasks but some still pending')
        break
      }

      // 并行执行所有就绪任务
      await Promise.all(readyTasks.map(t => this.executeSubtask(t)))
    }
  }

  /**
   * 执行单个 subtask
   */
  private async executeSubtask(subtask: Subtask): Promise<void> {
    const config = getAgentConfig(subtask.responsible)
    subtask.status = 'running'

    try {
      let output: string

      if (subtask.responsible === 'PlotExpert') {
        // PlotExpert 直接 LLM 调用
        output = await this.callPlotExpert(subtask)
      } else {
        // DialogueMaster / StyleGuard 通过 registry 代理
        output = await callAgentViaRegistry(subtask.responsible, this.buildParams(subtask))
      }

      subtask.output = output
      subtask.status = 'completed'

      // 写入 context
      const agentOutput: AgentOutput = {
        agentId: subtask.responsible,
        content: output,
        confidence: 0.8,
        warnings: []
      }
      setAgentOutput(this.context, subtask.responsible, agentOutput)

    } catch (error) {
      subtask.status = 'failed'
      subtask.error = error instanceof Error ? error.message : String(error)
      console.error(`[Orchestrator] Subtask ${subtask.id} failed:`, error)
    }
  }

  /**
   * PlotExpert 直接 LLM 调用
   */
  private async callPlotExpert(_subtask: Subtask): Promise<string> {
    const config = getAgentConfig('PlotExpert')

    const userPrompt = `请为以下章节设计情节结构：

【章节标题】${this.context.chapterTitle}
【写作要求】${this.context.userRequest}
【章节大纲】${this.context.chapterOutline || '（无）'}
【前文衔接】${this.context.contextBefore || '（无）'}
【目标字数】约${this.context.targetWordCount}字
【叙事视角】${this.context.viewpoint}

请设计：
1. 三段式结构：建立 → 对抗 → 高潮
2. 每段的字数分配
3. 情感曲线：平静 → 紧张 → 高潮
4. 关键情节点（2-3个）

输出格式：
## 情节结构
[结构描述]

## 情感曲线
[曲线描述]

## 关键情节点
1. [情节点1]
2. [情节点2]
3. [情节点3]`

    const response = await callLLM({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      maxTokens: 2000
    }, 'collab-PlotExpert')

    return response
  }

  /**
   * 构建 agent 参数
   */
  private buildParams(subtask: Subtask): Record<string, unknown> {
    const plotOutput = this.subtasks.find(t => t.id === 't1')?.output || ''

    switch (subtask.responsible) {
      case 'DialogueMaster':
        return {
          scene: `基于情节：${plotOutput}`,
          characters: [],  // TODO: 从项目素材库获取
          mood: 'conflicting',
          length: 'medium' as const,
          model: 'gpt-4o-mini'
        }
      case 'StyleGuard':
        return {
          projectId: this.context.projectId,
          chapterId: 0  // TODO: 需要实际章节 ID
        }
      default:
        return {}
    }
  }
}
