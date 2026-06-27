/**
 * ai/providers/ProviderBridge.ts (I21-I25) - 5 engines
 *
 * - I21 MockProvider: mock provider for testing
 * - I22 HealthCheckProvider: provider 健康检查
 * - I23 ProviderAdapter: 适配器 (统一接口)
 * - I24 ResponseParser: 响应解析
 * - I25 ErrorMapper: 错误映射
 */

import type {
  ModelProfile, ProviderConfigData, CostTracker,
} from './ProviderPool'
import { TokenCounter, MessageFormatter, type FormattedMessage } from './ProviderAdvanced'

// =============================================================================
// I21: MockProvider
// =============================================================================

export interface MockProviderConfig {
  providerId: string
  responses?: string[]
  delayMs?: number
  failRate?: number  // 0-1
  latencyMs?: number
}

export interface MockResponse {
  content: string
  promptTokens: number
  completionTokens: number
  latencyMs: number
  costUSD: number
}

export class MockProvider {
  providerId: string
  private _responses: string[]
  private _delayMs: number
  private _failRate: number
  private _latencyMs: number
  private _callCount: number = 0

  constructor(config: MockProviderConfig) {
    this.providerId = config.providerId
    this._responses = config.responses ?? ['mock response']
    this._delayMs = config.delayMs ?? 0
    this._failRate = config.failRate ?? 0
    this._latencyMs = config.latencyMs ?? 100
  }

  async call(prompt: string): Promise<MockResponse> {
    this._callCount += 1
    if (this._delayMs > 0) await new Promise(r => setTimeout(r, this._delayMs))
    if (Math.random() < this._failRate) {
      throw new Error('Mock failure')
    }
    const content = this._responses[(this._callCount - 1) % this._responses.length]
    const tc = new TokenCounter()
    return {
      content,
      promptTokens: tc.countExact(prompt),
      completionTokens: tc.countExact(content),
      latencyMs: this._latencyMs,
      costUSD: 0,
    }
  }

  get callCount(): number {
    return this._callCount
  }

  reset(): void {
    this._callCount = 0
  }
}

// =============================================================================
// I22: HealthCheckProvider
// =============================================================================

export interface ProviderHealth {
  providerId: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  latencyMs: number
  lastChecked: number
  consecutiveFailures: number
}

export class HealthCheckProvider {
  private _health: Map<string, ProviderHealth> = new Map()
  private _timeoutMs: number

  constructor(timeoutMs: number = 5000) {
    this._timeoutMs = timeoutMs
  }

  /** 运行 health check */
  async check(providerId: string, ping: () => Promise<void>): Promise<ProviderHealth> {
    const start = Date.now()
    let status: ProviderHealth['status'] = 'healthy'
    let consecutiveFailures = (this._health.get(providerId)?.consecutiveFailures ?? 0)
    try {
      await Promise.race([
        ping(),
        new Promise<void>((_, reject) => setTimeout(() => reject(new Error('timeout')), this._timeoutMs)),
      ])
      consecutiveFailures = 0
    } catch {
      consecutiveFailures += 1
      status = consecutiveFailures >= 3 ? 'unhealthy' : 'degraded'
    }
    const latencyMs = Date.now() - start
    const h: ProviderHealth = { providerId, status, latencyMs, lastChecked: Date.now(), consecutiveFailures }
    this._health.set(providerId, h)
    return h
  }

  get(providerId: string): ProviderHealth | undefined {
    return this._health.get(providerId)
  }

  all(): ProviderHealth[] {
    return Array.from(this._health.values())
  }

  /** 健康率 (healthy / total) */
  healthRate(): number {
    const all = this.all()
    if (all.length === 0) return 0
    return all.filter(h => h.status === 'healthy').length / all.length
  }
}

// =============================================================================
// I23: ProviderAdapter
// =============================================================================

export interface LLMRequest {
  model: string
  messages: FormattedMessage[]
  temperature?: number
  maxTokens?: number
  stop?: string[]
}

export interface LLMResponse {
  content: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  latencyMs: number
  costUSD: number
}

export interface LLMProviderAdapter {
  providerId: string
  call(req: LLMRequest): Promise<LLMResponse>
}

export class ProviderAdapterRegistry {
  private _adapters: Map<string, LLMProviderAdapter> = new Map()

  register(adapter: LLMProviderAdapter): void {
    this._adapters.set(adapter.providerId, adapter)
  }

  get(providerId: string): LLMProviderAdapter | undefined {
    return this._adapters.get(providerId)
  }

  list(): LLMProviderAdapter[] {
    return Array.from(this._adapters.values())
  }

  async callAny(providerIds: string[], req: LLMRequest): Promise<{ providerId: string; response: LLMResponse } | null> {
    for (const id of providerIds) {
      const a = this._adapters.get(id)
      if (!a) continue
      try {
        const response = await a.call(req)
        return { providerId: id, response }
      } catch {
        continue  // try next
      }
    }
    return null
  }
}

// =============================================================================
// I24: ResponseParser
// =============================================================================

export interface ParsedResponse {
  content: string
  toolCalls: Array<{ name: string; arguments: Record<string, unknown> }>
  finishReason: 'stop' | 'length' | 'tool' | 'error'
}

export class ResponseParser {
  /** 从 OpenAI 风格响应解析 */
  parseOpenAI(raw: { choices: Array<{ message: { content?: string; tool_calls?: Array<{ function: { name: string; arguments: string } }> }; finish_reason?: string }> }): ParsedResponse {
    const choice = raw.choices[0]
    if (!choice) {
      return { content: '', toolCalls: [], finishReason: 'error' }
    }
    const toolCalls = (choice.message.tool_calls ?? []).map(tc => {
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(tc.function.arguments) as Record<string, unknown>
      } catch { /* leave empty */ }
      return { name: tc.function.name, arguments: args }
    })
    return {
      content: choice.message.content ?? '',
      toolCalls,
      finishReason: (choice.finish_reason as ParsedResponse['finishReason']) ?? 'stop',
    }
  }

  /** 从纯文本提取 JSON（如果存在） */
  extractJson(text: string): Record<string, unknown> | null {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      return JSON.parse(match[0]) as Record<string, unknown>
    } catch {
      return null
    }
  }

  /** 提取 code blocks */
  extractCodeBlocks(text: string): Array<{ lang: string; code: string }> {
    const blocks: Array<{ lang: string; code: string }> = []
    const regex = /```(\w+)?\n([\s\S]*?)```/g
    let m
    while ((m = regex.exec(text)) !== null) {
      blocks.push({ lang: m[1] ?? '', code: m[2] })
    }
    return blocks
  }
}

// =============================================================================
// I25: ErrorMapper
// =============================================================================

export type ProviderErrorType =
  | 'rate-limit' | 'timeout' | '5xx' | '4xx' | 'auth' | 'quota'
  | 'network' | 'context-too-long' | 'invalid-request' | 'unknown'

export class ErrorMapper {
  /** HTTP status → error type */
  fromHttpStatus(status: number): ProviderErrorType {
    if (status === 429) return 'rate-limit'
    if (status === 401 || status === 403) return 'auth'
    if (status === 402) return 'quota'
    if (status === 408) return 'timeout'
    if (status === 413) return 'context-too-long'
    if (status === 400) return 'invalid-request'
    if (status >= 500 && status < 600) return '5xx'
    if (status >= 400 && status < 500) return '4xx'
    return 'unknown'
  }

  /** Error message → error type */
  fromMessage(message: string): ProviderErrorType {
    const lower = message.toLowerCase()
    if (lower.includes('rate')) return 'rate-limit'
    if (lower.includes('timeout') || lower.includes('timed out')) return 'timeout'
    if (lower.includes('auth') || lower.includes('unauthorized')) return 'auth'
    if (lower.includes('quota')) return 'quota'
    if (lower.includes('network')) return 'network'
    if (lower.includes('context') || lower.includes('token limit')) return 'context-too-long'
    if (lower.includes('5')) return '5xx'  // generic 5xx hint
    return 'unknown'
  }

  /** 是否可重试 */
  isRetryable(type: ProviderErrorType): boolean {
    return ['rate-limit', 'timeout', '5xx', 'network'].includes(type)
  }

  /** 用户友好的错误消息 */
  userFriendly(type: ProviderErrorType, providerId?: string): string {
    const p = providerId ? `[${providerId}] ` : ''
    switch (type) {
      case 'rate-limit': return `${p}速率限制，请稍后重试`
      case 'timeout': return `${p}请求超时`
      case 'auth': return `${p}认证失败，请检查 API Key`
      case 'quota': return `${p}配额已用尽`
      case 'network': return `${p}网络错误`
      case 'context-too-long': return `${p}上下文超出限制`
      case '5xx': return `${p}服务器错误`
      case '4xx': return `${p}客户端错误`
      case 'invalid-request': return `${p}请求无效`
      default: return `${p}未知错误`
    }
  }
}