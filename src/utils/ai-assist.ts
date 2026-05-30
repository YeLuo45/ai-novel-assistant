/**
 * AI 辅助写作模块
 * 封装 LLM 调用
 */

import type { AIAssistType } from './ai-assist-types'
export type { AIAssistType } from './ai-assist-types'

import { callLLM } from '../ai/llm'
import { PROVIDERS } from '../ai/providers'
// ============ Prompt 模板 ============

const PROMPTS = {
  continue: (content: string) =>
    `你是一位专业的小说作家。请根据以下内容继续写作，保持文风、语调和叙事节奏的一致性。
    
要求：
1. 延续现有情节和人物
2. 保持相同的写作风格
3. 长度适中（300-500字）

已有内容：
${content}`,

  polish: (selectedText: string) =>
    `你是一位专业的中文写作润色专家。请对以下文字进行润色，使其更加流畅、生动、富有表现力。

要求：
1. 保持原意不变
2. 改善句式结构
3. 优化用词
4. 提升文采

原文：
${selectedText}`,

  expand: (selectedText: string) =>
    `你是一位专业的小说作家。请对以下内容进行扩写，增加细节描写、场景氛围和情感深度。

要求：
1. 保持原意和核心情节
2. 增加细节描写
3. 丰富场景氛围
4. 适当增加字数（扩写至1.5-2倍）

原文：
${selectedText}`,

  summarize: (selectedText: string) =>
    `你是一位专业的内容编辑。请对以下内容进行缩写，保留核心信息和关键情节。

要求：
1. 保留核心要点
2. 删除冗余描写
3. 语言简洁精炼
4. 缩写至原文的1/3左右

原文：
${selectedText}`,

  grammar: (selectedText: string) =>
    `你是一位专业的中文语法纠错专家。请检查以下文本的语法错误、标点问题和表达不当之处，并给出修改建议。

要求：
1. 指出所有语法错误
2. 标注标点问题
3. 指出表达不当之处
4. 给出修改后的版本

原文：
${selectedText}`
}

const SYSTEM_PROMPT = '你是一位专业的小说创作助手，擅长写作润色、语法纠错、情节扩写缩写等工作。'

// ============ Provider 配置映射 ============

const MODEL_TO_PROVIDER: Record<string, string> = {
  'gpt-4o-mini': 'openai',
  'gpt-4o': 'openai',
  'gpt-4-turbo': 'openai',
  'gpt-3.5-turbo': 'openai',
  'claude-sonnet-4-20250514': 'anthropic',
  'claude-opus-4-20250514': 'anthropic',
  'claude-3-5-sonnet-latest': 'anthropic',
  'claude-3-opus': 'anthropic',
  'deepseek-chat': 'deepseek',
  'deepseek-coder': 'deepseek',
  'Qwen/Qwen2.5-7B-Instruct': 'siliconflow',
  'deepseek-ai/DeepSeek-V2.5': 'siliconflow'
}

/**
 * 根据模型 ID 获取 Provider 配置
 */
function getProviderForModel(model: string) {
  const providerId = MODEL_TO_PROVIDER[model]
  if (!providerId) return null
  return PROVIDERS[providerId]
}

/**
 * 执行 AI 辅助操作（非流式）
 */
export async function performAIAssist(
  type: AIAssistType,
  content: string,
  selectedText: string,
  model: string = 'gpt-4o-mini',
  apiKey?: string
): Promise<string> {
  let prompt: string
  if (type === 'continue') {
    prompt = PROMPTS.continue(content)
  } else {
    prompt = PROMPTS[type](selectedText)
  }

  const provider = getProviderForModel(model)
  if (!provider) {
    throw new Error(`Unsupported model: ${model}`)
  }

  const effectiveApiKey = apiKey || provider.apiKey || ''
  if (!effectiveApiKey) {
    throw new Error('API Key is required. Please configure it in settings.')
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt }
  ]

  const response = await callLLM(
    {
      model,
      messages,
      temperature: 0.7
    },
    'ai-assist',
    {
      maxRetries: 3,
      retryDelay: 1000
    }
  )

  return response
}

// ============ 快捷方法 ============

export async function continueWriting(
  content: string,
  model: string = 'gpt-4o-mini',
  apiKey?: string
): Promise<string> {
  return performAIAssist('continue', content, '', model, apiKey)
}

export async function polishText(
  text: string,
  model: string = 'gpt-4o-mini',
  apiKey?: string
): Promise<string> {
  return performAIAssist('polish', '', text, model, apiKey)
}

export async function expandText(
  text: string,
  model: string = 'gpt-4o-mini',
  apiKey?: string
): Promise<string> {
  return performAIAssist('expand', '', text, model, apiKey)
}

export async function summarizeText(
  text: string,
  model: string = 'gpt-4o-mini',
  apiKey?: string
): Promise<string> {
  return performAIAssist('summarize', '', text, model, apiKey)
}

export async function grammarCheck(
  text: string,
  model: string = 'gpt-4o-mini',
  apiKey?: string
): Promise<string> {
  return performAIAssist('grammar', '', text, model, apiKey)
}

export { PROMPTS }
