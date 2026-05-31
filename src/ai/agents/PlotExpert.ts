/**
 * PlotExpert Agent
 * 负责情节设计、故事大纲、伏笔铺设等专业任务
 * V36: 事件驱动架构
 */

import { routeToAgent, type RouteContext } from '../router'
import { messageBus, CHANNEL } from '../messageBus'

export const PlotExpert = {
  /**
   * 执行情节设计任务 (异步 + 事件驱动)
   */
  async execute(input: string, context: RouteContext): Promise<string> {
    // 发送开始事件
    messageBus.emit(CHANNEL.PLOT_EXPERT_START, { input, context })

    try {
      const result = await routeToAgent(input, context)

      // 发送完成事件
      messageBus.emit(CHANNEL.PLOT_EXPERT_COMPLETE, { output: result.content })
      messageBus.emit(CHANNEL.PLOT_EXPERT_OUTPUT, { output: result.content })

      return result.content
    } catch (error) {
      // 发送错误事件
      messageBus.emit(CHANNEL.AGENT_ERROR, {
        agent: 'PlotExpert',
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }
}