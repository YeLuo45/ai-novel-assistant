/**
 * 结果聚合器 - Phase 3
 * 聚合多 Agent 输出，生成最终章节
 */

import { callLLM } from '../llm'
import type { WritingContext, Subtask } from './types'

/**
 * 聚合多 Agent 输出，生成最终章节
 */
export async function aggregate(
  context: WritingContext,
  subtasks: Subtask[]
): Promise<string> {
  const plotOutput = subtasks.find(t => t.id === 't1')?.output || ''
  const dialogueOutput = subtasks.find(t => t.id === 't2')?.output || ''
  const styleReport = subtasks.find(t => t.id === 't3')?.output || ''

  const systemPrompt = `你是小说出版编辑，擅长整合专家团队的意见，生成高质量的章节内容。

你的职责：
1. 综合各方专家的意见，生成连贯的章节
2. 确保情节逻辑清晰，对话自然
3. 保持文风一致性
4. 注意前后文衔接`

  const userPrompt = `请基于以下专家团队的意见，生成章节「${context.chapterTitle}」。

【PlotExpert 情节设计】
${plotOutput || '（未提供）'}

【DialogueMaster 对白】
${dialogueOutput || '（未提供）'}

【StyleGuard 文风报告】
${styleReport || '（未提供）'}

【前文衔接要求】
${context.contextBefore || '（无前文）'}

【写作风格】
- 叙事视角：${context.viewpoint}
- 目标字数：约${context.targetWordCount}字
- 类型：${context.genre}

请整合以上内容，生成完整、连贯、高质量的章节内容。`

  const result = await callLLM({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    maxTokens: context.targetWordCount * 2
  }, 'collab-aggregator')

  return result
}
