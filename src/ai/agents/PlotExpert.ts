/**
 * PlotExpert Agent
 * 负责情节设计、故事大纲、伏笔铺设等专业任务
 */

import { routeToAgent, type RouteContext } from '../router'

export const PlotExpert = {
  /**
   * 执行情节设计任务
   */
  async execute(input: string, context: RouteContext): Promise<string> {
    const result = await routeToAgent(input, context)
    return result.content
  }
}