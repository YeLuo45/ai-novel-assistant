/**
 * protocol/AdaptationAndHealth.ts (V2521-V2530) - 10 engines
 *
 * - V2521 LearningRate: 学习率
 * - V2522 AdaptationPolicy: 自适应策略
 * - V2523 ExplorationExploitation: 探索/利用平衡
 * - V2524 Curriculum: 课程学习
 * - V2525 TransferLearning: 迁移学习
 * - V2526 HealthCheck: 健康检查
 * - V2527 AlertManager: 告警管理
 * - V2528 AlertRule: 告警规则
 * - V2529 IncidentLog: 事故日志
 * - V2530 RecoveryPlan: 恢复计划
 */

// =============================================================================
// V2521: LearningRate
// =============================================================================

export interface LearningRateSchedule {
  initial: number
  decay: number
  minRate: number
}

export class LearningRate {
  private _schedule: LearningRateSchedule
  private _step: number = 0

  constructor(schedule: LearningRateSchedule) {
    this._schedule = schedule
  }

  /** 当前学习率（带衰减） */
  current(): number {
    const r = this._schedule.initial * Math.pow(this._schedule.decay, this._step)
    return Math.max(r, this._schedule.minRate)
  }

  step(): number {
    this._step += 1
    return this.current()
  }

  reset(): void {
    this._step = 0
  }

  get currentStep(): number {
    return this._step
  }
}

// =============================================================================
// V2522: AdaptationPolicy
// =============================================================================

export type AdaptationStrategy = 'fixed' | 'annealing' | 'adaptive' | 'cyclic'

export interface AdaptationConfig {
  strategy: AdaptationStrategy
  initialRate: number
  minRate: number
  decayRate: number
  cycleLength?: number
}

export class AdaptationPolicy {
  private _config: AdaptationConfig
  private _lr: LearningRate

  constructor(config: AdaptationConfig) {
    this._config = config
    this._lr = new LearningRate({
      initial: config.initialRate,
      decay: config.decayRate,
      minRate: config.minRate,
    })
  }

  rate(): number {
    if (this._config.strategy === 'cyclic' && this._config.cycleLength) {
      const cycleStep = this._lr.currentStep % this._config.cycleLength
      const progress = cycleStep / this._config.cycleLength
      return this._config.initialRate * (1 - progress) + this._config.minRate * progress
    }
    return this._lr.current()
  }

  step(): number {
    return this._lr.step()
  }
}

// =============================================================================
// V2523: ExplorationExploitation
// =============================================================================

export type EEStrategy = 'epsilon-greedy' | 'softmax' | 'ucb1'

export class ExplorationExploitation {
  private _epsilon: number
  private _counts: Map<string, number> = new Map()
  private _rewards: Map<string, number> = new Map()
  private _strategy: EEStrategy
  private _temperature: number

  constructor(strategy: EEStrategy = 'epsilon-greedy', options?: { epsilon?: number; temperature?: number }) {
    this._strategy = strategy
    this._epsilon = options?.epsilon ?? 0.1
    this._temperature = options?.temperature ?? 1.0
  }

  /** 选 arm（epsilon-greedy / softmax / ucb1） */
  selectArm(arms: string[]): string {
    if (this._strategy === 'epsilon-greedy') {
      if (Math.random() < this._epsilon) {
        return arms[Math.floor(Math.random() * arms.length)]
      }
      return this._greedy(arms)
    }
    if (this._strategy === 'softmax') {
      return this._softmax(arms)
    }
    return this._ucb1(arms)
  }

  /** 记录 reward */
  update(arm: string, reward: number): void {
    this._counts.set(arm, (this._counts.get(arm) ?? 0) + 1)
    const oldR = this._rewards.get(arm) ?? 0
    const n = this._counts.get(arm) ?? 1
    this._rewards.set(arm, oldR + (reward - oldR) / n)
  }

  averageReward(arm: string): number {
    return this._rewards.get(arm) ?? 0
  }

  pullCount(arm: string): number {
    return this._counts.get(arm) ?? 0
  }

  setEpsilon(epsilon: number): void {
    this._epsilon = epsilon
  }

  private _greedy(arms: string[]): string {
    let best = arms[0]
    let bestR = this._rewards.get(best) ?? 0
    for (const a of arms) {
      const r = this._rewards.get(a) ?? 0
      if (r > bestR) { best = a; bestR = r }
    }
    return best
  }

  private _softmax(arms: string[]): string {
    const rewards = arms.map(a => (this._rewards.get(a) ?? 0) / this._temperature)
    const max = Math.max(...rewards)
    const exps = rewards.map(r => Math.exp(r - max))
    const sum = exps.reduce((a, b) => a + b, 0)
    const probs = exps.map(e => e / sum)
    const r = Math.random()
    let acc = 0
    for (let i = 0; i < arms.length; i++) {
      acc += probs[i]
      if (r < acc) return arms[i]
    }
    return arms[arms.length - 1]
  }

  private _ucb1(arms: string[]): string {
    let best = arms[0]
    let bestScore = -Infinity
    const total = Array.from(this._counts.values()).reduce((a, b) => a + b, 0) + 1
    for (const a of arms) {
      const n = this._counts.get(a) ?? 0
      if (n === 0) return a
      const avg = this._rewards.get(a) ?? 0
      const score = avg + Math.sqrt(2 * Math.log(total) / n)
      if (score > bestScore) { best = a; bestScore = score }
    }
    return best
  }
}

// =============================================================================
// V2524: Curriculum
// =============================================================================

export interface CurriculumStage {
  stageId: string
  name: string
  difficulty: number  // 0-1
  requiredSamples: number
}

export class Curriculum {
  private _stages: CurriculumStage[]
  private _currentIdx: number = 0
  private _sampleCounts: Map<string, number> = new Map()

  constructor(stages: CurriculumStage[]) {
    this._stages = stages
  }

  current(): CurriculumStage {
    return this._stages[this._currentIdx]
  }

  addSample(stageId: string): void {
    this._sampleCounts.set(stageId, (this._sampleCounts.get(stageId) ?? 0) + 1)
    this._maybeAdvance()
  }

  addSamples(stageId: string, n: number): void {
    for (let i = 0; i < n; i++) this.addSample(stageId)
  }

  private _maybeAdvance(): void {
    const cur = this._stages[this._currentIdx]
    const count = this._sampleCounts.get(cur.stageId) ?? 0
    if (count >= cur.requiredSamples && this._currentIdx < this._stages.length - 1) {
      this._currentIdx += 1
    }
  }

  progress(): { current: number; total: number } {
    return { current: this._currentIdx + 1, total: this._stages.length }
  }

  isComplete(): boolean {
    return this._currentIdx >= this._stages.length - 1
  }
}

// =============================================================================
// V2525: TransferLearning
// =============================================================================

export interface TransferSource {
  soulId: string
  features: Record<string, number>
  accuracy: number
}

export interface TransferTarget {
  soulId: string
  features: Record<string, number>
}

export class TransferLearning {
  /** 计算 source → target 的相似度（cosine） */
  similarity(source: TransferSource, target: TransferTarget): number {
    const keys = Object.keys(target.features)
    let dot = 0, magS = 0, magT = 0
    for (const k of keys) {
      const s = source.features[k] ?? 0
      const t = target.features[k] ?? 0
      dot += s * t
      magS += s * s
      magT += t * t
    }
    if (magS === 0 || magT === 0) return 0
    return dot / (Math.sqrt(magS) * Math.sqrt(magT))
  }

  /** 找出最相似的 source */
  bestSource(target: TransferTarget, sources: TransferSource[]): TransferSource | null {
    if (sources.length === 0) return null
    let best = sources[0]
    let bestSim = this.similarity(best, target)
    for (const s of sources) {
      const sim = this.similarity(s, target)
      if (sim > bestSim) { best = s; bestSim = sim }
    }
    return best
  }
}

// =============================================================================
// V2526: HealthCheck
// =============================================================================

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface HealthCheckResult {
  name: string
  status: HealthStatus
  message?: string
  durationMs: number
  checkedAt: number
}

export interface HealthCheck {
  name: string
  check: () => Promise<HealthCheckResult> | HealthCheckResult
}

export class HealthCheckRunner {
  private _checks: HealthCheck[] = []

  register(check: HealthCheck): void {
    this._checks.push(check)
  }

  async runAll(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = []
    for (const c of this._checks) {
      const r = await c.check()
      results.push(r)
    }
    return results
  }

  overall(results: HealthCheckResult[]): HealthStatus {
    if (results.some(r => r.status === 'unhealthy')) return 'unhealthy'
    if (results.some(r => r.status === 'degraded')) return 'degraded'
    return 'healthy'
  }

  count(): number {
    return this._checks.length
  }
}

// =============================================================================
// V2527/V2528: AlertManager + AlertRule
// =============================================================================

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface AlertRule {
  ruleId: string
  name: string
  condition: (metrics: unknown) => boolean
  severity: AlertSeverity
  cooldownMs: number
  message: string
}

export interface Alert {
  ruleId: string
  severity: AlertSeverity
  message: string
  triggeredAt: number
  resolvedAt?: number
}

export class AlertManager {
  private _rules: AlertRule[] = []
  private _activeAlerts: Map<string, Alert> = new Map()
  private _history: Alert[] = []
  private _lastTrigger: Map<string, number> = new Map()

  addRule(rule: AlertRule): void {
    this._rules.push(rule)
  }

  /** 评估所有规则 */
  evaluate(metrics: unknown): Alert[] {
    const triggered: Alert[] = []
    const now = Date.now()
    for (const rule of this._rules) {
      const last = this._lastTrigger.get(rule.ruleId) ?? 0
      if (now - last < rule.cooldownMs) continue
      if (rule.condition(metrics)) {
        const alert: Alert = {
          ruleId: rule.ruleId,
          severity: rule.severity,
          message: rule.message,
          triggeredAt: now,
        }
        this._activeAlerts.set(rule.ruleId, alert)
        this._history.push(alert)
        this._lastTrigger.set(rule.ruleId, now)
        triggered.push(alert)
      }
    }
    return triggered
  }

  resolve(ruleId: string): boolean {
    const a = this._activeAlerts.get(ruleId)
    if (!a) return false
    a.resolvedAt = Date.now()
    this._activeAlerts.delete(ruleId)
    return true
  }

  active(): Alert[] {
    return Array.from(this._activeAlerts.values())
  }

  history(): Alert[] {
    return [...this._history]
  }
}

// =============================================================================
// V2529: IncidentLog
// =============================================================================

export interface Incident {
  incidentId: string
  severity: AlertSeverity
  message: string
  context?: Record<string, unknown>
  openedAt: number
  resolvedAt?: number
  resolution?: string
}

export class IncidentLog {
  private _incidents: Incident[] = []
  private _nextId: number = 0

  record(i: Omit<Incident, 'incidentId' | 'openedAt'>): Incident {
    const inc: Incident = { ...i, incidentId: `inc_${++this._nextId}`, openedAt: Date.now() }
    this._incidents.push(inc)
    return inc
  }

  resolve(incidentId: string, resolution: string): boolean {
    const inc = this._incidents.find(i => i.incidentId === incidentId)
    if (!inc) return false
    inc.resolvedAt = Date.now()
    inc.resolution = resolution
    return true
  }

  open(): Incident[] {
    return this._incidents.filter(i => !i.resolvedAt)
  }

  all(): Incident[] {
    return [...this._incidents]
  }

  count(): number {
    return this._incidents.length
  }
}

// =============================================================================
// V2530: RecoveryPlan
// =============================================================================

export type RecoveryAction = 'restart' | 'rollback' | 'throttle' | 'notify' | 'manual'

export interface RecoveryStep {
  order: number
  action: RecoveryAction
  description: string
  timeoutMs: number
  execute?: () => Promise<boolean> | boolean
}

export class RecoveryPlan {
  private _steps: RecoveryStep[] = []
  private _executed: boolean = false

  addStep(step: RecoveryStep): void {
    this._steps.push(step)
    this._steps.sort((a, b) => a.order - b.order)
  }

  steps(): RecoveryStep[] {
    return [...this._steps]
  }

  async execute(): Promise<{ success: boolean; results: Array<{ order: number; success: boolean }> }> {
    if (this._executed) return { success: false, results: [] }
    this._executed = true
    const results: Array<{ order: number; success: boolean }> = []
    for (const step of this._steps) {
      try {
        const ok = step.execute ? await step.execute() : true
        results.push({ order: step.order, success: ok })
      } catch {
        results.push({ order: step.order, success: false })
      }
    }
    return { success: results.every(r => r.success), results }
  }

  reset(): void {
    this._executed = false
  }

  count(): number {
    return this._steps.length
  }
}
