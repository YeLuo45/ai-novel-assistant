/**
 * perf/__tests__/optimization-integration.test.ts (S27)
 */

import { describe, it, expect } from 'vitest'
import {
  EngineCache, RuntimeProfiler, LazyLoader, Memoizer, WorkerPool,
  StreamProcessor, BatchProcessor, Debouncer, Throttler,
  MemoryPool, ObjectReuse, HeapAnalyzer, RenderCache, ComputedSelector,
  CacheEviction, CacheStrategyExecutor, CacheWarmer,
  BundleSplitter, CodeSplitter, LazyImporter, TreeShakingHint, ModuleGraph,
} from '../index'

describe('Optimization — end-to-end', () => {
  it('cache flow: set + get + evict + stats', () => {
    const c = new EngineCache<string>({ maxSize: 2, strategy: 'lru' })
    c.set('a', '1')
    c.set('b', '2')
    c.get('a')
    c.set('c', '3')  // evicts b
    expect(c.get('a')).toBe('1')
    expect(c.get('b')).toBeUndefined()
  })

  it('profiler measure + summary', () => {
    const p = new RuntimeProfiler()
    p.measure('op', () => {})
    expect(p.summary().op?.count).toBe(1)
  })

  it('lazy load + memoize', async () => {
    const l = new LazyLoader<number>(async () => 100)
    l.load()
    await new Promise(r => setTimeout(r, 5))
    expect(l.get().value).toBe(100)

    const m = new Memoizer<[number], number>()
    expect(m.compute((x) => x * 2, 5)).toBe(10)
    expect(m.compute((x) => x * 2, 5)).toBe(10)
  })

  it('worker pool + batch + debounce', async () => {
    const pool = new WorkerPool(3)
    const r = await pool.submit(async () => 'done')
    expect(r).toBe('done')

    const batch = new BatchProcessor<number>(() => {}, 2)
    batch.add(1); batch.add(2)  // triggers flush
    expect(batch.size()).toBe(0)

    const deb = new Debouncer()
    let calls = 0
    deb.debounce('k', () => { calls += 1 }, 10)
    await new Promise(r => setTimeout(r, 30))
    expect(calls).toBe(1)
  })

  it('memory pool + object reuse', () => {
    const pool = new MemoryPool<number[]>(() => [])
    const obj = pool.acquire()
    expect(obj.object).toEqual([])
    pool.release(obj)

    const reuse = new ObjectReuse()
    const a = reuse.getOrCreate('x', () => ({ id: 1 }))
    const b = reuse.getOrCreate('x', () => ({ id: 2 }))
    expect(a).toBe(b)
  })

  it('heap snapshot + diff', () => {
    const h = new HeapAnalyzer()
    const s1 = h.takeSnapshot([{ type: 'A', size: 100 }])
    const s2 = h.takeSnapshot([{ type: 'A', size: 150 }, { type: 'B', size: 50 }])
    const diff = h.diff(s1, s2)
    expect(diff.sizeDelta).toBe(100)
  })

  it('render cache + computed selector', () => {
    let renderCount = 0
    const rc = new RenderCache<string>(() => { renderCount += 1; return 'x' })
    rc.get('a'); rc.get('a')
    expect(renderCount).toBe(1)

    const cs = new ComputedSelector<{ x: number }, number>((s) => s.x)
    cs.compute({ x: 5 })
    cs.compute({ x: 5 })
    // 1 call total
  })

  it('eviction policies', () => {
    const cands = [
      { key: 'a', hits: 1, lastUsed: 100, expiresAt: 0 },
      { key: 'b', hits: 1, lastUsed: 50, expiresAt: 0 },
    ]
    expect(CacheEviction.selectVictim(cands, 'lru')).toBe('b')
    expect(CacheEviction.selectVictim(cands, 'fifo')).toBe('a')
  })

  it('cache strategies', () => {
    const cs = new CacheStrategyExecutor('cache-aside', (k) => `loaded-${k}`)
    expect(cs.get('x')).toBe('loaded-x')

    const w = new CacheWarmer()
    w.warm(['a', 'b'], (k) => k)
    expect(w.isWarmed('a')).toBe(true)
  })

  it('bundle split + code split + lazy import + tree shake + module graph', async () => {
    const bs = new BundleSplitter()
    bs.createChunk('vendor', ['react', 'lodash'])
    expect(bs.totalSize()).toBeGreaterThan(0)

    const cs = new CodeSplitter()
    cs.setRoute('/home', ['./Header', './Footer', './Content'])
    expect(cs.routeCount()).toBe(1)

    const li = new LazyImporter<number>(async () => 42)
    await li.get()
    expect(li.isLoaded()).toBe(true)

    const ts = new TreeShakingHint()
    ts.registerExports('m', [{ name: 'a', size: 100 }, { name: 'b', size: 200 }])
    ts.markUsed('m.a')
    expect(ts.shake().savedBytes).toBe(200)

    const mg = new ModuleGraph()
    mg.addModule({ moduleId: 'a', size: 100, imports: [] })
    mg.addModule({ moduleId: 'b', size: 200, imports: ['a'] })
    expect(mg.topologicalOrder().length).toBe(2)
  })
})