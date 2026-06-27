/**
 * ai/providers/ProviderAdvanced.ts (I11-I20) - 10 engines
 *
 * - I11 CircuitBreaker: 熔断器
 * - I12 LoadBalancer: 负载均衡
 * - I13 FallbackProvider: 降级
 * - I14 TokenCounter: token 计数
 * - I15 MessageFormatter: 消息格式化
 * - I16 ConversationStore: 对话存储
 * - I17 UsageMetrics: 用量统计
 * - I18 BudgetAlert: 预算告警
 * - I19 ProviderConfig: 配置管理
 * - I20 ProviderRegistry: 注册中心
 */

// =============================================================================
// I11: CircuitBreaker
// =============================================================================

export type CircuitState = 'closed' | 'open' | 'half-open'

export class CircuitBreaker {
  private _state: CircuitState = 'closed'
  private _failureCount: number = 0
  private _lastFailureTime: number = 0
  private _failureThreshold: number
  private _resetTimeoutMs: number

  constructor(options: { failureThreshold?: number; resetTimeoutMs?: number } = {}) {
    this._failureThreshold = options.failureThreshold ?? 5
    this._resetTimeoutMs = options.resetTimeoutMs ?? 60_000
  }

  /** 记录成功 */
  recordSuccess(): void {
    this._failureCount = 0
    this._state = 'closed'
  }

  /** 记录失败 */
  recordFailure(): void {
    this._failureCount += 1
    this._lastFailureTime = Date.now()
    if (this._failureCount >= this._failureThreshold) {
      this._state = 'open'
    }
  }

  /** 检查是否允许请求 */
  allowRequest(): boolean {
    if (this._state === 'closed') return true
    if (this._state === 'open') {
      // 检查是否过了 reset timeout
      if (Date.now() - this._lastFailureTime > this._resetTimeoutMs) {
        this._state = 'half-open'
        return true
      }
      return false
    }
    // half-open: 允许一个请求
    return true
  }

  get state(): CircuitState {
    return this._state
  }

  get failureCount(): number {
    return this._failureCount
  }

  reset(): void {
    this._state = 'closed'
    this._failureCount = 0
    this._lastFailureTime = 0
  }
}

// =============================================================================
// I12: LoadBalancer
// =============================================================================

export type LoadBalanceStrategy = 'round-robin' | 'least-busy' | 'random'

export interface LoadBalancedProvider {
  id: string
  inFlight: number
}

export class LoadBalancer {
  private _providers: LoadBalancedProvider[] = []
  private _strategy: LoadBalanceStrategy
  private _rrIndex: number = 0

  constructor(strategy: LoadBalanceStrategy = 'round-robin') {
    this._strategy = strategy
  }

  register(id: string): void {
    if (!this._providers.find(p => p.id === id)) {
      this._providers.push({ id, inFlight: 0 })
    }
  }

  /** 选择 provider */
  select(): string | null {
    if (this._providers.length === 0) return null
    if (this._strategy === 'round-robin') {
      const p = this._providers[this._rrIndex % this._providers.length]
      this._rrIndex += 1
      return p.id
    }
    if (this._strategy === 'least-busy') {
      return this._providers.reduce((a, b) => a.inFlight <= b.inFlight ? a : b).id
    }
    return this._providers[Math.floor(Math.random() * this._providers.length)].id
  }

  /** 标记 in-flight */
  markInFlight(id: string): void {
    const p = this._providers.find(p => p.id === id)
    if (p) p.inFlight += 1
  }

  markDone(id: string): void {
    const p = this._providers.find(p => p.id === id)
    if (p && p.inFlight > 0) p.inFlight -= 1
  }

  providers(): LoadBalancedProvider[] {
    return [...this._providers]
  }
}

// =============================================================================
// I13: FallbackProvider
// =============================================================================

export interface FallbackAttempt {
  providerId: string
  succeeded: boolean
  error?: string
  timestamp: number
}

export class FallbackProvider {
  private _attempts: FallbackAttempt[] = []
  private _fallbackChain: string[] = []

  setChain(providerIds: string[]): void {
    this._fallbackChain = [...providerIds]
  }

  /** 选择第一个尝试 */
  primary(): string | null {
    return this._fallbackChain[0] ?? null
  }

  /** 失败后切换到下一个 */
  nextAfter(current: string): string | null {
    const idx = this._fallbackChain.indexOf(current)
    if (idx === -1 || idx >= this._fallbackChain.length - 1) return null
    return this._fallbackChain[idx + 1]
  }

  recordAttempt(attempt: Omit<FallbackAttempt, 'timestamp'>): void {
    this._attempts.push({ ...attempt, timestamp: Date.now() })
  }

  attempts(): FallbackAttempt[] {
    return [...this._attempts]
  }

  /** 统计成功率 */
  successRate(): number {
    if (this._attempts.length === 0) return 0
    return this._attempts.filter(a => a.succeeded).length / this._attempts.length
  }

  get chain(): string[] {
    return [...this._fallbackChain]
  }
}

// =============================================================================
// I14: TokenCounter
// =============================================================================

export class TokenCounter {
  /** 粗略估算 token 数（4 字符 ≈ 1 token） */
  estimate(text: string): number {
    return Math.ceil(text.length / 4)
  }

  /** 精确计数（按 GPT tokenizer 简化） */
  countExact(text: string): number {
    // 简化：每 token ≈ 4 chars（中英文混合估算）
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) ?? []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) ?? []).length
    const otherChars = text.length - chineseChars - englishWords
    // 1 Chinese char ≈ 1.5 tokens, 1 English word ≈ 1.3 tokens, 1 other ≈ 0.25
    return Math.ceil(chineseChars * 1.5 + englishWords * 1.3 + otherChars * 0.25)
  }

  /** 估算消息列表的 total tokens */
  estimateMessages(messages: { role: string; content: string }[]): number {
    let total = 0
    for (const m of messages) {
      total += this.countExact(m.content)
      total += 4  // role overhead
    }
    return total
  }
}

// =============================================================================
// I15: MessageFormatter
// =============================================================================

export interface FormattedMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  name?: string
}

export class MessageFormatter {
  /** OpenAI 格式 */
  toOpenAI(messages: FormattedMessage[]): Array<{ role: string; content: string; name?: string }> {
    return messages.map(m => ({ role: m.role, content: m.content, name: m.name }))
  }

  /** Anthropic 格式（system 分开） */
  toAnthropic(messages: FormattedMessage[]): { system?: string; messages: Array<{ role: string; content: string }> } {
    const systemMsgs = messages.filter(m => m.role === 'system')
    const rest = messages.filter(m => m.role !== 'system')
    return {
      system: systemMsgs.length > 0 ? systemMsgs.map(m => m.content).join('\n') : undefined,
      messages: rest.map(m => ({ role: m.role, content: m.content })),
    }
  }

  /** 合并同 role 的连续消息 */
  merge(messages: FormattedMessage[]): FormattedMessage[] {
    const result: FormattedMessage[] = []
    for (const m of messages) {
      const last = result[result.length - 1]
      if (last && last.role === m.role) {
        result[result.length - 1] = { ...last, content: `${last.content}\n${m.content}` }
      } else {
        result.push({ ...m })
      }
    }
    return result
  }
}

// =============================================================================
// I16: ConversationStore
// =============================================================================

export interface ConversationMessage {
  messageId: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export class ConversationStore {
  private _conversations: Map<string, ConversationMessage[]> = new Map()
  private _nextId: number = 0

  add(conversationId: string, role: ConversationMessage['role'], content: string): ConversationMessage {
    const msg: ConversationMessage = {
      messageId: `m_${++this._nextId}`,
      conversationId,
      role,
      content,
      timestamp: Date.now(),
    }
    const conv = this._conversations.get(conversationId) ?? []
    conv.push(msg)
    this._conversations.set(conversationId, conv)
    return msg
  }

  get(conversationId: string): ConversationMessage[] {
    return [...(this._conversations.get(conversationId) ?? [])]
  }

  clear(conversationId: string): boolean {
    return this._conversations.delete(conversationId)
  }

  list(): string[] {
    return Array.from(this._conversations.keys())
  }

  messageCount(conversationId: string): number {
    return (this._conversations.get(conversationId) ?? []).length
  }
}

// =============================================================================
// I17: UsageMetrics
// =============================================================================

export interface UsageEntry {
  agentId: string
  promptTokens: number
  completionTokens: number
  costUSD: number
  latencyMs: number
  timestamp: number
  success: boolean
}

export class UsageMetrics {
  private _entries: UsageEntry[] = []

  record(e: Omit<UsageEntry, 'timestamp'>): void {
    this._entries.push({ ...e, timestamp: Date.now() })
  }

  byAgent(agentId: string): UsageEntry[] {
    return this._entries.filter(e => e.agentId === agentId)
  }

  totalCostByAgent(agentId: string): number {
    return this.byAgent(agentId).reduce((s, e) => s + e.costUSD, 0)
  }

  totalTokensByAgent(agentId: string): number {
    return this.byAgent(agentId).reduce((s, e) => s + e.promptTokens + e.completionTokens, 0)
  }

  successRateByAgent(agentId: string): number {
    const all = this.byAgent(agentId)
    if (all.length === 0) return 0
    return all.filter(e => e.success).length / all.length
  }

  averageLatencyByAgent(agentId: string): number {
    const all = this.byAgent(agentId)
    if (all.length === 0) return 0
    return all.reduce((s, e) => s + e.latencyMs, 0) / all.length
  }

  recent(n: number): UsageEntry[] {
    return this._entries.slice(-n)
  }
}

// =============================================================================
// I18: BudgetAlert
// =============================================================================

export type AlertLevel = 'info' | 'warning' | 'critical'

export interface BudgetAlertConfig {
  warningThreshold: number  // 0-1 (e.g. 0.7 = 70%)
  criticalThreshold: number
  cooldownMs: number
}

export class BudgetAlert {
  private _config: BudgetAlertConfig
  private _alerts: Array<{ level: AlertLevel; message: string; triggeredAt: number }> = []
  private _lastTriggered: Map<AlertLevel, number> = new Map()

  constructor(config: Partial<BudgetAlertConfig> = {}) {
    this._config = {
      warningThreshold: config.warningThreshold ?? 0.7,
      criticalThreshold: config.criticalThreshold ?? 0.95,
      cooldownMs: config.cooldownMs ?? 60_000,
    }
  }

  /** 用量比例 0-1，返回触发的 alert level */
  evaluate(usageRatio: number): AlertLevel | null {
    const now = Date.now()
    if (usageRatio >= this._config.criticalThreshold) {
      if (this._shouldTrigger('critical', now)) {
        this._alerts.push({ level: 'critical', message: `Critical: ${(usageRatio * 100).toFixed(0)}% budget used`, triggeredAt: now })
        this._lastTriggered.set('critical', now)
        return 'critical'
      }
    } else if (usageRatio >= this._config.warningThreshold) {
      if (this._shouldTrigger('warning', now)) {
        this._alerts.push({ level: 'warning', message: `Warning: ${(usageRatio * 100).toFixed(0)}% budget used`, triggeredAt: now })
        this._lastTriggered.set('warning', now)
        return 'warning'
      }
    }
    return null
  }

  alerts(): Array<{ level: AlertLevel; message: string; triggeredAt: number }> {
    return [...this._alerts]
  }

  clear(): void {
    this._alerts = []
    this._lastTriggered.clear()
  }

  private _shouldTrigger(level: AlertLevel, now: number): boolean {
    const last = this._lastTriggered.get(level) ?? 0
    return now - last >= this._config.cooldownMs
  }
}

// =============================================================================
// I19: ProviderConfig
// =============================================================================

export interface ProviderConfigData {
  providerId: string
  apiKey?: string
  baseURL?: string
  timeout?: number
  maxRetries?: number
  customHeaders?: Record<string, string>
  enabled?: boolean
  [key: string]: unknown
}

export class ProviderConfig {
  private _configs: Map<string, ProviderConfigData> = new Map()

  set(data: ProviderConfigData): void {
    this._configs.set(data.providerId, { enabled: true, ...data })
  }

  get(providerId: string): ProviderConfigData | undefined {
    return this._configs.get(providerId)
  }

  all(): ProviderConfigData[] {
    return Array.from(this._configs.values())
  }

  remove(providerId: string): boolean {
    return this._configs.delete(providerId)
  }

  isEnabled(providerId: string): boolean {
    return this._configs.get(providerId)?.enabled ?? false
  }

  merge(overrides: Record<string, unknown>): ProviderConfig {
    // 合并默认值到现有 configs
    for (const [k, v] of Object.entries(overrides)) {
      const existing = this._configs.get(k)
      if (existing) {
        this._configs.set(k, { ...existing, ...(v as ProviderConfigData) })
      } else {
        this._configs.set(k, v as ProviderConfigData)
      }
    }
    return this
  }
}

// =============================================================================
// I20: ProviderRegistry
// =============================================================================

export interface RegisteredProvider {
  providerId: string
  type: 'openai' | 'anthropic' | 'mock' | 'custom'
  models: string[]
  defaultModel: string
}

export class ProviderRegistry {
  private _providers: Map<string, RegisteredProvider> = new Map()

  register(p: RegisteredProvider): void {
    this._providers.set(p.providerId, p)
  }

  unregister(providerId: string): boolean {
    return this._providers.delete(providerId)
  }

  get(providerId: string): RegisteredProvider | undefined {
    return this._providers.get(providerId)
  }

  list(): RegisteredProvider[] {
    return Array.from(this._providers.values())
  }

  byType(type: RegisteredProvider['type']): RegisteredProvider[] {
    return this.list().filter(p => p.type === type)
  }

  count(): number {
    return this._providers.size
  }

  hasModel(providerId: string, modelId: string): boolean {
    return this._providers.get(providerId)?.models.includes(modelId) ?? false
  }
}