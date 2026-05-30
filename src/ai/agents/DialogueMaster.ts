/**
 * DialogueMaster Agent
 * 负责对话生成、角色语气、台词润色等专业任务
 */

import { routeToAgent, type RouteContext } from '../router'

export const DialogueMaster = {
  /**
   * 执行对话生成任务
   */
  async execute(input: string, context: RouteContext): Promise<string> {
    const result = await routeToAgent(input, context)
    return result.content
  }
}