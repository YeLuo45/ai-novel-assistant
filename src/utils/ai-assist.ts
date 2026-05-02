/**
 * AI 辅助写作 prompt 模板
 * 复用 AIChat 的 callOpenAI/callClaude/callMiniMax 函数签名
 */

import { db } from '../db'

export type AIAssistType = 'continue' | 'polish' | 'expand' | 'summarize' | 'grammar'

/** 各功能的 prompt 模板 */
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

/** 通用系统提示词 */
const SYSTEM_PROMPT = '你是一位专业的小说创作助手，擅长写作润色、语法纠错、情节扩写缩写等工作。'

/** 获取 API Key */
async function getApiKeys() {
  const keys = await db.apiKeys.toArray()
  const keyMap: Record<string, string> = {}
  keys.forEach(k => { if (k.key) keyMap[k.provider] = k.key })
  return keyMap
}

/** 调用 OpenAI API */
async function callOpenAI(apiKey: string, model: string, system: string, userInput: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userInput }
      ],
      temperature: 0.7
    })
  })
  
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'API请求失败')
  }
  
  const data = await response.json()
  return data.choices[0].message.content
}

/** 调用 Claude API */
async function callClaude(apiKey: string, model: string, system: string, userInput: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: userInput }]
    })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'API请求失败')
  }

  const data = await response.json()
  return data.content[0].text
}

/** 调用 MiniMax API */
async function callMiniMax(apiKey: string, userInput: string): Promise<string> {
  const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'abab5.5-chat',
      messages: [{ role: 'user', content: userInput }]
    })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'API请求失败')
  }

  const data = await response.json()
  return data.choices[0].message.content
}

/**
 * 执行 AI 辅助操作
 * @param type 辅助类型
 * @param content 当前全文内容（用于续写）
 * @param selectedText 选中文本（用于润色/扩写/缩写/语法检查）
 * @param model 使用的模型
 */
export async function performAIAssist(
  type: AIAssistType,
  content: string,
  selectedText: string,
  model: string = 'gpt-3.5-turbo'
): Promise<string> {
  const apiKeys = await getApiKeys()
  
  let prompt: string
  let apiKey: string
  
  // 根据操作类型构建 prompt
  if (type === 'continue') {
    prompt = PROMPTS.continue(content)
    apiKey = apiKeys.openai || apiKeys.anthropic || apiKeys.minimax || ''
  } else {
    prompt = PROMPTS[type](selectedText)
    if (model.startsWith('gpt')) {
      apiKey = apiKeys.openai || ''
    } else if (model.startsWith('claude')) {
      apiKey = apiKeys.anthropic || ''
    } else {
      apiKey = apiKeys.minimax || ''
    }
  }
  
  if (!apiKey) {
    throw new Error('请先在设置页面配置 API Key')
  }
  
  // 根据模型调用对应 API
  if (model.startsWith('gpt')) {
    return await callOpenAI(apiKey, model, SYSTEM_PROMPT, prompt)
  } else if (model.startsWith('claude')) {
    return await callClaude(apiKey, model, SYSTEM_PROMPT, prompt)
  } else {
    return await callMiniMax(apiKey, prompt)
  }
}

export { PROMPTS }
