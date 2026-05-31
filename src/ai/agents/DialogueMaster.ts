/**
 * DialogueMaster Agent
 * 负责对话生成、角色语气、台词润色等专业任务
 * V36: 事件驱动架构
 */

import { routeToAgent, type RouteContext } from '../router'
import { messageBus, CHANNEL } from '../messageBus'

export const DialogueMaster = {
  /**
   * 执行对话生成任务 (异步 + 事件驱动)
   */
  async execute(input: string, context: RouteContext): Promise<string> {
    // 发送开始事件
    messageBus.emit(CHANNEL.DIALOGUE_MASTER_START, { input, context })

    try {
      const result = await routeToAgent(input, context)

      // 发送完成事件
      messageBus.emit(CHANNEL.DIALOGUE_MASTER_COMPLETE, { output: result.content })
      messageBus.emit(CHANNEL.DIALOGUE_MASTER_OUTPUT, { output: result.content })

      return result.content
    } catch (error) {
      // 发送错误事件
      messageBus.emit(CHANNEL.AGENT_ERROR, {
        agent: 'DialogueMaster',
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }
}