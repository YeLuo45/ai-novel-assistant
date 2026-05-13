/**
 * 统一 LLM 调用层
 * callLLM() + streamLLM()
 */

import type {
  LLMCallOptions,
  LLMEvent,
  LLMRetryOptions,
  Observable,
  ThinkingConfig
} from './types'
import { Observable as ObservableClass } from './types'
import { getModel, getProvider } from './providers'
import { withRetry } from './retry'
import { adaptThinking } from './thinking'
import { OpenAIStreamParser, AnthropicStreamParser } from './parsers'

// ============ 统一调用入口 ============

/**
 * 调用 LLM（非流式）
 */
export async function callLLM(
  params: LLMCallOptions,
  _source: string,
  retry?: LLMRetryOptions
): Promise<string> {
  let model = getModel(params.model)
  let provider = model ? getProvider(model.provider) : undefined

  // Handle custom model names not in MODELS registry
  if (!model) {
    const savedProviderId = localStorage.getItem('ai-novel-default-provider')
    if (savedProviderId) {
      provider = getProvider(savedProviderId)
    }
    // Create a fallback model config for custom models
    if (provider) {
      model = {
        id: params.model,
        provider: provider.name.toLowerCase(),
        name: params.model,
        capabilities: { text: true },
        contextWindow: 128000,
        maxOutputTokens: 4096,
        supportsStreaming: false
      }
    }
  }

  if (!model || !provider) {
    throw new Error(`Unknown model: ${params.model}`)
  }

  const normalizedThinking = normalizeThinkingConfigForModel(params.model, params.thinkingConfig)

  return withRetry(async () => {
    if (provider.type === 'anthropic-compatible') {
      return callAnthropicCompatible(params, provider, model, normalizedThinking)
    } else {
      return callOpenAICompatible(params, provider, model, normalizedThinking)
    }
  }, retry || {})
}

// ============ 流式调用 ============

/**
 * 调用 LLM（流式）
 * 返回 Observable，可订阅 text/action/error 事件
 */
export function streamLLM(
  params: LLMCallOptions,
  _source: string
): Observable<LLMEvent> {
  const observable = new ObservableClass<LLMEvent>()
  let model = getModel(params.model)
  let provider = model ? getProvider(model.provider) : undefined

  // Handle custom model names not in MODELS registry
  if (!model) {
    const savedProviderId = localStorage.getItem('ai-novel-default-provider')
    if (savedProviderId) {
      provider = getProvider(savedProviderId)
    }
    // Create a fallback model config for custom models
    if (provider) {
      model = {
        id: params.model,
        provider: provider.name.toLowerCase(),
        name: params.model,
        capabilities: { text: true },
        contextWindow: 128000,
        maxOutputTokens: 4096,
        supportsStreaming: false
      }
    }
  }

  if (!model || !provider) {
    observable.emit({ type: 'error', content: `Unknown model: ${params.model}` })
    observable.unsubscribe()
    return observable
  }

  const normalizedThinking = normalizeThinkingConfigForModel(params.model, params.thinkingConfig)

  // 根据 provider 类型选择流式处理方式
  const streamPromise = provider.type === 'anthropic-compatible'
    ? streamAnthropicCompatible(params, provider, model, normalizedThinking, observable)
    : streamOpenAICompatible(params, provider, model, normalizedThinking, observable)

  // 错误处理
  streamPromise.catch((error: Error) => {
    observable.emit({ type: 'error', content: error.message })
    observable.unsubscribe()
  })

  return observable
}

// ============ Anthropic 兼容 Provider 调用 ============

async function callAnthropicCompatible(
  params: LLMCallOptions,
  provider: ReturnType<typeof getProvider>,
  model: ReturnType<typeof getModel>,
  thinkingConfig?: ThinkingConfig
): Promise<string> {
  if (!provider || !model) {
    throw new Error('Provider or model not found')
  }

  const url = provider.baseUrl + (provider.baseUrl.includes('/messages') ? '' : '/messages')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01'
  }

  // API Key 处理
  if (provider.apiKey) {
    headers['x-api-key'] = provider.apiKey
  } else if (provider.name === 'MiniMax') {
    // MiniMax 特殊处理
    headers['Authorization'] = `Bearer ${provider.apiKey}`
  }

  const body: Record<string, unknown> = {
    model: params.model,
    max_tokens: params.maxTokens || model.maxOutputTokens || 4096,
    messages: params.messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'user' : 'user',
      content: m.content
    }))
  }

  // System prompt 处理（Anthropic 格式）
  const systemMessages = params.messages.filter(m => m.role === 'system')
  if (systemMessages.length > 0) {
    body.system = systemMessages.map(m => m.content).join('\n')
  }

  // Thinking 配置
  if (thinkingConfig?.enabled) {
    const thinkingParams = adaptThinking(params.model, thinkingConfig)
    if (thinkingParams) {
      Object.assign(body, thinkingParams.body)
    }
  }

  // Temperature
  if (params.temperature !== undefined) {
    body.temperature = params.temperature
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }))
    throw new Error(error.error?.message || `API request failed: ${response.status}`)
  }

  const data = await response.json()

  // 提取文本内容
  if (data.content?.[0]?.text) {
    return data.content[0].text
  }

  throw new Error('Invalid response format')
}

// MiniMax 特殊处理
async function callMiniMax(
  params: LLMCallOptions,
  provider: ReturnType<typeof getProvider>,
  _model: ReturnType<typeof getModel>
): Promise<string> {
  if (!provider) throw new Error('Provider not found')

  const url = provider.baseUrl + '/text/chatcompletion'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${provider.apiKey || ''}`
  }

  const body = {
    model: params.model,
    tokens_to_generate: params.maxTokens || 1024,
    messages: params.messages.map(m => ({
      role: m.role === 'assistant' ? 'bot' : m.role,
      text: m.content
    })),
    temperature: params.temperature ?? 0.7
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }))
    throw new Error(error.error?.message || `API request failed: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.text || data.choices?.[0]?.message?.content || ''
}

// ============ OpenAI 兼容 Provider 调用 ============

async function callOpenAICompatible(
  params: LLMCallOptions,
  provider: ReturnType<typeof getProvider>,
  model: ReturnType<typeof getModel>,
  _thinkingConfig?: ThinkingConfig
): Promise<string> {
  if (!provider || !model) {
    throw new Error('Provider or model not found')
  }

  // MiniMax 特殊路径
  if (provider.name === 'MiniMax') {
    return callMiniMax(params, provider, model)
  }

  // Google Gemini 特殊路径
  if (provider.name === 'Google') {
    return callGemini(params, provider, model)
  }

  const url = provider.baseUrl + '/chat/completions'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (provider.apiKey) {
    headers['Authorization'] = `Bearer ${provider.apiKey}`
  }

  // 过滤 system 消息并处理
  const nonSystemMessages = params.messages.filter(m => m.role !== 'system')
  const systemMessages = params.messages.filter(m => m.role === 'system')

  const body: Record<string, unknown> = {
    model: params.model,
    messages: [
      ...systemMessages.map(m => ({ role: 'system', content: m.content })),
      ...nonSystemMessages.map(m => ({ role: m.role, content: m.content }))
    ]
  }

  if (params.temperature !== undefined) {
    body.temperature = params.temperature
  }

  if (params.maxTokens !== undefined) {
    body.max_tokens = params.maxTokens
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }))
    throw new Error(error.error?.message || `API request failed: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

// ============ Gemini Provider 调用 ============

async function callGemini(
  params: LLMCallOptions,
  provider: ReturnType<typeof getProvider>,
  _model: ReturnType<typeof getModel>
): Promise<string> {
  if (!provider) throw new Error('Provider not found')

  const model = params.model
  const url = `${provider.baseUrl}/models/${model}:generateContent?key=${provider.apiKey || ''}`
  
  const contents = params.messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

  const systemInstruction = params.messages
    .filter(m => m.role === 'system')
    .map(m => ({ text: m.content }))

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: params.temperature ?? 0.7,
      maxOutputTokens: params.maxTokens || 8192
    }
  }

  if (systemInstruction.length > 0) {
    body.systemInstruction = { parts: systemInstruction }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }))
    throw new Error(error.error?.message || `API request failed: ${response.status}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function streamGemini(
  params: LLMCallOptions,
  provider: ReturnType<typeof getProvider>,
  model: ReturnType<typeof getModel>,
  observable: ObservableClass<LLMEvent>
): Promise<void> {
  if (!provider || !model) return

  const modelId = params.model
  const url = `${provider.baseUrl}/models/${modelId}:streamGenerateContent?key=${provider.apiKey || ''}&alt=sse`

  const contents = params.messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

  const systemInstruction = params.messages
    .filter(m => m.role === 'system')
    .map(m => ({ text: m.content }))

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: params.temperature ?? 0.7,
      maxOutputTokens: params.maxTokens || 8192
    }
  }

  if (systemInstruction.length > 0) {
    body.systemInstruction = { parts: systemInstruction }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }))
    throw new Error(error.error?.message || `API request failed: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('Response body is not readable')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6))
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            observable.emit({ type: 'text', content: text })
          }
        } catch (e) {
          // Skip malformed JSON
        }
      }
    }
  }

  observable.emit({ type: 'done' })
}

// ============ 流式调用实现 ============

async function streamAnthropicCompatible(
  params: LLMCallOptions,
  provider: ReturnType<typeof getProvider>,
  model: ReturnType<typeof getModel>,
  thinkingConfig: ThinkingConfig | undefined,
  observable: ObservableClass<LLMEvent>
): Promise<void> {
  if (!provider || !model) return

  const url = provider.baseUrl + (provider.baseUrl.includes('/messages') ? '' : '/messages')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01'
  }

  if (provider.apiKey) {
    headers['x-api-key'] = provider.apiKey
  }

  const body: Record<string, unknown> = {
    model: params.model,
    max_tokens: params.maxTokens || model.maxOutputTokens || 4096,
    messages: params.messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    })),
    stream: true
  }

  const systemMessages = params.messages.filter(m => m.role === 'system')
  if (systemMessages.length > 0) {
    body.system = systemMessages.map(m => m.content).join('\n')
  }

  if (thinkingConfig?.enabled) {
    const thinkingParams = adaptThinking(params.model, thinkingConfig)
    if (thinkingParams) {
      Object.assign(body, thinkingParams.body)
    }
  }

  if (params.temperature !== undefined) {
    body.temperature = params.temperature
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }))
    throw new Error(error.error?.message || `API request failed: ${response.status}`)
  }

  const parser = new AnthropicStreamParser()
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Response body is not readable')

  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const events = parser.parse(chunk)

    for (const event of events) {
      observable.emit(event)
      if (event.type === 'done') {
        return
      }
    }
  }
}

async function streamOpenAICompatible(
  params: LLMCallOptions,
  provider: ReturnType<typeof getProvider>,
  model: ReturnType<typeof getModel>,
  _thinkingConfig: ThinkingConfig | undefined,
  observable: ObservableClass<LLMEvent>
): Promise<void> {
  if (!provider || !model) return

  // MiniMax 特殊处理
  if (provider.name === 'MiniMax') {
    throw new Error('MiniMax streaming not implemented yet')
  }

  // Google Gemini 特殊处理
  if (provider.name === 'Google') {
    return streamGemini(params, provider, model, observable)
  }

  const url = provider.baseUrl + '/chat/completions'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (provider.apiKey) {
    headers['Authorization'] = `Bearer ${provider.apiKey}`
  }

  const systemMessages = params.messages.filter(m => m.role === 'system')
  const nonSystemMessages = params.messages.filter(m => m.role !== 'system')

  const body: Record<string, unknown> = {
    model: params.model,
    stream: true,
    messages: [
      ...systemMessages.map(m => ({ role: 'system', content: m.content })),
      ...nonSystemMessages.map(m => ({ role: m.role, content: m.content }))
    ]
  }

  if (params.temperature !== undefined) {
    body.temperature = params.temperature
  }

  if (params.maxTokens !== undefined) {
    body.max_tokens = params.maxTokens
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }))
    throw new Error(error.error?.message || `API request failed: ${response.status}`)
  }

  const parser = new OpenAIStreamParser()
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Response body is not readable')

  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const events = parser.parse(chunk)

    for (const event of events) {
      observable.emit(event)
      if (event.type === 'done') {
        return
      }
    }
  }
}

// ============ 工具函数 ============

function normalizeThinkingConfigForModel(
  modelId: string,
  config?: ThinkingConfig
): ThinkingConfig | undefined {
  if (!config?.enabled) return undefined

  const model = getModel(modelId)
  if (!model?.thinking?.supported) return undefined

  const budget = config.budgetTokens ?? model.thinking.defaultBudgetTokens ?? 4000
  const minBudget = model.thinking.minBudgetTokens ?? 1024
  const maxBudget = model.thinking.maxBudgetTokens ?? 32000

  return {
    enabled: true,
    budgetTokens: Math.max(minBudget, Math.min(maxBudget, budget))
  }
}
