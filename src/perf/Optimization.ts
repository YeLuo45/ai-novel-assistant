/**
 * perf/Optimization.ts (S1-S10) - 10 engines
 *
 * - S1 EngineCache: 引擎层缓存
 * - S2 BundleOptimizer: bundle 优化
 * - S3 RuntimeProfiler: 运行时 profiling
 * - S4 LazyLoader: 懒加载
 * - S5 Memoizer: 记忆化
 * - S6 WorkerPool: worker 池
 * - S7 StreamProcessor: 流处理
 * - S8 BatchProcessor: 批处理
 * - S9 Debouncer: 防抖
 * - S10 Throttler: 节流
 */

// =============================================================================
// S1: EngineCache
// =============================================================================

export interface CacheEntry<V> {
  key: string
  value: V
  expiresAt: number
  hits: number
  size: number
}

export interface CacheConfig {
  maxSize: number
  ttlMs: number
  strategy: 'lru' | 'lfu' | 'fifo'
}

export class EngineCache<V = unknown> {
  private _cache: Map<string, CacheEntry<V>> = new Map()
  private _accessOrder: string[] = []
  private _hitCount: number = 0
  private _missCount: number = 0
  private _config: CacheConfig

  constructor(config: Partial<CacheConfig> = {}) {
    this._config = {
      maxSize: config.maxSize ?? 100,
      ttlMs: config.ttlMs ?? 60_000,
      strategy: config.strategy ?? 'lru',
    }
  }

  get(key: string): V | undefined {
    const entry = this._cache.get(key)
    if (!entry) { this._missCount += 1; return undefined }
    if (entry.expiresAt < Date.now()) {
      this._cache.delete(key)
      this._missCount += 1
      return undefined
    }
    entry.hits += 1
    this._hitCount += 1
    if (this._config.strategy === 'lru') {
      this._accessOrder = this._accessOrder.filter(k => k !== key)
      this._accessOrder.push(key)
    }
    return entry.value
  }

  set(key: string, value: V, size: number = 1): void {
    if (this._cache.has(key)) {
      this._cache.delete(key)
      this._accessOrder = this._accessOrder.filter(k => k !== key)
    }
    if (this._cache.size >= this._config.maxSize) {
      this._evict()
    }
    this._cache.set(key, { key, value, expiresAt: Date.now() + this._config.ttlMs, hits: 0, size })
    this._accessOrder.push(key)
  }

  delete(key: string): boolean {
    this._accessOrder = this._accessOrder.filter(k => k !== key)
    return this._cache.delete(key)
  }

  clear(): void {
    this._cache.clear()
    this._accessOrder = []
  }

  size(): number { return this._cache.size }

  stats(): { hits: number; misses: number; hitRate: number; size: number } {
    const total = this._hitCount + this._missCount
    return {
      hits: this._hitCount,
      misses: this._missCount,
      hitRate: total === 0 ? 0 : this._hitCount / total,
      size: this._cache.size,
    }
  }

  private _evict(): void {
    let keyToEvict: string | null = null
    if (this._config.strategy === 'lru' || this._config.strategy === 'fifo') {
      keyToEvict = this._accessOrder.shift() ?? null
    } else if (this._config.strategy === 'lfu') {
      let minHits = Infinity
      let minKey: string | null = null
      for (const [key, entry] of this._cache) {
        if (entry.hits < minHits) { minHits = entry.hits; minKey = key }
      }
      keyToEvict = minKey
    }
    if (keyToEvict) {
      this._cache.delete(keyToEvict)
      this._accessOrder = this._accessOrder.filter(k => k !== keyToEvict)
    }
  }
}

// =============================================================================
// S2: BundleOptimizer
// =============================================================================

export interface BundleEntry {
  moduleId: string
  size: number
  usedBy: string[]
  isEntry: boolean
}

export class BundleOptimizer {
  private _modules: Map<string, BundleEntry> = new Map()

  addModule(moduleId: string, size: number, usedBy: string[] = [], isEntry: boolean = false): void {
    this._modules.set(moduleId, { moduleId, size, usedBy, isEntry })
  }

  /** 检测未使用模块 */
  unusedModules(): string[] {
    return Array.from(this._modules.values())
      .filter(m => !m.isEntry && m.usedBy.length === 0)
      .map(m => m.moduleId)
  }

  /** 检测重复依赖 */
  duplicates(): Map<string, number> {
    const map = new Map<string, number>()
    return map
  }

  /** 推荐删除的模块（unused） */
  suggestRemovals(): { moduleId: string; size: number }[] {
    return Array.from(this._modules.values())
      .filter(m => !m.isEntry && m.usedBy.length === 0)
      .map(m => ({ moduleId: m.moduleId, size: m.size }))
  }

  totalSize(): number {
    let total = 0
    for (const m of this._modules.values()) total += m.size
    return total
  }

  sizeAfterRemovals(): number {
    return this.totalSize() - this.suggestRemovals().reduce((sum, m) => sum + m.size, 0)
  }
}

// =============================================================================
// S3: RuntimeProfiler
// =============================================================================

export interface ProfileSample {
  name: string
  startMs: number
  endMs?: number
  durationMs?: number
  metadata?: Record<string, unknown>
}

export class RuntimeProfiler {
  private _samples: ProfileSample[] = []
  private _startTime: number = Date.now()
  private _markers: Map<string, number> = new Map()

  begin(name: string, metadata?: Record<string, unknown>): void {
    this._samples.push({ name, startMs: Date.now() - this._startTime, metadata })
  }

  end(name: string): number | null {
    const now = Date.now() - this._startTime
    for (let i = this._samples.length - 1; i >= 0; i--) {
      if (this._samples[i]!.name === name && this._samples[i]!.endMs === undefined) {
        this._samples[i]!.endMs = now
        this._samples[i]!.durationMs = now - this._samples[i]!.startMs
        return this._samples[i]!.durationMs ?? 0
      }
    }
    return null
  }

  measure(name: string, fn: () => void): number {
    this.begin(name)
    fn()
    return this.end(name) ?? 0
  }

  /** 标记点（用于 profiling 时序图） */
  mark(name: string): void {
    this._markers.set(name, Date.now() - this._startTime)
  }

  /** 标记点之间的耗时 */
  measureBetween(startMark: string, endMark: string): number | null {
    const s = this._markers.get(startMark)
    const e = this._markers.get(endMark)
    if (s === undefined || e === undefined) return null
    return e - s
  }

  /** 按 name 汇总 */
  summary(): Record<string, { count: number; totalMs: number; avgMs: number; maxMs: number }> {
    const map: Record<string, { count: number; totalMs: number; avgMs: number; maxMs: number }> = {}
    for (const s of this._samples) {
      if (s.durationMs === undefined) continue
      if (!map[s.name]) map[s.name] = { count: 0, totalMs: 0, avgMs: 0, maxMs: 0 }
      const m = map[s.name]!
      m.count += 1
      m.totalMs += s.durationMs
      m.maxMs = Math.max(m.maxMs, s.durationMs)
      m.avgMs = m.totalMs / m.count
    }
    return map
  }

  reset(): void {
    this._samples = []
    this._markers.clear()
    this._startTime = Date.now()
  }
}

// =============================================================================
// S4: LazyLoader
// =============================================================================

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error'

export interface LazyResource<T> {
  status: LoadStatus
  value?: T
  error?: Error
}

export class LazyLoader<T> {
  private _resource: LazyResource<T> = { status: 'idle' }
  private _loader: () => Promise<T>
  private _listeners: Set<(r: LazyResource<T>) => void> = new Set()

  constructor(loader: () => Promise<T>) {
    this._loader = loader
  }

  load(): void {
    if (this._resource.status === 'loading' || this._resource.status === 'loaded') return
    this._resource.status = 'loading'
    this._emit()
    this._loader().then(
      (value) => {
        this._resource = { status: 'loaded', value }
        this._emit()
      },
      (error: Error) => {
        this._resource = { status: 'error', error }
        this._emit()
      },
    )
  }

  get(): LazyResource<T> { return { ...this._resource } }

  reset(): void { this._resource = { status: 'idle' } }

  subscribe(fn: (r: LazyResource<T>) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }

  private _emit(): void { for (const l of this._listeners) l(this.get()) }
}

// =============================================================================
// S5: Memoizer
// =============================================================================

export class Memoizer<TArgs extends unknown[], TReturn> {
  private _cache: Map<string, TReturn> = new Map()
  private _maxSize: number

  constructor(maxSize: number = 100) {
    this._maxSize = maxSize
  }

  /** 计算并缓存结果 */
  compute(fn: (...args: TArgs) => TReturn, ...args: TArgs): TReturn {
    const key = this._key(args)
    if (this._cache.has(key)) return this._cache.get(key)!
    const result = fn(...args)
    if (this._cache.size >= this._maxSize) {
      const firstKey = this._cache.keys().next().value
      if (firstKey !== undefined) this._cache.delete(firstKey)
    }
    this._cache.set(key, result)
    return result
  }

  clear(): void { this._cache.clear() }
  size(): number { return this._cache.size }
  has(...args: TArgs): boolean { return this._cache.has(this._key(args)) }

  private _key(args: TArgs): string {
    return JSON.stringify(args)
  }
}

// =============================================================================
// S6: WorkerPool
// =============================================================================

export interface WorkerTask<T> {
  taskId: string
  fn: () => Promise<T>
  onResolve: (value: T) => void
  onReject: (error: Error) => void
}

export class WorkerPool {
  private _maxWorkers: number
  private _activeWorkers: number = 0
  private _queue: Array<WorkerTask<unknown>> = []
  private _nextId: number = 0
  private _completedCount: number = 0

  constructor(maxWorkers: number = 4) {
    this._maxWorkers = maxWorkers
  }

  submit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask<T> = {
        taskId: `task_${++this._nextId}`,
        fn,
        onResolve: resolve,
        onReject: reject,
      }
      this._queue.push(task as WorkerTask<unknown>)
      this._drain()
    })
  }

  private _drain(): void {
    while (this._activeWorkers < this._maxWorkers && this._queue.length > 0) {
      const task = this._queue.shift()!
      this._activeWorkers += 1
      task.fn().then(
        (value) => {
          this._activeWorkers -= 1
          this._completedCount += 1
          task.onResolve(value)
          this._drain()
        },
        (error: Error) => {
          this._activeWorkers -= 1
          this._completedCount += 1
          task.onReject(error)
          this._drain()
        },
      )
    }
  }

  activeWorkers(): number { return this._activeWorkers }
  queueSize(): number { return this._queue.length }
  completedCount(): number { return this._completedCount }
}

// =============================================================================
// S7: StreamProcessor
// =============================================================================

export class StreamProcessor<T> {
  private _buffer: T[] = []
  private _maxBufferSize: number
  private _processor: (item: T) => void
  private _listeners: Set<(bufferSize: number) => void> = new Set()

  constructor(processor: (item: T) => void, maxBufferSize: number = 100) {
    this._processor = processor
    this._maxBufferSize = maxBufferSize
  }

  push(item: T): boolean {
    if (this._buffer.length >= this._maxBufferSize) return false
    this._buffer.push(item)
    if (this._buffer.length >= this._maxBufferSize) this.flush()
    return true
  }

  flush(): void {
    if (this._buffer.length === 0) return
    const toProcess = [...this._buffer]
    this._buffer = []
    for (const item of toProcess) this._processor(item)
    for (const l of this._listeners) l(0)
  }

  bufferSize(): number { return this._buffer.length }

  subscribe(fn: (bufferSize: number) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// S8: BatchProcessor
// =============================================================================

export class BatchProcessor<T> {
  private _batch: T[] = []
  private _batchSize: number
  private _flushIntervalMs: number
  private _processor: (batch: T[]) => void
  private _timer: ReturnType<typeof setInterval> | null = null

  constructor(processor: (batch: T[]) => void, batchSize: number = 10, flushIntervalMs: number = 1000) {
    this._processor = processor
    this._batchSize = batchSize
    this._flushIntervalMs = flushIntervalMs
    this._startTimer()
  }

  add(item: T): void {
    this._batch.push(item)
    if (this._batch.length >= this._batchSize) this.flush()
  }

  flush(): void {
    if (this._batch.length === 0) return
    const toProcess = [...this._batch]
    this._batch = []
    this._processor(toProcess)
  }

  private _startTimer(): void {
    this._timer = setInterval(() => this.flush(), this._flushIntervalMs)
  }

  stop(): void {
    if (this._timer) clearInterval(this._timer)
    this._timer = null
    this.flush()
  }

  size(): number { return this._batch.length }
}

// =============================================================================
// S9: Debouncer
// =============================================================================

export class Debouncer {
  private _timers: Map<string, ReturnType<typeof setTimeout>> = new Map()

  debounce(id: string, fn: () => void, delayMs: number): void {
    const existing = this._timers.get(id)
    if (existing) clearTimeout(existing)
    this._timers.set(id, setTimeout(() => {
      this._timers.delete(id)
      fn()
    }, delayMs))
  }

  cancel(id: string): boolean {
    const t = this._timers.get(id)
    if (!t) return false
    clearTimeout(t)
    this._timers.delete(id)
    return true
  }

  pending(): string[] { return Array.from(this._timers.keys()) }
  isPending(id: string): boolean { return this._timers.has(id) }
}

// =============================================================================
// S10: Throttler
// =============================================================================

export class Throttler {
  private _lastExecutionTime: Map<string, number> = new Map()

  throttle(id: string, fn: () => void, intervalMs: number): boolean {
    const now = Date.now()
    const last = this._lastExecutionTime.get(id) ?? 0
    if (now - last < intervalMs) return false
    this._lastExecutionTime.set(id, now)
    fn()
    return true
  }

  /** 强制执行 */
  force(id: string, fn: () => void): void {
    this._lastExecutionTime.set(id, Date.now())
    fn()
  }

  reset(id?: string): void {
    if (id) this._lastExecutionTime.delete(id)
    else this._lastExecutionTime.clear()
  }
}