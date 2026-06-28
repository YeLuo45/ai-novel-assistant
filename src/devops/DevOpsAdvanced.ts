/**
 * devops/DevOpsAdvanced.ts (U16-U25) - 10 engines
 *
 * - U16 DeploymentStrategy
 * - U17 TrafficSplitter
 * - U18 VersionManager
 * - U19 ReleaseNotes
 * - U20 ChangelogGenerator
 * - U21 SmokeTest
 * - U22 E2ETestRunner
 * - U23 LoadTest
 * - U24 SyntheticMonitor
 * - U25 OnCallScheduler
 */

// =============================================================================
// U16: DeploymentStrategy
// =============================================================================

export type DeploymentType = 'blue-green' | 'canary' | 'rolling' | 'recreate'

export class DeploymentStrategy {
  private _strategy: DeploymentType
  private _currentActiveEnv: 'blue' | 'green' = 'blue'

  constructor(strategy: DeploymentType = 'rolling') {
    this._strategy = strategy
  }

  strategy(): DeploymentType { return this._strategy }

  /** blue-green: 切换流量到新版本 */
  blueGreenSwitch(): 'blue' | 'green' {
    this._currentActiveEnv = this._currentActiveEnv === 'blue' ? 'green' : 'blue'
    return this._currentActiveEnv
  }

  activeEnv(): 'blue' | 'green' { return this._currentActiveEnv }

  /** rolling: 逐步替换 */
  rollingUpdate(batchSize: number, total: number): { batch: number; remaining: number } {
    return { batch: Math.min(batchSize, total), remaining: Math.max(0, total - batchSize) }
  }

  /** canary: 百分比 */
  canaryRollout(currentPercent: number, targetPercent: number): { current: number; target: number; delta: number } {
    return {
      current: currentPercent,
      target: targetPercent,
      delta: targetPercent - currentPercent,
    }
  }

  /** recreate: 全量替换 */
  recreate(): { status: 'deploying' | 'rolling-back' } {
    return { status: 'deploying' }
  }
}

// =============================================================================
// U17: TrafficSplitter
// =============================================================================

export class TrafficSplitter {
  private _weights: Map<string, number> = new Map()

  setWeight(target: string, weight: number): void {
    this._weights.set(target, Math.max(0, Math.min(100, weight)))
  }

  weights(): Map<string, number> { return new Map(this._weights) }

  /** 路由：根据 hash 选择 target */
  route(key: string): string | null {
    if (this._weights.size === 0) return null
    let total = 0
    for (const w of this._weights.values()) total += w
    if (total === 0) return null
    const hash = this._hash(key) % total
    let cumulative = 0
    for (const [target, weight] of this._weights) {
      cumulative += weight
      if (hash < cumulative) return target
    }
    return Array.from(this._weights.keys())[0] ?? null
  }

  /** 调整 weight 使总为 100 */
  normalize(): void {
    let total = 0
    for (const w of this._weights.values()) total += w
    if (total === 0) return
    for (const [target, weight] of this._weights) {
      this._weights.set(target, (weight / total) * 100)
    }
  }

  private _hash(s: string): number {
    let h = 5381
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) + h) + s.charCodeAt(i)
      h = h & h
    }
    return Math.abs(h)
  }
}

// =============================================================================
// U18: VersionManager
// =============================================================================

export interface Semver {
  major: number
  minor: number
  patch: number
  preRelease?: string
}

export class VersionManager {
  private _current: Semver = { major: 0, minor: 1, patch: 0 }

  current(): Semver { return { ...this._current } }

  set(v: Semver): void {
    if (v.major < 0 || v.minor < 0 || v.patch < 0) throw new Error('negative version')
    this._current = v
  }

  bump(type: 'major' | 'minor' | 'patch'): Semver {
    const next = { ...this._current }
    if (type === 'major') { next.major += 1; next.minor = 0; next.patch = 0 }
    else if (type === 'minor') { next.minor += 1; next.patch = 0 }
    else { next.patch += 1 }
    this._current = next
    return this.current()
  }

  /** 比较 versions */
  static compare(a: Semver, b: Semver): number {
    if (a.major !== b.major) return a.major - b.major
    if (a.minor !== b.minor) return a.minor - b.minor
    return a.patch - b.patch
  }

  toString(v: Semver = this._current): string {
    let s = `${v.major}.${v.minor}.${v.patch}`
    if (v.preRelease) s += `-${v.preRelease}`
    return s
  }
}

// =============================================================================
// U19: ReleaseNotes
// =============================================================================

export interface ReleaseNote {
  version: string
  date: number
  type: 'major' | 'minor' | 'patch'
  features: string[]
  fixes: string[]
  breaking: string[]
}

export class ReleaseNotes {
  private _notes: ReleaseNote[] = []

  add(note: ReleaseNote): void {
    this._notes.push(note)
    this._notes.sort((a, b) => b.date - a.date)
  }

  latest(): ReleaseNote | null { return this._notes[0] ?? null }
  byVersion(version: string): ReleaseNote | null {
    return this._notes.find(n => n.version === version) ?? null
  }
  all(): ReleaseNote[] { return [...this._notes] }

  /** 格式化为 Markdown */
  toMarkdown(note: ReleaseNote): string {
    const lines: string[] = [`# ${note.version}`, '', `Released: ${new Date(note.date).toISOString()}`, '']
    if (note.breaking.length > 0) {
      lines.push('## ⚠️ Breaking Changes', '')
      for (const f of note.breaking) lines.push(`- ${f}`)
      lines.push('')
    }
    if (note.features.length > 0) {
      lines.push('## ✨ Features', '')
      for (const f of note.features) lines.push(`- ${f}`)
      lines.push('')
    }
    if (note.fixes.length > 0) {
      lines.push('## 🐛 Bug Fixes', '')
      for (const f of note.fixes) lines.push(`- ${f}`)
      lines.push('')
    }
    return lines.join('\n')
  }
}

// =============================================================================
// U20: ChangelogGenerator
// =============================================================================

export type ChangeType = 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security'

export class ChangelogGenerator {
  private _entries: Array<{ type: ChangeType; description: string; scope?: string; date: number }> = []

  add(type: ChangeType, description: string, scope?: string): void {
    this._entries.push({ type, description, scope, date: Date.now() })
  }

  /** 按 Keep-a-Changelog 格式生成 */
  generate(version: string, date: Date = new Date()): string {
    const lines: string[] = [
      `# Changelog`,
      ``,
      `All notable changes to this project will be documented in this file.`,
      ``,
      `## [${version}] - ${date.toISOString().slice(0, 10)}`,
      ``,
    ]
    const grouped: Record<ChangeType, string[]> = {
      added: [], changed: [], deprecated: [], removed: [], fixed: [], security: [],
    }
    for (const e of this._entries) {
      const scope = e.scope ? `**${e.scope}**: ` : ''
      grouped[e.type].push(`- ${scope}${e.description}`)
    }
    const order: ChangeType[] = ['added', 'changed', 'fixed', 'deprecated', 'removed', 'security']
    const titles: Record<ChangeType, string> = {
      added: 'Added', changed: 'Changed', fixed: 'Fixed',
      deprecated: 'Deprecated', removed: 'Removed', security: 'Security',
    }
    for (const t of order) {
      if (grouped[t].length > 0) {
        lines.push(`### ${titles[t]}`)
        lines.push(``)
        lines.push(...grouped[t])
        lines.push(``)
      }
    }
    return lines.join('\n')
  }

  clear(): void { this._entries = [] }
}

// =============================================================================
// U21: SmokeTest
// =============================================================================

export interface SmokeTestResult {
  name: string
  passed: boolean
  durationMs: number
  error?: string
}

export class SmokeTest {
  private _tests: Array<{ name: string; fn: () => Promise<void> | void }> = []
  private _timeoutMs: number

  constructor(timeoutMs: number = 5000) {
    this._timeoutMs = timeoutMs
  }

  add(name: string, fn: () => Promise<void> | void): void {
    this._tests.push({ name, fn })
  }

  async runAll(): Promise<SmokeTestResult[]> {
    const results: SmokeTestResult[] = []
    for (const t of this._tests) {
      const start = Date.now()
      try {
        await Promise.race([
          Promise.resolve().then(() => t.fn()),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), this._timeoutMs)),
        ])
        results.push({ name: t.name, passed: true, durationMs: Date.now() - start })
      } catch (e) {
        results.push({
          name: t.name, passed: false, durationMs: Date.now() - start,
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }
    return results
  }

  passed(results: SmokeTestResult[]): number {
    return results.filter(r => r.passed).length
  }

  failed(results: SmokeTestResult[]): SmokeTestResult[] {
    return results.filter(r => !r.passed)
  }
}

// =============================================================================
// U22: E2ETestRunner
// =============================================================================

export interface E2EStep {
  stepId: string
  description: string
  fn: () => Promise<void> | void
  dependencies?: string[]
}

export interface E2EResult {
  stepId: string
  passed: boolean
  durationMs: number
  error?: string
}

export class E2ETestRunner {
  private _steps: E2EStep[] = []

  add(step: E2EStep): void { this._steps.push(step) }

  async run(): Promise<E2EResult[]> {
    const results: E2EResult[] = []
    const completed = new Set<string>()
    const queue = [...this._steps]

    while (queue.length > 0) {
      const runnable = queue.filter(s => !s.dependencies || s.dependencies.every(d => completed.has(d)))
      if (runnable.length === 0) break
      for (const step of runnable) {
        const start = Date.now()
        try {
          await step.fn()
          results.push({ stepId: step.stepId, passed: true, durationMs: Date.now() - start })
          completed.add(step.stepId)
        } catch (e) {
          results.push({
            stepId: step.stepId, passed: false, durationMs: Date.now() - start,
            error: e instanceof Error ? e.message : String(e),
          })
          completed.add(step.stepId)
        }
      }
      queue.splice(0, queue.length, ...queue.filter(s => !completed.has(s.stepId)))
    }
    return results
  }
}

// =============================================================================
// U23: LoadTest
// =============================================================================

export interface LoadTestResult {
  totalRequests: number
  successCount: number
  errorCount: number
  p50Ms: number
  p95Ms: number
  p99Ms: number
  rps: number
}

export class LoadTest {
  async run(concurrency: number, totalRequests: number, fn: () => Promise<void>): Promise<LoadTestResult> {
    const start = Date.now()
    const durations: number[] = []
    let successCount = 0
    let errorCount = 0
    let next = 0  // atomic counter

    const worker = async (): Promise<void> => {
      while (true) {
        const myIndex = next++
        if (myIndex >= totalRequests) break
        const s = Date.now()
        try {
          await fn()
          successCount += 1
        } catch {
          errorCount += 1
        }
        durations.push(Date.now() - s)
      }
    }

    const workers: Promise<void>[] = []
    for (let i = 0; i < concurrency; i++) workers.push(worker())
    await Promise.all(workers)

    const sorted = [...durations].sort((a, b) => a - b)
    const p = (q: number) => sorted[Math.floor(sorted.length * q)] ?? 0
    const elapsedSec = (Date.now() - start) / 1000
    const rps = totalRequests / Math.max(elapsedSec, 0.001)

    return {
      totalRequests: durations.length,
      successCount,
      errorCount,
      p50Ms: p(0.5),
      p95Ms: p(0.95),
      p99Ms: p(0.99),
      rps,
    }
  }
}

// =============================================================================
// U24: SyntheticMonitor
// =============================================================================

export interface SyntheticCheck {
  name: string
  intervalMs: number
  fn: () => Promise<boolean>
}

export interface SyntheticResult {
  name: string
  success: boolean
  durationMs: number
  timestamp: number
}

export class SyntheticMonitor {
  private _checks: SyntheticCheck[] = []
  private _results: Map<string, SyntheticResult[]> = new Map()
  private _intervals: Map<string, ReturnType<typeof setInterval>> = new Map()

  register(check: SyntheticCheck): void { this._checks.push(check) }

  async runOnce(name: string): Promise<SyntheticResult | null> {
    const check = this._checks.find(c => c.name === name)
    if (!check) return null
    const start = Date.now()
    let success = false
    try {
      success = await check.fn()
    } catch {
      success = false
    }
    const result: SyntheticResult = { name, success, durationMs: Date.now() - start, timestamp: Date.now() }
    if (!this._results.has(name)) this._results.set(name, [])
    this._results.get(name)!.push(result)
    return result
  }

  start(): void {
    for (const check of this._checks) {
      const id = setInterval(() => this.runOnce(check.name), check.intervalMs)
      this._intervals.set(check.name, id)
    }
  }

  stop(): void {
    for (const id of this._intervals.values()) clearInterval(id)
    this._intervals.clear()
  }

  results(name: string): SyntheticResult[] { return this._results.get(name) ?? [] }
  failureRate(name: string): number {
    const r = this.results(name)
    if (r.length === 0) return 0
    return r.filter(x => !x.success).length / r.length
  }
}

// =============================================================================
// U25: OnCallScheduler
// =============================================================================

export interface OnCallSchedule {
  userId: string
  start: number
  end: number
  level: 'primary' | 'secondary'
}

export class OnCallScheduler {
  private _schedule: OnCallSchedule[] = []

  add(schedule: OnCallSchedule): void { this._schedule.push(schedule) }

  currentOnCall(now: number = Date.now()): { primary?: OnCallSchedule; secondary?: OnCallSchedule } {
    const active = this._schedule.filter(s => s.start <= now && s.end >= now)
    return {
      primary: active.find(s => s.level === 'primary'),
      secondary: active.find(s => s.level === 'secondary'),
    }
  }

  forUser(userId: string): OnCallSchedule[] {
    return this._schedule.filter(s => s.userId === userId)
  }

  /** 检查覆盖：所有时间段都有 primary */
  hasGapCoverage(from: number, to: number, slotMs: number = 3_600_000): { gaps: Array<{ start: number; end: number }> } {
    const gaps: Array<{ start: number; end: number }> = []
    let cursor = from
    while (cursor < to) {
      const slotEnd = Math.min(cursor + slotMs, to)
      const hasPrimary = this._schedule.some(s => s.start <= cursor && s.end >= slotEnd && s.level === 'primary')
      if (!hasPrimary) gaps.push({ start: cursor, end: slotEnd })
      cursor = slotEnd
    }
    return { gaps }
  }
}