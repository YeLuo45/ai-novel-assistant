/**
 * 章节摘要生成器
 * V14 Phase 4: 使用 LLM 自动生成章节摘要
 */

import { callLLM } from '../llm'

/**
 * 使用 LLM 自动生成章节摘要
 */
export async function generateChapterSummary(
  chapterTitle: string,
  chapterContent: string,
  contextBefore?: string
): Promise<{
  summary: string
  keyEvents: string[]
  characterStates: Record<string, string>
}> {
  const systemPrompt = `你是专业的小说编辑，擅长提炼章节要点。

请分析以下章节，输出：
1. 100-200字的章节摘要
2. 3-5个关键事件（用一句话描述）
3. 角色状态变化（如：主角：从犹豫变为坚定）

输出格式（JSON）：
{
  "summary": "...",
  "keyEvents": ["...", "...", "..."],
  "characterStates": {"角色名": "状态描述", ...}
}`

  const userPrompt = `【章节标题】${chapterTitle}

【前文衔接】${contextBefore || '（无）'}

【章节内容】
${chapterContent.slice(0, 5000)}${chapterContent.length > 5000 ? '...(内容截断)' : ''}`

  try {
    const response = await callLLM({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      maxTokens: 1500
    }, 'summary-generator')

    const result = JSON.parse(response)
    return {
      summary: result.summary || '',
      keyEvents: result.keyEvents || [],
      characterStates: result.characterStates || {}
    }
  } catch (error) {
    console.error('生成章节摘要失败:', error)
    return {
      summary: chapterContent.slice(0, 200) + '...',
      keyEvents: [],
      characterStates: {}
    }
  }
}