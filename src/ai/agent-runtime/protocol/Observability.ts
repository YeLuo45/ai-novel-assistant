/**
 * protocol/Observability.ts (V2506-V2515) - 10 engines
 *
 * - V2506 MetricsRegistry: 指标注册表
 * - V2507 Counter: 计数器
 * - V2508 Gauge: 仪表
 * - V2509 Histogram: 直方图
 * - V2510 Timer: 计时器
 * - V2511 SoulEvolution: soul 进化引擎
 * - V2512 UserFeedback: 用户反馈
 * - V2513 FeedbackAggregator: 反馈聚合
 * - V2514 EvolutionRule: 进化规则
 * - V2515 EvolutionLog: 进化日志
 */

// =============================================================================
// V2507: Counter
// =============================================================================

export class Counter {
  private _value: number = 0
  private _labels: Map<string, number> = new Map()

  inc(amount: number = 1, labels?: Record<string, string>): void {
    this._value += amount
    if (labels) {
      const key = JSON.stringify(labels)
      this._labels.set(key, (this._labels.get(key) ?? 0) + amount)
    }
  }

  get value(): number {
    return this._value
  }

  labels(): Map<string, number> {
    return new Map(this._labels)
  }

  reset(): void {
    this._value = 0
    this._labels.clear()
  }
}

// =============================================================================
// V2508: Gauge
// =============================================================================

export class Gauge {
  private _value: number = 0

  set(value: number): void {
    this._value = value
  }

  inc(amount: number = 1): void {
    this._value += amount
  }

  dec(amount: number = 1): void {
    this._value -= amount
  }

  get value(): number {
    return this._value
  }
}

// =============================================================================
// V2509: Histogram
// =============================================================================

export class Histogram {
  private _values: number[] = []
  private _maxBuckets: number

  constructor(maxBuckets: number = 1000) {
    this._maxBuckets = maxBuckets
  }

  observe(value: number): void {
    this._values.push(value)
    if (this._values.length > this._maxBuckets) this._values.shift()
  }

  count(): number {
    return this._values.length
  }

  sum(): number {
    return this._values.reduce((a, b) => a + b, 0)
  }

  mean(): number {
    if (this._values.length === 0) return 0
    return this.sum() / this._values.length
  }

  p50(): number {
    return this._percentile(0.5)
  }

  p95(): number {
    return this._percentile(0.95)
  }

  p99(): number {
    return this._percentile(0.99)
  }

  private _percentile(q: number): number {
    if (this._values.length === 0) return 0
    const sorted = [...this._values].sort((a, b) => a - b)
    const idx = Math.floor(q * sorted.length)
    return sorted[Math.min(idx, sorted.length - 1)]
  }
}

// =============================================================================
// V2510: Timer
// =============================================================================

export class Timer {
  private _histogram: Histogram
  private _startTimes: Map<string, number> = new Map()

  constructor(histogram?: Histogram) {
    this._histogram = histogram ?? new Histogram()
  }

  start(label: string): void {
    this._startTimes.set(label, Date.now())
  }

  stop(label: string): number {
    const start = this._startTimes.get(label)
    if (start === undefined) return 0
    const elapsed = Date.now() - start
    this._histogram.observe(elapsed)
    this._startTimes.delete(label)
    return elapsed
  }

  histogram(): Histogram {
    return this._histogram
  }
}

// =============================================================================
// V2506: MetricsRegistry
// =============================================================================

export interface MetricSnapshot {
  counters: Record<string, number>
  gauges: Record<string, number>
  histograms: Record<string, { count: number; mean: number; p50: number; p95: number; p99: number }>
}

export class MetricsRegistry {
  private _counters: Map<string, Counter> = new Map()
  private _gauges: Map<string, Gauge> = new Map()
  private _histograms: Map<string, Histogram> = new Map()
  private _timers: Map<string, Timer> = new Map()

  counter(name: string): Counter {
    if (!this._counters.has(name)) this._counters.set(name, new Counter())
    return this._counters.get(name)!
  }

  gauge(name: string): Gauge {
    if (!this._gauges.has(name)) this._gauges.set(name, new Gauge())
    return this._gauges.get(name)!
  }

  histogram(name: string): Histogram {
    if (!this._histograms.has(name)) this._histograms.set(name, new Histogram())
    return this._histograms.get(name)!
  }

  timer(name: string): Timer {
    if (!this._timers.has(name)) this._timers.set(name, new Timer())
    return this._timers.get(name)!
  }

  snapshot(): MetricSnapshot {
    const counters: Record<string, number> = {}
    for (const [k, v] of this._counters) counters[k] = v.value
    const gauges: Record<string, number> = {}
    for (const [k, v] of this._gauges) gauges[k] = v.value
    const histograms: MetricSnapshot['histograms'] = {}
    for (const [k, h] of this._histograms) {
      histograms[k] = { count: h.count(), mean: h.mean(), p50: h.p50(), p95: h.p95(), p99: h.p99() }
    }
    return { counters, gauges, histograms }
  }

  reset(): void {
    this._counters.clear()
    this._gauges.clear()
    this._histograms.clear()
    this._timers.clear()
  }
}

// =============================================================================
// V2514: EvolutionRule
// =============================================================================

export type EvolutionAction = 'tune-tone' | 'adjust-creative' | 'tweak-policy' | 'refine-principles' | 'no-op'

export interface EvolutionRule {
  ruleId: string
  description: string
  condition: (metrics: MetricSnapshot) => boolean
  action: EvolutionAction
  parameters?: Record<string, number>
}

export const DEFAULT_EVOLUTION_RULES: EvolutionRule[] = [
  {
    ruleId: 'low-creative',
    description: 'When creative < 0.5, increase it',
    condition: (m) => (m.gauges['avg-creative'] ?? 0.5) < 0.5,
    action: 'adjust-creative',
    parameters: { delta: 0.1 },
  },
  {
    ruleId: 'high-rejection',
    description: 'When rejection > 30%, make more conservative',
    condition: (m) => (m.counters['rejected'] ?? 0) > 30,
    action: 'tweak-policy',
    parameters: { field: 'conservative', delta: 0.1 },
  },
  {
    ruleId: 'good-performance',
    description: 'When acceptance > 80%, no change',
    condition: (m) => (m.counters['accepted'] ?? 0) > 80,
    action: 'no-op',
  },
]

// =============================================================================
// V2515: EvolutionLog
// =============================================================================

export interface EvolutionLogEntry {
  timestamp: number
  soulId: string
  ruleId: string
  action: EvolutionAction
  parameters?: Record<string, number>
  beforeMetrics?: Record<string, number>
  afterMetrics?: Record<string, number>
}

export class EvolutionLog {
  private _entries: EvolutionLogEntry[] = []
  private _maxEntries: number

  constructor(maxEntries: number = 500) {
    this._maxEntries = maxEntries
  }

  record(entry: Omit<EvolutionLogEntry, 'timestamp'>): void {
    this._entries.push({ ...entry, timestamp: Date.now() })
    if (this._entries.length > this._maxEntries) this._entries = this._entries.slice(-this._maxEntries)
  }

  forSoul(soulId: string): EvolutionLogEntry[] {
    return this._entries.filter(e => e.soulId === soulId)
  }

  all(): EvolutionLogEntry[] {
    return [...this._entries]
  }

  count(): number {
    return this._entries.length
  }

  clear(): void {
    this._entries = []
  }
}

// =============================================================================
// V2511: SoulEvolution
// =============================================================================

import type { AgentSoul } from '../types'
import { cloneSoul, createSoul, bumpVersion } from '../AgentSoul'

export interface EvolutionResult {
  soulBefore: AgentSoul
  soulAfter: AgentSoul
  appliedRule: EvolutionRule
  metrics: MetricSnapshot
}

export class SoulEvolutionEngine {
  private _log: EvolutionLog

  constructor(log: EvolutionLog = new EvolutionLog()) {
    this._log = log
  }

  /** 应用规则到 soul（基于当前 metrics） */
  evolve(soul: AgentSoul, metrics: MetricSnapshot, rules: EvolutionRule[] = DEFAULT_EVOLUTION_RULES): EvolutionResult | null {
    for (const rule of rules) {
      if (rule.condition(metrics)) {
        const after = this._applyRule(soul, rule)
        this._log.record({
          soulId: soul.agentId,
          ruleId: rule.ruleId,
          action: rule.action,
          parameters: rule.parameters,
          beforeMetrics: { tone: soul.persona.tone.formality },
          afterMetrics: { tone: after.persona.tone.formality },
        })
        return { soulBefore: soul, soulAfter: after, appliedRule: rule, metrics }
      }
    }
    return null
  }

  private _applyRule(soul: AgentSoul, rule: EvolutionRule): AgentSoul {
    if (rule.action === 'no-op') return soul
    if (rule.action === 'adjust-creative' && rule.parameters?.delta) {
      const newCreative = Math.min(1, soul.persona.decisionPolicy.creative + rule.parameters.delta)
      return bumpVersion(soul, { tone: soul.persona.tone, decisionPolicy: { ...soul.persona.decisionPolicy, creative: newCreative } } as never)
    }
    if (rule.action === 'tweak-policy' && rule.parameters?.field && rule.parameters.delta) {
      const field = rule.parameters.field as keyof typeof soul.persona.decisionPolicy
      const old = soul.persona.decisionPolicy[field] as number
      const nv = Math.min(1, Math.max(0, old + rule.parameters.delta))
      return bumpVersion(soul, { decisionPolicy: { ...soul.persona.decisionPolicy, [field]: nv } } as never)
    }
    return cloneSoul(soul)
  }
}

// =============================================================================
// V2512 + V2513: UserFeedback + Aggregator
// =============================================================================

export type FeedbackType = 'positive' | 'negative' | 'neutral' | 'suggestion'
export type FeedbackTarget = 'soul' | 'response' | 'connection' | 'system'

export interface Feedback {
  feedbackId: string
  userId: string
  target: FeedbackTarget
  targetId: string
  type: FeedbackType
  score: number  // -1 to 1
  comment?: string
  createdAt: number
}

export class UserFeedbackStore {
  private _feedback: Feedback[] = []
  private _nextId: number = 0

  record(f: Omit<Feedback, 'feedbackId' | 'createdAt'>): Feedback {
    const fb: Feedback = { ...f, feedbackId: `fb_${++this._nextId}`, createdAt: Date.now() }
    this._feedback.push(fb)
    return fb
  }

  forTarget(target: FeedbackTarget, targetId: string): Feedback[] {
    return this._feedback.filter(f => f.target === target && f.targetId === targetId)
  }

  byUser(userId: string): Feedback[] {
    return this._feedback.filter(f => f.userId === userId)
  }

  all(): Feedback[] {
    return [...this._feedback]
  }

  count(): number {
    return this._feedback.length
  }
}

export class FeedbackAggregator {
  /** 平均 score（per target） */
  averageScore(store: UserFeedbackStore, target: FeedbackTarget, targetId: string): number {
    const fbs = store.forTarget(target, targetId)
    if (fbs.length === 0) return 0
    return fbs.reduce((a, f) => a + f.score, 0) / fbs.length
  }

  /** 统计 feedback type 分布 */
  distribution(store: UserFeedbackStore, target: FeedbackTarget, targetId: string): Map<FeedbackType, number> {
    const m = new Map<FeedbackType, number>()
    for (const f of store.forTarget(target, targetId)) {
      m.set(f.type, (m.get(f.type) ?? 0) + 1)
    }
    return m
  }

  /** 最受批评的 target */
  mostCriticized(store: UserFeedbackStore): { targetId: string; avgScore: number } | null {
    const targets = new Set(store.all().map(f => `${f.target}:${f.targetId}`))
    let worst: { targetId: string; avgScore: number } | null = null
    for (const t of targets) {
      const [target, targetId] = t.split(':') as [FeedbackTarget, string]
      const score = this.averageScore(store, target, targetId)
      if (worst === null || score < worst.avgScore) {
        worst = { targetId: t, avgScore: score }
      }
    }
    return worst
  }
}
