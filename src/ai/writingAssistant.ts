/**
 * 智能写作建议模块
 * - 续写/润色/扩写/缩写
 * - 基于选中内容和上下文生成建议
 */

import { callLLM } from './llm'
import { streamLLM } from './llm'
import type { Observable } from './types'
import type { LLMEvent } from './types'

export type WritingAssistType = 'continue' | 'polish' | 'expand' | 'summarize'

export interface WritingAssistOptions {
  type: WritingAssistType
  selectedText: string
  contextBefore: string
  contextAfter: string
  model?: string
}

/**
 * 获取对应操作的 prompt 模板
 */
function buildPrompt(options: WritingAssistOptions): string {
  const { type, selectedText, contextBefore, contextAfter } = options

  switch (type) {
    case 'continue':
      return `你是一位专业的小说作家。请根据以下内容继续写作，保持文风、语调和叙事节奏的一致性。

要求：
1. 延续现有情节和人物
2. 保持相同的写作风格
3. 长度适中（300-500字）
4. 不要重复之前的内容

前文：
${contextBefore || '(无前文)'}

后文（如有）：
${contextAfter || '(无后文)'}

请继续写作：`

    case 'polish':
      return `你是一位专业的中文写作润色专家。请对以下文字进行润色，使其更加流畅、生动、富有表现力。

要求：
1. 保持原意不变
2. 改善句式结构
3. 优化用词
4. 提升文采

原文：
${selectedText}

润色后的版本：`

    case 'expand':
      return `你是一位专业的小说作家。请对以下内容进行扩写，增加细节描写、场景氛围和情感深度。

要求：
1. 保持原意和核心情节
2. 增加细节描写
3. 丰富场景氛围
4. 适当增加字数（扩写至1.5-2倍）
5. 前文后文衔接自然

前文：
${contextBefore || '(无前文)'}

原文：
${selectedText}

后文：
${contextAfter || '(无后文)'}

扩写后的版本：`

    case 'summarize':
      return `你是一位专业的内容编辑。请对以下内容进行缩写，保留核心信息和关键情节。

要求：
1. 保留核心要点
2. 删除冗余描写
3. 语言简洁精炼
4. 缩写至原文的1/3左右
5. 保持叙事连贯性

原文：
${selectedText}

缩写后的版本：`

    default:
      throw new Error(`Unknown writing assist type: ${type}`)
  }
}

const SYSTEM_PROMPT = '你是一位专业的小说创作助手，擅长写作润色、语法纠错、情节扩写缩写等工作。'

/**
 * 执行写作建议（非流式）
 */
export async function performWritingAssist(
  options: WritingAssistOptions
): Promise<string> {
  const { type, model = 'gpt-4o-mini' } = options
  const prompt = buildPrompt(options)

  const response = await callLLM({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7
  }, 'writing-assist')

  return response
}

/**
 * 执行写作建议（流式）
 */
export function streamWritingAssist(
  options: WritingAssistOptions,
  onEvent: (event: LLMEvent) => void
): () => void {
  const { type, model = 'gpt-4o-mini' } = options
  const prompt = buildPrompt(options)

  const observable = streamLLM({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7
  }, 'writing-assist')

  return observable.subscribe(onEvent)
}

/**
 * 生成多个候选版本
 */
export async function generateCandidates(
  options: WritingAssistOptions,
  count: number = 3
): Promise<string[]> {
  const { type, model = 'gpt-4o-mini' } = options
  const prompt = buildPrompt(options)

  // 使用不同的 temperature 生成多样性结果
  const temperatures = [0.6, 0.7, 0.8]

  const promises = Array.from({ length: count }, async (_, i) => {
    const temp = temperatures[i] || 0.7
    try {
      const response = await callLLM({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: temp
      }, 'writing-assist')
      return response
    } catch (error) {
      console.error(`Error generating candidate ${i}:`, error)
      return null
    }
  })

  const results = await Promise.all(promises)
  return results.filter((r): r is string => r !== null)
}
