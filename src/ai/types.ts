/**
 * AI Provider 类型系统
 * Provider 注册表 + 模型配置 + 能力描述 + Thinking 配置
 */

// ============ Provider 类型 ============

export type ProviderType = 'openai-compatible' | 'anthropic-compatible'

export interface ProviderConfig {
  name: string
  baseUrl: string
  type: ProviderType
  apiKey?: string
  defaultModel?: string
  models?: ModelConfig[]
}

export interface ModelConfig {
  id: string
  provider: string
  name: string
  capabilities: ModelCapabilities
  thinking?: ThinkingCapability
  contextWindow?: number
  maxOutputTokens?: number
  supportsStreaming?: boolean
}

export interface ModelCapabilities {
  text: boolean
  vision?: boolean
  functionCalling?: boolean
  jsonMode?: boolean
}

// ============ Thinking 配置 ============

export interface ThinkingConfig {
  enabled: boolean
  budgetTokens?: number
}

export interface ThinkingCapability {
  supported: boolean
  minBudgetTokens?: number
  maxBudgetTokens?: number
  defaultBudgetTokens?: number
}

// ============ LLM 调用选项 ============

export interface LLMCallOptions {
  model: string
  messages: Array<{ role: string; content: string }>
  temperature?: number
  maxTokens?: number
  thinkingConfig?: ThinkingConfig
  stream?: boolean
}

// ============ LLM 事件（流式） ============

export type LLMEventType = 'text' | 'action' | 'error' | 'thinking_start' | 'thinking_end' | 'done'

export interface LLMEvent {
  type: LLMEventType
  content?: string
  name?: string
  params?: Record<string, unknown>
}

// ============ 重试选项 ============

export interface LLMRetryOptions {
  maxRetries?: number
  retryDelay?: number
  retryableStatuses?: number[]
  onRetry?: (attempt: number, error: Error) => void
}

export const DEFAULT_RETRY_OPTIONS: Required<LLMRetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  onRetry: () => {}
}

// ============ Observable 简单实现 ============

export type Subscriber<T> = (data: T) => void
export type UnsubscribeFn = () => void

export class Observable<T> {
  private subscribers: Set<Subscriber<T>> = new Set()

  subscribe(subscriber: Subscriber<T>): UnsubscribeFn {
    this.subscribers.add(subscriber)
    return () => this.subscribers.delete(subscriber)
  }

  emit(data: T): void {
    this.subscribers.forEach(fn => fn(data))
  }

  unsubscribe(): void {
    this.subscribers.clear()
  }
}
