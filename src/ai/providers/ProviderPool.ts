/**
 * ai/providers/ProviderPool.ts (I1-I10) - 10 engines
 *
 * - I1 ProviderPool: 多 provider 池
 * - I2 ModelSelector: 按场景选 model
 * - I3 TokenBudget: 预算管理
 * - I4 CostTracker: 成本追踪
 * - I5 RateLimiter: 速率限制
 * - I6 StreamHandler: 流式响应
 * - I7 ResponseCache: 响应缓存
 * - I8 PromptTemplate: 模板管理
 * - I9 SystemMessageBuilder: system message 构造
 * - I10 RetryPolicy: 重试策略
 */

// =============================================================================
// I4: CostTracker
// =============================================================================

export interface CostEntry {
  providerId: string
  modelId: string
  promptTokens: number
  completionTokens: number
  costUSD: number
  timestamp: number
}

export class CostTracker {
  private _entries: CostEntry[] = []
  private _totalCost: number = 0
  private _totalTokens: number = 0

  record(entry: Omit<CostEntry, 'timestamp'>): void {
    const e = { ...entry, timestamp: Date.now() }
    this._entries.push(e)
    this._totalCost += e.costUSD
    this._totalTokens += e.promptTokens + e.completionTokens
  }

  totalCost(): number {
    return this._totalCost
  }

  totalTokens(): number {
    return this._totalTokens
  }

  byProvider(): Map<string, number> {
    const m = new Map<string, number>()
    for (const e of this._entries) m.set(e.providerId, (m.get(e.providerId) ?? 0) + e.costUSD)
    return m
  }

  byModel(): Map<string, number> {
    const m = new Map<string, number>()
    for (const e of this._entries) m.set(e.modelId, (m.get(e.modelId) ?? 0) + e.costUSD)
    return m
  }

  recent(n: number): CostEntry[] {
    return this._entries.slice(-n)
  }

  reset(): void {
    this._entries = []
    this._totalCost = 0
    this._totalTokens = 0
  }
}

// =============================================================================
// I5: RateLimiter
// =============================================================================

export class RateLimiter {
  private _timestamps: Map<string, number[]> = new Map()
  private _maxPerMinute: number
  private _maxPerDay: number

  constructor(options: { maxPerMinute?: number; maxPerDay?: number } = {}) {
    this._maxPerMinute = options.maxPerMinute ?? 60
    this._maxPerDay = options.maxPerDay ?? 1000
  }

  /** 检查是否允许调用 */
  canCall(key: string = 'default'): { allowed: boolean; reason?: string } {
    const now = Date.now()
    const ts = this._timestamps.get(key) ?? []
    const minuteAgo = now - 60_000
    const dayAgo = now - 86_400_000
    const recentMinute = ts.filter(t => t > minuteAgo)
    const recentDay = ts.filter(t => t > dayAgo)
    if (recentMinute.length >= this._maxPerMinute) return { allowed: false, reason: 'per-minute limit' }
    if (recentDay.length >= this._maxPerDay) return { allowed: false, reason: 'per-day limit' }
    return { allowed: true }
  }

  record(key: string = 'default'): void {
    const ts = this._timestamps.get(key) ?? []
    ts.push(Date.now())
    this._timestamps.set(key, ts)
  }

  reset(key?: string): void {
    if (key) this._timestamps.set(key, [])
    else this._timestamps.clear()
  }

  getUsage(key: string = 'default'): { perMinute: number; perDay: number } {
    const now = Date.now()
    const ts = this._timestamps.get(key) ?? []
    return {
      perMinute: ts.filter(t => t > now - 60_000).length,
      perDay: ts.filter(t => t > now - 86_400_000).length,
    }
  }
}

// =============================================================================
// I3: TokenBudget
// =============================================================================

export class TokenBudget {
  private _maxTokens: number
  private _usedTokens: number = 0

  constructor(maxTokens: number) {
    this._maxTokens = maxTokens
  }

  /** 检查 + 预留 tokens */
  reserve(tokens: number): { ok: boolean; remaining: number; reason?: string } {
    if (this._usedTokens + tokens > this._maxTokens) {
      return { ok: false, remaining: this._maxTokens - this._usedTokens, reason: 'budget exceeded' }
    }
    this._usedTokens += tokens
    return { ok: true, remaining: this._maxTokens - this._usedTokens }
  }

  /** 释放预留 */
  release(tokens: number): void {
    this._usedTokens = Math.max(0, this._usedTokens - tokens)
  }

  used(): number {
    return this._usedTokens
  }

  remaining(): number {
    return this._maxTokens - this._usedTokens
  }

  reset(): void {
    this._usedTokens = 0
  }
}

// =============================================================================
// I8: PromptTemplate
// =============================================================================

export interface PromptTemplate {
  templateId: string
  name: string
  content: string
  variables: string[]
}

export class PromptTemplateRegistry {
  private _templates: Map<string, PromptTemplate> = new Map()

  register(t: PromptTemplate): void {
    this._templates.set(t.templateId, t)
  }

  get(id: string): PromptTemplate | undefined {
    return this._templates.get(id)
  }

  /** 用 values 填充模板的 {{var}} 占位符 */
  render(id: string, values: Record<string, string>): string | null {
    const t = this._templates.get(id)
    if (!t) return null
    let out = t.content
    for (const [k, v] of Object.entries(values)) {
      out = out.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), v)
    }
    return out
  }

  list(): PromptTemplate[] {
    return Array.from(this._templates.values())
  }

  remove(id: string): boolean {
    return this._templates.delete(id)
  }

  count(): number {
    return this._templates.size
  }
}

// =============================================================================
// I9: SystemMessageBuilder
// =============================================================================

export interface SystemMessageContext {
  agentName: string
  archetype: string
  personaDisplayName: string
  principles: string[]
  tone: Record<string, number>
  capabilities: string[]
  userAlias?: string
  customInstructions?: string
}

export class SystemMessageBuilder {
  /** 构建标准 system message */
  build(ctx: SystemMessageContext): string {
    const lines: string[] = []
    lines.push(`You are ${ctx.personaDisplayName}, a ${ctx.archetype} agent.`)
    lines.push('')
    lines.push('Capabilities:')
    for (const cap of ctx.capabilities) lines.push(`- ${cap}`)
    lines.push('')
    lines.push('Principles:')
    for (const p of ctx.principles) lines.push(`- ${p}`)
    lines.push('')
    lines.push('Tone:')
    for (const [k, v] of Object.entries(ctx.tone)) lines.push(`- ${k}: ${(v as number).toFixed(2)}`)
    if (ctx.customInstructions) {
      lines.push('')
      lines.push('Custom instructions:')
      lines.push(ctx.customInstructions)
    }
    return lines.join('\n')
  }

  /** 构建简化版（仅 principles） */
  buildMinimal(ctx: SystemMessageContext): string {
    return `${ctx.personaDisplayName}: ${ctx.principles.slice(0, 3).join('; ')}`
  }
}

// =============================================================================
// I6: StreamHandler
// =============================================================================

export interface StreamChunk {
  delta: string
  finished: boolean
  index: number
}

export class StreamHandler {
  private _chunks: StreamChunk[] = []
  private _buffer: string = ''

  /** 模拟接收流式 chunk */
  feed(text: string, index: number, finished: boolean = false): StreamChunk {
    const chunk: StreamChunk = { delta: text, finished, index }
    this._chunks.push(chunk)
    this._buffer += text
    return chunk
  }

  /** 完整内容 */
  fullText(): string {
    return this._buffer
  }

  chunks(): StreamChunk[] {
    return [...this._chunks]
  }

  reset(): void {
    this._chunks = []
    this._buffer = ''
  }
}

// =============================================================================
// I7: ResponseCache
// =============================================================================

export interface CacheEntry<T = unknown> {
  key: string
  value: T
  timestamp: number
  ttlMs: number
  hits: number
}

export class ResponseCache {
  private _cache: Map<string, CacheEntry> = new Map()
  private _maxEntries: number
  private _hits: number = 0
  private _misses: number = 0

  constructor(maxEntries: number = 1000) {
    this._maxEntries = maxEntries
  }

  /** 取缓存 */
  get<T>(key: string): T | null {
    const e = this._cache.get(key)
    if (!e) {
      this._misses += 1
      return null
    }
    if (Date.now() - e.timestamp > e.ttlMs) {
      this._cache.delete(key)
      this._misses += 1
      return null
    }
    e.hits += 1
    this._hits += 1
    return e.value as T
  }

  /** 存缓存 */
  set<T>(key: string, value: T, ttlMs: number = 300_000): void {
    if (this._cache.size >= this._maxEntries) {
      // LRU: 删除最旧
      const oldestKey = this._cache.keys().next().value
      if (oldestKey !== undefined) this._cache.delete(oldestKey)
    }
    this._cache.set(key, { key, value, timestamp: Date.now(), ttlMs, hits: 0 })
  }

  delete(key: string): boolean {
    return this._cache.delete(key)
  }

  has(key: string): boolean {
    const e = this._cache.get(key)
    if (!e) return false
    return Date.now() - e.timestamp <= e.ttlMs
  }

  size(): number {
    return this._cache.size
  }

  clear(): void {
    this._cache.clear()
  }

  hitRate(): number {
    const total = this._hits + this._misses
    return total === 0 ? 0 : this._hits / total
  }
}

// =============================================================================
// I2: ModelSelector
// =============================================================================

export interface ModelProfile {
  modelId: string
  providerId: string
  costPer1kTokens: number
  maxTokens: number
  capability: 'fast' | 'balanced' | 'powerful'
  enabled: boolean
}

export class ModelSelector {
  private _models: Map<string, ModelProfile> = new Map()

  register(model: ModelProfile): void {
    this._models.set(model.modelId, model)
  }

  selectByCapability(cap: 'fast' | 'balanced' | 'powerful'): ModelProfile | null {
    const matches = Array.from(this._models.values()).filter(m => m.capability === cap && m.enabled)
    if (matches.length === 0) return null
    return matches[0]
  }

  selectByMaxTokens(needed: number): ModelProfile | null {
    const matches = Array.from(this._models.values()).filter(m => m.maxTokens >= needed && m.enabled)
    if (matches.length === 0) return null
    // 返回 cheapest
    return matches.reduce((a, b) => a.costPer1kTokens <= b.costPer1kTokens ? a : b)
  }

  selectCheapest(): ModelProfile | null {
    let cheapest: ModelProfile | null = null
    for (const m of this._models.values()) {
      if (!m.enabled) continue
      if (!cheapest || m.costPer1kTokens < cheapest.costPer1kTokens) cheapest = m
    }
    return cheapest
  }

  list(): ModelProfile[] {
    return Array.from(this._models.values()).filter(m => m.enabled)
  }

  get(modelId: string): ModelProfile | undefined {
    return this._models.get(modelId)
  }
}

// =============================================================================
// I10: RetryPolicy
// =============================================================================

export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  retryableErrors: string[]
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: ['rate-limit', 'timeout', '5xx'],
}

export class RetryPolicy {
  private _config: RetryConfig

  constructor(config: Partial<RetryConfig> = {}) {
    this._config = { ...DEFAULT_RETRY_CONFIG, ...config }
  }

  /** 计算 delay（指数退避） */
  delayFor(attempt: number): number {
    const delay = this._config.initialDelayMs * Math.pow(this._config.backoffMultiplier, attempt)
    return Math.min(delay, this._config.maxDelayMs)
  }

  /** 是否应该重试 */
  shouldRetry(attempt: number, errorType: string): boolean {
    if (attempt >= this._config.maxRetries) return false
    return this._config.retryableErrors.includes(errorType)
  }

  get config(): RetryConfig {
    return { ...this._config }
  }
}

// =============================================================================
// I1: ProviderPool
// =============================================================================

export interface LLMProvider {
  providerId: string
  name: string
  models: ModelProfile[]
  healthy: boolean
}

export class ProviderPool {
  private _providers: Map<string, LLMProvider> = new Map()

  register(provider: LLMProvider): void {
    this._providers.set(provider.providerId, provider)
  }

  get(id: string): LLMProvider | undefined {
    return this._providers.get(id)
  }

  list(): LLMProvider[] {
    return Array.from(this._providers.values())
  }

  healthy(): LLMProvider[] {
    return this.list().filter(p => p.healthy)
  }

  markHealthy(id: string, healthy: boolean): boolean {
    const p = this._providers.get(id)
    if (!p) return false
    p.healthy = healthy
    return true
  }
}