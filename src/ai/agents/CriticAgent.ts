/**
 * CriticAgent
 * 负责质量评审、逻辑检查、改进建议
 * V36: 事件驱动架构
 */

import { callLLM } from '../llm'
import { messageBus, CHANNEL } from '../messageBus'

export interface CritiqueResult {
  score: number
  improvements: string[]
  content: string
}

/**
 * 对内容进行评审 (异步 + 事件驱动)
 */
export async function critique(
  content: string,
  context?: {
    genre?: string
    chapterTitle?: string
  }
): Promise<CritiqueResult> {
  // 发送开始事件
  messageBus.emit(CHANNEL.CRITIC_AGENT_START, { content, context })

  try {
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

    const critiqueResult: CritiqueResult = {
      score: 7, // 简单处理，实际应该解析 result
      improvements: [],
      content: result
    }

    // 发送完成事件
    messageBus.emit(CHANNEL.CRITIC_AGENT_COMPLETE, { result: critiqueResult })
    messageBus.emit(CHANNEL.CRITIC_AGENT_OUTPUT, { output: result })

    return critiqueResult
  } catch (error) {
    // 发送错误事件
    messageBus.emit(CHANNEL.AGENT_ERROR, {
      agent: 'CriticAgent',
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}