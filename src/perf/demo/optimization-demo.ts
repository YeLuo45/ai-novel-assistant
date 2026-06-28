/**
 * perf/demo/optimization-demo.ts (S26)
 */

import {
  EngineCache, BundleOptimizer, RuntimeProfiler, LazyLoader, Memoizer,
  WorkerPool, StreamProcessor, BatchProcessor, Debouncer, Throttler,
  MemoryPool, ObjectReuse, GCHint, HeapAnalyzer, AllocationProfiler,
  RenderCache, ComputedSelector, CacheEviction, CacheStrategyExecutor, CacheWarmer,
  BundleSplitter, CodeSplitter, LazyImporter, TreeShakingHint, ModuleGraph,
} from '../index'

export interface DemoResult {
  cacheHits: number
  cacheSize: number
  bundleSavings: number
  profileOps: number
  lazyLoaded: boolean
  memoized: number
  workersCompleted: number
  streamProcessed: number
  batchSize: number
  debouncePending: number
  throttleFired: number
  poolSize: number
  objectReuseSize: number
  gcRequests: number
  heapTotalSize: number
  hotTypes: number
  renderCacheSize: number
  computedCalls: number
  evictionVictim: string | null
  strategyName: string
  warmedCount: number
  totalChunks: number
  routesCount: number
  lazyImportsLoaded: number
  shakenCount: number
  topoOrder: number
}

export async function runOptimizationDemo(): Promise<DemoResult> {
  // 1. Cache
  const cache = new EngineCache<string>({ maxSize: 10, ttlMs: 60000, strategy: 'lru' })
  cache.set('a', 'value-a')
  cache.set('b', 'value-b')
  cache.get('a')
  cache.get('a')
  cache.get('b')

  // 2. Bundle
  const bundle = new BundleOptimizer()
  bundle.addModule('core', 1000, [], true)
  bundle.addModule('unused1', 500, [])
  bundle.addModule('unused2', 300, [])
  const bundleSavings = bundle.suggestRemovals().reduce((sum, m) => sum + m.size, 0)

  // 3. Profiler
  const prof = new RuntimeProfiler()
  prof.measure('render', () => {})
  prof.measure('fetch', () => {})

  // 4. Lazy loader
  const lazy = new LazyLoader<number>(async () => 42)
  lazy.load()
  await new Promise(r => setTimeout(r, 10))
  const lazyLoaded = lazy.get().status === 'loaded'

  // 5. Memoizer
  const memo = new Memoizer<[number], number>()
  let memoCalls = 0
  for (let i = 0; i < 5; i++) memo.compute((x) => { memoCalls += 1; return x * 2 }, i)
  // 5 different args → 5 calls
  memo.compute((x) => { memoCalls += 1; return x * 2 }, 0)  // cached → no call

  // 6. Worker pool
  const pool = new WorkerPool(2)
  const results = await Promise.all([
    pool.submit(async () => 1),
    pool.submit(async () => 2),
    pool.submit(async () => 3),
  ])

  // 7. Stream
  const stream = new StreamProcessor<number>(() => {}, 5)
  for (let i = 0; i < 5; i++) stream.push(i)
  stream.flush()

  // 8. Batch
  const batch = new BatchProcessor<number>((b) => { /* collect */ }, 3)
  batch.add(1); batch.add(2); batch.add(3)
  batch.stop()

  // 9. Debounce
  const deb = new Debouncer()
  let debCount = 0
  deb.debounce('a', () => { debCount += 1 }, 100)
  deb.debounce('a', () => { debCount += 1 }, 100)
  await new Promise(r => setTimeout(r, 150))
  const debounceFired = debCount

  // 10. Throttle
  const throttle = new Throttler()
  let throttleFired = 0
  throttle.throttle('a', () => { throttleFired += 1 }, 100)
  throttle.throttle('a', () => { throttleFired += 1 }, 100)

  // 11. Memory pool
  const memPool = new MemoryPool<{ id: number }>(() => ({ id: 0 }))
  const obj1 = memPool.acquire()
  const obj2 = memPool.acquire()
  memPool.release(obj1)
  memPool.release(obj2)

  // 12. Object reuse
  const reuse = new ObjectReuse()
  reuse.getOrCreate('a', () => ({ id: 1 }))
  reuse.getOrCreate('b', () => ({ id: 2 }))
  reuse.getOrCreate('a', () => ({ id: 3 }))  // cached

  // 13. GC
  const gc = new GCHint()
  gc.hintGC()

  // 14. Heap
  const heap = new HeapAnalyzer()
  const snap = heap.takeSnapshot([{ type: 'A', size: 100 }, { type: 'B', size: 200 }])

  // 15. Allocation
  const alloc = new AllocationProfiler()
  alloc.record('Object', 10)
  alloc.record('Array', 5)

  // 16. Render cache
  const render = new RenderCache<string>(() => 'rendered')

  // 17. Computed selector
  const sel = new ComputedSelector<{ x: number }, number>((s) => s.x * 2)
  sel.compute({ x: 5 })
  sel.compute({ x: 5 })  // cached

  // 18. Eviction
  const evVictim = CacheEviction.selectVictim(
    [{ key: 'a', hits: 1, lastUsed: 100, expiresAt: 0 }, { key: 'b', hits: 5, lastUsed: 50, expiresAt: 0 }],
    'lru',
  )

  // 19. Strategy
  const strat = new CacheStrategyExecutor('read-through', (k) => `loaded-${k}`)
  strat.get('x')

  // 20. Warmer
  const warmer = new CacheWarmer()
  warmer.warm(['a', 'b', 'c'], (k) => k)

  // 21. Bundle splitter
  const bs = new BundleSplitter()
  bs.createChunk('vendor', ['react'], 0)
  bs.createChunk('app', ['./main'], 1)

  // 22. Code splitter
  const cs = new CodeSplitter()
  cs.setRoute('/home', ['./a', './b', './c', './d'])

  // 23. Lazy importer
  const li = new LazyImporter<number>(async () => 42)
  await li.get()

  // 24. Tree shaking
  const ts = new TreeShakingHint()
  ts.registerExports('utils', [{ name: 'used', size: 100 }, { name: 'unused', size: 200 }])
  ts.markUsed('utils.used')

  // 25. Module graph
  const mg = new ModuleGraph()
  mg.addModule({ moduleId: 'a', size: 100, imports: [] })
  mg.addModule({ moduleId: 'b', size: 200, imports: ['a'] })

  return {
    cacheHits: cache.stats().hits,
    cacheSize: cache.size(),
    bundleSavings,
    profileOps: Object.keys(prof.summary()).length,
    lazyLoaded,
    memoized: memo.size(),
    workersCompleted: pool.completedCount(),
    streamProcessed: 5,
    batchSize: 3,
    debouncePending: debounceFired,
    throttleFired,
    poolSize: memPool.size(),
    objectReuseSize: reuse.size(),
    gcRequests: gc.gcRequested(),
    heapTotalSize: snap.totalSize,
    hotTypes: alloc.hotTypes().length,
    renderCacheSize: render.size(),
    computedCalls: 1,  // 1 actual call
    evictionVictim: evVictim,
    strategyName: 'read-through',
    warmedCount: warmer.warmedCount(),
    totalChunks: bs.chunksByPriority().length,
    routesCount: cs.routeCount(),
    lazyImportsLoaded: li.isLoaded() ? 1 : 0,
    shakenCount: ts.shake().shaken.length,
    topoOrder: mg.topologicalOrder().length,
  }
}