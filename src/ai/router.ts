/**
 * AI 路由编排器
 * 根据任务复杂度评估结果，将任务路由到合适的专业角色
 */

import { evaluateComplexity, type ComplexityResult } from './TaskComplexityEvaluator'
import { buildRolePrompt, type AgentRole } from './RolePromptBuilder'
import { callLLM } from './llm'

export interface RouteContext {
  projectId: number
  genre?: string
  characterNames?: string[]
}

export interface RouteResult {
  content: string
  complexity: ComplexityResult
  critique?: string
}

/**
 * 路由到合适的 Agent 并执行
 */
export async function routeToAgent(
  input: string,
  context: RouteContext
): Promise<RouteResult> {
  // 1. 评估复杂度
  const complexity = evaluateComplexity(input)
  const role: AgentRole = complexity.routingHint

  // 2. 构建角色提示词
  const systemPrompt = buildRolePrompt(role, {
    projectId: context.projectId,
    genre: context.genre,
    characterNames: context.characterNames
  })

  // 3. 调用 LLM
  const result = await callLLM({
    model: 'current',
    messages: [{ role: 'user', content: input }],
    systemPrompt
  }, 'router')

  // 4. 交给 CriticAgent 评审
  const critique = await callLLM({
    model: 'current',
    messages: [
      { role: 'user', content: `请评审以下写作内容，给出1-10的质量分和改进建议:\n${result}` }
    ],
    systemPrompt: `你是一位专业的小说评论家。你擅长：
- 从情节、人物、文笔、逻辑四个维度评审
- 给出具体的改进建议
- 发现潜在的问题和风险
- 提供客观公正的质量评分`
  }, 'router-critique')

  return {
    content: result,
    complexity,
    critique
  }
}

/**
 * 获取复杂度评估结果（不执行路由）
 */
export function getComplexity(input: string): ComplexityResult {
  return evaluateComplexity(input)
}