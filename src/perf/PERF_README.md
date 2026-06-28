# Performance & Optimization (V3) — Direction S

**Version**: 1.0.0
**Engines**: V2866-V2895 (30 engines, 6 batches)
**Tests**: 81 tests, 100% pass

## 目标

性能优化与 bundle 优化：缓存、bundle 分析、运行时 profiling、worker 池、流/批处理、防抖节流、内存池、GC 提示、堆分析、tree shaking、模块图。

## 模块结构

| V# | File | 关键能力 |
|----|------|----------|
| S1-S10 | `Optimization.ts` | EngineCache (3 eviction policies) + BundleOptimizer + RuntimeProfiler + LazyLoader + Memoizer + WorkerPool + StreamProcessor + BatchProcessor + Debouncer + Throttler |
| S11-S25 | `OptimizationAdvanced.ts` | MemoryPool + ObjectReuse + GCHint + HeapAnalyzer + AllocationProfiler + RenderCache + ComputedSelector + CacheEviction (5 policies) + CacheStrategyExecutor (5 strategies) + CacheWarmer + BundleSplitter + CodeSplitter + LazyImporter + TreeShakingHint + ModuleGraph (cycle detection + topo sort) |
| S26 | `index.ts` + `demo/optimization-demo.ts` | 27 端到端断言 |
| S27 | `__tests__/optimization-integration.test.ts` | 10 集成测试 |
| S28 | `PERF_README.md` | 本文档 |
| S29 | 主 README 更新 | 验证命令 |
| S30 | 收口 commit + push | |

## 核心 API 示例

### 1. Engine Cache

```ts
import { EngineCache } from '@/perf'

const cache = new EngineCache<string>({ maxSize: 100, ttlMs: 60_000, strategy: 'lru' })
cache.set('user:42', 'Alice')
cache.get('user:42')  // 'Alice' (hit)
cache.stats()  // { hits: 1, misses: 0, hitRate: 1, size: 1 }
```

### 2. Bundle Optimizer

```ts
import { BundleOptimizer } from '@/perf'

const b = new BundleOptimizer()
b.addModule('core', 1000, [], true)  // entry
b.addModule('unused', 500, [])  // not used
b.unusedModules()  // ['unused']
b.suggestRemovals()  // [{ moduleId: 'unused', size: 500 }]
```

### 3. Worker Pool + Stream + Batch

```ts
import { WorkerPool, StreamProcessor, BatchProcessor, Debouncer, Throttler } from '@/perf'

const pool = new WorkerPool(4)
const r = await pool.submit(async () => fetch('/api/x'))

const stream = new StreamProcessor<number>((x) => console.log(x), 100)
stream.push(1); stream.push(2)

const batch = new BatchProcessor<number>(process, 10, 1000)
batch.add(item)

const deb = new Debouncer()
deb.debounce('search', () => search(), 300)

const thr = new Throttler()
thr.throttle('scroll', () => onScroll(), 100)
```

### 4. Memory + Profiling

```ts
import { MemoryPool, ObjectReuse, GCHint, HeapAnalyzer, AllocationProfiler } from '@/perf'

const pool = new MemoryPool(() => new ArrayBuffer(1024))
const buf = pool.acquire()
pool.release(buf)

const reuse = new ObjectReuse()
const vec = reuse.getOrCreate('default', () => ({ x: 0, y: 0 }))

const heap = new HeapAnalyzer()
const snap = heap.takeSnapshot([{ type: 'A', size: 100 }])

const alloc = new AllocationProfiler()
alloc.record('Object', 1000)
alloc.hotTypes()  // top 5 types by allocation
```

### 5. Cache Strategy + Eviction

```ts
import { CacheEviction, CacheStrategyExecutor, CacheWarmer } from '@/perf'

const victim = CacheEviction.selectVictim(candidates, 'lru')
const cs = new CacheStrategyExecutor('read-through', (k) => fetch(k))
const warmed = new CacheWarmer().warm(['a', 'b'], (k) => compute(k))
```

### 6. Bundle + Tree Shaking + Module Graph

```ts
import { BundleSplitter, CodeSplitter, LazyImporter, TreeShakingHint, ModuleGraph } from '@/perf'

const bs = new BundleSplitter()
bs.createChunk('vendor', ['react', 'lodash'], 0)
bs.createChunk('app', ['./main'], 1)

const ts = new TreeShakingHint()
ts.registerExports('utils', [{ name: 'used', size: 100 }, { name: 'unused', size: 200 }])
ts.markUsed('utils.used')
ts.shake().savedBytes  // 200

const mg = new ModuleGraph()
mg.addModule({ moduleId: 'a', size: 100, imports: ['b'] })
mg.addModule({ moduleId: 'b', size: 100, imports: [] })
mg.findCycles()  // []
mg.topologicalOrder()  // ['b', 'a']
```

## 验证命令

```bash
npx vitest run src/perf/  # 81 passed
npx vitest run src/perf/demo/optimization-demo.test.ts
npx vitest run src/perf/__tests__/optimization-integration.test.ts
```

## 灵感

- LRU/LFU cache algorithms
- Web Workers + Worker pools
- Webpack/Rollup tree shaking
- Web Vitals + performance profiling
- React.memo / Vue computed
- Debounce/Throttle patterns
- Streaming data processing
- Bundlephobia / Bundle analysis tools

## 累计

- Direction A-S: **755 engines / ~7,581 tests**
- 20 commits pushed
- 灵感: LRU/LFU + Web Workers + Webpack tree shaking + Web Vitals + React.memo