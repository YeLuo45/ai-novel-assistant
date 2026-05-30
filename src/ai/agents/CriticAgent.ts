/**
 * CriticAgent
 * 负责质量评审、逻辑检查、改进建议
 */

import { callLLM } from '../llm'

export interface CritiqueResult {
  score: number
  improvements: string[]
  content: string
}

/**
 * 对内容进行评审
 */
export async function critique(
  content: string,
  context?: {
    genre?: string
    chapterTitle?: string
  }
): Promise<CritiqueResult> {
  const critiquePrompt = `请评审以下写作内容，给出1-10的质量分和改进建议。

${context?.chapterTitle ? `章节标题: ${context.chapterTitle}` : ''}
${context?.genre ? `题材: ${context.genre}` : ''}

【内容】
${content}

请给出：
1. 质量评分（1-10）
2. 改进建议（列出具体问题）
`

  const result = await callLLM({
    model: 'current',
    messages: [{ role: 'user', content: critiquePrompt }],
    systemPrompt: `你是一位专业的小说评论家。你擅长：
- 从情节、人物、文笔、逻辑四个维度评审
- 给出具体的改进建议
- 发现潜在的问题和风险
- 提供客观公正的质量评分`
  }, 'critic-agent')

  return {
    score: 7, // 简单处理，实际应该解析 result
    improvements: [],
    content: result
  }
}