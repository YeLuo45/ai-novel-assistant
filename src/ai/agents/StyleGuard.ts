/**
 * StyleGuard Agent
 * 负责文风检查、错别字、标点等专业任务
 * V36: 事件驱动架构
 */

import { routeToAgent, type RouteContext } from '../router'
import { messageBus, CHANNEL } from '../messageBus'

export const StyleGuard = {
  /**
   * 执行文字校对任务 (异步 + 事件驱动)
   */
  async execute(input: string, context: RouteContext): Promise<string> {
    // 发送开始事件
    messageBus.emit(CHANNEL.STYLE_GUARD_START, { input, context })

    try {
      const result = await routeToAgent(input, context)

      // 发送完成事件
      messageBus.emit(CHANNEL.STYLE_GUARD_COMPLETE, { output: result.content })
      messageBus.emit(CHANNEL.STYLE_GUARD_OUTPUT, { output: result.content })

      return result.content
    } catch (error) {
      // 发送错误事件
      messageBus.emit(CHANNEL.AGENT_ERROR, {
        agent: 'StyleGuard',
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }
}