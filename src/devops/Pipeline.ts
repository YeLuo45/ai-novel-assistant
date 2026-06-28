/**
 * devops/Pipeline.ts (U1-U15) - 15 engines
 *
 * - U1 BuildPipeline
 * - U2 DeployPipeline
 * - U3 RollbackManager
 * - U4 HealthCheck
 * - U5 CanaryDeploy
 * - U6 ErrorTracker
 * - U7 LogAggregator
 * - U8 MetricCollector
 * - U9 AlertManager
 * - U10 IncidentManager
 * - U11 EnvManager
 * - U12 SecretsManager
 * - U13 ConfigCenter
 * - U14 FeatureFlags
 * - U15 CICDConfig
 */

// =============================================================================
// U1: BuildPipeline
// =============================================================================

export type BuildStep = { name: string; cmd: string; status: 'pending' | 'running' | 'success' | 'failed'; output?: string; durationMs?: number }
export type BuildStatus = 'idle' | 'running' | 'success' | 'failed'

export class BuildPipeline {
  private _steps: BuildStep[] = []
  private _status: BuildStatus = 'idle'
  private _nextId: number = 0

  addStep(name: string, cmd: string): number {
    const id = ++this._nextId
    this._steps.push({ name, cmd, status: 'pending' })
    return id
  }

  async run(executor: (cmd: string) => Promise<{ success: boolean; output: string }>): Promise<BuildStatus> {
    this._status = 'running'
    for (const step of this._steps) {
      step.status = 'running'
      const start = Date.now()
      try {
        const r = await executor(step.cmd)
        step.output = r.output
        step.durationMs = Date.now() - start
        step.status = r.success ? 'success' : 'failed'
        if (!r.success) {
          this._status = 'failed'
          return this._status
        }
      } catch (e) {
        step.status = 'failed'
        step.output = e instanceof Error ? e.message : String(e)
        step.durationMs = Date.now() - start
        this._status = 'failed'
        return this._status
      }
    }
    this._status = 'success'
    return this._status
  }

  status(): BuildStatus { return this._status }
  steps(): BuildStep[] { return [...this._steps] }
  failedSteps(): BuildStep[] { return this._steps.filter(s => s.status === 'failed') }
}

// =============================================================================
// U2: DeployPipeline
// =============================================================================

export interface DeployStage {
  name: string
  env: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped'
}

export class DeployPipeline {
  private _stages: DeployStage[] = []
  private _currentStageIndex: number = -1

  addStage(name: string, env: string): this { this._stages.push({ name, env, status: 'pending' }); return this }

  async deploy(executor: (stage: DeployStage) => Promise<{ success: boolean; skip?: boolean }>): Promise<{ success: boolean; failedAt?: string }> {
    this._currentStageIndex = -1
    for (let i = 0; i < this._stages.length; i++) {
      this._currentStageIndex = i
      const stage = this._stages[i]!
      stage.status = 'running'
      try {
        const r = await executor(stage)
        if (r.skip) stage.status = 'skipped'
        else if (r.success) stage.status = 'success'
        else {
          stage.status = 'failed'
          return { success: false, failedAt: stage.name }
        }
      } catch {
        stage.status = 'failed'
        return { success: false, failedAt: stage.name }
      }
    }
    return { success: true }
  }

  stages(): DeployStage[] { return [...this._stages] }
  currentStage(): DeployStage | null {
    return this._currentStageIndex >= 0 ? this._stages[this._currentStageIndex] ?? null : null
  }
}

// =============================================================================
// U3: RollbackManager
// =============================================================================

export interface DeploymentVersion {
  version: string
  deployedAt: number
  env: string
}

export class RollbackManager {
  private _history: DeploymentVersion[] = []
  private _maxHistory: number

  constructor(maxHistory: number = 10) {
    this._maxHistory = maxHistory
  }

  deploy(version: string, env: string): void {
    this._history.push({ version, env, deployedAt: Date.now() })
    if (this._history.length > this._maxHistory) this._history.shift()
  }

  history(): DeploymentVersion[] { return [...this._history] }

  /** 回滚到上一版本 */
  rollback(): DeploymentVersion | null {
    if (this._history.length < 2) return null
    this._history.pop()  // remove current
    return this._history[this._history.length - 1] ?? null
  }

  current(env: string): DeploymentVersion | null {
    const filtered = this._history.filter(h => h.env === env)
    return filtered[filtered.length - 1] ?? null
  }

  previous(env: string): DeploymentVersion | null {
    const filtered = this._history.filter(h => h.env === env)
    return filtered[filtered.length - 2] ?? null
  }
}

// =============================================================================
// U4: HealthCheck
// =============================================================================

export interface HealthCheckResult {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  latencyMs?: number
  details?: Record<string, unknown>
  checkedAt: number
}

export class HealthCheck {
  private _checks: Map<string, () => Promise<HealthCheckResult>> = new Map()

  register(name: string, check: () => Promise<HealthCheckResult>): void {
    this._checks.set(name, check)
  }

  async run(name: string): Promise<HealthCheckResult | null> {
    const check = this._checks.get(name)
    if (!check) return null
    return check()
  }

  async runAll(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = []
    for (const [name, check] of this._checks) {
      try {
        results.push(await check())
      } catch (e) {
        results.push({ service: name, status: 'unhealthy', checkedAt: Date.now(), details: { error: e instanceof Error ? e.message : String(e) } })
      }
    }
    return results
  }

  /** 整体健康状态 */
  aggregate(results: HealthCheckResult[]): 'healthy' | 'degraded' | 'unhealthy' {
    if (results.some(r => r.status === 'unhealthy')) return 'unhealthy'
    if (results.some(r => r.status === 'degraded')) return 'degraded'
    return 'healthy'
  }
}

// =============================================================================
// U5: CanaryDeploy
// =============================================================================

export class CanaryDeploy {
  private _stages: Array<{ percent: number; passed: boolean; startedAt?: number }> = [
    { percent: 1, passed: false },
    { percent: 10, passed: false },
    { percent: 50, passed: false },
    { percent: 100, passed: false },
  ]
  private _currentStage: number = -1

  currentStage(): number { return this._currentStage }

  async promote(checkErrorRate: () => Promise<number>, threshold: number = 0.01): Promise<{ promoted: boolean; reason?: string }> {
    if (this._currentStage >= this._stages.length - 1) {
      return { promoted: false, reason: 'already at 100%' }
    }
    const nextStage = this._currentStage + 1
    const errorRate = await checkErrorRate()
    if (errorRate > threshold) {
      return { promoted: false, reason: `error rate ${errorRate} exceeds threshold ${threshold}` }
    }
    this._stages[nextStage]!.passed = true
    this._stages[nextStage]!.startedAt = Date.now()
    this._currentStage = nextStage
    return { promoted: true }
  }

  rollback(): void {
    if (this._currentStage >= 0) {
      this._stages[this._currentStage]!.passed = false
      this._stages[this._currentStage]!.startedAt = undefined
      this._currentStage -= 1
    }
  }

  stages(): Array<{ percent: number; passed: boolean }> {
    return this._stages.map(s => ({ percent: s.percent, passed: s.passed }))
  }

  currentPercent(): number {
    return this._currentStage >= 0 ? this._stages[this._currentStage]!.percent : 0
  }
}

// =============================================================================
// U6: ErrorTracker
// =============================================================================

export interface TrackedError {
  fingerprint: string
  message: string
  stack?: string
  occurrences: number
  firstSeen: number
  lastSeen: number
  tags: Record<string, string>
}

export class ErrorTracker {
  private _errors: Map<string, TrackedError> = new Map()

  capture(error: Error, tags: Record<string, string> = {}): TrackedError {
    const fingerprint = this._fingerprint(error)
    const existing = this._errors.get(fingerprint)
    if (existing) {
      existing.occurrences += 1
      existing.lastSeen = Date.now()
      Object.assign(existing.tags, tags)
      return existing
    }
    const tracked: TrackedError = {
      fingerprint,
      message: error.message,
      stack: error.stack,
      occurrences: 1,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      tags,
    }
    this._errors.set(fingerprint, tracked)
    return tracked
  }

  get(fingerprint: string): TrackedError | undefined {
    return this._errors.get(fingerprint)
  }

  all(): TrackedError[] { return Array.from(this._errors.values()) }
  topN(n: number): TrackedError[] {
    return this.all().sort((a, b) => b.occurrences - a.occurrences).slice(0, n)
  }

  private _fingerprint(error: Error): string {
    const str = error.name + ':' + error.message
    let h = 5381
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h) + str.charCodeAt(i)
      h = h & h
    }
    return Math.abs(h).toString(36)
  }
}

// =============================================================================
// U7: LogAggregator
// =============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogEntry {
  timestamp: number
  level: LogLevel
  message: string
  service?: string
  context?: Record<string, unknown>
}

export class LogAggregator {
  private _logs: LogEntry[] = []
  private _maxLogs: number

  constructor(maxLogs: number = 10_000) {
    this._maxLogs = maxLogs
  }

  add(level: LogLevel, message: string, service?: string, context?: Record<string, unknown>): void {
    this._logs.push({ timestamp: Date.now(), level, message, service, context })
    if (this._logs.length > this._maxLogs) this._logs.shift()
  }

  byLevel(level: LogLevel): LogEntry[] { return this._logs.filter(l => l.level === level) }
  byService(service: string): LogEntry[] { return this._logs.filter(l => l.service === service) }
  errors(): LogEntry[] { return this._logs.filter(l => l.level === 'error' || l.level === 'fatal') }
  recent(n: number = 100): LogEntry[] { return this._logs.slice(-n).reverse() }
  search(query: string): LogEntry[] { return this._logs.filter(l => l.message.includes(query)) }
  count(): number { return this._logs.length }
  clear(): void { this._logs = [] }
}

// =============================================================================
// U8: MetricCollector
// =============================================================================

export interface Metric {
  name: string
  type: 'counter' | 'gauge' | 'histogram'
  value: number
  tags?: Record<string, string>
  timestamp: number
}

export class MetricCollector {
  private _metrics: Metric[] = []
  private _counters: Map<string, number> = new Map()
  private _gauges: Map<string, number> = new Map()

  increment(name: string, by: number = 1, tags?: Record<string, string>): void {
    this._counters.set(name, (this._counters.get(name) ?? 0) + by)
    this._metrics.push({ name, type: 'counter', value: this._counters.get(name)!, tags, timestamp: Date.now() })
  }

  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this._gauges.set(name, value)
    this._metrics.push({ name, type: 'gauge', value, tags, timestamp: Date.now() })
  }

  histogram(name: string, value: number, tags?: Record<string, string>): void {
    this._metrics.push({ name, type: 'histogram', value, tags, timestamp: Date.now() })
  }

  counter(name: string): number { return this._counters.get(name) ?? 0 }
  gaugeValue(name: string): number | undefined { return this._gauges.get(name) }

  metrics(): Metric[] { return [...this._metrics] }
  byName(name: string): Metric[] { return this._metrics.filter(m => m.name === name) }
}

// =============================================================================
// U9: AlertManager
// =============================================================================

export interface Alert {
  alertId: string
  name: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  firedAt: number
  resolved: boolean
  resolvedAt?: number
}

export class AlertManager {
  private _alerts: Alert[] = []
  private _nextId: number = 0
  private _listeners: Set<(a: Alert) => void> = new Set()

  fire(name: string, severity: Alert['severity'], message: string): Alert {
    const alert: Alert = {
      alertId: `alert_${++this._nextId}`,
      name, severity, message, firedAt: Date.now(), resolved: false,
    }
    this._alerts.push(alert)
    for (const l of this._listeners) l(alert)
    return alert
  }

  resolve(alertId: string): boolean {
    const a = this._alerts.find(x => x.alertId === alertId)
    if (!a) return false
    a.resolved = true
    a.resolvedAt = Date.now()
    return true
  }

  active(): Alert[] { return this._alerts.filter(a => !a.resolved) }
  bySeverity(severity: Alert['severity']): Alert[] { return this._alerts.filter(a => a.severity === severity) }
  count(): number { return this._alerts.length }

  subscribe(fn: (a: Alert) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// U10: IncidentManager
// =============================================================================

export type IncidentSeverity = 'sev1' | 'sev2' | 'sev3' | 'sev4'
export type IncidentStatus = 'open' | 'investigating' | 'mitigated' | 'resolved'

export interface Incident {
  incidentId: string
  title: string
  severity: IncidentSeverity
  status: IncidentStatus
  createdAt: number
  resolvedAt?: number
  assignee?: string
  notes: string[]
}

export class IncidentManager {
  private _incidents: Map<string, Incident> = new Map()
  private _nextId: number = 0

  create(title: string, severity: IncidentSeverity, assignee?: string): Incident {
    const inc: Incident = {
      incidentId: `inc_${++this._nextId}`,
      title, severity, status: 'open',
      createdAt: Date.now(), assignee, notes: [],
    }
    this._incidents.set(inc.incidentId, inc)
    return inc
  }

  update(id: string, status: IncidentStatus): boolean {
    const inc = this._incidents.get(id)
    if (!inc) return false
    inc.status = status
    if (status === 'resolved') inc.resolvedAt = Date.now()
    return true
  }

  addNote(id: string, note: string): boolean {
    const inc = this._incidents.get(id)
    if (!inc) return false
    inc.notes.push(note)
    return true
  }

  byStatus(status: IncidentStatus): Incident[] {
    return Array.from(this._incidents.values()).filter(i => i.status === status)
  }

  open(): Incident[] { return this.byStatus('open') }
  resolved(): Incident[] {
    return Array.from(this._incidents.values()).filter(i => i.status === 'resolved')
  }
  count(): number { return this._incidents.size }
}

// =============================================================================
// U11: EnvManager
// =============================================================================

export class EnvManager {
  private _env: Map<string, string> = new Map()
  private _requiredKeys: Set<string> = new Set()

  set(key: string, value: string): void { this._env.set(key, value) }

  get(key: string): string | undefined { return this._env.get(key) }

  has(key: string): boolean { return this._env.has(key) }

  require(key: string): void { this._requiredKeys.add(key) }

  validate(): { valid: boolean; missing: string[] } {
    const missing: string[] = []
    for (const k of this._requiredKeys) {
      if (!this._env.has(k)) missing.push(k)
    }
    return { valid: missing.length === 0, missing }
  }

  /** 从 process.env 加载（Node only） */
  loadFromProcess(processEnv: Record<string, string | undefined>): void {
    for (const [k, v] of Object.entries(processEnv)) {
      if (v !== undefined) this._env.set(k, v)
    }
  }

  /** 从对象加载 */
  loadFromObject(obj: Record<string, string>): void {
    for (const [k, v] of Object.entries(obj)) this._env.set(k, v)
  }

  all(): Record<string, string> { return Object.fromEntries(this._env) }
}

// =============================================================================
// U12: SecretsManager
// =============================================================================

export class SecretsManager {
  private _secrets: Map<string, string> = new Map()
  private _audit: Array<{ key: string; action: 'read' | 'write' | 'delete'; at: number; by?: string }> = []

  set(key: string, value: string, by?: string): void {
    this._secrets.set(key, value)
    this._audit.push({ key, action: 'write', at: Date.now(), by })
  }

  get(key: string, by?: string): string | undefined {
    const value = this._secrets.get(key)
    this._audit.push({ key, action: 'read', at: Date.now(), by })
    return value
  }

  delete(key: string, by?: string): boolean {
    const ok = this._secrets.delete(key)
    if (ok) this._audit.push({ key, action: 'delete', at: Date.now(), by })
    return ok
  }

  rotate(key: string, newValue: string, by?: string): boolean {
    if (!this._secrets.has(key)) return false
    this._secrets.set(key, newValue)
    this._audit.push({ key, action: 'write', at: Date.now(), by })
    return true
  }

  keys(): string[] { return Array.from(this._secrets.keys()) }
  auditLog(): Array<{ key: string; action: string; at: number; by?: string }> { return [...this._audit] }
}

// =============================================================================
// U13: ConfigCenter
// =============================================================================

export class ConfigCenter {
  private _configs: Map<string, { value: unknown; version: number; updatedAt: number }> = new Map()
  private _listeners: Map<string, Set<(v: unknown) => void>> = new Map()

  set(key: string, value: unknown): number {
    const cur = this._configs.get(key)
    const version = (cur?.version ?? 0) + 1
    this._configs.set(key, { value, version, updatedAt: Date.now() })
    const subs = this._listeners.get(key)
    if (subs) for (const s of subs) s(value)
    return version
  }

  get<T = unknown>(key: string): T | undefined {
    return this._configs.get(key)?.value as T | undefined
  }

  version(key: string): number {
    return this._configs.get(key)?.version ?? 0
  }

  watch(key: string, fn: (v: unknown) => void): () => void {
    if (!this._listeners.has(key)) this._listeners.set(key, new Set())
    this._listeners.get(key)!.add(fn)
    return () => this._listeners.get(key)!.delete(fn)
  }
}

// =============================================================================
// U14: FeatureFlags
// =============================================================================

export class FeatureFlags {
  private _flags: Map<string, { enabled: boolean; rolloutPercent: number; allowList: Set<string> }> = new Map()

  define(name: string, enabled: boolean = false, rolloutPercent: number = 0): void {
    this._flags.set(name, { enabled, rolloutPercent, allowList: new Set() })
  }

  enable(name: string): void { this._flags.get(name)!.enabled = true }
  disable(name: string): void { this._flags.get(name)!.enabled = false }
  setRollout(name: string, percent: number): void { this._flags.get(name)!.rolloutPercent = percent }

  allowUser(name: string, userId: string): void { this._flags.get(name)!.allowList.add(userId) }

  isEnabled(name: string, userId?: string): boolean {
    const flag = this._flags.get(name)
    if (!flag) return false
    if (!flag.enabled) return false
    if (userId && flag.allowList.has(userId)) return true
    if (userId && flag.rolloutPercent < 100) {
      const hash = this._hashUser(userId, name)
      return (hash % 100) < flag.rolloutPercent
    }
    // 无 userId: 如果 enabled=true，直接返回 true（默认对所有人生效）
    return true
  }

  list(): string[] { return Array.from(this._flags.keys()) }

  private _hashUser(userId: string, salt: string): number {
    let h = 5381
    const str = userId + ':' + salt
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h) + str.charCodeAt(i)
      h = h & h
    }
    return Math.abs(h)
  }
}

// =============================================================================
// U15: CICDConfig
// =============================================================================

export interface CICDPipelineConfig {
  name: string
  trigger: 'push' | 'pr' | 'manual' | 'schedule'
  branches: string[]
  stages: Array<{ name: string; jobs: string[] }>
  environment: string
  autoDeploy: boolean
}

export class CICDConfig {
  private _configs: Map<string, CICDPipelineConfig> = new Map()

  add(config: CICDPipelineConfig): void {
    this._configs.set(config.name, config)
  }

  get(name: string): CICDPipelineConfig | undefined {
    return this._configs.get(name)
  }

  forBranch(branch: string): CICDPipelineConfig[] {
    return Array.from(this._configs.values()).filter(c => c.branches.includes(branch))
  }

  list(): CICDPipelineConfig[] { return Array.from(this._configs.values()) }
}