/**
 * perf/OptimizationAdvanced.ts (S11-S25) - 15 engines
 *
 * - S11 MemoryPool: 内存池
 * - S12 ObjectReuse: 对象复用
 * - S13 GCHint: GC 提示
 * - S14 HeapAnalyzer: 堆分析
 * - S15 AllocationProfiler: 分配分析
 * - S16 RenderCache: 渲染缓存
 * - S17 ComputedSelector: 计算选择器
 * - S18 CacheEviction: 缓存淘汰策略
 * - S19 CacheStrategy: 缓存策略
 * - S20 CacheWarmer: 缓存预热
 * - S21 BundleSplitter: bundle 拆分
 * - S22 CodeSplitter: 代码拆分
 * - S23 LazyImporter: 懒加载导入
 * - S24 TreeShakingHint: tree shaking 提示
 * - S25 ModuleGraph: 模块图
 */

// =============================================================================
// S11: MemoryPool
// =============================================================================

export interface PooledObject<T> {
  object: T
  acquiredAt: number
  released: boolean
}

export class MemoryPool<T> {
  private _pool: PooledObject<T>[] = []
  private _factory: () => T
  private _reset: (obj: T) => void
  private _maxSize: number

  constructor(factory: () => T, reset: (obj: T) => void = () => {}, maxSize: number = 100) {
    this._factory = factory
    this._reset = reset
    this._maxSize = maxSize
  }

  acquire(): PooledObject<T> {
    let obj = this._pool.pop()
    if (!obj) obj = { object: this._factory(), acquiredAt: Date.now(), released: false }
    obj.acquiredAt = Date.now()
    obj.released = false
    return obj
  }

  release(obj: PooledObject<T>): void {
    if (obj.released) return
    obj.released = true
    this._reset(obj.object)
    if (this._pool.length < this._maxSize) this._pool.push(obj)
  }

  size(): number { return this._pool.length }
  totalCreated(): number { return this._pool.length }  // simplified
}

// =============================================================================
// S12: ObjectReuse
// =============================================================================

export class ObjectReuse {
  private _instances: Map<string, unknown> = new Map()
  private _maxInstances: number

  constructor(maxInstances: number = 100) {
    this._maxInstances = maxInstances
  }

  getOrCreate<T>(key: string, factory: () => T): T {
    if (this._instances.has(key)) return this._instances.get(key) as T
    if (this._instances.size >= this._maxInstances) {
      // evict oldest
      const firstKey = this._instances.keys().next().value
      if (firstKey !== undefined) this._instances.delete(firstKey)
    }
    const obj = factory()
    this._instances.set(key, obj)
    return obj
  }

  size(): number { return this._instances.size }
  has(key: string): boolean { return this._instances.has(key) }
  release(key: string): boolean { return this._instances.delete(key) }
  clear(): void { this._instances.clear() }
}

// =============================================================================
// S13: GCHint
// =============================================================================

export class GCHint {
  private _gcRequested: number = 0
  private _lastGcAt: number = 0

  /** 提示 GC（生产环境通常无效，仅记录） */
  hintGC(): void {
    this._gcRequested += 1
    this._lastGcAt = Date.now()
    if (typeof global !== 'undefined' && (global as any).gc) {
      try { (global as any).gc() } catch { /* swallow */ }
    }
  }

  gcRequested(): number { return this._gcRequested }
  lastGcAt(): number { return this._lastGcAt }

  /** 估算内存压力 */
  estimateMemoryPressure(usageMb: number, maxMb: number): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = usageMb / maxMb
    if (ratio < 0.5) return 'low'
    if (ratio < 0.8) return 'medium'
    if (ratio < 0.95) return 'high'
    return 'critical'
  }
}

// =============================================================================
// S14: HeapAnalyzer
// =============================================================================

export interface HeapSnapshot {
  timestamp: number
  totalSize: number
  objectsByType: Map<string, number>
  totalObjects: number
}

export class HeapAnalyzer {
  private _snapshots: HeapSnapshot[] = []

  takeSnapshot(objects: Array<{ type: string; size: number }>): HeapSnapshot {
    const byType = new Map<string, number>()
    let total = 0
    for (const obj of objects) {
      byType.set(obj.type, (byType.get(obj.type) ?? 0) + obj.size)
      total += obj.size
    }
    const snapshot: HeapSnapshot = {
      timestamp: Date.now(),
      totalSize: total,
      objectsByType: byType,
      totalObjects: objects.length,
    }
    this._snapshots.push(snapshot)
    return snapshot
  }

  snapshots(): HeapSnapshot[] { return [...this._snapshots] }

  diff(snap1: HeapSnapshot, snap2: HeapSnapshot): { sizeDelta: number; typeDelta: Map<string, number> } {
    const typeDelta = new Map<string, number>()
    for (const [type, size] of snap2.objectsByType) {
      typeDelta.set(type, size - (snap1.objectsByType.get(type) ?? 0))
    }
    return { sizeDelta: snap2.totalSize - snap1.totalSize, typeDelta }
  }
}

// =============================================================================
// S15: AllocationProfiler
// =============================================================================

export class AllocationProfiler {
  private _allocations: Map<string, number> = new Map()
  private _totalAllocated: number = 0

  record(type: string, size: number = 1): void {
    this._allocations.set(type, (this._allocations.get(type) ?? 0) + size)
    this._totalAllocated += size
  }

  byType(): Map<string, number> { return new Map(this._allocations) }

  hotTypes(topN: number = 5): Array<{ type: string; count: number }> {
    return Array.from(this._allocations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([type, count]) => ({ type, count }))
  }

  total(): number { return this._totalAllocated }
  reset(): void { this._allocations.clear(); this._totalAllocated = 0 }
}

// =============================================================================
// S16: RenderCache
// =============================================================================

export class RenderCache<T> {
  private _cache: Map<string, { value: T; renderMs: number; lastUsed: number }> = new Map()
  private _maxSize: number
  private _renderFn: () => T

  constructor(renderFn: () => T, maxSize: number = 50) {
    this._renderFn = renderFn
    this._maxSize = maxSize
  }

  get(key: string): T {
    const entry = this._cache.get(key)
    if (entry) {
      entry.lastUsed = Date.now()
      return entry.value
    }
    const start = Date.now()
    const value = this._renderFn()
    const renderMs = Date.now() - start
    if (this._cache.size >= this._maxSize) {
      const oldest = Array.from(this._cache.entries()).sort((a, b) => a[1].lastUsed - b[1].lastUsed)[0]
      if (oldest) this._cache.delete(oldest[0])
    }
    this._cache.set(key, { value, renderMs, lastUsed: Date.now() })
    return value
  }

  clear(): void { this._cache.clear() }
  size(): number { return this._cache.size }
  stats(): { hits: number; misses: number; totalRenderMs: number } {
    let hits = 0, misses = 0, totalRenderMs = 0
    for (const [, entry] of this._cache) {
      if (entry.renderMs > 0) misses += 1
      else hits += 1
      totalRenderMs += entry.renderMs
    }
    return { hits, misses, totalRenderMs }
  }
}

// =============================================================================
// S17: ComputedSelector
// =============================================================================

export class ComputedSelector<TState, TResult> {
  private _computeFn: (state: TState) => TResult
  private _cache: { state: TState | undefined; result: TResult | undefined } = { state: undefined, result: undefined }

  constructor(computeFn: (state: TState) => TResult) {
    this._computeFn = computeFn
  }

  compute(state: TState): TResult {
    if (this._cache.state !== undefined && JSON.stringify(state) === JSON.stringify(this._cache.state)) {
      return this._cache.result!
    }
    const result = this._computeFn(state)
    this._cache = { state, result }
    return result
  }

  invalidate(): void { this._cache = { state: undefined, result: undefined } }
}

// =============================================================================
// S18: CacheEviction
// =============================================================================

export type EvictionPolicy = 'lru' | 'lfu' | 'fifo' | 'ttl' | 'random'

export interface EvictionCandidate {
  key: string
  hits: number
  lastUsed: number
  expiresAt: number
}

export class CacheEviction {
  static selectVictim(candidates: EvictionCandidate[], policy: EvictionPolicy): string | null {
    if (candidates.length === 0) return null
    if (policy === 'lru') {
      return candidates.reduce((min, c) => c.lastUsed < min.lastUsed ? c : min).key
    }
    if (policy === 'lfu') {
      return candidates.reduce((min, c) => c.hits < min.hits ? c : min).key
    }
    if (policy === 'fifo') {
      return candidates[0]!.key
    }
    if (policy === 'ttl') {
      return candidates.reduce((min, c) => c.expiresAt < min.expiresAt ? c : min).key
    }
    // random
    return candidates[Math.floor(Math.random() * candidates.length)]!.key
  }
}

// =============================================================================
// S19: CacheStrategy
// =============================================================================

export type CacheStrategy = 'cache-first' | 'cache-aside' | 'read-through' | 'write-through' | 'write-behind'

export class CacheStrategyExecutor {
  private _strategy: CacheStrategy
  private _cache: Map<string, unknown> = new Map()
  private _loader: (key: string) => unknown

  constructor(strategy: CacheStrategy, loader: (key: string) => unknown) {
    this._strategy = strategy
    this._loader = loader
  }

  get(key: string): unknown {
    if (this._cache.has(key) && this._strategy !== 'cache-aside') return this._cache.get(key)!
    const value = this._loader(key)
    if (this._strategy === 'cache-first' || this._strategy === 'read-through' || this._strategy === 'write-through') {
      this._cache.set(key, value)
    }
    return value
  }

  set(key: string, value: unknown): void {
    if (this._strategy === 'write-through') {
      this._loader(key)  // write to backend
      this._cache.set(key, value)
    } else if (this._strategy === 'write-behind') {
      this._cache.set(key, value)
      // defer write to backend
    } else {
      this._cache.set(key, value)
    }
  }
}

// =============================================================================
// S20: CacheWarmer
// =============================================================================

export class CacheWarmer {
  private _warmed: Set<string> = new Set()

  warm<T>(keys: string[], loader: (key: string) => T): Map<string, T> {
    const result = new Map<string, T>()
    for (const key of keys) {
      result.set(key, loader(key))
      this._warmed.add(key)
    }
    return result
  }

  isWarmed(key: string): boolean { return this._warmed.has(key) }
  warmedCount(): number { return this._warmed.size }
  reset(): void { this._warmed.clear() }
}

// =============================================================================
// S21: BundleSplitter
// =============================================================================

export interface BundleChunk {
  chunkId: string
  modules: string[]
  size: number
  loadPriority: number
}

export class BundleSplitter {
  private _chunks: Map<string, BundleChunk> = new Map()
  private _moduleChunk: Map<string, string> = new Map()

  createChunk(chunkId: string, modules: string[], loadPriority: number = 0): BundleChunk {
    const totalSize = modules.length * 100  // simplified
    const chunk: BundleChunk = { chunkId, modules, size: totalSize, loadPriority }
    this._chunks.set(chunkId, chunk)
    for (const m of modules) this._moduleChunk.set(m, chunkId)
    return chunk
  }

  chunksByPriority(): BundleChunk[] {
    return Array.from(this._chunks.values()).sort((a, b) => a.loadPriority - b.loadPriority)
  }

  chunkForModule(moduleId: string): string | undefined {
    return this._moduleChunk.get(moduleId)
  }

  totalSize(): number {
    let total = 0
    for (const c of this._chunks.values()) total += c.size
    return total
  }
}

// =============================================================================
// S22: CodeSplitter
// =============================================================================

export class CodeSplitter {
  private _routes: Map<string, string[]> = new Map()

  setRoute(routePath: string, imports: string[]): void {
    this._routes.set(routePath, imports)
  }

  getImports(routePath: string): string[] {
    return this._routes.get(routePath) ?? []
  }

  routeCount(): number { return this._routes.size }

  /** 建议 split point */
  suggestSplit(routePath: string): { beforeImports: string[]; afterImports: string[] } {
    const all = this.getImports(routePath)
    if (all.length === 0) return { beforeImports: [], afterImports: [] }
    const mid = Math.floor(all.length / 2)
    return { beforeImports: all.slice(0, mid), afterImports: all.slice(mid) }
  }
}

// =============================================================================
// S23: LazyImporter
// =============================================================================

export class LazyImporter<T> {
  private _loader: () => Promise<T>
  private _loaded: T | null = null
  private _loading: Promise<T> | null = null

  constructor(loader: () => Promise<T>) {
    this._loader = loader
  }

  async get(): Promise<T> {
    if (this._loaded !== null) return this._loaded
    if (this._loading) return this._loading
    this._loading = this._loader().then((value) => {
      this._loaded = value
      this._loading = null
      return value
    })
    return this._loading
  }

  isLoaded(): boolean { return this._loaded !== null }
  reset(): void { this._loaded = null; this._loading = null }
}

// =============================================================================
// S24: TreeShakingHint
// =============================================================================

export interface ShakeResult {
  kept: string[]
  shaken: string[]
  savedBytes: number
}

export class TreeShakingHint {
  private _usedExports: Set<string> = new Set()
  private _allExports: Map<string, number> = new Map()  // name → size bytes

  registerExports(module: string, exports: Array<{ name: string; size: number }>): void {
    for (const exp of exports) {
      this._allExports.set(`${module}.${exp.name}`, exp.size)
    }
  }

  markUsed(moduleExport: string): void { this._usedExports.add(moduleExport) }

  shake(): ShakeResult {
    const kept: string[] = []
    const shaken: string[] = []
    let saved = 0
    for (const [name, size] of this._allExports) {
      if (this._usedExports.has(name)) kept.push(name)
      else { shaken.push(name); saved += size }
    }
    return { kept, shaken, savedBytes: saved }
  }

  reset(): void {
    this._usedExports.clear()
    this._allExports.clear()
  }
}

// =============================================================================
// S25: ModuleGraph
// =============================================================================

export interface ModuleNode {
  moduleId: string
  size: number
  imports: string[]
}

export class ModuleGraph {
  private _modules: Map<string, ModuleNode> = new Map()

  addModule(node: ModuleNode): void {
    this._modules.set(node.moduleId, node)
  }

  /** 检测循环依赖 */
  findCycles(): string[][] {
    const cycles: string[][] = []
    const visited: Set<string> = new Set()
    const stack: Set<string> = new Set()
    const path: string[] = []

    const dfs = (id: string): void => {
      if (stack.has(id)) {
        const cycleStart = path.indexOf(id)
        if (cycleStart >= 0) cycles.push(path.slice(cycleStart))
        return
      }
      if (visited.has(id)) return
      visited.add(id)
      stack.add(id)
      path.push(id)
      const node = this._modules.get(id)
      if (node) for (const imp of node.imports) dfs(imp)
      path.pop()
      stack.delete(id)
    }

    for (const id of this._modules.keys()) {
      if (!visited.has(id)) dfs(id)
    }
    return cycles
  }

  /** 拓扑排序 */
  topologicalOrder(): string[] {
    const result: string[] = []
    const visited: Set<string> = new Set()
    const visit = (id: string): void => {
      if (visited.has(id)) return
      visited.add(id)
      const node = this._modules.get(id)
      if (node) for (const imp of node.imports) visit(imp)
      result.push(id)
    }
    for (const id of this._modules.keys()) visit(id)
    return result
  }

  totalSize(): number {
    let total = 0
    for (const m of this._modules.values()) total += m.size
    return total
  }
}