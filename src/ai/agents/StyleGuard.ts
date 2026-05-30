/**
 * StyleGuard Agent
 * 负责文风检查、错别字、标点等专业任务
 */

import { routeToAgent, type RouteContext } from '../router'

export const StyleGuard = {
  /**
   * 执行文字校对任务
   */
  async execute(input: string, context: RouteContext): Promise<string> {
    const result = await routeToAgent(input, context)
    return result.content
  }
}